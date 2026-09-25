// =================================================================== THE GOONS: PATHS, COVER, NERVE
// A 0.5 m walk grid around the fight (40 m square) for A*; cover points ring every crate, bollard, car and
// corner. A goon wants a spot Frank cannot see when he crouches but can shoot from when he stands.
const NAV = { x0: 0, y0: 0, gw: 80, gh: 80, cell: 0.5, g: new Uint8Array(6400), built: -999, cover: [], cx: 0, cy: 0, z: 0, clip: null, r: 0.32 };   // z: the floor it is built on; clip: the room of an upper floor; r: clearance
const NAVCARS = [];
function vehicleAt(x, y, r) { for (const V of NAVCARS) if (distToVehicle(V, x, y) < r) return true; return false; }
function buildNav(cx, cy) {
  NAV.cx = cx; NAV.cy = cy; NAV.x0 = cx - NAV.gw * NAV.cell / 2; NAV.y0 = cy - NAV.gh * NAV.cell / 2;
  NAVCARS.length = 0; if (NAV.z < 0.5) for (const V of VEH) if (!V.gone && Math.abs(V.x - cx) < 27 && Math.abs(V.y - cy) < 27) NAVCARS.push(V);
  for (let j = 0; j < NAV.gh; j++) for (let i = 0; i < NAV.gw; i++) {
    const x = NAV.x0 + (i + 0.5) * NAV.cell, y = NAV.y0 + (j + 0.5) * NAV.cell;
    const K = NAV.clip, out = K && (x < K.x0 + 0.3 || y < K.y0 + 0.3 || x > K.x1 - 0.3 || y > K.y1 - 0.3);
    NAV.g[j * NAV.gw + i] = out || blockedAt(x, y, NAV.r, NAV.z) || vehicleAt(x, y, NAV.r) ? 1 : 0;
  }
  NAV.built = tick;
  buildCover();
}
function navCell(x, y) { const i = Math.floor((x - NAV.x0) / NAV.cell), j = Math.floor((y - NAV.y0) / NAV.cell); return (i < 0 || j < 0 || i >= NAV.gw || j >= NAV.gh) ? -1 : j * NAV.gw + i; }
function navFree(c) { return c >= 0 && !NAV.g[c]; }
function navLine(a, b) {                                   // grid line of sight between two cells
  let x0 = a % NAV.gw, y0 = (a / NAV.gw) | 0; const x1 = b % NAV.gw, y1 = (b / NAV.gw) | 0;
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx - dy;
  for (;;) { if (NAV.g[y0 * NAV.gw + x0]) return false; if (x0 === x1 && y0 === y1) return true; const e2 = 2 * e; if (e2 > -dy) { e -= dy; x0 += sx; } if (e2 < dx) { e += dx; y0 += sy; } }
}
// ------------------------------------------------------------------ A* with a binary heap
const AS = { g: new Float32Array(6400), came: new Int32Array(6400), closed: new Uint8Array(6400), heap: new Int32Array(80000), f: new Float32Array(6400) };
function heapPush(n, c) { let i = n; AS.heap[i] = c; while (i > 0) { const p = (i - 1) >> 1; if (AS.f[AS.heap[p]] <= AS.f[AS.heap[i]]) break; const t = AS.heap[p]; AS.heap[p] = AS.heap[i]; AS.heap[i] = t; i = p; } return n + 1; }
function heapPop(n) {
  const top = AS.heap[0]; n--; AS.heap[0] = AS.heap[n]; let i = 0;
  for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < n && AS.f[AS.heap[l]] < AS.f[AS.heap[m]]) m = l; if (r < n && AS.f[AS.heap[r]] < AS.f[AS.heap[m]]) m = r; if (m === i) break; const t = AS.heap[m]; AS.heap[m] = AS.heap[i]; AS.heap[i] = t; i = m; }
  return top;
}
function navNearestFree(c) {
  if (navFree(c)) return c; if (c < 0) return -1;
  const ci = c % NAV.gw, cj = (c / NAV.gw) | 0;
  for (let r = 1; r < 6; r++) for (let j = cj - r; j <= cj + r; j++) for (let i = ci - r; i <= ci + r; i++) {
    if (i < 0 || j < 0 || i >= NAV.gw || j >= NAV.gh) continue; const k = j * NAV.gw + i; if (!NAV.g[k]) return k;
  }
  return -1;
}
function navPath(sx, sy, tx, ty) {
  const s = navNearestFree(navCell(sx, sy)), t = navNearestFree(navCell(tx, ty));
  if (s < 0 || t < 0) return null;
  const GW = NAV.gw, n = NAV.gw * NAV.gh, tI = t % GW, tJ = (t / GW) | 0;
  AS.g.fill(1e9, 0, n); AS.closed.fill(0, 0, n);
  const h = c => { const dx = Math.abs(c % GW - tI), dy = Math.abs(((c / GW) | 0) - tJ); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
  AS.g[s] = 0; AS.f[s] = h(s); AS.came[s] = -1;
  let hn = heapPush(0, s), iter = 0;
  while (hn > 0 && iter++ < 8000) {
    const c = heapPop(hn); hn--;
    if (AS.closed[c]) continue; AS.closed[c] = 1;
    if (c === t) break;
    const ci = c % GW, cj = (c / GW) | 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= GW || j >= NAV.gh) continue;
      const k = j * GW + i; if (NAV.g[k] || AS.closed[k]) continue;
      if (di && dj && (NAV.g[cj * GW + i] || NAV.g[j * GW + ci])) continue;      // no cutting corners
      const g = AS.g[c] + (di && dj ? 1.414 : 1);
      if (g < AS.g[k] && hn < 79990) { AS.g[k] = g; AS.f[k] = g + h(k); AS.came[k] = c; hn = heapPush(hn, k); }
    }
  }
  if (!AS.closed[t]) return null;
  const cells = []; for (let c = t; c >= 0; c = AS.came[c]) cells.push(c); cells.reverse();
  const out = []; let a = 0;                                // string-pull: keep only the corners
  while (a < cells.length - 1) { let b = cells.length - 1; while (b > a + 1 && !navLine(cells[a], cells[b])) b--; out.push(cells[b]); a = b; }
  return out.map(c => [NAV.x0 + (c % GW + 0.5) * NAV.cell, NAV.y0 + (((c / GW) | 0) + 0.5) * NAV.cell]);
}
// ------------------------------------------------------------------ cover points
function buildCover() {
  const pts = [], add = (x, y, h) => { if (navFree(navCell(x, y))) pts.push({ x, y, h, by: null }); };
  const R = 19, cx = NAV.cx, cy = NAV.cy;
  for (const S of staticsNear(cx - R, cy - R, cx + R, cy + R)) {
    const b0 = S.z0 || 0; if (S.h < 0.6 || b0 > NAV.z + 0.5 || b0 + S.h < NAV.z + 0.6) continue;
    if (S.circle) { for (let k = 0; k < 8; k++) add(S.cx + Math.cos(k * TAU / 8) * (S.r + 0.55), S.cy + Math.sin(k * TAU / 8) * (S.r + 0.55), S.h); continue; }
    const o = 0.55;
    for (let x = S.x0 + 0.3; x <= S.x1 - 0.3 + 1e-6; x += 0.8) { add(x, S.y0 - o, S.h); add(x, S.y1 + o, S.h); }
    for (let y = S.y0 + 0.3; y <= S.y1 - 0.3 + 1e-6; y += 0.8) { add(S.x0 - o, y, S.h); add(S.x1 + o, y, S.h); }
  }
  if (NAV.z < 0.5) for (const V of VEH) {
    if (V.gone || V.kin || vehSpeed(V) > 1 || Math.hypot(V.x - cx, V.y - cy) > R) continue;
    const c = Math.cos(V.a), s = Math.sin(V.a);
    for (let u = -V.M.hl + 0.4; u <= V.M.hl - 0.4; u += 0.9) for (const side of [-1, 1]) { const v = side * (V.M.hw + 0.6); add(V.x + u * c - v * s, V.y + u * s + v * c, V.M.height); }
    for (const side of [-1, 1]) for (const v of [-0.5, 0.5]) { const u = side * (V.M.hl + 0.6); add(V.x + u * c - v * s, V.y + u * s + v * c, V.M.height); }
  }
  NAV.cover = pts;
}
function frankPos() { const V = FRANK.inCar; return V ? [V.x, V.y, V] : [FRANK.x, FRANK.y, null]; }
function coverScore(p, c, fx, fy, fV) {
  const dF = Math.hypot(c.x - fx, c.y - fy); if (dF < 4.5 || dF > 24) return 1e9;
  if (c.by && c.by !== p) return 1e9;
  for (const q of PEOPLE) if (q !== p && q.team === p.team && q.alive && Math.hypot(q.x - c.x, q.y - c.y) < 1.1) return 1e9;
  if (lineClear(fx, fy, NAV.z + 1.3, c.x, c.y, NAV.z + 0.75, fV, null, NAV.z)) return 1e9;    // Frank would see him crouched
  const peek = lineClear(c.x, c.y, NAV.z + 1.4, fx, fy, NAV.z + 1.1, null, fV, NAV.z);
  const dMe = Math.hypot(c.x - p.x, c.y - p.y);
  let s = (peek ? 0 : 7) + Math.abs(dF - p.ai.range) * 0.45 + dMe * 0.3;
  if (p.ai.role === 'flank') { const a0 = Math.atan2(p.ai.homeY - fy, p.ai.homeX - fx), a1 = Math.atan2(c.y - fy, c.x - fx); s -= Math.min(3, Math.abs(Math.atan2(Math.sin(a1 - a0), Math.cos(a1 - a0))) * 3); }
  return s;
}
function pickCover(p) {
  const [fx, fy, fV] = frankPos();
  let best = null, bs = 1e8;
  for (const c of NAV.cover) { if (Math.hypot(c.x - p.x, c.y - p.y) > 16) continue; const s = coverScore(p, c, fx, fy, fV); if (s < bs) { bs = s; best = c; } }
  if (p.ai.cover) p.ai.cover.by = null;
  p.ai.cover = best; if (best) best.by = p;
  return best;
}
