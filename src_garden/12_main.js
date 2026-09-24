
// =================================================================== SIMULATION
const P = pose(), PQ = pose();
let simFrame = 0, rbDrawX = STEP_X + RB_GAP, rbDrawFace = -1;
const DRIP_CUTOFF = LOOP_S - WS_LIFE - 1.5;          // wet spots from drips must dry before the loop point

function loopReset() {
  particlesReset(); bedWet.fill(0); wsLife.fill(0); bloomPerk.fill(-1); robotReset();
}
function sunScreenX(camX) { return SUN_X - Math.round(camX * F_SKY); }
function poseTick(f) {
  const t = f / FPS, camX = Math.round(camPathX[f]), camY = Math.round(camPathY[f]);
  evalPose(f, PQ);
  herX = Math.round(PQ.x); herFace = PQ.face; herFeet = groundY(herX);
  buildHer(PQ);
  const sdx = sunScreenX(camX) - (herX - camX);
  const sdy = (HZ - Math.round(camY * F_FAR)) - (herFeet - 20 - camY);
  finishHer(herFace, sdx, sdy);
  rbDrawX = Math.round(rb.x); rbDrawFace = rb.face;
  buildRobot(f);
}
function update(f) {
  const t = f / FPS;
  evalPose(f, P);
  const camX = Math.round(camPathX[f]);
  carState(f, camX, Math.round(camPathY[f]));
  robotUpdate(f, car.on ? car.sx + 18 : -999, camX);
  if (f % 6 === 0) poseTick(f);
  // water
  const spx = herX + herFace * herSpout.x, spy = herFeet + herSpout.y;
  if (P.pouring && P.bed >= 0) emitPour(spx, spy, P.pourX, P.bed);
  else if (P.walking && t < DRIP_CUTOFF && rnd() < 0.012) emitDrip(spx, spy, P.speed * herFace, herFeet);
  updateParticles();
  // drying soil, perk-up timers, drying flagstones
  const dry = DT * (t < 40 ? 1 / 22 : 1 / 7);
  for (let i = 0; i < bedWet.length; i++) bedWet[i] = Math.max(0, bedWet[i] - dry);
  for (let i = 0; i < bloomN; i++) if (bloomPerk[i] > -1) bloomPerk[i] -= DT;
  for (let i = 0; i < MAXWS; i++) if (wsLife[i] > 0) wsLife[i] -= DT;
}
function step() {
  simFrame++;
  if (simFrame >= LOOP_F) { simFrame = 0; loopReset(); }
  update(simFrame);
}

