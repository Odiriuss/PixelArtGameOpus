// =================================================================== THE MAP: THE CITY FROM ABOVE, WHAT IS OPEN, WHERE THE WORK IS
const BIGMAP = { s: 0.9, w: 300, h: 140, x: 10, y: 20, ox: 0, oy: 0, img: null };
function buildBigMap() {
  const M = BIGMAP; M.ox = -(MAP.x0 - MAP.y1) * M.s; M.oy = -(MAP.x0 + MAP.y0) * M.s * 0.5;
  M.img = new Uint8Array(M.w * M.h);
  for (let j = 0; j < M.h; j++) for (let i = 0; i < M.w; i++) {
    const a = (i + 0.5 - M.ox) / M.s, b = (j + 0.5 - M.oy) * 2 / M.s, x = (a + b) / 2, y = (b - a) / 2;
    let c = C.BLK;
    if (x >= MAP.x0 && y >= MAP.y0 && x < MAP.x1 && y < MAP.y1) {
      const s = surfAt(x, y); c = s === 2 ? C.NAV : s === 1 ? C.ST1 : C.ST0;
      const B = buildingAt(x, y); if (B) c = B.key === 'office' ? C.G1 : B.zone ? C.PLUM : B.enter === 'apartment' ? C.INK : C.S0;
      else for (const S of staticsNear(x - 0.3, y - 0.3, x + 0.3, y + 0.3)) if (!S.circle && S.h > 6 && x >= S.x0 && x < S.x1 && y >= S.y0 && y < S.y1) { c = C.VDK; break; }
    }
    M.img[j * M.w + i] = c;
  }
}
function bigXY(x, y) { return [Math.round(BIGMAP.x + (x - y) * BIGMAP.s + BIGMAP.ox), Math.round(BIGMAP.y + (x + y) * BIGMAP.s * 0.5 + BIGMAP.oy)]; }
function bigToWorld(px, py) { const a = (px - BIGMAP.x - BIGMAP.ox) / BIGMAP.s, b = (py - BIGMAP.y - BIGMAP.oy) * 2 / BIGMAP.s; return [(a + b) / 2, (b - a) / 2]; }
function openMap() { UI.mode = 'map'; sfx('page'); }
function mapTick() { if (pressed('Escape') || pressed('KeyM') || pressed('KeyE')) closeUI(); INPUT.clicks = 0; INPUT.rclicks = 0; }
function drawMap() {
  remapRect(0, 0, W, H, DIM);
  const M = BIGMAP;
  fillRect(M.x - 2, M.y - 2, M.w + 4, M.h + 4, C.INK);
  for (let j = 0; j < M.h; j++) for (let i = 0; i < M.w; i++) fb[(M.y + j) * W + M.x + i] = M.img[j * M.w + i];
  const ck = clockText(); drawText(ck, W - 12 - textWidth(ck), 6, C.CREAM);
  // the places that are open now glow
  for (let i = 1; i < BUILDINGS.length; i++) {
    const B = BUILDINGS[i]; if (!B.floors || B.enter === 'apartment' || !B.hours) continue;
    if (!businessOpen(B)) continue;
    const [x, y] = bigXY(B.x0 + 0.5, B.y1 - 0.5); pset(x, y, C.AMB);
  }
  for (const P of PHONES) { const [x, y] = bigXY(P.x, P.y); pset(x, y, C.CYAN); }
  for (const J of JOBS) if (J.state === 'active') { const w = J.where(J); if (!w) continue; const [x, y] = bigXY(w.x, w.y), c = J.ready && J.ready(J) ? C.GRNL : C.PALEY; fillRect(x - 1, y - 1, 3, 3, (tick >> 4) & 1 ? c : C.BLK); pset(x, y, c); }
  const car = VEH.find(V => V.own && !V.gone); if (car) { const [x, y] = bigXY(car.x, car.y); fillRect(x - 1, y, 3, 2, C.TAN); }
  if (LAW.heat || PSTAT.scanner) for (const V of VEH) if (V.model === 'police' && !V.gone) { const [x, y] = bigXY(V.x, V.y); fillRect(x, y, 2, 2, (tick >> 3) & 1 ? C.RED : C.NBL); }
  const [fx, fy] = frankPos(), [px, py] = bigXY(fx, fy);
  if ((tick >> 3) & 1) { hline(px - 3, px + 3, py, C.WHITE); vline(px, py - 3, py + 3, C.WHITE); }
  // what is under the mouse
  const [wx, wy] = bigToWorld(INPUT.mx, INPUT.my), B = buildingAt(wx, wy);
  let s = '';
  if (B) s = B.name + (B.hours ? (businessOpen(B) ? '  -  OPEN' : '  -  CLOSED, OPENS ' + hhmm(B.hours[0] * 60)) : '');
  else if (wx >= MAP.x0 && wy >= MAP.y0 && wx < MAP.x1 && wy < MAP.y1) s = placeName(wx, wy);
  // the top line: what is under the mouse, or the city's name
  drawTextOutlined(fitText(s || 'NEW MERIDIAN', W - 30 - textWidth(ck)), 10, 6, s ? C.CREAM : C.PALEY);
  let x = 10; for (const [t, c] of [['YOU', C.WHITE], ['WORK', C.PALEY], ['PHONE', C.CYAN], ['OPEN', C.AMB], ['YOUR BUICK', C.TAN]]) { drawText(t, x, H - 12, c); x += textWidth(t) + 10; }
  drawText('M or ESC to close', W - 12 - textWidth('M or ESC to close'), H - 12, C.ST1);
  drawCursor();
}
