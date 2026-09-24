// =================================================================== MAIN: DISPLAY, INPUT, THE FIXED-STEP LOOP, THE FRAME
const QS = new URLSearchParams(location.search);
const screen = document.getElementById('screen');
const sctx = screen.getContext('2d');
const off = document.createElement('canvas'); off.width = W; off.height = H;
const octx = off.getContext('2d');
const img = octx.createImageData(W, H);
const px32 = new Uint32Array(img.data.buffer);
const PAL32 = new Uint32Array(256);
PAL_HEX.forEach((h, i) => { const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16); PAL32[i] = (255 << 24) | (b << 16) | (g << 8) | r; });
const view = { scale: 1, ox: 0, oy: 0, dpr: 1 };
function resize() {
  const dpr = window.devicePixelRatio || 1, cw = Math.floor(innerWidth * dpr), ch = Math.floor(innerHeight * dpr);
  screen.width = cw; screen.height = ch; view.dpr = dpr;
  const s = Math.max(1, Math.floor(Math.min(cw / W, ch / H)));
  view.scale = s; view.ox = Math.floor((cw - W * s) / 2); view.oy = Math.floor((ch - H * s) / 2);
}
function present() {
  for (let i = 0; i < W * H; i++) px32[i] = PAL32[fb[i]];
  octx.putImageData(img, 0, 0);
  sctx.fillStyle = '#000'; sctx.fillRect(0, 0, screen.width, screen.height); sctx.imageSmoothingEnabled = false;
  sctx.drawImage(off, 0, 0, W, H, view.ox, view.oy, W * view.scale, H * view.scale);
}
// ------------------------------------------------------------------ input
const GAME = { mode: 'title', turbo: Math.max(1, Math.min(8, +(QS.get('turbo') || 1))), debug: QS.get('debug') === '1', perf: { frame: 0, n: 0, update: 0 } };
const BLOCK_KEYS = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab']);
window.addEventListener('keydown', e => {
  if (BLOCK_KEYS.has(e.code)) e.preventDefault();
  audioInit();
  if (!e.repeat) INPUT.pressed[e.code] = true;
  INPUT.keys[e.code] = true;
});
window.addEventListener('keyup', e => { INPUT.keys[e.code] = false; });
window.addEventListener('blur', () => { for (const k in INPUT.keys) INPUT.keys[k] = false; INPUT.mdown = false; if (GAME.mode === 'play') GAME.mode = 'pause'; });
function mouseAt(e) { INPUT.mx = clamp((e.clientX * view.dpr - view.ox) / view.scale, 0, W - 1); INPUT.my = clamp((e.clientY * view.dpr - view.oy) / view.scale, 0, H - 1); INPUT.moved = tick; }
screen.addEventListener('mousemove', mouseAt);
screen.addEventListener('mousedown', e => { mouseAt(e); audioInit(); screen.focus(); if (e.button === 0) { INPUT.mdown = true; INPUT.clicks++; INPUT.pressed.Click = true; } else if (e.button === 2) INPUT.rclicks++; e.preventDefault(); });
window.addEventListener('mouseup', e => { if (e.button === 0) INPUT.mdown = false; });
screen.addEventListener('contextmenu', e => e.preventDefault());
// ------------------------------------------------------------------ one fixed step of the world
function processEvents() {
  for (const e of FXQ) {
    if (e.k === 'crash') {
      sfxAt('crash', e.x, e.y, e.j); fxCrash(e.x, e.y, e.j);
      if ((e.v && e.v.driver === 'frank') || (e.o && e.o.driver === 'frank')) { shake(Math.min(8, e.j * 0.7)); if (e.o && e.o.target) STATS.rams = (STATS.rams || 0) + 1; }
    } else if (e.k === 'kerb') sfxAt('kerb', e.x, e.y);
    else if (e.k === 'splash') { sfxAt('splash', e.x, e.y); fxSplash(e.x, e.y); }
  }
  FXQ.length = 0;
}
function worldStep() {
  tick++;
  const M = MISSION;
  if (M.phase === 'fail') { M.t++; if (M.t > 60 && (pressed('Enter') || pressed('Click') || pressed('Space'))) retry(); }
  else if (M.phase === 'end') { M.t++; if (M.t > 90 && (pressed('Enter') || pressed('Click'))) { STATS_RESET(); startIntro(); } }
  else {
    autoInput();
    missionTick();
    playerTick();
    autoDrive();
  }
  for (const p of PEOPLE) { if (p === FRANK) continue; if (p.team === 'goons') goonTick(p); else if (p.team === 'civ') { personPhysics(p); civTick(p); } }
  sedanTick();
  for (const V of VEH) vehicleTick(V);
  physicsTick();
  for (const V of VEH) if (V.sinking && !V.splashed) { V.splashed = true; FXQ.push({ k: 'splash', x: V.x, y: V.y }); }
  carsVsPeople();
  processEvents();
  fxTick();
  updateCam();
  audioTick();
  clearPressed();
}
function STATS_RESET() { for (const k in STATS) STATS[k] = 0; }
function update() {
  if (GAME.mode === 'title') {
    tick++;
    for (const V of VEH) vehicleTick(V); physicsTick(); fxTick(); FXQ.length = 0;       // the street goes on behind the title
    CAMF.x = 38 + Math.sin(tick / 500) * 6; CAMF.y = 60 + Math.cos(tick / 700) * 4;
    cam.x = isoX(CAMF.x, CAMF.y) - W / 2; cam.y = isoY(CAMF.x, CAMF.y, 0.8) - H / 2;
    if (pressed('Enter') || pressed('Click') || pressed('Space') || QS.get('start') || QS.get('auto') === '1') { GAME.mode = 'play'; beginPlay(); }
    clearPressed(); return;
  }
  if (GAME.mode === 'pause') {
    if (pressed('Escape') || pressed('Click')) GAME.mode = 'play';
    else if (pressed('KeyR')) { GAME.mode = 'play'; STATS.retries++; retry(); }
    else if (pressed('KeyM')) { AUD.muted = !AUD.muted; audioApplyMute(); }
    clearPressed(); return;
  }
  if (pressed('Escape')) { GAME.mode = 'pause'; return; }
  if (pressed('KeyM')) { AUD.muted = !AUD.muted; audioApplyMute(); }
  worldStep();
}
function beginPlay() {
  const s = QS.get('start');
  if (s === 'fight') startFightCheckpoint(); else if (s === 'chase') { startIntro(); startTake(); } else startIntro();
}
// ------------------------------------------------------------------ the frame
const DRAWQ = [];
const PROF = { on: QS.get('prof') === '1', t: 0, acc: {} };
function prof(name) { if (!PROF.on) return; const t = performance.now(); if (name) PROF.acc[name] = (PROF.acc[name] || 0) * 0.97 + (t - PROF.t) * 0.03; PROF.t = t; }
function renderWorld() {
  const cx = Math.round(cam.x) + SHAKE.x, cy = Math.round(cam.y) + SHAKE.y;
  const [fx, fy] = FRANK ? frankPos() : [CAMF.x, CAMF.y], car = FRANK && FRANK.inCar;
  CUT.on = true; CUT.sx = Math.round(isoX(fx, fy)); CUT.sy = Math.round(isoY(fx, fy, 0.9)) - 10; CUT.d = fx + fy + (car ? 1.8 : 0.8); CUT.rx = 150; CUT.ry = 96;
  if (MISSION.phase === 'fight') { CUT.sx = Math.round((CUT.sx + cx + W / 2) / 2); CUT.sy = Math.round((CUT.sy + cy + H / 2) / 2); CUT.rx = 210; CUT.ry = 130; }   // the whole fight stays in view
  prof();
  updateNeon();
  composeCity(cx, cy); prof('compose');
  cityReflections(); prof('refl');
  gatherLights();
  applyDynLights(cx, cy); prof('dyn');
  drawSkids(cx, cy);
  DRAWQ.length = 0;
  for (const V of VEH) {
    if (V.gone && !V.sinking) continue;
    const sx = isoX(V.x, V.y) - cx, sy = isoY(V.x, V.y, 0) - cy;
    if (sx < -120 || sx > W + 120 || sy < -60 || sy > H + 100) continue;
    DRAWQ.push(V);
  }
  for (const V of DRAWQ) reflectVehicle(V, cx, cy);
  prof('vrefl');
  for (const V of DRAWQ) if (!V.sinking) drawVehShadow(V, cx, cy);
  prof('shadow');
  for (const p of PEOPLE) {
    if (!p.visible || p.inCar) continue;
    const sx = isoX(p.x, p.y) - cx, sy = isoY(p.x, p.y, 0) - cy;
    if (sx < -30 || sx > W + 30 || sy < -10 || sy > H + 50) continue;
    p.xray = p === FRANK ? C.CREAM : 0;
    DRAWQ.push(p);
  }
  DRAWQ.sort((a, b) => (a.x + a.y) - (b.x + b.y));
  for (const o of DRAWQ) { if (o.M) drawVehicle(o, cx, cy); else drawPerson(o, cx, cy); }
  if (FRANK && FRANK.inCar && FRANK.inCar.xray) drawVehXray(FRANK.inCar, cx, cy); else if (FRANK && FRANK.visible) drawPersonXray(FRANK, cx, cy);
  prof('sprites');
  drawParts(cx, cy); prof('parts');
  drawRain(cx, cy, 110, true);
  vignette(0.8); prof('rain+vig');
  if (GAME.debug) drawDebug(cx, cy);
  return [cx, cy];
}
function render() {
  const t0 = performance.now();
  const [cx, cy] = renderWorld();
  if (GAME.mode === 'title') drawTitle();
  else {
    if (MISSION.phase !== 'end' && MISSION.phase !== 'fail') { drawClue(); drawHud(cx, cy); }
    if (MISSION.phase === 'fail') drawFail();
    if (MISSION.phase === 'end') drawEnd();
    if (GAME.mode === 'pause') drawPause();
    if (MISSION.fade > 0.01) ditherRect(0, 0, W, H, SHD3, MISSION.fade);
  }
  prof('hud');
  prof(); present(); prof('present');
  const pf = GAME.perf; pf.frame = pf.frame * 0.95 + (performance.now() - t0) * 0.05; pf.n++;
}
function drawDebug(cx, cy) {
  for (const S of staticsNear(CAMF.x - 25, CAMF.y - 25, CAMF.x + 25, CAMF.y + 25)) {
    const col = S.h < 0.3 ? C.G2 : S.h < 1.7 ? C.PALEY : C.RED;
    if (S.circle) { for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; pset(Math.round(isoX(S.cx + Math.cos(a) * S.r, S.cy + Math.sin(a) * S.r)) - cx, Math.round(isoY(S.cx + Math.cos(a) * S.r, S.cy + Math.sin(a) * S.r, 0)) - cy, col); } continue; }
    for (const [ax, ay, bx, by] of [[S.x0, S.y0, S.x1, S.y0], [S.x1, S.y0, S.x1, S.y1], [S.x1, S.y1, S.x0, S.y1], [S.x0, S.y1, S.x0, S.y0]]) {
      const n = Math.ceil(Math.hypot(bx - ax, by - ay) * 3); for (let k = 0; k <= n; k++) pset(Math.round(isoX(lerp(ax, bx, k / n), lerp(ay, by, k / n))) - cx, Math.round(isoY(lerp(ax, bx, k / n), lerp(ay, by, k / n), 0)) - cy, col);
    }
  }
  for (const V of VEH) if (V.ai && V.ai.path) { const P = V.ai.path; for (let k = V.ai.i; k < P.length - 1; k++) for (let q = 0; q < 20; q++) pset(Math.round(isoX(lerp(P[k][0], P[k + 1][0], q / 20), lerp(P[k][1], P[k + 1][1], q / 20))) - cx, Math.round(isoY(lerp(P[k][0], P[k + 1][0], q / 20), lerp(P[k][1], P[k + 1][1], q / 20), 0)) - cy, C.CYAN); }
  for (const c of NAV.cover) pset(Math.round(isoX(c.x, c.y)) - cx, Math.round(isoY(c.x, c.y, 0)) - cy, c.by ? C.RED : C.GRNL);
  drawText(GAME.perf.frame.toFixed(1) + ' ms  ' + VEH.length + ' cars  ' + PARTS.length + ' parts', 4, H - 12, C.PALEY);
}
// ------------------------------------------------------------------ start up
let lastT = 0, acc = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - lastT) / 1000 || 0); lastT = now; acc += dt;
  let n = 0;
  const u0 = performance.now();
  while (acc >= DT && n < 5) { for (let k = 0; k < GAME.turbo; k++) update(); acc -= DT; n++; }
  if (n === 5) acc = 0;
  GAME.perf.update = GAME.perf.update * 0.95 + (performance.now() - u0) * 0.05;
  bakeAhead(GAME.mode === 'title' ? 14 : 3, cam.x + W / 2, cam.y + H / 2);
  render();
  requestAnimationFrame(frame);
}
function init() {
  resize(); window.addEventListener('resize', resize);
  AUD.muted = QS.get('mute') === '1';
  const t0 = performance.now();
  buildCity(); buildStaticGrid(); buildLightGrid(); buildCarModels(); buildCast(); buildCombatCast(); buildMinimap();
  GAME.buildMs = performance.now() - t0;
  room = CITY_ROOM;
  resetWorld();
  CAMF.x = 38; CAMF.y = 60; cam.x = isoX(38, 60) - W / 2; cam.y = isoY(38, 60, 0.8) - H / 2;
  exposeTest();
  requestAnimationFrame(t => { lastT = t; frame(t); });
}
