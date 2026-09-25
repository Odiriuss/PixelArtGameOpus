// =================================================================== CITY RENDERER: DISPLAY LISTS, TILES OF LIGHT, THE ROOF THAT LIFTS
// Surfaces are recorded into display lists: UNDER (ground, low props, the bottom ZCUT metres of every building),
// OVER (the rest), and one list per floor of every building's interior. They are rasterised lazily into TS x TS
// screen tiles. A tile keeps each pixel's albedo, depth, building and height, and the light that reaches it:
// how much sun (0 in a building's shadow), the dominant lamp by id and its share, the other lamps together, the
// strongest colour wash. relight() turns that into colours for the hour; the colours are kept until the light
// changes. Tiles are thrown away least recently used and baked again when needed.
const TS = 64, TN = TS * TS, ZCUT = 1.2, WCUT = 0.55, MAT_FLOOR = 64, DSC = 64;
const DL = [[], []];                                         // display lists: 0 UNDER, 1 OVER
const TBUCKET = [new Map(), new Map()];                      // tile key -> indices into DL[layer]
const CB = [1e9, 1e9, -1e9, -1e9];                           // screen bounds of the city
let dlLayer = 0, dlMat = MAT_OUTSIDE, dlTag = 0, dlBid = 0, dlInt = null;   // dlInt: the interior floor being recorded
function layer(L) { dlLayer = L; }
function mat(m) { dlMat = m; }
function tag(t) { dlTag = t; }
function tkey(tx, ty) { return (tx + 1024) * 4096 + (ty + 1024); }
function E(c) { return c | 128; }                            // emissive colour: lit by nothing, switched by the hour

function dlAddBB(x0, y0, x1, y1, fn) {
  const bb = [Math.floor(x0) - 3, Math.floor(y0) - 3, Math.ceil(x1) + 3, Math.ceil(y1) + 3];
  const F = dlInt, list = F ? F.dl : DL[dlLayer], B = F ? F.bucket : TBUCKET[dlLayer], cb = F ? F.cb : CB;
  const idx = list.length;
  list.push({ bb, fn, mat: dlMat, tag: dlTag, bid: dlBid });
  for (let ty = Math.floor(bb[1] / TS); ty <= Math.floor(bb[3] / TS); ty++)
    for (let tx = Math.floor(bb[0] / TS); tx <= Math.floor(bb[2] / TS); tx++) {
      const k = tkey(tx, ty); let a = B.get(k); if (!a) B.set(k, a = []); a.push(idx);
    }
  if (bb[0] < cb[0]) cb[0] = bb[0]; if (bb[1] < cb[1]) cb[1] = bb[1]; if (bb[2] > cb[2]) cb[2] = bb[2]; if (bb[3] > cb[3]) cb[3] = bb[3];
}
function dlAdd(pts, fn) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (let i = 0; i < pts.length; i += 3) {
    const sx = isoX(pts[i], pts[i + 1]), sy = isoY(pts[i], pts[i + 1], pts[i + 2]);
    if (sx < x0) x0 = sx; if (sx > x1) x1 = sx; if (sy < y0) y0 = sy; if (sy > y1) y1 = sy;
  }
  dlAddBB(x0, y0, x1, y1, fn);
}
// recorded primitives (same signatures as the room rasteriser)
function cFloor(x0, y0, x1, y1, z, sh) { dlAdd([x0, y0, z, x1, y0, z, x0, y1, z, x1, y1, z], () => rFloor(x0, y0, x1, y1, z, sh)); }
function cWallX(xw, y0, y1, z0, z1, sh) { dlAdd([xw, y0, z0, xw, y1, z0, xw, y0, z1, xw, y1, z1], () => rWallX(xw, y0, y1, z0, z1, sh)); }
function cWallY(yw, x0, x1, z0, z1, sh) { dlAdd([x0, yw, z0, x1, yw, z0, x0, yw, z1, x1, yw, z1], () => rWallY(yw, x0, x1, z0, z1, sh)); }
function cBox(x0, y0, z0, x1, y1, z1, top, sx, sy) {
  if (sx) cWallX(x1, y0, y1, z0, z1, sx);
  if (sy) cWallY(y1, x0, x1, z0, z1, sy);
  if (top) cFloor(x0, y0, x1, y1, z1, top);
}
function cBoxC(x0, y0, z0, x1, y1, z1, top, sideX, sideY) { cBox(x0, y0, z0, x1, y1, z1, flat(top), flat(sideX), flat(sideY)); }
function cCyl(cx, cy, r, z0, z1, sh, cap) {
  const R = r * 1.5 + 0.1;
  dlAdd([cx - R, cy + R, z0, cx + R, cy - R, z0, cx + R, cy + R, z0, cx - R, cy - R, z1, cx + R, cy - R, z1, cx - R, cy + R, z1],
    () => rCyl(cx, cy, r, z0, z1, sh, cap));
}
function cSphere(cx, cy, cz, r, sh) {
  dlAdd([cx, cy, cz + r * 1.2, cx, cy, cz - r * 1.2, cx + r, cy - r, cz, cx - r, cy + r, cz], () => rSphere(cx, cy, cz, r, sh));
}
function cStamp(x, y, z, rows, key, flip) {
  const w = rows[0].length, h = rows.length, sx = isoX(x, y) - (w >> 1), sy = isoY(x, y, z) - h;
  dlAddBB(sx, sy, sx + w, sy + h, () => rStamp(x, y, z, rows, key, flip));
}
function cLine(xa, ya, za, xb, yb, zb, c, thick) { dlAdd([xa, ya, za, xb, yb, zb], () => rLine3(xa, ya, za, xb, yb, zb, c, thick)); }
function cDecalX(xw, yc, zc, rows, key) { const w = rows[0].length, h = rows.length, sx = isoX(xw, yc), sy = isoY(xw, yc, zc); dlAddBB(sx - w, sy - h, sx + w, sy + h, () => rDecalX(xw, yc, zc, rows, key)); }
function cDecalY(yw, xc, zc, rows, key) { const w = rows[0].length, h = rows.length, sx = isoX(xc, yw), sy = isoY(xc, yw, zc); dlAddBB(sx - w, sy - h, sx + w, sy + h, () => rDecalY(yw, xc, zc, rows, key)); }

