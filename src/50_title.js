
// =================================================================== TITLE SCREEN
const titleBuf = new Uint8Array(W * H);
const TITLE = { sel: 0, built: false, t: 0, items: [] };
function drawTextBig(s, x, y, c, sc) {
  for (let i = 0; i < s.length; i++) {
    const k = s.charCodeAt(i), bits = glyphBits[k], w = charW(k);
    if (bits) for (let r = 0; r < FONT_H; r++) for (let q = 0; q < w; q++) if (bits[r * w + q]) fillRect(x + q * sc, y + r * sc, sc, sc, c);
    x += (w + 1) * sc;
  }
}
function textWidthBig(s, sc) { return textWidth(s) * sc + (sc - 1); }
function buildTitle() {
  const b = titleBuf;
  const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) b[y * W + x] = c; };
  // sky: navy to violet near the horizon, dithered bands
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = y / 120 + (vnoise(x / 40, y / 14, 3) - 0.5) * 0.35;
    const ramp = [C.BLK, C.NAV, C.NAV, C.VDK, C.VIO];
    const f = clamp(v * 4, 0, 3.99), i = Math.floor(f), fr = f - i;
    b[y * W + x] = fr > bay(x, y) ? ramp[Math.min(4, i + 1)] : ramp[i];
  }
  // low cloud banks lit from below by the city
  for (let x = 0; x < W; x++) {
    const t1 = 34 + Math.round(vnoise(x / 30, 1, 7) * 10), b1 = t1 + 4 + Math.round(vnoise(x / 18, 2, 8) * 6);
    for (let y = t1; y < b1; y++) put(x, y, y > b1 - 2 && bay(x, y) < 0.5 ? C.MAU : C.VDK);
  }
  // far towers
  const towers = [];
  for (let i = 0; i < 26; i++) {
    const cx = Math.round(hash(i, 91) * 330) - 5, w = 8 + Math.round(hash(i, 92) * 14), top = 70 + Math.round(hash(i, 93) * 40);
    towers.push([cx, w, top]);
  }
  towers.sort((p, q) => q[2] - p[2]);
  for (const [cx, w, top] of towers) for (let y = top; y < 150; y++) {
    const step = Math.floor((y - top) / 8), hw = Math.min(w, 3 + step * 3) >> 1;
    for (let x = cx - hw; x <= cx + hw; x++) put(x, y, x === cx - hw ? C.TW1 : C.TW0);
  }
  // hero tower: stepped art deco spire with an atom emblem
  const hx = 214;
  for (let y = 30; y < 150; y++) {
    const hw = y < 44 ? 1 : y < 60 ? 4 : y < 78 ? 8 : y < 96 ? 12 : 16;
    for (let x = hx - hw; x <= hx + hw; x++) put(x, y, x < hx - hw + 2 ? C.TW1 : (x === hx || (x - hx) % 5 === 0) && y > 60 ? C.TW1 : C.TW0);
  }
  for (let a = 0; a < 3; a++) for (let t = 0; t < 40; t++) {
    const ang = t / 40 * TAU, e = [Math.cos(ang) * 5, Math.sin(ang) * 2], r = a * Math.PI / 3;
    put(Math.round(hx + e[0] * Math.cos(r) - e[1] * Math.sin(r)), Math.round(70 + e[0] * Math.sin(r) + e[1] * Math.cos(r)), C.CYAN);
  }
  put(hx, 70, C.WL); put(hx, 29, C.RED);
  // lit windows
  for (let y = 60; y < 150; y += 2) for (let x = 0; x < W; x += 2) if (b[y * W + x] === C.TW0 && hash(x, y) < 0.09) put(x, y, hash(x, y + 1) < 0.3 ? C.GLOW : C.AMB);
  // elevated line
  for (let x = 0; x < W; x++) { put(x, 128, C.INK); put(x, 129, C.INK); if (x % 22 < 2) for (let y = 130; y < 150; y++) put(x, y, C.INK); }
  // foreground rooftop, water tower, parapet
  for (let y = 150; y < H; y++) for (let x = 0; x < W; x++) put(x, y, y === 150 ? C.ST0 : C.BLK);
  for (let y = 108; y < 150; y++) for (let x = 20; x < 46; x++) { const leg = (x === 22 || x === 43) && y > 130; if (y < 131 || leg) put(x, y, y < 131 ? (x < 24 ? C.ST0 : C.INK) : C.INK); }
  for (let x = 18; x < 48; x++) put(x, 108, C.INK);
  for (let x = 24; x < 42; x++) put(x, 104 + Math.round(Math.abs(x - 33) / 3), C.INK);
  TITLE.built = true;
}
function toTitle() {
  G.mode = 'title'; TITLE.sel = 0; TITLE.t = 0;
  if (!TITLE.built) buildTitle();
  TITLE.items = [{ id: 'new', t: 'New game' }];
  if (savedGame()) TITLE.items.unshift({ id: 'cont', t: 'Continue' });
  TITLE.items.push({ id: 'help', t: 'Controls' });
  setAmbience(0.7, 1, 0, 0);
  S.fade = 0; S.lb = S.lbTo = 1;
}
function titleUpdate() { TITLE.t++; }
function drawTitle() {
  fb.set(titleBuf);
  const t = TITLE.t;
  // searchlights
  for (let k = 0; k < 2; k++) {
    const base = k ? 250 : 90, ang = -Math.PI / 2 + Math.sin(t / 300 + k * 2) * 0.5;
    for (let d = 10; d < 140; d++) {
      const x = Math.round(base + Math.cos(ang) * d), y = Math.round(128 + Math.sin(ang) * d), wd = 1 + (d >> 5);
      for (let o = -wd; o <= wd; o++) if (bay(x + o, y) < 0.35 * (1 - d / 140)) pset(x + o, y, fb[y * W + x + o] === C.BLK ? C.NAV : LIT[fb[y * W + x + o]]);
    }
  }
  // a pale green light crossing the harbour, now and then
  const lt = t % 1400;
  if (lt < 260) {
    const x = Math.round(-20 + lt * 1.4), y = Math.round(26 + lt * 0.08);
    for (let k = 0; k < 60; k++) { const tx = x - k, ty = y - Math.round(k * 0.08); if (bay(tx, ty) < 1 - k / 60) pset(tx, ty, k < 3 ? C.WHITE : k < 20 ? C.GRNL : C.CYD); }
    pset(x + 1, y, C.WHITE);
  }
  // Frank on the roof, from behind, lit by the city
  const f = CAST.frank.back.idle[(t >> 6) & 1];
  for (let r = 0; r < SPR_H; r++) for (let i = 0; i < SPR_W; i++) {
    const c = f[r * SPR_W + i]; if (c === T) continue;
    pset(262 - SPR_AX + i, 150 - SPR_BY + r, c === C.BLK || c === C.INK ? c : SHD[SHD[c]]);
  }
  // rain
  for (let k = 0; k < 140; k++) {
    const x = (hashi(k, 1) + t * 2 * (1 + (k & 1))) % (W + 40) - 20, y = (hashi(k, 2) + t * 6 * (1 + (k & 1))) % H;
    pset(x, y, C.SLT); pset(x - 1, y - 2, C.NAV);
  }
  // title
  const s1 = 'THE HOURGLASS CITY', w1 = textWidthBig(s1, 2);
  drawTextBig(s1, Math.round((W - w1) / 2) + 1, 29, C.BLK, 2);
  drawTextBig(s1, Math.round((W - w1) / 2), 28, C.PALEY, 2);
  const s2 = 'ACT I  -  THE ORDINARY DEAD', w2 = textWidth(s2);
  drawTextOutlined(s2, Math.round((W - w2) / 2), 50, C.CRS);
  // menu
  TITLE.items.forEach((m, i) => {
    const sel = i === TITLE.sel, w = textWidth(m.t);
    drawTextOutlined(m.t, Math.round((W - w) / 2), 102 + i * 12, sel ? C.GLOW : C.CREAM);
    if (sel) drawTextOutlined('>', Math.round((W - w) / 2) - 9, 102 + i * 12, C.GLOW);
  });
  const foot = 'New Meridian, 1957', fw = textWidth(foot);
  drawText(foot, Math.round((W - fw) / 2), H - 12, C.VIO);
  if (UI.help) drawHelp();
  // hover over menu
  if (UI.mouseSeen && !UI.kbMode) { const i = titleItemAt(UI.mx, UI.my); if (i >= 0) TITLE.sel = i; }
}
function titleItemAt(mx, my) {
  const i = Math.floor((my - 100) / 12);
  if (i < 0 || i >= TITLE.items.length) return -1;
  const w = textWidth(TITLE.items[i].t);
  return Math.abs(mx - W / 2) < w / 2 + 12 ? i : -1;
}
function titlePick(i) {
  const m = TITLE.items[i]; if (!m) return;
  sfx('tick');
  if (m.id === 'new') { S.lb = S.lbTo = 0; newGame(); }
  else if (m.id === 'cont') { S.lb = S.lbTo = 0; if (!loadGame()) { toast('No saved game.'); newGame(); } }
  else if (m.id === 'help') UI.help = true;
}
function titleClick() { if (UI.help) { UI.help = false; return; } const i = titleItemAt(UI.mx, UI.my); if (i >= 0) titlePick(i); }
function titleKey(k) {
  if (UI.help) { UI.help = false; return; }
  if (k === 'arrowup' || k === 'w') TITLE.sel = (TITLE.sel + TITLE.items.length - 1) % TITLE.items.length;
  else if (k === 'arrowdown' || k === 's') TITLE.sel = (TITLE.sel + 1) % TITLE.items.length;
  else if (k === 'enter' || k === ' ' || k === 'e') titlePick(TITLE.sel);
  UI.kbMode = true;
}

