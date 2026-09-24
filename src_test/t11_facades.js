
// =================================================================== FACADES
// u runs along a face left -> right as the viewer sees it (+x faces: u = y1 - y; +y faces: u = x - x0).
const STATICS = [];                                          // collision: {x0,y0,x1,y1,h,kind} boxes, {cx,cy,r,h,kind} circles
function solid(x0, y0, x1, y1, h, kind) { STATICS.push({ x0, y0, x1, y1, h, kind: kind || 'wall' }); }
function solidC(cx, cy, r, h, kind) { STATICS.push({ cx, cy, r, h, kind: kind || 'post', circle: true }); }
const CITY = { lights: [], ambient: -0.95, dark: null, neon: [], slabs: [] };
function addLight(L) { CITY.lights.push(L); return L; }

// wall materials (shaders over u, z)
const MATL = {
  brick: bricks(C.HAIRL, C.MAU, C.DBR, 41),
  brickD: bricks(C.HAIRD, C.HAIRL, C.INK, 43),
  stone: (u, z, px, py) => (frac(z / 0.6) < 0.05 || frac(u / 1.2 + (Math.floor(z / 0.6) & 1) * 0.5) < 0.025) ? C.STS : (hash3(Math.floor(u / 1.2), Math.floor(z / 0.6), 5) > 0.86 ? C.STS : C.CRS),
  stucco: (u, z, px, py) => vnoise(u * 1.5, z * 1.5, 9) + bay(px, py) * 0.2 > 0.78 ? C.STS : C.STL,
  tile: (u, z, px, py) => (frac(u / 0.5) < 0.06 || frac(z / 0.5) < 0.06) ? C.G0 : (hash3(Math.floor(u / 0.5), Math.floor(z / 0.5), 3) > 0.8 ? C.G2 : C.G1),
  steel: (u, z, px, py) => frac(u / 1.5) < 0.05 ? C.S2 : C.S0,
  plank: (u, z, px, py) => frac(z / 0.25) < 0.1 ? C.DBR : (hash3(Math.floor(u / 2.1 + (Math.floor(z / 0.25) & 1) * 0.5), Math.floor(z / 0.25), 7) > 0.7 ? C.BRN : C.WOOD)
};
// o: {base, len, h, gh (ground floor), fh (floor), wp (window period), ww, wz (sill), wh, lit, seed, band, frame, shops, top}
function facade(o) {
  const gh = o.gh || 3.6, fh = o.fh || 3.1, wp = o.wp || 2.0, ww = o.ww || 1.0, wz = o.wz || 0.85, wh = o.wh || 1.5;
  const nWin = Math.max(1, Math.floor((o.len - 0.8) / wp)), u0 = (o.len - nWin * wp) / 2;
  const top = o.top === undefined ? C.ST1 : o.top, band = o.band === undefined ? C.ST1 : o.band;
  const fn = (u, z, px, py) => {
    if (z < gh) {
      if (o.shops) for (const s of o.shops) if (u >= s.u0 && u < s.u1) { const c = shopPx(s, u - s.u0, z, px, py, gh); if (c !== undefined) return c; }
      if (z < 0.3) return C.ST0;
      return o.base(u, z, px, py);
    }
    if (z < gh + 0.2) return band;
    if (z > o.h - 0.45) return z > o.h - 0.1 ? C.INK : top;
    if (o.pier && frac((u - u0 + wp / 2) / wp) < 0.06) return o.pier;
    const zz = z - gh - 0.2, fl = Math.floor(zz / fh), zf = zz - fl * fh;
    const k = Math.floor((u - u0) / wp);
    if (k >= 0 && k < nWin && z < o.h - 0.9) {
      const fu = u - u0 - k * wp - (wp - ww) / 2;
      if (fu >= 0 && fu < ww && zf >= wz && zf < wz + wh) return windowPx(o, k, fl, fu, zf - wz, ww, wh, px, py);
      if (fu >= -0.08 && fu < ww + 0.08 && zf >= wz - 0.1 && zf < wz) return band;
    }
    return o.base(u, z, px, py);
  };
  fn.cfg = o;
  return fn;
}
const SPILL = { shop: 1.2, lobby: 1.5, diner: 1.5 };
// warm light from lit shop windows onto the pavement in front of them
function shopSpill(b) {
  if (b.fx && b.fx.cfg && b.fx.cfg.shops) for (const s of b.fx.cfg.shops) if (SPILL[s.kind]) addLight({ x: b.x1 + 1.1, y: b.y1 - (s.u0 + s.u1) / 2, z: 1.5, r: 3.4 + (s.u1 - s.u0) * 0.25, k: SPILL[s.kind] });
  if (b.fy && b.fy.cfg && b.fy.cfg.shops) for (const s of b.fy.cfg.shops) if (SPILL[s.kind]) addLight({ x: b.x0 + (s.u0 + s.u1) / 2, y: b.y1 + 1.1, z: 1.5, r: 3.4 + (s.u1 - s.u0) * 0.25, k: SPILL[s.kind] });
}
function windowPx(o, k, fl, fu, fz, ww, wh, px, py) {
  const frame = o.frame === undefined ? C.INK : o.frame;
  if (fu < 0.07 || fu > ww - 0.07 || fz < 0.06 || fz > wh - 0.06 || Math.abs(fu - ww / 2) < 0.035 || Math.abs(fz - wh * 0.55) < 0.03) return frame;
  const h = hash3(k, fl, o.seed || 0);
  if (h < (o.lit || 0.3)) {
    const kind = hash3(k, fl, (o.seed || 0) + 7);
    if (kind < 0.25 && fz > wh * 0.5) return frac(fz / 0.1) < 0.45 ? E(C.AMB) : C.TRIM;             // blinds half down
    if (kind > 0.9 && Math.abs(fu - ww * 0.35) < 0.1 && fz < wh * 0.6) return C.INK;                 // somebody at the window
    return bay(px, py) < 0.35 ? E(C.GLOW) : E(C.AMB);
  }
  if (h < (o.lit || 0.3) + 0.04) return bay(px, py) < 0.4 ? E(C.WM) : E(C.CYD);                     // a television
  return frac((fu + fz) * 1.3 + k * 0.37) < 0.1 ? C.SLT : C.NAV;
}
// ground-floor shopfronts. s: {u0, u1, kind: shop|lobby|door|dark|garage|diner, text, tc, bg, ts}
function shopPx(s, lu, z, px, py, gh) {
  const w = s.u1 - s.u0;
  if (s.kind === 'wall') return undefined;
  if (z > gh - 0.95) {
    if (z > gh - 0.12) return C.INK;
    if (s.text) {
      const sc = s.ts || 1, tw = textWidth(s.text) * sc / 16;
      if (wallTextHit(s.text, (w - tw) / 2, gh - 0.24, lu, z, sc)) return s.tc === undefined ? C.CREAM : s.tc;
    }
    return s.bg === undefined ? C.INK : s.bg;
  }
  if (lu < 0.1 || lu > w - 0.1 || z < 0.1) return s.frame === undefined ? C.ST0 : s.frame;
  if (s.kind === 'door') return z < 2.3 && lu > w / 2 - 0.5 && lu < w / 2 + 0.5 ? (z > 1.5 ? E(C.AMB) : C.INK) : C.ST0;
  if (s.kind === 'garage') return frac(z / 0.22) < 0.15 ? C.S0 : C.S1;
  if (s.kind === 'dark') return z < 0.55 ? C.ST0 : (frac((lu + z) * 0.9) < 0.07 ? C.SLT : C.NAV);
  if (z < 0.55) return C.ST0;                                                                        // stall riser
  if (s.kind === 'lobby') return frac(lu / 1.2) < 0.05 ? C.BRASS : (bay(px, py) < 0.25 ? E(C.GLOW) : E(C.AMB));
  if (s.kind === 'diner') {
    if (z < 1.0) return frac(lu / 0.5) < 0.3 ? E(C.CRIM) : E(C.OX);                                  // stools and counter
    if (z < 1.08) return E(C.S3);
    return bay(px, py) < 0.2 ? E(C.HOT) : E(C.GLOW);
  }
  // an ordinary lit shop window with goods in it
  if (frac(lu / 1.6) < 0.04) return C.ST0;
  if (z < 1.1 && hash3(Math.floor(lu / 0.4), 1, s.u0 | 0) > 0.55) return E(hash(Math.floor(lu / 0.4), s.u0 | 0) > 0.5 ? C.CORAL : C.BRASS);
  return bay(px, py) < 0.3 ? E(C.GLOW) : E(C.AMB);
}
// roofs: tar with vents; cap: the dark cut surface seen when the top of a building is cut away
function roofSh(seed) { return (x, y, px, py) => (frac(x / 2.5) < 0.03 || frac(y / 2.5) < 0.03) ? C.ST0 : (vnoise(x * 0.8, y * 0.8, seed) + bay(px, py) * 0.2 > 0.75 ? C.ST0 : C.INK); }
function capSh(b) { return (x, y) => (x < b.x0 + 0.12 || y < b.y0 + 0.12 || x > b.x1 - 0.12 || y > b.y1 - 0.12) ? C.ST0 : C.BLK; }

