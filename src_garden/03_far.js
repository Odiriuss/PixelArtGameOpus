
// =================================================================== FAR CITY + BAY (parallax 0.15)
const farL = makeLayer(356, 140, F_FAR, L.FAR);
const FAR_FRONT = [
  [4, [14, 66], [10, 60], [6, 56]], [22, [10, 70], [6, 62], [2, 55]], [36, [16, 64], [12, 58], [8, 54], [4, 50]],
  [56, [12, 72]], [70, [10, 62], [6, 56], [2, 48]], [84, [18, 68], [14, 64]],
  [106, [12, 60], [8, 54], [4, 50], [1, 44]], [122, [16, 70], [10, 64]], [142, [10, 66], [6, 60]],
  [160, [9, 58], [7, 50], [5, 44], [3, 40], [1, 33]],                       // left flank of the sun
  [174, [6, 86]], [202, [9, 85]],                                          // low harbour sheds in the gap
  [216, [14, 60], [12, 52], [10, 46], [6, 40], [4, 36], [2, 31], [1, 25]],   // mooring-mast tower
  [234, [12, 66], [10, 58], [6, 54]], [248, [18, 56], [14, 50], [10, 46], [6, 42], [2, 37]],
  [268, [8, 62], [4, 52], [1, 45]], [278, [20, 64], [16, 60]], [300, [10, 54], [8, 48], [4, 44], [1, 37]],
  [312, [14, 68], [10, 62]], [328, [16, 60], [12, 54], [8, 50]], [345, [9, 70]]
];
const FAR_BASE = 89;
const MAXWIN = 420;
const winX = new Int16Array(MAXWIN), winY = new Int16Array(MAXWIN), winC = new Uint8Array(MAXWIN), winOn = new Uint8Array(MAXWIN);
let winN = 0;
const BEACONS = [];        // [x, y, phase]
const REFL_X = [];         // shoreline x positions that mirror city lights

function towerTiers(spec, base, col, front, sunSide) {
  const x = spec[0], w0 = spec[1][0], cx = x + (w0 >> 1);
  let prevTop = base;
  for (let k = 1; k < spec.length; k++) {
    const tw = spec[k][0], top = spec[k][1], lx = cx - (tw >> 1);
    for (let y = top; y < prevTop; y++) for (let xx = lx; xx < lx + tw; xx++) {
      let c = col;
      // sunset rim on the edge that faces the sun, deco fluting on wide tiers
      if (front && tw > 2 && xx === (sunSide > 0 ? lx + tw - 1 : lx)) c = (y < top + 2) ? C.SK3 : C.CITY1;
      else if (front && tw >= 10 && ((xx - lx) % 4 === 1) && y > top + 1) c = C.SK0;
      lset(farL, xx, y, c, L.FAR);
    }
    // setback ledge catching light
    if (front && tw > 3) for (let xx = lx; xx < lx + tw; xx++) if (bay(xx, top) < 0.5) lset(farL, xx, top, C.CITY1, L.FAR);
    if (front && tw > 3) {
      for (let y = top + 2; y < prevTop - 1; y += 3) for (let xx = lx + 1; xx < lx + tw - 1; xx += 2) {
        if (winN >= MAXWIN || hash(xx * 7 + y, 5) > 0.42) continue;
        winX[winN] = xx; winY[winN] = y; winC[winN] = hash(xx, y) < 0.72 ? C.GLOW : C.SK4;
        winOn[winN] = hash(xx, y * 3) < 0.55 ? 1 : 0; winN++;
      }
    }
    if (k === spec.length - 1 && tw <= 2 && top < 56) BEACONS.push([cx, top - 1, hash(cx, 9)]);
    prevTop = top;
  }
}
function buildFar() {
  // bay water
  for (let y = HZ; y < farL.h; y++) for (let x = 0; x < farL.w; x++) {
    let c = C.BAY0;
    const d = y - HZ;
    if (d === 0) c = bay(x, y) < 0.7 ? C.SK2 : C.BAY1;
    else if (d < 3) c = bay(x, y) < 0.6 - d * 0.15 ? C.BAY1 : C.BAY0;
    else if (hash(x >> 3, y) < 0.14 && (y & 1)) c = C.BAY1;                      // long ripple dashes
    lset(farL, x, y, c, L.BAY);
  }
  // back row (hazier, lighter)
  let x = -4;
  while (x < farL.w) {
    const w = 5 + Math.floor(hash(x, 1) * 8), h = 10 + Math.floor(hash(x, 2) * 22);
    if (!(x + w > 168 && x < 214)) {
      const top = FAR_BASE - h;
      const spec = [x, [w, top]];
      if (hash(x, 3) < 0.5) spec.push([Math.max(1, w - 4), top - 4]);
      if (hash(x, 4) < 0.3) spec.push([1, top - 9]);
      towerTiers(spec, FAR_BASE - 1, C.CITY1, false, 0);
    }
    x += w + Math.floor(hash(x, 5) * 5) - 1;
  }
  // front row (darker silhouettes with lit windows)
  for (let i = 0; i < FAR_FRONT.length; i++) {
    const s = FAR_FRONT[i];
    const centre = s[0] + (s[1][0] >> 1);
    towerTiers(s, FAR_BASE, C.CITY0, true, centre < 192 ? 1 : -1);
  }
  // shoreline: a dark quay line and mirrored light positions
  for (let xx = 0; xx < farL.w; xx++) {
    if (lget(farL, xx, FAR_BASE - 1) !== T && lget(farL, xx, FAR_BASE - 1) !== C.BAY0) {
      lset(farL, xx, FAR_BASE, C.INK, L.FAR);
      if (hash(xx, 77) < 0.07) REFL_X.push(xx);
    }
  }
}

