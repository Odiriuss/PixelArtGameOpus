// =================================================================== GUARDS AND COPS: WHAT THEY DO ON EACH RUNG OF THE LADDER
// Unaware: stand a post (sitting at a card table, leaning on a bar) or walk a patrol route, pausing at its corners.
// Suspicious: stop, turn to the noise or the man, say something; walk up to a trespasser. Searching: go to where
// it came from, gun out, look around, then give up and go back. Alerted: fight (a cop at heat 1 comes to write a
// ticket instead). Knocked out: down for three minutes, and wakes up knowing somebody was there.
function guardAI(p, o) {
  const ai = Object.assign({ guard: true, aware: AW.NONE, sus: 0, lx: p.x, ly: p.y, nx: p.x, ny: p.y, seenT: -1e9, heard: NOISE.seq, zone: null, guarded: false, hostile: false,
    route: null, ri: 0, wait: 0, post: [p.x, p.y, p.dir, 0], mode: 'post', state: 'spawn', t: 10, cover: null, path: null, pi: 0, gx: 0, gy: 0, role: 'hold', range: 10,
    homeX: p.x, homeY: p.y, peekShots: 0, repath: 0, stuck: 0, dodge: 0, bark: '', barkT: 0, look: 0 }, o || {});
  ai.onHurt = src => {
    if (!p.alive) return;
    if (src === 'frank') { const [fx, fy] = frankPos(); ai.lx = fx; ai.ly = fy; ai.seenT = tick; if (p.team === 'goons') ai.hostile = true; ai.sus = 1; if (ai.aware < AW.ALERT) setAware(p, AW.ALERT); }
    if (ai.state === 'peek' && rnd() < 0.7) { ai.state = 'cover'; ai.t = 50 + rnd() * 60; }
  };
  ai.onAware = lvl => { armFor(p); if (lvl >= AW.SEARCH) { p.sink = 0; p.pose = null; } if (lvl === AW.ALERT) { ai.state = 'spawn'; ai.t = 8 + Math.floor(rnd() * 20); } };
  p.aiming = 0;
  return ai;
}
// the gun comes out when there is something to look for (a guard on restricted ground has it out anyway)
function armFor(p) {
  const out = p.ai.aware >= AW.SEARCH || p.ai.armed, hold = out && p.gun ? p.gun.G.hold || 'pistol' : 'none';
  if (p.hold !== hold) { p.hold = hold; p.cast = castFor(p.castId, hold); }
}
function guardTick(p) {
  gunTick(p.gun); personPhysics(p);
  const ai = p.ai;
  if (!p.alive) { if (ai.cover) { ai.cover.by = null; ai.cover = null; } p.moving = false; p.aiming = 0; return; }
  if (ai.barkT > 0) ai.barkT--;
  if (p.down) {
    p.moving = false; p.aiming = 0;
    if (p.ko && p.down === 1) { p.ko = false; ai.sus = 0.9; ai.hostile = p.team === 'goons'; ai.lx = p.x; ai.ly = p.y; setAware(p, AW.SEARCH); ai.bark = 'Ugh... my head. Somebody\'s here!'; zoneAlarm(ai.zone, p.x, p.y); }
    return;
  }
  guardSense(p);
  if (p.team === 'law') capLaw(p);
  switch (ai.aware) {
    case AW.NONE: routine(p); break;
    case AW.SUS: {
      p.moving = false; p.aiming = 0; faceTo(p, ai.nx - p.x, ai.ny - p.y);
      if (ai.seesFrank && restrictedHere() && tick - ai.awareT > 50) { const [fx, fy] = frankPos(); if (Math.hypot(fx - p.x, fy - p.y) > 2.2) goTo(p, fx, fy, 1.6); }
      if (p.team === 'law' && ai.seesFrank && PLAYER.drawn && !LAW.heat) copWarn(p);
      break;
    }
    case AW.SEARCH: searchTick(p); break;
    case AW.ALERT:
      if (p.team === 'law' && LAW.heat < 2) { ticketTick(p); break; }
      if (!hostile(p)) { setAware(p, AW.SEARCH); break; }
      fightTick(p); break;
  }
}
// ------------------------------------------------------------------ unaware
function routine(p) {
  const ai = p.ai; p.aiming = 0; p.crouch = false;
  if (ai.mode === 'patrol' && ai.route) {
    if (ai.wait > 0) { ai.wait--; p.moving = false; if (ai.wait % 70 === 0) { const f = faceOf(p); faceTo(p, -f[1] + f[0] * 0.3, f[0] + f[1] * 0.3); } return; }
    const [tx, ty] = ai.route[ai.ri];
    if (goTo(p, tx, ty, 1.25)) { ai.ri = (ai.ri + 1) % ai.route.length; ai.wait = ai.route.length > 2 ? 90 + Math.floor(rnd() * 90) : 150; }
    return;
  }
  if (ai.mode === 'beat') { beatTick(p); return; }
  if (ai.mode === 'mug') return;                                              // the muggers are walked by mugRun
  if (ai.mode === 'return') { returnTick(p); return; }
  const [hx, hy, hd, sink] = ai.post;
  if (Math.hypot(p.x - hx, p.y - hy) > 0.2) { p.sink = 0; p.pose = null; goTo(p, hx, hy, 1.3); return; }
  p.moving = false; p.sink = sink || 0; p.pose = ai.pose || null;
  if (ai.look > 0) ai.look--; else { p.dir = hd; p.faceX = DIRV[hd][0]; p.faceY = DIRV[hd][1]; if (!sink && rnd() < 0.004) { ai.look = 90; faceTo(p, DIRV[hd][1] * (rnd() < 0.5 ? 1 : -1), DIRV[hd][0]); } }
}
// ------------------------------------------------------------------ searching: to the place, then three looks around it
function searchTick(p) {
  const ai = p.ai; p.aiming = 0; p.crouch = false;
  if (--ai.searchT <= 0) { ai.sus = Math.min(ai.sus, 0.1); setAware(p, AW.NONE); ai.mode = ai.route ? 'patrol' : ai.home === 'car' ? 'return' : ai.mode === 'search' ? 'post' : ai.mode; ai.path = null; return; }
  if (!ai.sx || Math.hypot(ai.sx - ai.lx, ai.sy - ai.ly) > 1.5) { ai.sx = ai.lx; ai.sy = ai.ly; ai.hops = 0; ai.at = false; }
  if (!ai.at) { if (goTo(p, ai.sx, ai.sy, ai.hostile || LAW.heat >= 2 ? 3.0 : 2.0)) { ai.at = true; ai.lookT = 80; } return; }
  p.moving = false;
  if (--ai.lookT > 0) { if (ai.lookT % 25 === 0) { const f = faceOf(p); faceTo(p, -f[1], f[0]); } return; }
  if (ai.hops++ >= 3) { ai.searchT = Math.min(ai.searchT, 60); return; }
  for (let k = 0; k < 8; k++) {                                              // a spot a few metres off that he can walk to
    const a = rnd() * TAU, r = 2 + rnd() * 4, x = ai.sx + Math.cos(a) * r, y = ai.sy + Math.sin(a) * r;
    if (personFree(x, y, 0.35, p.z, p)) { ai.at = false; ai.sx = x; ai.sy = y; ai.lx = x; ai.ly = y; return; }
  }
}
// ------------------------------------------------------------------ the law
function copBrain(p, mode) {
  const ai = guardAI(p, { mode: mode === 'desk' ? 'post' : mode, cop: true });
  if (mode === 'search' || mode === 'hunt') { ai.home = 'car'; ai.lx = LAW.lastX; ai.ly = LAW.lastY; ai.sus = 0.6; ai.aware = AW.SEARCH; ai.searchT = 60 * 25; ai.armed = LAW.heat >= 2; }
  if (mode === 'beat') { const cr = nearestRing(p.x, p.y); ai.c = cr[0]; ai.r = cr[1]; ai.i = cr[2]; ai.dir = 1; }
  return ai;
}
// a cop never climbs past suspicious over a man nobody wants; one who is after Frank has his gun out
function capLaw(p) {
  const ai = p.ai;
  if (!LAW.heat && ai.aware === AW.ALERT) { ai.sus = 0.3; ai.aware = AW.SUS; }
  if (!LAW.heat && ai.aware === AW.SEARCH && ai.home !== 'car' && tick - ai.awareT > 300) setAware(p, AW.NONE);
  const armed = LAW.heat >= 2; if (ai.armed !== armed) { ai.armed = armed; armFor(p); }
}
// heat 1: he walks up and writes Frank a ticket; if Frank runs, it is evading arrest
function ticketTick(p) {
  const ai = p.ai, [fx, fy, V] = frankPos(), d = Math.hypot(fx - p.x, fy - p.y);
  p.aiming = 0; p.crouch = false;
  if (d > 1.6) {
    goTo(p, fx, fy, V ? 3.6 : 3.0);
    ai.chase = (ai.chase || 0) + 1;
    if (ai.chase === 1) { ai.bark = 'You there! Calder! Hold it!'; ai.barkT = 150; }
    if (ai.chase > 60 * 7 && d > 9) { ai.chase = 0; raiseHeat(2, 'evading', fx, fy); }
    return;
  }
  p.moving = false; faceTo(p, fx - p.x, fy - p.y);
  if ((ai.ticket = (ai.ticket || 0) + 1) < 50) return;
  ai.ticket = 0; ai.chase = 0;
  const f = LAW.heat * 40;
  if (INV.money >= f) { giveMoney(-f); STATS.spent += f; LAW.heat = 0; LAW.reports.length = 0; standDown(); sfxF('coin'); say('Officer', 'That\'s a ' + money(f) + ' fine, paid on the spot. Don\'t let me see you again.'); }
  else say('Officer', 'Can\'t pay? Then you settle it at the precinct, Calder. Today.');
  ai.sus = 0.2; setAware(p, AW.NONE); if (ai.home === 'car') ai.mode = 'return';
}
// back to the patrol car and away; a cop with no car walks off and is gone once nobody is looking
function returnTick(p) {
  const ai = p.ai, V = p.car;
  if (V && !V.gone && !V.wreck && !V.driver) {
    const [dx, dy] = doorPoint(V, -1);
    if (!goTo(p, dx, dy, 1.8)) return;
    for (const q of PEOPLE) if (q.car === V && q.alive && q !== p && q.ai && q.ai.mode === 'return' && Math.hypot(q.x - V.x, q.y - V.y) > 3) return;   // wait for the partner
    for (const q of PEOPLE.slice()) if (q.car === V && q.alive) { const k = PEOPLE.indexOf(q); if (k >= 0) PEOPLE.splice(k, 1); }
    V.cops = 2; V.driver = 'ai'; const n0 = nearestNode(V.x, V.y); trafficInit(V, n0, nodeNeighbours(n0)[0]); V.ai.cruise = 8; V.siren = false;
    return;
  }
  p.street = true; p.persist = false; ai.mode = 'beat'; const cr = nearestRing(p.x, p.y); ai.c = cr[0]; ai.r = cr[1]; ai.i = cr[2]; ai.dir = 1;
}
// a cop on the beat walks round the block like everybody else
function beatTick(p) {
  const ai = p.ai, [tx, ty] = ringCorner(ai.c, ai.r, ai.i), dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
  if (d < 0.4) { const cross = rnd() < 0.3 ? crossFrom(ai.c, ai.r, ai.i) : null; if (cross) { ai.c = cross[0]; ai.r = cross[1]; ai.i = cross[2]; } else ai.i = (ai.i + ai.dir + 4) % 4; return; }
  stepToward(p, dx / d, dy / d, 1.25);
}
// the day's policemen on foot: one or two near Frank by day, one at night
function manageBeat() {
  if (tick % 120 !== 57) return;
  const h = clockHour(), want = h >= 7 && h < 21 ? 2 : 1;
  let n = 0; for (const p of PEOPLE) if (p.team === 'law' && p.alive && p.ai && p.ai.mode === 'beat') n++;
  if (n >= want) return;
  const [fx, fy] = frankPos();
  for (let tries = 0; tries < 6; tries++) {
    const c = Math.floor(rnd() * NCOL), r = Math.floor(rnd() * NROW), [x, y] = ringCorner(c, r, Math.floor(rnd() * 4)), d = Math.hypot(x - fx, y - fy);
    if (d < 25 || d > 60 || !offScreen(x, y) || !personFree(x, y, 0.35, 0)) continue;
    const p = makePerson('cop', 'cop', x, y, { hp: 100, hold: 'none' });
    p.team = 'law'; p.gun = makeGun('service'); p.street = true; p.ai = copBrain(p, 'beat');
    return;
  }
}
// ------------------------------------------------------------------ a man for a zone: a goon at a post or on a route
function spawnGoon(F, x, y, o) {
  const cast = o.cast || ['goon', 'goon2', 'goon3'][hashi(Math.floor(x * 7), Math.floor(y * 5)) % 3];
  const p = makePerson('goon', cast, x, y, { F: F || null, hp: o.hp || 100, hold: 'none' });
  p.team = 'goons'; p.gun = makeGun(o.gun || 'm1911'); p.persist = !!o.persist; p.torch = !!o.torch; p.roster = o.roster || null;
  p.ai = guardAI(p, { zone: o.zone, guarded: !!o.guarded, hostile: !!o.hostile || zoneHot(o.zone), armed: !!o.armed, route: o.route || null, mode: o.route ? 'patrol' : 'post', role: o.role || 'hold', pose: o.pose || null });
  p.ai.post = [x, y, o.dir || 0, o.sink || 0];
  if (o.route) p.ai.ri = hashi(Math.floor(x), Math.floor(y)) % o.route.length;
  p.dir = o.dir || 0; faceTo(p, DIRV[p.dir][0], DIRV[p.dir][1]); p.sink = o.sink || 0;
  if (p.ai.hostile && zoneHot(o.zone)) { const Z = ZSTATE[o.zone]; p.ai.lx = Z.x; p.ai.ly = Z.y; p.ai.sus = 0.6; p.ai.aware = AW.SEARCH; p.ai.searchT = 60 * 20; }
  armFor(p);
  p.onDown = () => { if (p.roster) p.roster.gone = CLOCK.day; };
  return p;
}
