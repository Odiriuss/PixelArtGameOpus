
// =================================================================== CITY RENDERER: DISPLAY LISTS + BAKED TILES
// The city is far too big for one room buffer. Its surfaces are recorded into two display lists:
//   UNDER  streets, kerbs, low props and the bottom ZCUT metres of every building (plus a dark cut cap)
//   OVER   everything above: walls, roofs, signs, tree crowns
// Both are rasterised lazily into TS x TS screen-space tiles and lit with the room light model (bakeRoom).
// Each frame the visible tiles are composed; OVER pixels nearer the camera than the focus (Frank or his
// car) are dithered away around it, so the street you are on is never hidden by the block in front of it.
const TS = 64, ZCUT = 1.2, MAT_FLOOR = 64, DSC = 64;       // tile size, cut height, floor flag, depth fixed point
const DL = [[], []];                                         // display lists: 0 UNDER, 1 OVER
const TBUCKET = [new Map(), new Map()];                      // tile key -> indices into DL[layer]
const TILES = new Map();                                     // tile key -> {U, O} | null (empty)
const CB = [1e9, 1e9, -1e9, -1e9];                           // screen bounds of everything recorded
let dlLayer = 0, dlMat = MAT_OUTSIDE, dlTag = 0;
function layer(L) { dlLayer = L; }
function mat(m) { dlMat = m; }
function tag(t) { dlTag = t; }
function tkey(tx, ty) { return (tx + 1024) * 4096 + (ty + 1024); }
function E(c) { return c | 128; }                            // emissive colour: skipped by the light bake

