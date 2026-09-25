// =================================================================== PEOPLE: FRANK, THE STREET, THE STAFF, THE LAW, THE MOB
// The paper-doll figures of the main game with the test level's combat frames. A person is somewhere: out in the
// street (B null) or on a floor F of a building B, at height z (0 on the ground floor). Walls stop everyone; a
// locked door stops people outside it, never people inside.
const PEOPLE = [];
function gunDraw(kind) {
  return (hx, hy, back) => {
    if (kind === 'long') {
      if (!back) { spr(hx - 2, hy + 1, 3, 2, C.WOOD); spr(hx + 1, hy, 6, 1, C.INK); sp(hx + 7, hy, C.S1); spr(hx + 1, hy + 1, 3, 1, C.WOOD); }
      else { spr(hx - 1, hy + 1, 2, 2, C.WOOD); spr(hx + 1, hy - 1, 5, 1, C.INK); sp(hx + 6, hy - 2, C.S1); }
    } else if (kind === 'tommy') {
      if (!back) { spr(hx - 2, hy + 1, 3, 2, C.WOOD); spr(hx + 1, hy, 5, 2, C.INK); sp(hx + 6, hy, C.S1); spr(hx + 1, hy + 2, 3, 2, C.S0); }
      else { spr(hx - 1, hy + 1, 2, 2, C.WOOD); spr(hx + 1, hy - 1, 4, 2, C.INK); sp(hx + 5, hy - 2, C.S1); }
    } else if (kind === 'club') {
      if (!back) { spr(hx + 1, hy - 2, 1, 4, C.DBR); sp(hx + 1, hy - 3, C.INK); } else { spr(hx + 1, hy - 3, 1, 3, C.DBR); }
    } else if (kind === 'none') { /* empty hands */ }
    else if (!back) { spr(hx + 1, hy, 3, 1, C.INK); sp(hx + 4, hy, C.S1); sp(hx + 1, hy + 1, C.INK); }
    else { spr(hx + 1, hy - 1, 3, 1, C.INK); sp(hx + 4, hy - 2, C.S1); }
  };
}
function combatDef(base, over) {
  const def = Object.assign({}, CAST_DEFS[base], over || {});
  def.poses = Object.assign({}, def.poses, { aim: [{ reach: 1, hold: 'gun' }], aimwalk: [] });
  for (let f = 0; f < 6; f++) def.poses.aimwalk.push({ q: WALK_Q[f], bob: WALK_BOB[f], lift: WALK_LIFT[f], reach: 1, hold: 'gun' });
  return def;
}
function crouchOf(src) {
  const f = newFrame(), drop = 8, hip = SPR_BY - 11;
  for (let y = 0; y <= hip; y++) for (let x = 0; x < SPR_W; x++) { const c = src[y * SPR_W + x]; if (c !== T && y + drop < SPR_H) f[(y + drop) * SPR_W + x] = c; }
  for (let y = SPR_BY - 2; y <= SPR_BY; y++) for (let x = 0; x < SPR_W; x++) { const c = src[y * SPR_W + x]; if (c !== T) f[y * SPR_W + x] = c; }
  for (let x = SPR_AX - 4; x <= SPR_AX + 3; x++) if (f[(hip + drop + 1) * SPR_W + x] === T) f[(hip + drop + 1) * SPR_W + x] = C.INK;
  return f;
}
function downOf(src) {
  const f = newFrame();
  for (let y = 0; y < SPR_BY; y++) for (let x = 0; x < SPR_W; x++) {
    const c = src[y * SPR_W + x]; if (c === T) continue;
    const dx = Math.round(1 + y * (SPR_W - 3) / SPR_BY), dy = SPR_BY - 1 - Math.round((x - (SPR_AX - 7)) / 2.2);
    if (dx >= 0 && dx < SPR_W && dy >= 0 && dy < SPR_H) f[dy * SPR_W + dx] = c;
  }
  return f;
}
// the cast: Frank, the law, the mob, the street (recoloured to make a crowd), the people who work in places.
// A figure is built for each thing it can hold (a pistol, a long gun, a Thompson, a club, nothing), the first time it is needed.
const CAST_BASE = (() => {
  const ck = costume;
  return {
    frank: ['frank'], cop: ['cop'], goon: ['goon'],
    goon2: ['goon', { body: 'coat', key: ck({ C: C.ST1, c: C.ST0, K: C.ST2, B: C.INK, T: C.ST0, t: C.INK, H: C.ST0, h: C.INK, b: C.INK, W: C.CREAM, N: C.OX }) }],
    goon3: ['goon', { hat: 'cap', wide: 0, key: ck({ C: C.BRN, c: C.DBR, K: C.TAN, H: C.ST0, h: C.INK, X: C.ST0, T: C.INK, t: C.BLK, W: C.S2, N: C.INK, S: C.SKS, s: C.DSS, L: C.SKM }) }],
    leader: ['goon', { body: 'long', key: ck({ C: C.INK, c: C.BLK, K: C.ST0, T: C.INK, t: C.BLK, H: C.OX, h: C.PLUM, b: C.INK, W: C.CREAM, N: C.CRIM, X: C.S1 }) }],
    bartender: ['bartender'], clerk: ['clerk'], vendor: ['vendor'], doorman: ['doorman'], pianist: ['pianist'], bassist: ['bassist'], drummer: ['drummer'],
    civM: ['patronM'], civF: ['patronF'], civV: ['vendor'],
    civM2: ['patronM', { hat: 'none', hair: 'slick', key: ck({ C: C.NAV, c: C.INK, K: C.SLT, T: C.NAV, t: C.INK, W: C.CREAM, N: C.CRIM, A: C.INK }) }],
    civM3: ['patronM', { body: 'coat', key: ck({ C: C.ST2, c: C.ST1, K: C.CRS, T: C.ST0, t: C.INK, H: C.ST0, h: C.INK, W: C.CREAM, N: C.NAV, S: C.DSM, s: C.DSS, L: C.SKM }) }],
    civM4: ['teague', { hat: 'fedora', key: ck({ C: C.TAN, c: C.BRN, K: C.TANL, T: C.BRN, t: C.DBR, H: C.DBR, h: C.INK, W: C.CREAM, N: C.G1 }) }],
    civM5: ['vendor', { body: 'vest', hat: 'cap', key: ck({ C: C.DW, c: C.INK, K: C.PNV, H: C.ST1, h: C.ST0, W: C.S3, T: C.ST0, t: C.NAV, S: C.SKS, s: C.DSS, L: C.SKM }) }],
    civF2: ['patronF', { hair: 'bun', key: ck({ C: C.G1, c: C.G0, K: C.G2, T: C.G1, t: C.G0, A: C.HAIRL, a: C.CORAL }) }],
    civF3: ['mags', { key: ck({ C: C.NAV, c: C.INK, K: C.WL, T: C.NAV, t: C.INK, A: C.HAIRD, a: C.HAIRL, W: C.CREAM }) }],
    civF4: ['russo', { key: ck({ C: C.CREAM, c: C.CRS, K: C.WHITE, T: C.TAN, t: C.BRN, A: C.INK, a: C.HAIRD, S: C.DSM, s: C.DSS, L: C.SKM, m: C.CRIM }) }]
  };
})();
const CIV_IDS = Object.keys(CAST_BASE).filter(k => k.startsWith('civ'));
const COMBAT_CAST = {};
function castFor(id, hold) {
  const key = id + ':' + (hold || 'pistol');
  let P = COMBAT_CAST[key]; if (P) return P;
  const [base, over] = CAST_BASE[id], def = combatDef(base, over);
  def.holdDraw = gunDraw(hold || 'pistol');
  P = buildPerson(def);
  for (const set of [P.front, P.back]) { set.crouch = [crouchOf(set.idle[0])]; set.crouchaim = [crouchOf(set.aim[0])]; set.down = [downOf(set.idle[0])]; }
  COMBAT_CAST[key] = P;
  return P;
}
function buildCombatCast() { for (const id of ['frank', 'cop', 'goon', 'civM', 'civF']) castFor(id, 'pistol'); castFor('frank', 'none'); }
const FLASHED = new Map();
function flashOf(f) { let g = FLASHED.get(f); if (g) return g; g = f.map(c => c === T ? T : (c === C.BLK ? C.BLK : C.WHITE)); FLASHED.set(f, g); return g; }
function personFrame(a) {
  const set = a.dir >= 2 ? a.cast.back : a.cast.front;
  let f;
  if (a.down) f = set.down[0];
  else if (a.crouch) f = a.aiming ? set.crouchaim[0] : set.crouch[0];
  else if (a.moving) f = (a.aiming ? set.aimwalk : set.walk)[Math.floor(a.dist / 0.24) % 6];
  else if (a.pose && set[a.pose]) f = set[a.pose][Math.floor(a.idleT / 12) % set[a.pose].length];
  else f = a.aiming ? set.aim[0] : set.idle[Math.floor(a.idleT / 50) % 2];
  return a.flash > 0 ? flashOf(f) : f;
}
let PID = 0;
function makePerson(kind, castId, x, y, o) {
  const p = Object.assign({ n: PID, id: 'p' + (PID++), cast: castFor(castId, o && o.hold), castId, x, y, dir: 0, anim: 'idle', af: 0, path: [], speed: 1.55, dist: 0, talking: 0,
    visible: true, hot: 0, idleT: 0, pose: null, poseT: 0, noShadow: false, frameFn: personFrame, xray: 0, sink: 0, z: 0, B: null, F: null,
    kind, team: kind === 'frank' ? 'frank' : kind === 'civ' ? 'civ' : kind === 'cop' ? 'law' : 'goons', hp: 100, maxHp: 100, alive: true, down: 0, crouch: false,
    aimA: 0, aiming: 0, moving: false, vx: 0, vy: 0, kx: 0, ky: 0, flash: 0, inCar: null, ai: null, gun: null, lastHurt: -999, r: 0.3 }, o || {});
  p.maxHp = p.hp;
  if (p.F) { p.B = p.F.B; p.z = p.F.f === 0 ? 0 : p.F.z; }
  PEOPLE.push(p);
  return p;
}
function personHeight(p) { return p.down ? 0.4 : p.crouch ? 1.15 : 1.75; }
// ------------------------------------------------------------------ where things are: buildings by position
function buildingAt(x, y) {
  for (let i = 1; i < BUILDINGS.length; i++) { const B = BUILDINGS[i]; if (B.floors && x >= B.x0 && x < B.x1 && y >= B.y0 && y < B.y1) return B; }
  return null;
}
// ------------------------------------------------------------------ moving: z is the height of the floor walked on
function blockedAt(x, y, r, z, who) {
  const zz = z || 0;
  if (zz < 0.5 && surfAt(x, y) === 2) return true;
  for (const S of staticsNear(x - r, y - r, x + r, y + r)) {
    if (S.off) continue;
    const b0 = S.z0 || 0;
    if (b0 + S.h < zz + 0.3 || b0 > zz + 1.6) continue;
    if (S.kind === 'door' && who && who.B === S.door.B) continue;              // from the inside every door opens
    if (S.circle) { if (Math.hypot(x - S.cx, y - S.cy) < S.r + r) return true; }
    else if (x > S.x0 - r && x < S.x1 + r && y > S.y0 - r && y < S.y1 + r) return true;
  }
  return false;
}
function personFree(x, y, r, z, who) {
  if (blockedAt(x, y, r, z, who)) return false;
  if ((z || 0) < 0.5 && !(who && who.B)) for (const V of VEH) if (!V.gone && Math.abs(V.x - x) < 4 && Math.abs(V.y - y) < 4 && distToVehicle(V, x, y) < r) return false;
  return true;
}
function movePerson(p, dx, dy) {
  const r = p.r, z = p.z;
  let ok = false;
  if (personFree(p.x + dx, p.y + dy, r, z, p)) { p.x += dx; p.y += dy; ok = true; }
  else if (Math.abs(dx) > 1e-4 && personFree(p.x + dx, p.y, r, z, p)) { p.x += dx; ok = true; }
  else if (Math.abs(dy) > 1e-4 && personFree(p.x, p.y + dy, r, z, p)) { p.y += dy; ok = true; }
  if (ok && p.z < 0.5) placePerson(p);
  return ok;
}
// on the ground floor, walking in or out of a building changes where a person is
function placePerson(p) {
  const B = p.B && p.x >= p.B.x0 && p.x < p.B.x1 && p.y >= p.B.y0 && p.y < p.B.y1 ? p.B : buildingAt(p.x, p.y);
  if (B === p.B) return;
  p.B = B; p.F = B ? B.floors[0] : null; p.z = 0;
  if (p === FRANK) onFrankMoved(B);
}
// ------------------------------------------------------------------ cars and people
function carsVsPeople() {
  for (const V of VEH) {
    if (V.gone) continue;
    const R = V.M.hl + 1;
    for (const p of PEOPLE) {
      if (!p.visible || p.inCar || p.B || Math.abs(p.x - V.x) > R || Math.abs(p.y - V.y) > R) continue;
      if (!obbVsCircle(V, p.x, p.y, p.r)) continue;
      const nx = -HIT.nx, ny = -HIT.ny, imp = -(V.vx * HIT.nx + V.vy * HIT.ny);
      if (imp > 2.8 && p.alive && !p.down) {
        hurtPerson(p, (imp - 2) * 13, V.driver === 'frank' ? 'frank' : 'car', nx, ny);
        p.down = Math.max(p.down, 100); p.kx += V.vx * 0.7 + nx * 2; p.ky += V.vy * 0.7 + ny * 2;
        V.vx *= 0.93; V.vy *= 0.93; sfxAt('thud', p.x, p.y);
        if (V.driver === 'frank' && p.team === 'goons') STATS.runOver++;
      }
      const d = HIT.d + 0.02;
      if (personFree(p.x + nx * d, p.y + ny * d, 0.05, 0) || !p.alive) { p.x += nx * d; p.y += ny * d; }
      else { V.x -= nx * d; V.y -= ny * d; }
    }
  }
}
function hurtPerson(p, dmg, src, dx, dy) {
  if (!p.alive || dmg <= 0) return;
  if (p === FRANK) { dmg = playerDamage(dmg, src); if (PLAYER.god) dmg = Math.min(dmg, p.hp - 1); PLAYER.calm = 0; STATS.dmgTaken += dmg; shake(Math.min(6, 2 + dmg / 8)); }
  p.hp -= dmg; p.flash = 4; p.lastHurt = tick;
  if (dx !== undefined) { p.kx += dx * 2.5; p.ky += dy * 2.5; }
  if (src === 'frank' && p !== FRANK) crimeAt(p.team === 'law' ? 'hitcop' : 'assault', p.x, p.y, p);
  if (p.hp <= 0) {
    p.hp = 0; p.alive = false; p.down = -1; p.aiming = 0; p.crouch = false; p.moving = false; p.pose = null; p.sink = 0;
    if (p.team === 'goons') STATS.goonsDown++;
    if (src === 'frank' && p !== FRANK) crimeAt(p.team === 'law' ? 'killcop' : p.team === 'goons' ? 'killgoon' : 'murder', p.x, p.y, p);
    if (p.onDown) p.onDown(src);
    bodyLoot(p);
  }
  if (p.ai && p.ai.onHurt) p.ai.onHurt(src);
}
function personPhysics(p) {
  if (p.flash > 0) p.flash--;
  if (p.kx || p.ky) {
    movePerson(p, p.kx * DT, p.ky * DT);
    p.kx *= 0.86; p.ky *= 0.86; if (Math.abs(p.kx) + Math.abs(p.ky) < 0.05) p.kx = p.ky = 0;
  }
  if (p.down > 0 && p.alive && --p.down === 0) p.idleT = 0;
  p.idleT++;
}
function landNear(x, y, z) {
  for (let r = 0.5; r < 8; r += 0.5) for (let k = 0; k < 16; k++) {
    const a = (k + r) / 16 * Math.PI * 2, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    if (personFree(px, py, 0.3, z || 0)) return [px, py];
  }
  return [x, y];
}
// noise: gunshots, crashes, a blackjack on a skull. People and guards within its radius hear it.
const NOISE = { x: 0, y: 0, t: 0, r: 0, B: null, list: [], seq: 0 };
function makeNoise(x, y, r, B) {
  NOISE.x = x; NOISE.y = y; NOISE.t = 60; NOISE.r = r || 30; NOISE.B = B || null;
  NOISE.list.push({ x, y, r: r || 30, B: B || null, t: tick, id: ++NOISE.seq });
  if (NOISE.list.length > 8) NOISE.list.shift();
}
