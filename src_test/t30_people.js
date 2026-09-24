// =================================================================== PEOPLE ON THE STREET: FRANK, THE GOONS, PASSERS-BY
// The paper-doll figures of the main game, with extra frames for a gunfight: gun raised (standing and on the move),
// crouched behind cover, and lying down. They are chosen by the engine's frame hook.
const PEOPLE = [];
function gunDraw(kind) {
  return (hx, hy, back) => {
    if (kind === 'tommy') {
      if (!back) { spr(hx - 2, hy + 1, 3, 2, C.WOOD); spr(hx + 1, hy, 5, 2, C.INK); sp(hx + 6, hy, C.S1); spr(hx + 1, hy + 2, 3, 2, C.S0); }
      else { spr(hx - 1, hy + 1, 2, 2, C.WOOD); spr(hx + 1, hy - 1, 4, 2, C.INK); sp(hx + 5, hy - 2, C.S1); }
    } else if (!back) { spr(hx + 1, hy, 3, 1, C.INK); sp(hx + 4, hy, C.S1); sp(hx + 1, hy + 1, C.INK); }
    else { spr(hx + 1, hy - 1, 3, 1, C.INK); sp(hx + 4, hy - 2, C.S1); }
  };
}
function combatDef(base, over, gun) {
  const def = Object.assign({}, CAST_DEFS[base], over || {});
  def.holdDraw = gunDraw(gun);
  def.poses = { aim: [{ reach: 1, hold: 'gun' }], aimwalk: [] };
  for (let f = 0; f < 6; f++) def.poses.aimwalk.push({ q: WALK_Q[f], bob: WALK_BOB[f], lift: WALK_LIFT[f], reach: 1, hold: 'gun' });
  return def;
}
// crouch: the body from the hips up drops 8 rows onto the feet
function crouchOf(src) {
  const f = newFrame(), drop = 8, hip = SPR_BY - 11;
  for (let y = 0; y <= hip; y++) for (let x = 0; x < SPR_W; x++) { const c = src[y * SPR_W + x]; if (c !== T && y + drop < SPR_H) f[(y + drop) * SPR_W + x] = c; }
  for (let y = SPR_BY - 2; y <= SPR_BY; y++) for (let x = 0; x < SPR_W; x++) { const c = src[y * SPR_W + x]; if (c !== T) f[y * SPR_W + x] = c; }
  for (let x = SPR_AX - 4; x <= SPR_AX + 3; x++) if (f[(hip + drop + 1) * SPR_W + x] === T) f[(hip + drop + 1) * SPR_W + x] = C.INK;   // bent knees
  return f;
}
// lying on the ground: the figure turned onto its side and foreshortened
function downOf(src) {
  const f = newFrame();
  for (let y = 0; y < SPR_BY; y++) for (let x = 0; x < SPR_W; x++) {
    const c = src[y * SPR_W + x]; if (c === T) continue;
    const dx = Math.round(1 + y * (SPR_W - 3) / SPR_BY), dy = SPR_BY - 1 - Math.round((x - (SPR_AX - 7)) / 2.2);
    if (dx >= 0 && dx < SPR_W && dy >= 0 && dy < SPR_H) f[dy * SPR_W + dx] = c;
  }
  return f;
}
const COMBAT_CAST = {};
function buildCombatCast() {
  const defs = {
    frank: combatDef('frank', {}, 'revolver'),
    goon: combatDef('goon', {}, 'pistol'),
    goon2: combatDef('goon', { body: 'coat', key: costume({ C: C.ST1, c: C.ST0, K: C.ST2, B: C.INK, T: C.ST0, t: C.INK, H: C.ST0, h: C.INK, b: C.INK, W: C.CREAM, N: C.OX }) }, 'pistol'),
    goon3: combatDef('goon', { hat: 'cap', wide: 0, key: costume({ C: C.BRN, c: C.DBR, K: C.TAN, H: C.ST0, h: C.INK, X: C.ST0, T: C.INK, t: C.BLK, W: C.S2, N: C.INK, S: C.SKS, s: C.DSS, L: C.SKM }) }, 'pistol'),
    leader: combatDef('goon', { body: 'long', name: 'Nico', key: costume({ C: C.INK, c: C.BLK, K: C.ST0, T: C.INK, t: C.BLK, H: C.OX, h: C.PLUM, b: C.INK, W: C.CREAM, N: C.CRIM, X: C.S1 }) }, 'tommy'),
    civM: combatDef('patronM', {}, 'pistol'), civF: combatDef('patronF', {}, 'pistol'), civV: combatDef('vendor', {}, 'pistol')
  };
  for (const id in defs) {
    const P = buildPerson(defs[id]);
    for (const set of [P.front, P.back]) { set.crouch = [crouchOf(set.idle[0])]; set.crouchaim = [crouchOf(set.aim[0])]; set.down = [downOf(set.idle[0])]; }
    COMBAT_CAST[id] = P;
  }
}
const FLASHED = new Map();
function flashOf(f) {
  let g = FLASHED.get(f); if (g) return g;
  g = f.map(c => c === T ? T : (c === C.BLK ? C.BLK : C.WHITE)); FLASHED.set(f, g); return g;
}
function personFrame(a) {
  const set = a.dir >= 2 ? a.cast.back : a.cast.front;
  let f;
  if (a.down) f = set.down[0];
  else if (a.crouch) f = a.aiming ? set.crouchaim[0] : set.crouch[0];
  else if (a.moving) f = (a.aiming ? set.aimwalk : set.walk)[Math.floor(a.dist / 0.24) % 6];
  else f = a.aiming ? set.aim[0] : set.idle[Math.floor(a.idleT / 50) % 2];
  return a.flash > 0 ? flashOf(f) : f;
}
let PID = 0;
function makePerson(kind, castId, x, y, o) {
  const p = Object.assign({ id: 'p' + (PID++), cast: COMBAT_CAST[castId], castId, x, y, dir: 0, anim: 'idle', af: 0, path: [], speed: 1.55, dist: 0, talking: 0,
    visible: true, hot: 0, idleT: 0, pose: null, poseT: 0, noShadow: false, frameFn: personFrame, xray: 0, sink: 0, z: 0,
    kind, team: kind === 'frank' ? 'frank' : kind === 'civ' ? 'civ' : 'goons', hp: 100, maxHp: 100, alive: true, down: 0, crouch: false,
    aimA: 0, aiming: 0, moving: false, vx: 0, vy: 0, kx: 0, ky: 0, flash: 0, inCar: null, ai: null, gun: null, lastHurt: -999, r: 0.3 }, o || {});
  p.maxHp = p.hp;
  PEOPLE.push(p);
  return p;
}
function personHeight(p) { return p.down ? 0.4 : p.crouch ? 1.15 : 1.75; }
// ------------------------------------------------------------------ moving through the city
function blockedAt(x, y, r) {
  if (surfAt(x, y) === 2) return true;
  for (const S of staticsNear(x - r, y - r, x + r, y + r)) {
    if (S.h < 0.3) continue;
    if (S.circle) { if (Math.hypot(x - S.cx, y - S.cy) < S.r + r) return true; }
    else if (x > S.x0 - r && x < S.x1 + r && y > S.y0 - r && y < S.y1 + r) return true;
  }
  return false;
}
function personFree(x, y, r) {
  if (blockedAt(x, y, r)) return false;
  for (const V of VEH) if (!V.gone && distToVehicle(V, x, y) < r) return false;
  return true;
}
// slide along obstacles: try the full move, then each axis
function movePerson(p, dx, dy) {
  const r = p.r;
  if (personFree(p.x + dx, p.y + dy, r)) { p.x += dx; p.y += dy; return true; }
  if (Math.abs(dx) > 1e-4 && personFree(p.x + dx, p.y, r)) { p.x += dx; return true; }
  if (Math.abs(dy) > 1e-4 && personFree(p.x, p.y + dy, r)) { p.y += dy; return true; }
  return false;
}
// cars push people out of the way, and knock them down when they are going fast enough
function carsVsPeople() {
  for (const V of VEH) {
    if (V.gone) continue;
    const R = V.M.hl + 1;
    for (const p of PEOPLE) {
      if (!p.visible || p.inCar || Math.abs(p.x - V.x) > R || Math.abs(p.y - V.y) > R) continue;
      if (!obbVsCircle(V, p.x, p.y, p.r)) continue;
      const nx = -HIT.nx, ny = -HIT.ny, imp = -(V.vx * HIT.nx + V.vy * HIT.ny);
      if (imp > 2.8 && p.alive && !p.down) {
        hurtPerson(p, (imp - 2) * 13, 'car', nx, ny);
        p.down = Math.max(p.down, 100); p.kx += V.vx * 0.7 + nx * 2; p.ky += V.vy * 0.7 + ny * 2;
        V.vx *= 0.93; V.vy *= 0.93; sfxAt('thud', p.x, p.y);
        if (V.driver === 'frank' && p.team === 'goons') STATS.runOver++;
      }
      const d = HIT.d + 0.02;
      if (personFree(p.x + nx * d, p.y + ny * d, 0.05) || !p.alive) { p.x += nx * d; p.y += ny * d; }
      else { V.x -= nx * d; V.y -= ny * d; }
    }
  }
}
function hurtPerson(p, dmg, src, dx, dy) {
  if (!p.alive || dmg <= 0) return;
  if (p === FRANK) { if (PLAYER.god) dmg = Math.min(dmg, p.hp - 1); PLAYER.calm = 0; STATS.dmgTaken += dmg; shake(Math.min(6, 2 + dmg / 8)); }
  p.hp -= dmg; p.flash = 4; p.lastHurt = tick;
  if (dx !== undefined) { p.kx += dx * 2.5; p.ky += dy * 2.5; }
  if (p.hp <= 0) {
    p.hp = 0; p.alive = false; p.down = -1; p.aiming = 0; p.crouch = false; p.moving = false;
    if (p.team === 'goons') STATS.goonsDown++;
    if (p.team === 'civ' && src === 'frank') toast('Watch your fire, Calder.');
    if (p.onDown) p.onDown(src);
  }
  if (p.ai && p.ai.onHurt) p.ai.onHurt(src);
}
function personPhysics(p) {
  if (p.flash > 0) p.flash--;
  if (p.kx || p.ky) {                                         // knockback slides to a stop
    movePerson(p, p.kx * DT, p.ky * DT);
    p.kx *= 0.86; p.ky *= 0.86; if (Math.abs(p.kx) + Math.abs(p.ky) < 0.05) p.kx = p.ky = 0;
  }
  if (p.down > 0 && p.alive && --p.down === 0) p.idleT = 0;
  p.idleT++;
}
// ------------------------------------------------------------------ passers-by: they run from gunfire
function spawnCivilian(x, y, flee) {
  const ids = ['civM', 'civF', 'civV'], p = makePerson('civ', ids[PID % 3], x, y, { hp: 60 });
  p.ai = { mode: flee ? 'flee' : 'idle', t: 0, tx: x, ty: y };
  if (flee) civFlee(p);
  return p;
}
function civFlee(p) {
  const ang = Math.atan2(p.y - FRANK.y, p.x - FRANK.x);
  for (let k = 0; k < 12; k++) {
    const a = ang + (k & 1 ? 1 : -1) * Math.ceil(k / 2) * 0.4, tx = p.x + Math.cos(a) * 22, ty = p.y + Math.sin(a) * 22;
    if (!blockedAt(tx, ty, 0.4)) { p.ai.tx = tx; p.ai.ty = ty; p.ai.mode = 'flee'; return; }
  }
}
function civTick(p) {
  const ai = p.ai; if (!p.alive || p.down) { p.moving = false; return; }
  if (ai.mode === 'idle') { p.moving = false; if (NOISE.t > 0 && Math.hypot(NOISE.x - p.x, NOISE.y - p.y) < 30) civFlee(p); return; }
  const dx = ai.tx - p.x, dy = ai.ty - p.y, d = Math.hypot(dx, dy);
  if (d < 0.6) { p.moving = false; ai.mode = 'idle'; return; }
  const st = 3.6 * DT, mx = dx / d * st, my = dy / d * st;
  p.moving = movePerson(p, mx, my) || movePerson(p, -my, mx);
  if (p.moving) { p.dist += st; p.dir = dirFromVec(dx, dy, p.dir); } else if (++ai.t > 40) { ai.t = 0; civFlee(p); }
}
const NOISE = { x: 0, y: 0, t: 0 };                           // the last gunshot: passers-by run from it
function makeNoise(x, y) { NOISE.x = x; NOISE.y = y; NOISE.t = 60; }