function dlAddBB(x0, y0, x1, y1, fn) {
  const bb = [Math.floor(x0) - 3, Math.floor(y0) - 3, Math.ceil(x1) + 3, Math.ceil(y1) + 3];
  const list = DL[dlLayer], idx = list.length, B = TBUCKET[dlLayer];
  list.push({ bb, fn, mat: dlMat, tag: dlTag });
  for (let ty = Math.floor(bb[1] / TS); ty <= Math.floor(bb[3] / TS); ty++)
    for (let tx = Math.floor(bb[0] / TS); tx <= Math.floor(bb[2] / TS); tx++) {
      const k = tkey(tx, ty); let a = B.get(k); if (!a) B.set(k, a = []); a.push(idx);
    }
  if (bb[0] < CB[0]) CB[0] = bb[0]; if (bb[1] < CB[1]) CB[1] = bb[1]; if (bb[2] > CB[2]) CB[2] = bb[2]; if (bb[3] > CB[3]) CB[3] = bb[3];
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

// ------------------------------------------------------------------ neon: the dark tube colour for each lit colour
const NEON_OFF = makeMap([C.NBL, C.NBD, C.NBD, C.INK, C.RED, C.OX, C.CORAL, C.OX, C.CRIM, C.PLUM, C.CYAN, C.CYD, C.CYD, C.DW,
  C.GRNL, C.G1, C.GLOW, C.AMB, C.HOT, C.GLOW, C.PALEY, C.BRASS, C.BRASS, C.BRN, C.WL, C.WM, C.WHITE, C.S2, C.AMB, C.BRN,
  C.LAV, C.VIO, C.CREAM, C.CRS]);

// ------------------------------------------------------------------ tile bake
const TRB = makeRB(0, 0, TS, TS);
const TILE_ENV = { lights: [], ambient: 0, dark: null, occluders: null };
function lightsForTile(ox, oy) {
  const out = [];
  for (const L of CITY.lights) { const r = L.rect; if (r[2] >= ox && r[0] < ox + TS && r[3] >= oy && r[1] < oy + TS) out.push(L); }
  return out;
}
function bakeLayer(L, tx, ty) {
  const list = TBUCKET[L].get(tkey(tx, ty));
  if (!list) return null;
  const ox = tx * TS, oy = ty * TS, n = TS * TS;
  TRB.ox = ox; TRB.oy = oy;
  TRB.col.fill(T); TRB.dep.fill(-1e9); TRB.hot.fill(0); TRB.nrm.fill(0); TRB.mat.fill(0); TRB.lgt.fill(0);
  RB = TRB;
  for (let k = 0; k < list.length; k++) { const p = DL[L][list[k]]; curMat = p.mat; curHot = p.tag; curBias = 0; p.fn(); }
  RB = null; curMat = 0; curHot = 0;
  let any = false;
  for (let i = 0; i < n; i++) {
    const c = TRB.col[i]; if (c === T) continue;
    any = true;
    if (c >= 128) { TRB.col[i] = c & 127; TRB.mat[i] |= MAT_EMIT; }
  }
  if (!any) return null;
  TILE_ENV.lights = lightsForTile(ox, oy); TILE_ENV.ambient = CITY.ambient; TILE_ENV.dark = CITY.dark;
  bakeRoom(TRB, TILE_ENV);
  const out = { col: new Uint8Array(n), dep: new Int16Array(n), mat: L ? null : new Uint8Array(n), alt: null, lgt: null };
  for (let i = 0; i < n; i++) {
    let c = TRB.col[i];
    if (c === T) { out.col[i] = T; out.dep[i] = -32768; continue; }
    const m = TRB.mat[i];
    let tg = TRB.lgt[i], alt = tg ? TRB.alt[i] : 0;
    if ((m & MAT_EMIT) && TRB.hot[i]) { tg = TRB.hot[i]; alt = c; c = NEON_OFF[c]; }   // a tube: lit colour on its tag
    out.col[i] = c;
    out.dep[i] = clamp(Math.round(TRB.dep[i] * DSC), -32767, 32767);
    if (out.mat) out.mat[i] = m | (TRB.nrm[i] === NRM_UP ? MAT_FLOOR : 0);
    if (tg) { if (!out.lgt) { out.lgt = new Uint8Array(n); out.alt = new Uint8Array(n); } out.lgt[i] = tg; out.alt[i] = alt; }
  }
  return out;
}
const BAKE_STATS = { tiles: 0, ms: 0 };
function bakeTileNow(tx, ty) {
  const t0 = performance.now();
  const U = bakeLayer(0, tx, ty), O = bakeLayer(1, tx, ty), t = (U || O) ? { U, O } : null;
  TILES.set(tkey(tx, ty), t);
  BAKE_STATS.tiles++; BAKE_STATS.ms += performance.now() - t0;
  return t;
}
function getTile(tx, ty) { const t = TILES.get(tkey(tx, ty)); return t === undefined ? bakeTileNow(tx, ty) : t; }
// background baking, nearest to a screen point first
let bakeQueue = null, bakeQT = -99;
function bakeTotal() { const s = new Set(); for (const B of TBUCKET) for (const k of B.keys()) s.add(k); return s; }
function bakeAhead(budgetMs, px, py) {
  if (!bakeQueue) bakeQueue = [...bakeTotal()];
  if (!bakeQueue.length) return;
  if (tick - bakeQT > 20) {
    bakeQT = tick;
    bakeQueue = bakeQueue.filter(k => !TILES.has(k));
    const d = k => { const tx = Math.floor(k / 4096) - 1024, ty = (k % 4096) - 1024; return Math.abs((tx + 0.5) * TS - px) + Math.abs((ty + 0.5) * TS - py) * 1.6; };
    bakeQueue.sort((a, b) => d(a) - d(b));
  }
  const t0 = performance.now();
  while (bakeQueue.length && performance.now() - t0 < budgetMs) {
    const k = bakeQueue.shift();
    if (!TILES.has(k)) bakeTileNow(Math.floor(k / 4096) - 1024, (k % 4096) - 1024);
  }
}
function bakeProgress() { if (!bakeQueue) bakeQueue = [...bakeTotal()]; const tot = TBUCKET[0].size + 1; return Math.min(1, TILES.size / tot); }

// ------------------------------------------------------------------ compose the visible tiles into the frame
const CUT = { on: false, sx: 0, sy: 0, d: 0, rx: 150, ry: 96 };
function composeCity(cx, cy) {
  fb.fill(C.BLK); zb.fill(-1e9); hb.fill(0); sm.fill(0); mb.fill(0); rsrc.fill(-1);
  const tx0 = Math.floor(cx / TS), tx1 = Math.floor((cx + W - 1) / TS), ty0 = Math.floor(cy / TS), ty1 = Math.floor((cy + H - 1) / TS);
  const cut = CUT.on, fsx = CUT.sx, fsy = CUT.sy, fd = CUT.d, irx = 1 / CUT.rx, iry = 1 / CUT.ry;
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    const t = getTile(tx, ty); if (!t) continue;
    const ox = tx * TS, oy = ty * TS, U = t.U, O = t.O;
    const x0 = Math.max(cx, ox), x1 = Math.min(cx + W, ox + TS), y0 = Math.max(cy, oy), y1 = Math.min(cy + H, oy + TS);
    for (let sy = y0; sy < y1; sy++) {
      const ti = (sy - oy) * TS - ox, si = (sy - cy) * W - cx, ey = (sy - fsy) * iry, ey2 = ey * ey;
      for (let sx = x0; sx < x1; sx++) {
        const i = ti + sx, p = si + sx;
        if (U) {
          let c = U.col[i];
          if (c !== T) {
            if (U.lgt !== null) { const g = U.lgt[i]; if (g && lightState[g]) c = U.alt[i]; }
            fb[p] = c; zb[p] = U.dep[i] / DSC; mb[p] = U.mat[i];
          }
        }
        if (O) {
          let c = O.col[i];
          if (c === T) continue;
          const d = O.dep[i] / DSC;
          if (d < zb[p]) continue;
          if (cut && d > fd) {
            const ex = (sx - fsx) * irx, e = ex * ex + ey2;
            if (e < 1) {
              const k = Math.min(1, (d - fd) / 1.2) * (e < 0.6 ? 1 : 1 - (e - 0.6) / 0.4);
              if (bay(sx, sy) < k) continue;
            }
          }
          if (O.lgt !== null) { const g = O.lgt[i]; if (g && lightState[g]) c = O.alt[i]; }
          fb[p] = c; zb[p] = d; mb[p] = MAT_OUTSIDE;
        }
      }
    }
  }
}
// puddles and wet paving mirror whatever stands above them in the same screen column
function cityReflections() {
  for (let x = 0; x < W; x++) {
    let base = -1;
    for (let y = 0; y < H; y++) {
      const p = y * W + x, m = mb[p];
      if (!(m & MAT_FLOOR)) { base = y; continue; }
      if (base < 0 || !(m & (MAT_PUDDLE | MAT_GLOSS))) continue;
      const src = 2 * base + 1 - y;
      if (src >= 0) rsrc[p] = src * W + x;
    }
  }
  applyReflections();
}
