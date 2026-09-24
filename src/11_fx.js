
// =================================================================== SCREEN-SPACE 3D (moving vehicles etc.)
// Reuses the room rasteriser, writing straight into the frame (fb/zb/hb) at the camera offset.
const SCR_RB = { w: W, h: H, ox: 0, oy: 0, col: fb, dep: zb, hot: hb, nrm: new Uint8Array(W * H), mat: new Uint8Array(W * H),
                 lgt: null, refl: null, wx: new Float32Array(W * H), wy: new Float32Array(W * H), wz: new Float32Array(W * H) };
function beginScreen(cx, cy) { SCR_RB.ox = cx; SCR_RB.oy = cy; RB = SCR_RB; curHot = 0; curMat = 0; curBias = 0; }
function endScreen() { RB = null; }

// =================================================================== RAIN
// drops fall in screen space; splashes land on outdoor floor pixels; puddles get ripple rings
function drawRain(cx, cy, n, outdoor) {
  const t = tick;
  for (let k = 0; k < n; k++) {
    const sp = 5 + (k % 3);
    const x0 = hashi(k, 11) % (W + 60), y0 = hashi(k, 12) % (H + 40);
    let x = (x0 - ((t * sp) >> 2)) % (W + 60); if (x < 0) x += W + 60; x -= 30;
    const y = ((y0 + t * sp) % (H + 40)) - 20;
    for (let j = 0; j < 3; j++) {
      const px = x + (j >> 1), py = y + j;
      if (px < 0 || py < 0 || px >= W || py >= H) continue;
      const p = py * W + px;
      fb[p] = j === 0 ? LIT[fb[p]] : (bay(px, py) < 0.5 ? LIT[fb[p]] : fb[p]);
    }
  }
  if (!outdoor) return;
  // splashes: a few random floor points per frame
  for (let k = 0; k < 26; k++) {
    const hsh = hashi(t, k * 13 + 5), px = hsh % W, py = (hashi(t, k * 7 + 1) % H);
    const p = py * W + px;
    if (!(mb[p] & MAT_OUTSIDE) || sm[p]) continue;
    if (mb[p] & MAT_PUDDLE) {
      // ripple ring
      for (let a = 0; a < 8; a++) {
        const rx = px + Math.round(Math.cos(a * 0.785) * 2), ry = py + Math.round(Math.sin(a * 0.785));
        if (rx >= 0 && ry >= 0 && rx < W && ry < H && (mb[ry * W + rx] & MAT_PUDDLE)) fb[ry * W + rx] = LIT[fb[ry * W + rx]];
      }
    } else {
      pset(px, py, LIT[LIT[fb[p]]]); if (py > 0) pset(px - 1, py - 1, LIT[fb[p]]); if (py > 0) pset(px + 1, py - 1, LIT[fb[p]]);
    }
  }
}
// a soft puff (steam / exhaust / smoke): dithered disc remapped lighter
function puff(px, py, r, k, map, d) {
  for (let y = Math.floor(py - r); y <= Math.ceil(py + r); y++) for (let x = Math.floor(px - r); x <= Math.ceil(px + r); x++) {
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const dd = ((x - px) * (x - px) + (y - py) * (y - py)) / (r * r);
    if (dd > 1) continue;
    const p = y * W + x;
    if (d !== undefined && zb[p] > d) continue;
    if (bay(x, y) < k * (1 - dd)) fb[p] = map[fb[p]];
  }
}
// vignette: dither the corners one shade darker (used outdoors)
function vignette(strength) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = (x - W / 2) / (W / 2), dy = (y - H / 2) / (H / 2);
    const v = (dx * dx * 0.6 + dy * dy * 0.4 + dx * dx * dy * dy * 1.2) * strength - 0.35;
    if (v > 0 && bay(x, y) < v) fb[y * W + x] = SHD[fb[y * W + x]];
  }
}

// =================================================================== VEHICLES (screen-space boxes)
// 1950s sedan along the x axis. x0 = rear, len along +x (facing +x if dir > 0)
function drawSedan(cx, cy, x0, y0, len, body, bodyDark, chrome, glass, dir, opts) {
  beginScreen(cx, cy);
  sedanGeom(x0, y0, len, body, bodyDark, chrome, glass, dir, opts);
  endScreen();
}
function sedanGeom(x0, y0, len, body, bodyDark, chrome, glass, dir, opts) {
  const o = opts || {};
  if (o.hot) setHot(o.hot);
  const w = 1.8, x1 = x0 + len, y1 = y0 + w;
  const nose = dir > 0 ? x1 : x0, tail = dir > 0 ? x0 : x1;
  // wheels
  for (const wx of [x0 + 0.8, x1 - 0.8]) { rCyl(wx, y1 - 0.05, 0.33, 0, 0.05, () => C.BLK); rWallY(y1 + 0.001, wx - 0.33, wx + 0.33, 0.05, 0.6, (x, z) => Math.hypot(x - wx, z - 0.33) < 0.3 ? (Math.hypot(x - wx, z - 0.33) < 0.12 ? chrome : C.BLK) : T); }
  // lower body
  rBox(x0, y0, 0.28, x1, y1, 0.85, flat(body), (y, z) => z < 0.36 ? chrome : bodyDark,
       (x, z) => (z > 0.6 && z < 0.64) ? chrome : (Math.abs(x - (x0 + 0.8)) < 0.42 || Math.abs(x - (x1 - 0.8)) < 0.42) && z < 0.62 ? C.BLK : body);
  // cabin
  const c0 = x0 + len * 0.3, c1 = x0 + len * 0.72;
  rBox(c0, y0 + 0.12, 0.85, c1, y1 - 0.12, 1.35, flat(body), (y, z) => glass, (x, z) => (x > c0 + 0.12 && x < c1 - 0.12 && z > 0.9) ? (Math.abs(x - (c0 + c1) / 2) < 0.05 ? body : glass) : body);
  // lights
  if (o.lights) { rWallX(dir > 0 ? x1 + 0.001 : x0 - 0.001, y0 + 0.2, y0 + 0.5, 0.55, 0.7, flat(C.HOT)); rWallX(dir > 0 ? x1 + 0.001 : x0 - 0.001, y1 - 0.5, y1 - 0.2, 0.55, 0.7, flat(C.HOT)); }
  // tail fin + red lamp on the visible side
  rWallY(y1 + 0.002, tail - (dir > 0 ? -0.05 : 0.25), tail + (dir > 0 ? 0.25 : -0.05), 0.55, 0.75, flat(C.RED));
}
