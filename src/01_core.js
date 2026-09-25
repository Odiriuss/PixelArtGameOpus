'use strict';

// ------------------------------------------------------------------ constants
let W = 320, H = 180;                  // the buffer being drawn into (the open city switches between its world and its HUD)
let VW = W, VH = H;                    // what the camera shows of the world (the open city zooms it)
const FPS = 60, DT = 1 / FPS;
const TAU = Math.PI * 2;
const T = 255;                         // transparent index in sprite buffers

// ------------------------------------------------------------------ palette (60)
const PAL_HEX = [
  '07060a', '141119',                                   //  0 black, 1 ink
  '1b1a2a', '2c3246', '4b4659', '86615f', 'c2744c',     //  2-6 night navy, slate, violet grey, mauve, amber
  'f2b86e', 'fff0cf',                                   //  7 glow, 8 hot
  '3a3446',                                             //  9 violet dark
  'a7adb6',                                             // 10 haze
  '121822', '273041',                                   // 11-12 deep water / police navy
  '25243a', '36354b',                                   // 13-14 distant towers
  'd9443a',                                             // 15 neon red
  '5ad1d2', '2b7580',                                   // 16-17 fusion cyan
  '121c1d', '213632', '475838', '8d8b4c',               // 18-21 greens
  '2b2a33', '4b4955', '7b6e66',                         // 22-24 stone
  '7d6752', '4d392b', '24180f',                         // 25-27 tan, brown, dark brown
  '333a46', '626c79', '9ca7b1', 'd6dfe3',               // 28-31 steel -> chrome
  'a3303b', 'd8605c', 'e0973a', 'eed27c', '8b7cb4', 'efe6cf', // 32-37 crimson, coral, brass, pale yellow, lavender, cream
  'd8c6a2', '6f7b82', '2a2532',                         // 38-40 stucco lit, stucco shadow, trim
  'f1c7a0', 'c08a69', '744b47',                         // 41-43 skin
  '3b2220', '70402c',                                   // 44-45 hair dark / auburn
  '8a8c99',                                             // 46 cream shadow
  '5c1a2b', '321526',                                   // 47-48 oxblood, plum
  'ffffff', 'a8e6ee', '4a8db0',                         // 49-51 water
  'ffc46b',                                             // 52 rim light
  'a58b6c', '8a5a3a',                                   // 53 coat tan lit, 54 warm wood
  '7fa8ff', '3a55b8',                                   // 55-56 Blue Comet neon
  '9ff0c0',                                             // 57 the lights over the harbour
  '9a6a4f', '5a3a30'                                    // 58-59 deeper skin mid / shadow
];
const C = {
  BLK: 0, INK: 1, NAV: 2, SLT: 3, VIO: 4, MAU: 5, AMB: 6, GLOW: 7, HOT: 8, VDK: 9, HAZE: 10,
  DW: 11, PNV: 12, TW0: 13, TW1: 14, RED: 15, CYAN: 16, CYD: 17,
  G0: 18, G1: 19, G2: 20, G3: 21, ST0: 22, ST1: 23, ST2: 24, TAN: 25, BRN: 26, DBR: 27,
  S0: 28, S1: 29, S2: 30, S3: 31, CRIM: 32, CORAL: 33, BRASS: 34, PALEY: 35, LAV: 36, CREAM: 37,
  STL: 38, STS: 39, TRIM: 40, SKL: 41, SKM: 42, SKS: 43, HAIRD: 44, HAIRL: 45, CRS: 46,
  OX: 47, PLUM: 48, WHITE: 49, WL: 50, WM: 51, RIM: 52, TANL: 53, WOOD: 54, NBL: 55, NBD: 56,
  GRNL: 57, DSM: 58, DSS: 59
};
const NPAL = PAL_HEX.length;