// =================================================================== RENDER
const stamp = new Uint32Array(W * H);
let stampId = 1;
function castShadow(buf, bw, bh, x0, y0, feetSy, ground) {
  if (++stampId > 0x3fffffff) { stamp.fill(0); stampId = 1; }
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    if (buf[y * bw + x] === T) continue;
    const h = feetSy - (y0 + y);
    if (h < 0) continue;
    const sx = x0 + x + Math.round(h * SHADOW_SKEW), sy = feetSy + 1 + Math.round(h * 0.45);
    if (sx < 0 || sx >= W || sy < IY0 || sy >= IY1) continue;
    const i = sy * W + sx;
    if (stamp[i] === stampId || lid[i] !== ground) continue;
    stamp[i] = stampId; fb[i] = SHD[fb[i]];
  }
}
function drawHer(cx, cy) {
  const x0 = herX - cx - (herFace > 0 ? AX : SPR_W - 1 - AX), y0 = herFeet - AY - cy + IY0;
  castShadow(sprOut, SPR_W, SPR_H, x0, y0, y0 + AY, L.GROUND);
  for (let y = 0; y < SPR_H; y++) for (let x = 0; x < SPR_W; x++) {
    const c = sprOut[y * SPR_W + x];
    if (c !== T) pset(x0 + x, y0 + y, c, L.HER);
  }
}
const rbOut = new Uint8Array(RB_W * RB_H);
function drawRobot(cx, cy, camX, camY) {
  const f = rbDrawFace;
  for (let y = 0; y < RB_H; y++) for (let x = 0; x < RB_W; x++) rbOut[y * RB_W + x] = rbSpr[y * RB_W + (f > 0 ? x : RB_W - 1 - x)];
  const x0 = rbDrawX - cx - (f > 0 ? RAX : RB_W - 1 - RAX), y0 = groundY(rbDrawX) + RB_LANE - RAY - cy + IY0;
  castShadow(rbOut, RB_W, RB_H, x0, y0, y0 + RAY, L.GROUND);
  const sdx = sunScreenX(camX) > x0 + RAX ? 1 : -1;
  for (let y = 0; y < RB_H; y++) for (let x = 0; x < RB_W; x++) {
    let c = rbOut[y * RB_W + x];
    if (c === T) continue;
    // dim amber rim only on sun-side top edges of dome and body (lower contrast than hers)
    if ((c === C.S1 || c === C.S2) && y < RAY - 3 && y > 0 && rbOut[(y - 1) * RB_W + x] === T) {
      const nx = x + sdx;
      if (nx < 0 || nx >= RB_W || rbOut[y * RB_W + nx] === T || rbOut[(y - 1) * RB_W + nx] === T) c = C.SK4;
    }
    pset(x0 + x, y0 + y, c, L.ROBOT);
  }
}
const vig = new Uint8Array(W * H);
function buildVignette() {
  for (let y = IY0; y < IY1; y++) for (let x = 0; x < W; x++) {
    // corner-weighted falloff: edges stay light, corners darken
    const dx = (x - 159.5) / 160, dy = (y - IY0 - 66.5) / 67, c = (dx * dx + dy * dy) * 0.55 + dx * dx * dy * dy * 1.6;
    let v = 0;
    if (bay(x, y) < smooth((c - 0.42) / 0.7) * 0.95) v = 1;
    if (bay(x + 2, y + 1) < smooth((c - 1.1) / 0.8) * 0.85) v = 2;
    vig[y * W + x] = v;
  }
}
function render(f) {
  const tick = f;
  const camX = Math.round(camPathX[f]), camY = Math.round(camPathY[f]);
  // 1 sky
  blit(skyL, Math.round(camX * F_SKY), Math.round(camY * F_SKY));
  drawClouds(f, camX, camY); drawStars(f, camX, camY); drawSearchlights(f, camX, camY); drawSun(camX, camY, tick);
  // 2 far city + bay
  blit(farL, Math.round(camX * F_FAR), Math.round(camY * F_FAR));
  drawFarDynamic(tick, camX, camY); drawFog(f, camX, camY);
  // 3 fusion headland + bridge
  blit(midL, Math.round(camX * F_MID), Math.round(camY * F_MID));
  drawMidDynamic(f, camX, camY); drawSteam(f, camX, camY);
  // 4 near hillside
  drawHillHaze(camX, camY);
  blit(hillL, Math.round(camX * F_HILL), Math.round(camY * F_HILL));
  drawHillDynamic(f, camX, camY);
  // 5 garden
  blit(gardenL, camX, camY);
  drawSoilAndBlooms(camX, camY);
  drawLamps(tick, camX, camY);
  drawWetSpots(camX, camY);
  drawHer(camX, camY);
  drawRobot(camX, camY, camX, camY);
  for (let i = 0; i < LAMPS.length; i++) {            // lamp light catching the figures
    const lp = LAMPS[i], s = lp.porch ? 0 : slope(lp.x);
    lightPool(lp.x - camX, lp.y - s + 22 - camY + IY0, 22, 26, (lampFlicker(i, f) * 45 / 100) | 0, (1 << L.HER) | (1 << L.ROBOT), LIT);
  }
  drawWater(camX, camY);
  drawMothsAndFlies(tick, camX, camY);
  drawSlats(camX, camY);
  // 6 hero aircar
  drawCar(tick, camX, camY);
  // 7 foreground
  drawForeground(f, camX, camY);
  // post: vignette, film grain (12 fps), letterbox
  for (let i = IY0 * W; i < IY1 * W; i++) { const v = vig[i]; if (v) { fb[i] = SHD[fb[i]]; if (v === 2) fb[i] = SHD[fb[i]]; } }
  const gt = Math.floor(f / 5), npx = W * IH;
  for (let k = 0; k < 430; k++) {
    const i = IY0 * W + Math.floor(hash(gt, k) * npx), g = GRN[fb[i]];
    if (g) fb[i] = g - 1;
  }
  fb.fill(0, 0, IY0 * W); fb.fill(0, IY1 * W, W * H);

}

