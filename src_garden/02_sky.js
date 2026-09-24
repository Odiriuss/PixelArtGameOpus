
// =================================================================== SKY (parallax 0.05)
const F_SKY = 0.05, F_FAR = 0.15, F_MID = 0.25, F_HILL = 0.5, F_GARDEN = 1.0, F_CAR = 0.7, F_FG = 1.4;
const HZ = 86;              // sea horizon, far-layer y
const SUN_X = 186;          // sun centre, sky-layer x
const skyL = makeLayer(340, 138, F_SKY, L.SKY);

// dusk gradient as one continuous level (plateaus + short ramps) plus a sunset bloom,
// dithered once between neighbouring ramp colours so bands stay clean
const SKY_RAMP = [C.SK0, C.SK1, C.SK2, C.SK3, C.SK4, C.GLOW, C.HOT];
const SKY_KEYS = [0, 0, 11, 0, 21, 1, 31, 1, 42, 2, 51, 2, 62, 3, 69, 3, 80, 4];
function skyLevel(y) {
  for (let k = 0; k < SKY_KEYS.length - 2; k += 2) {
    if (y < SKY_KEYS[k + 2]) return lerp(SKY_KEYS[k + 1], SKY_KEYS[k + 3], (y - SKY_KEYS[k]) / (SKY_KEYS[k + 2] - SKY_KEYS[k]));
  }
  return 4;
}
function buildSky() {
  for (let y = 0; y < skyL.h; y++) for (let x = 0; x < skyL.w; x++) {
    let v = skyLevel(y);
    const dx = (x - SUN_X) / 92, dy = (y - (HZ + 1)) / 36, d = Math.sqrt(dx * dx + dy * dy);
    if (d < 1) v += 1.45 * (1 - d) * (1 - d);
    v = Math.min(v, 4.85);
    const i = Math.floor(v), f = clamp((v - i - 0.3) / 0.4, 0, 1);    // narrow dithered transitions
    lset(skyL, x, y, SKY_RAMP[Math.min(6, i + (bay(x, y) < f ? 1 : 0))]);
  }
}

// ---- cloud banks: 1D top/bottom profiles, drawn per frame with a loop-locked drift
const CLOUDS = [
  // x0 (sky coords), length, centre y, thickness, drift amplitude, drift phase, seed
  { x0: -30, len: 260, cy: 27, th: 15, amp: 9, ph: 0.00, seed: 11 },
  { x0: 110, len: 250, cy: 47, th: 12, amp: 7, ph: 0.35, seed: 23 },
  { x0: -20, len: 360, cy: 64, th: 7, amp: 11, ph: 0.62, seed: 37 }
];
for (const cb of CLOUDS) {
  cb.top = new Int16Array(cb.len); cb.bot = new Int16Array(cb.len);
  for (let i = 0; i < cb.len; i++) {
    const u = i / (cb.len - 1), taper = Math.sin(Math.PI * u);
    const lump = pnoise(i / 16, 64, cb.seed) * 0.55 + pnoise(i / 6, 128, cb.seed + 1) * 0.3 + pnoise(i / 2.5, 256, cb.seed + 3) * 0.15;
    const th = Math.max(0, Math.round(cb.th * Math.pow(taper, 0.6) * (0.35 + 0.9 * lump)));
    cb.top[i] = cb.cy - th;
    cb.bot[i] = cb.cy + Math.round(Math.pow(taper, 0.8) * (1 + pnoise(i / 14, 32, cb.seed + 2) * 2.2));
  }
}
function drawClouds(f, camX, camY) {
  const t = f / FPS;
  const ox = Math.round(camX * F_SKY), oy = Math.round(camY * F_SKY);
  const sunSx = SUN_X - ox;
  for (let b = 0; b < CLOUDS.length; b++) {
    const cb = CLOUDS[b];
    const dx = Math.round(cb.amp * osc(1, t, cb.ph));
    for (let i = 0; i < cb.len; i++) {
      const sx = cb.x0 + i + dx - ox;
      if (sx < 0 || sx >= W) continue;
      const top = cb.top[i], bot = cb.bot[i];
      if (bot <= top) continue;
      const sunK = Math.max(0, 1 - Math.abs(sx - sunSx) / 110);    // underside heat near the sun
      for (let y = top; y < bot; y++) {
        const sy = y - oy + IY0;
        let c = C.CLOUD;
        const fromBot = bot - 1 - y;
        if (fromBot === 0) c = (bay(sx, sy) < sunK * 0.9) ? C.GLOW : C.SK4;
        else if (fromBot === 1) c = (bay(sx, sy) < 0.25 + sunK * 0.6) ? C.SK4 : (bay(sx + 2, sy) < 0.5 ? C.SK3 : C.CLOUD);
        else if (fromBot === 2 && bay(sx, sy) < 0.2 + sunK * 0.3) c = C.SK3;
        else if (y === top && bay(sx, sy) < 0.35) c = C.SK1;       // soft, cool upper edge
        pset(sx, sy, c, L.CLOUD);
      }
    }
  }
}

