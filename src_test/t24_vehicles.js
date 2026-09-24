// =================================================================== VEHICLES IN THE CITY: DAMAGE, FIRE, THE STREETCAR, TRAFFIC, GETTING IN
function damageVehicle(V, d, by) {
  if (V.kin || V.gone || V.wreck || d <= 0) return;
  if (V.god && V.hp - d < 1) d = Math.max(0, V.hp - 1);
  V.hp -= d; V.flash = Math.max(V.flash, 3); V.dmgLook = clamp(1 - V.hp / V.maxHp, 0, 1) * 0.35;
  if (by === 'frank') STATS.dmgDealt += d;
  if (V.onDamage) V.onDamage(d, by);
  if (V.hp <= 0 && !V.wreck) {
    V.hp = 0; V.wreck = true; V.lightsOn = false; V.signOn = false; V.thr = 0;
    if (V.noExplode) { V.smoke = 2; if (V.onDisabled) V.onDisabled(); }
    else { V.fire = 1; V.burnT = 300; }
    if (V.ai && V.ai.mode === 'traffic') bailDriver(V);
  }
  if (V.headOut === false && d > 12 && rnd() < 0.3) V.headOut = true;
}
// the car goes up: people and cars nearby are hurt and thrown
function explodeVehicle(V) {
  V.fire = 2; V.burnT = 480; V.lut = carLut(PAINTS.burnt, PAINTS.burnt, C.INK); V.dmgLook = 0;
  fxExplosion(V.x, V.y, 0.8);
  sfxAt('boom', V.x, V.y);
  shake(10);
  for (const p of PEOPLE) {
    if (p.alive === false || !p.visible) continue;
    const d = Math.hypot(p.x - V.x, p.y - V.y); if (d > 5.5) continue;
    hurtPerson(p, (5.5 - d) * 22, 'blast', (p.x - V.x) / (d + 0.1), (p.y - V.y) / (d + 0.1));
  }
  if (V.driver === 'frank') hurtPerson(FRANK, 200, 'blast', 0, 0);
  for (const O of VEH) {
    if (O === V || O.gone) continue;
    const d = Math.hypot(O.x - V.x, O.y - V.y); if (d > 7) continue;
    if (!O.kin) { const k = (7 - d) * 2.2 / (d + 0.5); O.vx += (O.x - V.x) * k; O.vy += (O.y - V.y) * k; O.w += (rnd() - 0.5) * 2; }
    damageVehicle(O, (7 - d) * 9, 'blast');
  }
  V.vx += (rnd() - 0.5) * 2; V.vy += (rnd() - 0.5) * 2; V.w += (rnd() - 0.5) * 3; V.bob = 0.6;
}
function vehicleTick(V) {
  if (V.gone) return;
  if (V.fire === 1 && --V.burnT <= 0) explodeVehicle(V);
  else if (V.fire === 2 && V.burnT > 0) V.burnT--;
  if (V.horn > 0) { if (V.horn % 40 === 39) sfxAt('horn', V.x, V.y); V.horn--; }
  if (V.kin) tramTick(V);
  else if (V.ai && V.driver !== 'frank') {
    trafficUpdate(V); aiDrive(V);
    if (V.ai && V.ai.fails >= 3 && offScreen(V.x, V.y)) aiRescue(V);
  }
  if (V.sinking && V.driver === 'frank' && V.z < -1.2) {
    exitVehicle(true);
    if (surfAt(FRANK.x, FRANK.y) !== 2) { FXQ.push({ k: 'splash', x: FRANK.x, y: FRANK.y }); say('Frank', ['Cold. Very cold.', 'That was a perfectly good car.'][STATS.carsTaken % 2]); }
  }
}
// ------------------------------------------------------------------ the streetcar: back and forth along the rails of the first avenue
const TRAM = { y0: 18, y1: 70, speed: 7 };
function tramTick(V) {
  const s = V.tram;
  if (s.wait > 0) { s.wait--; V.vx = V.vy = 0; if (s.wait === 0) { s.dir = -s.dir; V.a = s.dir > 0 ? Math.PI / 2 : Math.PI * 1.5; sfxAt('bell', V.x, V.y); } return; }
  // anything on the rails ahead stops it (for a while; then it pushes through, it weighs 17 tons)
  const [od] = aiObstacle(V, 7, 0.1), push = s.blocked >= 240;
  if (od < 6 && !push) { s.blocked++; s.v = Math.max(0, s.v - 12 * DT); if (s.blocked === 20) sfxAt('bell', V.x, V.y); }
  else if (od < 6) { s.v = Math.min(1.2, s.v + 1.5 * DT); if (tick % 90 === 0) sfxAt('bell', V.x, V.y); }    // shoving it down the line
  else { s.blocked = push ? 0 : Math.max(0, s.blocked - 1); s.v = Math.min(TRAM.speed, s.v + 1.5 * DT); }
  const end = s.dir > 0 ? TRAM.y1 : TRAM.y0, left = (end - V.y) * s.dir;
  if (left < 0.1) { s.wait = 240; s.v = 0; V.vy = 0; return; }
  const v = Math.min(s.v, Math.sqrt(2 * 1.2 * Math.max(0, left)) + 0.3);
  V.vx = 0; V.vy = v * s.dir; V.x = AV[1];
  V.braking = v < s.v - 0.1 || s.blocked > 0;
}
function spawnTram(y, dir) {
  const V = makeVehicle('tram', AV[1], y, dir > 0 ? Math.PI / 2 : Math.PI * 1.5, 'green', 'cream');
  V.tram = { dir, v: TRAM.speed, wait: 0, blocked: 0 }; V.name = 'STREETCAR';
  return V;
}
// ------------------------------------------------------------------ parked cars (any of them can be taken) and traffic
const PARKED = [
  // [model, x, y, heading, paint, paint2]   parked on the right-hand kerb, facing the traffic
  ['coupe', 39.2, 67, Math.PI / 2, 'red', 'cream'], ['taxi', 48.8, 60, Math.PI * 1.5, 'yellow', 'cream'], ['sedan', 48.8, 68.5, Math.PI * 1.5, 'oxblood'],
  ['van', 21, 39.2, Math.PI, 'cream', 'cream'], ['coupe', 66, 48.8, 0, 'teal', 'cream'], ['sedan', 73, 82.8, 0, 'cream', 'tan'],
  ['taxi', 82.8, 30, Math.PI * 1.5, 'yellow', 'cream'], ['sedan', 107.2, 25, Math.PI / 2, 'navy'], ['coupe', 95, 5.2, Math.PI, 'yellow', 'black'],
  ['sedan', 90.5, 63.3, Math.PI, 'green', 'cream'], ['van', 5.2, 60, Math.PI / 2, 'steel', 'cream'], ['coupe', 116.8, 55, Math.PI * 1.5, 'oxblood', 'cream']
];
function spawnParked() {
  for (const [m, x, y, a, p1, p2] of PARKED) { const V = makeVehicle(m, x, y, a, p1, p2, { parked: true }); V.lightsOn = false; V.signOn = false; }
}
const TRAFFIC_START = [[1, 4], [4, 7], [7, 10], [10, 9], [5, 2], [3, 0], [8, 5], [6, 3]];
const TRAFFIC_PAINT = [['sedan', 'cream', 'tan'], ['taxi', 'yellow', 'cream'], ['coupe', 'teal', 'cream'], ['sedan', 'navy'], ['van', 'cream', 'cream'], ['sedan', 'steel'], ['coupe', 'green', 'cream']];
function spawnTraffic(n, avoid) {
  let made = 0;
  for (let k = 0; k < TRAFFIC_START.length && made < n; k++) {
    const [n0, n1] = TRAFFIC_START[(k + (avoid || 0)) % TRAFFIC_START.length], a = nodeXY(n0), b = nodeXY(n1);
    const dx = Math.sign(b[0] - a[0]), dy = Math.sign(b[1] - a[1]), o = laneOffset(dx, dy);
    const x = (a[0] + b[0]) / 2 + o[0], y = (a[1] + b[1]) / 2 + o[1];
    if (avoid !== undefined && Math.hypot(x - FRANK.x, y - FRANK.y) < 25) continue;
    const [m, p1, p2] = TRAFFIC_PAINT[made % TRAFFIC_PAINT.length];
    const V = makeVehicle(m, x, y, Math.atan2(dy, dx), p1, p2);
    trafficInit(V, n0, n1); V.driver = 'ai';
    const f = V.ai.cruise * 0.7; V.vx = dx * f; V.vy = dy * f;
    made++;
  }
}
// the driver of a car Frank takes (or one that is burning) gets out and runs
function bailDriver(V) {
  if (!V.ai || V.driver !== 'ai') return;
  const side = doorPoint(V, V.ai.mode === 'traffic' ? -1 : 1);
  V.ai = null; V.driver = null; V.thr = 0; V.brk = 0; V.hand = 1;
  spawnCivilian(side[0], side[1], true);
}
// ------------------------------------------------------------------ getting in and out
function doorPoint(V, side) {                             // side -1: the driver's (left) side
  const c = Math.cos(V.a), s = Math.sin(V.a), off = V.M.hw + 0.55;
  return [V.x + s * off * -side - c * 0.3, V.y - c * off * -side - s * 0.3];
}
function distToVehicle(V, x, y) {
  const c = Math.cos(V.a), s = Math.sin(V.a), dx = x - V.x, dy = y - V.y, u = dx * c + dy * s, v = -dx * s + dy * c;
  return Math.hypot(Math.max(0, Math.abs(u) - V.M.hl), Math.max(0, Math.abs(v) - V.M.hw));
}
function enterableNear(x, y) {
  let best = null, bd = 1.4;
  for (const V of VEH) {
    if (V.gone || V.kin || V.fire || V.sinking || V.noEnter || V.driver === 'goons') continue;
    if (V.driver === 'ai' && vehSpeed(V) > 3) continue;
    const d = distToVehicle(V, x, y); if (d < bd) { bd = d; best = V; }
  }
  return best;
}
function enterVehicle(V) {
  if (V.driver === 'ai') bailDriver(V);
  V.driver = 'frank'; V.parked = false; V.ai = null; V.lightsOn = true; V.xray = C.CREAM; V.topMul = 1; V.god = PLAYER.god;
  FRANK.inCar = V; FRANK.visible = false; FRANK.crouch = false;
  PLAYER.car = V; STATS.carsTaken++;
  sfx('door');
  if (MISSION.onEnter) MISSION.onEnter(V);
}
function exitVehicle(force) {
  const V = PLAYER.car; if (!V) return false;
  if (!force && vehSpeed(V) > 4) return false;
  let spot = null;
  for (const side of [-1, 1]) { const p = doorPoint(V, side); if (personFree(p[0], p[1], 0.3) && surfAt(p[0], p[1]) !== 2) { spot = p; break; } }
  if (!spot) { const c = Math.cos(V.a), s = Math.sin(V.a); for (const k of [1, -1]) { const p = [V.x + c * (V.M.hl + 0.6) * k, V.y + s * (V.M.hl + 0.6) * k]; if (personFree(p[0], p[1], 0.3)) { spot = p; break; } } }
  if (!spot) { if (!force) return false; spot = V.sinking ? landNear(V.x, V.y) : doorPoint(V, -1); }     // out of the water: swim for the quay
  V.driver = null; V.thr = 0; V.brk = 0; V.hand = 1; V.steer = 0; V.xray = 0;
  FRANK.inCar = null; FRANK.visible = true; FRANK.x = spot[0]; FRANK.y = spot[1]; FRANK.vx = V.vx * 0.3; FRANK.vy = V.vy * 0.3;
  PLAYER.car = null;
  sfx('door');
  return true;
}
// keyboard driving: the wheel comes round gradually and centres itself
function playerDrive(V) {
  const k = INPUT.keys, fwd = vehFwd(V);
  const up = k.KeyW || k.ArrowUp, down = k.KeyS || k.ArrowDown, left = k.KeyA || k.ArrowLeft, right = k.KeyD || k.ArrowRight;
  const want = (right ? 1 : 0) - (left ? 1 : 0);
  V.steer = want ? clamp(V.steer + want * 5 * DT, -1, 1) : V.steer * (1 - Math.min(1, 9 * DT));
  V.thr = up ? 1 : 0;                                     // throttle while rolling backwards brakes (driveStep)
  V.brk = down ? 1 : 0;
  V.hand = k.Space ? 1 : 0;
  if (fwd < -0.5 && !down) V.brk = 0;
  if (k.KeyH && V.horn <= 0) V.horn = 40;
  if (V.wreck || V.sinking) { V.thr = 0; }
}
