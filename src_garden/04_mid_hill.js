
// =================================================================== FUSION HEADLAND + BRIDGE (parallax 0.25)
const midL = makeLayer(364, 140, F_MID, L.MID);
const DOME_X = 46, DOME_Y = 76, TOWER_X = [78, 95], TOWER_TOP = 54;
const BR_T1 = 176, BR_T2 = 276, BR_TOP = 64, BR_DECK = 88;
function cableY(x) {
  if (x < BR_T1) return lerp(BR_DECK - 2, BR_TOP + 1, (x - 128) / (BR_T1 - 128)) + 2 * Math.sin(Math.PI * (x - 128) / (BR_T1 - 128));
  if (x > BR_T2) return lerp(BR_TOP + 1, BR_DECK - 2, (x - BR_T2) / 60) + 2 * Math.sin(Math.PI * (x - BR_T2) / 60);
  const u = (x - (BR_T1 + BR_T2) / 2) / ((BR_T2 - BR_T1) / 2);
  return BR_DECK - 3 - (BR_DECK - 4 - BR_TOP) * u * u;
}
function buildMid() {
  const ml = midL;
  // headland mass
  for (let x = 0; x < 140; x++) {
    const cliff = x < 98 ? 0 : Math.pow((x - 98) / 40, 1.4) * 17;
    const top = Math.round(77 + cliff + pnoise(x / 6, 64, 3) * 3 - 1.5);
    for (let y = top; y < 96; y++) {
      let c = C.SK0;
      if (y === top && x > 60) c = bay(x, y) < 0.5 ? C.CITY0 : C.SK0;
      else if (hash(x, y) < 0.1) c = C.CITY0;
      lset(ml, x, y, c);
    }
    if (x > 56 && x % 5 === 0 && x < 132) lset(ml, x, Math.min(94, top + 3 + (x & 1)), C.GLOW);   // shore road lamps
  }
  // low plant buildings with a few warm windows
  const blocks = [[6, 69, 22], [58, 71, 12], [104, 70, 16]];
  for (const b of blocks) {
    lrect(ml, b[0], b[1], b[2], 78 - b[1], C.CITY0);
    for (let x = b[0] + 1; x < b[0] + b[2] - 1; x += 2) if (hash(x, b[1]) < 0.45) lset(ml, x, b[1] + 2, C.SK4);
  }
  // stacks and a gantry crane
  lrect(ml, 20, 57, 2, 13, C.CITY0); lrect(ml, 112, 60, 2, 11, C.CITY0);
  for (let i = 0; i < 16; i++) lset(ml, 124 + (i >> 1), 70 - i, C.CITY0);
  for (let i = 0; i < 10; i++) lset(ml, 130 + i, 62, C.CITY0);
  lrect(ml, 138, 62, 1, 7, C.CITY0);
  // the dome
  for (let y = DOME_Y - 12; y <= DOME_Y; y++) for (let x = DOME_X - 15; x <= DOME_X + 15; x++) {
    const dx = (x - DOME_X) / 15, dy = (y - DOME_Y) / 12;
    if (dx * dx + dy * dy > 1) continue;
    let c = C.CITY0;
    const edge = dx * dx + dy * dy > 0.8;
    if (edge && dx > 0.1 && dy < -0.2) c = bay(x, y) < 0.6 ? C.SK3 : C.CITY1;       // sunset rim
    else if (edge) c = C.CITY1;
    else if (((x - DOME_X + 20) % 5) === 0) c = C.SK0;                                // ribs
    else if (dy < -0.75) c = C.CITY1;
    lset(ml, x, y, c);
  }
  for (let x = DOME_X - 12; x <= DOME_X + 12; x += 2) lset(ml, x, DOME_Y - 2, C.CYAND);  // core slit
  // cooling towers (hyperboloids)
  for (let k = 0; k < 2; k++) {
    const cx = TOWER_X[k];
    for (let y = TOWER_TOP; y <= 77; y++) {
      const u = (y - TOWER_TOP) / (77 - TOWER_TOP), hw = 3.2 + 2.6 * Math.pow(Math.abs(u - 0.35) / 0.65, 1.6) * (u > 0.35 ? 1 : 0.45);
      for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) {
        let c = C.CITY0;
        if (x === Math.round(cx + hw)) c = u < 0.5 ? C.SK3 : C.CITY1;
        if (y === TOWER_TOP) c = C.SK4;                                   // mouth lit by the plume
        lset(ml, x, y, c);
      }
    }
  }
  // suspension bridge: towers, deck, lamps, cables, suspenders
  for (let k = 0; k < 2; k++) {
    const tx = k ? BR_T2 : BR_T1;
    for (let y = BR_TOP; y < 96; y++) { lset(ml, tx - 2, y, C.CITY0); lset(ml, tx + 2, y, C.CITY0); }
    for (let y = BR_TOP; y < 96; y += 7) for (let x = tx - 2; x <= tx + 2; x++) lset(ml, x, y, C.CITY0);
    lset(ml, tx - 1, BR_TOP - 1, C.CITY0); lset(ml, tx + 1, BR_TOP - 1, C.CITY0); lset(ml, tx, BR_TOP - 2, C.CITY0);
    lset(ml, tx + 2, BR_TOP + 3, C.SK3);
  }
  for (let x = 124; x < ml.w; x++) {
    lset(ml, x, BR_DECK, C.SK0); lset(ml, x, BR_DECK + 1, C.INK);
    if (x % 4 === 0) lset(ml, x, BR_DECK - 1, (x % 8) ? C.SK4 : C.GLOW);
    if (x > 128 && x < 336) {
      const cy = Math.round(cableY(x));
      lset(ml, x, cy, C.CITY0);
      if (x % 6 === 0) for (let y = cy + 1; y < BR_DECK - 1; y++) lset(ml, x, y, C.CITY0);
    }
  }
  for (let x = 130; x < ml.w; x += 26) lrect(ml, x, BR_DECK + 2, 1, 3, C.INK);      // approach piers
}
const CYANGLOW = makeMap([0, 17, 1, 17, 2, 17, 3, 17, 11, 17, 12, 17, 13, 17, 14, 17, 17, 16, 4, 17]);
function drawMidDynamic(f, camX, camY) {
  const t = f / FPS;
  const ox = Math.round(camX * F_MID), oy = Math.round(camY * F_MID) - IY0;
  // fusion core: slow cyan pulse (9 cycles per loop)
  const pulse = 0.55 + 0.45 * osc(9, t, 0);
  const cx = DOME_X - ox, cy = DOME_Y - 2 - oy;
  for (let y = cy - 9; y <= cy + 6; y++) for (let x = cx - 26; x <= cx + 26; x++) {
    if (x < 0 || x >= W || y < IY0 || y >= IY1) continue;
    const dx = (x - cx) / 26, dy = (y - cy) / (y < cy ? 9 : 6), d = dx * dx + dy * dy;
    if (d >= 1) continue;
    const i = y * W + x;
    if (lid[i] !== L.MID && lid[i] !== L.BAY && lid[i] !== L.FAR && lid[i] !== L.SKY) continue;
    if (bay(x, y) < (1 - d) * (1 - d) * 0.5 * pulse) fb[i] = CYANGLOW[fb[i]];
  }
  for (let x = cx - 12; x <= cx + 12; x += 2) if (pulse > 0.35) pset(x, cy, pulse > 0.8 ? C.CYAN : C.CYAND, L.MID);
  if (pulse > 0.7) { pset(cx - 1, cy, C.CYAN, L.MID); pset(cx + 1, cy, C.CYAN, L.MID); }
  // stack beacons
  if (frac(27 * t / LOOP_S) < 0.25) { pset(20 - ox, 56 - oy, C.RED, L.MID); pset(112 - ox, 59 - oy, C.RED, L.MID); }
  if (frac(27 * t / LOOP_S + 0.5) < 0.25) { pset(BR_T1 - ox, BR_TOP - 3 - oy, C.RED, L.MID); pset(BR_T2 - ox, BR_TOP - 3 - oy, C.RED, L.MID); }
  // traffic crossing the bridge (paired lights)
  for (let c = 0; c < 4; c++) {
    const span = 240, dir = c & 1 ? -1 : 1;
    let x = (hash(c, 55) * span + dir * span * 2 * t / LOOP_S) % span; if (x < 0) x += span;
    const sx = 124 + Math.round(x) - ox, sy = BR_DECK - oy;
    const col = dir > 0 ? C.HOT : C.RED;
    pset(sx, sy, col, L.MID); pset(sx + 1, sy, col, L.MID);
  }
}