// ------------------------------------------------------------------ light ramps (palette remaps)
function makeMap(pairs) {
  const m = new Uint8Array(256);
  for (let i = 0; i < 256; i++) m[i] = i;
  for (let i = 0; i < pairs.length; i += 2) m[pairs[i]] = pairs[i + 1];
  return m;
}
// warm light: one step brighter and warmer
const LIT = makeMap([
  0, 1, 1, 40, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 8, 9, 5, 10, 31, 11, 12, 12, 23, 13, 14, 14, 4,
  15, 33, 16, 50, 17, 16, 18, 19, 19, 20, 20, 21, 21, 35, 22, 23, 23, 24, 24, 53,
  25, 53, 26, 25, 27, 26, 28, 29, 29, 30, 30, 31, 31, 49, 32, 33, 33, 34, 34, 35, 35, 8, 36, 37,
  37, 8, 38, 37, 39, 38, 40, 4, 41, 8, 42, 41, 43, 42, 44, 45, 45, 54, 46, 37, 47, 32, 48, 47,
  49, 49, 50, 49, 51, 50, 52, 8, 53, 38, 54, 42, 55, 49, 56, 55, 57, 49, 58, 42, 59, 58
]);
// cool shadow: one step darker and cooler
const SHD = makeMap([
  0, 0, 1, 0, 2, 1, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8, 7, 9, 2, 10, 29, 11, 0, 12, 11, 13, 2, 14, 13,
  15, 32, 16, 17, 17, 12, 18, 1, 19, 18, 20, 19, 21, 20, 22, 1, 23, 22, 24, 23,
  25, 26, 26, 27, 27, 0, 28, 2, 29, 28, 30, 29, 31, 30, 32, 47, 33, 32, 34, 6, 35, 34, 36, 4,
  37, 46, 38, 39, 39, 23, 40, 1, 41, 42, 42, 43, 43, 44, 44, 27, 45, 44, 46, 29, 47, 48, 48, 0,
  49, 50, 50, 51, 51, 12, 52, 7, 53, 25, 54, 45, 55, 56, 56, 12, 57, 17, 58, 59, 59, 44
]);
function composeMap(a, b) { const m = new Uint8Array(256); for (let i = 0; i < 256; i++) m[i] = b[a[i]]; return m; }
const LIT2 = composeMap(LIT, LIT), SHD2 = composeMap(SHD, SHD), SHD3 = composeMap(SHD2, SHD);
// neon washes: dark surfaces pick up the colour of nearby tubes
const REDW = makeMap([0, 48, 1, 48, 2, 48, 3, 47, 4, 47, 9, 47, 12, 47, 13, 48, 14, 47, 22, 48, 23, 47, 24, 33, 28, 47,
  29, 32, 30, 33, 26, 47, 27, 48, 40, 48, 39, 32, 44, 47, 45, 32, 54, 32, 25, 33, 53, 33, 46, 33, 31, 33, 37, 33, 38, 33]);
const BLUW = makeMap([0, 2, 1, 2, 2, 56, 3, 56, 4, 51, 9, 56, 12, 56, 13, 56, 14, 51, 22, 12, 23, 56, 24, 51, 28, 56,
  29, 51, 30, 55, 26, 12, 27, 2, 40, 12, 39, 51, 44, 12, 45, 56, 54, 51, 25, 51, 53, 55, 46, 55, 31, 55, 37, 55, 38, 55]);
const CYNW = makeMap([0, 11, 1, 11, 2, 17, 3, 17, 4, 17, 9, 17, 12, 17, 13, 17, 14, 17, 22, 17, 23, 17, 24, 16, 28, 17,
  29, 16, 30, 50, 26, 17, 27, 11, 40, 17, 39, 16, 44, 17, 45, 17, 54, 17, 25, 16, 53, 16, 46, 16, 31, 50, 37, 50, 38, 50]);
const GRNW = makeMap([0, 18, 1, 18, 2, 19, 3, 17, 4, 17, 9, 17, 12, 17, 13, 17, 14, 17, 22, 19, 23, 17, 24, 57, 28, 17,
  29, 57, 30, 57, 31, 49, 26, 19, 27, 18, 40, 19, 39, 57, 37, 57, 38, 57, 5, 57, 6, 57, 7, 57, 8, 49]);
