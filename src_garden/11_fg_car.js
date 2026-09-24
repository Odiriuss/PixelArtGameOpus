
// =================================================================== HERO AIRCAR (parallax 0.7, final SETTLE only)
const CAR_W = 36, CAR_H = 14;
const carSpr = new Uint8Array(CAR_W * CAR_H).fill(T);
function cset(x, y, c) { if (x >= 0 && y >= 0 && x < CAR_W && y < CAR_H) carSpr[y * CAR_W + x] = c; }
function buildCar() {
  // body: long black finned sedan, nose to the right
  for (let x = 3; x <= 32; x++) for (let y = 4; y <= 8; y++) cset(x, y, y === 4 ? C.S0 : C.BLK);
  for (let y = 5; y <= 8; y++) cset(33, y, C.BLK);
  cset(34, 6, C.BLK); cset(34, 7, C.S2);
  for (let x = 1; x <= 7; x++) for (let y = 1 + Math.max(0, x - 2); y <= 8; y++) cset(x, y, C.BLK);   // tail fin
  for (let x = 2; x <= 6; x++) cset(x, Math.max(1, x - 1), C.S0);
  cset(1, 2, C.RED); cset(1, 3, C.RED); cset(1, 4, C.OX);                                         // tail lights
  // cabin greenhouse with warm interior glint and sunset on the roof
  for (let x = 12; x <= 25; x++) for (let y = 1; y <= 3; y++) {
    if (y === 1 && (x < 14 || x > 23)) continue;
    let c = C.BLK;
    if (y === 1) c = x > 18 ? C.SK3 : C.S0;
    else if (x !== 13 && x !== 19 && x !== 24) c = y === 2 ? C.SK1 : C.SK0;
    cset(x, y, c);
  }
  cset(16, 3, C.SK4); cset(21, 2, C.SK2);
  // chrome spear along the flank, bumpers, headlight
  for (let x = 5; x <= 31; x++) cset(x, 5, x > 26 ? C.S3 : C.S1);
  cset(33, 5, C.HOT); cset(32, 8, C.S2); cset(33, 8, C.S2); cset(2, 8, C.S1);
  // round chrome turbine pods (near side), far-side pods peeking behind
  const pods = [8, 27];
  for (let k = 0; k < 2; k++) {
    const pc = pods[k];
    for (let y = 6; y <= 12; y++) for (let x = pc - 3; x <= pc + 3; x++) {
      const d = Math.hypot(x - pc, y - 9.2);
      if (d > 3.1) continue;
      cset(x, y, d < 1.3 ? C.INK : d < 2.2 ? C.S0 : ((x > pc && y < 9) ? C.S3 : C.S1));
    }
    cset(pc - 4, 7, C.S0);
  }
}
const car = { on: 0, sx: 0, sy: 0 };
function carState(f, camX, camY) {
  const t = f / FPS;
  car.on = 0;
  if (t < AIRCAR_T0 || t > AIRCAR_T1) return;
  const u = (t - AIRCAR_T0) / (AIRCAR_T1 - AIRCAR_T0);
  car.on = 1;
  car.sx = Math.round(lerp(-44, 336, u) - camX * F_CAR + 160 * F_CAR);
  car.sy = Math.round(lerp(28, 60, smooth(u)) - camY * F_CAR + 8 * F_CAR) + IY0;
}
function drawCar(tick, camX, camY) {
  const t = tick / FPS;
  if (!car.on) return;
  const x0 = car.sx, y0 = car.sy;
  // headlight cone: dithered, fanning forward and slightly down
  for (let d = 1; d < 52; d++) {
    const cxl = x0 + 34 + d, cyl = y0 + 5 + d * 0.24, hw = 0.6 + d * 0.21;
    for (let y = Math.floor(cyl - hw); y <= Math.ceil(cyl + hw); y++) {
      const e = 1 - Math.abs(y - cyl) / (hw + 0.5);
      if (e <= 0) continue;
      const k = (1 - d / 52) * Math.min(1, e * 1.7);
      if (bay(cxl, y) < k * 0.8) premap(cxl, y, BEAM, M_SKYISH | (1 << L.FAR) | (1 << L.MID));
      if (d < 18 && bay(cxl + 1, y) < k * 0.6) premap(cxl, y, LIT, M_ALL);
    }
  }
  // warm turbine glow beneath the pods
  for (let k = 0; k < 2; k++) {
    const px = x0 + (k ? 27 : 8);
    for (let y = y0 + 12; y < y0 + 18; y++) for (let x = px - 3; x <= px + 3; x++) {
      const dd = (Math.abs(x - px) / 3.5) + (y - y0 - 12) / 6;
      if (dd < 1 && bay(x + tick, y) < (1 - dd) * 0.9) premap(x, y, LIT, M_ALL);
    }
  }
  for (let y = 0; y < CAR_H; y++) for (let x = 0; x < CAR_W; x++) {
    const c = carSpr[y * CAR_W + x];
    if (c !== T) pset(x0 + x, y0 + y, c, L.CAR);
  }
  const flick = (tick >> 2) & 1;
  pset(x0 + 7 + flick, y0 + 12, C.GLOW, L.CAR); pset(x0 + 26 + flick, y0 + 12, C.GLOW, L.CAR);
  pset(x0 + 8, y0 + 12, C.HOT, L.CAR); pset(x0 + 27, y0 + 12, C.HOT, L.CAR);
  // underglow: briefly lifts garden highlights beneath its track (palette remap)
  const u = (t - AIRCAR_T0) / (AIRCAR_T1 - AIRCAR_T0), str = Math.sin(Math.PI * u) * 0.55;
  const gx = x0 + 18;
  for (let y = IY0 + 60; y < IY1; y++) for (let x = Math.max(0, gx - 60); x <= Math.min(W - 1, gx + 60); x++) {
    const i = y * W + x, l = lid[i];
    if (l < L.WALL || l > L.HER) continue;
    if (bay(x, y) < str * (1 - Math.abs(x - gx) / 60)) fb[i] = UPG[fb[i]];
  }
}

