// =================================================================== CASING THE JOINT: HOLD TAB
// Time slows to half. Every guard and cop near Frank shows what he can see right now: his cone, as far as the
// light would let him make Frank out, stopped by walls; the routes the patrols walk; how far Frank's steps carry.
// A cone lights the ground it covers, brighter in its near half where he makes Frank out quicker.
const CASE = { on: false, slow: 0 };
const CASEM = new Uint8Array(SCR_N);                                // this frame's cones: 0 none, 1 far, 2 near
function caseTick() { CASE.on = !!INPUT.keys.Tab && GAME.mode === 'play' && !!FRANK && FRANK.alive && !UI.mode; }
function fillTri(ax, ay, bx, by, cx, cy, lv) {                      // a flat triangle into the cone mask
  if (ay > by) [ax, ay, bx, by] = [bx, by, ax, ay]; if (ay > cy) [ax, ay, cx, cy] = [cx, cy, ax, ay]; if (by > cy) [bx, by, cx, cy] = [cx, cy, bx, by];
  const y0 = Math.max(0, Math.ceil(ay)), y1 = Math.min(H - 1, Math.floor(cy));
  for (let y = y0; y <= y1; y++) {
    const xa = cy !== ay ? ax + (cx - ax) * (y - ay) / (cy - ay) : ax;
    const xb = y < by ? (by !== ay ? ax + (bx - ax) * (y - ay) / (by - ay) : bx) : (cy !== by ? bx + (cx - bx) * (y - by) / (cy - by) : bx);
    const l = Math.max(0, Math.ceil(Math.min(xa, xb))), r = Math.min(W - 1, Math.floor(Math.max(xa, xb)));
    for (let x = l; x <= r; x++) { const k = y * W + x; if (CASEM[k] < lv) CASEM[k] = lv; }
  }
}
function lineTo(x0, y0, x1, y1, c) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let k = 0; k <= n; k++) pset(Math.round(lerp(x0, x1, k / n)), Math.round(lerp(y0, y1, k / n)), c); }
function visionCone(p, cx, cy) {
  const ai = p.ai, f = faceOf(p), a0 = Math.atan2(f[1], f[0]), half = Math.acos(ai.aware >= AW.SEARCH ? 0.2 : 0.5), range = viewDist(p, FRANK);
  const ez = p.z + 1.55, gz = p.z + 0.02, N = 18, far = [], near = [];
  const at = (t, dx, dy) => [Math.round(isoX(p.x + dx * t, p.y + dy * t)) - cx, Math.round(isoY(p.x + dx * t, p.y + dy * t, gz)) - cy];
  for (let k = 0; k <= N; k++) {
    const a = a0 - half + (2 * half) * k / N, dx = Math.cos(a), dy = Math.sin(a);
    castRay(p.x, p.y, ez, dx, dy, -0.3 / range, range, p, null, true, p.z);
    const t = RAY.kind === 'none' ? range : RAY.t;
    far.push(at(t, dx, dy)); near.push(at(Math.min(t, range * 0.5), dx, dy));
  }
  const ox = Math.round(isoX(p.x, p.y)) - cx, oy = Math.round(isoY(p.x, p.y, gz)) - cy;
  for (let k = 0; k < N; k++) { fillTri(ox, oy, far[k][0], far[k][1], far[k + 1][0], far[k + 1][1], 1); fillTri(ox, oy, near[k][0], near[k][1], near[k + 1][0], near[k + 1][1], 2); }
  return { ox, oy, far, c: ai.aware === AW.ALERT ? C.RED : ai.aware >= AW.SUS ? C.AMB : C.CREAM };
}
function dotted(x0, y0, x1, y1, z, cx, cy, c) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 3);
  for (let k = 0; k <= n; k += 2) pset(Math.round(isoX(lerp(x0, x1, k / n), lerp(y0, y1, k / n))) - cx, Math.round(isoY(lerp(x0, x1, k / n), lerp(y0, y1, k / n), z)) - cy, c);
}
function drawCase(cx, cy) {
  if (!CASE.on) return;
  ditherRect(0, 0, W, H, SHD, 0.35);
  const [fx, fy] = frankPos(), fF = FRANK.inCar ? null : FRANK.F || null, cones = [], watch = [];
  CASEM.fill(0, 0, W * H);
  for (const p of PEOPLE) {
    const ai = p.ai; if (!ai || !ai.guard || !p.alive || p.down || p === FRANK || (p.F || null) !== fF || !personShown(p)) continue;
    if (Math.hypot(p.x - fx, p.y - fy) > 32) continue;
    watch.push(p); cones.push(visionCone(p, cx, cy));
  }
  for (let k = 0; k < W * H; k++) { const m = CASEM[k]; if (m) fb[k] = m === 1 ? LIT[fb[k]] : LIT2[fb[k]]; }
  for (const Q of cones) {
    const n = Q.far.length - 1;
    lineTo(Q.ox, Q.oy, Q.far[0][0], Q.far[0][1], Q.c); lineTo(Q.ox, Q.oy, Q.far[n][0], Q.far[n][1], Q.c);
    for (let k = 0; k < n; k++) lineTo(Q.far[k][0], Q.far[k][1], Q.far[k + 1][0], Q.far[k + 1][1], Q.c);
  }
  for (const p of watch) {                                                           // the rounds the patrols walk
    const ai = p.ai; if (!ai.route || ai.aware !== AW.NONE) continue;
    for (let k = 0; k < ai.route.length; k++) { const a = ai.route[k], b = ai.route[(k + 1) % ai.route.length]; dotted(a[0], a[1], b[0], b[1], p.z, cx, cy, C.PALEY); const sx = Math.round(isoX(a[0], a[1])) - cx, sy = Math.round(isoY(a[0], a[1], p.z)) - cy; fillRect(sx - 1, sy - 1, 3, 3, C.PALEY); }
  }
  if (!FRANK.inCar && !FRANK.crouch) {                                              // how far his footsteps carry
    const r = (PLAYER.run ? 9 : 3.5) * PSTAT.noiseMul;
    for (let k = 0; k < 40; k += 2) { const a = k / 40 * TAU; pset(Math.round(isoX(fx + Math.cos(a) * r, fy + Math.sin(a) * r)) - cx, Math.round(isoY(fx + Math.cos(a) * r, fy + Math.sin(a) * r, FRANK.z)) - cy, C.S3); }
  }
  // what can be opened near him, and what is locked
  for (const K of CONTAINERS) { if ((K.F || null) !== fF || K.body || Math.hypot(K.x - fx, K.y - fy) > 12) continue; const sx = Math.round(isoX(K.x, K.y)) - cx, sy = Math.round(isoY(K.x, K.y, (K.F && K.F.f > 0 ? K.F.z : 0) + 1.2)) - cy; fillRect(sx - 1, sy - 1, 3, 3, K.locked ? C.CORAL : K.grid && !K.grid.items.length && !K.cash ? C.ST1 : C.GRNL); }
}
