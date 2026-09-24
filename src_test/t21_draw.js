// =================================================================== DRAWING THINGS THAT MOVE
// Sprites are lit per pixel by the city lights near them (a coarse grid finds those) plus the dynamic lights of
// this frame: headlight cones, muzzle flashes, fires. Dynamic light on the baked city is reconstructed from the
// depth buffer: a pixel's screen position and its x + y give back its world position.
const LGRID = { cell: 8, gw: 0, gh: 0, cells: null };
function buildLightGrid() {
  const c = LGRID.cell; LGRID.gw = Math.ceil((MAP.x1 - MAP.x0) / c) + 1; LGRID.gh = Math.ceil((MAP.y1 - MAP.y0) / c) + 1;
  LGRID.cells = Array.from({ length: LGRID.gw * LGRID.gh }, () => []);
  for (const L of CITY.lights) {
    if (L.slat) continue;
    const r = L.r + 3;
    for (let j = Math.max(0, Math.floor((L.y - r - MAP.y0) / c)); j <= Math.min(LGRID.gh - 1, Math.floor((L.y + r - MAP.y0) / c)); j++)
      for (let i = Math.max(0, Math.floor((L.x - r - MAP.x0) / c)); i <= Math.min(LGRID.gw - 1, Math.floor((L.x + r - MAP.x0) / c)); i++) LGRID.cells[j * LGRID.gw + i].push(L);
  }
}
const DYN = [];                                     // this frame's dynamic lights {x, y, z, r, k, dir?, cos?}
const NEAR = [];
function lightsNear(x, y, rad) {
  NEAR.length = 0;
  const i = Math.floor((x - MAP.x0) / LGRID.cell), j = Math.floor((y - MAP.y0) / LGRID.cell);
  if (i >= 0 && j >= 0 && i < LGRID.gw && j < LGRID.gh) for (const L of LGRID.cells[j * LGRID.gw + i]) if (Math.hypot(L.x - x, L.y - y) < L.r + rad) NEAR.push(L);
  for (const L of DYN) if (!L.cone && Math.hypot(L.x - x, L.y - y) < L.r + rad) NEAR.push(L);
  return NEAR;
}
const SPR_AMB = -0.55;
const TINT = { map: null, v: 0 };
function litAt(list, x, y, z) {
  let warm = CITY.ambient + 0.4; TINT.map = null; TINT.v = 0;
  for (let l = 0; l < list.length; l++) {
    const L = list[l], dx = L.x - x, dy = L.y - y, dz = L.z - z, d2 = dx * dx + dy * dy + dz * dz;
    if (d2 >= L.r * L.r) continue;
    if (L.tag && !lightState[L.tag]) continue;
    const d = Math.sqrt(d2);
    let v = 1 - d / L.r; v = v * v * L.k * clamp(0.5 + (dx + dy) / (d + 1e-6) * 0.5, 0.25, 1);
    if (L.map) { if (v > TINT.v) { TINT.v = v; TINT.map = L.map; } } else warm += v;
  }
  return warm;
}
// the city proxy the shared people renderer lights sprites with
const CITY_ROOM = { lights: [], ambient: SPR_AMB, spriteAmb: 0.35, rb: null };          // people read against the dark street

// ------------------------------------------------------------------ dynamic light on the baked city
function applyDynLights(cx, cy) {
  for (const L of DYN) {
    let x0, y0, x1, y1;
    if (L.cone) {                                   // footprint: apex and the two far edges of the cone
      const a = Math.atan2(L.dy, L.dx), pts = [[L.x, L.y], [L.x + Math.cos(a - L.ang) * L.r, L.y + Math.sin(a - L.ang) * L.r], [L.x + Math.cos(a + L.ang) * L.r, L.y + Math.sin(a + L.ang) * L.r], [L.x + L.dx * L.r, L.y + L.dy * L.r]];
      x0 = 1e9; y0 = 1e9; x1 = -1e9; y1 = -1e9;
      for (const [px, py] of pts) { const sx = isoX(px, py), sy = isoY(px, py, 0); x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy - L.z * 16 - 30); y1 = Math.max(y1, sy + 4); }
    } else {
      const sx = isoX(L.x, L.y), sy = isoY(L.x, L.y, 0); x0 = sx - L.r * 23; x1 = sx + L.r * 23; y0 = sy - L.r * 12 - L.z * 16 - 20; y1 = sy + L.r * 12;
    }
    x0 = Math.max(0, Math.floor(x0 - cx)); x1 = Math.min(W - 1, Math.ceil(x1 - cx)); y0 = Math.max(0, Math.floor(y0 - cy)); y1 = Math.min(H - 1, Math.ceil(y1 - cy));
    const r2 = L.r * L.r, ic = L.cone ? 1 / (1 - L.cos) : 0;
    for (let py = y0; py <= y1; py++) for (let px = x0; px <= x1; px++) {
      const p = py * W + px, d = zb[p];
      if (d < -1e8 || sm[p]) continue;
      const a = (px + cx) / 16, wx = (a + d) * 0.5, wy = (d - a) * 0.5, wz = (d * 8 - (py + cy)) / 16;
      const dx = wx - L.x, dy = wy - L.y, dz = wz - L.z, dd = dx * dx + dy * dy + dz * dz;
      if (dd >= r2) continue;
      const dist = Math.sqrt(dd) + 1e-6;
      let f = 1 - dist / L.r; f = f * f * L.k;
      if (L.cone) { const cs = (dx * L.dx + dy * L.dy) / dist; if (cs < L.cos) continue; f *= Math.min(1, (cs - L.cos) * ic * 2.5); }
      const b = bay(px, py);
      if (b < f) { const m = L.map || LIT; let c = m[fb[p]]; if (b < f - 1 && !L.map) c = LIT[c]; fb[p] = c; }
    }
  }
}

