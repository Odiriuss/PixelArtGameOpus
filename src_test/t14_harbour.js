
// =================================================================== THE EDGES: SKYLINE ROWS, HARBOUR, PIER 9
const PIER9 = { x0: 96, y0: HARBOUR_Y, x1: 124, y1: 106, gate0: 106, gate1: 112 };
const PIER7 = { x0: 18, y0: HARBOUR_Y, x1: 30, y1: 101 };
function onPier(x, y) {
  for (const p of [PIER9, PIER7]) if (x >= p.x0 && x < p.x1 && y >= p.y0 && y < p.y1) return true;
  return false;
}
const SKY_MATS = ['brick', 'stone', 'brickD', 'stucco', 'steel', 'tile'];
function buildSkyline() {
  // north row: +y faces onto the first street. [x0, x1, h, material, shops/sign]
  const north = [[-8, 6, 26], [6, 18, 17], [18, 30, 21], [30, 40, 14], [40, 52, 19], [52, 64, 24], [64, 76, 16], [76, 90, 28], [90, 100, 15], [100, 112, 22], [112, 126, 18]];
  north.forEach(([x0, x1, h], k) => {
    const m = MATL[SKY_MATS[k % SKY_MATS.length]];
    const shops = [{ u0: 0.4, u1: (x1 - x0) / 2 - 0.2, kind: k % 3 ? 'shop' : 'diner' }, { u0: (x1 - x0) / 2 + 0.2, u1: x1 - x0 - 0.4, kind: k % 2 ? 'dark' : 'shop' }];
    bld(x0, -8, x1, 1, h, null, F(m, x1 - x0, h, { lit: 0.25 + hash(k, 3) * 0.25, seed: 40 + k, wp: 1.8 + (k % 3) * 0.3, shops }));
  });
  neonTextY(1, 6, 0.8, 3.3, "LUCKY'S BAR", C.CORAL, 21, 1.1);
  addLight({ x: 9, y: 2.4, z: 3, r: 4.5, k: 1.2, tag: 21, map: REDW });
  neonTextY(1, 64, 1.5, 3.3, 'DANCING', C.LAV, 23, 1.1);
  bladeSign('y', 83, 1, 5, 'HOTEL', C.GLOW, 17);
  addLight({ x: 83, y: 3, z: 6, r: 6, k: 1.1, tag: 17 });
  // the Herald's rooftop sign on its frame
  layer(1);
  for (let x = 41; x <= 51; x += 2.5) cBoxC(x - 0.06, -1.2, 19, x + 0.06, -1.1, 21.8, C.S0, C.INK, C.INK);
  tag(15); mat(MAT_OUTSIDE);
  cWallY(-1.0, 40.5, 51.5, 19.4, 22, (x, z) => wallTextHit('THE HERALD', 0.25, 21.9, x - 40.5, z, 2.8) ? E(C.RED) : T);
  tag(0); layer(0);
  addLight({ x: 46, y: 2, z: 20, r: 10, k: 1.0, tag: 15, map: REDW });
  // Atomic Cola billboard
  layer(1);
  cBoxC(92, -2.2, 15, 92.2, -2, 16.2, C.S0, C.INK, C.INK); cBoxC(98, -2.2, 15, 98.2, -2, 16.2, C.S0, C.INK, C.INK);
  cWallY(-1.9, 91, 99.4, 16.2, 19.6, (x, z) => {
    if (x < 91.1 || x > 99.3 || z < 16.3 || z > 19.5) return C.CREAM;
    if (wallTextHit('ATOMIC', 0.45, 19.3, x - 91, z, 1.4)) return C.CRIM;
    if (wallTextHit('COLA', 1.6, 18.2, x - 91, z, 1.4)) return C.CRIM;
    const d = Math.hypot(x - 97.8, z - 17.3); return d < 0.8 ? (Math.abs(d - 0.5) < 0.07 ? C.CRIM : C.CREAM) : C.PALEY;
  });
  layer(0);
  addLight({ x: 95, y: 0, z: 20.5, r: 5, k: 1.4 });
  // west row: +x faces onto the first avenue
  const west = [[1, 12, 18], [12, 24, 24], [24, 36, 15], [36, 48, 20], [48, 60, 13], [60, 72, 22], [72, 84, 16], [84, 92, 10]];
  west.forEach(([y0, y1, h], k) => {
    const m = MATL[SKY_MATS[(k + 2) % SKY_MATS.length]];
    const shops = [{ u0: 0.4, u1: (y1 - y0) / 2 - 0.2, kind: k % 2 ? 'shop' : 'dark' }, { u0: (y1 - y0) / 2 + 0.2, u1: y1 - y0 - 0.4, kind: k % 3 ? 'shop' : 'lobby' }];
    bld(-8, y0, 1, y1, h, F(m, y1 - y0, h, { lit: 0.25 + hash(k, 5) * 0.25, seed: 60 + k, wp: 1.9 + (k % 2) * 0.4, shops }), null);
  });
  bld(-8, -8, 1, 1, 34, F(MATL.stone, 9, 34, { lit: 0.3, seed: 80, pier: C.STS }), F(MATL.stone, 9, 34, { lit: 0.3, seed: 81, pier: C.STS }));
  neonTextX(1, 48, 1.2, 3.3, 'BILLIARDS', C.GRNL, 18, 1.1);
  addLight({ x: 2.4, y: 42, z: 3, r: 4.5, k: 1.2, tag: 18, map: GRNW });
  bladeSign('x', 1, 17, 4.6, 'ASTOR', C.NBL, 24);
  addLight({ x: 2.5, y: 17, z: 6, r: 6, k: 1.1, tag: 24, map: BLUW });
}
// ------------------------------------------------------------------ water, quays, piers
function waterSh(x, y, px, py) { return vnoise(x * 0.9, y * 2.2, 77) + bay(px, py) * 0.25 > 0.78 ? C.PNV : C.DW; }
function pierEdge(x0, y0, x1, y1) {        // the two visible faces of a pier deck, piles down into the water
  const sh = (u, z) => z > 0.02 ? C.ST0 : (frac(u / 1.5) < 0.12 ? C.DBR : (z > -0.3 ? C.INK : T));
  cWallY(y1, x0, x1, WATER_Z, 0.15, (x, z) => sh(x, z));
  cWallX(x1, y0, y1, WATER_Z, 0.15, (y, z) => sh(y, z));
}
// a stone kerb along the water's edge, on the land side of it: it stops a car that rolls into it, not one that
// takes it at speed (the collision box reaches 0.5 m out over the water, on the side the normal points to)
function quayKerb(x0, y0, x1, y1, nx, ny) {
  cBoxC(x0, y0, 0.15, x1, y1, 0.35, C.ST2, C.ST0, C.ST1);
  STATICS.push({ x0: x0 - (nx < 0 ? 0.5 : 0), y0: y0 - (ny < 0 ? 0.5 : 0), x1: x1 + (nx > 0 ? 0.5 : 0), y1: y1 + (ny > 0 ? 0.5 : 0), h: 0.35, kind: 'quay', nx, ny });
}
function bollard(x, y) { cCyl(x, y, 0.16, 0.15, 0.7, (a) => a < -0.2 ? C.S1 : C.S0, () => C.S1); solidC(x, y, 0.2, 0.7, 'low'); }
function buildHarbour() {
  layer(0);
  // water, far below the quay
  mat(MAT_OUTSIDE | MAT_PUDDLE | MAT_WATER);
  cFloor(MAP.x0 - 10, HARBOUR_Y, MAP.x1 + 20, MAP.y1 + 12, WATER_Z, waterSh);
  cFloor(HARBOUR_X, MAP.y0 - 10, MAP.x1 + 20, HARBOUR_Y, WATER_Z, waterSh);
  mat(MAT_OUTSIDE);
  // quay walls: stone down to the water, bollards and a low rail along the edge
  const quay = (u, z) => z > 0.05 ? C.ST2 : (frac(z / 0.45) < 0.1 || frac(u / 1.2 + (Math.floor(z / 0.45) & 1) * 0.5) < 0.04 ? C.INK : C.ST0);
  cWallY(HARBOUR_Y, MAP.x0, PIER7.x0, WATER_Z, 0.15, (x, z) => quay(x, z));
  cWallY(HARBOUR_Y, PIER7.x1, PIER9.x0, WATER_Z, 0.15, (x, z) => quay(x, z));
  cWallX(HARBOUR_X, MAP.y0, HARBOUR_Y, WATER_Z, 0.15, (y, z) => quay(y, z));
  for (let x = 2; x < PIER9.x0; x += 6) if (x < PIER7.x0 - 0.5 || x > PIER7.x1 + 0.5) bollard(x, HARBOUR_Y - 0.4);
  for (let y = 4; y < HARBOUR_Y; y += 6) bollard(HARBOUR_X - 0.4, y);
  quayKerb(MAP.x0, HARBOUR_Y - 0.25, PIER7.x0, HARBOUR_Y, 0, 1);
  quayKerb(PIER7.x1, HARBOUR_Y - 0.25, PIER9.x0, HARBOUR_Y, 0, 1);
  quayKerb(HARBOUR_X - 0.25, MAP.y0, HARBOUR_X, PIER9.y0, 1, 0);
  // pier 7: a small shed, open deck
  slab(PIER7.x0, PIER7.y0, PIER7.x1, PIER7.y1, (x, y, px, py) => boardSh(x, y, px, py, 0), false, false);
  pierEdge(PIER7.x0, PIER7.y0, PIER7.x1, PIER7.y1);
  quayKerb(PIER7.x0, PIER7.y1 - 0.25, PIER7.x1, PIER7.y1, 0, 1); quayKerb(PIER7.x1 - 0.25, PIER7.y0, PIER7.x1, PIER7.y1, 1, 0);
  quayKerb(PIER7.x0, PIER7.y0, PIER7.x0 + 0.25, PIER7.y1, -1, 0);
  bld(19, 94, 24, 100, 4.5, F(MATL.plank, 6, 4.5, { lit: 0.1, seed: 90, gh: 4.4, shops: [{ u0: 1, u1: 5, kind: 'garage', text: 'PIER 7', tc: C.CREAM }] }), F(MATL.plank, 5, 4.5, { lit: 0, seed: 91, gh: 4.4 }));
  for (let x = 20; x < 30; x += 3) bollard(x, PIER7.y1 - 0.4);
  lampPost(28.5, 95);
  buildPier9();
}
// ------------------------------------------------------------------ Pier 9: the yard where the chase ends
const P9_CRATES = [];                           // [x0, y0, x1, y1, h] static crates (cover)
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
    if (Math.abs(y - 99) < 0.06 && x > 104) return C.PALEY;                                       // painted lane line
    return vnoise(x * 0.7, y * 0.7, 91) + bay(px, py) * 0.2 > 0.72 ? C.ST0 : C.ST1;
  }, false, false);
  pierEdge(P.x0, P.y0, P.x1, P.y1);
  // chain-link fence along the quay, with the gate open
  const fence = (u, z) => z > 2.0 ? C.S1 : (frac(u / 2.5) < 0.04 ? C.S1 : ((Math.floor(u * 10) + Math.floor(z * 10)) & 1) && ((Math.floor(u * 10) ^ Math.floor(z * 10)) & 2) ? C.S0 : T);
  cWallY(P.y0 + 0.2, P.x0, P.gate0, 0.15, 2.1, (x, z) => fence(x, z));
  cWallY(P.y0 + 0.2, P.gate1, P.x1, 0.15, 2.1, (x, z) => fence(x, z));
  solid(P.x0, P.y0, P.gate0, P.y0 + 0.3, 2.1, 'fence'); solid(P.gate1, P.y0, P.x1, P.y0 + 0.3, 2.1, 'fence');
  for (const gx of [P.gate0, P.gate1]) { cBoxC(gx - 0.15, P.y0 + 0.05, 0.15, gx + 0.15, P.y0 + 0.35, 2.5, C.S2, C.S1, C.S0); }
  // water's edge
  quayKerb(P.x0, P.y1 - 0.25, P.x1, P.y1, 0, 1); quayKerb(P.x1 - 0.25, P.y0, P.x1, P.y1, 1, 0);
  quayKerb(P.x0, P.y0 + 0.3, P.x0 + 0.25, 95, -1, 0);                                   // between the fence and the warehouse
  for (let x = P.x0 + 2; x < P.x1; x += 4) bollard(x, P.y1 - 0.4);
  for (let y = P.y0 + 3; y < P.y1; y += 4) bollard(P.x1 - 0.4, y);
  // the warehouse: its face onto the yard
  bld(96, 95, 103, 106, 8, F(MATL.plank, 11, 8, { lit: 0.1, seed: 92, gh: 5.2, shops: [{ u0: 3.0, u1: 8.0, kind: 'garage' }] }), F(MATL.plank, 7, 8, { lit: 0.1, seed: 93, gh: 5.2 }));
  neonTextX(103, 106, 2.4, 7.0, 'PIER 9', C.CREAM, 0, 2.0);
  // crates, barrels, a crane
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
  // floodlights
  for (const [x, y] of [[104.2, 93.2], [122.8, 93.4]]) {
    cCyl(x, y, 0.08, 0.15, 6.5, (a) => a < 0 ? C.S1 : C.S0);
    mat(MAT_OUTSIDE | MAT_EMIT); cBoxC(x - 0.3, y - 0.3, 6.5, x + 0.3, y + 0.3, 6.9, C.S1, C.HOT, C.HOT); mat(MAT_OUTSIDE);
    solidC(x, y, 0.12, 6, 'post');
    addLight({ x: x + 1.5, y: y + 3.5, z: 6.5, r: 11, k: 1.7 });
  }
  addLight({ x: 103.4, y: 100.5, z: 5.5, r: 3.5, k: 1.2 });
}
// ------------------------------------------------------------------ neon behaviour per tag
const NEON_FX = {
  1: t => ((t % 1320) > 900 && (t % 1320) < 905) ? 0 : 1,                   // MIRADOR stutters
  2: t => 1, 3: t => ((t >> 4) % 37 === 0) ? 0 : 1,
  5: t => ((t >> 4) & 1), 6: t => 1 - ((t >> 4) & 1),                      // marquee chase
  7: t => (t % 700) < 690 ? 1 : 0, 8: t => ((t >> 5) % 23 === 0) ? 0 : 1,
  9: t => ((t % 1500) > 700 && (t % 1500) < 706) ? 0 : 1,
  10: t => (t % 240) > 30 ? 1 : 0, 11: t => (t % 240) > 60 ? 1 : 0, 12: t => (t % 240) > 90 ? 1 : 0,
  13: t => 1, 14: t => ((t % 900) > 400 && (t % 900) < 404) ? 0 : 1, 15: t => ((t % 2000) < 1700 || (t % 20) < 10) ? 1 : 0,
  17: t => 1, 18: t => ((t >> 3) % 41 === 3) ? 0 : 1, 19: t => 1, 20: t => (t % 90) < 12 ? 1 : 0,
  21: t => ((t % 400) < 360) ? 1 : ((t >> 2) & 1), 23: t => ((t >> 5) & 3) !== 0 ? 1 : 0, 24: t => 1
};
function updateNeon() {
  for (const k in NEON_FX) lightState[k] = NEON_FX[k](tick);
  lightState[10] &= lightState[9]; lightState[11] &= lightState[9]; lightState[12] &= lightState[9];
}
// ------------------------------------------------------------------ build everything
function buildCity() {
  buildGround(); buildStreetFurniture(); buildBlocks(); buildSkyline(); buildHarbour();
  for (const L of CITY.lights) {
    const sx = isoX(L.x, L.y), sy = isoY(L.x, L.y, L.z);
    L.rect = [sx - L.r * 24, sy - L.r * 17 - 4, sx + L.r * 24, sy + L.r * 12 + L.z * 16 + 4];
    if (L.occl === undefined) L.occl = false;
  }
  buildSurf();
}