// =================================================================== FOREGROUND (parallax 1.4, out of focus)
const fgL = makeLayer(544, 158, F_FG, L.FG);
const BLADES = [];          // x, height, lean
const FG_GROUND = 153;
function fgBlob(x0, y0, x1, y1, core) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) lset(fgL, x, y, core ? C.BLK : C.INK);
}
function buildForeground() {
  // telephone poles with crossbars and glass insulators
  const poles = [[-4, 1], [536, -1]];
  for (let p = 0; p < 2; p++) {
    const px = poles[p][0], dir = poles[p][1];
    for (let y = 16; y < 158; y++) { lset(fgL, px - 1, y, C.INK); for (let x = px; x < px + 5; x++) lset(fgL, x, y, C.BLK); lset(fgL, px + 5, y, C.INK); }
    const cx0 = dir > 0 ? px : px - 30, cx1 = dir > 0 ? px + 36 : px + 6;
    fgBlob(cx0 - 1, 23, cx1 + 1, 26, false); fgBlob(cx0, 24, cx1, 25, true);
    for (let k = 0; k < 3; k++) {
      const ix = cx0 + 3 + k * 9;
      fgBlob(ix - 1, 19, ix + 2, 23, false); fgBlob(ix, 20, ix + 1, 22, true);
      lset(fgL, ix + 1, 20, C.CYAND);                                          // aqua glass glint
    }
  }
  // sagging wires between the insulators (thin, 1px)
  for (let k = 0; k < 3; k++) {
    const xa = -4 + 3 + k * 9 + 1, xb = 536 - 30 + 3 + k * 9 + 1;
    for (let x = xa; x <= xb; x++) {
      const u = (x - xa) / (xb - xa), y = Math.round(20 + k * 2 + (11 + k * 3) * 4 * u * (1 - u));
      lset(fgL, x, y, C.BLK);
    }
  }
  // leafy branch hanging into a top corner: a curved twig carrying soft, irregular leaf masses
  for (let i = 0; i <= 80; i++) {
    const x = 222 + i, y = Math.round(-2 + i * 0.22 + 4 * Math.sin(i / 16));
    fgBlob(x, y, x, y + (i < 40 ? 1 : 0), true);
  }
  for (let c = 0; c < 7; c++) {
    const bx = 228 + c * 11 + Math.round(hash(c, 81) * 4), by = Math.round(-2 + (bx - 222) * 0.22 + 4 * Math.sin((bx - 222) / 16)) + 4 + Math.round(hash(c, 82) * 5);
    for (let k = 0; k < 6; k++) {
      const ex = bx + Math.round((hash(c, 90 + k) - 0.5) * 12), ey = by + Math.round(hash(c, 100 + k) * 8) - 2;
      const rx = 2.2 + hash(c, 110 + k) * 2.4, ry = 1.8 + hash(c, 120 + k) * 1.8;
      for (let yy = Math.floor(ey - ry - 1); yy <= Math.ceil(ey + ry + 1); yy++) for (let xx = Math.floor(ex - rx - 1); xx <= Math.ceil(ex + rx + 1); xx++) {
        const d = Math.hypot((xx - ex) / rx, (yy - ey) / ry);
        if (d < 1) lset(fgL, xx, yy, C.BLK);
        else if (d < 1.35 && lget(fgL, xx, yy) === T) lset(fgL, xx, yy, C.INK);   // defocus halo
      }
    }
  }
  // wrought-iron gate posts with spear finials at the bottom edge
  const gates = [64, 500];
  for (let g = 0; g < 2; g++) {
    const gx = gates[g];
    for (let y = 130; y < 158; y++) { lset(fgL, gx - 1, y, C.INK); lset(fgL, gx, y, C.BLK); lset(fgL, gx + 1, y, C.BLK); lset(fgL, gx + 2, y, C.INK); }
    for (let y = 122; y < 130; y++) {
      const hw = y < 126 ? (y - 122) * 0.7 : (130 - y) * 0.9;
      for (let x = Math.round(gx + 0.5 - hw); x <= Math.round(gx + 0.5 + hw); x++) lset(fgL, x, y, C.BLK);
    }
    for (let a = 0; a < 12; a++) lset(fgL, gx + 2 + Math.round(3 * Math.cos(a / 12 * TAU)), 136 + Math.round(3 * Math.sin(a / 12 * TAU)), C.BLK);
  }
  // ground strip under the grass
  for (let y = FG_GROUND; y < 158; y++) for (let x = 0; x < 544; x++) lset(fgL, x, y, y === FG_GROUND ? C.INK : C.BLK);
  // grass blades (drawn per frame to sway)
  for (let x = 0; x < 544; x += 1) {
    if (hash(x, 61) < 0.45) continue;
    const clump = pnoise(x / 13, 64, 62);
    const h = Math.round(2 + clump * 5 + hash(x, 63) * 3 + (clump > 0.8 ? 6 : 0));
    BLADES.push([x, h, (hash(x, 64) - 0.5) * 0.5]);
  }
}
function drawForeground(f, camX, camY) {
  const t = f / FPS;
  const ox = Math.round(camX * F_FG), oy = Math.round(camY * F_FG);
  blit(fgL, ox, oy);
  const wind = osc(12, t, 0.1) * 0.6 + osc(30, t, 0.5) * 0.3;
  for (let i = 0; i < BLADES.length; i++) {
    const b = BLADES[i], sx0 = b[0] - ox;
    if (sx0 < -4 || sx0 > W + 4) continue;
    const h = b[1];
    for (let k = 0; k < h; k++) {
      const u = k / h, x = Math.round(sx0 + (b[2] + wind) * u * u * 3), y = FG_GROUND - k - oy + IY0;
      pset(x, y, u > 0.8 ? C.INK : C.BLK, L.FG);
    }
  }
}
