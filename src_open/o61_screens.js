// =================================================================== SCREENS: THE TITLE, THE PAUSE, THE CONTROLS, COMING TO
const HELP = [
  ['ON FOOT', 'WASD walk  SHIFT run  C crouch  E use'],
  ['', 'MOUSE aim  CLICK shoot  R reload  G throw'],
  ['', '1-5 weapons  X holster  L flashlight'],
  ['DRIVING', 'W S gas, brake  A D steer  SPACE slide'],
  ['', 'E get out  H horn  L lights  G siren'],
  ['THE JOB', 'I bag  J notebook  M map  TAB case it'],
  ['', 'F fire at the nearest  + - zoom  ESC pause']
];
function drawHelp(y) {
  for (const [a, b] of HELP) { if (a) drawTextOutlined(a, 22, y, C.PALEY); drawTextOutlined(b, 76, y, C.CRS); y += LINE_H + 1; }
  return y;
}
const TITLE = { sel: 0, want: null };
function titleOptions() { return hasSave() && !QS.get('fresh') ? ['CONTINUE', 'NEW GAME'] : ['NEW GAME']; }
function titleTick() {
  const O = titleOptions();
  if (pressed('KeyW') || pressed('ArrowUp')) TITLE.sel = (TITLE.sel + O.length - 1) % O.length;
  if (pressed('KeyS') || pressed('ArrowDown')) TITLE.sel = (TITLE.sel + 1) % O.length;
  if (INPUT.clicks > 0) { const i = Math.floor((INPUT.my - 120) / 12); if (i >= 0 && i < O.length) TITLE.sel = i; }
  const go = pressed('Enter') || pressed('Space') || INPUT.clicks > 0 || QS.get('auto') === '1' || QS.get('start');
  INPUT.clicks = 0;
  if (!go || bakeReady() < 1) return;
  const pick = QS.get('auto') === '1' || QS.get('start') ? 'NEW GAME' : O[Math.min(TITLE.sel, O.length - 1)];
  if (pick === 'NEW GAME') { if (!QS.get('keep')) wipeSave(); } else if (!loadGame()) toast('The save could not be read. A fresh start.');
  GAME.mode = 'play'; CAMF.snap = true; audioPlace(); onFrankMoved(FRANK.B);
  if (pick === 'NEW GAME') say('Frank Calder', 'Another night in New Meridian. The phone on my desk has work on it, if I want it.');
}
function drawTitle() {
  remapRect(0, 0, W, H, SHD2);
  const t1 = 'NEW MERIDIAN', w1 = bigWidth(t1, 3);
  drawBig(t1, Math.round((W - w1) / 2) + 1, 17, C.BLK, 3); drawBig(t1, Math.round((W - w1) / 2), 16, C.CORAL, 3);
  centred('THE HOURGLASS CITY  -  AN OPEN CITY TEST LEVEL  -  1957', 48, C.CRS);
  drawHelp(62);
  const O = titleOptions(), r = bakeReady();
  O.forEach((o, i) => { const sel = i === TITLE.sel, s = (sel ? '> ' : '  ') + o + (sel ? ' <' : '  '); centred(s, 140 + i * 12, r < 1 ? C.ST1 : sel ? ((tick >> 4) & 1 ? C.PALEY : C.CREAM) : C.CRS); });
  centred(r < 1 ? 'developing the city  ' + Math.round(r * 100) + '%' : 'the city is ready', 168, C.ST2);
}
// the tiles around the office, baked before the game starts (the rest comes as he goes)
const PREBAKE = { list: null, done: 0 };
function bakeReady() {
  if (!PREBAKE.list) {
    const cx = isoX(FRANK.x, FRANK.y) - VW / 2, cy = isoY(FRANK.x, FRANK.y, 1) - VH / 2; PREBAKE.list = [];
    for (let ty = Math.floor((cy - 40) / TS); ty <= Math.floor((cy + VH + 40) / TS); ty++) for (let tx = Math.floor((cx - 48) / TS); tx <= Math.floor((cx + VW + 48) / TS); tx++) PREBAKE.list.push([tx, ty]);
  }
  return PREBAKE.done / PREBAKE.list.length;
}
function prebake(ms) {
  bakeReady(); const t0 = performance.now();
  while (PREBAKE.done < PREBAKE.list.length && performance.now() - t0 < ms) { const [tx, ty] = PREBAKE.list[PREBAKE.done++]; if (!TILES.has(tkey(tx, ty))) bakeTileNow(tx, ty); }
  if (PREBAKE.done >= PREBAKE.list.length && FRANK.F) for (const k of FRANK.F.bucket.keys()) { if (performance.now() - t0 > ms) break; if (!ITILES.has(FRANK.F.key * 16777216 + k)) bakeIntTileNow(FRANK.F, Math.floor(k / 4096) - 1024, (k % 4096) - 1024); }
}
// ------------------------------------------------------------------ the pause
function pauseTick() {
  if (pressed('Escape') || pressed('Click')) { GAME.mode = 'play'; return; }
  if (pressed('KeyS')) saveGame(false);
  if (pressed('KeyM')) { AUD.muted = !AUD.muted; audioApplyMute(); }
  if (pressed('KeyN')) { GAME.confirmNew = !GAME.confirmNew; }
  if (GAME.confirmNew && pressed('KeyY')) { wipeSave(); location.search = ''; location.reload(); }
}
function drawPause() {
  remapRect(0, 0, W, H, DIM);
  const t = 'PAUSED', w = bigWidth(t, 2); drawBig(t, Math.round((W - w) / 2), 18, C.PALEY, 2);
  drawHelp(46);
  centred('ESC resume    S save    M sound ' + (AUD.muted ? 'OFF' : 'ON') + '    N new game', 128, C.CREAM);
  if (GAME.confirmNew) centred('Start over and throw away the save? Y to confirm', 142, C.CORAL);
  const s = 'JOBS DONE ' + STATS.jobs + '    EARNED ' + money(STATS.earned || 0) + '    TAKEDOWNS ' + (STATS.takedowns || 0) + '    LAMPS SHOT ' + (STATS.lampsOut || 0);
  centred(s, 160, C.ST2);
}
// ------------------------------------------------------------------ down: the screen goes dark, he comes to
function drawDown() {
  if (FRANK.alive || LIFE.woke) return;
  const k = Math.min(1, LIFE.deadT / 100);
  ditherRect(0, 0, W, H, DIM, k);
  if (LIFE.deadT > 40) { const t = 'OUT COLD', w = bigWidth(t, 2); drawBig(t, Math.round((W - w) / 2) + 1, 71, C.BLK, 2); drawBig(t, Math.round((W - w) / 2), 70, C.RED, 2); }
}