// =================================================================== END SCREEN
const END = { t: 0, lines: [] };
function endScreenStart() {
  END.t = 0;
  const cl = G.clues.length, dd = G.deds.length, totC = Object.keys(CLUES).length, totD = DEDS.length;
  END.lines = [
    ['END OF ACT I', C.PALEY], ['THE ORDINARY DEAD', C.CRS], ['', 0],
    ['Clues found: ' + cl + ' of ' + totC, C.CREAM], ['Deductions: ' + dd + ' of ' + totD, C.CREAM], ['', 0],
    [flag('russo_hurt') ? 'Russo took a bullet you were warned about.' : 'Russo walked out of the Mirador in one piece.', C.WL],
    [flag('burned_letter') ? 'You burned the letter at midnight.' : 'You kept the letter. It is still in your pocket.', C.GLOW],
    [flag('got_acetate') ? "Evelyn's last rehearsal is in your coat." : "Evelyn's last rehearsal is still at the Blue Comet.", C.NBL], ['', 0],
    ['The case is not closed. The city keeps moving.', C.CRS], ['', 0], ['Thank you for playing.', C.CREAM], ['click to return to the title', C.VIO]
  ];
  setAmbience(0.5, 0.6, 0, 0); loopsStopAll(); playSong(false);
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* storage unavailable */ }
}
function endUpdate() { END.t++; }
function drawEnd() {
  fb.fill(C.BLK);
  for (let k = 0; k < 80; k++) { const x = (hashi(k, 5) + END.t * 2) % W, y = (hashi(k, 6) + END.t * 5) % H; pset(x, y, C.NAV); }
  END.lines.forEach((l, i) => {
    if (!l[0] || END.t < i * 20) return;
    const w = textWidth(l[0]);
    drawText(l[0], Math.round((W - w) / 2), 18 + i * 11, l[1]);
  });
}
function endClick() { if (END.t > 60) toTitle(); }
function endKey() { if (END.t > 60) toTitle(); }
