// =================================================================== FRANK: INPUT, WALKING, AIMING, SHOOTING, THE CAMERA
const INPUT = { keys: {}, pressed: {}, mx: W / 2, my: H / 2, mdown: false, clicks: 0, rclicks: 0, moved: 0 };
const PLAYER = { car: null, god: false, calm: 0, aimX: 0, aimY: 0, assist: null, lastFire: -999, prompt: '', stepD: 0, auto: null };
const STATS = { shots: 0, hits: 0, dmgDealt: 0, dmgTaken: 0, goonsDown: 0, runOver: 0, carsTaken: 0, chaseT: 0, fightT: 0, retries: 0 };
let FRANK = null;
function pressed(code) { if (INPUT.pressed[code]) { INPUT.pressed[code] = false; return true; } return false; }
function clearPressed() { for (const k in INPUT.pressed) INPUT.pressed[k] = false; INPUT.clicks = 0; INPUT.rclicks = 0; }
// the mouse points at the world at chest height (where you would click on a man)
function screenToWorld(px, py, z) { const a = (px + cam.x) / 16, b = (py + cam.y + z * 16) / 8; return [(a + b) / 2, (b - a) / 2]; }
function worldToScreen(x, y, z) { return [Math.round(isoX(x, y) - cam.x), Math.round(isoY(x, y, z) - cam.y)]; }
function enemiesNear(x, y, r) { return PEOPLE.filter(p => p.team === 'goons' && p.alive && p.visible && !p.inCar && Math.hypot(p.x - x, p.y - y) < r); }
function updateAim() {
  const [ax, ay] = screenToWorld(INPUT.mx, INPUT.my, 1.0);
  PLAYER.aimX = ax; PLAYER.aimY = ay;
  // aim assist: a goon whose chest is under the cursor, or the black sedan
  let best = null, bd = 14;
  for (const p of PEOPLE) {
    if (p.team !== 'goons' || !p.alive || !p.visible || p.inCar || p.down) continue;
    const [sx, sy] = worldToScreen(p.x, p.y, p.crouch ? 0.7 : 1.1), d = Math.hypot(sx - INPUT.mx, sy - INPUT.my);
    if (d < bd) { bd = d; best = p; }
  }
  if (!best && MISSION.sedan && !MISSION.sedan.gone) {
    const S = MISSION.sedan, [sx, sy] = worldToScreen(S.x, S.y, 0.8);
    if (Math.hypot(sx - INPUT.mx, sy - INPUT.my) < 30) best = S;
  }
  PLAYER.assist = best;
}
// F: the nearest goon Frank can see (or the sedan) - for playing without a mouse, and for the test driver
function autoTarget() {
  const from = PLAYER.car || FRANK, oz = PLAYER.car ? 1.3 : (FRANK.crouch ? 0.95 : 1.4);
  let best = null, bd = 30;
  for (const p of PEOPLE) {
    if (p.team !== 'goons' || !p.alive || !p.visible || p.inCar || p.down) continue;
    const d = Math.hypot(p.x - from.x, p.y - from.y); if (d >= bd) continue;
    const [tx, ty, tz] = aimPoint(from.x, from.y, oz, p, PLAYER.car);
    if (lineClear(from.x, from.y, oz, tx, ty, tz, PLAYER.car)) { bd = d; best = p; }
  }
  const S = MISSION.sedan;
  if (!best && S && !S.gone && !S.wreck && Math.hypot(S.x - from.x, S.y - from.y) < 28 && lineClear(from.x, from.y, oz, S.x, S.y, S.z + 0.8, PLAYER.car, S)) best = S;
  return best;
}
function frankFire(target) {
  const g = FRANK.gun; if (g.reload || g.cool > 0) return false;
  if (g.ammo <= 0) { if (startReload(g)) sfxAt('click', FRANK.x, FRANK.y); return false; }
  const car = PLAYER.car, T = target === undefined ? PLAYER.assist : target;
  let ox = FRANK.x, oy = FRANK.y, oz = FRANK.crouch ? 0.95 : 1.4, tx = PLAYER.aimX, ty = PLAYER.aimY, tz = 1.1;
  if (car) { ox = car.x; oy = car.y; oz = car.z + 1.25; }
  if (T && T.M) { tx = T.x; ty = T.y; tz = T.z + 0.8; }
  else if (T) { [tx, ty, tz] = aimPoint(ox, oy, oz, T, car); }
  const ang = Math.atan2(ty - oy, tx - ox), c = Math.cos(ang), s = Math.sin(ang);
  if (car) { const rel = ang - car.a, off = Math.min(car.M.hl / (Math.abs(Math.cos(rel)) + 1e-6), car.M.hw / (Math.abs(Math.sin(rel)) + 1e-6)) + 0.15; ox += c * off; oy += s * off; }   // out of the window on that side
  else { ox += c * 0.35; oy += s * 0.35; FRANK.dir = dirFromVec(c, s, FRANK.dir); }
  const spreadMul = (car ? 1.3 + vehSpeed(car) * 0.04 : (FRANK.moving ? 2 : 1) * (FRANK.crouch ? 0.8 : 1)) * (target ? 1.6 : 1);   // F: firing from the hip
  fireShot(FRANK, g, ox, oy, oz, tx, ty, tz, spreadMul, car);
  PLAYER.lastFire = tick;
  if (g.ammo <= 0) startReload(g);
  return true;
}
function playerTick() {
  const k = INPUT.keys;
  updateAim();
  gunTick(FRANK.gun);
  personPhysics(FRANK);
  if (!FRANK.alive) { FRANK.moving = false; return; }
  PLAYER.calm++;
  if (PLAYER.calm > 200 && FRANK.hp < FRANK.maxHp) FRANK.hp = Math.min(FRANK.maxHp, FRANK.hp + 12 * DT);
  if (MISSION.lockInput) { FRANK.moving = false; if (PLAYER.car) { PLAYER.car.thr = 0; PLAYER.car.brk = 0.5; PLAYER.car.steer = 0; } clearPressed(); return; }
  if (pressed('KeyR')) startReload(FRANK.gun) && sfxAt('click', FRANK.x, FRANK.y);
  const wantFire = INPUT.clicks > 0 || (INPUT.mdown && FRANK.gun.G.cool < 10) || k.KeyF;
  const fireTarget = k.KeyF ? autoTarget() : undefined;
  INPUT.clicks = 0;
  if (PLAYER.car) {
    const V = PLAYER.car;
    if (V.driver === 'frank') playerDrive(V);
    if (wantFire) frankFire(fireTarget);
    if (pressed('KeyE')) exitVehicle(false);
    PLAYER.prompt = V.fire === 1 ? 'GET OUT!  [E]' : '';
    return;
  }
  if (FRANK.down) { FRANK.moving = false; clearPressed(); return; }
  // walk: WASD in screen directions
  let mx = 0, my = 0;
  if (k.KeyW || k.ArrowUp) { mx -= 1; my -= 1; } if (k.KeyS || k.ArrowDown) { mx += 1; my += 1; }
  if (k.KeyA || k.ArrowLeft) { mx -= 1; my += 1; } if (k.KeyD || k.ArrowRight) { mx += 1; my -= 1; }
  if (pressed('KeyC') || INPUT.rclicks > 0) { FRANK.crouch = !FRANK.crouch; INPUT.rclicks = 0; }
  const fight = tick - PLAYER.lastFire < 120 || INPUT.mdown || enemiesNear(FRANK.x, FRANK.y, 24).length > 0;
  FRANK.aiming = fight ? 1 : 0;
  const m = Math.hypot(mx, my);
  if (m > 0) {
    const st = (FRANK.crouch ? 1.7 : fight ? 3.3 : 4.3) * DT, dx = mx / m * st, dy = my / m * st;
    FRANK.moving = movePerson(FRANK, dx, dy);
    if (FRANK.moving) { FRANK.dist += st; PLAYER.stepD += st; if (PLAYER.stepD > 0.75) { PLAYER.stepD = 0; sfx('step'); } }
    if (!fight) FRANK.dir = dirFromVec(mx, my, FRANK.dir);
  } else FRANK.moving = false;
  if (fight) FRANK.dir = dirFromVec(PLAYER.aimX - FRANK.x, PLAYER.aimY - FRANK.y, FRANK.dir);
  if (wantFire) frankFire(fireTarget);
  const V = enterableNear(FRANK.x, FRANK.y);
  PLAYER.prompt = V ? (V.driver === 'ai' ? 'E  TAKE HIS ' : 'E  TAKE THE ') + V.name : '';
  if (V && pressed('KeyE')) enterVehicle(V);
  pressed('KeyE');
}
// ------------------------------------------------------------------ camera: leads a moving car, clamped to the city
const CAMF = { x: 0, y: 0, snap: true, override: null };
function updateCam() {
  let tx, ty;
  if (CAMF.override) { tx = CAMF.override[0]; ty = CAMF.override[1]; }
  else if (PLAYER.car) {
    const V = PLAYER.car, lead = 0.55, S = MISSION.sedan;
    tx = V.x + clamp(V.vx * lead, -9, 9); ty = V.y + clamp(V.vy * lead, -9, 9);
    // in the chase, pull the frame toward the sedan when it is close enough to share the screen with
    if (S && !S.gone && MISSION.phase === 'chase' && Math.hypot(S.x - V.x, S.y - V.y) < 30) { tx = lerp(tx, (V.x + S.x) / 2, 0.5); ty = lerp(ty, (V.y + S.y) / 2, 0.5); }
    const sx = isoX(tx - V.x, ty - V.y), sy = isoY(tx - V.x, ty - V.y, 0), k = Math.max(1, Math.abs(sx) / 110, sy > 0 ? sy / 35 : -sy / 60);
    tx = V.x + (tx - V.x) / k; ty = V.y + (ty - V.y) / k;
  }
  else {
    // on foot: lean toward where he is aiming, and in a fight toward the men he is fighting
    tx = FRANK.x + clamp((PLAYER.aimX - FRANK.x) * 0.3, -5, 5); ty = FRANK.y + clamp((PLAYER.aimY - FRANK.y) * 0.3, -5, 5);
    const foes = enemiesNear(FRANK.x, FRANK.y, 26);
    if (foes.length) {
      let gx = 0, gy = 0; for (const p of foes) { gx += p.x; gy += p.y; } gx /= foes.length; gy /= foes.length;
      tx = lerp(tx, (FRANK.x + gx) / 2, 0.7); ty = lerp(ty, (FRANK.y + gy) / 2, 0.7);
    }
    // keep Frank himself well inside the frame (and clear of the HUD in the top corners): his feet stay within
    // x 40..240 and y 70..160 of the screen, so the camera may sit at most this far from him
    const sx = isoX(tx - FRANK.x, ty - FRANK.y), sy = isoY(tx - FRANK.x, ty - FRANK.y, 0);
    const k = Math.max(1, sx > 0 ? sx / 120 : -sx / 80, sy > 0 ? sy / 20 : -sy / 70);
    tx = FRANK.x + (tx - FRANK.x) / k; ty = FRANK.y + (ty - FRANK.y) / k;
  }
  if (CAMF.snap) { CAMF.x = tx; CAMF.y = ty; CAMF.snap = false; }
  const k = PLAYER.car ? 0.1 : 0.08;
  CAMF.x += (tx - CAMF.x) * k; CAMF.y += (ty - CAMF.y) * k;
  cam.x = clamp(isoX(CAMF.x, CAMF.y) - W / 2, CB[0] + 20, CB[2] - W - 20);
  cam.y = clamp(isoY(CAMF.x, CAMF.y, 0.8) - H / 2, CB[1] + 40, CB[3] - H - 10);
}
