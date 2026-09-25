// =================================================================== VEHICLES: DAMAGE, FIRE, THE STREETCAR, PARKED CARS, TRAFFIC THAT COMES AND GOES, GETTING IN
// Traffic is kept around the player: cars are sent into the streets out of sight ahead and taken off the map when
// they are far away and out of sight. More in the day, fewer at night. Parked cars stay where they are.
CAR_MODELS.police = Object.assign({}, CAR_MODELS.sedan, { sign: -0.35, twoTone: true, whitewall: false, top: 19, acc: 5.0, hp: 150, label: 'PATROL CAR' });
function damageVehicle(V, d, by) {
  if (V.kin || V.gone || V.wreck || d <= 0) return;
  if (V.god && V.hp - d < 1) d = Math.max(0, V.hp - 1);
  V.hp -= d; V.flash = Math.max(V.flash, 3); V.dmgLook = clamp(1 - V.hp / V.maxHp, 0, 1) * 0.35;
  if (by === 'frank') { STATS.dmgDealt += d; if (V.onDamage) V.onDamage(d, by); crimeAt('vandal', V.x, V.y, V); }
  else if (V.onDamage) V.onDamage(d, by);
  if (V.hp <= 0 && !V.wreck) {
    V.hp = 0; V.wreck = true; V.lightsOn = false; V.signOn = false; V.siren = false; V.thr = 0;
    if (V.noExplode) { V.smoke = 2; if (V.onDisabled) V.onDisabled(); }
    else { V.fire = 1; V.burnT = 300; }
    if (V.ai && (V.ai.mode === 'traffic' || V.ai.mode === 'patrol')) bailDriver(V);
  }
  if (V.headOut === false && d > 12 && rnd() < 0.3) V.headOut = true;
}
function explodeVehicle(V) {
  V.fire = 2; V.burnT = 480; V.lut = carLut(PAINTS.burnt, PAINTS.burnt, C.INK); V.dmgLook = 0;
  fxExplosion(V.x, V.y, 0.8); sfxAt('boom', V.x, V.y); shake(10); makeNoise(V.x, V.y, 40);
  for (const p of PEOPLE) {
    if (p.alive === false || !p.visible || p.B) continue;
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
    trafficUpdate(V); if (V.ai && V.ai.mode === 'patrol') patrolUpdate(V); aiDrive(V);
    if (V.ai && V.ai.fails >= 3 && offScreen(V.x, V.y)) aiRescue(V);
  }
  if (V.driver !== 'frank' && !V.kin && !V.wreck) V.lightsOn = V.driver ? LP.out.night > 0.3 : false;
  if (V.sinking && V.driver === 'frank' && V.z < -1.2) {
    exitVehicle(true);
    if (surfAt(FRANK.x, FRANK.y) !== 2) { FXQ.push({ k: 'splash', x: FRANK.x, y: FRANK.y }); say('Frank', ['Cold. Very cold.', 'That was a perfectly good car.'][STATS.carsTaken % 2]); }
  }
}
// ------------------------------------------------------------------ the streetcar: up and down Meridian Avenue
const TRAM = { y0: -16, y1: 70, speed: 7, x: AV[TRAM_AV] };
function tramTick(V) {
  const s = V.tram;
  if (s.wait > 0) { s.wait--; V.vx = V.vy = 0; if (s.wait === 0) { s.dir = -s.dir; V.a = s.dir > 0 ? Math.PI / 2 : Math.PI * 1.5; sfxAt('bell', V.x, V.y); } return; }
  const [od] = aiObstacle(V, 7, 0.1), push = s.blocked >= 240;
  if (od < 6 && !push) { s.blocked++; s.v = Math.max(0, s.v - 12 * DT); if (s.blocked === 20) sfxAt('bell', V.x, V.y); }
  else if (od < 6) { s.v = Math.min(1.2, s.v + 1.5 * DT); if (tick % 90 === 0) sfxAt('bell', V.x, V.y); }
  else { s.blocked = push ? 0 : Math.max(0, s.blocked - 1); s.v = Math.min(TRAM.speed, s.v + 1.5 * DT); }
  const end = s.dir > 0 ? TRAM.y1 : TRAM.y0, left = (end - V.y) * s.dir;
  if (left < 0.1) { s.wait = 240; s.v = 0; V.vy = 0; return; }
  const v = Math.min(s.v, Math.sqrt(2 * 1.2 * Math.max(0, left)) + 0.3);
  V.vx = 0; V.vy = v * s.dir; V.x = TRAM.x;
  V.braking = v < s.v - 0.1 || s.blocked > 0;
  V.lightsOn = LP.out.night > 0.25;
}
function spawnTram(y, dir) {
  const V = makeVehicle('tram', TRAM.x, y, dir > 0 ? Math.PI / 2 : Math.PI * 1.5, 'green', 'cream');
  V.tram = { dir, v: TRAM.speed, wait: 0, blocked: 0 }; V.name = 'STREETCAR'; V.keep = true;
  return V;
}
// ------------------------------------------------------------------ parked cars along the kerbs
const PARK_MODELS = [['sedan', 'cream', 'tan'], ['coupe', 'red', 'cream'], ['sedan', 'oxblood'], ['taxi', 'yellow', 'cream'], ['coupe', 'teal', 'cream'], ['sedan', 'navy'],
  ['van', 'cream', 'cream'], ['sedan', 'green', 'cream'], ['coupe', 'yellow', 'black'], ['sedan', 'steel'], ['sedan', 'black'], ['coupe', 'oxblood', 'cream']];
