// =================================================================== THE EDGES: THE SKYLINE ROWS, THE HARBOUR, PIER 7, PIER 9
const PIER9 = { x0: 96, y0: HARBOUR_Y, x1: 124, y1: 106, gate0: 106, gate1: 112 };
const PIER7 = { x0: 18, y0: HARBOUR_Y, x1: 30, y1: 101 };
function onPier(x, y) {
  for (const p of [PIER9, PIER7]) if (x >= p.x0 && x < p.x1 && y >= p.y0 && y < p.y1) return true;
  return false;
}
const SKY_MATS = ['brick', 'stone', 'brickD', 'stucco', 'steel', 'tile', 'concrete'];
// the rows of buildings that close the map to the north and the west: facades only, nobody goes in
function buildEdges() {
  const north = [[-33, -22, 26], [-22, -8, 17], [-8, 6, 21], [6, 18, 14], [18, 30, 19], [30, 40, 24], [40, 52, 16], [52, 64, 28], [64, 76, 15], [76, 90, 22], [90, 100, 18], [100, 112, 25], [112, 126, 16]];
  north.forEach(([x0, x1, h], k) => {
    const m = MATL[SKY_MATS[k % SKY_MATS.length]], w = x1 - x0;
    const shops = [{ u0: 0.4, u1: w / 2 - 0.2, kind: k % 3 ? 'shop' : 'diner' }, { u0: w / 2 + 0.2, u1: w - 0.4, kind: k % 2 ? 'dark' : 'shop' }];
    bld(x0, -44, x1, -33, h, null, F(m, w, h, { lit: 0.25 + hash(k, 3) * 0.25, seed: 40 + k, wp: 1.8 + (k % 3) * 0.3, shops }));
  });
  neonTextY(-33, -8, 0.8, 3.3, 'PAWN', C.BRASS, 25, 1.1);
  bladeSign('y', 83, -33, 5, 'HOTEL', C.GLOW, 17);
  addLight({ x: 83, y: -31, z: 6, r: 6, k: 1.1, tag: 17 });
  neonTextY(-33, 52, 1.5, 3.3, 'CAFE', C.CORAL, 26, 1.1);
  addLight({ x: 54, y: -31.6, z: 3, r: 4.5, k: 1.2, tag: 26, map: REDW });
  const west = [[-33, -20, 18], [-20, -8, 24], [-8, 6, 15], [6, 20, 20], [20, 32, 13], [32, 46, 22], [46, 58, 16], [58, 72, 19], [72, 84, 12], [84, 92, 10]];
  west.forEach(([y0, y1, h], k) => {
    const m = MATL[SKY_MATS[(k + 2) % SKY_MATS.length]], w = y1 - y0;
    const shops = [{ u0: 0.4, u1: w / 2 - 0.2, kind: k % 2 ? 'shop' : 'dark' }, { u0: w / 2 + 0.2, u1: w - 0.4, kind: k % 3 ? 'shop' : 'lobby' }];
    bld(-44, y0, -33, y1, h, F(m, w, h, { lit: 0.25 + hash(k, 5) * 0.25, seed: 60 + k, wp: 1.9 + (k % 2) * 0.4, shops }), null);
  });
  bld(-44, -44, -33, -33, 34, F(MATL.stone, 11, 34, { lit: 0.3, seed: 80, pier: C.STS }), F(MATL.stone, 11, 34, { lit: 0.3, seed: 81, pier: C.STS }));
  neonTextX(-33, 32, 1.2, 3.3, 'BOWLING', C.RED, 28, 1.1);
  addLight({ x: -31.6, y: 28, z: 3, r: 4.5, k: 1.2, tag: 28, map: REDW });
}
// ------------------------------------------------------------------ water, quays, piers
function waterSh(x, y, px, py) { return vnoise(x * 0.9, y * 2.2, 77) + bay(px, py) * 0.25 > 0.78 ? C.PNV : C.DW; }
function pierEdge(x0, y0, x1, y1) {        // the two visible faces of a pier deck, piles down into the water
  const sh = (u, z) => z > 0.02 ? C.ST0 : (frac(u / 1.5) < 0.12 ? C.DBR : (z > -0.3 ? C.INK : T));
  cWallY(y1, x0, x1, WATER_Z, 0.15, (x, z) => sh(x, z));
  cWallX(x1, y0, y1, WATER_Z, 0.15, (y, z) => sh(y, z));
}
// a stone kerb along the water's edge: it stops a car that rolls into it, not one that takes it at speed
function quayKerb(x0, y0, x1, y1, nx, ny) {
  cBoxC(x0, y0, 0.15, x1, y1, 0.35, C.ST2, C.ST0, C.ST1);
  STATICS.push({ x0: x0 - (nx < 0 ? 0.5 : 0), y0: y0 - (ny < 0 ? 0.5 : 0), x1: x1 + (nx > 0 ? 0.5 : 0), y1: y1 + (ny > 0 ? 0.5 : 0), h: 0.35, kind: 'quay', nx, ny });
}
function bollard(x, y) { cCyl(x, y, 0.16, 0.15, 0.7, (a) => a < -0.2 ? C.S1 : C.S0, () => C.S1); solidC(x, y, 0.2, 0.7, 'low'); }
function buildHarbour() {
  layer(0);
  mat(MAT_OUTSIDE | MAT_PUDDLE | MAT_WATER);
  cFloor(MAP.x0 - 10, HARBOUR_Y, MAP.x1 + 20, MAP.y1 + 12, WATER_Z, waterSh);
  cFloor(HARBOUR_X, MAP.y0 - 10, MAP.x1 + 20, HARBOUR_Y, WATER_Z, waterSh);
  mat(MAT_OUTSIDE);
  const quay = (u, z) => z > 0.05 ? C.ST2 : (frac(z / 0.45) < 0.1 || frac(u / 1.2 + (Math.floor(z / 0.45) & 1) * 0.5) < 0.04 ? C.INK : C.ST0);
  cWallY(HARBOUR_Y, MAP.x0, PIER7.x0, WATER_Z, 0.15, (x, z) => quay(x, z));
  cWallY(HARBOUR_Y, PIER7.x1, PIER9.x0, WATER_Z, 0.15, (x, z) => quay(x, z));
  cWallX(HARBOUR_X, MAP.y0, HARBOUR_Y, WATER_Z, 0.15, (y, z) => quay(y, z));
  for (let x = -40; x < PIER9.x0; x += 6) if (x < PIER7.x0 - 0.5 || x > PIER7.x1 + 0.5) bollard(x, HARBOUR_Y - 0.4);
  for (let y = -38; y < HARBOUR_Y; y += 6) bollard(HARBOUR_X - 0.4, y);
  quayKerb(MAP.x0, HARBOUR_Y - 0.25, PIER7.x0, HARBOUR_Y, 0, 1);
  quayKerb(PIER7.x1, HARBOUR_Y - 0.25, PIER9.x0, HARBOUR_Y, 0, 1);
  quayKerb(HARBOUR_X - 0.25, MAP.y0, HARBOUR_X, PIER9.y0, 1, 0);
  // pier 7: a small shed, open deck
  slab(PIER7.x0, PIER7.y0, PIER7.x1, PIER7.y1, (x, y, px, py) => boardSh(x, y, px, py, 0), false, false);
  pierEdge(PIER7.x0, PIER7.y0, PIER7.x1, PIER7.y1);
  quayKerb(PIER7.x0, PIER7.y1 - 0.25, PIER7.x1, PIER7.y1, 0, 1); quayKerb(PIER7.x1 - 0.25, PIER7.y0, PIER7.x1, PIER7.y1, 1, 0);
  quayKerb(PIER7.x0, PIER7.y0, PIER7.x0 + 0.25, PIER7.y1, -1, 0);
  bld(19, 94, 24, 100, 4.5, F(MATL.plank, 6, 4.5, { lit: 0.1, seed: 90, gh: 4.4, shops: [{ u0: 0.6, u1: 2.2, kind: 'garage', text: 'PIER 7', tc: C.CREAM }] }), F(MATL.plank, 5, 4.5, { lit: 0, seed: 91, gh: 4.4 }),
    { enter: 'shed', name: 'PIER 7 SHED', doors: [{ face: 'x', u: 3.6, w: 1.6, kind: 'steel' }] });
  for (let x = 20; x < 30; x += 3) bollard(x, PIER7.y1 - 0.4);
  lampPost(28.5, 95);
  buildPier9();
}
// ------------------------------------------------------------------ Pier 9: the Asterion Shipping yard, run by the mob at night
const P9_CRATES = [];
function crate(x0, y0, x1, y1, h) {
  cBox(x0, y0, 0.15, x1, y1, 0.15 + h, (x, y) => (frac(x / 0.6) < 0.08 || frac(y / 0.6) < 0.08) ? C.DBR : C.WOOD,
    (y, z) => (frac((z - 0.15) / 0.55) < 0.1 || frac(y / 1.1) < 0.06) ? C.DBR : C.BRN, (x, z) => (frac((z - 0.15) / 0.55) < 0.1 || frac(x / 1.1) < 0.06) ? C.DBR : C.WOOD);
  solid(x0, y0, x1, y1, h + 0.15, h > 1.6 ? 'wall' : 'low');
  P9_CRATES.push([x0, y0, x1, y1, h]);
}
function buildPier9() {
  const P = PIER9;
  slab(P.x0, P.y0, P.x1, P.y1, (x, y, px, py) => {
    if (frac(x / 3) < 0.02 || frac(y / 3) < 0.02) return C.INK;
    if (Math.abs(y - 99) < 0.06 && x > 104) return C.PALEY;
    return vnoise(x * 0.7, y * 0.7, 91) + bay(px, py) * 0.2 > 0.72 ? C.ST0 : C.ST1;
  }, false, false);
  pierEdge(P.x0, P.y0, P.x1, P.y1);
  const fence = (u, z) => z > 2.0 ? C.S1 : (frac(u / 2.5) < 0.04 ? C.S1 : ((Math.floor(u * 10) + Math.floor(z * 10)) & 1) && ((Math.floor(u * 10) ^ Math.floor(z * 10)) & 2) ? C.S0 : T);
  cWallY(P.y0 + 0.2, P.x0, P.gate0, 0.15, 2.1, (x, z) => fence(x, z));
  cWallY(P.y0 + 0.2, P.gate1, P.x1, 0.15, 2.1, (x, z) => fence(x, z));
  solid(P.x0, P.y0, P.gate0, P.y0 + 0.3, 2.1, 'fence'); solid(P.gate1, P.y0, P.x1, P.y0 + 0.3, 2.1, 'fence');
  for (const gx of [P.gate0, P.gate1]) cBoxC(gx - 0.15, P.y0 + 0.05, 0.15, gx + 0.15, P.y0 + 0.35, 2.5, C.S2, C.S1, C.S0);
  cWallY(P.y0 + 0.21, P.gate0 - 5, P.gate0 - 0.6, 1.0, 1.6, (x, z) => wallTextHit('ASTERION', 0.8, 1.56, x - P.gate0 + 5, z, 1) ? C.CREAM : C.DW);
  quayKerb(P.x0, P.y1 - 0.25, P.x1, P.y1, 0, 1); quayKerb(P.x1 - 0.25, P.y0, P.x1, P.y1, 1, 0);
  quayKerb(P.x0, P.y0 + 0.3, P.x0 + 0.25, 95, -1, 0);
  for (let x = P.x0 + 2; x < P.x1; x += 4) bollard(x, P.y1 - 0.4);
  for (let y = P.y0 + 3; y < P.y1; y += 4) bollard(P.x1 - 0.4, y);
  // the warehouse: its face onto the yard; an office up a stair inside
  bld(96, 95, 103, 106, 8, F(MATL.plank, 11, 8, { lit: 0.1, seed: 92, gh: 5.2, shops: [{ u0: 5.0, u1: 8.0, kind: 'garage' }] }), F(MATL.plank, 7, 8, { lit: 0.1, seed: 93, gh: 5.2 }),
    { enter: 'mobwarehouse', name: 'PIER 9 WAREHOUSE', levels: [0, 1], fh: 2.5, doors: [{ face: 'x', u: 3.2, w: 1.2, kind: 'steel' }], zone: 'pier9', key: 'pier9' });
  neonTextX(103, 106, 2.4, 7.0, 'PIER 9', C.CREAM, 0, 2.0);
  crate(104.5, 95.0, 106.3, 96.6, 1.1); crate(106.3, 95.0, 107.9, 96.6, 2.2);
  crate(111.0, 100.5, 113.2, 101.9, 1.1); crate(115.5, 95.5, 117.0, 98.0, 2.2); crate(117.0, 96.2, 118.4, 97.6, 1.1);
  crate(108.0, 103.0, 110.5, 104.3, 1.1); crate(119.0, 101.5, 120.4, 104.0, 1.1); crate(103.6, 99.5, 105.0, 101.0, 1.1);
  for (const [x, y] of [[113.8, 95.2], [114.5, 95.9], [101.5, 104.8], [121.3, 95.2]]) {
    cCyl(x, y, 0.33, 0.15, 1.05, (a) => frac(a * 2 + 5) < 0.1 ? C.INK : (a < -0.2 ? C.CRIM : C.OX), () => C.OX);
    solidC(x, y, 0.35, 1.05, 'low');
  }
  layer(1);
  const cx = 121.5, cy = 104.2;
  for (const [dx, dy] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) cCyl(cx + dx, cy + dy, 0.09, 0.15, 11, () => C.OX);
  for (let z = 1; z < 11; z += 1.6) { cLine(cx - 0.9, cy + 0.9, z, cx + 0.9, cy + 0.9, z + 1.4, C.OX); cLine(cx + 0.9, cy - 0.9, z, cx + 0.9, cy + 0.9, z + 1.4, C.OX); }
  cBoxC(cx - 1.2, cy - 1.2, 11, cx + 1.2, cy + 1.2, 12.4, C.OX, C.PLUM, C.PLUM);
  cLine(cx, cy, 12.4, cx - 14, cy - 3, 13.2, C.OX, true); cLine(cx - 14, cy - 3, 13.2, cx - 14, cy - 3, 6, C.S1);
  layer(0);
  solid(cx - 1.1, cy - 1.1, cx + 1.1, cy + 1.1, 11, 'wall');
  addShadowBox(cx - 1.2, cy - 1.2, 11, cx + 1.2, cy + 1.2, 12.4);
  for (const [x, y] of [[104.2, 93.2], [122.8, 93.4]]) {
    cCyl(x, y, 0.08, 0.15, 6.5, (a) => a < 0 ? C.S1 : C.S0);
    mat(MAT_OUTSIDE | MAT_EMIT); cBoxC(x - 0.3, y - 0.3, 6.5, x + 0.3, y + 0.3, 6.9, C.S1, C.HOT, C.HOT); mat(MAT_OUTSIDE);
    solidC(x, y, 0.12, 6, 'post');
    addLight({ x: x + 1.5, y: y + 3.5, z: 6.5, r: 11, k: 1.7 });
  }
  addLight({ x: 103.4, y: 100.5, z: 5.5, r: 3.5, k: 1.2 });
  ZONES.pier9 = { x0: P.x0, y0: P.y0 + 0.3, x1: P.x1, y1: P.y1, restricted: 'night', zone: 'pier9' };
}
// ------------------------------------------------------------------ neon behaviour per tag (FAST_ON, every frame)
const NEON_FX = {
  1: t => ((t % 1320) > 900 && (t % 1320) < 905) ? 0 : 1,
  2: t => 1, 3: t => ((t >> 4) % 37 === 0) ? 0 : 1,
  5: t => ((t >> 4) & 1), 6: t => 1 - ((t >> 4) & 1),
  7: t => (t % 700) < 690 ? 1 : 0, 8: t => ((t >> 5) % 23 === 0) ? 0 : 1,
  9: t => ((t % 1500) > 700 && (t % 1500) < 706) ? 0 : 1,
  10: t => (t % 240) > 30 ? 1 : 0, 11: t => (t % 240) > 60 ? 1 : 0, 12: t => (t % 240) > 90 ? 1 : 0,
  13: t => 1, 14: t => ((t % 900) > 400 && (t % 900) < 404) ? 0 : 1, 15: t => ((t % 2000) < 1700 || (t % 20) < 10) ? 1 : 0,
  17: t => 1, 18: t => ((t >> 3) % 41 === 3) ? 0 : 1, 19: t => 1, 20: t => (t % 90) < 12 ? 1 : 0,
  21: t => ((t % 400) < 360) ? 1 : ((t >> 2) & 1), 23: t => ((t >> 5) & 3) !== 0 ? 1 : 0, 24: t => 1,
  25: t => 1, 26: t => ((t % 1100) > 30 ? 1 : (t >> 2) & 1), 27: t => ((t >> 6) % 19 === 0) ? 0 : 1, 28: t => 1
};
function updateNeon() {
  for (const k in NEON_FX) FAST_ON[k] = NEON_FX[k](tick);
  FAST_ON[10] &= FAST_ON[9]; FAST_ON[11] &= FAST_ON[9]; FAST_ON[12] &= FAST_ON[9];
}
// ------------------------------------------------------------------ build everything
function buildBlocks() {
  buildBlock00(); buildBlock10(); buildBlock20(); buildBlock30(); buildBlock01(); buildBlock02();
  buildBlock11(); buildBlock21(); buildBlock31(); buildBlock12(); buildPlaza(); buildBlock32();
}
function buildCity() {
  buildGround(); buildStreetFurniture(); buildBlocks(); buildEdges(); buildHarbour();
  buildInteriors();
  buildSurf(); buildShadowGrid();
}