// puddle / glossy reflection: darker, cooler, lights keep their colour
const REFL = makeMap([
  0, 0, 1, 0, 2, 1, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8, 7, 9, 2, 10, 29, 11, 0, 12, 11, 13, 2, 14, 13,
  15, 15, 16, 17, 17, 12, 18, 1, 19, 18, 20, 19, 21, 20, 22, 1, 23, 22, 24, 23, 25, 26, 26, 27, 27, 0,
  28, 2, 29, 28, 30, 29, 31, 30, 32, 47, 33, 32, 34, 34, 35, 34, 36, 4, 37, 46, 38, 39, 39, 23, 40, 1,
  41, 42, 42, 43, 43, 44, 44, 27, 45, 44, 46, 29, 47, 48, 48, 0, 49, 50, 50, 51, 51, 12, 52, 7, 53, 25,
  54, 45, 55, 55, 56, 56, 57, 57, 58, 59, 59, 44
]);
// panel darkening for UI overlays
const DIM = composeMap(SHD2, SHD);

// ------------------------------------------------------------------ math / noise helpers
const BAYER = new Float32Array([0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16));
function bay(x, y) { return BAYER[((y & 3) << 2) | (x & 3)]; }
function hashi(a, b) {
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ 0x5bd1e995;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
  return (h ^ (h >>> 15)) >>> 16;
}
function hash(a, b) { return hashi(a, b) * 1.52587890625e-5; }   // [0,1)
function hash3(a, b, c) { return hash(a + Math.imul(c | 0, 0x9e37), b); }
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
function frac(v) { return v - Math.floor(v); }
// smooth value noise (2D)
function vnoise(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
  const a = hash3(xi, yi, seed), b = hash3(xi + 1, yi, seed), c = hash3(xi, yi + 1, seed), d = hash3(xi + 1, yi + 1, seed);
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
// deterministic RNG for gameplay-level randomness (ambient only)
const rngState = new Uint32Array([0x9e3779b9]);
function rnd() {
  let s = rngState[0];
  s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
  rngState[0] = s;
  return (s >>> 8) / 16777216;
}

// ------------------------------------------------------------------ framebuffer
// sized for the widest world view a page asks for (SCREEN_PIXELS, set before this file), else for the screen
const SCR_N = typeof SCREEN_PIXELS === 'number' ? SCREEN_PIXELS : W * H;
let fb = new Uint8Array(SCR_N);        // palette indices
const zb = new Float32Array(SCR_N);    // depth (x + y of the visible surface; larger = nearer)
const hb = new Uint8Array(SCR_N);      // hotspot id under each pixel (0 = none)
const sm = new Uint8Array(SCR_N);      // 1 where a sprite was drawn this frame (skips reflections)
let REMAP_DOWN = null;                 // set while a HUD is drawn over a world layer of its own: its remaps darken the world too

function pset(x, y, c) { if (x >= 0 && y >= 0 && x < W && y < H) fb[y * W + x] = c; }
function fillRect(x, y, w, h, c) {
  const x0 = Math.max(0, x), x1 = Math.min(W, x + w), y0 = Math.max(0, y), y1 = Math.min(H, y + h);
  for (let yy = y0; yy < y1; yy++) fb.fill(c, yy * W + x0, yy * W + x1);
}
function remapRect(x, y, w, h, map) {
  if (REMAP_DOWN) REMAP_DOWN(x, y, w, h, map, 1);
  const x0 = Math.max(0, x), x1 = Math.min(W, x + w), y0 = Math.max(0, y), y1 = Math.min(H, y + h);
  for (let yy = y0; yy < y1; yy++) for (let i = yy * W + x0, e = yy * W + x1; i < e; i++) fb[i] = map[fb[i]];
}
// dithered remap: applies map where bayer < k (k in 0..1)
function ditherRect(x, y, w, h, map, k) {
  if (REMAP_DOWN) REMAP_DOWN(x, y, w, h, map, k);
  const x0 = Math.max(0, x), x1 = Math.min(W, x + w), y0 = Math.max(0, y), y1 = Math.min(H, y + h);
  for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) if (bay(xx, yy) < k) fb[yy * W + xx] = map[fb[yy * W + xx]];
}
function hline(x0, x1, y, c) { for (let x = x0; x <= x1; x++) pset(x, y, c); }
function vline(x, y0, y1, c) { for (let y = y0; y <= y1; y++) pset(x, y, c); }
function rectOutline(x, y, w, h, c) { hline(x, x + w - 1, y, c); hline(x, x + w - 1, y + h - 1, c); vline(x, y, y + h - 1, c); vline(x + w - 1, y, y + h - 1, c); }
