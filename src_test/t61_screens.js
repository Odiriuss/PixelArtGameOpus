// =================================================================== SCREENS: TITLE, PAUSE, FAILURE, THE END
const HELP = [
  ['ON FOOT', 'WASD move   MOUSE aim   CLICK shoot'],
  ['', 'R reload   C crouch   E take a car'],
  ['DRIVING', 'W gas   S brake   A D steer   SPACE slide'],
  ['', 'CLICK shoot   E get out   H horn'],
  ['ANY TIME', 'F fire at the nearest   ESC pause   M sound']
];
function drawHelp(y) {
  for (const [a, b] of HELP) { if (a) drawTextOutlined(a, 40, y, C.PALEY); drawTextOutlined(b, 100, y, C.CRS); y += LINE_H + 1; }
  return y;
}
function drawTitle() {
  remapRect(0, 0, W, H, SHD);
  const t1 = 'THE BLACK SEDAN', w1 = bigWidth(t1, 3);
  drawBig(t1, Math.round((W - w1) / 2) + 1, 25, C.BLK, 3); drawBig(t1, Math.round((W - w1) / 2), 24, C.CORAL, 3);
  centred('AN HOURGLASS CITY TEST LEVEL  -  NEW MERIDIAN, 1957', 58, C.CRS);
  drawHelp(78);
  if ((tick >> 4) & 1) centred('CLICK OR PRESS ENTER', 146, C.PALEY);
  centred(bakeProgress() < 1 ? 'developing the city  ' + Math.round(bakeProgress() * 100) + '%' : 'the city is ready', 164, C.ST2);
}
function drawPause() {
  remapRect(0, 0, W, H, DIM);
  const t = 'PAUSED', w = bigWidth(t, 2); drawBig(t, Math.round((W - w) / 2), 30, C.PALEY, 2);
  drawHelp(62);
  centred('ESC resume     R restart from the checkpoint     M sound ' + (AUD.muted ? 'OFF' : 'ON'), 128, C.CREAM);
}
function drawFail() {
  const k = Math.min(1, MISSION.t / 40);
  ditherRect(0, 0, W, H, DIM, k);
  const t = MISSION.failWhy, w = bigWidth(t, 2);
  drawBig(t, Math.round((W - w) / 2) + 1, 61, C.BLK, 2); drawBig(t, Math.round((W - w) / 2), 60, C.RED, 2);
  if (MISSION.t > 60 && (tick >> 4) & 1) centred('PRESS ENTER TO TRY AGAIN', 100, C.CREAM);
  if (MISSION.t > 60) centred(MISSION.checkpoint === 'fight' ? 'from the gate at Pier 9' : 'from the start of the chase', 114, C.ST2);
}
function fmtTime(ticks) { const s = Math.floor(ticks / 60); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
function drawEnd() {
  remapRect(0, 0, W, H, DIM); remapRect(0, 0, W, H, SHD);
  const t = 'CASE NOTES', w = bigWidth(t, 2); drawBig(t, Math.round((W - w) / 2), 12, C.PALEY, 2);
  const acc = STATS.shots ? Math.round(STATS.hits / STATS.shots * 100) + '%' : '-';
  const rows = [['The chase', fmtTime(STATS.chaseT)], ['The fight', fmtTime(STATS.fightT)], ['Shots fired', String(STATS.shots)], ['Hits', acc],
    ['Men down', String(STATS.goonsDown)], ['Cars borrowed', String(STATS.carsTaken)], ['Damage taken', String(Math.round(STATS.dmgTaken))], ['Tries', String(STATS.retries + 1)]];
  rows.forEach(([a, b], i) => { const y = 40 + i * (LINE_H + 1); drawText(a, 90, y, C.CRS); drawText(b, 230 - textWidth(b), y, C.CREAM); });
  const clue = wrapText('A Pier 9 dock pass, Asterion Shipping. On the back, in pencil: 2:17.', 250);
  clue.forEach((l, i) => centred(l, 136 + i * LINE_H, C.CORAL));
  if (MISSION.t > 90 && (tick >> 4) & 1) centred('PRESS ENTER TO PLAY AGAIN', 164, C.PALEY);
}
// the clue card in the outro: a dock pass drawn by hand
function drawClue() {
  const k = MISSION.clue; if (k === undefined || MISSION.phase !== 'outro') return;
  const w = 120, h = 64, x = Math.round((W - w) / 2), y = Math.round(66 + (1 - k) * 30);
  if (k < 1 && bay(0, 0) > k) return;
  fillRect(x - 1, y - 1, w + 2, h + 2, C.BLK); fillRect(x, y, w, h, C.STL); fillRect(x + 2, y + 2, w - 4, 12, C.OX);
  drawText('ASTERION SHIPPING', x + 6, y + 3, C.CREAM);
  drawText('DOCK PASS - PIER 9', x + 6, y + 18, C.INK); hline(x + 6, x + w - 8, y + 28, C.STS);
  drawText('No. 0417     NIGHT', x + 6, y + 31, C.DBR);
  drawText('2:17', x + w - 34, y + 44, C.NAV); hline(x + w - 36, x + w - 14, y + 54, C.NAV);
  for (let i = 0; i < 18; i++) pset(x + 8 + i * 3, y + 50 + ((i * 7) % 3), C.CRS);
}