// =================================================================== DISPLAY + MAIN LOOP
const screenCv = document.getElementById('screen');
const sctx = screenCv.getContext('2d', { alpha: false });
const offCv = document.createElement('canvas');
offCv.width = W; offCv.height = H;
const octx = offCv.getContext('2d');
const img = octx.createImageData(W, H);
const out32 = new Uint32Array(img.data.buffer);
const PAL32 = new Uint32Array(256);
for (let i = 0; i < NPAL; i++) {
  const v = parseInt(PAL_HEX[i], 16);
  PAL32[i] = (0xff << 24 | (v & 0xff) << 16 | (v >> 8 & 0xff) << 8 | (v >> 16 & 0xff)) >>> 0;
}
let scale = 1, offX = 0, offY = 0;
function resize() {
  const dpr = window.devicePixelRatio || 1;
  const bw = Math.floor(window.innerWidth * dpr), bh = Math.floor(window.innerHeight * dpr);
  screenCv.width = bw; screenCv.height = bh;
  scale = Math.max(1, Math.floor(Math.min(bw / W, bh / H)));
  offX = Math.floor((bw - W * scale) / 2); offY = Math.floor((bh - H * scale) / 2);
  sctx.imageSmoothingEnabled = false;
  sctx.fillStyle = '#000'; sctx.fillRect(0, 0, bw, bh);
}
function present() {
  for (let i = 0; i < W * H; i++) out32[i] = PAL32[fb[i]];
  octx.putImageData(img, 0, 0);
  sctx.imageSmoothingEnabled = false;
  sctx.drawImage(offCv, 0, 0, W, H, offX, offY, W * scale, H * scale);
}

const params = new URLSearchParams(location.search);
const FREEZE = params.get('freeze') === '1';
// mutable doubles live in a typed array so per-frame stores never box a heap number
const clk = new Float64Array(5);            // 0 accumulator, 1 last timestamp, 2 stat sum, 3 stat max, 4 stat count
clk[1] = -1;
// perf probe for verification (?stats=1 writes the mean frame cost into the title)
const STATS = params.get('stats') === '1';
function frameLoop(now) {
  if (clk[1] < 0) clk[1] = now;
  let dt = (now - clk[1]) / 1000; clk[1] = now;
  if (dt > 0.25) dt = 0.25;
  const c0 = STATS ? performance.now() : 0;
  if (!FREEZE) { clk[0] += dt; while (clk[0] >= DT) { step(); clk[0] -= DT; } }
  render(simFrame); present();
  if (STATS) {
    const c = performance.now() - c0; clk[4]++; clk[2] += c; if (c > clk[3] && clk[4] > 60) clk[3] = c;
    if ((clk[4] % 120) === 0) document.title = 'avg ' + (clk[2] / clk[4]).toFixed(2) + 'ms max ' + clk[3].toFixed(2) + 'ms f' + simFrame;
  }
  requestAnimationFrame(frameLoop);
}
function init() {
  buildSky(); buildFar(); buildFog(); buildMid(); buildHill(); buildGarden(); buildCar(); buildForeground();
  buildVignette(); buildCameraPath();
  loopReset();
  const seek = parseFloat(params.get('t') || '0');
  const target = Math.floor(clamp(isNaN(seek) ? 0 : seek, 0, LOOP_S - DT) * FPS);
  simFrame = 0; update(0);
  while (simFrame < target) step();
  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(frameLoop);
}
init();
