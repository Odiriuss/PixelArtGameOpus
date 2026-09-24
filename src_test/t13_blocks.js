
// =================================================================== THE SIX BLOCKS
// Facades that matter face +x (onto the avenue east of a block) and +y (onto the street south of it):
// those are the faces the camera sees. Neon tags: see NEON_FX in the harbour file.
function F(base, len, h, o) { return facade(Object.assign({ base, len, h }, o || {})); }
function bld(x0, y0, x1, y1, h, fx, fy, extra) { building(Object.assign({ x0, y0, x1, y1, h, fx, fy, seed: (x0 * 7 + y0) | 0 }, extra || {})); }

function buildBlock00() {           // Hotel Mirador and its corner
  bld(27, 27, 35, 35, 24,
    F(MATL.stone, 8, 24, { lit: 0.38, seed: 1, pier: C.STS, shops: [{ u0: 0.3, u1: 7.7, kind: 'lobby' }] }),
    F(MATL.stone, 8, 24, { lit: 0.38, seed: 2, pier: C.STS, shops: [{ u0: 0.3, u1: 2.6, kind: 'lobby' }, { u0: 2.6, u1: 5.4, kind: 'door' }, { u0: 5.4, u1: 7.7, kind: 'lobby' }] }));
  bladeSign('x', 35, 29.2, 5.2, 'MIRADOR', C.GLOW, 1);
  layer(1); cBox(29, 35, 2.9, 33, 37.2, 3.4, flat(C.S1), flat(C.S0), (x, z) => wallTextHit('MIRADOR', 30.1 - 29, 3.36, x - 29, z) ? E(C.GLOW) : C.INK); layer(0);
  addLight({ x: 31, y: 36.4, z: 2.8, r: 5, k: 1.6 });
  addLight({ x: 36, y: 29.5, z: 7, r: 7, k: 1.1, tag: 1 });
  bld(27, 19, 35, 27, 11, F(MATL.brick, 8, 11, { lit: 0.3, seed: 3, shops: [{ u0: 0.3, u1: 3.9, kind: 'shop', text: 'BARBER', tc: C.CREAM, bg: C.OX }, { u0: 4.1, u1: 7.7, kind: 'dark' }] }), null);
  bld(19, 27, 27, 35, 13, null, F(MATL.stucco, 8, 13, { lit: 0.35, seed: 4, shops: [{ u0: 0.3, u1: 3.8, kind: 'shop' }, { u0: 4.2, u1: 7.7, kind: 'diner' }] }));
  neonTextY(35, 19, 0.7, 3.25, 'DRUGS', C.CYAN, 2, 1.2);
  addLight({ x: 21.5, y: 36.5, z: 3, r: 4.5, k: 1.2, tag: 2, map: CYNW });
  bld(19, 19, 27, 27, 30, F(MATL.steel, 8, 30, { lit: 0.45, seed: 5, wp: 1.6, ww: 1.1 }), F(MATL.steel, 8, 30, { lit: 0.45, seed: 6, wp: 1.6, ww: 1.1 }));
  layer(1); mat(MAT_OUTSIDE | MAT_EMIT); tag(20); cSphere(23, 23, 31.2, 0.25, () => C.RED); tag(0); mat(MAT_OUTSIDE); layer(0);
  roofBox(20, 20, 23, 22, 30, 1.2);
}
function buildBlock10() {           // the Orpheum
  bld(59, 27, 69, 35, 13,
    F(MATL.stucco, 8, 13, { lit: 0.15, seed: 7, wp: 2.6, shops: [{ u0: 0.3, u1: 7.7, kind: 'shop', text: 'TICKETS', tc: C.GLOW }] }),
    F(MATL.stucco, 10, 13, { lit: 0.15, seed: 8, wp: 2.6, shops: [{ u0: 0.3, u1: 9.7, kind: 'lobby' }] }));
  bladeSign('y', 68.2, 35, 4.6, 'ORPHEUM', C.RED, 3, C.CREAM);
  addLight({ x: 68, y: 37, z: 6, r: 7.5, k: 1.2, tag: 3, map: REDW });
  // marquee: text on the front, chasing bulbs top and bottom (tags 5 / 6 alternate)
  layer(1); mat(MAT_OUTSIDE);
  cBox(59.5, 35, 3.1, 67.5, 37.4, 4.5, flat(C.S1), (y, z) => z > 4.3 || z < 3.3 ? C.INK : C.CREAM, (x, z) => {
    if (z > 4.32 || z < 3.28) return C.INK;
    if (z > 4.12 || z < 3.48) return C.S0;
    return wallTextHit('SWEET SMELL OF SUCCESS', 0.4, 4.08, x - 59.5, z, 0.9) ? C.INK : C.CREAM;
  });
  mat(MAT_OUTSIDE);
  for (const tg of [5, 6]) { tag(tg); cWallY(37.405, 59.5, 67.5, 3.28, 4.32, (x, z) => (z > 4.12 || z < 3.48) && Math.abs(frac((x - 59.5) / 0.3) - 0.5) < 0.2 && ((Math.floor((x - 59.5) / 0.3) & 1) === tg - 5) && Math.abs(frac(z / 0.2) - 0.5) < 0.3 ? E(C.HOT) : T); }
  tag(0); layer(0);
  addLight({ x: 63.5, y: 38.2, z: 3.2, r: 6, k: 1.8 });
  bld(61, 19, 69, 27, 9, F(MATL.brick, 8, 9, { lit: 0.3, seed: 9, shops: [{ u0: 0.3, u1: 3.9, kind: 'shop', text: 'RADIO', tc: C.CYAN }, { u0: 4.1, u1: 7.7, kind: 'shop', text: 'HATS', tc: C.PALEY, bg: C.PLUM }] }), null);
  bld(53, 27, 59, 35, 8, null, F(MATL.brickD, 6, 8, { lit: 0.4, seed: 10, shops: [{ u0: 0.3, u1: 5.7, kind: 'diner' }] }));
  neonTextY(35, 53, 0.35, 3.3, 'CHOP SUEY', C.RED, 7, 1.0);
  addLight({ x: 56, y: 36.3, z: 3, r: 4.5, k: 1.2, tag: 7, map: REDW });
  bld(53, 19, 61, 27, 18, F(MATL.brickD, 8, 18, { lit: 0.42, seed: 11 }), F(MATL.brickD, 8, 18, { lit: 0.42, seed: 12 }));
  waterTower(57, 22.5, 18);
}
function buildBlock20() {           // offices, the bank, the Royale, and a garage; an alley runs north-south
  bld(87, 19, 93, 27, 16, F(MATL.stone, 8, 16, { lit: 0.25, seed: 13 }), F(MATL.stone, 6, 16, { lit: 0.25, seed: 14 }));
  bld(87, 27, 93, 35, 9, F(MATL.brick, 8, 9, { lit: 0.2, seed: 15, shops: [{ u0: 0.3, u1: 7.7, kind: 'garage' }] }),
    F(MATL.brick, 6, 9, { lit: 0.2, seed: 16, shops: [{ u0: 0.3, u1: 5.7, kind: 'garage', text: 'GARAGE', tc: C.PALEY }] }));
  bld(97, 27, 103, 35, 12, F(MATL.stone, 8, 12, { lit: 0.1, seed: 17, pier: C.CREAM, wp: 1.6, shops: [{ u0: 0.3, u1: 7.7, kind: 'lobby' }] }),
    F(MATL.stone, 6, 12, { lit: 0.1, seed: 18, pier: C.CREAM, wp: 1.5, shops: [{ u0: 0.2, u1: 5.8, kind: 'lobby', text: 'MERIDIAN BANK', tc: C.BRASS, ts: 0.85 }] }));
  bld(97, 19, 103, 27, 20, F(MATL.brick, 8, 20, { lit: 0.4, seed: 19, shops: [{ u0: 0.3, u1: 7.7, kind: 'lobby' }] }), F(MATL.brick, 6, 20, { lit: 0.4, seed: 20 }));
  bladeSign('x', 103, 23, 4.8, 'ROYALE', C.LAV, 13);
  addLight({ x: 104.5, y: 23, z: 6.5, r: 6.5, k: 1.2, tag: 13 });
  roofBox(98, 20, 101, 22, 20, 1.5);
}
function buildBlock01() {           // the Nickel Mile: Volta, the Blue Comet, LOANS; an alley runs north-south
  bld(29, 53, 35, 58, 6.5, F(MATL.stucco, 5, 6.5, { lit: 0.5, seed: 21, gh: 3.4, shops: [{ u0: 0.2, u1: 4.8, kind: 'diner' }] }), F(MATL.stucco, 6, 6.5, { lit: 0.5, seed: 22 }));
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
  bld(29, 58, 35, 65, 8.5, F(comet, 7, 8.5, { lit: 0.3, seed: 23, gh: 3.2, shops: [{ u0: 0, u1: 7, kind: 'wall' }], base: comet }), F(MATL.brickD, 6, 8.5, { lit: 0.3, seed: 24 }));
  layer(1);
  cBox(35, 59.4, 2.95, 36.5, 63.6, 3.5, flat(C.INK), (y, z) => z < 3.03 ? C.BLK : C.INK, flat(C.BLK));
  tag(9); cWallX(36.505, 59.4, 63.6, 3.05, 3.46, (y, z) => wallTextHit('BLUE COMET', 0.27, 3.45, 63.6 - y, z) ? E(C.NBL) : T);
  tag(0); mat(MAT_OUTSIDE | MAT_EMIT); cWallX(36.506, 59.4, 63.6, 2.95, 3.02, (y) => frac(y / 0.25) < 0.4 ? C.HOT : C.S1); mat(MAT_OUTSIDE);
  // the comet: a star head and three trails, each lit in turn (tags 9..12)
  for (let k = 0; k < 4; k++) {
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
  bld(29, 65, 35, 69, 7.5, F(MATL.brick, 4, 7.5, { lit: 0.35, seed: 25, shops: [{ u0: 0.2, u1: 3.8, kind: 'shop', text: 'LOANS', tc: C.BRASS, bg: C.DBR }] }), F(MATL.brick, 6, 7.5, { lit: 0.35, seed: 26 }));
  cStamp(35.3, 66.8, 3.9, ['.yy..yy.', 'yyyyyyyy', '.yy..yy.', '...yy...', '..yyyy..', '...yy...'], { y: C.BRASS });
  // west of the alley: apartments over a liquor store
  bld(19, 53, 25, 69, 12, F(MATL.brickD, 16, 12, { lit: 0.35, seed: 27 }), F(MATL.brickD, 6, 12, { lit: 0.35, seed: 28, shops: [{ u0: 0.3, u1: 5.7, kind: 'shop' }] }));
  neonTextY(69, 19, 0.5, 3.3, 'LIQUORS', C.GRNL, 19, 1.0);
  addLight({ x: 22, y: 70.4, z: 3, r: 4.2, k: 1.2, tag: 19, map: GRNW });
  addLight({ x: 27, y: 61, z: 3.5, r: 4.5, k: 1.3 });                                      // a bulb over the alley
  layer(0); mat(MAT_OUTSIDE | MAT_EMIT); cStamp(25.05, 61, 3.6, ['.ggg.', 'ghhhg', '.ggg.'], { g: C.AMB, h: C.HOT }); mat(MAT_OUTSIDE);
}
function buildPlaza() {             // block (1,1): a paved square round a fountain
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
function buildBlock21() {           // Crown Energy: pumps under a canopy, a garage, a lot
  bld(87, 53, 94, 60, 4.5, F(MATL.stucco, 7, 4.5, { lit: 0.6, seed: 31, gh: 3.4, shops: [{ u0: 0.2, u1: 4.5, kind: 'shop', text: 'SERVICE', tc: C.CYAN }, { u0: 4.6, u1: 6.8, kind: 'door' }] }),
    F(MATL.stucco, 7, 4.5, { lit: 0.6, seed: 32, gh: 3.4, shops: [{ u0: 0.2, u1: 3.3, kind: 'garage' }, { u0: 3.5, u1: 6.8, kind: 'garage' }] }));
  bld(95, 53, 103, 58, 6, F(MATL.brick, 5, 6, { lit: 0.2, seed: 33 }), F(MATL.brick, 8, 6, { lit: 0.2, seed: 34, shops: [{ u0: 0.3, u1: 7.7, kind: 'garage', text: 'AUTO REPAIR', tc: C.PALEY }] }));
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
  // the parking lot: painted stalls
  cFloor(87, 61, 94, 69, 0.152, (x, y) => (frac((y - 61) / 2.6) < 0.04 && x > 88.5) ? C.CRS : T);
}
function buildBlocks() { buildBlock00(); buildBlock10(); buildBlock20(); buildBlock01(); buildPlaza(); buildBlock21(); }
