// =================================================================== LIGHT: THE CLOCK, THE WEATHER, THE SUN, EVERY LAMP IN THE CITY
// One game hour per real minute. Tiles keep the light that reaches each pixel (sun, sky, lamps by id, neon washes),
// so a change of hour or a lamp shot out only needs a cheap relight, never a new bake. The light of the moment is
// quantised into LP, and LP.ver moves on whenever any of it changes.
const CLOCK = { min: 20 * 60 + 30, day: 4, rate: 1 / 60 };          // minutes since midnight; 1/60 a tick: an hour a minute
const DAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
function clockHour() { return CLOCK.min / 60; }
function hhmm(min) { const m = Math.floor(min) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
function clockText() { return DAY_NAMES[CLOCK.day % 7] + ' ' + hhmm(CLOCK.min); }
function clockTick() { CLOCK.min += CLOCK.rate; if (CLOCK.min >= 1440) { CLOCK.min -= 1440; CLOCK.day++; } }
// is the hour h within [a, b) on a 24-hour dial (b may be past midnight)
function hourIn(h, a, b) { return a <= b ? h >= a && h < b : h >= a || h < b; }
// daylight 0..1: dawn 5:30-7:30, dusk 17:30-19:30
function daylight(h) {
  if (h < 5.5 || h >= 19.5) return 0;
  if (h < 7.5) return smooth((h - 5.5) / 2);
  if (h > 17.5) return smooth((19.5 - h) / 2);
  return 1;
}
// ------------------------------------------------------------------ the weather: rain comes and goes by a fixed pattern of the days
const WEATHER = { rain: 0, want: 0, wet: 0.8, cloud: 0.6, next: 0 };
function weatherWant(day, h) {
  const slot = day * 6 + Math.floor(h / 4), r = hash(slot, 91);                    // four-hour spells
  return r < 0.38 ? 0.35 + hash(slot, 92) * 0.65 : 0;
}
function weatherTick() {
  const W_ = WEATHER, h = clockHour();
  W_.want = weatherWant(CLOCK.day, h);
  W_.rain += clamp(W_.want - W_.rain, -0.0015, 0.0015);
  W_.wet = clamp(W_.wet + (W_.rain > 0.1 ? 0.0012 : -0.00018), 0, 1);             // the streets dry slowly
  W_.cloud = clamp(Math.max(W_.rain * 1.4, 0.15 + hash(CLOCK.day, 93) * 0.3), 0, 1);
}
// ------------------------------------------------------------------ lamps
// kinds: street (lamp posts, can be shot), spill (shop windows onto the pavement), neon (tagged: flickers), glow
// (other outdoor lights), int (inside a building: on day and night). Outdoor lamps each come on at their own
// moment of dusk (thr) and go off at dawn.
const LIGHTS = [null];                                        // id -> light
const WASH = [null];                                          // wash index -> a light with a colour map
const LAMP_ON = new Uint8Array(16384).fill(1);
const FAST_ON = new Uint8Array(256).fill(1);                  // neon, per tag, every frame
function registerLight(L, kind) {
  L.id = LIGHTS.length; LIGHTS.push(L);
  L.kind = L.kind || kind;
  if (L.map) { L.wi = WASH.length; WASH.push(L); }
  L.thr = 0.3 + hash(L.id, 77) * 0.45;
  L.broken = false;
  const sx = isoX(L.x, L.y), sy = isoY(L.x, L.y, L.z);
  L.rect = [sx - L.r * 24, sy - L.r * 17 - 4, sx + L.r * 24, sy + L.r * 12 + L.z * 16 + 4];
  if (L.occl === undefined) L.occl = L.kind === 'int';
  return L;
}
function updateLamps() {
  const night = 1 - daylight(clockHour());
  let changed = false;
  for (let i = 1; i < LIGHTS.length; i++) {
    const L = LIGHTS[i], on = L.broken ? 0 : L.kind === 'int' ? 1 : (night >= L.thr ? 1 : 0);
    if (LAMP_ON[i] !== on) { LAMP_ON[i] = on; changed = true; }
  }
  if (changed) LP.ver++;
}
function breakLight(L) { if (L.broken) return; L.broken = true; LAMP_ON[L.id] = 0; LP.ver++; }
// ------------------------------------------------------------------ the light of the moment
// out: pixels in the open air; ins: pixels inside a building. amb and lamp levels are in light steps.
const LP = { ver: 0, key: '', sky: C.BLK, out: { amb: -0.95, sun: 0, lamp: 1, night: 1, lit: 1, day: 0 }, ins: { amb: -0.5, sun: 0, lamp: 1, night: 1, lit: 1, day: 0 } };
const SKY = [[0, C.BLK], [5.2, C.BLK], [6, C.NAV], [6.8, C.VIO], [7.6, C.S1], [17.4, C.S1], [18.4, C.VIO], [19.2, C.NAV], [20, C.BLK]];
function updateLightParams() {
  const h = clockHour(), d = daylight(h), cl = WEATHER.cloud;
  const q = v => Math.round(v * 24) / 24;
  const O = LP.out, I = LP.ins;
  // whole steps by day (a fraction of a step dithers into a screen of dots): shade at the colours as painted, sun one
  // step up; half a sun through heavy cloud, none in real rain
  O.amb = q(lerp(-0.95, 0, d)); O.sun = q(d * (cl < 0.55 ? 1 : cl < 0.8 ? 0.5 : 0)); O.lamp = q(1 - d); O.night = O.lamp;
  // lit windows: most at dusk, fewer after midnight, a few insomniacs till dawn
  O.lit = q(h >= 17 || h < 1 ? 1 : h < 5 ? 0.45 : h < 8 ? 0.6 : 0);
  O.day = q(clamp(d * 1.5, 0, 1));                          // grey all day, sun or cloud; dithered only at dawn and dusk
  I.amb = q(lerp(-0.55, -0.05 - cl * 0.15, d)); I.sun = 0; I.lamp = 1; I.night = O.night; I.lit = 1;
  let sky = C.BLK; for (const [t, c] of SKY) if (h >= t) sky = c;
  if (cl > 0.7 && d > 0.5) sky = C.ST2;
  LP.sky = sky;
  const key = O.amb + '|' + O.sun + '|' + O.lamp + '|' + O.lit + '|' + O.day + '|' + I.amb;
  if (key !== LP.key) { LP.key = key; LP.ver++; }
}
// ------------------------------------------------------------------ the sun: a fixed direction (from the right of the screen, 40 degrees up)
// Shadows are exact: a ray from the pixel toward the sun is tested against the boxes of the buildings it passes.
const SUN = (() => { const v = [0.6 * Math.cos(0.7), -0.8 * Math.cos(0.7), Math.sin(0.7)]; return { x: v[0], y: v[1], z: v[2] }; })();
const SHBOX = [];                                             // [x0, y0, z0, x1, y1, z1, stamp]
const SHG = { cell: 4, x0: 0, y0: 0, gw: 0, gh: 0, cells: null, max: 0, stamp: 0 };
function addShadowBox(x0, y0, z0, x1, y1, z1) { SHBOX.push([x0, y0, z0, x1, y1, z1, 0]); }
function buildShadowGrid() {
  const c = SHG.cell; SHG.x0 = MAP.x0 - 20; SHG.y0 = MAP.y0 - 20;
  SHG.gw = Math.ceil((MAP.x1 - MAP.x0 + 40) / c); SHG.gh = Math.ceil((MAP.y1 - MAP.y0 + 40) / c);
  SHG.cells = Array.from({ length: SHG.gw * SHG.gh }, () => []);
  for (const b of SHBOX) {
    SHG.max = Math.max(SHG.max, b[5]);
    for (let j = Math.max(0, Math.floor((b[1] - SHG.y0) / c)); j <= Math.min(SHG.gh - 1, Math.floor((b[4] - SHG.y0) / c)); j++)
      for (let i = Math.max(0, Math.floor((b[0] - SHG.x0) / c)); i <= Math.min(SHG.gw - 1, Math.floor((b[3] - SHG.x0) / c)); i++) SHG.cells[j * SHG.gw + i].push(b);
  }
}
function rayBox3(ox, oy, oz, len, b) {
  let t0 = 0.03, t1 = len, a, e;
  a = (b[0] - ox) / SUN.x; e = (b[3] - ox) / SUN.x; if (a > e) { const q = a; a = e; e = q; } if (a > t0) t0 = a; if (e < t1) t1 = e; if (t0 > t1) return false;
  a = (b[1] - oy) / SUN.y; e = (b[4] - oy) / SUN.y; if (a > e) { const q = a; a = e; e = q; } if (a > t0) t0 = a; if (e < t1) t1 = e; if (t0 > t1) return false;
  a = (b[2] - oz) / SUN.z; e = (b[5] - oz) / SUN.z; if (a > e) { const q = a; a = e; e = q; } if (a > t0) t0 = a; if (e < t1) t1 = e;
  return t0 <= t1;
}
function sunShadow(x, y, z) {
  if (z >= SHG.max) return false;
  const len = (SHG.max - z) / SUN.z, hx = SUN.x * len, hy = SUN.y * len, c = SHG.cell, st = ++SHG.stamp;
  // walk the grid cells under the ray's shadow on the ground
  let i = Math.floor((x - SHG.x0) / c), j = Math.floor((y - SHG.y0) / c);
  const i1 = Math.floor((x + hx - SHG.x0) / c), j1 = Math.floor((y + hy - SHG.y0) / c), si = hx > 0 ? 1 : -1, sj = hy > 0 ? 1 : -1;
  const tdx = Math.abs(c / hx), tdy = Math.abs(c / hy);
  let tx = hx > 0 ? ((i + 1) * c + SHG.x0 - x) / hx : (x - (i * c + SHG.x0)) / -hx, ty = hy > 0 ? ((j + 1) * c + SHG.y0 - y) / hy : (y - (j * c + SHG.y0)) / -hy;
  for (let n = 0; n < 64; n++) {
    if (i >= 0 && j >= 0 && i < SHG.gw && j < SHG.gh) {
      const cell = SHG.cells[j * SHG.gw + i];
      for (let k = 0; k < cell.length; k++) { const b = cell[k]; if (b[6] === st) continue; b[6] = st; if (rayBox3(x, y, z, len, b)) return true; }
    }
    if (i === i1 && j === j1) break;
    if (tx < ty) { tx += tdx; i += si; } else { ty += tdy; j += sj; }
  }
  return false;
}
// how much of the sun a surface facing this way catches (the +y faces are on the shady side)
const SUN_RESP = new Float32Array([0, 1, 0.95, 0, 0.55, 0]);   // by NRM_*: none, up, x, y, billboard, sky
// by day the blue goes out of the dark colours outdoors: the night's navy asphalt and slate are grey stone in the sun
const DAYGREY = makeMap([C.INK, C.ST0, C.NAV, C.ST0, C.SLT, C.ST1, C.VDK, C.ST1, C.TRIM, C.ST0]);
// windows by day: the glass shows the sky and whatever the street throws at it
const DAYGLASS = makeMap([C.GLOW, C.S1, C.AMB, C.SLT, C.HOT, C.S2, C.WM, C.SLT, C.CYD, C.NAV, C.PALEY, C.S2, C.CREAM, C.S2, C.WHITE, C.S2,
  C.CORAL, C.OX, C.BRASS, C.DBR, C.CRIM, C.PLUM, C.RED, C.OX, C.S3, C.S2, C.NBL, C.NBD, C.CYAN, C.CYD, C.GRNL, C.G1, C.RIM, C.S1, C.WL, C.S2]);
// a lamp globe in daylight
const DAYGLOBE = makeMap([C.HOT, C.CREAM, C.GLOW, C.STL, C.PALEY, C.CREAM, C.AMB, C.CRS, C.WHITE, C.CREAM]);
// panes of an inside window at night: dark, with the city's glow at the bottom
const NIGHTPANE = makeMap([C.S3, C.NAV, C.S2, C.SLT, C.WHITE, C.NAV, C.HAZE, C.INK, C.WL, C.NAV]);
