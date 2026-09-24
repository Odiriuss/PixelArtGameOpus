
// =================================================================== GARDEN: per-frame state and light
const bedWet = new Float32Array(3 * BED_W);         // soil wetness per column, 0 dry .. 1 soaked
const SOIL_RAMP = [C.SOILD, C.SOILM, C.SOILW, C.SOILW];
const MAXWS = 48;
const wsX = new Int16Array(MAXWS), wsY = new Int16Array(MAXWS), wsLife = new Float32Array(MAXWS);
const WS_LIFE = 5.5;
let wsNext = 0;
function addWetSpot(x, y) {
  // refresh an existing nearby spot instead of stacking
  for (let i = 0; i < MAXWS; i++) if (wsLife[i] > 0 && Math.abs(wsX[i] - x) < 3 && wsY[i] === y) { wsLife[i] = WS_LIFE; return; }
  wsX[wsNext] = x; wsY[wsNext] = y; wsLife[wsNext] = WS_LIFE; wsNext = (wsNext + 1) % MAXWS;
}
function lampFlicker(i, f) {             // percent
  const seg = (f / 6) | 0;
  return hash(seg, 300 + i) < 0.018 ? 55 : (hash(seg, 400 + i) < 0.03 ? 85 : 100);
}

function drawSoilAndBlooms(cx, cy) {
  for (let b = 0; b < 3; b++) {
    const bx = BEDS[b].x, s = slope(bx + 14);
    for (let i = 1; i < BED_W - 1; i++) {
      const w = bedWet[b * BED_W + i], lv = w * 2, base = Math.floor(lv), f = lv - base;
      for (let r = 0; r < 2; r++) {
        const wx = bx + i, wy = BED_SOIL - s + r, sx = wx - cx, sy = wy - cy + IY0;
        let c = bay(sx, sy) < f ? SOIL_RAMP[base + 1] : SOIL_RAMP[base];
        if (r === 0 && hash(wx, 17) < 0.2) c = SHD[c];                  // clods
        if (r === 1) c = SHD[c] === 0 ? c : SHD[c];
        pset(sx, sy, c, L.BED);
      }
    }
  }
  for (let i = 0; i < bloomN; i++) {
    const x = bloomX[i] - cx, y = bloomY[i] - cy + IY0 - (bloomPerk[i] > 0 ? 1 : 0), k = bloomK[i];
    if (k === 0) { pset(x, y, C.CRIM, L.BED); pset(x + 1, y, C.CORAL, L.BED); pset(x, y + 1, C.OX, L.BED); pset(x + 1, y + 1, C.CRIM, L.BED); }
    else if (k === 1) { pset(x, y, C.CRIM, L.BED); pset(x, y + 1, C.OX, L.BED); }
    else if (k === 2) { pset(x, y, C.MARI, L.BED); pset(x + 1, y, C.PALEY, L.BED); pset(x, y + 1, C.SK4, L.BED); pset(x + 1, y + 1, C.MARI, L.BED); }
    else if (k === 3) { pset(x, y, C.CORAL, L.BED); pset(x + 1, y, C.CORAL, L.BED); pset(x, y + 1, C.SK4, L.BED); }
    else if (k === 4) { pset(x, y, C.LAV, L.BED); pset(x, y + 1, C.LAV, L.BED); pset(x, y + 2, C.SK2, L.BED); pset(x, y + 3, C.LAV, L.BED); pset(x + 1, y + 1, C.SK2, L.BED); }
    else { pset(x, y, C.PALEY, L.BED); pset(x - 1, y, C.CREAM, L.BED); pset(x + 1, y, C.CREAM, L.BED); pset(x, y - 1, C.CREAM, L.BED); pset(x, y + 1, C.CREAMS, L.BED); }
  }
}

// stucco under lamp light keeps its own ramp (dark stucco -> cool -> lit -> cream)
const HLIT = makeMap([23, 39, 39, 38, 38, 37, 37, 8, 40, 23, 1, 40, 29, 30, 30, 31, 22, 23, 52, 8]);
// ground under lamp light: warm grey first, burnt amber only in the core
const GLIT = makeMap([1, 22, 22, 23, 23, 24, 24, 6, 18, 19, 19, 20, 20, 21, 21, 35, 27, 26, 26, 25, 25, 6,
  28, 29, 29, 30, 30, 31, 40, 39, 32, 33, 34, 35, 36, 37]);
