
// =================================================================== PARTICLES (one pooled, allocation-free system)
const PN = 300;
const pX = new Float32Array(PN), pY = new Float32Array(PN), pVX = new Float32Array(PN), pVY = new Float32Array(PN);
const pAge = new Float32Array(PN), pLife = new Float32Array(PN), pLand = new Float32Array(PN), pAux = new Float32Array(PN);
const pKind = new Uint8Array(PN), pFlag = new Uint8Array(PN);
const pFree = new Int16Array(PN);
let pFreeN = 0;
const P_FREE = 0, P_DROP = 1, P_SPLASH = 2, P_DRIP = 3, P_STEAM = 10, P_MOTH = 11, P_FLY = 12;
const GRAV = 170;                       // px/s^2 (28px woman ~ 1.65 m)
const N_STEAM = 24, N_MOTH = 8, N_FLY = 10;
const MOTH_LAMP = [0, 0, 0, 1, 1, 1, 2, 2];
const FLY_X = [70, 118, 164, 190, 238, 262, 312, 352, 398, 446], FLY_Y = [141, 146, 140, 147, 143, 139, 146, 141, 144, 139];
const rngState = new Uint32Array(1);       // typed storage: a 32-bit state never boxes
function rnd() { rngState[0] = Math.imul(rngState[0], 1664525) + 1013904223; return rngState[0] / 4294967296; }

function particlesReset() {
  rngState[0] = 12345;
  pFreeN = 0;
  for (let i = PN - 1; i >= 0; i--) { pKind[i] = P_FREE; pFree[pFreeN++] = i; }
  // ambient slots are claimed permanently and driven by loop phase
  for (let k = 0; k < N_STEAM; k++) { const i = pFree[--pFreeN]; pKind[i] = P_STEAM; pAux[i] = k; }
  for (let k = 0; k < N_MOTH; k++) { const i = pFree[--pFreeN]; pKind[i] = P_MOTH; pAux[i] = k; }
  for (let k = 0; k < N_FLY; k++) { const i = pFree[--pFreeN]; pKind[i] = P_FLY; pAux[i] = k; }
}
function spawn(kind, x, y, vx, vy, life, land, aux) {
  if (pFreeN === 0) return -1;
  const i = pFree[--pFreeN];
  pKind[i] = kind; pX[i] = x; pY[i] = y; pVX[i] = vx; pVY[i] = vy;
  pAge[i] = 0; pLife[i] = life; pLand[i] = land; pAux[i] = aux; pFlag[i] = 0;
  return i;
}
function kill(i) { pKind[i] = P_FREE; pFree[pFreeN++] = i; }