// ------------------------------------------------------------------ neon: the dark tube colour for each lit colour
const NEON_OFF = makeMap([C.NBL, C.NBD, C.NBD, C.INK, C.RED, C.OX, C.CORAL, C.OX, C.CRIM, C.PLUM, C.CYAN, C.CYD, C.CYD, C.DW,
  C.GRNL, C.G1, C.GLOW, C.AMB, C.HOT, C.GLOW, C.PALEY, C.BRASS, C.BRASS, C.BRN, C.WL, C.WM, C.WHITE, C.S2, C.AMB, C.BRN,
  C.LAV, C.VIO, C.CREAM, C.CRS]);

// ------------------------------------------------------------------ a baked layer: one 64 KB buffer of parallel arrays
// emissive pixels: wv holds how the pixel behaves (EXT_*), or a window's switch-on threshold 1..250
const EXT_LAMP = 250, EXT_DOOR = 251, EXT_GLOBE = 252, EXT_PANE = 253, EXT_ALWAYS = 254;   // EXT_DOOR: part of a doorway (goes with the roof)
// EXT_LAMP: the shade of a lamp indoors, lit while its lamp works; windows use 1..249
const LPOOL = [];
function newLayer() {
  const buf = LPOOL.pop() || new ArrayBuffer(65536), u8 = k => new Uint8Array(buf, 16384 + k * TN, TN);
  return { buf, dep: new Int16Array(buf, 0, TN), lid: new Uint16Array(buf, 8192, TN), col: u8(0), mat: u8(1), bid: u8(2), zq: u8(3), sun: u8(4),
    rest: u8(5), lidv: u8(6), wi: u8(7), wv: u8(8), ft: u8(9), lit: u8(10), alt: u8(11), ver: -1 };
}
function freeLayer(Ly) { if (Ly && LPOOL.length < 64) LPOOL.push(Ly.buf); }
const TRB = makeRB(0, 0, TS, TS);
TRB.hot = new Uint16Array(TN); TRB.ext = new Uint8Array(TN);               // hot: building << 8 | neon tag
function rasterise(list, idx, tx, ty) {
  TRB.ox = tx * TS; TRB.oy = ty * TS;
  TRB.col.fill(T); TRB.dep.fill(-1e9); TRB.nrm.fill(0); TRB.mat.fill(0); TRB.hot.fill(0); TRB.ext.fill(0);
  RB = TRB;
  for (let k = 0; k < idx.length; k++) { const p = list[idx[k]]; curMat = p.mat; curHot = (p.bid << 8) | p.tag; curBias = 0; p.fn(); }
  RB = null; curMat = 0; curHot = 0; curExt = 0;
  for (let i = 0; i < TN; i++) if (TRB.col[i] !== T) return true;
  return false;
}
function bakeLayer(list, bucket, tx, ty, lights, occl) {
  const idx = bucket.get(tkey(tx, ty));
  if (!idx || !rasterise(list, idx, tx, ty)) return null;
  const Ly = newLayer(), R = TRB;
  for (let i = 0; i < TN; i++) {
    const c = R.col[i];
    if (c === T) { Ly.col[i] = T; Ly.dep[i] = -32768; continue; }
    const m = R.mat[i], n = R.nrm[i], x = R.wx[i], y = R.wy[i], z = R.wz[i], hot = R.hot[i];
    const emit = c >= 128 || (m & MAT_EMIT) !== 0;
    Ly.col[i] = (c & 127) | (emit ? 128 : 0);
    Ly.dep[i] = clamp(Math.round(R.dep[i] * DSC), -32767, 32767);
    Ly.mat[i] = (m & ~MAT_EMIT) | (n === NRM_UP ? MAT_FLOOR : 0);
    const ext = R.ext[i] === EXT_DOOR ? 0 : R.ext[i];
    Ly.bid[i] = hot >> 8; Ly.zq[i] = R.ext[i] === EXT_DOOR ? 255 : clamp(Math.round(z * 6), 0, 255);
    Ly.sun[i] = (m & MAT_OUTSIDE) && SUN_RESP[n] > 0 && !sunShadow(x, y, z) ? Math.round(SUN_RESP[n] * 255) : 0;
    let sum = 0, best = 0, lid = 0, wb = 0, wi = 0;
    for (let l = 0; l < lights.length; l++) {
      const L = lights[l], v = L.slat ? slatLightAt(L, x, y, z, occl) : pointLightAt(L, x, y, z, n, occl);
      if (v <= 0) continue;
      if (L.map) { if (v > wb) { wb = v; wi = L.wi; } }
      else { sum += v; if (v > best) { best = v; lid = L.id; } }
    }
    if (emit && ext === EXT_LAMP) {                                                    // a lamp's shade answers to the lamp nearest it
      let dn = 1e9;
      for (let l = 0; l < lights.length; l++) { const L = lights[l], d = (L.x - x) ** 2 + (L.y - y) ** 2 + (L.z - z) ** 2; if (d < dn) { dn = d; lid = L.id; } }
    }
    Ly.rest[i] = Math.min(255, Math.round((sum - best) * 32)); Ly.lid[i] = lid; Ly.lidv[i] = Math.min(255, Math.round(best * 32)); Ly.wi[i] = wi;
    Ly.wv[i] = emit ? ext : Math.min(255, Math.round(wb * 255));
    let ft = 0;
    if (emit) ft = hot & 255;                                                           // a neon tube: its own tag
    else if (wi && WASH[wi].tag) ft = WASH[wi].tag;                                     // lit by flickering neon
    else if (lid && LIGHTS[lid].tag) ft = LIGHTS[lid].tag;
    Ly.ft[i] = ft;
  }
  return Ly;
}
// ------------------------------------------------------------------ light -> colour, for the hour
function emissiveOn(e, P, lid) {
  if (e === 0) return P.night > 0.3;
  if (e === EXT_GLOBE) return LAMP_ON[lid] === 1 && P.night > 0.05;
  if (e === EXT_PANE) return P.night < 0.5;
  if (e === EXT_ALWAYS) return true;
  if (e === EXT_LAMP) return LAMP_ON[lid] === 1;
  return P.night > 0.12 && e / 250 < P.lit * clamp((P.night - 0.1) * 1.8, 0, 1);    // a window: each on its own evening
}
function relight(Ly, ox, oy) {
  const col = Ly.col, mt = Ly.mat, sun = Ly.sun, rest = Ly.rest, lid = Ly.lid, lidv = Ly.lidv, wi = Ly.wi, wv = Ly.wv, ft = Ly.ft, lit = Ly.lit, alt = Ly.alt;
  const PO = LP.out, PI = LP.ins;
  for (let i = 0; i < TN; i++) {
    const c0 = col[i]; if (c0 === T) continue;
    const px = ox + (i & 63), py = oy + (i >> 6), b = BAYER[((py & 3) << 2) | (px & 3)];
    const P = (mt[i] & MAT_OUTSIDE) ? PO : PI, id = lid[i], l1 = LAMP_ON[id] ? lidv[i] / 32 : 0;
    const lvl = P.amb + P.sun * sun[i] / 255 + P.lamp * (rest[i] / 32 + l1);
    const f = ft[i];
    if (c0 & 128) {
      const base = c0 & 127;
      if (f) { const off = quantLight(NEON_OFF[base], lvl, b); if (P.night > 0.35) { lit[i] = base; alt[i] = off; } else lit[i] = alt[i] = off; continue; }
      const e = wv[i];
      if (emissiveOn(e, P, id)) lit[i] = base;
      else lit[i] = quantLight(e === EXT_GLOBE ? DAYGLOBE[base] : e === EXT_PANE ? NIGHTPANE[base] : DAYGLASS[base], lvl, b);
      continue;
    }
    let c = c0;
    if (P.day > 0 && b < P.day) { c = DAYGREY[c]; if (mt[i] & MAT_GLOSS) c = LIT[c]; }             // and the asphalt dries pale
    const w = wi[i];
    if (w) { const L = WASH[w]; if (LAMP_ON[L.id] && b < wv[i] / 255) c = L.map[c]; }
    lit[i] = quantLight(c, lvl, b);
    if (f) alt[i] = (w && WASH[w].tag === f) ? quantLight(c0, lvl, b) : quantLight(c, lvl - P.lamp * l1, b);
  }
  Ly.ver = LP.ver;
}
// ------------------------------------------------------------------ the city's tiles: baked on demand, thrown away least recently used
const TILES = new Map();                                     // tile key -> {U, O} | null (nothing there)
const TILE_MAX = 340;
const BAKE_STATS = { tiles: 0, ms: 0, relit: 0, evicted: 0 };
let CITY_LIGHTS = [];
function lightsForRect(list, ox, oy) {
  const out = [];
  for (const L of list) { const r = L.rect; if (r[2] >= ox && r[0] < ox + TS && r[3] >= oy && r[1] < oy + TS) out.push(L); }
  return out;
}
function bakeTileNow(tx, ty) {
  const t0 = performance.now(), lights = lightsForRect(CITY_LIGHTS, tx * TS, ty * TS);
  const U = bakeLayer(DL[0], TBUCKET[0], tx, ty, lights, null), O = bakeLayer(DL[1], TBUCKET[1], tx, ty, lights, null);
  const t = (U || O) ? { U, O } : null;
  TILES.set(tkey(tx, ty), t);
  if (TILES.size > TILE_MAX) evictTiles(TILES, TILE_MAX - 40);
  BAKE_STATS.tiles++; BAKE_STATS.ms += performance.now() - t0;
  return t;
}
function evictTiles(map, keep) {
  for (const [k, t] of map) {
    if (map.size <= keep) break;
    if (t && t.used === tick) continue;                      // on screen right now
    map.delete(k); BAKE_STATS.evicted++;
    if (t) { if (t.U) freeLayer(t.U); if (t.O) freeLayer(t.O); if (t.L) freeLayer(t.L); }
  }
}
function getTile(tx, ty) {
  const k = tkey(tx, ty); let t = TILES.get(k);
  if (t === undefined) t = bakeTileNow(tx, ty); else { TILES.delete(k); TILES.set(k, t); }
  if (t) t.used = tick;
  return t;
}
// a lamp switched: the tiles it reaches are relit (not the whole screen)
function dirtyRect(r) {
  for (const [k, t] of TILES) {
    if (!t) continue;
    const tx = Math.floor(k / 4096) - 1024, ty = (k % 4096) - 1024, ox = tx * TS, oy = ty * TS;
    if (r[2] >= ox && r[0] < ox + TS && r[3] >= oy && r[1] < oy + TS) { if (t.U) t.U.ver = -2; if (t.O) t.O.ver = -2; }
  }
  for (const [, t] of ITILES) if (t && t.L) t.L.ver = -2;
}
// relight a layer if its light is out of date: always if it has never been lit, else within this frame's budget
const RELIGHT = { budget: 3, t0: 0 };
function ensureLit(Ly, ox, oy) {
  if (Ly.ver === LP.ver) return;
  if (Ly.ver !== -1 && performance.now() - RELIGHT.t0 > RELIGHT.budget) return;
  relight(Ly, ox, oy); BAKE_STATS.relit++;
}
// ------------------------------------------------------------------ interiors: one list per floor of a building, their own tiles
const ITILES = new Map();                                    // floor key + tile -> {L} | null
const ITILE_MAX = 160;
function newFloor(B, f, z, h) {
  return { B, f, z, h, key: B.id * 16 + f, dl: [], bucket: new Map(), cb: [1e9, 1e9, -1e9, -1e9], lights: [], occl: [], stairs: [] };
}
function ikey(F, tx, ty) { return F.key * 16777216 + tkey(tx, ty); }
function bakeIntTileNow(F, tx, ty) {
  const t0 = performance.now(), L = bakeLayer(F.dl, F.bucket, tx, ty, lightsForRect(F.lights, tx * TS, ty * TS), F.occl);
  const t = L ? { L } : null;
  ITILES.set(ikey(F, tx, ty), t);
  if (ITILES.size > ITILE_MAX) evictTiles(ITILES, ITILE_MAX - 20);
  BAKE_STATS.tiles++; BAKE_STATS.ms += performance.now() - t0;
  return t;
}
function getIntTile(F, tx, ty) {
  const k = ikey(F, tx, ty); let t = ITILES.get(k);
  if (t === undefined) t = bakeIntTileNow(F, tx, ty); else { ITILES.delete(k); ITILES.set(k, t); }
  if (t) t.used = tick;
  return t;
}
// ------------------------------------------------------------------ baking ahead: the tiles about to come on screen, then a floor about to be entered
function bakeAhead(budgetMs, cx, cy, vx, vy, F) {
  const t0 = performance.now(), lead = 1.2;
  const x0 = Math.floor((cx - 48 + Math.min(0, vx * lead)) / TS), x1 = Math.floor((cx + VW + 48 + Math.max(0, vx * lead)) / TS);
  const y0 = Math.floor((cy - 40 + Math.min(0, vy * lead)) / TS), y1 = Math.floor((cy + VH + 40 + Math.max(0, vy * lead)) / TS);
  const mx = (cx + VW / 2 + vx * lead * 0.5) / TS, my = (cy + VH / 2 + vy * lead * 0.5) / TS, want = [];
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (!TILES.has(tkey(tx, ty))) want.push([tx, ty, Math.abs(tx + 0.5 - mx) + Math.abs(ty + 0.5 - my) * 1.6]);
  want.sort((a, b) => a[2] - b[2]);
  for (const [tx, ty] of want) { if (performance.now() - t0 > budgetMs) return; bakeTileNow(tx, ty); }
  if (F) for (const k of F.bucket.keys()) {
    if (ITILES.has(F.key * 16777216 + k)) continue;
    if (performance.now() - t0 > budgetMs) return;
    bakeIntTileNow(F, Math.floor(k / 4096) - 1024, (k % 4096) - 1024);
  }
}
