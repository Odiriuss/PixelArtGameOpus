// =================================================================== HUD: HEALTH, THE CYLINDER, THE SEDAN, ARROWS, THE MAP, WORDS
function bar(x, y, w, h, f, c, back) {
  fillRect(x - 1, y - 1, w + 2, h + 2, C.BLK); fillRect(x, y, w, h, back === undefined ? C.INK : back);
  const n = Math.round(w * clamp(f, 0, 1)); if (n > 0) fillRect(x, y, n, h, c);
  if (n > 0 && h > 2) hline(x, x + n - 1, y, LIT[c]);
}
function drawBig(s, x, y, c, k) {                             // the font at k x k pixels per dot
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i), bits = glyphBits[code], w = glyphW[code];
    if (bits) for (let r = 0; r < FONT_H; r++) for (let q = 0; q < w; q++) if (bits[r * w + q]) fillRect(x + q * k, y + r * k, k, k, c);
    x += (charW(code) + 1) * k;
  }
}
function bigWidth(s, k) { return textWidth(s) * k; }
function centred(s, y, c, oc) { drawTextOutlined(s, Math.round((W - textWidth(s)) / 2), y, c, oc); }
function panel(x, y, w, h) { remapRect(x, y, w, h, DIM); rectOutline(x - 1, y - 1, w + 2, h + 2, C.INK); }
// ------------------------------------------------------------------ the iso minimap (built once)
const MINI = { w: 66, h: 34, s: 0.25, ox: 0, oy: 0, img: null };
function buildMinimap() {
  MINI.ox = -(MAP.x0 - MAP.y1) * MINI.s + 1; MINI.oy = -(MAP.x0 + MAP.y0) * MINI.s * 0.5 + 1;
  MINI.img = new Uint8Array(MINI.w * MINI.h);
  for (let j = 0; j < MINI.h; j++) for (let i = 0; i < MINI.w; i++) {
    const a = (i + 0.5 - MINI.ox) / MINI.s, b = (j + 0.5 - MINI.oy) * 2 / MINI.s, x = (a + b) / 2, y = (b - a) / 2;
    let c = T;
    if (x >= MAP.x0 && y >= MAP.y0 && x < MAP.x1 && y < MAP.y1) {
      const s = surfAt(x, y);
      c = s === 2 ? C.DW : s === 1 ? C.ST0 : C.SLT;
      for (const S of staticsNear(x - 0.1, y - 0.1, x + 0.1, y + 0.1)) if (!S.circle && S.h >= 8 && x >= S.x0 && x < S.x1 && y >= S.y0 && y < S.y1) { c = C.VDK; break; }
    }
    MINI.img[j * MINI.w + i] = c;
  }
}
function miniXY(x, y) { return [Math.round((x - y) * MINI.s + MINI.ox), Math.round((x + y) * MINI.s * 0.5 + MINI.oy)]; }
function drawMinimap() {
  const X = W - MINI.w - 4, Y = 4;
  fillRect(X - 1, Y - 1, MINI.w + 2, MINI.h + 2, C.BLK);
  for (let j = 0; j < MINI.h; j++) for (let i = 0; i < MINI.w; i++) { const c = MINI.img[j * MINI.w + i]; if (c !== T) fb[(Y + j) * W + X + i] = c; }
  const S = MISSION.sedan;
  if (S && !S.gone && (MISSION.phase === 'take' || MISSION.phase === 'chase')) {       // the road ahead of them
    const P = S.ai ? S.ai.path : null;
    if (P) for (let k = S.ai.i; k < P.length - 1; k++) { const n = Math.ceil(segLen(P, k) / 4); for (let q = 0; q < n; q++) { const [mx, my] = miniXY(lerp(P[k][0], P[k + 1][0], q / n), lerp(P[k][1], P[k + 1][1], q / n)); if ((q + k) & 1) pset(X + mx, Y + my, C.OX); } }
  }
  for (const V of VEH) if (!V.gone && V.kin) { const [mx, my] = miniXY(V.x, V.y); pset(X + mx, Y + my, C.G3); pset(X + mx, Y + my + 1, C.G3); }
  for (const p of PEOPLE) if (p.team === 'goons' && p.alive && p.visible) { const [mx, my] = miniXY(p.x, p.y); pset(X + mx, Y + my, C.CORAL); }
  if (S && !S.gone) { const [mx, my] = miniXY(S.x, S.y); if ((tick >> 3) & 1) { pset(X + mx, Y + my, C.RED); pset(X + mx + 1, Y + my, C.RED); pset(X + mx, Y + my + 1, C.RED); pset(X + mx + 1, Y + my + 1, C.RED); } }
  const [fx, fy] = frankPos(), [mx, my] = miniXY(fx, fy);
  pset(X + mx, Y + my, C.WHITE); pset(X + mx - 1, Y + my, C.CREAM); pset(X + mx + 1, Y + my, C.CREAM); pset(X + mx, Y + my - 1, C.CREAM); pset(X + mx, Y + my + 1, C.CREAM);
}
// ------------------------------------------------------------------ the in-game HUD
function drawHud(cx, cy) {
  const M = MISSION, g = FRANK.gun;
  // Frank: health and the cylinder
  drawTextOutlined('CALDER', 4, 3, C.CREAM);
  bar(4, 14, 54, 3, FRANK.hp / FRANK.maxHp, FRANK.hp < 30 ? C.RED : C.CREAM, C.OX);
  for (let k = 0; k < g.G.mag; k++) { const x = 5 + k * 5, full = k < g.ammo && !g.reload; fillRect(x - 1, 20, 4, 5, C.BLK); fillRect(x, 21, 2, 3, full ? C.BRASS : C.ST0); if (full) pset(x, 21, C.PALEY); }
  if (g.reload) { if ((tick >> 3) & 1) drawTextOutlined('RELOADING', 36, 18, C.PALEY); bar(36, 28, 30, 1, 1 - g.reload / g.G.reload, C.PALEY); }
  else if (g.ammo === 0) drawTextOutlined('R', 36, 18, C.CORAL);
  if (PLAYER.car) {
    const V = PLAYER.car;
    drawTextOutlined(V.name, 4, 31, V.hp < V.maxHp * 0.3 ? C.CORAL : C.S2);
    bar(4, 42, 54, 2, V.hp / V.maxHp, V.hp < V.maxHp * 0.3 ? C.CORAL : C.S2);
    const kmh = Math.round(Math.abs(vehFwd(V)) * 2.237);
    drawTextOutlined(kmh + ' MPH', 4, 47, C.S1);
  }
  // the sedan
  const S = M.sedan;
  if (S && !S.gone && (M.phase === 'take' || M.phase === 'chase')) {
    const bw = 90, bx = Math.round((W - bw) / 2);
    const [fx, fy] = frankPos(), d = Math.round(Math.hypot(S.x - fx, S.y - fy));
    drawTextOutlined('BLACK SEDAN', bx, 3, C.CORAL);
    const ds = d + ' M', dw = textWidth(ds); drawTextOutlined(ds, bx + bw - dw, 3, d > 60 ? C.CORAL : C.S2);
    bar(bx, 14, bw, 3, S.hp / S.maxHp, C.RED, C.PLUM);
    if (M.lostT > 0 && ((tick >> 3) & 1)) centred('LOSING THEM  ' + Math.ceil((420 - M.lostT) / 60), 22, C.RED);
    drawOffscreenArrow(S.x, S.y, cx, cy, C.RED);
  }
  if (M.phase === 'fight') {
    const n = goonsLeft(), s = n + (n === 1 ? ' MAN LEFT' : ' MEN LEFT');
    centred(s, 3, C.CORAL);
    for (const p of PEOPLE) if (p.team === 'goons' && p.alive && p.visible) drawOffscreenArrow(p.x, p.y, cx, cy, C.CORAL);
  }
  drawMinimap();
  // prompt over Frank's head
  if (PLAYER.prompt && !M.lockInput) {
    const [fx, fy] = frankPos(), sx = Math.round(isoX(fx, fy)) - cx, sy = Math.round(isoY(fx, fy, 2.4)) - cy - (PLAYER.car ? 8 : 0), w = textWidth(PLAYER.prompt);
    drawTextOutlined(PLAYER.prompt, clamp(sx - (w >> 1), 2, W - w - 2), clamp(sy - 10, 40, H - 40), PLAYER.car ? ((tick >> 3) & 1 ? C.RED : C.PALEY) : C.PALEY);
  }
  drawWords();
  if (!M.lockInput) drawCrosshair();
}
function drawOffscreenArrow(x, y, cx, cy, c) {
  const sx = isoX(x, y) - cx, sy = isoY(x, y, 1) - cy;
  if (sx >= 0 && sy >= 0 && sx < W && sy < H) return;
  const mx = W / 2, my = H / 2, dx = sx - mx, dy = sy - my, k = Math.min((W / 2 - 10) / Math.abs(dx || 1e-3), (H / 2 - 10) / Math.abs(dy || 1e-3));
  const ax = mx + dx * k, ay = my + dy * k, a = Math.atan2(dy, dx);
  for (let r = 0; r < 7; r++) for (let q = -r; q <= r; q++) {
    const u = 6 - r, px = Math.round(ax + Math.cos(a) * u - Math.sin(a) * q * 0.6), py = Math.round(ay + Math.sin(a) * u + Math.cos(a) * q * 0.6);
    pset(px, py, r === 6 || Math.abs(q) === r ? C.BLK : c);
  }
}
function drawCrosshair() {
  const x = Math.round(INPUT.mx), y = Math.round(INPUT.my), hot = !!PLAYER.assist, c = hot ? C.RED : C.CREAM;
  for (const [dx, dy] of [[-4, 0], [-3, 0], [3, 0], [4, 0], [0, -4], [0, -3], [0, 3], [0, 4]]) { pset(x + dx + 1, y + dy + 1, C.BLK); }
  for (const [dx, dy] of [[-4, 0], [-3, 0], [3, 0], [4, 0], [0, -4], [0, -3], [0, 3], [0, 4]]) pset(x + dx, y + dy, c);
  if (hot) { pset(x, y, C.RED); }
}
// captions, subtitles, toasts, the goal
function drawWords() {
  const M = MISSION;
  if (M.caption) {
    const cp = M.caption, n = Math.min(cp.text.length, Math.floor(cp.t / 2)), s = cp.text.slice(0, n);
    if (!(cp.t > cp.dur - 30 && ((tick >> 1) & 1))) { const w = bigWidth(cp.text, 2); drawBig(s, Math.round((W - w) / 2) + 1, 43, C.BLK, 2); drawBig(s, Math.round((W - w) / 2), 42, C.PALEY, 2); }
  }
  if (M.goal && M.t < 300 && M.phase !== 'intro' && !M.caption) centred(M.goal, 60, (tick >> 4) & 1 ? C.CREAM : C.PALEY);
  let y = H - 16;
  const L = M.lines[0];
  if (L) {
    const lines = wrapText(L.who.toUpperCase() + ':  ' + L.text, 280);
    y = H - 6 - lines.length * LINE_H;
    panel(14, y - 3, W - 28, lines.length * LINE_H + 4);
    lines.forEach((l, i) => drawText(l, Math.round((W - textWidth(l)) / 2), y + i * LINE_H, i === 0 && l.indexOf(':') > 0 ? C.CREAM : C.CRS));
    y -= 6;
  }
  for (const t of TOASTS) { y -= LINE_H + 2; centred(t.text, y, C.PALEY); }
}
