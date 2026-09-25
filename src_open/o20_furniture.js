// =================================================================== FURNITURE: PIECES RECORDED INTO AN INTERIOR FLOOR
// Every piece takes the floor F it stands on (its height is F.z) and world x, y; boxes are drawn with their three
// visible faces (+x, +y, top). Pieces that stop a man are statics standing on the floor; things with drawers are
// containers; some are places for people to be (F.spots).
const CONTAINERS = [];                                       // {F, x, y, kind, name, locked, lock, restricted, items}
const INTER = [];                                            // things to use: {F, x, y, r, kind, label, ...}
function fz(F) { return F.z; }
function fsolid(F, x0, y0, x1, y1, h, kind) { return solid(Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1), h, kind || 'low', F.f === 0 ? 0 : F.z); }
// a box standing on the floor: the side shaders get z above the floor, not above the street
function fbox(F, x0, y0, z0, x1, y1, z1, top, sx, sy) {
  const z = F.z, rx = sx && ((u, zz, px, py) => sx(u, zz - z, px, py)), ry = sy && ((u, zz, px, py) => sy(u, zz - z, px, py));
  cBox(x0, y0, z + z0, x1, y1, z + z1, top, rx, ry);
}
function fboxc(F, x0, y0, z0, x1, y1, z1, top, sx, sy) { fbox(F, x0, y0, z0, x1, y1, z1, flat(top), flat(sx), flat(sy)); }
function container(F, x, y, kind, name, o) { const K = Object.assign({ F, x, y, kind, name, locked: false, lock: 0, restricted: false, items: null, owner: F.B }, o || {}); CONTAINERS.push(K); return K; }
function spot(F, x, y, dir, role, dz) { F.spots.push({ x, y, dir, role, dz: dz || 0, F }); }
const WOODS = [[C.WOOD, C.BRN, C.DBR], [C.BRN, C.DBR, C.INK], [C.TAN, C.BRN, C.DBR], [C.S1, C.S0, C.INK]];
// ------------------------------------------------------------------ tables, chairs, desks
function table(F, x, y, w, d, wood, cloth) {
  const [a, b, c] = WOODS[wood || 0], x0 = x - w / 2, y0 = y - d / 2, x1 = x + w / 2, y1 = y + d / 2;
  for (const [lx, ly] of [[x0 + 0.08, y0 + 0.08], [x1 - 0.12, y0 + 0.08], [x0 + 0.08, y1 - 0.12], [x1 - 0.12, y1 - 0.12]]) fboxc(F, lx, ly, 0, lx + 0.05, ly + 0.05, 0.7, b, c, b);
  if (cloth !== undefined) fbox(F, x0 - 0.04, y0 - 0.04, 0.5, x1 + 0.04, y1 + 0.04, 0.76, flat(cloth), flat(SHD[cloth]), flat(cloth));
  else fboxc(F, x0, y0, 0.7, x1, y1, 0.76, a, b, b);
  fsolid(F, x0, y0, x1, y1, 0.78);
}
function chair(F, x, y, dir, wood) {
  const [a, b, c] = WOODS[wood || 0];
  fboxc(F, x - 0.2, y - 0.2, 0.42, x + 0.2, y + 0.2, 0.47, a, b, b);
  for (const [lx, ly] of [[-0.18, -0.18], [0.14, -0.18], [-0.18, 0.14], [0.14, 0.14]]) fboxc(F, x + lx, y + ly, 0, x + lx + 0.04, y + ly + 0.04, 0.42, b, c, c);
  const back = { 'x+': [x - 0.22, y - 0.2, x - 0.18, y + 0.2], 'x-': [x + 0.18, y - 0.2, x + 0.22, y + 0.2], 'y+': [x - 0.2, y - 0.22, x + 0.2, y - 0.18], 'y-': [x - 0.2, y + 0.18, x + 0.2, y + 0.22] }[dir || 'y+'];
  fboxc(F, back[0], back[1], 0.47, back[2], back[3], 0.95, a, b, a);
}
// a desk facing dir; drawers (a container), a lamp, a telephone, papers, sometimes a typewriter
function desk(F, x, y, dir, o) {
  const op = o || {}, along = dir === 'x+' || dir === 'x-', w = op.w || 1.4, d = 0.7;
  const x0 = along ? x - d / 2 : x - w / 2, x1 = along ? x + d / 2 : x + w / 2, y0 = along ? y - w / 2 : y - d / 2, y1 = along ? y + w / 2 : y + d / 2;
  const [a, b, c] = WOODS[op.wood || 1];
  fbox(F, x0, y0, 0, x1, y1, 0.74, flat(a), (yy, z) => (frac((yy - y0) / 0.35) < 0.06 || Math.abs(z - 0.45) < 0.02) ? c : b, (xx, z) => (frac((xx - x0) / 0.35) < 0.06 || Math.abs(z - 0.45) < 0.02) ? c : b);
  fboxc(F, x0 - 0.02, y0 - 0.02, 0.74, x1 + 0.02, y1 + 0.02, 0.78, a, c, c);
  fsolid(F, x0, y0, x1, y1, 0.8, 'low');
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, z = F.z + 0.78;
  cFloor(cx - 0.18, cy - 0.12, cx + 0.12, cy + 0.14, z + 0.005, (xx, yy) => frac((xx + yy) * 6) < 0.15 ? C.CRS : C.CREAM);      // papers
  if (op.typewriter) { cBox(cx + 0.05, cy - 0.2, z, cx + 0.35, cy + 0.1, z + 0.12, flat(C.INK), flat(C.S0), (xx, zz) => zz > z + 0.08 ? C.S2 : C.INK); }
  if (op.phone !== false) cStamp(x0 + 0.2, y0 + 0.2, z, ['.kkk.', 'kk.kk', 'kkkkk'], { k: C.INK });
  if (op.lamp !== false) deskLamp(F, x1 - 0.15, y0 + 0.15, 0.78, op.lampCol);
  if (op.drawers !== false) container(F, cx, cy, 'desk', op.name || 'DESK', { restricted: !!op.restricted, locked: !!op.locked, lock: op.lock || 1 });
  if (op.chair !== false) chair(F, x - (dir === 'x+' ? 0.75 : dir === 'x-' ? -0.75 : 0), y - (dir === 'y+' ? 0.75 : dir === 'y-' ? -0.75 : 0), dir, op.wood);
}
function deskLamp(F, x, y, z0, col) {
  const z = F.z + z0, c = col || C.G1;
  cCyl(x, y, 0.02, z, z + 0.35, () => C.BRASS);
  mat(MAT_EMIT); cSphere(x, y, z + 0.4, 0.09, (nx, ny) => { curExt = EXT_LAMP; return ny < -0.2 ? LIT[c] : c; }); mat(0);
  intLight(F, { x: x + 0.3, y: y + 0.3, z: z + 0.45, r: 3.0, k: 1.3 });
}
// ------------------------------------------------------------------ living: beds, sofas, armchairs, wardrobes, rugs
function bed(F, x, y, dir, blanket) {
  const along = dir === 'x+' || dir === 'x-', L = 2.0, Wd = 1.4, bl = blanket === undefined ? C.OX : blanket;
  const x0 = x - (along ? L : Wd) / 2, x1 = x + (along ? L : Wd) / 2, y0 = y - (along ? Wd : L) / 2, y1 = y + (along ? Wd : L) / 2;
  fboxc(F, x0, y0, 0.1, x1, y1, 0.35, C.DBR, C.DBR, C.BRN);
  fbox(F, x0 + 0.03, y0 + 0.03, 0.35, x1 - 0.03, y1 - 0.03, 0.55, (xx, yy) => {
    const u = along ? (dir === 'x+' ? x1 - xx : xx - x0) : (dir === 'y+' ? y1 - yy : yy - y0);
    if (u > L - 0.5) return (along ? Math.abs(yy - y) : Math.abs(xx - x)) < Wd / 2 - 0.12 ? C.CREAM : C.CRS;
    return frac((xx + yy) / 0.3) < 0.1 ? SHD[bl] : bl;
  }, flat(SHD[bl]), flat(bl));
  const hb = { 'x+': [x0 - 0.08, y0, x0, y1], 'x-': [x1, y0, x1 + 0.08, y1], 'y+': [x0, y0 - 0.08, x1, y0], 'y-': [x0, y1, x1, y1 + 0.08] }[dir];
  fboxc(F, hb[0], hb[1], 0.1, hb[2], hb[3], 1.0, C.BRN, C.DBR, C.WOOD);
  fsolid(F, x0, y0, x1, y1, 0.6);
  spot(F, x, y, dir, 'bed');
}
function sofa(F, x, y, dir, col, len) {
  const along = dir === 'y+' || dir === 'y-', L = len || 1.9, D = 0.8, c = col === undefined ? C.OX : col;
  const x0 = x - (along ? L : D) / 2, x1 = x + (along ? L : D) / 2, y0 = y - (along ? D : L) / 2, y1 = y + (along ? D : L) / 2;
  fboxc(F, x0, y0, 0.05, x1, y1, 0.45, c, SHD[c], c);
  const back = { 'x+': [x0, y0, x0 + 0.2, y1], 'x-': [x1 - 0.2, y0, x1, y1], 'y+': [x0, y0, x1, y0 + 0.2], 'y-': [x0, y1 - 0.2, x1, y1] }[dir];
  fboxc(F, back[0], back[1], 0.45, back[2], back[3], 0.9, LIT[c], SHD[c], c);
  fsolid(F, x0, y0, x1, y1, 0.9);
}
function armchair(F, x, y, dir, col) {
  const c = col === undefined ? C.G1 : col;
  fboxc(F, x - 0.4, y - 0.4, 0.05, x + 0.4, y + 0.4, 0.45, c, SHD[c], c);
  const back = { 'x+': [x - 0.4, y - 0.4, x - 0.22, y + 0.4], 'x-': [x + 0.22, y - 0.4, x + 0.4, y + 0.4], 'y+': [x - 0.4, y - 0.4, x + 0.4, y - 0.22], 'y-': [x - 0.4, y + 0.22, x + 0.4, y + 0.4] }[dir];
  fboxc(F, back[0], back[1], 0.45, back[2], back[3], 1.0, LIT[c], SHD[c], c);
  fsolid(F, x - 0.4, y - 0.4, x + 0.4, y + 0.4, 0.9);
  spot(F, x, y, dir, 'seat');
}
function wardrobe(F, x0, y0, x1, y1, name) {
  fbox(F, x0, y0, 0, x1, y1, 2.0, flat(C.DBR), (y, z) => Math.abs(y - (y0 + y1) / 2) < 0.02 || z < 0.1 ? C.INK : C.BRN, (x, z) => Math.abs(x - (x0 + x1) / 2) < 0.02 || z < 0.1 ? C.INK : C.BRN);
  fsolid(F, x0, y0, x1, y1, 2.0, 'wall');
  container(F, (x0 + x1) / 2, (y0 + y1) / 2, 'wardrobe', name || 'WARDROBE');
}
function chest(F, x0, y0, x1, y1, name, o) {
  fbox(F, x0, y0, 0, x1, y1, 0.9, flat(C.WOOD), (y, z) => frac(z / 0.28) < 0.08 ? C.DBR : C.BRN,
    (x, z) => frac(z / 0.28) < 0.08 ? C.DBR : (Math.abs(frac(z / 0.28) - 0.55) < 0.07 && Math.abs(x - (x0 + x1) / 2) < 0.1 ? C.BRASS : C.BRN));
  fsolid(F, x0, y0, x1, y1, 0.9);
  return container(F, (x0 + x1) / 2, (y0 + y1) / 2, 'drawer', name || 'CHEST OF DRAWERS', o);
}
function rug(F, x0, y0, x1, y1, field, border) {
  cFloor(x0, y0, x1, y1, F.z + 0.005, carpet(x0, y0, x1, y1, field, LIT[field], border, SHD[border]));
}
function cabinet(F, x0, y0, x1, y1, name, o) {
  fbox(F, x0, y0, 0, x1, y1, 1.35, flat(C.S1), (y, z) => frac(z / 0.33) < 0.06 ? C.INK : (Math.abs(frac(z / 0.33) - 0.5) < 0.05 && Math.abs(y - (y0 + y1) / 2) < 0.08 ? C.S3 : C.S0), (x, z) => frac(z / 0.33) < 0.06 ? C.INK : (Math.abs(frac(z / 0.33) - 0.5) < 0.05 && Math.abs(x - (x0 + x1) / 2) < 0.08 ? C.S3 : C.S1));
  fsolid(F, x0, y0, x1, y1, 1.35);
  return container(F, (x0 + x1) / 2, (y0 + y1) / 2, 'cabinet', name || 'FILING CABINET', o);
}
function safeBox(F, x, y, o) {
  fbox(F, x - 0.35, y - 0.35, 0, x + 0.35, y + 0.35, 0.8, flat(C.S0), (yy, z) => Math.hypot(yy - y, z - 0.45) < 0.09 ? C.S3 : (Math.abs(yy - y) > 0.3 || z > 0.75 ? C.INK : C.SLT), (xx, z) => Math.abs(xx - x) > 0.3 || z > 0.75 ? C.INK : C.S0);
  fsolid(F, x - 0.35, y - 0.35, x + 0.35, y + 0.35, 0.8);
  return container(F, x, y, 'safe', 'SAFE', Object.assign({ locked: true, lock: 3 }, o || {}));
}
function plant(F, x, y, s) {
  const k = s || 1, z = F.z;
  cCyl(x, y, 0.18 * k, z, z + 0.4 * k, (a) => a < -0.3 ? C.BRASS : a > 0.4 ? C.DBR : C.AMB, () => C.INK);
  for (const [dx, dy, dz] of [[0, 0, 0.75], [0.15, 0.1, 0.6], [-0.12, 0.12, 0.62], [0.05, -0.12, 0.9]]) cSphere(x + dx * k, y + dy * k, z + dz * k, 0.22 * k, (nx, ny, px, py) => (-nx * 0.4 - ny * 0.8 + (hash(px, py) - 0.5) * 0.5) > 0.2 ? C.G2 : C.G1);
  fsolid(F, x - 0.2, y - 0.2, x + 0.2, y + 0.2, 1);
}
function floorLamp(F, x, y, col) {
  const z = F.z, c = col || C.PALEY;
  cCyl(x, y, 0.03, z, z + 1.45, () => C.INK); cCyl(x, y, 0.15, z, z + 0.04, () => C.INK, () => C.S0);
  mat(MAT_EMIT); cCyl(x, y, 0.2, z + 1.45, z + 1.75, (a) => { curExt = EXT_LAMP; return a < -0.2 ? LIT[c] : c; }, () => { curExt = EXT_LAMP; return LIT[c]; }); mat(0);
  intLight(F, { x, y, z: z + 1.6, r: 4, k: 1.6 });
}
// a pendant over the room: a shade you can see and the light it gives
function ceilingLamp(F, x, y, k, col) {
  const z = F.z + Math.min(F.h - 0.5, 2.6), c = col || C.PALEY;
  mat(MAT_EMIT); cSphere(x, y, z, 0.16, (nx, ny) => { curExt = EXT_LAMP; return ny < 0 ? c : LIT[c]; }); mat(0);
  intLight(F, { x, y, z: z - 0.2, r: 6.5, k: k || 2.3 });
}
function intLight(F, L) { registerLight(L, 'int'); F.lights.push(L); return L; }
// ------------------------------------------------------------------ shops: counters, shelves, cases, racks
function counter(F, x0, y0, x1, y1, o) {
  const op = o || {}, top = op.top === undefined ? C.WOOD : op.top, side = op.side === undefined ? C.BRN : op.side;
  fbox(F, x0, y0, 0, x1, y1, 1.0, flat(top), (y, z) => z > 0.94 ? top : (frac((y - y0) / 0.6) < 0.05 ? SHD[side] : side), (x, z) => z > 0.94 ? top : (frac((x - x0) / 0.6) < 0.05 ? SHD[side] : side));
  fsolid(F, x0, y0, x1, y1, 1.05);
  if (op.register) cStamp(op.register[0], op.register[1], F.z + 1.0, ['.bbbb.', 'bbbbbb', 'bkkkkb', 'bbbbbb'], { b: C.BRASS, k: C.INK });
}
// wall shelves full of goods: rows of little coloured boxes (goods: palette list)
function shelves(F, x0, y0, x1, y1, h, goods) {
  const g = goods || [C.CORAL, C.PALEY, C.CYD, C.CREAM, C.G1, C.BRASS];
  const face = (u, z, px, py) => {
    const row = Math.floor(z / 0.42), fz = z - row * 0.42;
    if (fz < 0.04 || z > h - 0.05) return C.DBR;
    const cell = Math.floor(u / 0.16);
    if (hash3(cell, row, (x0 * 13 + y0) | 0) < 0.18 || fz > 0.34) return C.INK;
    const c = g[hashi(cell, row + 7) % g.length];
    return frac(u / 0.16) < 0.12 ? SHD[c] : c;
  };
  fbox(F, x0, y0, 0, x1, y1, h, flat(C.DBR), (y, z, px, py) => face(y1 - y, z, px, py), (x, z, px, py) => face(x - x0, z, px, py));
  fsolid(F, x0, y0, x1, y1, h, h > 1.7 ? 'wall' : 'low');
}
function displayCase(F, x0, y0, x1, y1, goods) {
  const g = goods || [C.BRASS, C.S3, C.CREAM];
  fbox(F, x0, y0, 0, x1, y1, 0.95, (x, y) => (x < x0 + 0.05 || y < y0 + 0.05 || x > x1 - 0.05 || y > y1 - 0.05) ? C.S2 : (hash(Math.floor(x * 7), Math.floor(y * 7)) < 0.3 ? g[hashi(Math.floor(x * 7), Math.floor(y * 7)) % g.length] : C.NAV),
    (y, z) => z > 0.6 ? (z > 0.9 ? C.S2 : C.SLT) : C.BRN, (x, z) => z > 0.6 ? (z > 0.9 ? C.S2 : C.SLT) : C.WOOD);
  fsolid(F, x0, y0, x1, y1, 0.95);
}
function clothesRack(F, x0, y0, x1, y1, cols) {
  const z = F.z, alongX = x1 - x0 > y1 - y0;
  cLine(x0, y0, z + 1.5, x1, y1, z + 1.5, C.S2);
  cLine(x0, y0, z, x0, y0, z + 1.5, C.S1); cLine(x1, y1, z, x1, y1, z + 1.5, C.S1);
  const n = Math.floor((alongX ? x1 - x0 : y1 - y0) / 0.28);
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n, x = lerp(x0, x1, t), y = lerp(y0, y1, t), c = cols[k % cols.length];
    cBox(x - (alongX ? 0.1 : 0.2), y - (alongX ? 0.2 : 0.1), z + 0.5, x + (alongX ? 0.1 : 0.2), y + (alongX ? 0.2 : 0.1), z + 1.45, flat(c), flat(SHD[c]), flat(c));
  }
  fsolid(F, x0 - 0.2, y0 - 0.2, x1 + 0.2, y1 + 0.2, 1.5);
}
function mannequin(F, x, y, col) {
  const z = F.z;
  cCyl(x, y, 0.15, z, z + 0.03, () => C.S0, () => C.S1); cCyl(x, y, 0.02, z, z + 0.9, () => C.S1);
  cCyl(x, y, 0.2, z + 0.9, z + 1.5, (a) => a < -0.2 ? LIT[col] : col, () => col);
  cSphere(x, y, z + 1.65, 0.1, () => C.CREAM);
  fsolid(F, x - 0.2, y - 0.2, x + 0.2, y + 0.2, 1.7);
}
// a rack on a back wall (x = xw facing +x, or y = yw facing +y) with long guns on it
function gunRackX(F, xw, y0, y1) {
  const z = F.z;
  cWallX(xw + 0.02, y0, y1, z + 0.9, z + 2.0, (y, zz) => { const u = frac((y - y0) / 0.4); if (Math.abs(zz - z - 1.0) < 0.03 || Math.abs(zz - z - 1.9) < 0.03) return C.DBR; if (u > 0.4 && u < 0.52) return zz < z + 1.25 ? C.WOOD : C.INK; return T; });
}
function gunRackY(F, yw, x0, x1) {
  const z = F.z;
  cWallY(yw + 0.02, x0, x1, z + 0.9, z + 2.0, (x, zz) => { const u = frac((x - x0) / 0.4); if (Math.abs(zz - z - 1.0) < 0.03 || Math.abs(zz - z - 1.9) < 0.03) return C.DBR; if (u > 0.4 && u < 0.52) return zz < z + 1.25 ? C.WOOD : C.INK; return T; });
}
// ------------------------------------------------------------------ bars, diners, clubs
function barCounter(F, x0, y0, x1, y1, stoolSide) {
  counter(F, x0, y0, x1, y1, { top: C.OX, side: C.DBR });
  const alongX = x1 - x0 > y1 - y0, n = Math.floor((alongX ? x1 - x0 : y1 - y0) / 0.75);
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n, sx = alongX ? lerp(x0, x1, t) : (stoolSide > 0 ? x1 + 0.45 : x0 - 0.45), sy = alongX ? (stoolSide > 0 ? y1 + 0.45 : y0 - 0.45) : lerp(y0, y1, t);
    stool(F, sx, sy);
    spot(F, sx, sy, alongX ? (stoolSide > 0 ? 'y-' : 'y+') : (stoolSide > 0 ? 'x-' : 'x+'), 'bar');
  }
}
function stool(F, x, y) { const z = F.z; cCyl(x, y, 0.03, z, z + 0.65, () => C.S1); cCyl(x, y, 0.19, z + 0.65, z + 0.75, (a) => a < -0.2 ? C.CRIM : C.OX, () => C.CRIM); }
function bottleShelfX(F, xw, y0, y1) {                    // bottles on a back wall behind a bar
  const z = F.z;
  cWallX(xw + 0.03, y0, y1, z + 1.1, z + 2.2, (y, zz, px, py) => {
    const row = Math.floor((zz - z - 1.1) / 0.36), fz = zz - z - 1.1 - row * 0.36;
    if (fz < 0.04) return C.DBR;
    const cell = Math.floor((y - y0) / 0.12), c = [C.G1, C.BRASS, C.OX, C.CREAM, C.CYD, C.AMB][hashi(cell, row) % 6];
    if (frac((y - y0) / 0.12) < 0.3 || fz > (hash(cell, row) > 0.5 ? 0.3 : 0.24)) return fz > 0.3 ? T : (fz > 0.2 ? T : C.INK);
    return fz > 0.22 ? SHD[c] : c;
  });
}
function bottleShelfY(F, yw, x0, x1) {
  const z = F.z;
  cWallY(yw + 0.03, x0, x1, z + 1.1, z + 2.2, (x, zz) => {
    const row = Math.floor((zz - z - 1.1) / 0.36), fz = zz - z - 1.1 - row * 0.36;
    if (fz < 0.04) return C.DBR;
    const cell = Math.floor((x - x0) / 0.12), c = [C.G1, C.BRASS, C.OX, C.CREAM, C.CYD, C.AMB][hashi(cell, row) % 6];
    if (frac((x - x0) / 0.12) < 0.3 || fz > (hash(cell, row) > 0.5 ? 0.3 : 0.24)) return fz > 0.2 ? T : C.INK;
    return fz > 0.22 ? SHD[c] : c;
  });
}
function booth(F, x, y, dir, col) {                       // two benches and a table between them, along dir's axis
  const c = col === undefined ? C.CRIM : col, alongX = dir === 'x';
  const b = (bx, by) => { fboxc(F, bx - (alongX ? 0.25 : 0.6), by - (alongX ? 0.6 : 0.25), 0, bx + (alongX ? 0.25 : 0.6), by + (alongX ? 0.6 : 0.25), 0.45, c, SHD[c], c); };
  if (alongX) { b(x - 0.75, y); fboxc(F, x - 1.0, y - 0.6, 0.45, x - 0.85, y + 0.6, 1.05, LIT[c], SHD[c], c); b(x + 0.75, y); fboxc(F, x + 0.85, y - 0.6, 0.45, x + 1.0, y + 0.6, 1.05, LIT[c], SHD[c], c); }
  else { b(x, y - 0.75); fboxc(F, x - 0.6, y - 1.0, 0.45, x + 0.6, y - 0.85, 1.05, LIT[c], SHD[c], c); b(x, y + 0.75); fboxc(F, x - 0.6, y + 0.85, 0.45, x + 0.6, y + 1.0, 1.05, LIT[c], SHD[c], c); }
  fboxc(F, x - (alongX ? 0.35 : 0.5), y - (alongX ? 0.5 : 0.35), 0.7, x + (alongX ? 0.35 : 0.5), y + (alongX ? 0.5 : 0.35), 0.76, C.STL, C.S1, C.STS);
  fsolid(F, x - (alongX ? 1.0 : 0.6), y - (alongX ? 0.6 : 1.0), x + (alongX ? 1.0 : 0.6), y + (alongX ? 0.6 : 1.0), 1.05);
  spot(F, alongX ? x - 0.75 : x, alongX ? y : y - 0.75, alongX ? 'x+' : 'y+', 'seat'); spot(F, alongX ? x + 0.75 : x, alongX ? y : y + 0.75, alongX ? 'x-' : 'y-', 'seat');
}
function jukebox(F, x, y) {
  const on = c => { curExt = EXT_ALWAYS; return E(c); };
  fbox(F, x - 0.4, y - 0.3, 0, x + 0.4, y + 0.3, 1.5, flat(C.OX), (yy, z) => z > 1.3 ? on(C.CORAL) : z > 0.7 ? on(frac(yy * 4) < 0.5 ? C.PALEY : C.CYAN) : C.OX,
    (xx, z) => z > 1.3 ? on(C.CORAL) : (z > 0.7 ? on(Math.abs(xx - x) < 0.25 ? C.GLOW : C.AMB) : (z > 0.2 && Math.abs(xx - x) < 0.3 ? C.BRASS : C.OX)));
  fsolid(F, x - 0.4, y - 0.3, x + 0.4, y + 0.3, 1.5);
  intLight(F, { x: x + 0.2, y: y + 0.8, z: F.z + 1.0, r: 3, k: 1.1, map: REDW });
  INTER.push({ F, x, y: y + 0.6, r: 0.9, kind: 'jukebox', label: 'PLAY THE JUKEBOX' });
}
function piano(F, x, y, dz) {                             // dz: standing on something (a stage)
  const d = dz || 0;
  fbox(F, x - 0.75, y - 0.3, d, x + 0.75, y + 0.3, d + 1.25, flat(C.INK), flat(C.BLK), (xx, z) => z - d > 0.7 && z - d < 0.8 ? (frac((xx - x) / 0.05) < 0.3 ? C.INK : C.CREAM) : C.INK);
  fsolid(F, x - 0.75, y - 0.3, x + 0.75, y + 0.3, d + 1.25);
  fboxc(F, x - 0.3, y + 0.5, d, x + 0.3, y + 0.8, d + 0.5, C.INK, C.BLK, C.INK);
}
function stage(F, x0, y0, x1, y1, col) {
  fbox(F, x0, y0, 0, x1, y1, 0.4, planks(1, C.WOOD, C.BRN, C.DBR, 5), flat(C.INK), (x, z) => z > 0.35 ? C.BRASS : C.INK);
  fsolid(F, x0, y0, x1, y1, 0.4, 'low');
}
function poolTable(F, x, y) {
  fbox(F, x - 1.3, y - 0.75, 0, x + 1.3, y + 0.75, 0.8, (xx, yy) => (Math.abs(xx - x) > 1.18 || Math.abs(yy - y) > 0.63) ? C.DBR : (hash(Math.floor(xx * 5), Math.floor(yy * 5)) < 0.04 ? C.CREAM : C.G1), flat(C.DBR), flat(C.BRN));
  fsolid(F, x - 1.3, y - 0.75, x + 1.3, y + 0.75, 0.85);
  const z = F.z + 1.9; mat(MAT_EMIT);
  cBox(x - 0.8, y - 0.2, z, x + 0.8, y + 0.2, z + 0.15, flat(C.G0), (yy) => { curExt = EXT_LAMP; return E(C.GRNL); }, (xx) => { curExt = EXT_LAMP; return E(C.GRNL); }); mat(0);
  intLight(F, { x, y, z: z - 0.2, r: 3.5, k: 1.8 });
  spot(F, x + 1.7, y + 0.2, 'x-', 'stand');
}
// ------------------------------------------------------------------ kitchens and baths
function stove(F, x0, y0, x1, y1) { fbox(F, x0, y0, 0, x1, y1, 0.9, (x, y) => Math.hypot(frac(x / 0.3) - 0.5, frac(y / 0.3) - 0.5) < 0.3 ? C.INK : C.CREAM, flat(C.CRS), (x, z) => z > 0.5 && z < 0.8 ? C.INK : C.CREAM); fsolid(F, x0, y0, x1, y1, 0.9); }
function fridge(F, x0, y0, x1, y1) { fbox(F, x0, y0, 0, x1, y1, 1.7, flat(C.CREAM), (y, z) => Math.abs(z - 1.1) < 0.02 ? C.CRS : C.CREAM, (x, z) => Math.abs(z - 1.1) < 0.02 ? C.CRS : (Math.abs(x - x1 + 0.1) < 0.02 && z > 0.6 && z < 1.6 ? C.S2 : C.WHITE)); fsolid(F, x0, y0, x1, y1, 1.7, 'wall'); container(F, (x0 + x1) / 2, (y0 + y1) / 2, 'fridge', 'ICEBOX'); }
function sink(F, x0, y0, x1, y1) { fbox(F, x0, y0, 0, x1, y1, 0.85, (x, y) => (Math.abs(x - (x0 + x1) / 2) < (x1 - x0) / 2 - 0.08 && Math.abs(y - (y0 + y1) / 2) < (y1 - y0) / 2 - 0.08) ? C.S2 : C.WHITE, flat(C.CRS), flat(C.CREAM)); fsolid(F, x0, y0, x1, y1, 0.85); }
function tub(F, x0, y0, x1, y1) { fbox(F, x0, y0, 0, x1, y1, 0.55, (x, y) => (x > x0 + 0.08 && y > y0 + 0.08 && x < x1 - 0.08 && y < y1 - 0.08) ? C.WL : C.WHITE, flat(C.CRS), flat(C.WHITE)); fsolid(F, x0, y0, x1, y1, 0.55); }
function toilet(F, x, y) { cCyl(x, y, 0.18, F.z, F.z + 0.42, (a) => a < -0.2 ? C.WHITE : C.CRS, () => C.WHITE); fboxc(F, x - 0.2, y - 0.3, 0.42, x + 0.2, y - 0.15, 0.85, C.WHITE, C.CRS, C.WHITE); fsolid(F, x - 0.2, y - 0.3, x + 0.2, y + 0.2, 0.8); }
// ------------------------------------------------------------------ storage and work
function crates(F, x0, y0, x1, y1, h) {
  fbox(F, x0, y0, 0, x1, y1, h, (x, y) => (frac(x / 0.6) < 0.08 || frac(y / 0.6) < 0.08) ? C.DBR : C.WOOD,
    (y, z) => (frac(z / 0.55) < 0.1 || frac(y / 1.1) < 0.06) ? C.DBR : C.BRN, (x, z) => (frac(z / 0.55) < 0.1 || frac(x / 1.1) < 0.06) ? C.DBR : C.WOOD);
  fsolid(F, x0, y0, x1, y1, h, h > 1.6 ? 'wall' : 'low');
  return container(F, (x0 + x1) / 2, (y0 + y1) / 2, 'crate', 'CRATE');
}
function drum(F, x, y, col) { const c = col === undefined ? C.OX : col; cCyl(x, y, 0.3, F.z, F.z + 0.9, (a) => frac(a * 2 + 5) < 0.1 ? C.INK : (a < -0.2 ? LIT[c] : c), () => c); fsolid(F, x - 0.3, y - 0.3, x + 0.3, y + 0.3, 0.9); }
function workbench(F, x0, y0, x1, y1) {
  fbox(F, x0, y0, 0, x1, y1, 0.9, (x, y) => hash(Math.floor(x * 6), Math.floor(y * 6)) < 0.08 ? C.S2 : C.WOOD, flat(C.DBR), (x, z) => z < 0.2 ? C.DBR : (frac((x - x0) / 0.5) < 0.1 ? C.INK : C.BRN));
  fsolid(F, x0, y0, x1, y1, 0.9);
  container(F, (x0 + x1) / 2, (y0 + y1) / 2, 'toolbox', 'WORKBENCH');
}
function cellBars(F, x0, y0, x1, y1, doorAt) {             // a jail cell: bars on the two open sides
  const z = F.z, bars = (u, zz) => (frac(u / 0.14) < 0.25 || Math.abs(zz - z - 1.0) < 0.03 || zz > z + 2.15) ? C.S1 : T;
  cWallX(x1, y0, y1, z, z + 2.2, (y, zz) => bars(y, zz)); cWallY(y1, x0, x1, z, z + 2.2, (x, zz) => bars(x, zz));
  solid(x1 - 0.05, y0, x1, y1, 2.2, 'bars', F.f === 0 ? 0 : z);
  solid(x0, y1 - 0.05, doorAt - 0.45, y1, 2.2, 'bars', F.f === 0 ? 0 : z); solid(doorAt + 0.45, y1 - 0.05, x1, y1, 2.2, 'bars', F.f === 0 ? 0 : z);
  fboxc(F, x0 + 0.1, y0 + 0.1, 0, x0 + 0.8, y1 - 0.4, 0.4, C.S1, C.S0, C.S1);                  // a bunk
}
function radioSet(F, x, y) {
  fbox(F, x - 0.35, y - 0.25, 0, x + 0.35, y + 0.25, 1.0, flat(C.BRN), flat(C.DBR), (xx, z) => z > 0.55 && z < 0.9 ? (Math.hypot(xx - x, z - 0.72) < 0.12 ? (curExt = EXT_ALWAYS, E(C.AMB)) : (frac(xx * 10) < 0.5 ? C.DBR : C.WOOD)) : C.BRN);
  fsolid(F, x - 0.35, y - 0.25, x + 0.35, y + 0.25, 1.0);
  INTER.push({ F, x, y: y + 0.6, r: 0.9, kind: 'radio', label: 'LISTEN TO THE RADIO' });
}
function coatRack(F, x, y) { const z = F.z; cCyl(x, y, 0.03, z, z + 1.8, () => C.DBR); cStamp(x, y, z + 1.85, ['t.t.t', '.ttt.', '..t..'], { t: C.DBR }); cStamp(x + 0.05, y, z + 1.5, ['.bb.', 'bbbb', 'bbbb', '.bb.'], { b: C.BRN }); }
// a picture on a back wall (x = xw facing +x or y = yw facing +y)
function pictureX(F, xw, y, zc, c) { cWallX(xw + 0.02, y - 0.35, y + 0.35, F.z + zc - 0.25, F.z + zc + 0.25, (yy, z) => Math.abs(yy - y) > 0.3 || Math.abs(z - F.z - zc) > 0.2 ? C.BRASS : (vnoise(yy * 5, z * 5, 3) > 0.55 ? c : SHD[c])); }
function pictureY(F, yw, x, zc, c) { cWallY(yw + 0.02, x - 0.35, x + 0.35, F.z + zc - 0.25, F.z + zc + 0.25, (xx, z) => Math.abs(xx - x) > 0.3 || Math.abs(z - F.z - zc) > 0.2 ? C.BRASS : (vnoise(xx * 5, z * 5, 4) > 0.55 ? c : SHD[c])); }
