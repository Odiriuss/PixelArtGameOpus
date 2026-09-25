// =================================================================== FACADES AND BUILDINGS
// u runs along a face left -> right as the viewer sees it (+x faces: u = y1 - y; +y faces: u = x - x0).
const STATICS = [];                                          // collision: {x0,y0,x1,y1,h,kind,z0?} boxes, {cx,cy,r,h,kind} circles
function solid(x0, y0, x1, y1, h, kind, z0) { const S = { x0, y0, x1, y1, h, kind: kind || 'wall' }; if (z0) S.z0 = z0; STATICS.push(S); return S; }
function solidC(cx, cy, r, h, kind) { const S = { cx, cy, r, h, kind: kind || 'post', circle: true }; STATICS.push(S); return S; }
const CITY = { slabs: [] };
function addLight(L) { registerLight(L, L.tag ? 'neon' : 'glow'); CITY_LIGHTS.push(L); return L; }

// wall materials (shaders over u, z)
const MATL = {
  brick: bricks(C.HAIRL, C.MAU, C.DBR, 41),
  brickD: bricks(C.HAIRD, C.HAIRL, C.INK, 43),
  stone: (u, z, px, py) => (frac(z / 0.6) < 0.05 || frac(u / 1.2 + (Math.floor(z / 0.6) & 1) * 0.5) < 0.025) ? C.STS : (hash3(Math.floor(u / 1.2), Math.floor(z / 0.6), 5) > 0.86 ? C.STS : C.CRS),
  stucco: (u, z, px, py) => vnoise(u * 1.5, z * 1.5, 9) + bay(px, py) * 0.2 > 0.78 ? C.STS : C.STL,
  tile: (u, z, px, py) => (frac(u / 0.5) < 0.06 || frac(z / 0.5) < 0.06) ? C.G0 : (hash3(Math.floor(u / 0.5), Math.floor(z / 0.5), 3) > 0.8 ? C.G2 : C.G1),
  steel: (u, z, px, py) => frac(u / 1.5) < 0.05 ? C.S2 : C.S0,
  plank: (u, z, px, py) => frac(z / 0.25) < 0.1 ? C.DBR : (hash3(Math.floor(u / 2.1 + (Math.floor(z / 0.25) & 1) * 0.5), Math.floor(z / 0.25), 7) > 0.7 ? C.BRN : C.WOOD),
  concrete: (u, z, px, py) => frac(z / 1.5) < 0.03 || frac(u / 3) < 0.015 ? C.ST0 : (vnoise(u * 2, z * 2, 12) > 0.72 ? C.STS : C.ST2)
};
// o: {base, len, h, gh (ground floor), fh (floor), wp (window period), ww, wz (sill), wh, lit, seed, band, frame, shops, top, doors}
function facade(o) {
  const gh = o.gh || 3.6, fh = o.fh || 3.1, wp = o.wp || 2.0, ww = o.ww || 1.0, wz = o.wz || 0.85, wh = o.wh || 1.5;
  const nWin = Math.max(1, Math.floor((o.len - 0.8) / wp)), u0 = (o.len - nWin * wp) / 2;
  const top = o.top === undefined ? C.ST1 : o.top, band = o.band === undefined ? C.ST1 : o.band;
  o.doors = o.doors || [];
  const fn = (u, z, px, py) => {
    if (z < gh) {
      for (const d of o.doors) if (d.kind !== 'none' && Math.abs(u - d.u) < d.w / 2 + 0.08 && z < d.hgt + 0.08) return doorPx(d, u - d.u, z, px, py);
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
// a door in a facade: lu across the door (0 at its centre). kinds: wood, glass (a shop), steel, grand
function doorPx(d, lu, z, px, py) {
  const hw = d.w / 2;
  curExt = EXT_DOOR;
  if (Math.abs(lu) > hw || z > d.hgt) return z > d.hgt + 0.02 || Math.abs(lu) > hw + 0.04 ? C.ST0 : C.INK;     // the frame
  if (z < 0.16) return C.ST0;                                                                                  // the step
  if (d.kind === 'steel') return frac(z / 0.3) < 0.12 ? C.S0 : (Math.abs(lu) < 0.03 && d.w > 1.4 ? C.INK : C.S1);
  if (d.kind === 'glass' || d.kind === 'grand') {
    if (Math.abs(lu) > hw - 0.07 || z > d.hgt - 0.08 || z < 0.3 || (d.w > 1.4 && Math.abs(lu) < 0.04)) return d.kind === 'grand' ? C.BRASS : C.S0;
    if (Math.abs(z - 1.05) < 0.035) return d.kind === 'grand' ? C.BRASS : C.S1;                                 // the push bar
    return bay(px, py) < 0.3 ? E(C.GLOW) : E(C.AMB);
  }
  if (Math.abs(lu) > hw - 0.06 || z > d.hgt - 0.06) return C.DBR;
  if (z > 1.35 && z < d.hgt - 0.2 && Math.abs(lu) < hw - 0.16) return bay(px, py) < 0.3 ? E(C.GLOW) : E(C.AMB);     // the glass in the top half
  if (Math.abs(lu - (hw - 0.14)) < 0.035 && Math.abs(z - 1.0) < 0.035) return C.BRASS;                          // the knob
  return Math.abs(z - 0.8) < 0.03 || Math.abs(lu) > hw - 0.12 ? C.BRN : C.WOOD;
}
const SPILL = { shop: 1.2, lobby: 1.5, diner: 1.5 };
// warm light from lit shop windows onto the pavement in front of them
function shopSpill(b) {
  const spill = L => { registerLight(L, 'spill'); CITY_LIGHTS.push(L); };
  if (b.fx && b.fx.cfg && b.fx.cfg.shops) for (const s of b.fx.cfg.shops) if (SPILL[s.kind]) spill({ x: b.x1 + 1.1, y: b.y1 - (s.u0 + s.u1) / 2, z: 1.5, r: 3.4 + (s.u1 - s.u0) * 0.25, k: SPILL[s.kind] });
  if (b.fy && b.fy.cfg && b.fy.cfg.shops) for (const s of b.fy.cfg.shops) if (SPILL[s.kind]) spill({ x: b.x0 + (s.u0 + s.u1) / 2, y: b.y1 + 1.1, z: 1.5, r: 3.4 + (s.u1 - s.u0) * 0.25, k: SPILL[s.kind] });
}
function windowPx(o, k, fl, fu, fz, ww, wh, px, py) {
  const frame = o.frame === undefined ? C.INK : o.frame;
  if (fu < 0.07 || fu > ww - 0.07 || fz < 0.06 || fz > wh - 0.06 || Math.abs(fu - ww / 2) < 0.035 || Math.abs(fz - wh * 0.55) < 0.03) return frame;
  const h = hash3(k, fl, o.seed || 0), lit = Math.max(o.lit || 0.3, 0.2) + 0.25;
  if (h < lit) {
    curExt = 1 + Math.floor(h / lit * 248);                                                          // the evening it comes on
    const kind = hash3(k, fl, (o.seed || 0) + 7);
    if (kind < 0.25 && fz > wh * 0.5) { const c = frac(fz / 0.1) < 0.45 ? E(C.AMB) : C.TRIM; if (c === C.TRIM) curExt = 0; return c; }   // blinds half down
    if (kind > 0.9 && Math.abs(fu - ww * 0.35) < 0.1 && fz < wh * 0.6) { curExt = 0; return C.INK; }                                   // somebody at the window
    if (kind > 0.8) return bay(px, py) < 0.4 ? E(C.WM) : E(C.CYD);                                   // a television
    return bay(px, py) < 0.35 ? E(C.GLOW) : E(C.AMB);
  }
  return frac((fu + fz) * 1.3 + k * 0.37) < 0.1 ? C.SLT : C.NAV;
}
// ground-floor shopfronts. s: {u0, u1, kind: shop|lobby|door|dark|garage|diner|wall, text, tc, bg, ts}
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
  if (s.kind === 'shut') return z < 0.55 ? C.ST0 : (frac(lu / 0.5 + z * 0.2) < 0.5 ? C.CRS : C.STS);                 // papered over from inside
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
function capSh(b) { return (x, y) => (x < b.x0 + 0.12 || y < b.y0 + 0.12 || x > b.x1 - 0.12 || y > b.y1 - 0.12) ? C.ST1 : frac((x + y) / 0.8) < 0.14 ? C.ST0 : C.INK; }   // hatched, like a section

// ------------------------------------------------------------------ a building: split into UNDER and OVER at ZCUT
// b: {x0, y0, x1, y1, h, fx: facade for the +x face (u, z), fy: for the +y face, roof, noCol,
//     enter: a type of interior, doors: [{face: 'x'|'y'|'-x'|'-y', u, w, kind}], levels: storeys with an interior}
const BUILDINGS = [null], DOORS = [];
const WT = 0.25;                                             // wall thickness
function building(b) {
  const B = b; B.id = BUILDINGS.length; BUILDINGS.push(B);
  const zc = Math.min(ZCUT, b.h), cfg = (b.fy && b.fy.cfg) || (b.fx && b.fx.cfg) || {};
  B.gh = b.gh || cfg.gh || 3.6; B.fh = b.fh || cfg.fh || 3.1;
  const shX = b.fx ? (y, z, px, py) => b.fx(b.y1 - y, z, px, py) : flat(C.INK);
  const shY = b.fy ? (x, z, px, py) => b.fy(x - b.x0, z, px, py) : flat(C.INK);
  dlBid = B.id; layer(0); mat(MAT_OUTSIDE);
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
  dlBid = 0;
  addShadowBox(b.x0, b.y0, 0, b.x1, b.y1, b.h);                  // up to the roof, which must see the sun itself; the parapets on top
  if (b.h > zc) { addShadowBox(b.x1 - 0.25, b.y0, b.h, b.x1, b.y1, b.h + 0.5); addShadowBox(b.x0, b.y1 - 0.25, b.h, b.x1 - 0.25, b.y1, b.h + 0.5); }
  if (b.enter) enterable(B, shX, shY); else if (!b.noCol) solid(b.x0, b.y0, b.x1, b.y1, 50, 'wall');
  shopSpill(b);
  return B;
}
// walls with gaps for the doors, the doors themselves, one interior per storey (filled in by the interiors file)
function enterable(B, shX, shY) {
  B.doorList = [];
  for (const d of B.doors || []) {
    const D = Object.assign({ w: 1.1, hgt: 2.3, kind: 'wood', locked: false, open: 0, B }, d);
    const f = D.face;
    if (f === 'x') { D.cx = B.x1; D.cy = B.y1 - D.u; D.nx = 1; D.ny = 0; }
    else if (f === 'y') { D.cx = B.x0 + D.u; D.cy = B.y1; D.nx = 0; D.ny = 1; }
    else if (f === '-x') { D.cx = B.x0; D.cy = B.y0 + D.u; D.nx = -1; D.ny = 0; }
    else { D.cx = B.x0 + D.u; D.cy = B.y0; D.nx = 0; D.ny = -1; }
    if (f === 'x' && B.fx) B.fx.cfg.doors.push(D);
    if (f === 'y' && B.fy) B.fy.cfg.doors.push(D);
    D.id = DOORS.length; DOORS.push(D); B.doorList.push(D);
  }
  const gaps = f => B.doorList.filter(D => D.face === f).map(D => [D.u - D.w / 2, D.u + D.w / 2]).sort((a, b) => a[0] - b[0]);
  const run = (len, f, box) => { let a = 0; for (const [g0, g1] of gaps(f)) { if (g0 > a) box(a, g0); a = g1; } if (a < len) box(a, len); };
  const x0 = B.x0, y0 = B.y0, x1 = B.x1, y1 = B.y1;
  run(y1 - y0, 'x', (a, b) => solid(x1 - WT, y1 - b, x1, y1 - a, 50, 'wall'));
  run(x1 - x0, 'y', (a, b) => solid(x0 + a, y1 - WT, x0 + b, y1, 50, 'wall'));
  run(y1 - y0, '-x', (a, b) => solid(x0, y0 + a, x0 + WT, y0 + b, 50, 'wall'));
  run(x1 - x0, '-y', (a, b) => solid(x0 + a, y0, x0 + b, y0 + WT, 50, 'wall'));
  for (const D of B.doorList) {                                                        // a locked door is a wall until it is opened
    const hw = D.w / 2, t = WT;
    D.stat = D.face === 'x' ? { x0: x1 - t, y0: D.cy - hw, x1: x1, y1: D.cy + hw } : D.face === 'y' ? { x0: D.cx - hw, y0: y1 - t, x1: D.cx + hw, y1: y1 }
      : D.face === '-x' ? { x0, y0: D.cy - hw, x1: x0 + t, y1: D.cy + hw } : { x0: D.cx - hw, y0, x1: D.cx + hw, y1: y0 + t };
    Object.assign(D.stat, { h: 50, kind: 'door', door: D, off: !D.locked });
    STATICS.push(D.stat);
    solid(D.stat.x0, D.stat.y0, D.stat.x1, D.stat.y1, 48, 'wall', D.hgt);           // the wall over the door (the floors above are closed)
  }
  const levels = B.levels || [0];
  B.floors = levels.map((s, k) => newFloor(B, k, storeyZ(B, s), s === 0 ? B.gh - 0.15 : B.fh));
  B.floors.forEach((F, k) => { F.storey = levels[k]; });
  B.shX = shX; B.shY = shY;
  INTERIOR_QUEUE.push(B);
}
function storeyZ(B, s) { return s === 0 ? 0.15 : B.gh + 0.2 + (s - 1) * B.fh; }
const INTERIOR_QUEUE = [];
function waterTower(x, y, z) {
  layer(1);
  for (const [dx, dy] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) cCyl(x + dx, y + dy, 0.06, z, z + 2.2, () => C.INK);
  cCyl(x, y, 1.3, z + 2.2, z + 4.4, (a, zz) => frac(a * 3 + 5) < 0.1 ? C.INK : (a < -0.2 ? C.BRN : C.DBR), () => C.DBR);
  cCyl(x, y, 1.35, z + 4.4, z + 4.9, (a) => a < -0.2 ? C.ST1 : C.ST0, () => C.ST1);
  layer(0);
  addShadowBox(x - 1.2, y - 1.2, z + 2.2, x + 1.2, y + 1.2, z + 4.9);
}
function roofBox(x0, y0, x1, y1, z, h) { layer(1); cBoxC(x0, y0, z, x1, y1, z + h, C.ST1, C.ST0, C.INK); layer(0); addShadowBox(x0, y0, z, x1, y1, z + h); }