// ------------------------------------------------------------------ vehicles
function vehScreen(V, cx, cy) { return [Math.round(isoX(V.x, V.y)) - cx, Math.round(isoY(V.x, V.y, V.z + (V.bob || 0))) - cy]; }
function drawVehShadow(V, cx, cy) {
  const hl = V.M.hl + 0.15, hw = V.M.hw + 0.12, c = Math.cos(V.a), s = Math.sin(V.a), R = Math.hypot(hl, hw);
  const sx = isoX(V.x, V.y) - cx, sy = isoY(V.x, V.y, V.z) - cy;
  const x0 = Math.max(0, Math.floor(sx - R * 23)), x1 = Math.min(W - 1, Math.ceil(sx + R * 23)), y0 = Math.max(0, Math.floor(sy - R * 12)), y1 = Math.min(H - 1, Math.ceil(sy + R * 12));
  for (let py = y0; py <= y1; py++) for (let px = x0; px <= x1; px++) {
    const a = (px + cx + 0.5) / 16, b = (py + cy + 0.5 + V.z * 16) / 8, wx = (a + b) * 0.5, wy = (b - a) * 0.5;
    const dx = wx - V.x, dy = wy - V.y, u = dx * c + dy * s, v = -dx * s + dy * c;
    const eu = Math.abs(u) / hl, ev = Math.abs(v) / hw; if (eu > 1 || ev > 1) continue;
    const p = py * W + px; if (Math.abs(zb[p] - (wx + wy)) > 0.35 || sm[p]) continue;
    const e = Math.max(eu, ev);
    if (e < 0.8) fb[p] = SHD2[fb[p]]; else if (bay(px, py) < 1 - (e - 0.8) * 4) fb[p] = SHD[fb[p]];
  }
}
function vehEmissive(V, code) {
  if (code === CODE_HEAD) return V.lightsOn && !V.headOut ? C.HOT : -1;
  if (code === CODE_TAIL) return V.braking ? C.RED : V.lightsOn ? C.CRIM : -1;
  if (code === CODE_SIGN) return V.signOn ? C.PALEY : -1;
  return -1;
}
// mirror image in wet asphalt and puddles: a point z above the road lands 2z lower on screen
function reflectVehicle(V, cx, cy) {
  const fr = modelFrame(V.M, V.a), [bx, by] = vehScreen(V, cx, cy), base = V.x + V.y, lut = V.lut;
  for (let k = 0; k < fr.n; k++) {
    const dd = fr.d[k] / 16, wz = (dd * 8 - fr.y[k]) / 16; if (wz < 0.05) continue;
    const x = bx + fr.x[k], y = by + fr.y[k] + Math.round(wz * 32); if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const p = y * W + x, m = mb[p];
    if (!(m & MAT_FLOOR) || !(m & (MAT_PUDDLE | MAT_GLOSS)) || sm[p] || zb[p] > base + dd + 2 * wz + 0.4) continue;
    const code = fr.c[k], em = code >= 240 ? vehEmissive(V, code) : -1, col = em >= 0 ? em : lut[code];
    if (m & MAT_PUDDLE) { if (em >= 0 || wz < 1.2) fb[p] = REFL[col]; }
    else if (em >= 0) { for (let j = 0; j < 12; j++) { const q = p + j * W; if (q >= W * H || !(mb[q] & MAT_GLOSS) || sm[q]) break; if (bay(x, y + j) < 0.75 * (1 - j / 12)) fb[q] = REFL[em]; } }
    // wet asphalt: only the lamps show; the paint would just be noise
  }
}
function drawVehicle(V, cx, cy) {
  const fr = modelFrame(V.M, V.a), [bx, by] = vehScreen(V, cx, cy), base = V.x + V.y, lut = V.lut;
  const list = lightsNear(V.x, V.y, V.M.hl + 1).slice(), sink = V.z < -0.05, dmg = V.dmgLook || 0, flash = V.flash > 0;
  let lastCell = -1, warm = 0, tmap = null, tv = 0;
  for (let k = 0; k < fr.n; k++) {
    const x = bx + fr.x[k], y = by + fr.y[k]; if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const p = y * W + x, dd = fr.d[k] / 16, depth = base + dd;
    if (depth < zb[p] - 0.03) { if (V.xray && ((x + y) & 1)) fb[p] = V.xray; continue; }
    const wz = (dd * 8 - fr.y[k]) / 16;
    if (sink && V.z + wz < WATER_Z) continue;
    const code = fr.c[k];
    let col = code >= 240 ? vehEmissive(V, code) : -1;
    if (col < 0) {
      // paint moves up and down its own ramp (so a white car never shades to water-blue); other materials use the city's light steps
      let dent = 0;
      if (dmg && code >= 200 && code < 220) {                     // dents: dark patches fixed to the body, not to the screen
        const ca = Math.cos(V.a), sa = Math.sin(V.a), wx = (fr.x[k] / 16 + dd) * 0.5, wy = (dd - fr.x[k] / 16) * 0.5, bu = wx * ca + wy * sa, bv = -wx * sa + wy * ca;
        if (hash3(Math.floor(bu / 0.22), Math.floor(bv / 0.22) + 17, Math.floor(wz / 0.2) + V.seed) < dmg) dent = 1;
      }
      // light once per 2x2 world cell of the sprite (the pixels of a panel share a light level)
      const fx = fr.x[k] >> 1, cell = ((fx & 1023) << 10) | ((fr.y[k] >> 1) & 1023);
      if (cell !== lastCell) { lastCell = cell; const wx = (fr.x[k] / 16 + dd) * 0.5, wy = (dd - fr.x[k] / 16) * 0.5; warm = litAt(list, V.x + wx, V.y + wy, V.z + wz); tmap = TINT.map; tv = TINT.v; }
      const b = bay(x, y), st = lightSteps(warm, 0.5 + (b - 0.5) * 0.45);      // a narrow dither band: big panels stay clean
      if (code >= 200 && code < 220) {
        const base = code >= 210 ? 210 : 200, lv = code - base - dent + st;
        if (lv >= 0 && lv <= 4) col = lut[base + lv];
        else if (lv > 4) { col = lut[base + 4]; for (let q = 4; q < lv; q++) col = LIT[col]; }
        else { col = lut[base]; for (let q = lv; q < 0; q++) col = SHD[col]; }
      } else col = quantLight(lut[code], warm, 0.5 + (b - 0.5) * 0.45);
      if (tmap && b < tv) col = tmap[col];
      if (flash && b < 0.5) col = LIT[col];
    }
    fb[p] = col; zb[p] = depth; sm[p] = 1; mb[p] = 0;
  }
}
// the player behind something: a dotted silhouette, drawn after everything else so whatever covers him counts
function drawVehXray(V, cx, cy) {
  const fr = modelFrame(V.M, V.a), [bx, by] = vehScreen(V, cx, cy), base = V.x + V.y;
  for (let k = 0; k < fr.n; k++) {
    const x = bx + fr.x[k], y = by + fr.y[k]; if (x < 0 || y < 0 || x >= W || y >= H || ((x + y) & 1)) continue;
    const p = y * W + x; if (base + fr.d[k] / 16 < zb[p] - 0.05) fb[p] = V.xray;
  }
}
function drawPersonXray(a, cx, cy) {
  const f = actorFrame(a), flip = (a.dir === 1 || a.dir === 3), sx0 = Math.round(isoX(a.x, a.y)) - cx - SPR_AX, sy0 = Math.round(isoY(a.x, a.y, 0)) - cy - SPR_BY, depth = a.x + a.y + 0.15;
  for (let r = 0; r < SPR_H; r++) for (let i = 0; i < SPR_W; i++) {
    const c = f[r * SPR_W + (flip ? SPR_W - 1 - i : i)]; if (c === T) continue;
    const x = sx0 + i, y = sy0 + r; if (x < 0 || y < 0 || x >= W || y >= H || ((x + y) & 1)) continue;
    const p = y * W + x; if (depth < zb[p] - 0.05) fb[p] = a.xray;
  }
}
// ------------------------------------------------------------------ people: the shared renderer, lit by the lights near them
function drawPerson(a, cx, cy) {
  CITY_ROOM.lights = lightsNear(a.x, a.y, 1).slice();
  room = CITY_ROOM;
  drawActor(a, cx, cy);
}