function parkingSpots() {
  const out = [], off = RW - 1.2;
  for (let i = 0; i < AV.length; i++) for (let j = 0; j < ST.length - 1; j++) for (let y = ST[j] + RW + 7; y < ST[j + 1] - RW - 6; y += 7.5) {
    if (i === TRAM_AV) continue;
    out.push([AV[i] - off, y, Math.PI / 2]); out.push([AV[i] + off, y, Math.PI * 1.5]);
  }
  for (let j = 0; j < ST.length; j++) for (let i = 0; i < AV.length - 1; i++) for (let x = AV[i] + RW + 7; x < AV[i + 1] - RW - 6; x += 7.5) {
    out.push([x, ST[j] + off, 0]); out.push([x, ST[j] - off, Math.PI]);
  }
  return out;
}
function spawnParked() {
  const spots = parkingSpots();
  let k = 0;
  for (const [x, y, a] of spots) {
    if (hash(Math.floor(x * 3), Math.floor(y * 3)) > 0.3) continue;
    if (Math.hypot(x - FRANK_CAR_AT[0], y - FRANK_CAR_AT[1]) < 7) continue;
    if (surfAt(x, y) !== 0) continue;
    const [m, p1, p2] = PARK_MODELS[k++ % PARK_MODELS.length];
    const V = makeVehicle(m, x, y, a, p1, p2, { parked: true }); V.lightsOn = false; V.signOn = false; V.keep = true;
  }
}
// Frank's own car, on Ferrier Street outside the office
const FRANK_CAR_AT = [23.5, ST[2] - (RW - 1.2), Math.PI];
function spawnFrankCar() {
  const V = makeVehicle('sedan', FRANK_CAR_AT[0], FRANK_CAR_AT[1], FRANK_CAR_AT[2], 'tan', 'cream', { parked: true, name: 'YOUR BUICK' });
  V.lightsOn = false; V.keep = true; V.own = true;
  V.trunk = { kind: 'trunk', name: 'THE TRUNK', owner: 'frank', grid: makeGrid(8, 3), x: V.x, y: V.y, F: null };
  for (const [k, n] of [['tireiron', 1], ['flashlight', 1], ['a38', 24], ['firstaid', 1], ['overcoat', 1]]) gridAdd(V.trunk.grid, newItem(k, n));
  return V;
}
// ------------------------------------------------------------------ traffic around the player
const TRAFFIC_PAINT = [['sedan', 'cream', 'tan'], ['taxi', 'yellow', 'cream'], ['coupe', 'teal', 'cream'], ['sedan', 'navy'], ['van', 'cream', 'cream'], ['sedan', 'steel'], ['coupe', 'green', 'cream'], ['sedan', 'oxblood'], ['taxi', 'yellow', 'cream']];
const TRAFFIC = { n: 0, made: 0 };
function trafficWant() { const h = clockHour(); return h >= 7 && h < 20 ? 11 : h >= 20 || h < 1 ? 7 : 3; }
function spawnTrafficCar(n0, n1) {
  const a = nodeXY(n0), b = nodeXY(n1), dx = Math.sign(b[0] - a[0]), dy = Math.sign(b[1] - a[1]), o = laneOffset(dx, dy);
  const t = 0.3 + rnd() * 0.4, x = lerp(a[0], b[0], t) + o[0], y = lerp(a[1], b[1], t) + o[1];
  if (VEH.some(V => !V.gone && Math.hypot(V.x - x, V.y - y) < 9)) return null;
  const [m, p1, p2] = TRAFFIC_PAINT[TRAFFIC.made++ % TRAFFIC_PAINT.length];
  const V = makeVehicle(m, x, y, Math.atan2(dy, dx), p1, p2);
  trafficInit(V, n0, n1); V.driver = 'ai';
  const f = V.ai.cruise * 0.7; V.vx = dx * f; V.vy = dy * f;
  return V;
}
function manageTraffic(force) {
  if (!force && tick % 30 !== 7) return;
  const [fx, fy] = frankPos();
  let n = 0;
  for (const V of VEH) {
    if (V.gone || V.keep || V.driver === 'frank' || V === PLAYER.car) continue;
    const d = Math.hypot(V.x - fx, V.y - fy);
    if ((d > 95 || (V.wreck && d > 60)) && offScreen(V.x, V.y)) { V.gone = true; continue; }
    if (V.driver === 'ai') n++;
  }
  for (let i = VEH.length - 1; i >= 0; i--) if (VEH[i].gone && !VEH[i].sinking && VEH[i] !== PLAYER.car) VEH.splice(i, 1);
  TRAFFIC.n = n;
  const want = trafficWant();
  for (let tries = 0; n < want && tries < (force ? 60 : 6); tries++) {
    const n0 = Math.floor(rnd() * AV.length * NS), nb = nodeNeighbours(n0), n1 = nb[Math.floor(rnd() * nb.length)];
    const [ax, ay] = nodeXY(n0), [bx, by] = nodeXY(n1), mx = (ax + bx) / 2, my = (ay + by) / 2, d = Math.hypot(mx - fx, my - fy);
    if (d < (force ? 12 : 35) || d > 80 || (!force && !offScreen(mx, my))) continue;
    if (Math.abs(ax - TRAM.x) < 1 && Math.abs(bx - TRAM.x) < 1 && tries < 4) continue;
    if (spawnTrafficCar(n0, n1)) n++;
  }
}
// the driver of a car Frank takes (or one that is burning) gets out and runs
function bailDriver(V) {
  if (!V.ai || V.driver !== 'ai') return;
  const side = doorPoint(V, V.ai.mode === 'traffic' ? -1 : 1);
  const cop = V.model === 'police';
  V.ai = null; V.driver = null; V.thr = 0; V.brk = 0; V.hand = 1; V.siren = false;
  if (cop) spawnCop(side[0], side[1]); else spawnCivilian(side[0], side[1], true);
}
// ------------------------------------------------------------------ getting in and out
function doorPoint(V, side) {
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
  const took = !V.own && !V.taken;
  if (V.driver === 'ai') { crimeAt('carjack', V.x, V.y, V); bailDriver(V); }
  else if (took) crimeAt(V.model === 'police' ? 'copcar' : 'cartheft', V.x, V.y, V);
  V.driver = 'frank'; V.parked = false; V.ai = null; V.lightsOn = LP.out.night > 0.3; V.xray = C.CREAM; V.topMul = 1; V.god = PLAYER.god; V.taken = true; V.keep = true;
  FRANK.inCar = V; FRANK.visible = false; FRANK.crouch = false;
  PLAYER.car = V; if (took) STATS.carsTaken++;
  sfx('door');
}
function exitVehicle(force) {
  const V = PLAYER.car; if (!V) return false;
  if (!force && vehSpeed(V) > 4) return false;
  let spot = null;
  for (const side of [-1, 1]) { const p = doorPoint(V, side); if (personFree(p[0], p[1], 0.3, 0) && surfAt(p[0], p[1]) !== 2) { spot = p; break; } }
  if (!spot) { const c = Math.cos(V.a), s = Math.sin(V.a); for (const k of [1, -1]) { const p = [V.x + c * (V.M.hl + 0.6) * k, V.y + s * (V.M.hl + 0.6) * k]; if (personFree(p[0], p[1], 0.3, 0)) { spot = p; break; } } }
  if (!spot) { if (!force) return false; spot = V.sinking ? landNear(V.x, V.y) : doorPoint(V, -1); }
  V.driver = null; V.thr = 0; V.brk = 0; V.hand = 1; V.steer = 0; V.xray = 0; V.siren = false;
  if (!V.own) V.keep = false;
  FRANK.inCar = null; FRANK.visible = true; FRANK.x = spot[0]; FRANK.y = spot[1]; FRANK.vx = V.vx * 0.3; FRANK.vy = V.vy * 0.3; FRANK.z = 0;
  PLAYER.car = null; PLAYER.lastCar = V;
  sfx('door');
  return true;
}
function playerDrive(V) {
  const k = INPUT.keys, fwd = vehFwd(V);
  const up = k.KeyW || k.ArrowUp, down = k.KeyS || k.ArrowDown, left = k.KeyA || k.ArrowLeft, right = k.KeyD || k.ArrowRight;
  const want = (right ? 1 : 0) - (left ? 1 : 0);
  V.steer = want ? clamp(V.steer + want * 5 * DT, -1, 1) : V.steer * (1 - Math.min(1, 9 * DT));
  V.thr = up ? 1 : 0;
  V.brk = down ? 1 : 0;
  V.hand = k.Space ? 1 : 0;
  if (fwd < -0.5 && !down) V.brk = 0;
  if (k.KeyH && V.horn <= 0) V.horn = 40;
  if (pressed('KeyL')) V.lightsOn = !V.lightsOn;
  if (V.model === 'police' && pressed('KeyG')) V.siren = !V.siren;
  if (V.wreck || V.sinking) { V.thr = 0; }
}