// dithered elliptical pool: solid-ish core, short dithered falloff; two steps in the core
function lightPool(cx, cy, rx, ry, pct, mask, map) {
  const strength = pct / 100;          // integer percent keeps call arguments as small ints
  const x0 = Math.floor(cx - rx), x1 = Math.ceil(cx + rx), y0 = Math.floor(cy - ry), y1 = Math.ceil(cy + ry);
  for (let y = Math.max(IY0, y0); y <= Math.min(IY1 - 1, y1); y++) {
    const dy = (y - cy) / ry;
    for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) {
      const dx = (x - cx) / rx, d = Math.sqrt(dx * dx + dy * dy);
      if (d >= 1) continue;
      const i = y * W + x;
      if (!(mask & (1 << lid[i]))) continue;
      const th = bay(x, y), k = 1 - d;
      if (th < clamp((k - 0.3) * 3.2, 0, 1) * strength) fb[i] = map[fb[i]];
      if (d < 0.3 && th < clamp((0.3 - d) * 8, 0, 1) * strength) fb[i] = map[fb[i]];
    }
  }
}
function drawLamps(tick, cx, cy) {
  const t = tick / FPS;
  for (let i = 0; i < LAMPS.length; i++) {
    const lp = LAMPS[i], s = lp.porch ? 0 : slope(lp.x), fl = lampFlicker(i, tick), f = fl / 100;
    const bx = lp.x - cx, by = lp.y - s - cy + IY0;
    if (bx < -40 || bx > W + 40) continue;
    const gy = (lp.porch ? 128 : WALL_BASE + 5 - s) - cy + IY0;
    lightPool(bx, gy, lp.porch ? 24 : 26, 8, fl, M_GROUNDISH | (1 << L.GLASS), GLIT);
    if (lp.porch) lightPool(bx - 4, by + 3, 15, 14, (fl * 85 / 100) | 0, 1 << L.HOUSE, HLIT);
    else lightPool(bx, by + 14, 10, 16, (fl * 60 / 100) | 0, M_GROUNDISH | (1 << L.GLASS), GLIT);
    // halo around the bulb (any layer)
    lightPool(bx, by, 7, 6, fl >> 1, M_ALL & ~(1 << L.HOUSE), LIT);
    // bulb
    if (lp.porch) {
      for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) {
        const d = x * x + y * y;
        if (d > 5) continue;
        pset(bx + x, by + y, d <= 1 ? (f < 0.7 ? C.GLOW : C.HOT) : (y >= 1 && x <= 0 ? C.SK4 : C.GLOW), L.PROP);
      }
    } else {
      for (let y = -2; y <= 2; y++) { pset(bx - 1, by + y, C.GLOW, L.PROP); pset(bx + 1, by + y, y > 0 ? C.SK4 : C.GLOW, L.PROP); pset(bx, by + y, f < 0.7 ? C.GLOW : C.HOT, L.PROP); }
    }
    // wet-stone reflection streak below the lamp
    const ry0 = (lp.porch ? 131 : PATH_TOP + 3 - s) - cy + IY0, sh = tick >> 3;
    for (let r = 0; r < 13; r++) {
      const y = ry0 + r, k = 1 - r / 13;
      for (let dx = -1; dx <= 1; dx++) {
        const x = bx + dx, h = hash(x * 5 + r, sh);
        if (x < 0 || x >= W || y < IY0 || y >= IY1) continue;
        const idx = y * W + x;
        if (lid[idx] !== L.GROUND) continue;
        const dens = (dx === 0 ? 0.55 : 0.18) * k * f;
        if (h < dens) fb[idx] = r < 4 && dx === 0 ? C.GLOW : C.SK4;
      }
    }
  }
  // cottage window spill on the wall below the sill, antenna light
  if (frac(27 * t / LOOP_S + 0.3) < 0.16) pset(24 - cx, 32 - cy + IY0, C.RED, L.HOUSE);
  else pset(24 - cx, 32 - cy + IY0, C.OX, L.HOUSE);
}
function drawWetSpots(cx, cy) {
  for (let i = 0; i < MAXWS; i++) {
    const l = wsLife[i];
    if (l <= 0) continue;
    const u = l / WS_LIFE, x = wsX[i] - cx, y = wsY[i] - cy + IY0;
    const w = u > 0.55 ? 2 : u > 0.25 ? 1 : 0;
    for (let dx = -w; dx <= w; dx++) {
      if (u < 0.25 && bay(x + dx, y) > u * 3) continue;
      premap(x + dx, y, SHD, 1 << L.GROUND);
      if (u > 0.7 && dx !== -w && dx !== w) premap(x + dx, y + 1, SHD, 1 << L.GROUND);
    }
    if (u > 0.3) pset(x + (u > 0.6 ? 1 : 0), y, u > 0.6 ? C.GLOW : C.SK4, L.GROUND);   // amber glint
  }
}
// venetian-blind light: hard amber slats thrown across the path, planters, wall and figures
const SLAT_U0 = 60, SLAT_P = 17, SLAT_W = 8, SLAT_N = 5, SLAT_SKEW = 0.9;
function drawSlats(cx, cy) {
  const ySt = Math.max(IY0, 103 - cy + IY0), yEn = Math.min(IY1 - 1, 147 - cy + IY0);
  const xSt = Math.max(0, SLAT_U0 - cx - 10), xEn = Math.min(W - 1, SLAT_U0 + SLAT_P * SLAT_N + 45 - cx);
  for (let y = ySt; y <= yEn; y++) {
    const wy = y - IY0 + cy;
    for (let x = xSt; x <= xEn; x++) {
      const i = y * W + x;
      if (!(M_LIT & (1 << lid[i])) || lid[i] === L.HOUSE) continue;
      // slat coordinate along the projected blind, inline (no per-pixel call)
      const u = x + cx - SLAT_SKEW * (wy - PATH_TOP) - SLAT_U0;
      if (u < 0 || u >= SLAT_P * SLAT_N) continue;
      const idx = Math.floor(u / SLAT_P), w = u - idx * SLAT_P;
      if (w >= SLAT_W) continue;
      let k = (w < 1 || w >= SLAT_W - 1) ? 0.5 : 1;               // 1px dithered edges
      if (idx === SLAT_N - 1) k *= 0.55;                          // far slat fades
      if (wy < 109) k *= (wy - 102) / 7;                          // top of the beam softens
      if (bay(x, y) < k) fb[i] = LIT[fb[i]];
    }
  }
}