const LANE_Y = [50, 59, 71], LANE_K = [1, 2, 1];
const SHIP_X = [118, 244, 302], SHIP_Y = [96, 101, 93], SHIP_LEN = [10, 15, 7];
function drawFarDynamic(tick, camX, camY) {
  const t = tick / FPS;
  const ox = Math.round(camX * F_FAR), oy = Math.round(camY * F_FAR) - IY0;
  const seg = Math.floor(t / 1.5);                      // 36 segments per loop
  // windows: stable base with occasional switches
  for (let i = 0; i < winN; i++) {
    let on = winOn[i];
    if (hash(i, 1000 + seg) < 0.05) on ^= 1;
    if (!on) continue;
    const x = winX[i] - ox, y = winY[i] - oy;
    if (x >= 0 && x < W && y >= IY0 && y < IY1 && lid[y * W + x] === L.FAR) fb[y * W + x] = winC[i];
  }
  // aviation beacons
  for (let i = 0; i < BEACONS.length; i++) {
    const b = BEACONS[i];
    if (frac(36 * t / LOOP_S + b[2]) < 0.22) pset(b[0] - ox, b[1] - oy, C.RED, L.FAR);
  }
  // city light reflections on the bay (shimmer every 8 ticks)
  const sh = tick >> 3;
  for (let i = 0; i < REFL_X.length; i++) {
    const x = REFL_X[i] - ox;
    if (x < 0 || x >= W) continue;
    const len = 1 + Math.floor(hash(i, sh) * 2);
    for (let k = 0; k < len; k++) {
      const y = FAR_BASE + 1 + k * 2 + (hash(i, sh + k) < 0.5 ? 0 : 1) - oy;
      if (y >= IY0 && y < IY1 && lid[y * W + x] === L.BAY) fb[y * W + x] = k === 0 ? C.SK4 : C.SK3;
    }
  }
  // sun reflection column: stacked horizontal glints under the sun, re-dealt every 8 ticks (shimmer)
  const sunSx = SUN_X - Math.round(camX * F_SKY), hz = HZ - oy;
  for (let y = hz + 1; y < IY1; y++) {
    const d = y - hz;
    if (d > 2 && (d & 1)) continue;                                        // glints on alternate rows
    if (d > 9 && hash(d, sh + 7) < 0.45) continue;                          // broken deeper down
    const span = 1.2 + d * 0.3, len = span * (0.35 + 0.65 * hash(d, sh));
    const cxr = sunSx + Math.round((hash(d + 40, sh) - 0.5) * span * 0.7);
    for (let x = Math.round(cxr - len); x <= Math.round(cxr + len); x++) {
      if (x < 0 || x >= W) continue;
      const i = y * W + x;
      if (lid[i] !== L.BAY) continue;
      const e = 1 - Math.abs(x - cxr) / (len + 0.5);
      fb[i] = d < 4 ? (e > 0.4 ? C.HOT : C.GLOW) : d < 11 ? (e > 0.55 ? C.GLOW : C.SK4) : (e > 0.5 ? C.SK4 : C.SK3);
    }
  }
  // distant aircar traffic: paired light pixels on loop-locked lanes
  for (let ln = 0; ln < 3; ln++) {
    const ly = LANE_Y[ln], k = LANE_K[ln], dir = ln === 1 ? -1 : 1, span = 384;
    for (let c = 0; c < 5; c++) {
      const x0 = hash(ln, c) * span;
      let x = (x0 + dir * span * k * t / LOOP_S) % span; if (x < 0) x += span;
      const sx = Math.round(x) - 20 - ox, sy = ly + (c & 1) - oy;
      const col = (c + ln) % 3 === 0 ? C.RED : C.GLOW;
      pset(sx, sy, col, L.FAR); pset(sx + 1, sy, col, L.FAR);
    }
  }
  // ships: dark hulls with deck lights, gently drifting
  for (let s = 0; s < 3; s++) {
    const bx = SHIP_X[s] + Math.round(4 * osc(1, t, s * 0.3)), by = SHIP_Y[s], len = SHIP_LEN[s];
    const sx = bx - ox, sy = by - oy;
    for (let x = 0; x < len; x++) pset(sx + x, sy, C.BLK, L.FAR);
    for (let x = 2; x < len - 2; x++) pset(sx + x, sy - 1, C.BLK, L.FAR);
    pset(sx + (len >> 1), sy - 2, C.BLK, L.FAR);
    pset(sx + 1, sy - 1, C.GLOW, L.FAR);
    if (frac(18 * t / LOOP_S + s * 0.37) < 0.5) pset(sx + len - 2, sy - 1, s === 1 ? C.RED : C.GLOW, L.FAR);
    pset(sx + (len >> 1), sy + 1, C.SK4, L.BAY);
  }
}
// harbour fog: periodic noise texture (128 px, precomputed) drifting one period per loop, on the water
const FOG_H = 20, FOG_P = 128;
const fogTex = new Float32Array(FOG_H * FOG_P);
function buildFog() {
  for (let r = 0; r < FOG_H; r++) for (let x = 0; x < FOG_P; x++) {
    const u = x / 16, fy = HZ + 4 + r;
    const n = pnoise(u, 8, 91) * 0.7 + pnoise(u * 2 + fy * 0.3, 16, 92) * 0.3;
    fogTex[r * FOG_P + x] = Math.sin(Math.PI * r / FOG_H) * (n - 0.42) * 0.8;
  }
}
function drawFog(f, camX, camY) {
  const ox = Math.round(camX * F_FAR), oy = Math.round(camY * F_FAR) - IY0;
  const drift = Math.floor(FOG_P * f / LOOP_F);
  for (let r = 0; r < FOG_H; r++) {
    const y = HZ + 4 + r - oy;
    if (y < IY0 || y >= IY1) continue;
    for (let x = 0; x < W; x++) {
      const i = y * W + x, l = lid[i];
      if (l !== L.BAY && l !== L.FAR) continue;
      if (bay(x, y) < fogTex[r * FOG_P + ((x + ox + drift) & (FOG_P - 1))]) fb[i] = BEAM[fb[i]];
    }
  }
}
