
// =================================================================== ISOMETRIC ROOM RASTERISER
// World metres -> room screen space. Every surface is rasterised by inverse projection so each
// pixel knows its world position (lighting bake), its depth (x + y) and its hotspot.
const TW = 16, TH = 8, ZH = 16;
function isoX(x, y) { return (x - y) * TW; }
function isoY(x, y, z) { return (x + y) * TH - z * ZH; }

const NRM_NONE = 0, NRM_UP = 1, NRM_X = 2, NRM_Y = 3, NRM_BB = 4, NRM_SKY = 5;
const MAT_PUDDLE = 1, MAT_GLOSS = 2, MAT_GLASS = 4, MAT_EMIT = 8, MAT_WATER = 16, MAT_OUTSIDE = 32;

// a room buffer covers the room's screen-space bounding box
function makeRB(x0, y0, x1, y1) {
  const w = x1 - x0, h = y1 - y0, n = w * h;
  const rb = {
    w, h, ox: x0, oy: y0,
    col: new Uint8Array(n).fill(T), dep: new Float32Array(n).fill(-1e9), hot: new Uint8Array(n),
    nrm: new Uint8Array(n), mat: new Uint8Array(n), lgt: new Uint8Array(n), refl: null,
    wx: new Float32Array(n), wy: new Float32Array(n), wz: new Float32Array(n)
  };
  return rb;
}
// current write target and state shared by primitives (set per call to keep signatures small)
let RB = null, curHot = 0, curMat = 0, curBias = 0, curExt = 0;   // curExt: a shader may set it for the pixel it returns
function setHot(h) { curHot = h | 0; }
function setMat(m) { curMat = m | 0; }
function setBias(b) { curBias = b; }
function plot(bx, by, c, d, nrm, x, y, z) {
  const e = curExt; curExt = 0;
  if (bx < 0 || by < 0 || bx >= RB.w || by >= RB.h || c === T) return;
  const i = by * RB.w + bx;
  d += curBias;
  if (d < RB.dep[i]) return;
  RB.col[i] = c; RB.dep[i] = d; RB.nrm[i] = nrm; RB.hot[i] = curHot; RB.mat[i] = curMat;
  RB.wx[i] = x; RB.wy[i] = y; RB.wz[i] = z;
  if (RB.ext) RB.ext[i] = e;
}
function bboxOf(pts) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (let i = 0; i < pts.length; i += 3) {
    const sx = isoX(pts[i], pts[i + 1]), sy = isoY(pts[i], pts[i + 1], pts[i + 2]);
    if (sx < x0) x0 = sx; if (sx > x1) x1 = sx; if (sy < y0) y0 = sy; if (sy > y1) y1 = sy;
  }
  return [Math.floor(x0) - RB.ox - 1, Math.floor(y0) - RB.oy - 1, Math.ceil(x1) - RB.ox + 1, Math.ceil(y1) - RB.oy + 1];
}
const EPS = 1e-4;
// horizontal face at height z (normal +z). sh(x, y, px, py) -> colour or T
function rFloor(x0, y0, x1, y1, z, sh) {
  const bb = bboxOf([x0, y0, z, x1, y0, z, x0, y1, z, x1, y1, z]);
  for (let by = Math.max(0, bb[1]); by < Math.min(RB.h, bb[3]); by++) {
    const sy = by + RB.oy + 0.5 + z * ZH;
    for (let bx = Math.max(0, bb[0]); bx < Math.min(RB.w, bb[2]); bx++) {
      const sx = bx + RB.ox + 0.5, a = sx / TW, b = sy / TH;
      const x = (a + b) * 0.5, y = (b - a) * 0.5;
      if (x < x0 - EPS || x >= x1 - EPS || y < y0 - EPS || y >= y1 - EPS) continue;
      plot(bx, by, sh(x, y, bx + RB.ox, by + RB.oy), x + y, NRM_UP, x, y, z);
    }
  }
}
// wall in plane x = xw, facing +x. sh(y, z, px, py)
function rWallX(xw, y0, y1, z0, z1, sh) {
  const bb = bboxOf([xw, y0, z0, xw, y1, z0, xw, y0, z1, xw, y1, z1]);
  for (let bx = Math.max(0, bb[0]); bx < Math.min(RB.w, bb[2]); bx++) {
    const sx = bx + RB.ox + 0.5, y = xw - sx / TW;
    if (y < y0 - EPS || y >= y1 - EPS) continue;
    for (let by = Math.max(0, bb[1]); by < Math.min(RB.h, bb[3]); by++) {
      const sy = by + RB.oy + 0.5, z = ((xw + y) * TH - sy) / ZH;
      if (z < z0 - EPS || z >= z1 - EPS) continue;
      plot(bx, by, sh(y, z, bx + RB.ox, by + RB.oy), xw + y, NRM_X, xw, y, z);
    }
  }
}
// wall in plane y = yw, facing +y. sh(x, z, px, py)
function rWallY(yw, x0, x1, z0, z1, sh) {
  const bb = bboxOf([x0, yw, z0, x1, yw, z0, x0, yw, z1, x1, yw, z1]);
  for (let bx = Math.max(0, bb[0]); bx < Math.min(RB.w, bb[2]); bx++) {
    const sx = bx + RB.ox + 0.5, x = sx / TW + yw;
    if (x < x0 - EPS || x >= x1 - EPS) continue;
    for (let by = Math.max(0, bb[1]); by < Math.min(RB.h, bb[3]); by++) {
      const sy = by + RB.oy + 0.5, z = ((x + yw) * TH - sy) / ZH;
      if (z < z0 - EPS || z >= z1 - EPS) continue;
      plot(bx, by, sh(x, z, bx + RB.ox, by + RB.oy), x + yw, NRM_Y, x, yw, z);
    }
  }
}
// solid colour shader helpers
function flat(c) { return () => c; }
// box: top, +x face, +y face. Each shader gets its face's local coords; pass null to skip a face.
function rBox(x0, y0, z0, x1, y1, z1, shTop, shX, shY) {
  if (shX) rWallX(x1, y0, y1, z0, z1, shX);
  if (shY) rWallY(y1, x0, x1, z0, z1, shY);
  if (shTop) rFloor(x0, y0, x1, y1, z1, shTop);
}
// simple shaded box: top lit, +x face mid, +y face dark (light from upper left)
function rBoxC(x0, y0, z0, x1, y1, z1, top, sideX, sideY) {
  rBox(x0, y0, z0, x1, y1, z1, flat(top), flat(sideX), flat(sideY));
}
// vertical cylinder. sh(ang, z, px, py, edge) ang in -1..1 (left..right silhouette), edge = 1 on outline
function rCyl(cx, cy, r, z0, z1, sh, capSh) {
  const scx = isoX(cx, cy), rs = r * TW * Math.SQRT2;
  const bx0 = Math.floor(scx - rs) - RB.ox - 1, bx1 = Math.ceil(scx + rs) - RB.ox + 1;
  const syTop = isoY(cx, cy, z1) - r * TH * Math.SQRT2 - 2, syBot = isoY(cx, cy, z0) + r * TH * Math.SQRT2 + 2;
  for (let bx = Math.max(0, bx0); bx < Math.min(RB.w, bx1); bx++) {
    const dx = bx + RB.ox + 0.5 - scx;
    if (Math.abs(dx) > rs) continue;
    const a = dx / rs, b = Math.sqrt(Math.max(0, 1 - a * a)) * r;       // toward viewer
    const ao = a * r;
    const x = cx + (ao + b) / Math.SQRT2, y = cy + (b - ao) / Math.SQRT2;
    const edge = Math.abs(dx) > rs - 1 ? 1 : 0;
    for (let by = Math.max(0, Math.floor(syTop) - RB.oy); by < Math.min(RB.h, Math.ceil(syBot) - RB.oy); by++) {
      const sy = by + RB.oy + 0.5, z = ((x + y) * TH - sy) / ZH;
      if (z < z0 - EPS || z >= z1 - EPS) continue;
      plot(bx, by, sh(a, z, bx + RB.ox, by + RB.oy, edge), x + y, NRM_BB, x, y, z);
    }
  }
  if (capSh) {
    const bb = bboxOf([cx - r, cy - r, z1, cx + r, cy - r, z1, cx - r, cy + r, z1, cx + r, cy + r, z1]);
    for (let by = Math.max(0, bb[1]); by < Math.min(RB.h, bb[3]); by++) {
      const sy = by + RB.oy + 0.5 + z1 * ZH;
      for (let bx = Math.max(0, bb[0]); bx < Math.min(RB.w, bb[2]); bx++) {
        const sx = bx + RB.ox + 0.5, a = sx / TW, b = sy / TH, x = (a + b) * 0.5, y = (b - a) * 0.5;
        const dd = (x - cx) * (x - cx) + (y - cy) * (y - cy);
        if (dd > r * r) continue;
        plot(bx, by, capSh(x - cx, y - cy, bx + RB.ox, by + RB.oy), x + y, NRM_UP, x, y, z1);
      }
    }
  }
}
// sphere (lamp globes). sh(nx, ny, px, py) with nx,ny the screen-space normal (-1..1)
function rSphere(cx, cy, cz, r, sh) {
  const scx = isoX(cx, cy), scy = isoY(cx, cy, cz), rs = r * ZH;
  for (let by = Math.floor(scy - rs) - RB.oy - 1; by <= Math.ceil(scy + rs) - RB.oy + 1; by++) {
    for (let bx = Math.floor(scx - rs) - RB.ox - 1; bx <= Math.ceil(scx + rs) - RB.ox + 1; bx++) {
      if (bx < 0 || by < 0 || bx >= RB.w || by >= RB.h) continue;
      const nx = (bx + RB.ox + 0.5 - scx) / rs, ny = (by + RB.oy + 0.5 - scy) / rs;
      if (nx * nx + ny * ny > 1) continue;
      plot(bx, by, sh(nx, ny, bx + RB.ox, by + RB.oy), cx + cy + r * 0.5, NRM_BB, cx, cy, cz);
    }
  }
}
// pixel-art stamp standing at a world anchor (bottom-centre of the art at the anchor).
// rows: array of strings, key: char -> colour. depth is the anchor's x + y.
function rStamp(x, y, z, rows, key, flip) {
  const w = rows[0].length, h = rows.length;
  const sx0 = Math.round(isoX(x, y)) - (w >> 1) - RB.ox, sy0 = Math.round(isoY(x, y, z)) - h - RB.oy;
  for (let r = 0; r < h; r++) for (let i = 0; i < w; i++) {
    const ch = rows[r][flip ? w - 1 - i : i];
    if (ch === '.' || ch === ' ') continue;
    const c = key[ch];
    if (c === undefined) continue;
    plot(sx0 + i, sy0 + r, c, x + y, NRM_BB, x, y, z + (h - r) / ZH);
  }
}
// flat pixel art lying on a wall plane (posters, clocks, frames). u runs along the wall.
function rDecalX(xw, yc, zc, rows, key) {             // on a wall x = xw, centred at (yc, zc)
  const w = rows[0].length, h = rows.length;
  for (let r = 0; r < h; r++) for (let i = 0; i < w; i++) {
    const ch = rows[r][i]; if (ch === '.' || ch === ' ') continue;
    const c = key[ch]; if (c === undefined) continue;
    // step along the wall: each column moves -y by 1/16 m... use projected pixel placement
    const sx = Math.round(isoX(xw, yc)) - (w >> 1) + i, sy = Math.round(isoY(xw, yc, zc)) - (h >> 1) + r + Math.round(((w >> 1) - i) * 0.5);
    plot(sx - RB.ox, sy - RB.oy, c, xw + yc + 0.02, NRM_X, xw, yc, zc);
  }
}
function rDecalY(yw, xc, zc, rows, key) {             // on a wall y = yw, centred at (xc, zc)
  const w = rows[0].length, h = rows.length;
  for (let r = 0; r < h; r++) for (let i = 0; i < w; i++) {
    const ch = rows[r][i]; if (ch === '.' || ch === ' ') continue;
    const c = key[ch]; if (c === undefined) continue;
    const sx = Math.round(isoX(xc, yw)) - (w >> 1) + i, sy = Math.round(isoY(xc, yw, zc)) - (h >> 1) + r + Math.round((i - (w >> 1)) * 0.5);
    plot(sx - RB.ox, sy - RB.oy, c, xc + yw + 0.02, NRM_Y, xc, yw, zc);
  }
}
// a line of pixels in world space (wires, rails, pipes); c or shader
function rLine3(xa, ya, za, xb, yb, zb, c, thick) {
  const sxa = isoX(xa, ya), sya = isoY(xa, ya, za), sxb = isoX(xb, yb), syb = isoY(xb, yb, zb);
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(sxb - sxa), Math.abs(syb - sya))));
  for (let k = 0; k <= n; k++) {
    const t = k / n, x = lerp(xa, xb, t), y = lerp(ya, yb, t), z = lerp(za, zb, t);
    const px = Math.round(lerp(sxa, sxb, t)) - RB.ox, py = Math.round(lerp(sya, syb, t)) - RB.oy;
    plot(px, py, c, x + y + 0.01, NRM_BB, x, y, z);
    if (thick) plot(px, py + 1, c, x + y + 0.01, NRM_BB, x, y, z);
  }
}