// water from the spout rose: aimed at a point that sweeps across the bed
function emitPour(sx, sy, pourX, bed) {
  const bx = BEDS[bed].x, s = slope(bx + 14);
  for (let k = 0; k < 1; k++) {
    const spill = rnd() < 0.07;
    const tx = spill ? bx + BED_W - 3 + rnd() * 4 : pourX + (rnd() - 0.5) * 3.5;
    const ty = spill ? BED_BASE - s + 2 + rnd() * 3 : BED_SOIL - s + rnd() * 1.4;
    const T = 0.3 + rnd() * 0.07;
    const vx = (tx - sx) / T + (rnd() - 0.5) * 3, vy = (ty - sy - 0.5 * GRAV * T * T) / T;
    spawn(P_DROP, sx + (rnd() - 0.5), sy, vx, vy, T + 0.25, ty, spill ? -1 : bed);
  }
}
function emitDrip(sx, sy, vx, feetY) {
  spawn(P_DRIP, sx, sy, vx * 0.6, 4, 1.2, feetY + 1 + Math.floor(rnd() * 2), -1);
}
function splashAt(x, y, n, onPath) {
  for (let k = 0; k < n; k++) spawn(P_SPLASH, x, y - 0.5, (rnd() - 0.5) * 34, -18 - rnd() * 26, 0.2 + rnd() * 0.12, y + (onPath ? 0 : 0.5), onPath ? 1 : 0);
}
function soilHit(bed, x) {
  const col = Math.round(x) - BEDS[bed].x;
  if (col < 1 || col >= BED_W - 1) return;
  for (let d = -1; d <= 1; d++) {
    const c = col + d;
    if (c >= 1 && c < BED_W - 1) bedWet[bed * BED_W + c] = Math.min(1, bedWet[bed * BED_W + c] + (d === 0 ? 0.07 : 0.035));
  }
  for (let b = 0; b < bloomN; b++) if (bloomBed[b] === bed && Math.abs(bloomX[b] - x) < 2.5 && bloomPerk[b] <= -0.5) bloomPerk[b] = 0.25;
}
function updateParticles() {
  for (let i = 0; i < PN; i++) {
    const k = pKind[i];
    if (k === P_FREE || k >= P_STEAM) continue;
    pAge[i] += DT;
    pVY[i] += GRAV * DT;
    pX[i] += pVX[i] * DT; pY[i] += pVY[i] * DT;
    if (k === P_DROP || k === P_DRIP) {
      if (pVY[i] > 0 && pY[i] >= pLand[i]) {
        const bed = pAux[i], onPath = bed < 0;
        if (!onPath) soilHit(bed, pX[i]); else addWetSpot(Math.round(pX[i]), Math.round(pLand[i]));
        splashAt(pX[i], pLand[i], 2 + (rnd() < 0.5 ? 1 : 0), onPath);
        kill(i); continue;
      }
    } else if (k === P_SPLASH) {
      if (pVY[i] > 0 && pY[i] >= pLand[i]) {
        if (pAux[i] > 0 && rnd() < 0.5) addWetSpot(Math.round(pX[i]), Math.round(pLand[i]));
        kill(i); continue;
      }
    }
    if (pAge[i] >= pLife[i]) kill(i);
  }
}
function waterColour(i) {
  const a = pAge[i], k = pKind[i];
  if (k === P_SPLASH) return a < 0.06 ? C.WHITE : a < 0.14 ? C.WL : C.WM;
  return a < 0.09 ? C.WHITE : a < 0.2 ? C.WL : C.WM;
}
function drawWater(cx, cy) {
  for (let i = 0; i < PN; i++) {
    const k = pKind[i];
    if (k === P_FREE || k >= P_STEAM) continue;
    const x = Math.round(pX[i]) - cx, y = Math.round(pY[i]) - cy + IY0;
    if (x < 0 || x >= W || y < IY0 || y >= IY1) continue;
    const bg = fb[y * W + x];
    let c = waterColour(i);
    // backlit sparkle: one white frame when a drop crosses the sun, a lamp or window light
    if (!pFlag[i] && (bg === C.GLOW || bg === C.HOT || bg === C.RIM)) { c = C.WHITE; pFlag[i] = 1; }
    pset(x, y, c, L.WATER);
  }
}
// ---- ambient (phase driven, seamless): steam wisps, moths, fireflies
function drawSteam(f, camX, camY) {
  const t = f / FPS;
  const ox = Math.round(camX * F_MID), oy = Math.round(camY * F_MID) - IY0;
  for (let i = 0; i < PN; i++) {
    if (pKind[i] !== P_STEAM) continue;
    const k = pAux[i], tw = k & 1, p = frac(9 * t / LOOP_S + (k >> 1) / 12);
    const bx = TOWER_X[tw] + p * 18 + 1.8 * Math.sin(TAU * (p * 1.5 + k * 0.13));
    const by = TOWER_TOP - 1 - p * 46;
    const r = 2.2 + p * 6, dens = 0.9 * Math.pow(1 - p, 0.7);
    const col = p < 0.14 ? C.SK4 : p < 0.38 ? C.SK3 : p < 0.7 ? C.SK2 : C.CLOUD;
    const cxs = bx - ox, cys = by - oy, ri = Math.ceil(r);
    for (let y = Math.round(cys) - ri; y <= Math.round(cys) + ri; y++) for (let x = Math.round(cxs) - ri; x <= Math.round(cxs) + ri; x++) {
      if (x < 0 || x >= W || y < IY0 || y >= IY1) continue;
      const ddx = x - cxs, ddy = y - cys, d = Math.sqrt(ddx * ddx + ddy * ddy) / r;
      if (d < 1 && bay(x, y) < dens * (1.15 - d * d)) { const ii = y * W + x; fb[ii] = (d > 0.6 && p < 0.5 && y > cys) ? C.SK4 : col; lid[ii] = L.MID; }
    }
  }
}
function drawMothsAndFlies(tick, cx, cy) {
  const t = tick / FPS;
  const jt = (tick / 4) | 0;
  for (let i = 0; i < PN; i++) {
    const kd = pKind[i];
    if (kd === P_MOTH) {
      const k = pAux[i], lp = LAMPS[MOTH_LAMP[k]], s = lp.porch ? 0 : slope(lp.x);
      const th = TAU * (27 * t / LOOP_S) + k * 1.7;
      const x = lp.x + 6 * Math.sin(3 * th + k) + 3 * Math.sin(7 * th) + (hash(jt, k) - 0.5) * 2.2;
      const y = lp.y - s + 4 * Math.sin(2 * th + k * 0.7) + (hash(jt, k + 50) - 0.5) * 2.2 - 1;
      const sx = Math.round(x) - cx, sy = Math.round(y) - cy + IY0;
      pset(sx, sy, k & 1 ? C.CREAM : C.HAZE, L.WATER);
      if (((tick >> 2) + k) & 1) pset(sx + 1, sy, C.CREAMS, L.WATER);      // wing flutter
    } else if (kd === P_FLY) {
      const k = pAux[i];
      const x = FLY_X[k] + 3 * osc(3, t, k * 0.21), y = FLY_Y[k] - slope(FLY_X[k]) + 2 * osc(4, t, k * 0.37);
      const b = frac(18 * t / LOOP_S + hash(k, 8));
      if (b > 0.2) continue;
      const sx = Math.round(x) - cx, sy = Math.round(y) - cy + IY0;
      pset(sx, sy, b < 0.13 ? C.PALEY : C.MARI, L.WATER);
      if (b < 0.08) { premap(sx - 1, sy, LIT, M_ALL); premap(sx + 1, sy, LIT, M_ALL); premap(sx, sy - 1, LIT, M_ALL); }
    }
  }
}
