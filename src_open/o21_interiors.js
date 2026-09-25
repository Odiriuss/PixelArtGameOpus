// =================================================================== INTERIORS: THE SHELL OF EVERY FLOOR, PARTITIONS, STAIRS
// A floor is drawn as the cutaway of the main game: the floor, the two back walls full height (with windows where
// no neighbour stands against them), the two front walls cut at knee height with a dark cap, partitions cut the same
// way so every room of the floor can be seen at once. Collision is full height. Furniture is placed through free(),
// which keeps a path clear from every door and keeps pieces from overlapping.
function intBounds(B) { return { x0: B.x0 + WT, y0: B.y0 + WT, x1: B.x1 - WT, y1: B.y1 - WT }; }
function cutZ(F) { return F.z + 0.4; }
const PH = 0.4;                                              // how much of a partition is drawn
// is the wall of B on this face (a point a along it) against another building?
function abutted(B, face, a) {
  for (let i = 1; i < BUILDINGS.length; i++) {
    const O = BUILDINGS[i]; if (O === B) continue;
    if (face === '-x' && Math.abs(O.x1 - B.x0) < 0.05 && a > O.y0 && a < O.y1) return true;
    if (face === '-y' && Math.abs(O.y1 - B.y0) < 0.05 && a > O.x0 && a < O.x1) return true;
  }
  return false;
}
// windows along a back wall: [a0, a1] ranges in world coordinates along the wall
function backWindows(B, face, a0, a1, gaps) {
  const out = [], len = a1 - a0, n = Math.max(0, Math.floor((len - 0.8) / 2.2));
  for (let k = 0; k < n; k++) {
    const c = a0 + (len - n * 2.2) / 2 + k * 2.2 + 1.1;
    if (abutted(B, face, c) || gaps.some(g => c + 0.6 > g[0] - 0.3 && c - 0.6 < g[1] + 0.3)) continue;
    out.push([c - 0.5, c + 0.5]);
  }
  return out;
}
function doorGaps(B, face) { return (B.doorList || []).filter(D => D.face === face).map(D => { const c = face === '-x' || face === 'x' ? D.cy : D.cx; return [c - D.w / 2, c + D.w / 2, D]; }); }
// the pixels of a back wall: the wall's own look (u along it, z above the floor), windows, doorways
function backPx(wall, a, zr, wins, gaps, px, py) {
  for (const g of gaps) if (a >= g[0] - 0.08 && a < g[1] + 0.08 && zr < g[2].hgt + 0.08) {
    if (a < g[0] || a >= g[1] || zr >= g[2].hgt) return C.DBR;                                         // the frame
    curExt = EXT_PANE; return zr < 0.08 ? E(C.HAZE) : E(bay(px, py) < 0.2 ? C.WHITE : C.S3);           // the street through the door
  }
  for (const w of wins) if (a >= w[0] - 0.07 && a < w[1] + 0.07 && zr >= 0.85 && zr < 2.45) {
    if (a < w[0] || a >= w[1] || zr < 0.93 || zr >= 2.37 || Math.abs(a - (w[0] + w[1]) / 2) < 0.03 || Math.abs(zr - 1.75) < 0.03) return zr < 0.93 ? C.CREAM : C.TRIM;
    curExt = EXT_PANE;
    const f = frac((a - w[0]) * 0.9 + zr * 0.6);
    return E(f < 0.08 ? C.WHITE : zr < 1.1 ? C.HAZE : f > 0.7 ? C.S3 : C.WL);
  }
  return wall(a, zr, px, py);
}
// wall looks: u along the wall, z above the floor
const WALLS = {
  paper: (t, s) => papered(t, s, C.DBR, C.BRN, C.DBR, 0.95, 0.3),
  plain: (c, d) => (u, z, px, py) => z < 0.12 ? C.INK : (z < 0.95 && z > 0.9 ? d : c),
  brick: (u, z, px, py) => MATL.brickD(u, z, px, py),
  tile: (c, g) => (u, z) => z < 0.1 ? C.INK : (frac(u / 0.3) < 0.08 || frac(z / 0.3) < 0.08) ? g : c,
  plank: (u, z, px, py) => MATL.plank(u, z, px, py),
  steel: (u, z, px, py) => z < 0.1 ? C.INK : (frac(u / 1.2) < 0.04 ? C.S0 : (frac(z / 0.6) < 0.03 ? C.S0 : C.S1)),
  panel: (c, d) => (u, z) => z < 0.1 ? C.INK : (frac(u / 0.6) < 0.05 || (z > 1.1 && z < 1.14) ? d : c)
};
const FLOORS = {
  planks: (a, b, c) => planks(1, a || C.WOOD, b || C.BRN, c || C.DBR, 3),
  checker: (a, b) => checker(a, b, 0.5),
  tile: (a, g) => checker(a, a, 0.35, g),
  concrete: (x, y, px, py) => vnoise(x * 1.3, y * 1.3, 17) + bay(px, py) * 0.2 > 0.8 ? C.ST0 : (frac(x / 3) < 0.01 || frac(y / 3) < 0.01 ? C.ST0 : C.ST1),
  lino: (a, b) => (x, y, px, py) => (frac(x / 0.5) < 0.5) !== (frac(y / 0.5) < 0.5) ? a : b,
  marble: (x, y, px, py) => (frac(x / 1.2) < 0.03 || frac(y / 1.2) < 0.03) ? C.STS : (vnoise(x * 2, y * 2, 23) > 0.7 ? C.CRS : C.CREAM),
  carpet: (c, d) => (x, y, px, py) => ((Math.floor(x * 2.5) + Math.floor(y * 2.5)) & 1) && hash(Math.floor(x * 2.5), Math.floor(y * 2.5)) < 0.4 ? d : c,
  boards: (x, y, px, py) => boardSh(x, y, px, py, 0)
};
// ------------------------------------------------------------------ the shell
function beginFloor(F) { dlInt = F; dlBid = F.B.id; mat(0); tag(0); F.used = []; F.spots = F.spots || []; F.clear = []; F.shelfX = []; F.shelfY = []; }
function endFloor() { dlInt = null; dlBid = 0; mat(MAT_OUTSIDE); }
function shell(F, st) {
  const B = F.B, R = intBounds(B), z = F.z, zr = z + F.h, cz = cutZ(F), cap = st.cap === undefined ? C.INK : st.cap;
  const wx = st.wallX || st.wall, wy = st.wallY || st.wall;
  const gx = F.f === 0 ? doorGaps(B, '-x') : [], gy = F.f === 0 ? doorGaps(B, '-y') : [];
  const winX = st.noWin ? [] : backWindows(B, '-x', R.y0, R.y1, gx), winY = st.noWin ? [] : backWindows(B, '-y', R.x0, R.x1, gy);
  F.R = R;
  cFloor(R.x0, R.y0, R.x1, R.y1, z, st.floor);
  cWallX(R.x0, R.y0, B.y1, z, zr, (y, zz, px, py) => backPx(wx, y, zz - z, winX, gx, px, py));
  cWallY(R.y0, R.x0, B.x1, z, zr, (x, zz, px, py) => backPx(wy, x, zz - z, winY, gy, px, py));
  cFloor(B.x0, R.y0, R.x0, B.y1, zr, flat(cap)); cFloor(B.x0, B.y0, B.x1, R.y0, zr, flat(cap));
  // the front walls cut away: a cap on each; at a doorway the floor runs through as a threshold
  const fx = F.f === 0 ? doorGaps(B, 'x') : [], fy = F.f === 0 ? doorGaps(B, 'y') : [];
  const run = (a0, a1, gaps, seg) => { let a = a0; for (const g of gaps.slice().sort((p, q) => p[0] - q[0])) { if (g[0] > a) seg(a, g[0], false); seg(Math.max(a, g[0]), g[1], true); a = g[1]; } if (a < a1) seg(a, a1, false); };
  run(R.y0, B.y1, fx, (a, b, door) => door ? cFloor(R.x1, a, B.x1, b, z, flat(C.ST0)) : cFloor(R.x1, a, B.x1, b, cz, flat(cap)));
  run(B.x0, R.x1, fy, (a, b, door) => door ? cFloor(a, R.y1, b, B.y1, z, flat(C.ST0)) : cFloor(a, R.y1, b, B.y1, cz, flat(cap)));
  for (const g of fx.concat(fy, gx, gy)) doorClear(F, g[2]);
  for (const g of gx) cFloor(R.x0, g[0], R.x0 + 0.7, g[1], z + 0.005, (x, y) => frac((x + y) / 0.12) < 0.5 ? C.OX : C.PLUM);
  for (const g of gy) cFloor(g[0], R.y0, g[1], R.y0 + 0.7, z + 0.005, (x, y) => frac((x + y) / 0.12) < 0.5 ? C.OX : C.PLUM);
  // the floor slab's edge, seen where the front walls are cut
  if (F.f > 0) { cWallX(B.x1, B.y0, B.y1, z - 0.2, z, flat(C.INK)); cWallY(B.y1, B.x0, B.x1, z - 0.2, z, flat(C.INK)); }
  F.winX = winX; F.winY = winY;
  return R;
}
// the path in from a door is kept clear: 1.4 m deep, the door's width plus some
function doorClear(F, D) {
  const R = F.R, hw = D.w / 2 + 0.45, d = 1.5;
  const box = D.face === 'x' ? [R.x1 - d, D.cy - hw, R.x1, D.cy + hw] : D.face === 'y' ? [D.cx - hw, R.y1 - d, D.cx + hw, R.y1]
    : D.face === '-x' ? [R.x0, D.cy - hw, R.x0 + d, D.cy + hw] : [D.cx - hw, R.y0, D.cx + hw, R.y0 + d];
  F.clear.push(box);
}
// can a piece go here (inside the room, off every door's path, not on another piece)?
function free(F, x0, y0, x1, y1, pad) {
  const R = F.R, p = pad === undefined ? 0.05 : pad;
  if (x0 < R.x0 - 0.01 || y0 < R.y0 - 0.01 || x1 > R.x1 + 0.01 || y1 > R.y1 + 0.01) return false;
  for (const b of F.clear) if (x1 > b[0] && x0 < b[2] && y1 > b[1] && y0 < b[3]) return false;
  for (const b of F.used) if (x1 + p > b[0] && x0 - p < b[2] && y1 + p > b[1] && y0 - p < b[3]) return false;
  return true;
}
function use(F, x0, y0, x1, y1) { F.used.push([x0, y0, x1, y1]); }
// place a piece of footprint w x d centred at (x, y) if it fits; draw() is called with the centre
function put(F, x, y, w, d, draw, pad) {
  if (!free(F, x - w / 2, y - d / 2, x + w / 2, y + d / 2, pad)) return false;
  use(F, x - w / 2, y - d / 2, x + w / 2, y + d / 2); draw(x, y); return true;
}
// ------------------------------------------------------------------ partitions: plane x = xp (seen from +x) or y = yp, with doorways
const PT = 0.12;
function partX(F, xp, y0, y1, doors, look) {
  const z = F.z, cz = z + PH, lk = look || WALLS.plain(C.STL, C.STS), gaps = (doors || []).map(c => [c - 0.5, c + 0.5]).sort((a, b) => a[0] - b[0]);
  let a = y0;
  const seg = (s0, s1) => {
    cWallX(xp + PT / 2, s0, s1, z, cz, (y, zz, px, py) => lk(y, zz - z, px, py));
    cFloor(xp - PT / 2, s0, xp + PT / 2, s1, cz, flat(C.INK));
    solid(xp - PT / 2, s0, xp + PT / 2, s1, F.h, 'wall', z > 0.2 ? z : 0);
    F.occl.push([xp - PT / 2, s0, z, xp + PT / 2, s1, z + F.h]);
    use(F, xp - PT / 2 - 0.05, s0, xp + PT / 2 + 0.05, s1);
  };
  for (const g of gaps) { if (g[0] > a) seg(a, g[0]); a = g[1]; F.clear.push([xp - 1.0, g[0] - 0.1, xp + 1.0, g[1] + 0.1]); cFloor(xp - PT / 2, g[0], xp + PT / 2, g[1], z + 0.003, flat(C.DBR)); }
  if (a < y1) seg(a, y1);
}
function partY(F, yp, x0, x1, doors, look) {
  const z = F.z, cz = z + PH, lk = look || WALLS.plain(C.STL, C.STS), gaps = (doors || []).map(c => [c - 0.5, c + 0.5]).sort((a, b) => a[0] - b[0]);
  let a = x0;
  const seg = (s0, s1) => {
    cWallY(yp + PT / 2, s0, s1, z, cz, (x, zz, px, py) => lk(x, zz - z, px, py));
    cFloor(s0, yp - PT / 2, s1, yp + PT / 2, cz, flat(C.INK));
    solid(s0, yp - PT / 2, s1, yp + PT / 2, F.h, 'wall', z > 0.2 ? z : 0);
    F.occl.push([s0, yp - PT / 2, z, s1, yp + PT / 2, z + F.h]);
    use(F, s0, yp - PT / 2 - 0.05, s1, yp + PT / 2 + 0.05);
  };
  for (const g of gaps) { if (g[0] > a) seg(a, g[0]); a = g[1]; F.clear.push([g[0] - 0.1, yp - 1.0, g[1] + 0.1, yp + 1.0]); cFloor(g[0], yp - PT / 2, g[1], yp + PT / 2, z + 0.003, flat(C.DBR)); }
  if (a < x1) seg(a, x1);
}
// a region of the floor with its own floor covering (a room within the floor)
function floorArea(F, x0, y0, x1, y1, sh) { cFloor(x0, y0, x1, y1, F.z + 0.002, sh); }
// ------------------------------------------------------------------ stairs: a flight up the back wall; the floor above has the stairwell
// dir: which way the flight rises ('-y' along an x-wall, '-x' along a y-wall). The foot is where you step on.
function stairFlight(F, x0, y0, x1, y1, dir, upper, label) {
  const z = F.z, H = upper ? upper.z - z : F.h, n = Math.max(8, Math.round(H / 0.2)), alongY = dir === '-y';
  const len = alongY ? y1 - y0 : x1 - x0;
  for (let k = 0; k < n; k++) {
    const t0 = k / n, zz = z + (k + 1) * H / n;
    if (alongY) { const ya = y1 - (k + 1) * len / n, yb = y1 - k * len / n; cBox(x0, ya, zz - H / n, x1, yb, zz, flat(k & 1 ? C.WOOD : C.TAN), flat(C.DBR), flat(C.BRN)); }
    else { const xa = x1 - (k + 1) * len / n, xb = x1 - k * len / n; cBox(xa, y0, zz - H / n, xb, y1, zz, flat(k & 1 ? C.WOOD : C.TAN), flat(C.BRN), flat(C.DBR)); }
  }
  // the banister on the open side
  if (alongY) { cLine(x1, y1, z + 1.0, x1, y0, z + H + 1.0, C.DBR, true); cLine(x1, y1, z, x1, y1, z + 1.0, C.DBR); }
  else { cLine(x1, y1, z + 1.0, x0, y1, z + H + 1.0, C.DBR, true); cLine(x1, y1, z, x1, y1, z + 1.0, C.DBR); }
  solid(x0, y0, x1, y1, F.h, 'stairs', z > 0.2 ? z : 0);
  use(F, x0 - 0.05, y0 - 0.05, x1 + 0.05, y1 + 0.05);
  const fx = alongY ? (x0 + x1) / 2 : x1 + 0.55, fy = alongY ? y1 + 0.55 : (y0 + y1) / 2;
  F.clear.push([fx - 0.6, fy - 0.6, fx + 0.6, fy + 0.6]);
  const S = { F, x: fx, y: fy, r: 0.8, kind: 'stairs', label: label || (upper ? 'GO UPSTAIRS' : 'THE STAIRS'), to: upper || null, dir, box: [x0, y0, x1, y1] };
  F.stairs.push(S); INTER.push(S);
  return S;
}
// the top of a flight on the floor above: a railed hole over the flight and a landing to arrive on
function stairWell(F, S, lower, land) {
  const [x0, y0, x1, y1] = S.box, z = F.z, alongY = S.dir === '-y';
  cFloor(x0, y0, x1, y1, z + 0.001, (x, y) => { const d = alongY ? (y - y0) / (y1 - y0) : (x - x0) / (x1 - x0); return d < 0.25 ? C.TAN : frac(d * 8) < 0.5 ? C.BLK : C.INK; });
  cLine(x1, y0, z + 1.0, x1, y1, z + 1.0, C.DBR, true); cLine(x0, y1, z + 1.0, x1, y1, z + 1.0, C.DBR, true);
  for (const [px, py] of [[x1, y0], [x1, y1], [x0, y1]]) cLine(px, py, z, px, py, z + 1.0, C.DBR);
  solid(x0, y0, x1, y1, F.h, 'rail', z);
  use(F, x0 - 0.05, y0 - 0.05, x1 + 0.05, y1 + 0.05);
  const top = alongY ? { x: (x0 + x1) / 2, y: y0 - 0.55 } : { x: x0 - 0.55, y: (y0 + y1) / 2 };
  if (land) { top.x = land.x; top.y = land.y; }                                             // a landing chosen by the floor plan
  F.clear.push([top.x - 0.6, top.y - 0.6, top.x + 0.6, top.y + 0.6]);
  const D = { F, x: top.x, y: top.y, r: 0.8, kind: 'stairs', label: 'GO DOWNSTAIRS', to: lower, dir: S.dir, box: S.box };
  F.stairs.push(D); INTER.push(D);
  S.arrive = { x: top.x, y: top.y }; D.arrive = { x: S.x, y: S.y };
  return D;
}
// a lift: doors on a back wall; E takes it to the floor it names
function liftDoor(F, xw, yc, to, label) {
  const z = F.z;
  cWallX(xw + 0.02, yc - 0.7, yc + 0.7, z, z + 2.5, (y, zz) => {
    const u = y - yc, h = zz - z;
    if (Math.abs(u) > 0.62 || h > 2.35) return h > 2.35 && Math.abs(u) < 0.3 && h < 2.48 ? C.BRASS : C.BRASS;
    return Math.abs(u) < 0.02 ? C.INK : (frac(h / 0.5) < 0.05 ? C.BRN : C.BRASS);
  });
  F.clear.push([xw, yc - 0.8, xw + 1.4, yc + 0.8]);
  const S = { F, x: xw + 0.55, y: yc, r: 0.8, kind: 'lift', label: label || 'TAKE THE ELEVATOR', to: to || null };
  F.stairs.push(S); INTER.push(S);
  return S;
}
// ------------------------------------------------------------------ building every interior
const INT_TPL = {};                                          // type -> (B) builds every floor of B
function buildInteriors() {
  for (const B of INTERIOR_QUEUE) {
    const fn = INT_TPL[B.enter] || INT_TPL.generic;
    B.floors.forEach(F => { F.spots = []; });
    fn(B);
    for (const F of B.floors) { if (!F.R) { beginFloor(F); shell(F, STYLE.plain); endFloor(); } }
  }
}
const STYLE = {
  plain: { floor: FLOORS.planks(), wall: WALLS.plain(C.STL, C.STS) },
  home: { floor: FLOORS.planks(C.BRN, C.DBR, C.INK), wall: WALLS.paper(C.TAN, C.BRN) },
  shop: { floor: FLOORS.lino(C.CREAM, C.CRS), wall: WALLS.plain(C.STL, C.STS) },
  bar: { floor: FLOORS.planks(C.BRN, C.DBR, C.INK), wall: WALLS.paper(C.OX, C.PLUM) },
  work: { floor: FLOORS.concrete, wall: WALLS.brick, noWin: false },
  grand: { floor: FLOORS.marble, wall: WALLS.panel(C.WOOD, C.BRN) },
  office: { floor: FLOORS.carpet(C.G0, C.G1), wall: WALLS.panel(C.CRS, C.STS) },
  tile: { floor: FLOORS.tile(C.CREAM, C.CRS), wall: WALLS.tile(C.CREAM, C.CRS) }
};
