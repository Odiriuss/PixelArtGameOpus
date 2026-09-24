// =================================================================== AI DRIVERS
// Pure pursuit along a polyline: aim at a point one lookahead down the path, steer by the bicycle-model arc to
// it. Speed is planned from the corners ahead (brake early enough to take each one at its speed), obstacles in
// the lane ahead, and, for the black sedan, how far behind Frank is. Stuck drivers back up and try again.
function segLen(P, k) { return Math.hypot(P[k + 1][0] - P[k][0], P[k + 1][1] - P[k][1]); }
function turnAngle(P, k) {                               // heading change at vertex k
  const ax = P[k][0] - P[k - 1][0], ay = P[k][1] - P[k - 1][1], bx = P[k + 1][0] - P[k][0], by = P[k + 1][1] - P[k][1];
  return Math.abs(Math.atan2(ax * by - ay * bx, ax * bx + ay * by));
}
function aiInit(V, path, o) {
  V.ai = Object.assign({ path, i: 0, t: 0, cruise: 10, band: 1, corner: 6.5, decel: 6.5, stopAtEnd: false, done: false,
    stuck: 0, rev: 0, revSteer: 0, fails: 0, lastI: 0, off: 0, offWant: 0, wait: 0, mode: 'traffic', hitBy: null, noBlock: false, look: 4 }, o || {});
  return V.ai;
}
// project onto the current segment and move the index along
function aiTrack(V, ai) {
  const P = ai.path;
  for (;;) {
    const a = P[ai.i], b = P[ai.i + 1];
    const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1;
    ai.t = ((V.x - a[0]) * dx + (V.y - a[1]) * dy) / L2;
    if (ai.t < 1 || ai.i >= P.length - 2) break;
    ai.i++;
  }
  ai.t = clamp(ai.t, 0, 1);
}
function aiTarget(V, ai, Ld) {
  const P = ai.path;
  let k = ai.i, rem = segLen(P, k) * (1 - ai.t), x = lerp(P[k][0], P[k + 1][0], ai.t), y = lerp(P[k][1], P[k + 1][1], ai.t);
  while (Ld > rem && k < P.length - 2) { Ld -= rem; k++; x = P[k][0]; y = P[k][1]; rem = segLen(P, k); }
  const L = segLen(P, k) || 1, ux = (P[k + 1][0] - P[k][0]) / L, uy = (P[k + 1][1] - P[k][1]) / L, d = Math.min(Ld, rem);
  return [x + ux * d - uy * ai.off, y + uy * d + ux * ai.off];
}
function aiRemaining(ai) { const P = ai.path; let s = segLen(P, ai.i) * (1 - ai.t); for (let k = ai.i + 1; k < P.length - 1; k++) s += segLen(P, k); return s; }
// nearest thing in the corridor ahead (along the heading, or along the way the driver is about to steer):
// returns [distance, the thing]
function aiObstacle(V, reach, widen, ux, uy) {
  const c = ux === undefined ? Math.cos(V.a) : ux, s = ux === undefined ? Math.sin(V.a) : uy, hw = V.M.hw + (widen === undefined ? 0.3 : widen);
  let best = reach, who = null;
  const test = (x, y, r, o) => {
    const dx = x - V.x, dy = y - V.y, u = dx * c + dy * s - V.M.hl, v = -dx * s + dy * c;
    if (u < -0.5 || u > best || Math.abs(v) > hw + r) return;
    best = Math.max(0, u - r); who = o;
  };
  for (const O of VEH) {
    if (O === V || O.gone) continue;
    const rel = O.a - Math.atan2(s, c);
    test(O.x, O.y, Math.abs(Math.sin(rel)) * O.M.hl + Math.abs(Math.cos(rel)) * O.M.hw + (O.kin ? 0.5 : 0.1), O);
  }
  for (const p of PEOPLE) if (p.alive !== false && p.visible && !p.inCar) test(p.x, p.y, 0.4, p);
  return [best, who];
}
function aiDrive(V) {
  const ai = V.ai;
  if (!ai || V.wreck || V.sinking) { V.thr = 0; V.brk = V.wreck ? 0.4 : 0; V.hand = 0; return; }
  const M = V.M, fwd = vehFwd(V);
  aiTrack(V, ai);
  // lateral offset (overtaking) eases toward what is wanted
  ai.off += clamp(ai.offWant - ai.off, -1.8 * DT, 1.8 * DT);
  const Ld = ai.look + Math.abs(fwd) * 0.45, [tx, ty] = aiTarget(V, ai, Ld);
  const c = Math.cos(V.a), s = Math.sin(V.a), lx = tx - V.x, ly = ty - V.y, u = lx * c + ly * s, v = -lx * s + ly * c;
  const ld = Math.hypot(u, v) || 1, alpha = Math.atan2(v, u);
  const maxSteer = 0.6 * M.turn / (1 + Math.abs(fwd) / 13);
  let steer = clamp(Math.atan(2 * M.wb * Math.sin(alpha) / ld) / maxSteer, -1, 1);
  // speed plan: every corner within 60 m (turns closer than 8 m apart count as one), braking from here at ai.decel;
  // a waypoint may carry its own limit (alley mouths, the gate)
  const P = ai.path;
  let vt = ai.cruise * ai.band, dist = segLen(P, ai.i) * (1 - ai.t);
  if (P[ai.i][2]) vt = Math.min(vt, P[ai.i][2] + 2);
  for (let k = ai.i + 1; k < P.length - 1 && dist < 60; k++) {
    let th = turnAngle(P, k);
    if (segLen(P, k) < 8 && k + 1 < P.length - 1) th += turnAngle(P, k + 1);
    if (segLen(P, k - 1) < 8 && k - 1 > 0) th += turnAngle(P, k - 1);
    if (th > 0.2) { const vc = ai.corner * (1 + Math.max(0, 1.4 - Math.min(th, 1.57))); vt = Math.min(vt, Math.sqrt(vc * vc + 2 * ai.decel * dist)); }
    if (P[k][2]) vt = Math.min(vt, Math.sqrt(P[k][2] * P[k][2] + 2 * ai.decel * dist));
    dist += segLen(P, k);
  }
  if (Math.abs(alpha) > 0.5) vt = Math.min(vt, ai.corner * (1.6 - Math.min(1, Math.abs(alpha))));   // off line: slow down to recover
  if (ai.stopAtEnd) {
    const rem = aiRemaining(ai);
    vt = Math.min(vt, Math.sqrt(2 * ai.decel * Math.max(0, rem - 0.8)));
    if (rem < 1.5 && Math.abs(fwd) < 0.6) ai.done = true;
  }
  // traffic and people ahead: follow, or (in a chase, or behind a car that is not going anywhere) go round
  if (ai.ramT > 0) ai.ramT--;                             // a getaway driver who is boxed in drives through it
  if (!ai.noBlock && !(ai.ramT > 0)) {
    const [od, who] = aiObstacle(V, 16, 0.3, u / ld * Math.cos(V.a) - v / ld * Math.sin(V.a), u / ld * Math.sin(V.a) + v / ld * Math.cos(V.a));
    if (who) {
      const ws = who.M ? vehFwd(who) * Math.cos(who.a - V.a) : 0, want = Math.max(fwd, vt);
      const dead = who.M && (who.parked || who.wreck || (!who.driver && vehSpeed(who) < 0.5));
      const pass = who.M && !who.kin && od < 14 && ws < want - 1.5 && (ai.mode === 'chase' || (dead && ai.wait > 150));
      if (pass && ai.offWant === 0) { const side = aiSideClear(V, -1) ? -1 : aiSideClear(V, 1) ? 1 : 0; ai.offWant = side * 3.0; ai.offT = 150; }
      if (!pass || ai.offWant === 0) vt = Math.min(vt, Math.max(0, ws) + Math.max(0, od - 3) * 0.9);
      if (od < 3.5 && Math.abs(fwd) < 0.5) ai.wait++; else ai.wait = Math.max(0, ai.wait - 1);
      if (ai.mode === 'chase' && who.M && ai.wait > 100) { ai.ramT = 100; ai.wait = 0; V.horn = 40; }
      if (ai.wait === 90 && !who.M) V.horn = 40;
    } else ai.wait = 0;
  }
  if (ai.offT > 0 && --ai.offT === 0) ai.offWant = 0;
  // pedals
  let thr = 0, brk = 0;
  if (fwd < vt - 0.3) thr = clamp((vt - fwd) * 0.45, 0.25, 1);
  else if (fwd > vt + 0.6) brk = clamp((fwd - vt) * 0.6, 0.2, 1);
  // stuck: pushing without moving -> back up with the wheel turned the other way
  if (ai.rev > 0) { ai.rev--; V.thr = 0; V.brk = 1; V.steer = ai.revSteer; V.hand = 0; return; }
  if (thr > 0.4 && Math.abs(fwd) < 0.5 && vt > 1) { if (++ai.stuck > 70) { ai.stuck = 0; ai.rev = 80; ai.revSteer = -Math.sign(steer || 1); ai.fails++; } } else ai.stuck = Math.max(0, ai.stuck - 2);
  if (ai.i !== ai.lastI) { ai.lastI = ai.i; ai.fails = 0; }
  V.thr = thr; V.brk = brk; V.steer = steer; V.hand = 0;
}
function aiSideClear(V, side) {
  const c = Math.cos(V.a), s = Math.sin(V.a), gx = V.x - s * side * 3 + c * 5, gy = V.y + c * side * 3 + s * 5;
  const ghost = { x: gx, y: gy, a: V.a, M: { hl: V.M.hl + 1.5, hw: V.M.hw + 0.2 } };
  for (const O of VEH) if (O !== V && !O.gone && Math.abs(O.x - gx) < 12 && Math.abs(O.y - gy) < 12 && obbVsObb(ghost, O)) return false;
  if (Math.abs(gx - AV[1]) < 2.6 && VEH.some(O => O.kin && !O.gone && Math.abs(O.y - gy) < 24)) return false;   // not onto the rails with the streetcar near
  const r = ghost.M.hl + 1;
  for (const S of staticsNear(gx - r, gy - r, gx + r, gy + r)) {
    if (S.h < 0.3) continue;
    if (S.circle ? obbVsCircle(ghost, S.cx, S.cy, S.r) : obbVsBox(ghost, S)) return false;
  }
  return surfAt(gx, gy) !== 2;
}
// a driver who has backed up three times without getting anywhere, while nobody is looking, is put back on the road
function offScreen(x, y) { const sx = isoX(x, y) - cam.x, sy = isoY(x, y, 0) - cam.y; return sx < -50 || sy < -50 || sx > W + 50 || sy > H + 70; }
function aiRescue(V) {
  const ai = V.ai, P = ai.path;
  for (let k = ai.i + 1; k < P.length - 1; k++) {
    const x = P[k][0], y = P[k][1], a = Math.atan2(P[k + 1][1] - y, P[k + 1][0] - x);
    if (!offScreen(x, y) || VEH.some(O => O !== V && !O.gone && Math.hypot(O.x - x, O.y - y) < O.M.hl + V.M.hl + 1)) continue;
    V.x = x + Math.cos(a) * 1.5; V.y = y + Math.sin(a) * 1.5; V.a = a; V.w = 0;
    const v = Math.min(ai.cruise * ai.band, 8); V.vx = Math.cos(a) * v; V.vy = Math.sin(a) * v;
    ai.i = k; ai.t = 0; ai.fails = 0; ai.rev = 0; ai.stuck = 0; ai.offWant = 0; ai.off = 0;
    return true;
  }
  return false;
}
// ------------------------------------------------------------------ traffic: wander the street grid
function trafficPath(nodes) { return lanePath(nodes); }
function trafficNext(prev, cur) {
  const nb = nodeNeighbours(cur).filter(n => n !== prev);
  return nb[Math.floor(rnd() * nb.length)];
}
function trafficInit(V, n0, n1) {
  const nodes = [n0, n1]; while (nodes.length < 4) nodes.push(trafficNext(nodes[nodes.length - 2], nodes[nodes.length - 1]));
  const ai = aiInit(V, trafficPath(nodes), { cruise: 8 + rnd() * 2.5, corner: 5.5, decel: 5, mode: 'traffic' });
  ai.nodes = nodes;
  return ai;
}
function trafficUpdate(V) {
  const ai = V.ai; if (!ai || ai.mode !== 'traffic' && ai.mode !== 'flee') return;
  if (ai.i >= 1 && ai.t > 0.05) {                        // past the first corner: roll the node window along
    const nodes = ai.nodes; nodes.shift(); nodes.push(trafficNext(nodes[nodes.length - 2], nodes[nodes.length - 1]));
    ai.path = trafficPath(nodes); ai.i = 0; aiTrack(V, ai);
  }
}
