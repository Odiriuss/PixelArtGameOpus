// =================================================================== STEALTH: WHAT PEOPLE SEE AND HEAR
// Light: how lit Frank is where he stands (the HUD's meter), from the same lamps that light the tiles. Sight: a cone
// from the eyes, as far as the light lets them make him out, stopped by walls. Hearing: the noise list, muffled by
// walls. Guards and cops climb a ladder: unaware, suspicious (?), searching, alerted (!).
const AW = { NONE: 0, SUS: 1, SEARCH: 2, ALERT: 3 };
const LIGHTM = { v: 0 };
function lightLevel(x, y, z, F) {
  const P = F ? LP.ins : LP.out, list = lightsNear(x, y, 0.5, F);
  let v = P.amb + 0.95 + P.sun * sunOn(x, y, z, F) * 0.9;
  for (let k = 0; k < list.length; k++) {
    const L = list[k], kk = lampK(L, P); if (kk <= 0) continue;
    const d = Math.hypot(L.x - x, L.y - y, L.z - z - 1); if (d >= L.r) continue;
    const f = 1 - d / L.r; v += f * f * kk * (L.map ? 0.6 : 1);
  }
  return clamp(v / 1.3, 0, 1);
}
function frankLight() { const [x, y, V] = frankPos(); LIGHTM.v = V ? Math.max(0.6, lightLevel(x, y, 0, null)) : lightLevel(x, y, FRANK.z, FRANK.F); return LIGHTM.v; }
function nightHours() { const h = clockHour(); return h >= 20 || h < 6; }
// the way a person is looking: the AI keeps faceX/faceY; a stale one (the sprite turned since) gives way to the sprite's
function faceOf(p) { if (p.faceX !== undefined && dirFromVec(p.faceX, p.faceY, p.dir) === p.dir) return [p.faceX, p.faceY]; return DIRV[p.dir]; }
function faceTo(p, ux, uy) { const d = Math.hypot(ux, uy); if (d < 1e-4) return; p.faceX = ux / d; p.faceY = uy / d; p.dir = dirFromVec(ux, uy, p.dir); }
function hasTorch(p) { return p.torch && p.alive && !p.down && (p.F ? true : LP.out.lamp > 0.3); }
function inTorch(p, x, y) { const f = faceOf(p), dx = x - p.x, dy = y - p.y, d = Math.hypot(dx, dy); return d < 10 && (dx * f[0] + dy * f[1]) / (d + 1e-6) > 0.9; }
// how far p can make out t: 3 m in the dark, 24 in good light; crouching, standing still and a car change it
function viewDist(p, t) {
  const V = t.inCar, tx = V ? V.x : t.x, ty = V ? V.y : t.y;
  let d = 3 + 21 * (t === FRANK ? LIGHTM.v : lightLevel(tx, ty, t.z || 0, t.F));
  if (V) return Math.max(d, 18);
  if (t.crouch) d *= 0.55;
  if (!t.moving) d *= 0.85;
  if (p.ai && p.ai.aware >= AW.SEARCH) d *= 1.25;
  if (hasTorch(p) && inTorch(p, tx, ty)) d = Math.max(d, 15);
  if (t.torch && hasTorch(t)) d = Math.max(d, 20);                        // his own flashlight gives him away
  return d;
}
function canSee(p, t, k) {
  if (!p.alive || p.down || p.asleep || p.inCar) return false;
  const V = t.inCar, tx = V ? V.x : t.x, ty = V ? V.y : t.y;
  if ((p.F || null) !== (V ? null : t.F || null)) return false;
  const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
  if (d > viewDist(p, t) * (k || 1)) return false;
  const f = faceOf(p), cs = d > 0.01 ? (dx * f[0] + dy * f[1]) / d : 1;
  const half = p.ai && p.ai.aware >= AW.SEARCH ? 0.2 : p.team === 'civ' ? 0.35 : 0.5;
  if (cs < (d < 2 ? -0.1 : half)) return false;                       // close by, the corner of an eye; never behind
  const ez = p.z + (p.crouch ? 1.0 : 1.55), tz = V ? V.z + 1.0 : t.z + (t.crouch ? 0.8 : 1.3);
  return lineClear(p.x, p.y, ez, tx, ty, tz, null, V || null, p.z);
}
function canSeePoint(p, x, y, z, range) {
  const dx = x - p.x, dy = y - p.y, d = Math.hypot(dx, dy); if (d > range) return false;
  const f = faceOf(p); if (d > 1 && (dx * f[0] + dy * f[1]) / d < 0.3) return false;
  return lineClear(p.x, p.y, p.z + 1.55, x, y, z, null, null, p.z);
}
// ------------------------------------------------------------------ where Frank should not be
// a restricted zone (by day or by night), the private side of a counter, a place that is shut
function restrictedHere() {
  const [x, y, V] = frankPos(), F = V ? null : FRANK.F || null, B = F ? F.B : null;
  if (B && B.key === 'office') return null;
  for (const k in ZONES) {
    const Z = ZONES[k]; if ((Z.F || null) !== F || x < Z.x0 || x >= Z.x1 || y < Z.y0 || y >= Z.y1) continue;
    if (Z.restricted === 'night' && !nightHours()) continue;
    if (Z.zone === 'pier9' && !Z.F && INV.bag.some(e => e.it.key === 'dockpass') && !zoneHot('pier9')) continue;     // the pass gets him through the gate
    return Z;
  }
  if (!B) return null;
  if (F.private) for (const r of F.private) if (x >= r[0] && x < r[2] && y >= r[1] && y < r[3]) return { priv: true, B, zone: B.zone, law: B.enter === 'precinct' };
  if (!businessOpen(B) && B.enter !== 'apartment' && !(B.enter === 'hotel' && F.f > 0)) return { closed: true, B, zone: B.zone, law: B.enter === 'precinct' || B.enter === 'bank' };
  return null;
}
// how much of what Frank is doing this person minds (0: nothing to see)
function suspicionOf(p) {
  if (!FRANK.alive) return 0;
  const gun = PLAYER.drawn && FRANK.gun.G.kind === 'gun', weapon = PLAYER.drawn && FRANK.gun !== FIST_GUN, R = restrictedHere();
  if (p.team === 'law') {
    if (LAW.heat >= 1) return 1.2;                                    // they have his description
    if (R && R.law) return 0.7;
    return gun ? 0.45 : 0;
  }
  const ai = p.ai;
  if (ai.hostile) return 1.5;
  if (R && (R.zone === ai.zone || (R.priv && R.B === p.B))) return R.restricted === 'night' || R.closed ? 2 : 1;
  if (gun) return 0.9;
  if (weapon) return 0.5;
  if (FRANK.crouch && ai.zone && p.B === FRANK.B) return 0.3;
  return 0;
}
// ------------------------------------------------------------------ the ladder
const BARKS = {
  sus: ['Hm?', 'Who\'s there?', 'Hey. You.', 'What was that?'], trespass: ['Hey! You lost, pal?', 'This is private. Beat it.', 'Back room\'s off limits.'],
  search: ['Somebody\'s here.', 'I know I heard something.', 'Check the corners.'], alert: ['There he is!', 'It\'s Calder!', 'Get him!', 'Over here!'],
  calm: ['Must\'ve been rats.', 'Nothing. Jumpy tonight.', 'Huh. Nobody.'], body: ['Tony\'s down! Somebody\'s here!', 'Man down!'], law: ['Police! Hold it right there!', 'Stop! Police!']
};
function bark(p, set) { const L = BARKS[set]; p.ai.bark = L[(p.n + tick) % L.length]; p.ai.barkT = 150; }
function setAware(p, lvl, why) {
  const ai = p.ai; if (ai.aware === lvl) return;
  const was = ai.aware; ai.aware = lvl; ai.awareT = tick;
  if (lvl === AW.SUS) bark(p, why === 'trespass' ? 'trespass' : 'sus');
  else if (lvl === AW.SEARCH) { bark(p, why === 'body' ? 'body' : 'search'); ai.searchT = 60 * 14; ai.path = null; }
  else if (lvl === AW.ALERT) {
    bark(p, p.team === 'law' ? 'law' : 'alert'); ai.sus = 1; ai.lostT = 0;
    if (p.team === 'goons') { ai.hostile = true; zoneAlarm(ai.zone, ai.lx, ai.ly); }
    for (const q of PEOPLE) if (q !== p && q.team === p.team && q.alive && !q.down && q.ai && q.ai.guard && sameFloor(q, p.F) && Math.hypot(q.x - p.x, q.y - p.y) < 16) alertGuard(q, ai.lx, ai.ly);
  } else if (lvl === AW.NONE && was >= AW.SEARCH) bark(p, 'calm');
  if (ai.onAware) ai.onAware(lvl, was);
}
// somebody told him where Frank is: he knows, and goes to look (or fights if he can see him)
function alertGuard(p, x, y) {
  const ai = p.ai; if (!ai || !ai.guard || !p.alive || p.down) return;
  ai.lx = x; ai.ly = y; ai.seenT = tick; if (p.team === 'goons') ai.hostile = true;
  ai.sus = Math.max(ai.sus, 0.9);
  if (canSee(p, FRANK, 1.3)) setAware(p, AW.ALERT); else if (ai.aware < AW.SEARCH) setAware(p, AW.SEARCH);
}
// a zone that has been raised: every guard in it is looking, and ones who come on later start looking
const ZSTATE = {};
function zoneAlarm(zone, x, y) {
  if (!zone) return;
  const Z = ZSTATE[zone] || (ZSTATE[zone] = {}); Z.alarm = clockAbs(); Z.x = x; Z.y = y;
  for (const q of PEOPLE) if (q.team === 'goons' && q.ai && q.ai.zone === zone && q.alive && !q.down && q.ai.aware < AW.SEARCH) { q.ai.hostile = true; q.ai.lx = x; q.ai.ly = y; q.ai.sus = Math.max(q.ai.sus, 0.6); setAware(q, AW.SEARCH); }
}
function zoneHot(zone) { const Z = ZSTATE[zone]; return !!(Z && Z.alarm !== undefined && clockAbs() - Z.alarm < 180); }
// one look and listen for a guard or a cop (every third tick; the AI acts on what it leaves in p.ai)
function guardSense(p) {
  const ai = p.ai; if ((tick + p.n) % 3) return;
  const dt = 3 * DT, see = FRANK.alive && canSee(p, FRANK);
  ai.seesFrank = see;
  if (see) { const [fx, fy] = frankPos(); ai.lx = fx; ai.ly = fy; ai.seenT = tick; }
  const s = see ? suspicionOf(p) : 0;
  if (s > 0) {
    const [fx, fy] = frankPos(), d = Math.hypot(fx - p.x, fy - p.y), close = clamp(1.6 - d / Math.max(4, viewDist(p, FRANK)), 0.35, 1.6);
    ai.sus = Math.min(1, ai.sus + s * close * 0.9 * dt * (ai.aware >= AW.SEARCH ? 2 : 1));
  } else ai.sus = Math.max(ai.aware >= AW.SEARCH ? 0.35 : 0, ai.sus - (see ? 0.2 : 0.06) * dt);
  if (ai.aware < AW.ALERT && ai.sus >= 1) setAware(p, AW.ALERT);
  else if (ai.aware === AW.NONE && ai.sus >= 0.3) { setAware(p, AW.SUS, restrictedHere() ? 'trespass' : ''); ai.nx = ai.lx; ai.ny = ai.ly; }
  else if (ai.aware === AW.SUS && !see && tick - ai.seenT > 90) { if (ai.sus > 0.45) setAware(p, AW.SEARCH); else if (ai.sus < 0.12) setAware(p, AW.NONE); }
  else if (ai.aware === AW.ALERT && !see) { if ((ai.lostT = (ai.lostT || 0) + 3) > 60 * 20) setAware(p, AW.SEARCH); }
  else if (ai.aware === AW.ALERT) ai.lostT = 0;
  // hearing
  for (const n of NOISE.list) {
    if (n.id <= (ai.heard || 0)) continue; ai.heard = n.id;
    const r = n.r * ((n.B || null) !== (p.B || null) ? 0.45 : 1), d = Math.hypot(n.x - p.x, n.y - p.y); if (d > r) continue;
    if (n.r >= 25) { ai.lx = n.x; ai.ly = n.y; ai.seenT = tick; ai.sus = Math.max(ai.sus, 0.8); if (p.team === 'goons' && ai.zone) ai.hostile = true; if (ai.aware < AW.SEARCH) setAware(p, AW.SEARCH); }
    else if (ai.aware <= AW.SUS && (ai.guarded || nightHours() && ai.zone)) {
      ai.nx = n.x; ai.ny = n.y; ai.sus = Math.max(ai.sus, 0.32);
      if (ai.aware === AW.NONE) setAware(p, AW.SUS); else if (d < r * 0.6) { ai.lx = n.x; ai.ly = n.y; ai.sus = Math.max(ai.sus, 0.5); setAware(p, AW.SEARCH); }
    }
  }
  // a man of theirs on the floor
  if (ai.aware < AW.ALERT && (tick + p.n) % 12 === 0) for (const q of PEOPLE) {
    if (q === p || q.found || q.team !== p.team || (q.alive && !q.ko) || !sameFloor(q, p.F)) continue;
    if (!canSeePoint(p, q.x, q.y, q.z + 0.3, 12)) continue;
    q.found = true; ai.lx = q.x; ai.ly = q.y; ai.seenT = tick; ai.sus = Math.max(ai.sus, 0.8);
    if (p.team === 'goons') { ai.hostile = true; zoneAlarm(ai.zone, q.x, q.y); }
    setAware(p, AW.SEARCH, 'body'); if (p.team === 'law') raiseHeat(1, 'murder', q.x, q.y);
    break;
  }
}
// ------------------------------------------------------------------ everybody else: shots, a gun waved about, a body, someone behind the counter
function hearAndSee(p) {
  const ai = p.ai; if ((tick + p.n) % 4 || !FRANK) return;
  for (const n of NOISE.list) {
    if (n.id <= (ai.heard || 0)) continue; ai.heard = n.id;
    if (n.r < 25) continue;
    const r = n.r * ((n.B || null) !== (p.B || null) ? 0.4 : 1);
    if (Math.hypot(n.x - p.x, n.y - p.y) < r && ai.mode !== 'flee' && ai.mode !== 'cower') { civFlee(p, [n.x, n.y]); if (p.asleep) { p.asleep = false; p.down = 0; } }
  }
  if (ai.mode === 'flee' || ai.mode === 'cower' || p.asleep) return;
  const seeF = canSee(p, FRANK, 0.8);
  if (seeF && PLAYER.drawn && FRANK.gun.G.kind === 'gun' && !FRANK.inCar) { civFlee(p, [FRANK.x, FRANK.y]); return; }
  if (p.staff && seeF) {                                              // behind my counter?
    const R = restrictedHere();
    if (R && R.priv && R.B === p.staff) {
      ai.warn = (ai.warn || 0) + 4;
      if (ai.warn === 4) { bark(p, 'trespass'); ai.bark = 'Customers out front, mister.'; }
      if (ai.warn > 60 * 5) { ai.warn = 0; report(p, 'trespass', FRANK.x, FRANK.y); ai.bark = 'That\'s it, I\'m calling the cops!'; ai.barkT = 150; }
    } else ai.warn = 0;
  }
  if ((tick + p.n) % 16 === 0) for (const q of PEOPLE) {                // a body
    if (q === p || q.found || q.alive && !q.ko || !sameFloor(q, p.F) || !canSeePoint(p, q.x, q.y, q.z + 0.3, 10)) continue;
    q.found = true; civFlee(p, [q.x, q.y]); ai.bark = 'Oh my God!'; ai.barkT = 120; makeNoise(p.x, p.y, 14, p.B); break;
  }
}
// ------------------------------------------------------------------ flashlights: a cone in front of a guard at night (and one in a dark warehouse)
function pushTorches() {
  for (const p of PEOPLE) {
    if (!hasTorch(p) || !personShown(p)) continue;
    const f = faceOf(p);
    DYN.push({ x: p.x + f[0] * 0.3, y: p.y + f[1] * 0.3, z: p.z + 1.25, r: 10, k: 1.5, cone: true, dx: f[0], dy: f[1], ang: 0.42, cos: Math.cos(0.42) });
  }
}
