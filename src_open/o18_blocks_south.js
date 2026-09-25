// =================================================================== THE BLOCKS: THE NICKEL MILE, THE PLAZA, CROWN ENERGY
function buildBlock12() {           // the Nickel Mile: Volta, the Blue Comet, the pawnbroker; the liquor store over the alley
  bld(29, 53, 35, 58, 6.5, F(MATL.stucco, 5, 6.5, { lit: 0.5, seed: 21, gh: 3.4, shops: [{ u0: 0.2, u1: 3.4, kind: 'diner' }] }), F(MATL.stucco, 6, 6.5, { lit: 0.5, seed: 22 }),
    { enter: 'bar', name: 'THE VOLTA', doors: [{ face: 'x', u: 4.2, kind: 'glass' }], hours: [16, 3] });
  neonTextX(35, 58, 1.1, 3.3, 'VOLTA', C.CORAL, 8, 1.4);
  addLight({ x: 36.4, y: 55.5, z: 3, r: 5, k: 1.3, tag: 8, map: REDW });
  // the Blue Comet: black glass, porthole doors, a canopy, the comet
  const comet = (u, z, px, py) => {
    if (z < 2.9) {
      if (u > 2.4 && u < 4.6 && z < 2.4) { if (u < 2.48 || u > 4.52 || z > 2.32 || Math.abs(u - 3.5) < 0.03) return C.S2; for (const c of [2.95, 4.05]) { const d = Math.hypot(u - c, z - 1.6); if (d < 0.16) return d > 0.12 ? C.S2 : (bay(px, py) < 0.35 ? E(C.NBL) : E(C.NBD)); } return C.INK; }
      return frac(z / 0.5) < 0.06 ? C.S0 : C.INK;
    }
    return MATL.brickD(u, z, px, py);
  };
  bld(29, 58, 35, 65, 8.5, F(comet, 7, 8.5, { lit: 0.3, seed: 23, gh: 3.2, shops: [{ u0: 0, u1: 7, kind: 'wall' }], base: comet }), F(MATL.brickD, 6, 8.5, { lit: 0.3, seed: 24 }),
    { enter: 'club', name: 'THE BLUE COMET', levels: [0, 1], doors: [{ face: 'x', u: 3.5, w: 2.0, kind: 'none' }], hours: [18, 4], key: 'comet', zone: 'comet' });
  layer(1);
  cBox(35, 59.4, 2.95, 36.5, 63.6, 3.5, flat(C.INK), (y, z) => z < 3.03 ? C.BLK : C.INK, flat(C.BLK));
  tag(9); cWallX(36.505, 59.4, 63.6, 3.05, 3.46, (y, z) => wallTextHit('BLUE COMET', 0.27, 3.45, 63.6 - y, z) ? E(C.NBL) : T);
  tag(0); mat(MAT_OUTSIDE | MAT_EMIT); cWallX(36.506, 59.4, 63.6, 2.95, 3.02, (y) => frac(y / 0.25) < 0.4 ? C.HOT : C.S1); mat(MAT_OUTSIDE);
  for (let k = 0; k < 4; k++) {                          // the comet: a star head and three trails, each lit in turn (tags 9..12)
    tag(9 + k);
    cWallX(35.02, 58.4, 64.6, 3.7, 8.2, (y, z) => {
      const u = 64.6 - y;
      if (k === 0) { const dx = u - 4.6, dz = z - 6.6, r = Math.hypot(dx, dz), a = Math.atan2(dz, dx), s = 0.25 + 0.4 * Math.pow(Math.abs(Math.cos(a * 2.5)), 3); return Math.abs(r - s) < 0.05 ? E(C.NBL) : T; }
      const cx = 4.4 - k * 0.3, cz = 2.6 + k * 0.4, rad = Math.hypot(4.6 - cx, 6.6 - cz);
      return (u < 4.3 && u > 0.6 + k * 0.5 && Math.abs(Math.hypot(u - cx, z - cz) - rad) < 0.045) ? E(C.NBL) : T;
    });
  }
  tag(0); layer(0);
  addLight({ x: 36.8, y: 61.5, z: 4.8, r: 7.5, k: 1.3, tag: 9, map: BLUW });
  addLight({ x: 36.2, y: 61.5, z: 2.8, r: 4.2, k: 1.6 });
  bld(29, 65, 35, 69, 7.5, F(MATL.brick, 4, 7.5, { lit: 0.35, seed: 25, shops: [{ u0: 0.2, u1: 3.8, kind: 'shop', text: 'LOANS', tc: C.BRASS, bg: C.DBR }] }), F(MATL.brick, 6, 7.5, { lit: 0.35, seed: 26 }),
    { enter: 'pawn', name: 'GOLDIE LOANS', doors: [{ face: 'x', u: 3.1, kind: 'glass' }], hours: [10, 20] });
  cStamp(35.3, 66.8, 3.9, ['.yy..yy.', 'yyyyyyyy', '.yy..yy.', '...yy...', '..yyyy..', '...yy...'], { y: C.BRASS });
  // west of the alley: apartments over a liquor store
  bld(19, 53, 25, 69, 12, F(MATL.brickD, 16, 12, { lit: 0.35, seed: 27 }), F(MATL.brickD, 6, 12, { lit: 0.35, seed: 28, shops: [{ u0: 0.3, u1: 3.9, kind: 'shop' }] }),
    { enter: 'liquor', name: 'NICKEL LIQUORS', doors: [{ face: 'y', u: 4.9, kind: 'glass' }, { face: 'x', u: 8, locked: true, lock: 1 }], hours: [10, 24] });
  neonTextY(69, 19, 0.5, 3.3, 'LIQUORS', C.GRNL, 19, 1.0);
  addLight({ x: 22, y: 70.4, z: 3, r: 4.2, k: 1.2, tag: 19, map: GRNW });
  addLight({ x: 27, y: 61, z: 3.5, r: 4.5, k: 1.3 });                                      // a bulb over the alley
  layer(0); mat(MAT_OUTSIDE | MAT_EMIT); cStamp(25.05, 61, 3.6, ['.ggg.', 'ghhhg', '.ggg.'], { g: C.AMB, h: C.HOT }); mat(MAT_OUTSIDE);
  trashCan(26.2, 57.5); trashCan(26.6, 58.2);
}
function buildPlaza() {             // block (2, 2): a paved square round a fountain
  const cx = 61, cy = 61;
  layer(0); mat(MAT_OUTSIDE);
  cCyl(cx, cy, 3.6, 0.15, 0.75, (a) => a < -0.3 ? C.ST2 : a > 0.5 ? C.ST0 : C.ST1, (x, y) => Math.hypot(x - cx, y - cy) > 3.3 ? C.ST2 : T);
  mat(MAT_OUTSIDE | MAT_PUDDLE | MAT_WATER);
  cFloor(cx - 3.3, cy - 3.3, cx + 3.3, cy + 3.3, 0.6, (x, y) => Math.hypot(x - cx, y - cy) < 3.3 ? (hash(Math.floor(x * 8), Math.floor(y * 8)) < 0.08 ? C.WM : C.DW) : T);
  mat(MAT_OUTSIDE);
  cCyl(cx, cy, 0.7, 0.6, 2.4, (a) => a < -0.2 ? C.ST2 : C.ST1, () => C.ST2);
  cStamp(cx, cy, 2.4, ['..ss..', '.sSSs.', '..ss..', '.sSSs.', 'ssSSss', '.sSSs.', '..SS..', '.sSSs.', '.s..s.', '.s..s.'], { s: C.S1, S: C.S2 });
  solidC(cx, cy, 3.7, 0.75, 'low');
  addLight({ x: cx, y: cy, z: 1.0, r: 4.5, k: 0.8 });
  for (const [x, y] of [[54, 54], [68, 54], [54, 68], [68, 68]]) tree(x, y, 1.1);
  bench(61, 54.5, 'x'); bench(61, 67.5, 'x'); bench(54.5, 61, 'y'); bench(67.5, 61, 'y');
  phoneBooth(52.2, 66);
  for (const [x, y] of [[57, 57], [65, 57], [57, 65], [65, 65]]) lampPost(x, y);
}
// Crown Energy: a service station out front; behind the fence, the depot and its yard (restricted, guarded at night)
const CROWN_YARD = { x0: 86.5, y0: 60.5, x1: 94.5, y1: 69.5 };
function buildBlock32() {
  bld(87, 53, 94, 60, 4.5, F(MATL.stucco, 7, 4.5, { lit: 0.6, seed: 31, gh: 3.4, shops: [{ u0: 0.2, u1: 4.5, kind: 'shop', text: 'SERVICE', tc: C.CYAN }] }),
    F(MATL.stucco, 7, 4.5, { lit: 0.6, seed: 32, gh: 3.4, shops: [{ u0: 0.2, u1: 3.3, kind: 'garage' }, { u0: 3.5, u1: 6.8, kind: 'garage' }] }),
    { enter: 'station', name: 'CROWN SERVICE', doors: [{ face: 'x', u: 5.7, kind: 'glass' }], hours: [6, 23] });
  bld(95, 53, 103, 58, 6, F(MATL.brick, 5, 6, { lit: 0.2, seed: 33 }), F(MATL.brick, 8, 6, { lit: 0.2, seed: 34, shops: [{ u0: 0.3, u1: 5.6, kind: 'garage', text: 'CROWN DEPOT', tc: C.CYAN }] }),
    { enter: 'depot', name: 'CROWN ENERGY DEPOT', doors: [{ face: 'y', u: 6.8, kind: 'steel', locked: true, lock: 2 }], zone: 'crown' });
  // canopy on four posts
  for (const [x, y] of [[96, 61], [103, 61], [96, 68], [103, 68]]) { cBoxC(x - 0.2, y - 0.2, 0.15, x + 0.2, y + 0.2, 4.0, C.CREAM, C.STL, C.STS); solid(x - 0.22, y - 0.22, x + 0.22, y + 0.22, 4, 'post'); }
  layer(1);
  cBox(95.4, 60.4, 4.0, 103.6, 68.6, 4.6, flat(C.S0), (y, z) => wallTextHit('CROWN', 0.5 + 1.5, 4.56, 68.6 - y, z, 1) ? E(C.CYAN) : (z < 4.08 ? C.CYD : C.CREAM), (x, z) => z < 4.08 ? C.CYD : C.CREAM);
  layer(0);
  addLight({ x: 99.5, y: 64.5, z: 3.8, r: 7.5, k: 2.0 });
  for (const x of [98, 101.5]) {
    cBoxC(x - 1.2, 64.1, 0.15, x + 1.2, 64.9, 0.35, C.ST2, C.ST1, C.ST0);
    for (const dx of [-0.6, 0.6]) {
      cBox(x + dx - 0.25, 64.25, 0.35, x + dx + 0.25, 64.75, 1.7, flat(C.CREAM), (y, z) => z > 1.2 && z < 1.5 ? E(C.PALEY) : C.CRIM, (xx, z) => z > 1.2 && z < 1.5 ? E(C.PALEY) : (z < 0.6 ? C.OX : C.CRIM));
      cSphere(x + dx, 64.5, 1.85, 0.16, (nx, ny) => ny < -0.3 ? E(C.WHITE) : E(C.CREAM));
    }
    solid(x - 1.2, 64.1, x + 1.2, 64.9, 1.7, 'low');
  }
  // pylon with the atom
  cBoxC(104.3, 69.3, 0.15, 104.7, 69.7, 7.0, C.S2, C.S1, C.S0);
  solid(104.25, 69.25, 104.75, 69.75, 7, 'post');
  layer(1); tag(14); mat(MAT_OUTSIDE);
  cWallX(104.72, 67.4, 71.6, 7.0, 10.6, (y, z) => {
    const u = y - 69.5, v = z - 8.8;
    for (let a = 0; a < 3; a++) { const r = a * Math.PI / 3, p = u * Math.cos(r) + v * Math.sin(r), q = -u * Math.sin(r) + v * Math.cos(r); if (Math.abs(Math.hypot(p / 1.8, q / 0.62) - 1) < 0.07) return E(C.CYAN); }
    if (Math.hypot(u, v) < 0.28) return E(C.WL);
    return T;
  });
  tag(0); layer(0);
  addLight({ x: 106, y: 69.5, z: 8.8, r: 8, k: 1.3, tag: 14, map: CYNW });
  // the yard: a chain-link fence with a gate onto the avenue, a floodlight, crates and drums
  const Y = CROWN_YARD, fence = (u, z) => z > 2.2 ? (frac(u / 0.4) < 0.5 ? C.S2 : T) : z > 2.0 ? C.S1 : (frac(u / 2.5) < 0.04 ? C.S1 : ((Math.floor(u * 10) + Math.floor(z * 10)) & 1) && ((Math.floor(u * 10) ^ Math.floor(z * 10)) & 2) ? C.S0 : T);
  layer(0); mat(MAT_OUTSIDE);
  cWallY(Y.y1, Y.x0, Y.x1, 0.15, 2.4, (x, z) => fence(x, z)); solid(Y.x0, Y.y1 - 0.15, Y.x1, Y.y1, 2.4, 'fence');
  cWallX(Y.x1, Y.y0, Y.y1 - 4.5, 0.15, 2.4, (y, z) => fence(y, z)); solid(Y.x1 - 0.15, Y.y0, Y.x1, Y.y1 - 4.5, 2.4, 'fence');
  cWallX(Y.x1, Y.y1 - 2.4, Y.y1, 0.15, 2.4, (y, z) => fence(y, z)); solid(Y.x1 - 0.15, Y.y1 - 2.4, Y.x1, Y.y1, 2.4, 'fence');
  cWallX(Y.x0 + 0.15, Y.y0, Y.y1, 0.15, 2.4, (y, z) => fence(y, z)); solid(Y.x0, Y.y0, Y.x0 + 0.15, Y.y1, 2.4, 'fence');
  cWallY(Y.y0 + 0.15, Y.x0, Y.x1, 0.15, 2.4, (x, z) => fence(x, z)); solid(Y.x0, Y.y0, Y.x1, Y.y0 + 0.15, 2.4, 'fence');
  cWallY(Y.y1 + 0.01, Y.x0 + 2.5, Y.x0 + 6, 1.06, 1.64, (x, z) => wallTextHit('KEEP OUT', 0.4, 1.58, x - Y.x0 - 2.5, z, 1) ? C.CRIM : C.CREAM);
  for (const [x0, y0, x1, y1, h] of [[88, 62, 89.6, 63.6, 1.1], [88, 63.6, 89.6, 65.2, 2.2], [91.5, 66.5, 93.6, 68, 1.1], [90, 61.2, 91.2, 62.4, 1.1]]) crate(x0, y0, x1, y1, h);
  for (const [x, y] of [[93.4, 61.6], [92.7, 61.3], [87.8, 68.6]]) { cCyl(x, y, 0.33, 0.15, 1.05, (a) => frac(a * 2 + 5) < 0.1 ? C.INK : (a < -0.2 ? C.CYD : C.DW), () => C.DW); solidC(x, y, 0.35, 1.05, 'low'); }
  cCyl(87.2, 61.2, 0.08, 0.15, 5.5, (a) => a < 0 ? C.S1 : C.S0);
  mat(MAT_OUTSIDE | MAT_EMIT); cBoxC(86.9, 60.9, 5.5, 87.5, 61.5, 5.9, C.S1, C.HOT, C.HOT); mat(MAT_OUTSIDE);
  solidC(87.2, 61.2, 0.12, 5, 'post');
  addLight({ x: 88.5, y: 63.5, z: 5.5, r: 9, k: 1.6, kind: 'glow' });
  cFloor(87, 61, 94, 69, 0.152, (x, y) => (frac((y - 61) / 2.6) < 0.04 && x > 88.5 && x < 90) ? C.CRS : T);
  ZONES.crownYard = { x0: Y.x0, y0: Y.y0, x1: Y.x1, y1: Y.y1, restricted: true, zone: 'crown' };
}
const ZONES = {};                                            // named areas: restricted ground, combat zones
