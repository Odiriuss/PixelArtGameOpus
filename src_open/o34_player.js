// =================================================================== FRANK: INPUT, WALKING, DRAWING A GUN, SHOOTING, THE CAMERA
const INPUT = { keys: {}, pressed: {}, mx: W / 2, my: H / 2, mdown: false, rdown: false, clicks: 0, rclicks: 0, moved: 0, wheel: 0 };
const PLAYER = { car: null, lastCar: null, god: false, calm: 0, aimX: 0, aimY: 0, assist: null, lastFire: -999, prompt: '', stepD: 0,
  slot: 0, drawn: false, drawT: 0, run: false, throwT: 0, fade: 0, fadeTo: 0, pending: null, busy: null };
const STATS = { shots: 0, hits: 0, dmgDealt: 0, dmgTaken: 0, goonsDown: 0, runOver: 0, carsTaken: 0, retries: 0, takedowns: 0, lampsOut: 0, earned: 0, spent: 0, jobs: 0 };
let FRANK = null;
function pressed(code) { if (INPUT.pressed[code]) { INPUT.pressed[code] = false; return true; } return false; }
function clearPressed() { for (const k in INPUT.pressed) INPUT.pressed[k] = false; INPUT.clicks = 0; INPUT.rclicks = 0; INPUT.wheel = 0; }
// the mouse points at the world at chest height on the floor Frank stands on (the mouse is in HUD pixels; the zoom maps them)
function screenToWorld(px, py, z) { const [wx, wy] = fromHud(px, py), a = (wx + cam.x) / 16, b = (wy + cam.y + z * 16) / 8; return [(a + b) / 2, (b - a) / 2]; }
function worldToScreen(x, y, z) { const [ux, uy] = toHud(isoX(x, y) - cam.x, isoY(x, y, z) - cam.y); return [Math.round(ux), Math.round(uy)]; }
// who Frank is fighting: the mob, and the law once it is after him
function hostile(p) { return p.alive && (p.team === 'goons' ? (p.ai ? p.ai.hostile !== false : true) : p.team === 'law' ? LAW.heat >= 2 : false); }
function enemiesNear(x, y, r) { return PEOPLE.filter(p => hostile(p) && p.visible && !p.inCar && !p.down && p.ai && p.ai.aware >= AW.ALERT && Math.hypot(p.x - x, p.y - y) < r); }
function updateAim() {
  const fz = FRANK.z;
  const [ax, ay] = screenToWorld(INPUT.mx, INPUT.my, fz + 1.0);
  PLAYER.aimX = ax; PLAYER.aimY = ay;
  let best = null, bd = 14;
  if (PLAYER.drawn) for (const p of PEOPLE) {
    if (p === FRANK || !p.alive || !p.visible || p.inCar || p.down || Math.abs(p.z - fz) > 1 || !personShown(p)) continue;
    const [sx, sy] = worldToScreen(p.x, p.y, p.z + (p.crouch ? 0.7 : 1.1)), d = Math.hypot(sx - INPUT.mx, sy - INPUT.my);
    if (d < bd) { bd = d; best = p; }
  }
  PLAYER.assist = best;
}
function autoTarget() {
  const from = PLAYER.car || FRANK, oz = PLAYER.car ? 1.3 : FRANK.z + (FRANK.crouch ? 0.95 : 1.4);
  let best = null, bd = 30;
  for (const p of PEOPLE) {
    if (!hostile(p) || !p.visible || p.inCar || p.down || Math.abs(p.z - FRANK.z) > 1) continue;
    const d = Math.hypot(p.x - from.x, p.y - from.y); if (d >= bd) continue;
    const [tx, ty, tz] = aimPoint(from.x, from.y, oz, p, PLAYER.car);
    if (lineClear(from.x, from.y, oz, tx, ty, tz, PLAYER.car, null, FRANK.z)) { bd = d; best = p; }
  }
  return best;
}
// ------------------------------------------------------------------ the gun in his hand
function drawWeapon(slot) {
  const it = INV.quick[slot];
  if (!it) { toast('Nothing in slot ' + (slot + 1) + '.'); return; }
  const I = ITEMS[it.key];
  if (I.cat !== 'weapon') { useItem(it); return; }
  if (PLAYER.slot === slot && PLAYER.drawn) { holster(); return; }
  PLAYER.slot = slot; PLAYER.drawn = true; PLAYER.drawT = Math.round(18 * PSTAT.drawMul);
  sfxF('holster'); frankArm();
  if (!FRANK.B || !FRANK.B.zone) witnessAct('brandish', FRANK.x, FRANK.y);
}
function holster() { if (!PLAYER.drawn) return; PLAYER.drawn = false; sfxF('holster'); frankArm(); }
function frankFire(target) {
  const g = FRANK.gun, G = g.G;
  if (PLAYER.drawT > 0) return false;
  if (G.kind === 'melee') { const q = swing(FRANK, g); PLAYER.lastFire = tick; if (q && q.team !== 'goons') witnessAct('assault', FRANK.x, FRANK.y); return !!q; }
  if (G.kind === 'throw') return throwItem(target);
  if (g.reload || g.cool > 0) return false;
  if (g.ammo <= 0) { if (startReload(g)) sfxAt('click', FRANK.x, FRANK.y); else if (g.cool <= 0) { sfxAt('click', FRANK.x, FRANK.y); g.cool = 20; toast('Out of ' + ITEMS[G.ammo].name.toLowerCase() + '.'); } return false; }
  const car = PLAYER.car, T = target === undefined ? PLAYER.assist : target;
  let ox = FRANK.x, oy = FRANK.y, oz = FRANK.z + (FRANK.crouch ? 0.95 : 1.4), tx = PLAYER.aimX, ty = PLAYER.aimY, tz = FRANK.z + 1.1;
  if (car) { ox = car.x; oy = car.y; oz = car.z + 1.25; }
  if (T && T.M) { tx = T.x; ty = T.y; tz = T.z + 0.8; }
  else if (T) { [tx, ty, tz] = aimPoint(ox, oy, oz, T, car); }
  const ang = Math.atan2(ty - oy, tx - ox), c = Math.cos(ang), s = Math.sin(ang);
  if (car) { const rel = ang - car.a, off = Math.min(car.M.hl / (Math.abs(Math.cos(rel)) + 1e-6), car.M.hw / (Math.abs(Math.sin(rel)) + 1e-6)) + 0.15; ox += c * off; oy += s * off; }
  else { ox += c * 0.35; oy += s * 0.35; FRANK.dir = dirFromVec(c, s, FRANK.dir); FRANK.faceX = c; FRANK.faceY = s; }
  const drunk = FRANK.drunk > 0 ? 1.4 : 1;
  const spreadMul = (car ? 1.3 + vehSpeed(car) * 0.04 : (FRANK.moving ? 2 : 1) * (FRANK.crouch ? 0.8 : 1)) * (target ? 1.6 : 1) * drunk;
  fireShot(FRANK, g, ox, oy, oz, tx, ty, tz, spreadMul, car);
  PLAYER.lastFire = tick;
  witnessAct('shooting', FRANK.x, FRANK.y);
  if (g.ammo <= 0) startReload(g);
  return true;
}
// ------------------------------------------------------------------ one tick of Frank
function playerTick() {
  const k = INPUT.keys;
  updateAim();
  gunTick(FRANK.gun);
  personPhysics(FRANK);
  if (FRANK.drunk > 0) FRANK.drunk--;
  if (PLAYER.drawT > 0) PLAYER.drawT--;
  if (!FRANK.alive) { FRANK.moving = false; return; }
  PLAYER.calm++;
  if (PLAYER.calm > 300 && FRANK.hp < FRANK.maxHp * 0.5) FRANK.hp = Math.min(FRANK.maxHp * 0.5, FRANK.hp + 4 * DT);     // a scratch heals; a wound needs a bandage
  if (PLAYER.busy) { busyTick(); clearPressed(); return; }
  if (pressed('KeyR')) { if (startReload(FRANK.gun)) sfxAt('click', FRANK.x, FRANK.y); }
  for (let s = 0; s < 5; s++) if (pressed('Digit' + (s + 1))) drawWeapon(s);
  if (pressed('KeyX')) holster();
  if (INPUT.wheel) { cycleWeapon(Math.sign(INPUT.wheel)); INPUT.wheel = 0; }
  if (pressed('KeyG')) quickThrow();
  if (!PLAYER.car && pressed('KeyL')) { if (INV.bag.some(e => e.it.key === 'flashlight')) { FRANK.torch = !FRANK.torch; sfxAt('click', FRANK.x, FRANK.y); } else toast('You have no flashlight.'); }
  const auto = FRANK.gun.G.auto;
  let wantFire = INPUT.clicks > 0 || (INPUT.mdown && auto) || k.KeyF;
  if (wantFire && !PLAYER.drawn && !PLAYER.car) { if (INV.quick[PLAYER.slot < 0 ? 0 : PLAYER.slot] || INV.quick[0]) drawWeapon(PLAYER.slot < 0 || !INV.quick[PLAYER.slot] ? firstWeaponSlot() : PLAYER.slot); else { PLAYER.drawn = true; frankArm(); } wantFire = false; }
  const fireTarget = k.KeyF ? autoTarget() : undefined;
  INPUT.clicks = 0;
  if (PLAYER.car) {
    const V = PLAYER.car;
    if (V.driver === 'frank') playerDrive(V);
    if (wantFire && FRANK.gun.G.kind === 'gun') frankFire(fireTarget);
    if (pressed('KeyE')) exitVehicle(false);
    PLAYER.prompt = V.fire === 1 ? 'GET OUT!  [E]' : '';
    return;
  }
  if (FRANK.down) { FRANK.moving = false; clearPressed(); return; }
  let mx = 0, my = 0;
  if (k.KeyW || k.ArrowUp) { mx -= 1; my -= 1; } if (k.KeyS || k.ArrowDown) { mx += 1; my += 1; }
  if (k.KeyA || k.ArrowLeft) { mx -= 1; my += 1; } if (k.KeyD || k.ArrowRight) { mx += 1; my -= 1; }
  if (pressed('KeyC') || INPUT.rclicks > 0) { FRANK.crouch = !FRANK.crouch; INPUT.rclicks = 0; }
  PLAYER.run = !!(k.ShiftLeft || k.ShiftRight) && !FRANK.crouch;
  const fight = PLAYER.drawn && (tick - PLAYER.lastFire < 120 || INPUT.mdown || enemiesNear(FRANK.x, FRANK.y, 24).length > 0);
  FRANK.aiming = PLAYER.drawn && FRANK.gun.G.kind === 'gun' ? 1 : 0;
  const m = Math.hypot(mx, my);
  if (m > 0) {
    const base = FRANK.crouch ? 1.7 : PLAYER.run ? 6.2 : fight ? 3.3 : 4.3, st = base * PSTAT.speedMul * DT, dx = mx / m * st, dy = my / m * st;
    FRANK.moving = movePerson(FRANK, dx, dy);
    if (FRANK.moving) {
      FRANK.dist += st; PLAYER.stepD += st;
      if (PLAYER.stepD > (PLAYER.run ? 0.9 : 0.75)) { PLAYER.stepD = 0; if (!FRANK.crouch) { sfx('step'); stepNoise(); } }
    }
    if (!FRANK.aiming) { FRANK.dir = dirFromVec(mx, my, FRANK.dir); FRANK.faceX = mx / m; FRANK.faceY = my / m; }
  } else FRANK.moving = false;
  if (FRANK.aiming) { const ax = PLAYER.aimX - FRANK.x, ay = PLAYER.aimY - FRANK.y, al = Math.hypot(ax, ay) || 1; FRANK.dir = dirFromVec(ax, ay, FRANK.dir); FRANK.faceX = ax / al; FRANK.faceY = ay / al; }
  if (wantFire) frankFire(fireTarget);
  interactTick();
}
function firstWeaponSlot() { for (let s = 0; s < 4; s++) if (INV.quick[s]) return s; return 0; }
function cycleWeapon(d) {
  const has = [0, 1, 2, 3].filter(s => INV.quick[s]);
  if (!has.length) return;
  const i = has.indexOf(PLAYER.slot), n = has[((i < 0 ? 0 : i + d) % has.length + has.length) % has.length];
  drawWeapon(n);
}
// footsteps are noise: running is loud, crepe soles are quiet, a marble floor is not
function stepNoise() {
  const hard = FRANK.F && (FRANK.B.enter === 'bank' || FRANK.B.enter === 'hotel') ? 1.4 : 1;
  const r = (PLAYER.run ? 9 : 3.5) * PSTAT.noiseMul * hard;
  makeNoise(FRANK.x, FRANK.y, r, FRANK.B);
}
// ------------------------------------------------------------------ throwing: an arc to the cursor, a fuse or a flame at the end of it
const THROWN = [];
function quickThrow() { const it = INV.equip.throw; if (!it) { toast('Nothing to throw.'); return; } PLAYER.slot = 3; PLAYER.drawn = true; frankArm(); throwItem(); }
function throwItem() {
  const it = INV.quick[3]; if (!it || !INV.equip.throw) return false;
  if (tick - PLAYER.throwT < 50) return false;
  PLAYER.throwT = tick;
  const I = ITEMS[it.key], tx = PLAYER.aimX, ty = PLAYER.aimY, d = Math.min(14, Math.hypot(tx - FRANK.x, ty - FRANK.y)), a = Math.atan2(ty - FRANK.y, tx - FRANK.x);
  const T = 0.5 + d * 0.06;
  THROWN.push({ key: it.key, x: FRANK.x, y: FRANK.y, z: FRANK.z + 1.5, vx: Math.cos(a) * d / T, vy: Math.sin(a) * d / T, vz: 4.9 * T - 1.3 / T, fz: FRANK.z, F: FRANK.F, fuse: I.gun === 'dynamite' ? GUNS.dynamite.fuse : 0, t: 0 });
  sfxF('swish');
  it.n--; if (it.n <= 0) { INV.equip.throw = null; autoQuick(); }
  witnessAct('shooting', FRANK.x, FRANK.y);
  return true;
}
function thrownTick() {
  for (let i = THROWN.length - 1; i >= 0; i--) {
    const o = THROWN[i]; o.t++;
    if (!o.landed) {
      o.vz -= 9.8 * DT; const nx = o.x + o.vx * DT, ny = o.y + o.vy * DT, nz = o.z + o.vz * DT;
      if (blockedAt(nx, ny, 0.05, o.fz, null) && nz < o.fz + 2.5) { o.vx *= -0.3; o.vy *= -0.3; }
      else { o.x = nx; o.y = ny; }
      o.z = nz;
      const gz = o.F ? o.fz + (o.F.f === 0 ? 0.15 : 0) : groundZ(o.x, o.y);
      if (o.z <= gz) { o.z = gz; o.landed = true; if (o.key === 'molotov') { fireAt(o.x, o.y, o.fz, o.F); THROWN.splice(i, 1); continue; } sfxAt('clunk', o.x, o.y); }
    }
    if (o.fuse && --o.fuse <= 0) { blastAt(o.x, o.y, o.fz, o.F); THROWN.splice(i, 1); continue; }
    if (o.fuse && tick % 3 === 0) part('spark', o.x, o.y, o.z + 0.2, (rnd() - 0.5), (rnd() - 0.5), 1.5, 8, C.HOT);
  }
}
// ------------------------------------------------------------------ the camera: leads a moving car, follows Frank up the stairs
const CAMF = { x: 0, y: 0, z: 0, snap: true, override: null };
function updateCam() {
  let tx, ty, tz = FRANK && !FRANK.inCar ? FRANK.z : 0;
  const f = VW / UW;                                              // a wider view leads further
  if (CAMF.override) { tx = CAMF.override[0]; ty = CAMF.override[1]; }
  else if (PLAYER.car) {
    const V = PLAYER.car, lead = 0.55 * f;
    tx = V.x + clamp(V.vx * lead, -9 * f, 9 * f); ty = V.y + clamp(V.vy * lead, -9 * f, 9 * f);
    const sx = isoX(tx - V.x, ty - V.y), sy = isoY(tx - V.x, ty - V.y, 0), k = Math.max(1, Math.abs(sx) / (110 * f), sy > 0 ? sy / (35 * f) : -sy / (60 * f));
    tx = V.x + (tx - V.x) / k; ty = V.y + (ty - V.y) / k;
  } else {
    const lean = PLAYER.drawn ? 0.3 : 0.12;
    tx = FRANK.x + clamp((PLAYER.aimX - FRANK.x) * lean, -5, 5); ty = FRANK.y + clamp((PLAYER.aimY - FRANK.y) * lean, -5, 5);
    const foes = enemiesNear(FRANK.x, FRANK.y, 26);
    if (foes.length) {
      let gx = 0, gy = 0; for (const p of foes) { gx += p.x; gy += p.y; } gx /= foes.length; gy /= foes.length;
      tx = lerp(tx, (FRANK.x + gx) / 2, 0.7); ty = lerp(ty, (FRANK.y + gy) / 2, 0.7);
    }
    const sx = isoX(tx - FRANK.x, ty - FRANK.y), sy = isoY(tx - FRANK.x, ty - FRANK.y, 0);
    const k = Math.max(1, sx > 0 ? sx / (120 * f) : -sx / (80 * f), sy > 0 ? sy / (20 * f) : -sy / (70 * f));
    tx = FRANK.x + (tx - FRANK.x) / k; ty = FRANK.y + (ty - FRANK.y) / k;
  }
  if (CAMF.snap) { CAMF.x = tx; CAMF.y = ty; CAMF.z = tz; CAMF.snap = false; }
  const k = PLAYER.car ? 0.1 : 0.08;
  CAMF.x += (tx - CAMF.x) * k; CAMF.y += (ty - CAMF.y) * k; CAMF.z += (tz - CAMF.z) * 0.15;
  cam.x = clamp(isoX(CAMF.x, CAMF.y) - VW / 2, CB[0] + 20, CB[2] - VW - 20);
  cam.y = clamp(isoY(CAMF.x, CAMF.y, CAMF.z + 0.8) - VH / 2, CB[1] + 10, CB[3] - VH - 10);
}