// =================================================================== NEAR HILLSIDE (parallax 0.5)
const hillL = makeLayer(404, 158, F_HILL, L.HILL);
const hillTop = new Int16Array(404);
const TREES = [];          // x, baseY, height, width, kind (0 cypress, 1 pine), phase
const TREE_L = [], TREE_R = [];
const HILL_DROP = 8;       // crest sits low enough for the bay to show through the railing
const NEON_X = 322, NEON_Y = 94 + HILL_DROP;
function buildHill() {
  const hl = hillL;
  for (let x = 0; x < hl.w; x++) {
    const top = Math.round(100 + HILL_DROP + x * 0.045 + (pnoise(x / 11, 64, 7) - 0.5) * 6 + (pnoise(x / 4, 128, 8) - 0.5) * 2);
    hillTop[x] = top;
    for (let y = top; y < hl.h; y++) {
      let c = C.F0;
      if (y - top < 3 && bay(x, y) < 0.45 - (y - top) * 0.12) c = C.F1;             // hazier crest
      else if (hash(x, y) < 0.06) c = C.INK;
      lset(hl, x, y, c);
    }
  }
  // terraces stepping down: retaining walls with tiny lamps
  for (let r = 0; r < 3; r++) {
    const yb = 118 + HILL_DROP + r * 9;
    for (let x = 0; x < hl.w; x++) {
      if (hillTop[x] > yb - 2) continue;
      if (((x + r * 37) % 90) > 70) continue;
      lset(hl, x, yb, C.ST0); lset(hl, x, yb + 1, C.INK);
      if (((x + r * 11) % 23) === 0) { lset(hl, x, yb - 1, C.GLOW); lset(hl, x, yb - 2, C.SK4); }
    }
  }
  // road and diner
  const D = HILL_DROP;
  for (let x = 250; x < hl.w; x++) { lset(hl, x, 127 + D + ((x - 250) >> 5), C.ST0); if ((x & 7) === 0) lset(hl, x, 126 + D + ((x - 250) >> 5), C.SK4); }
  lrect(hl, 296, 117 + D, 22, 10, C.TRIM);
  for (let x = 296; x < 318; x++) { lset(hl, x, 116 + D, C.S1); lset(hl, x, 119 + D, C.S1); }
  for (let x = 298; x < 316; x += 2) { lset(hl, x, 121 + D, C.GLOW); lset(hl, x, 122 + D, C.SK4); }
  lset(hl, 317, 116 + D, C.SK3);
  lrect(hl, NEON_X, NEON_Y + 5, 1, 22, C.INK);
  // trees along the crest
  const spots = [[6, 0, 26, 4], [14, 0, 20, 3], [30, 1, 9, 13], [52, 0, 24, 4], [60, 0, 17, 3], [84, 1, 8, 12],
    [118, 0, 28, 5], [126, 0, 22, 4], [150, 1, 10, 15], [160, 0, 20, 3], [212, 0, 25, 4], [228, 1, 9, 13],
    [256, 0, 27, 5], [264, 0, 21, 4], [285, 0, 16, 3], [340, 1, 10, 14], [362, 0, 26, 4], [372, 0, 20, 3], [392, 1, 8, 12]];
  for (const s of spots) TREES.push([s[0], hillTop[Math.min(hl.w - 1, s[0])] + 3, s[2], s[3], s[1], hash(s[0], 4)]);
  // precomputed integer row spans (left offset, right offset) per tree row: no float math per frame
  for (let t = 0; t < TREES.length; t++) {
    const tr = TREES[t], h = tr[2], w = tr[3];
    const L0 = new Int8Array(h + 4), R0 = new Int8Array(h + 4);
    if (tr[4] === 0) for (let k = 0; k < h; k++) {
      const u = k / h, hw = Math.max(0.5, (w / 2) * Math.sin(Math.PI * Math.min(1, (u + 0.08) * 0.95)) * (u < 0.3 ? 0.8 + u : 1.1 - u * 0.4));
      L0[k] = Math.round(-hw); R0[k] = Math.round(hw);
    }
    else for (let r = 0; r < 4; r++) { const hw = Math.round((w / 2) * (r === 0 ? 0.7 : r === 3 ? 0.8 : 1)); L0[r] = -hw; R0[r] = hw; }
    TREE_L.push(L0); TREE_R.push(R0);
  }
}
// neon atom emblem: red ring, cyan orbits (offsets from centre)
const NEON_RED = [], NEON_CYAN = [];
(function () {
  for (let a = 0; a < 40; a++) {
    const x = Math.round(3.6 * Math.cos(a / 40 * TAU)), y = Math.round(3.6 * Math.sin(a / 40 * TAU));
    if (!NEON_RED.some(p => p[0] === x && p[1] === y)) NEON_RED.push([x, y]);
  }
  for (let o = 0; o < 3; o++) for (let a = 0; a < 32; a++) {
    const u = 2.6 * Math.cos(a / 32 * TAU), v = 0.9 * Math.sin(a / 32 * TAU), r = o * Math.PI / 3;
    const x = Math.round(u * Math.cos(r) - v * Math.sin(r)), y = Math.round(u * Math.sin(r) + v * Math.cos(r));
    if (!NEON_CYAN.some(p => p[0] === x && p[1] === y) && (x || y)) NEON_CYAN.push([x, y]);
  }
})();
// flicker-stutter: mostly on, with short stutter bursts at a few loop-locked moments
function neonState(f) {
  const t = f / FPS;
  const g = (f / 3) | 0;                        // 20 Hz flicker grid (1080 steps per loop)
  const burst = Math.floor(t / 4.5);            // 12 windows per loop
  if (hash(burst, 71) < 0.5) {
    const s = g - Math.floor((burst * 4.5 + hash(burst, 72) * 3) * 20);
    if (s >= 0 && s < 10) return (0x2d5 >> s) & 1;   // on-off stutter pattern
  }
  return 1;
}
function drawHillDynamic(f, camX, camY) {
  const t = f / FPS;
  const ox = Math.round(camX * F_HILL), oy = Math.round(camY * F_HILL) - IY0;
  // trees with a 1px breeze sway at their tops (row spans precomputed as ints)
  for (let i = 0; i < TREES.length; i++) {
    const tr = TREES[i], sx = tr[0] - ox, by = tr[1] - oy, h = tr[2];
    if (sx < -20 || sx > W + 20) continue;
    const sway = osc(6, t, tr[5]) > 0.25 ? 1 : 0, Lr = TREE_L[i], Rr = TREE_R[i];
    if (tr[4] === 0) {                                     // cypress flame
      const swayFrom = (h * 0.55) | 0;
      for (let k = 0; k < h; k++) {
        const sw = k > swayFrom ? sway : 0, y = by - k, xr = sx + Rr[k];
        for (let x = sx + Lr[k]; x <= xr; x++) pset(x + sw, y, x === xr && bay(x, y) < 0.6 ? C.F1 : C.F0, L.HILL);
      }
    } else {                                               // umbrella pine
      for (let k = 0; k < h - 3; k++) pset(sx, by - k, C.F0, L.HILL);
      for (let r = 0; r < 4; r++) {
        const y = by - h - 1 + r, sw = r < 2 ? sway : 0;
        for (let x = sx + Lr[r]; x <= sx + Rr[r]; x++) pset(x + sw, y, r === 0 && bay(x, y) < 0.5 ? C.F1 : C.F0, L.HILL);
      }
    }
  }
  // diner atom sign
  const on = neonState(f), nx = NEON_X - ox, ny = NEON_Y - oy;
  if (on) {
    for (let y = ny - 8; y <= ny + 8; y++) for (let x = nx - 8; x <= nx + 8; x++) {
      if (x < 0 || x >= W || y < IY0 || y >= IY1) continue;
      const d = ((x - nx) * (x - nx) + (y - ny) * (y - ny)) / 64;
      if (d < 1 && bay(x, y) < (1 - d) * (1 - d) * 0.3) fb[y * W + x] = CYANGLOW[fb[y * W + x]];
    }
  }
  for (let i = 0; i < NEON_RED.length; i++) pset(nx + NEON_RED[i][0], ny + NEON_RED[i][1], on ? C.RED : C.OX, L.HILL);
  for (let i = 0; i < NEON_CYAN.length; i++) pset(nx + NEON_CYAN[i][0], ny + NEON_CYAN[i][1], on ? C.CYAN : C.CYAND, L.HILL);
  pset(nx, ny, on ? C.HOT : C.CYAND, L.HILL);
}
// atmospheric haze step between the bay/headland and the hill crest
function drawHillHaze(camX, camY) {
  const ox = Math.round(camX * F_HILL), oy = Math.round(camY * F_HILL) - IY0;
  for (let x = 0; x < W; x++) {
    const hx = x + ox;
    if (hx < 0 || hx >= hillL.w) continue;
    const top = hillTop[hx] - oy;
    for (let k = 1; k <= 7; k++) {
      const y = top - k;
      if (y < IY0 || y >= IY1) continue;
      const i = y * W + x, l = lid[i];
      if (l !== L.BAY && l !== L.MID && l !== L.FAR) continue;
      if (bay(x, y) < 0.42 - k * 0.055) fb[i] = BEAM[fb[i]];
    }
  }
}
