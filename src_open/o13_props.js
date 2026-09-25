// =================================================================== SIGNS AND STREET FURNITURE
// neon text on a +x face (plane x = xw, u from the face's right end y1) or a +y face (plane y = yw, u from x0);
// tagged: it flickers with FAST_ON[tag] at night and is a dark tube by day
function neonTextX(xw, y1, u0, zTop, text, col, tg, sc) {
  const s = sc || 1, tw = textWidth(text) * s / 16;
  layer(zTop > ZCUT + 0.6 ? 1 : 0); mat(MAT_OUTSIDE); tag(tg || 0);
  cWallX(xw + 0.02, y1 - u0 - tw - 0.1, y1 - u0 + 0.1, zTop - 9 * s / 16 - 0.1, zTop + 0.1, (y, z) => wallTextHit(text, u0, zTop, y1 - y, z, s) ? E(col) : T);
  tag(0); layer(0);
}
function neonTextY(yw, x0, u0, zTop, text, col, tg, sc) {
  const s = sc || 1, tw = textWidth(text) * s / 16;
  layer(zTop > ZCUT + 0.6 ? 1 : 0); mat(MAT_OUTSIDE); tag(tg || 0);
  cWallY(yw + 0.02, x0 + u0 - 0.1, x0 + u0 + tw + 0.1, zTop - 9 * s / 16 - 0.1, zTop + 0.1, (x, z) => wallTextHit(text, u0, zTop, x - x0, z, s) ? E(col) : T);
  tag(0); layer(0);
}
// vertical blade sign sticking out of a face. axis 'x': out of a +x face at (xw, yc); 'y': out of a +y face at (xc, yw)
function bladeSign(axis, a, b, z0, text, col, tg, body) {
  const n = text.length, z1 = z0 + n * 0.62 + 0.3, bc = body === undefined ? C.INK : body;
  const letter = (u, z) => {
    const i = Math.floor((z1 - 0.2 - z) / 0.62); if (i < 0 || i >= n) return T;
    const gw = charW(text.charCodeAt(i)) * 1.2 / 16, col0 = Math.floor((u - (0.45 - gw / 2)) * 16 / 1.2), row = Math.floor((z1 - 0.2 - i * 0.62 - z) * 16 / 1.2);
    return glyphBit(text[i], col0, row) ? E(col) : T;
  };
  layer(1); mat(MAT_OUTSIDE);
  if (axis === 'x') {
    cBox(a, b - 0.1, z0, a + 0.9, b + 0.1, z1, flat(bc), flat(C.S1), (x, z) => (x < a + 0.05 || x > a + 0.85 || z < z0 + 0.05 || z > z1 - 0.05) ? E(col) : bc);
    tag(tg || 0); cWallY(b + 0.103, a, a + 0.9, z0, z1, (x, z) => letter(x - a, z)); tag(0);
  } else {
    cBox(a - 0.1, b, z0, a + 0.1, b + 0.9, z1, flat(bc), (y, z) => (y < b + 0.05 || y > b + 0.85 || z < z0 + 0.05 || z > z1 - 0.05) ? E(col) : bc, flat(C.S1));
    tag(tg || 0); cWallX(a + 0.103, b, b + 0.9, z0, z1, (y, z) => letter(b + 0.9 - y, z)); tag(0);
  }
  layer(0);
}
// striped awning over a shopfront on a +y face (x0..x1 at yw) or a +x face (y0..y1 at xw)
function awningY(yw, x0, x1, z, c0, c1) {
  layer(1);
  cBox(x0, yw, z, x1, yw + 1.3, z + 0.12, (x) => frac(x / 0.5) < 0.5 ? c0 : c1, null, (x, zz) => frac(x / 0.5) < 0.5 ? c0 : c1);
  cWallY(yw + 1.3, x0, x1, z - 0.35, z, (x, zz) => (frac(x / 0.5) < 0.5 ? c0 : c1) === c0 && zz < z - 0.25 + Math.abs(frac(x / 0.5) - 0.25) * 0.4 ? T : (frac(x / 0.5) < 0.5 ? c0 : c1));
  layer(0);
}
function awningX(xw, y0, y1, z, c0, c1) {
  layer(1);
  cBox(xw, y0, z, xw + 1.3, y1, z + 0.12, (x, y) => frac(y / 0.5) < 0.5 ? c0 : c1, (y) => frac(y / 0.5) < 0.5 ? c0 : c1, null);
  cWallX(xw + 1.3, y0, y1, z - 0.35, z, (y, zz) => (frac(y / 0.5) < 0.5 ? c0 : c1));
  layer(0);
}
// =================================================================== STREET FURNITURE
const LAMPS = [];                                             // street lamps that can be shot out: {L, x, y, z}
function lampPost(x, y, noLight) {
  layer(0); mat(MAT_OUTSIDE);
  cCyl(x, y, 0.07, 0.15, 3.95, (a) => a < -0.2 ? C.S1 : C.S0);
  cCyl(x, y, 0.14, 0.15, 0.5, (a) => a < -0.2 ? C.S1 : C.S0, () => C.S1);
  mat(MAT_OUTSIDE | MAT_EMIT);
  cSphere(x, y, 4.12, 0.2, (nx, ny) => { curExt = EXT_GLOBE; return ny < -0.4 ? C.HOT : nx * nx + ny * ny > 0.75 ? C.GLOW : C.PALEY; });
  mat(MAT_OUTSIDE);
  cCyl(x, y, 0.1, 4.3, 4.36, () => C.S0, () => C.S0);
  solidC(x, y, 0.16, 4, 'post');
  if (!noLight) { const L = { x, y, z: 4.1, r: 9, k: 3.6 }; registerLight(L, 'street'); CITY_LIGHTS.push(L); LAMPS.push({ L, x, y, z: 4.12 }); }
}
function hydrant(x, y) {
  cCyl(x, y, 0.12, 0.15, 0.7, (a) => a < -0.3 ? C.RED : C.CRIM, () => C.CRIM);
  cCyl(x, y, 0.07, 0.7, 0.8, () => C.CRIM, () => C.RED);
  solidC(x, y, 0.16, 0.8, 'low');
}
function mailbox(x, y) {
  cBoxC(x - 0.22, y - 0.22, 0.15, x + 0.22, y + 0.22, 1.15, C.NBD, C.NAV, C.PNV);
  cStamp(x, y, 1.15, ['.nnn.', 'nnnnn'], { n: C.NBD });
  solid(x - 0.25, y - 0.25, x + 0.25, y + 0.25, 1.2, 'low');
}
function bench(x, y, axis) {
  const L = 0.9, D = 0.25;
  const [x0, y0, x1, y1] = axis === 'x' ? [x - L, y - D, x + L, y + D] : [x - D, y - L, x + D, y + L];
  cBox(x0, y0, 0.15, x1, y1, 0.55, (xx, yy) => frac((axis === 'x' ? yy : xx) / 0.1) < 0.35 ? C.DBR : C.WOOD, flat(C.INK), flat(C.INK));
  if (axis === 'x') cBoxC(x0, y0 - 0.08, 0.55, x1, y0, 0.95, C.WOOD, C.DBR, C.BRN); else cBoxC(x0 - 0.08, y0, 0.55, x0, y1, 0.95, C.WOOD, C.BRN, C.DBR);
  solid(x0, y0, x1, y1, 0.9, 'low');
}
function tree(x, y, s) {
  const k = s || 1;
  layer(0); mat(MAT_OUTSIDE);
  cFloor(x - 0.6, y - 0.6, x + 0.6, y + 0.6, 0.155, (xx, yy) => (frac(xx / 0.2) < 0.25 || frac(yy / 0.2) < 0.25) ? C.S0 : C.INK);
  cCyl(x, y, 0.13, 0.15, 2.4 * k, (a) => a < -0.2 ? C.BRN : C.DBR);
  layer(1);
  const blobs = [[0, 0, 3.4], [0.6, 0.2, 3.1], [-0.5, 0.4, 3.0], [0.2, -0.6, 3.6], [-0.3, -0.2, 4.0], [0.4, 0.5, 3.8]];
  for (const [dx, dy, dz] of blobs) cSphere(x + dx * k, y + dy * k, dz * k, 0.95 * k, (nx, ny, px, py) => {
    const v = -nx * 0.4 - ny * 0.8 + (hash(px, py) - 0.5) * 0.5;
    return v > 0.45 ? C.G2 : v > -0.1 ? C.G1 : C.G0;
  });
  layer(0);
  solidC(x, y, 0.2, 3, 'post');
}
function phoneBooth(x, y) {
  cBox(x - 0.45, y - 0.45, 0.15, x + 0.45, y + 0.45, 2.3, flat(C.CRIM), (yy, z) => z > 0.6 && z < 1.9 ? (bay(Math.floor(yy * 16), Math.floor(z * 16)) < 0.3 ? E(C.GLOW) : E(C.AMB)) : C.CRIM,
    (xx, z) => z > 0.6 && z < 1.9 && Math.abs(xx - x) < 0.35 ? E(C.AMB) : (z > 2.0 && z < 2.2 ? C.CREAM : C.CRIM));
  addLight({ x: x + 0.6, y: y + 0.6, z: 1.8, r: 2.4, k: 0.9 });
  solid(x - 0.45, y - 0.45, x + 0.45, y + 0.45, 2.3, 'wall');
  PHONES.push({ x, y });
}
const PHONES = [];
// a newspaper stand, a trash can, a fire escape up the side of a +y face
function newsStand(x, y) {
  cBox(x - 0.5, y - 0.35, 0.15, x + 0.5, y + 0.35, 1.1, flat(C.G0), flat(C.G1), (xx, z) => z > 0.5 && z < 1.0 ? (frac(xx / 0.25) < 0.5 ? C.CREAM : C.CRS) : C.G1);
  cStamp(x, y - 0.1, 1.1, ['.gggggg.', 'gggggggg'], { g: C.G1 });
  solid(x - 0.5, y - 0.35, x + 0.5, y + 0.35, 1.1, 'low');
}
function trashCan(x, y) {
  cCyl(x, y, 0.22, 0.15, 0.85, (a) => frac(a * 3 + 5) < 0.12 ? C.S0 : (a < -0.2 ? C.S2 : C.S1), () => C.S0);
  solidC(x, y, 0.24, 0.85, 'low');
}
function fireEscapeY(yw, x0, x1, zTop) {
  layer(1); mat(MAT_OUTSIDE);
  for (let z = 4.2; z < zTop - 1; z += 3.1) {
    cBox(x0, yw, z, x1, yw + 0.9, z + 0.06, (x, y) => (frac(x / 0.15) < 0.4 || frac(y / 0.15) < 0.4) ? C.INK : T, null, flat(C.INK));
    cWallY(yw + 0.9, x0, x1, z + 0.06, z + 0.95, (x, zz) => zz > z + 0.88 || frac(x / 0.35) < 0.15 ? C.INK : T);
    cLine(x0 + 0.2, yw + 0.5, z + 0.06, x0 + 1.1, yw + 0.5, z + 3.1, C.INK);
  }
  layer(0);
}