// ---- first stars near the zenith
const STARS = [[22, 4, 3, 0.1], [71, 9, 5, 0.5], [133, 3, 4, 0.8], [204, 7, 6, 0.3], [262, 12, 3, 0.7], [301, 5, 5, 0.2]];
function drawStars(f, camX, camY) {
  const t = f / FPS;
  const ox = Math.round(camX * F_SKY), oy = Math.round(camY * F_SKY);
  for (let i = 0; i < STARS.length; i++) {
    const s = STARS[i], x = s[0] - ox, y = s[1] - oy + IY0;
    const i0 = y * W + x;
    if (x < 0 || x >= W || lid[i0] !== L.SKY) continue;
    const v = osc(s[2] * 3, t, s[3]) + 0.35 * osc(s[2] * 7, t, s[3] * 2);
    if (v > 0.55) fb[i0] = C.HAZE; else if (v > -0.6) fb[i0] = C.SK2;
  }
}

// ---- the sun: last molten sliver, cut by the sea horizon
function drawSun(camX, camY, tick) {
  const sx = SUN_X - Math.round(camX * F_SKY);
  const hz = HZ - Math.round(camY * F_FAR) + IY0;
  const cy = hz + 3;
  for (let y = cy - 7; y < hz; y++) {
    const dy = y - cy, hw = Math.sqrt(Math.max(0, 56 - dy * dy));
    const shimmer = ((tick >> 3) + y) & 1;        // heat wobble every 8 ticks
    for (let x = Math.round(sx - hw - shimmer * 0.5); x <= Math.round(sx + hw); x++) {
      const e = Math.abs(x - sx) / (hw + 0.5);
      pset(x, y, e > 0.8 ? C.GLOW : C.HOT, L.SKY);
    }
  }
  // thin hot line on the horizon either side of the sun
  for (let x = sx - 12; x <= sx + 12; x++) if (bay(x, hz) < 1 - Math.abs(x - sx) / 12) pset(x, hz - 1, C.GLOW, L.SKY);
}

// ---- searchlights: sweeping dithered haze wedges (origins on far-layer towers)
const SEARCH = [
  // far-layer origin x, y, base angle (rad from vertical), sweep amp, cycles/loop, phase, length
  { x: 225, y: 34, a: 0.10, amp: 0.55, k: 2, ph: 0.00, len: 92 },
  { x: 290, y: 46, a: -0.25, amp: 0.45, k: 3, ph: 0.40, len: 80 },
  { x: 58, y: 56, a: 0.30, amp: 0.40, k: 2, ph: 0.70, len: 78 }
];
function drawSearchlights(f, camX, camY) {
  const t = f / FPS;
  const ox = Math.round(camX * F_FAR), oy = Math.round(camY * F_FAR);
  for (let b = 0; b < SEARCH.length; b++) {
    const s = SEARCH[b];
    const ang = s.a + s.amp * osc(s.k, t, s.ph);
    const sx0 = s.x - ox, sy0 = s.y - oy + IY0;
    const tn = Math.tan(ang), cs = Math.cos(ang);
    const rows = Math.floor(s.len * cs);
    for (let r = 1; r < rows; r++) {
      const y = sy0 - r;
      if (y < IY0) break;
      const dist = r / cs, u = dist / s.len;
      const xc = sx0 + tn * r, hw = (0.8 + dist * 0.11) / cs;
      const x0 = Math.floor(xc - hw), x1 = Math.ceil(xc + hw);
      for (let x = x0; x <= x1; x++) {
        if (x < 0 || x >= W) continue;
        const e = 1 - Math.abs(x - xc) / (hw + 0.5);
        if (e <= 0) continue;
        const i = y * W + x, l = lid[i];
        if (l !== L.SKY && l !== L.CLOUD) continue;
        let dens = (0.5 - u * 0.4 + Math.max(0, 0.25 - u * 2)) * Math.min(1, e * 1.8);
        if (l === L.CLOUD) dens = dens * 1.4 + 0.12;
        if (bay(x, y) < dens) fb[i] = BEAM[fb[i]];
      }
    }
  }
}
