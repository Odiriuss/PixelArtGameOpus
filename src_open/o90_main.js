// =================================================================== MAIN: DISPLAY, INPUT, THE FIXED-STEP LOOP, THE FRAME
const QS = new URLSearchParams(location.search);
const screen = document.getElementById('screen');
const sctx = screen.getContext('2d');
const PAL32 = new Uint32Array(256);
PAL_HEX.forEach((h, i) => { const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16); PAL32[i] = (255 << 24) | (b << 16) | (g << 8) | r; });
const view = { scale: 1, ox: 0, oy: 0, dpr: 1 };
function resize() {
  const dpr = window.devicePixelRatio || 1, cw = Math.floor(innerWidth * dpr), ch = Math.floor(innerHeight * dpr);
  screen.width = cw; screen.height = ch; view.dpr = dpr;
  const s = Math.max(1, Math.floor(Math.min(cw / UW, ch / UH)));
  view.scale = s; view.ox = Math.floor((cw - UW * s) / 2); view.oy = Math.floor((ch - UH * s) / 2);
  zoomSnap();
}
// ------------------------------------------------------------------ input
const GAME = { mode: 'title', turbo: Math.max(1, Math.min(8, +(QS.get('turbo') || 1))), debug: QS.get('debug') === '1', perf: { frame: 0, n: 0, update: 0 }, confirmNew: false };
const BLOCK_KEYS = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab']);
window.addEventListener('keydown', e => {
  if (BLOCK_KEYS.has(e.code)) e.preventDefault();
  audioInit();
  if (!e.repeat) INPUT.pressed[e.code] = true;
  if (!e.repeat && !e.ctrlKey && !e.metaKey) {                        // by the character, so + and - work on any layout
    if (e.key === '+' || e.key === '=') INPUT.pressed.ZoomIn = true; else if (e.key === '-' || e.key === '_') INPUT.pressed.ZoomOut = true;
  }
  INPUT.keys[e.code] = true;
});
window.addEventListener('keyup', e => { INPUT.keys[e.code] = false; });
window.addEventListener('blur', () => { for (const k in INPUT.keys) INPUT.keys[k] = false; INPUT.mdown = false; if (GAME.mode === 'play' && !UI.mode) GAME.mode = 'pause'; });
function mouseAt(e) { INPUT.mx = clamp((e.clientX * view.dpr - view.ox) / view.scale, 0, UW - 1); INPUT.my = clamp((e.clientY * view.dpr - view.oy) / view.scale, 0, UH - 1); INPUT.moved = tick; }
screen.addEventListener('mousemove', mouseAt);
screen.addEventListener('mousedown', e => { mouseAt(e); audioInit(); screen.focus(); if (e.button === 0) { INPUT.mdown = true; INPUT.clicks++; INPUT.pressed.Click = true; } else if (e.button === 2) { INPUT.rdown = true; INPUT.rclicks++; } e.preventDefault(); });
window.addEventListener('mouseup', e => { if (e.button === 0) INPUT.mdown = false; else if (e.button === 2) INPUT.rdown = false; });
screen.addEventListener('contextmenu', e => e.preventDefault());
screen.addEventListener('wheel', e => { INPUT.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
// ------------------------------------------------------------------ one fixed step of the world
function processEvents() {
  for (const e of FXQ) {
    if (e.k === 'crash') {
      sfxAt('crash', e.x, e.y, e.j); fxCrash(e.x, e.y, e.j);
      const mine = (e.v && e.v.driver === 'frank') || (e.o && e.o.driver === 'frank');
      if (mine) { shake(Math.min(8, e.j * 0.7)); makeNoise(e.x, e.y, 20); const O = e.v && e.v.driver === 'frank' ? e.o : e.v; if (O && O.M && e.j > 4) crimeAt('vandal', e.x, e.y); }
    } else if (e.k === 'kerb') sfxAt('kerb', e.x, e.y);
    else if (e.k === 'splash') { sfxAt('splash', e.x, e.y); fxSplash(e.x, e.y); }
  }
  FXQ.length = 0;
}
function worldStep() {
  tick++;
  clockTick();
  if (tick % 30 === 0) { weatherTick(); updateLightParams(); updateLamps(); }
  if (tick % 60 === 1) updateDoors();
  if (tick % 120 === 5) audioPlace();
  if (FRANK.alive && !PLAYER.pending && !PLAYER.sleep) playerTick(); else { FRANK.moving = false; personPhysics(FRANK); clearPressed(); }
  lifeTick(); sleepTick(); fadeTick(); liftTick();
  if (tick % 6 === 0) frankLight();
  let fight = false;
  for (let i = 0; i < PEOPLE.length; i++) {
    const p = PEOPLE[i]; if (p === FRANK) continue;
    if (p.ai && p.ai.guard) { guardTick(p); if (p.ai.aware >= AW.SEARCH && p.alive && (p.F || null) === (FRANK.inCar ? null : FRANK.F || null) && Math.hypot(p.x - FRANK.x, p.y - FRANK.y) < 22) fight = true; }
    else if (p.ai) civTick(p); else personPhysics(p);
  }
  if (fight) ensureNav();
  for (const V of VEH) vehicleTick(V);
  physicsTick();
  for (const V of VEH) if (V.sinking && !V.splashed) { V.splashed = true; FXQ.push({ k: 'splash', x: V.x, y: V.y }); }
  carsVsPeople();
  processEvents();
  fxTick(); fireTick(); thrownTick();
  manageTraffic(); manageCrowd(); manageBeat(); depopulate(); zonesTick(); muggerTick(); jobsTick(); lawTick(); sweepDead();
  wordsTick(); updateCam(); audioTick(); musicFor();
  clearPressed();
}
// the dead nobody will look at again are cleared away (their pockets with them)
function sweepDead() {
  if (tick % 120 !== 31) return;
  for (let k = PEOPLE.length - 1; k >= 0; k--) {
    const p = PEOPLE[k]; if (p === FRANK || p.alive || Math.hypot(p.x - FRANK.x, p.y - FRANK.y) < 60 || !offScreen(p.x, p.y)) continue;
    PEOPLE.splice(k, 1); if (p.loot) { const i = CONTAINERS.indexOf(p.loot); if (i >= 0) CONTAINERS.splice(i, 1); }
  }
  for (let i = DROPS.length - 1; i >= 0; i--) if (!DROPS[i].grid.items.length) DROPS.splice(i, 1);
}
// the score: a chase with the law after him in a car, a fight, somebody looking for him, or nothing but the city
function musicFor() {
  let m = 'none';
  if (LAW.heat >= 2 && PLAYER.car) m = 'chase';
  else if (enemiesNear(FRANK.x, FRANK.y, 30).length) m = 'fight';
  else if (PEOPLE.some(p => p.ai && p.alive && !p.down && p.ai.aware >= AW.SUS && p.ai.aware < AW.ALERT && Math.hypot(p.x - FRANK.x, p.y - FRANK.y) < 25)) m = 'tension';
  setMusic(m);
}
function update() {
  if (GAME.mode === 'title') {
    tick++;
    for (const V of VEH) vehicleTick(V); physicsTick(); fxTick(); FXQ.length = 0;
    CAMF.x = FRANK.x - 6 + Math.sin(tick / 500) * 5; CAMF.y = FRANK.y + 4 + Math.cos(tick / 700) * 3;
    cam.x = isoX(CAMF.x, CAMF.y) - VW / 2; cam.y = isoY(CAMF.x, CAMF.y, 0.8) - VH / 2;
    titleTick(); clearPressed(); return;
  }
  if (GAME.mode === 'pause') { pauseTick(); clearPressed(); return; }
  autoInput();
  if (UI.mode) { uiTick(); clearPressed(); return; }
  if (pressed('Escape')) { GAME.mode = 'pause'; GAME.confirmNew = false; return; }
  if (FRANK.alive && !PLAYER.car && !PLAYER.busy) {
    if (pressed('KeyI')) { openInventory(); return; }
    if (pressed('KeyJ')) { openJobs('note'); return; }
  }
  if (pressed('KeyM')) { openMap(); return; }
  if (pressed('ZoomIn')) zoomStep(1); else if (pressed('ZoomOut')) zoomStep(-1);
  caseTick();
  if (CASE.on && (CASE.slow = (CASE.slow + 1) & 1)) return;              // half speed while casing
  worldStep();
}
// ------------------------------------------------------------------ the frame
const DRAWQ = [];
const PROF = { on: QS.get('prof') === '1', acc: {}, t: 0 };
function prof(name) { if (!PROF.on) return; const t = performance.now(); if (name) PROF.acc[name] = (PROF.acc[name] || 0) * 0.97 + (t - PROF.t) * 0.03; PROF.t = t; }
function renderWorld() {
  const cx = Math.round(cam.x) + SHAKE.x, cy = Math.round(cam.y) + SHAKE.y;
  const [fx, fy, car] = frankPos(), fz = car ? 0 : FRANK.z;
  CUT.on = true; CUT.sx = Math.round(isoX(fx, fy)); CUT.sy = Math.round(isoY(fx, fy, fz + 0.9)) - 10; CUT.d = fx + fy + (car ? 1.8 : 0.8); CUT.rx = 150; CUT.ry = 96;
  const feet = Math.round(isoY(fx, fy, fz)) - cy, mid = CUT.sx - cx;                   // his box on the screen: the man, or the car
  CUT.box = car ? [mid - 30, feet - 30, mid + 30, feet + 14] : [mid - 9, feet - 44, mid + 9, feet + 2];
  prof();
  updateNeon();
  composeCity(cx, cy); prof('compose');
  cityReflections(); prof('refl');
  gatherLights(); pushTorches();
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
  for (const V of DRAWQ) if (!V.sinking) drawVehShadow(V, cx, cy);
  prof('cars');
  for (const p of PEOPLE) {
    if (!personShown(p)) continue;
    const sx = isoX(p.x, p.y) - cx, sy = isoY(p.x, p.y, p.z) - cy;
    if (sx < -30 || sx > W + 30 || sy < -10 || sy > H + 50) continue;
    p.xray = p === FRANK ? C.CREAM : 0;
    DRAWQ.push(p);
  }
  DRAWQ.sort((a, b) => (a.x + a.y) - (b.x + b.y));
  for (const o of DRAWQ) { if (o.M) drawVehicle(o, cx, cy); else drawPerson(o, cx, cy); }
  if (car && car.xray) drawVehXray(car, cx, cy); else if (!car && personShown(FRANK)) drawPersonXray(FRANK, cx, cy);
  prof('sprites');
  drawParts(cx, cy); drawThrown(cx, cy); prof('parts');
  if (WEATHER.rain > 0.02) drawRain(cx, cy, Math.round(WEATHER.rain * (FRANK.B && !car ? 60 : 150) * VW * VH / (UW * UH)), true);
  vignette(0.35 + LP.out.night * 0.5); prof('rain+vig');
  if (GAME.debug) drawDebug(cx, cy);
  return [cx, cy];
}
function drawThrown(cx, cy) { for (const o of THROWN) { const x = Math.round(isoX(o.x, o.y)) - cx, y = Math.round(isoY(o.x, o.y, o.z)) - cy; dpset(x, y, o.key === 'molotov' ? C.G1 : C.CRIM, o.x + o.y + 0.3); dpset(x, y - 1, o.fuse ? C.HOT : C.CREAM, o.x + o.y + 0.3); } }
function render() {
  const t0 = performance.now();
  zoomFrame(); worldLayer();
  const [cx, cy] = renderWorld();
  if (GAME.mode !== 'title') { drawCase(cx, cy); if (!UI.mode) drawNoiseRings(cx, cy); }
  hudLayer();
  if (GAME.mode === 'title') drawTitle();
  else {
    if (!UI.mode) drawHud(cx, cy);
    drawDown();
    if (UI.mode === 'inv') drawInventory(); else if (UI.mode === 'map') drawMap(); else if (UI.mode === 'jobs') drawJobs();
    if (GAME.mode === 'pause') drawPause();
    if (PLAYER.fade > 0.01) ditherRect(0, 0, W, H, SHD3, PLAYER.fade);
  }
  if (GAME.debug) drawText(GAME.perf.frame.toFixed(1) + ' ms  ' + VEH.length + ' cars  ' + PEOPLE.length + ' people  ' + TILES.size + ' tiles  ' + VW + 'x' + VH, 4, H - 22, C.PALEY);
  prof('hud');
  prof(); present(); prof('present');
  const pf = GAME.perf; pf.frame = pf.frame * 0.95 + (performance.now() - t0) * 0.05; pf.n++;
}
function drawDebug(cx, cy) {
  for (const S of staticsNear(CAMF.x - 25, CAMF.y - 25, CAMF.x + 25, CAMF.y + 25)) {
    const z = S.z0 || 0; if (Math.abs(z - (FRANK.z || 0)) > 1.5) continue;
    const col = S.off ? C.G1 : S.h < 0.3 ? C.G2 : S.h < 1.7 ? C.PALEY : C.RED;
    if (S.circle) { for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; pset(Math.round(isoX(S.cx + Math.cos(a) * S.r, S.cy + Math.sin(a) * S.r)) - cx, Math.round(isoY(S.cx + Math.cos(a) * S.r, S.cy + Math.sin(a) * S.r, z)) - cy, col); } continue; }
    for (const [ax, ay, bx, by] of [[S.x0, S.y0, S.x1, S.y0], [S.x1, S.y0, S.x1, S.y1], [S.x1, S.y1, S.x0, S.y1], [S.x0, S.y1, S.x0, S.y0]]) {
      const n = Math.ceil(Math.hypot(bx - ax, by - ay) * 3); for (let k = 0; k <= n; k++) pset(Math.round(isoX(lerp(ax, bx, k / n), lerp(ay, by, k / n))) - cx, Math.round(isoY(lerp(ax, bx, k / n), lerp(ay, by, k / n), z)) - cy, col);
    }
  }
  for (const c of NAV.cover) pset(Math.round(isoX(c.x, c.y)) - cx, Math.round(isoY(c.x, c.y, NAV.z)) - cy, c.by ? C.RED : C.GRNL);
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
  if (GAME.mode === 'title') prebake(14);
  else { const V = PLAYER.car; bakeAhead(3, cam.x, cam.y, V ? (V.vx - V.vy) * 8 : 0, V ? (V.vx + V.vy) * 4 : 0, FRANK.F || doorAhead()); }
  render();
  requestAnimationFrame(frame);
}