// =================================================================== LIGHTING BAKE
// light: {x,y,z, r, k, map?, tag?, occl?} point light; map defaults to warm (LIT)
// slat:  {slat:1, wall:'x'|'y', plane, a0, a1, z0, z1, dx, dy, dz, period, duty, k, map?}
function segHitsBox(ax, ay, az, bx, by, bz, o) {
  // slab test on segment a->b against box o = [x0,y0,z0,x1,y1,z1]
  let t0 = 0.02, t1 = 0.98;
  const d = [bx - ax, by - ay, bz - az], a = [ax, ay, az];
  for (let k = 0; k < 3; k++) {
    if (Math.abs(d[k]) < 1e-9) { if (a[k] < o[k] || a[k] > o[k + 3]) return false; continue; }
    let u0 = (o[k] - a[k]) / d[k], u1 = (o[k + 3] - a[k]) / d[k];
    if (u0 > u1) { const q = u0; u0 = u1; u1 = q; }
    if (u0 > t0) t0 = u0; if (u1 < t1) t1 = u1;
    if (t0 > t1) return false;
  }
  return true;
}
function pointLightAt(L, x, y, z, nrm, occluders) {
  const dx = L.x - x, dy = L.y - y, dz = L.z - z, d = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (d >= L.r) return 0;
  let f = 1 - d / L.r; f = f * f;
  // facing: walls only get light from their front side
  if (nrm === NRM_X && dx < -0.05) return 0;
  if (nrm === NRM_Y && dy < -0.05) return 0;
  if (nrm === NRM_UP && dz < -0.05) return 0;
  if (nrm === NRM_X) f *= clamp(0.35 + dx / (d + 1e-6), 0, 1);
  else if (nrm === NRM_Y) f *= clamp(0.35 + dy / (d + 1e-6), 0, 1);
  else if (nrm === NRM_UP) f *= clamp(0.3 + dz / (d + 1e-6), 0, 1.2);
  if (L.occl !== false && occluders) for (let i = 0; i < occluders.length; i++) if (segHitsBox(x, y, z, L.x, L.y, L.z, occluders[i])) return 0;
  return f * L.k;
}
// venetian-blind light through a window: trace back along -dir to the window plane
function slatLightAt(S, x, y, z, occ) {
  let t;
  if (S.wall === 'x') { if (Math.abs(S.dx) < 1e-6) return 0; t = (x - S.plane) / S.dx; }
  else { if (Math.abs(S.dy) < 1e-6) return 0; t = (y - S.plane) / S.dy; }
  if (t < 0) return 0;
  const hx = x - S.dx * t, hy = y - S.dy * t, hz = z - S.dz * t;
  const a = S.wall === 'x' ? hy : hx;
  if (a < S.a0 || a > S.a1 || hz < S.z0 || hz > S.z1) return 0;
  const ph = frac((hz - S.z0) / S.period);
  if (ph > S.duty) return 0;
  // soft 1px edge handled by dithering the fractional distance to the slat edge
  if (occ) for (let i = 0; i < occ.length; i++) if (segHitsBox(x, y, z, hx, hy, hz, occ[i])) return 0;
  const edge = Math.min(ph, S.duty - ph) / S.period;
  return S.k * clamp(edge * 40, 0.35, 1);
}
function quantLight(c, level, b) {
  const steps = lightSteps(level, b);
  if (steps > 0) { c = LIT[c]; if (steps > 1) c = LIT[c]; if (steps > 2) c = LIT[c]; }
  else if (steps < 0) { c = SHD[c]; if (steps < -1) c = SHD[c]; if (steps < -2) c = SHD[c]; }
  return c;
}
function bakeRoom(rb, room) {
  const lights = room.lights || [], occ = room.occluders || [];
  const amb = room.ambient || 0;
  rb.alt = new Uint8Array(rb.w * rb.h);
  for (let by = 0; by < rb.h; by++) for (let bx = 0; bx < rb.w; bx++) {
    const i = by * rb.w + bx, n = rb.nrm[i];
    if (n === NRM_NONE || n === NRM_SKY || (rb.mat[i] & MAT_EMIT)) continue;
    const x = rb.wx[i], y = rb.wy[i], z = rb.wz[i], px = bx + rb.ox, py = by + rb.oy;
    const b = bay(px, py);
    let warm = amb + (room.dark ? room.dark(x, y, z, n) : 0);
    let bestTag = 0, bestTagV = 0, tagL = null;
    for (let l = 0; l < lights.length; l++) {
      const L = lights[l];
      const v = L.slat ? slatLightAt(L, x, y, z, occ) : pointLightAt(L, x, y, z, n, occ);
      if (v <= 0) continue;
      if (L.tag) { if (v > bestTagV) { bestTagV = v; bestTag = L.tag; tagL = L; } continue; }
      if (L.map) { if (b < v) rb.col[i] = L.map[rb.col[i]]; }
      else warm += v;
    }
    const base = rb.col[i];
    const c = quantLight(base, warm, b);
    rb.col[i] = c;
    if (bestTag) {
      // the same pixel with its dynamic light switched on
      const on = tagL.map ? (b < bestTagV ? tagL.map[c] : c) : quantLight(base, warm + bestTagV, b);
      if (on !== c) { rb.lgt[i] = bestTag; rb.alt[i] = on; }
    }
  }
}
// banded light: whole steps, dithered only in a narrow band around each half-step boundary
const DITHER_SPREAD = 0.5;
function lightSteps(level, b) { return Math.floor(level + 0.5 + (b - 0.5) * DITHER_SPREAD); }
// evaluate light for a sprite pixel at world (x, y, z): returns warm level (float)
const spriteTint = { map: null, v: 0 };
function lightLevelAt(room, x, y, z) {
  const lights = room.lights || [];
  let warm = (room.ambient || 0) + (room.dark ? room.dark(x, y, z, NRM_BB) : 0) + (room.spriteAmb || 0);
  spriteTint.map = null; spriteTint.v = 0;
  for (let l = 0; l < lights.length; l++) {
    const L = lights[l];
    let v;
    if (L.slat) v = slatLightAt(L, x, y, z, room.occluders);
    else {
      const dx = L.x - x, dy = L.y - y, dz = L.z - z, d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d >= L.r) continue;
      v = (1 - d / L.r); v = v * v * L.k * clamp(0.5 + (dx + dy) / (d + 1e-6) * 0.5, 0.25, 1);
    }
    if (v <= 0) continue;
    if (L.tag) { if (!lightOn(L.tag)) continue; if (L.map) { if (v > spriteTint.v) { spriteTint.v = v; spriteTint.map = L.map; } } else warm += v; continue; }
    if (L.map) { if (v > spriteTint.v) { spriteTint.v = v; spriteTint.map = L.map; } }
    else warm += v;
  }
  return warm;
}
// dynamic light states (tag -> on/off), set every frame by the room's update
const lightState = new Uint8Array(64).fill(1);
const tagMap = [];            // tag -> remap applied to tagged pixels when on
function lightOn(tag) { return lightState[tag] === 1; }

// finalise a room buffer: compute reflection sources for puddles, drop bake-only arrays
function finishRB(rb) {
  let any = false;
  for (let i = 0; i < rb.mat.length; i++) if (rb.mat[i] & (MAT_PUDDLE | MAT_GLOSS)) { any = true; break; }
  if (any) {
    rb.refl = new Int32Array(rb.w * rb.h).fill(-1);
    for (let bx = 0; bx < rb.w; bx++) {
      for (let by = rb.h - 1; by >= 0; by--) {
        const i = by * rb.w + bx;
        if (!(rb.mat[i] & (MAT_PUDDLE | MAT_GLOSS)) || rb.nrm[i] !== NRM_UP) continue;
        // walk up the column to the first non-floor pixel: that is the base line to mirror about
        let k = by - 1;
        while (k >= 0 && rb.nrm[k * rb.w + bx] === NRM_UP) k--;
        if (k < 0) continue;
        const base = k + 0.5, src = Math.round(2 * base - by);
        if (src >= 0 && src < rb.h) rb.refl[i] = src * rb.w + bx;
      }
    }
  }
  rb.wx = rb.wy = rb.wz = null;
}