// ------------------------------------------------------------------ a building: split into UNDER and OVER at ZCUT
// b: {x0, y0, x1, y1, h, fx: facade for the +x face (u, z), fy: for the +y face, roof, noCol}
function building(b) {
  const zc = Math.min(ZCUT, b.h);
  const shX = b.fx ? (y, z, px, py) => b.fx(b.y1 - y, z, px, py) : flat(C.INK);
  const shY = b.fy ? (x, z, px, py) => b.fy(x - b.x0, z, px, py) : flat(C.INK);
  layer(0); mat(MAT_OUTSIDE);
  cWallX(b.x1, b.y0, b.y1, 0, zc, shX); cWallY(b.y1, b.x0, b.x1, 0, zc, shY);
  cFloor(b.x0, b.y0, b.x1, b.y1, zc, capSh(b));
  if (b.h > zc) {
    layer(1);
    cWallX(b.x1, b.y0, b.y1, zc, b.h, shX); cWallY(b.y1, b.x0, b.x1, zc, b.h, shY);
    cFloor(b.x0, b.y0, b.x1, b.y1, b.h, b.roof || roofSh(b.seed || 3));
    // parapet along the two visible roof edges
    cBox(b.x1 - 0.25, b.y0, b.h, b.x1, b.y1, b.h + 0.5, flat(C.ST1), flat(C.ST0), flat(C.ST0));
    cBox(b.x0, b.y1 - 0.25, b.h, b.x1 - 0.25, b.y1, b.h + 0.5, flat(C.ST1), flat(C.ST0), flat(C.ST0));
    layer(0);
  }
  if (!b.noCol) solid(b.x0, b.y0, b.x1, b.y1, 50, 'wall');
  shopSpill(b);
}
function waterTower(x, y, z) {
  layer(1);
  for (const [dx, dy] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) cCyl(x + dx, y + dy, 0.06, z, z + 2.2, () => C.INK);
  cCyl(x, y, 1.3, z + 2.2, z + 4.4, (a, zz) => frac(a * 3 + 5) < 0.1 ? C.INK : (a < -0.2 ? C.BRN : C.DBR), () => C.DBR);
  cCyl(x, y, 1.35, z + 4.4, z + 4.9, (a) => a < -0.2 ? C.ST1 : C.ST0, () => C.ST1);
  layer(0);
}
function roofBox(x0, y0, x1, y1, z, h) { layer(1); cBoxC(x0, y0, z, x1, y1, z + h, C.ST1, C.ST0, C.INK); layer(0); }

// ------------------------------------------------------------------ neon and signs (tagged: they flicker with lightState)
// text on a +x face (plane x = xw, u from the face's right end y1) or a +y face (plane y = yw, u from x0)
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
function lampPost(x, y, noLight) {
  layer(0); mat(MAT_OUTSIDE);
  cCyl(x, y, 0.07, 0.15, 3.95, (a) => a < -0.2 ? C.S1 : C.S0);
  cCyl(x, y, 0.14, 0.15, 0.5, (a) => a < -0.2 ? C.S1 : C.S0, () => C.S1);
  mat(MAT_OUTSIDE | MAT_EMIT);
  cSphere(x, y, 4.12, 0.2, (nx, ny) => ny < -0.4 ? C.HOT : nx * nx + ny * ny > 0.75 ? C.GLOW : C.PALEY);
  mat(MAT_OUTSIDE);
  cCyl(x, y, 0.1, 4.3, 4.36, () => C.S0, () => C.S0);
  solidC(x, y, 0.16, 4, 'post');
  if (!noLight) addLight({ x, y, z: 4.1, r: 9, k: 3.6 });
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
}
