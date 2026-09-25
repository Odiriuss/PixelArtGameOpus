// =================================================================== THE CITY: GRID, STREETS, SIDEWALKS
// Avenues run along y at AV[i], streets along x at ST[j]; roads are 12 m wide, right-hand traffic. Blocks (c, r) sit
// between them. Downtown is the top two rows, the Nickel Mile the third; the South Docks and the harbour lie south of
// the last street and east of the last avenue. Ferrier Street is ST[2].
const AV = [-24, 10, 44, 78, 112], ST = [-24, 10, 44, 78], RW = 6, SWK = 3, LN = 2.4;
const NCOL = AV.length - 1, NROW = ST.length - 1;
const MAP = { x0: -44, y0: -44, x1: 132, y1: 112 };
const HARBOUR_Y = 92, HARBOUR_X = 125, WATER_Z = -0.8;
const STREET_NAMES = ['KESTREL STREET', 'CANAL STREET', 'FERRIER STREET', 'WATER STREET'];
const AVENUE_NAMES = ['ASHBURY AVENUE', 'FIRST AVENUE', 'MERIDIAN AVENUE', 'THIRD AVENUE', 'HARBOR AVENUE'];
function blockRect(c, r) { return [AV[c] + RW, ST[r] + RW, AV[c + 1] - RW, ST[r + 1] - RW]; }
function slab(x0, y0, x1, y1, sh, kerbX, kerbY) {
  layer(0); mat(MAT_OUTSIDE);
  cFloor(x0, y0, x1, y1, 0.15, sh);
  if (kerbX) cWallX(x1, y0, y1, 0, 0.15, flat(C.ST1));
  if (kerbY) cWallY(y1, x0, x1, 0, 0.15, flat(C.ST1));
  CITY.slabs.push([x0, y0, x1, y1]);
}
// sidewalk flagstones within SWK of a block edge, cobbles inside (courtyards, alleys)
function blockSh(x0, y0, x1, y1, seed) {
  const walk = flagstones(C.ST1, C.VIO, C.ST0, seed, 0.7), cob = flagstones(C.INK, C.ST0, C.BLK, seed + 1, 0.3);
  return (x, y, px, py) => {
    const e = Math.min(x - x0, y - y0, x1 - x, y1 - y);
    if (e < 0.22) return C.ST2;                                              // kerbstone
    if (e < SWK) return walk(x, y, px, py);
    return cob(x, y, px, py);
  };
}
const ROAD_ASPH = (x, y, px, py) => { const v = vnoise(x * 1.7, y * 1.7, 19) * 0.6 + vnoise(x * 6, y * 6, 20) * 0.25 + hash(px, py) * 0.15; return v > 0.66 ? C.SLT : v > 0.36 ? C.NAV : C.INK; };
// a road segment along x (axis 0) or y (axis 1) centred on c; rails for the streetcar line
function roadSh(axis, c, rails) {
  return (x, y, px, py) => {
    const a = axis ? x : y, l = axis ? y : x, d = a - c, ad = Math.abs(d);
    if (rails) { const r = Math.abs(ad - 0.72); if (r < 0.035) return C.S1; if (r < 0.09) return C.BLK; }
    else if (ad < 0.06 && frac(l / 3.2) < 0.5) return C.CRS;                  // centre dashes
    if (ad > RW - 0.12) return C.BLK;                                          // gutter
    return ROAD_ASPH(x, y, px, py);
  };
}
function crossingSh(axis) { return (x, y) => frac((axis ? x : y) / 0.9) < 0.45 ? C.ST1 : T; }
const TRAM_AV = 2;                                           // the streetcar runs up Meridian Avenue
function buildGround() {
  layer(0);
  const nA = AV.length, nS = ST.length, aY0 = ST[0] - RW, aY1 = ST[nS - 1] + RW, sX0 = AV[0] - RW, sX1 = AV[nA - 1] + RW;
  // ---- roads
  mat(MAT_OUTSIDE | MAT_GLOSS);
  for (let i = 0; i < nA; i++) for (let j = 0; j < nS - 1; j++) cFloor(AV[i] - RW, ST[j] + RW, AV[i] + RW, ST[j + 1] - RW, 0, roadSh(1, AV[i], i === TRAM_AV));
  for (let j = 0; j < nS; j++) for (let i = 0; i < nA - 1; i++) cFloor(AV[i] + RW, ST[j] - RW, AV[i + 1] - RW, ST[j] + RW, 0, roadSh(0, ST[j], false));
  for (const x of AV) for (const y of ST) cFloor(x - RW, y - RW, x + RW, y + RW, 0, (xx, yy, px, py) => {
    if (x === AV[TRAM_AV]) { const r = Math.abs(Math.abs(xx - x) - 0.72); if (r < 0.035) return C.S1; if (r < 0.09) return C.BLK; }
    return ROAD_ASPH(xx, yy, px, py);
  });
  mat(MAT_OUTSIDE);
  for (const x of AV) for (const y of ST) {
    if (y > ST[0]) cFloor(x - RW + 0.3, y - RW - 3.2, x + RW - 0.3, y - RW - 0.6, 0.001, crossingSh(1));
    if (y < ST[nS - 1]) cFloor(x - RW + 0.3, y + RW + 0.6, x + RW - 0.3, y + RW + 3.2, 0.001, crossingSh(1));
    if (x > AV[0]) cFloor(x - RW - 3.2, y - RW + 0.3, x - RW - 0.6, y + RW - 0.3, 0.001, crossingSh(0));
    if (x < AV[nA - 1]) cFloor(x + RW + 0.6, y - RW + 0.3, x + RW + 3.2, y + RW - 0.3, 0.001, crossingSh(0));
  }
  // manholes
  for (let k = 0; k < 30; k++) {
    const onAv = k & 1, i = hashi(k, 3) % (onAv ? nA : nS), t = 0.1 + hash(k, 4) * 0.8;
    const x = onAv ? AV[i] + (hash(k, 5) - 0.5) * 6 : lerp(sX0 + 12, sX1 - 12, t), y = onAv ? lerp(aY0 + 12, aY1 - 12, t) : ST[i] + (hash(k, 5) - 0.5) * 6;
    cFloor(x - 0.45, y - 0.45, x + 0.45, y + 0.45, 0.002, (xx, yy) => { const d = Math.hypot(xx - x, yy - y); return d > 0.42 ? T : d > 0.36 ? C.BLK : (frac((xx + yy) / 0.12) < 0.3 ? C.ST0 : C.INK); });
  }
  // ---- block slabs and the outer sidewalks
  for (let c = 0; c < NCOL; c++) for (let r = 0; r < NROW; r++) {
    const b = blockRect(c, r);
    slab(b[0], b[1], b[2], b[3], (c === 2 && r === 2) ? plazaSh(b) : blockSh(b[0], b[1], b[2], b[3], 7 + c * 3 + r), true, true);
  }
  const walkN = flagstones(C.ST1, C.VIO, C.ST0, 51, 0.7);
  slab(MAP.x0, MAP.y0, sX1 + SWK, aY0, (x, y, px, py) => y > aY0 - 0.22 ? C.ST2 : walkN(x, y, px, py), false, true);                   // north
  slab(MAP.x0, aY0, sX0, HARBOUR_Y, (x, y, px, py) => x > sX0 - 0.22 ? C.ST2 : walkN(x, y, px, py), true, false);                       // west
  slab(sX1, aY0, HARBOUR_X, aY1, (x, y, px, py) => x < sX1 + 0.22 ? C.ST2 : (x > sX1 + SWK ? boardSh(x, y, px, py, 0) : walkN(x, y, px, py)), false, false);
  slab(sX0, aY1, HARBOUR_X, HARBOUR_Y, (x, y, px, py) => y < aY1 + 0.22 ? C.ST2 : (y > aY1 + SWK ? boardSh(x, y, px, py, 1) : walkN(x, y, px, py)), false, false);
  // ---- puddles on roads and sidewalks
  mat(MAT_OUTSIDE | MAT_PUDDLE);
  for (let k = 0; k < 150; k++) {
    const x = lerp(sX0 - 2, 122, hash(k, 61)), y = lerp(aY0 - 2, 90, hash(k, 62)), rx = 0.5 + hash(k, 63) * 1.3, ry = 0.3 + hash(k, 64) * 0.6;
    const z = groundZAt(x, y) + 0.002;
    cFloor(x - rx, y - ry, x + rx, y + ry, z, (xx, yy) => ((xx - x) / rx) ** 2 + ((yy - y) / ry) ** 2 + (vnoise(xx * 3, yy * 3, 23) - 0.5) * 0.6 < 1 ? C.NAV : T);
  }
  mat(MAT_OUTSIDE);
}
function boardSh(x, y, px, py, axis) {                       // harbour boardwalk planks
  const u = axis ? x : y, v = axis ? y : x;
  if (frac(v / 0.3) < 0.12) return C.INK;
  return hash3(Math.floor(v / 0.3), Math.floor(u / 2.4 + (Math.floor(v / 0.3) & 1) * 0.5), 9) > 0.7 ? C.BRN : C.DBR;
}
function plazaSh(b) {
  const walk = flagstones(C.ST1, C.VIO, C.ST0, 71, 0.7), cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
  return (x, y, px, py) => {
    const e = Math.min(x - b[0], y - b[1], b[2] - x, b[3] - y);
    if (e < 0.22) return C.ST2;
    if (e < SWK) return walk(x, y, px, py);
    const d = Math.hypot(x - cx, y - cy), ring = frac(d / 1.6);
    if (ring < 0.08) return C.ST0;
    return hash3(Math.floor(d / 1.6), Math.floor(Math.atan2(y - cy, x - cx) * d / 1.2), 3) > 0.8 ? C.STS : C.ST2;
  };
}
// ------------------------------------------------------------------ ground height (0 road, 0.15 slab) and what a cell is
let SURF = null;
function groundZAt(x, y) {
  for (const s of CITY.slabs) if (x >= s[0] && x < s[2] && y >= s[1] && y < s[3]) return 0.15;
  return 0;
}
function buildSurf() {
  const gw = MAP.x1 - MAP.x0, gh = MAP.y1 - MAP.y0;
  SURF = { g: new Uint8Array(gw * gh * 4), gw: gw * 2, gh: gh * 2 };
  for (let j = 0; j < SURF.gh; j++) for (let i = 0; i < SURF.gw; i++) {
    const x = MAP.x0 + (i + 0.5) / 2, y = MAP.y0 + (j + 0.5) / 2;
    let v = groundZAt(x, y) > 0 ? 1 : 0;
    if ((y > HARBOUR_Y || x > HARBOUR_X) && !onPier(x, y)) v = 2;
    SURF.g[j * SURF.gw + i] = v;
  }
}
function surfAt(x, y) {
  const i = Math.floor((x - MAP.x0) * 2), j = Math.floor((y - MAP.y0) * 2);
  if (i < 0 || j < 0 || i >= SURF.gw || j >= SURF.gh) return 2;
  return SURF.g[j * SURF.gw + i];
}
function groundZ(x, y) { const s = surfAt(x, y); return s === 1 ? 0.15 : s === 2 ? WATER_Z : 0; }
// ------------------------------------------------------------------ street lamps, hydrants, mailboxes along the sidewalks
function buildStreetFurniture() {
  layer(0); mat(MAT_OUTSIDE);
  const lampsAlongX = (y, xa, xb) => { for (let x = xa; x <= xb; x += 15) lampPost(x, y); };
  const lampsAlongY = (x, ya, yb) => { for (let y = ya; y <= yb; y += 15) lampPost(x, y); };
  for (let c = 0; c < NCOL; c++) for (let r = 0; r < NROW; r++) {
    if (c === 2 && r === 2) continue;                                                  // the plaza has its own
    const b = blockRect(c, r);
    lampsAlongX(b[1] + 0.6, b[0] + 3, b[2] - 3); lampsAlongX(b[3] - 0.6, b[0] + 3, b[2] - 3);
    lampsAlongY(b[0] + 0.6, b[1] + 10, b[3] - 3); lampsAlongY(b[2] - 0.6, b[1] + 10, b[3] - 3);
    hydrant(b[2] - 0.7, b[1] + 4.5); hydrant(b[0] + 0.7, b[3] - 5.5);
    mailbox(b[0] + 1.0, b[1] + 1.2);
    if ((c + r) & 1) trashCan(b[2] - 1.0, b[3] - 1.0); else newsStand(b[0] + 5.5, b[3] - 1.0);
  }
  lampsAlongX(ST[0] - RW - 0.6, AV[0] - 2, AV[4] + 4);
  lampsAlongY(AV[0] - RW - 0.6, ST[0] - 2, ST[3] + 4);
  lampsAlongX(ST[3] + RW + 0.6, AV[0] + 2, AV[4]);
  lampsAlongY(AV[4] + RW + 0.6, ST[0] + 2, ST[3]);
}
// ------------------------------------------------------------------ the road graph (traffic, patrols)
// node id = i * NS + j at (AV[i], ST[j]); lane point for travel along direction (dx, dy) is offset to the right
const NS = ST.length;
function nodeXY(n) { return [AV[Math.floor(n / NS)], ST[n % NS]]; }
function nodeNeighbours(n) {
  const i = Math.floor(n / NS), j = n % NS, out = [];
  if (i > 0) out.push(n - NS); if (i < AV.length - 1) out.push(n + NS); if (j > 0) out.push(n - 1); if (j < NS - 1) out.push(n + 1);
  return out;
}
function nearestNode(x, y) { let best = 0, bd = 1e9; for (let n = 0; n < AV.length * NS; n++) { const [a, b] = nodeXY(n), d = Math.hypot(a - x, b - y); if (d < bd) { bd = d; best = n; } } return best; }
function laneOffset(dx, dy) { return [-dy * LN, dx * LN]; }     // right-hand side of travel (+y is clockwise of +x seen from above)
function lanePath(nodes) {
  const pts = [];
  for (let k = 0; k < nodes.length; k++) {
    const p = nodeXY(nodes[k]);
    if (k === 0 || k === nodes.length - 1) {
      const q = nodeXY(nodes[k === 0 ? 1 : k - 1]), dx = Math.sign(k === 0 ? q[0] - p[0] : p[0] - q[0]), dy = Math.sign(k === 0 ? q[1] - p[1] : p[1] - q[1]);
      const o = laneOffset(dx, dy); pts.push([p[0] + o[0], p[1] + o[1]]); continue;
    }
    const a = nodeXY(nodes[k - 1]), b = nodeXY(nodes[k + 1]);
    const d1 = [Math.sign(p[0] - a[0]), Math.sign(p[1] - a[1])], d2 = [Math.sign(b[0] - p[0]), Math.sign(b[1] - p[1])];
    const o1 = laneOffset(d1[0], d1[1]), o2 = laneOffset(d2[0], d2[1]);
    if (d1[0] === d2[0] && d1[1] === d2[1]) { pts.push([p[0] + o1[0], p[1] + o1[1]]); continue; }
    pts.push([d1[0] ? p[0] + o2[0] : p[0] + o1[0], d1[1] ? p[1] + o2[1] : p[1] + o1[1]]);
  }
  return pts;
}
// the street or avenue a point is on (for the HUD)
function placeName(x, y) {
  for (let j = 0; j < ST.length; j++) if (Math.abs(y - ST[j]) < RW + SWK + 0.5) return STREET_NAMES[j];
  for (let i = 0; i < AV.length; i++) if (Math.abs(x - AV[i]) < RW + SWK + 0.5) return AVENUE_NAMES[i];
  if (y > ST[3] + RW) return 'THE WATERFRONT';
  return '';
}
