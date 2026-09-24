
// =================================================================== UI STATE
const UI = {
  mx: W / 2, my: H / 2, mouseSeen: false, hoverHs: null, hoverItem: null, hoverBtn: null,
  invOpen: 0, invPinned: false, invY: -24,
  note: false, notePage: 0, noteSel: null, noteMsg: '', noteMsgOk: false, noteHover: null,
  menu: false, menuSel: 0, help: false,
  focus: null, focusList: [], focusIdx: 0, kbMode: false,
  flash: { inv: 0, note: 0, goal: 0 }, toast: null, toastT: 0
};
function uiFlash(k) { UI.flash[k] = 90; }
function toast(text) { UI.toast = text; UI.toastT = 150; }

// =================================================================== CURSOR
const CUR_CROSS = ['...o...', '...c...', '.......', 'oc...co', '.......', '...c...', '...o...'];
const CUR_HOT = ['..ooo..', '.o...o.', 'o..c..o', 'o.ccc.o', 'o..c..o', '.o...o.', '..ooo..'];
const CUR_EXIT = ['...c...', '..ccc..', '.ccccc.', 'ccccccc', '..ccc..', '..ccc..', '..ccc..'];
function drawCursor() {
  if (!UI.mouseSeen || UI.kbMode) return;
  const x = Math.round(UI.mx), y = Math.round(UI.my);
  if (G.sel && ITEMS[G.sel]) { drawIcon(G.sel, x - 7, y - 7, true); }
  const hs = UI.hoverHs;
  let map = CUR_CROSS, col = C.CREAM;
  if (hs) { map = hs.exit ? CUR_EXIT : CUR_HOT; col = hs.exit ? C.CYAN : C.GLOW; }
  if (UI.hoverItem || UI.hoverBtn || UI.note || S.choice || UI.menu) { map = CUR_HOT; col = C.GLOW; }
  let rows = map;
  if (hs && hs.exit && hs.exitDir) rows = rotArrow(hs.exitDir);
  for (let r = 0; r < 7; r++) for (let i = 0; i < 7; i++) {
    const ch = rows[r][i]; if (ch === '.') continue;
    const px = x - 3 + i, py = y - 3 + r;
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
      const qx = px + ox, qy = py + oy;
      if (qx < 0 || qy < 0 || qx >= W || qy >= H) continue;
      const rr = r + oy, ii = i + ox;
      if (rr >= 0 && rr < 7 && ii >= 0 && ii < 7 && rows[rr][ii] !== '.') continue;
      fb[qy * W + qx] = C.BLK;
    }
  }
  for (let r = 0; r < 7; r++) for (let i = 0; i < 7; i++) { const ch = rows[r][i]; if (ch !== '.') pset(x - 3 + i, y - 3 + r, ch === 'o' ? C.INK : col); }
}
const ARROWS = {};
function rotArrow(d) {
  if (ARROWS[d]) return ARROWS[d];
  const src = CUR_EXIT, out = [];
  for (let r = 0; r < 7; r++) {
    let row = '';
    for (let i = 0; i < 7; i++) {
      let sr = r, si = i;
      if (d === 'down') { sr = 6 - r; } else if (d === 'left') { sr = i; si = r; } else if (d === 'right') { sr = 6 - i; si = r; }
      row += src[sr][si];
    }
    out.push(row);
  }
  ARROWS[d] = out; return out;
}

// =================================================================== ICONS
function drawIcon(id, x, y, ghost) {
  const it = ITEMS[id]; if (!it || !it.icon) return;
  const rows = it.icon, key = it.key || ICON_KEY;
  for (let r = 0; r < rows.length; r++) for (let i = 0; i < rows[r].length; i++) {
    const ch = rows[r][i]; if (ch === '.' || ch === ' ') continue;
    const c = key[ch]; if (c === undefined) continue;
    if (ghost && bay(x + i, y + r) < 0.25) continue;
    pset(x + i, y + r, c);
  }
}
const ICON_KEY = { o: C.BLK, i: C.INK, w: C.WHITE, c: C.CREAM, s: C.CRS, p: C.STL, t: C.TAN, T: C.TANL, b: C.BRN, d: C.DBR,
  r: C.RED, R: C.CRIM, x: C.OX, g: C.G2, G: C.G3, n: C.NBL, N: C.NBD, y: C.BRASS, Y: C.PALEY, k: C.S0, K: C.S1, l: C.S2, L: C.S3,
  v: C.VIO, a: C.AMB, h: C.GLOW, m: C.SKM, M: C.SKL, q: C.PLUM, e: C.ST1, E: C.ST2, f: C.ST0 };

// =================================================================== SPEECH
function speakerAnchor(who) {
  const a = ACT[who];
  if (a && actors.indexOf(a) >= 0) return [toScreenX(a.x, a.y), toScreenY(a.x, a.y, 0) - (CAST_DEFS[a.id] ? CAST_DEFS[a.id].h : 30) - 6 + (a.sink || 0) - Math.round((a.z || 0) * ZH)];
  const v = VOICES[who];
  if (v) {
    if (v.anchor) { const q = v.anchor(); return [toScreenX(q[0], q[1]), toScreenY(q[0], q[1], q[2])]; }
    return [W / 2, 40];
  }
  return [W / 2, 40];
}
function drawSpeech() {
  const sp = S.speech; if (!sp) return;
  const col = whoColor(sp.who);
  const lines = sp.lines, n = lines.length;
  if (sp.who === 'narr') {
    const y0 = S.lb > 0.5 ? 4 : 8;
    for (let i = 0; i < n; i++) { const w = textWidth(lines[i]); drawTextOutlined(lines[i], Math.round((W - w) / 2), y0 + i * LINE_H, col); }
    return;
  }
  const an = speakerAnchor(sp.who);
  let top = an[1] - n * LINE_H;
  const minTop = Math.max(3, letterboxH() + 2);
  if (top < minTop) top = minTop;
  if (top + n * LINE_H > H - 4) top = H - 4 - n * LINE_H;
  let maxW = 0; for (const l of lines) maxW = Math.max(maxW, textWidth(l));
  let cx = clamp(an[0], maxW / 2 + 4, W - maxW / 2 - 4);
  for (let i = 0; i < n; i++) { const w = textWidth(lines[i]); drawTextOutlined(lines[i], Math.round(cx - w / 2), top + i * LINE_H, col); }
  const v = VOICES[sp.who];
  if (v && v.tag) { const w = textWidth(v.tag); drawTextOutlined(v.tag, Math.round(cx - w / 2), top - LINE_H, C.CRS); }
}

// =================================================================== HOVER LABEL + FOCUS
function hoverLabelText() {
  if (UI.hoverItem) {
    const it = ITEMS[UI.hoverItem];
    if (G.sel && G.sel !== UI.hoverItem) return 'Use ' + ITEMS[G.sel].name + ' with ' + it.name;
    return it.name;
  }
  if (UI.hoverBtn) return UI.hoverBtn.label;
  const hs = UI.kbMode ? UI.focus : UI.hoverHs;
  if (!hs) return G.sel ? 'Use ' + ITEMS[G.sel].name + ' on...' : '';
  const nm = typeof hs.name === 'function' ? hs.name() : hs.name;
  if (G.sel) return 'Use ' + ITEMS[G.sel].name + ' on ' + nm;
  return nm;
}
function drawHoverLabel() {
  if (S.choice || UI.note || UI.menu || S.doc || scriptBusy()) return;
  const t = hoverLabelText(); if (!t) return;
  const w = textWidth(t);
  let x, y;
  if (UI.kbMode && UI.focus) {
    const p = focusPoint(UI.focus);
    x = p[0] - w / 2; y = p[1] - 14;
    // focus marker
    const fx = Math.round(p[0]), fy = Math.round(p[1]);
    const blink = (tick >> 4) & 1;
    pset(fx, fy - 3 - blink, C.GLOW); pset(fx - 1, fy - 4 - blink, C.GLOW); pset(fx + 1, fy - 4 - blink, C.GLOW);
  } else if (UI.hoverItem || UI.hoverBtn) { x = UI.mx - w / 2; y = UI.invY + 26; }
  else { x = UI.mx - w / 2; y = UI.my - 16; }
  x = clamp(Math.round(x), 2, W - w - 2); y = clamp(Math.round(y), 2, H - 12);
  drawTextOutlined(t, x, y, UI.kbMode ? C.GLOW : C.CREAM);
}
// screen point for a hotspot (keyboard focus marker)
function focusPoint(hs) {
  if (hs.actor) { const a = ACT[hs.actor]; return [toScreenX(a.x, a.y), toScreenY(a.x, a.y, 0) - 34]; }
  const p = hs.mark || hs.pos || hs.at;
  return [toScreenX(p[0], p[1]), toScreenY(p[0], p[1], p[2] || (hs.mark ? p[2] : 0.8))];
}
function hotspotsNearFrank(maxD) {
  const fr = ACT.frank, out = [];
  room.hotspots.forEach(hs => {
    if (!hsVisible(hs) || hs.noFocus) return;
    const p = hs.pos || hs.at; if (!p) return;
    const d = Math.hypot(p[0] - fr.x, p[1] - fr.y);
    if (d <= maxD) out.push([d, hs]);
  });
  actors.forEach(a => { if (a !== fr && room.people && room.people[a.id]) { const d = Math.hypot(a.x - fr.x, a.y - fr.y); if (d <= maxD) out.push([d, room.people[a.id]]); } });
  out.sort((p, q) => p[0] - q[0]);
  return out.map(o => o[1]);
}

// =================================================================== INVENTORY BAR
const INV_SLOT = 18, INV_X0 = 34;
function invSlotAt(mx, my) {
  if (my < UI.invY + 3 || my > UI.invY + 20) return -1;
  const i = Math.floor((mx - INV_X0) / INV_SLOT);
  if (i < 0 || i >= G.inv.length || mx < INV_X0) return -1;
  return i;
}
const INV_BTNS = [{ id: 'note', x: 4, w: 24, label: 'Notebook (N)' }, { id: 'menu', x: W - 22, w: 18, label: 'Menu (Esc)' }];
function drawInventory() {
  const y = Math.round(UI.invY);
  if (y <= -24) return;
  remapRect(0, y, W, 23, DIM);
  hline(0, W - 1, y + 22, C.ST1); hline(0, W - 1, y + 23, C.BLK);
  // notebook button
  const nb = UI.flash.note > 0 && ((tick >> 3) & 1) ? C.GLOW : C.TAN;
  fillRect(7, y + 4, 12, 15, C.BRN); rectOutline(7, y + 4, 12, 15, C.INK); fillRect(9, y + 6, 8, 11, nb === C.GLOW ? C.PALEY : C.CREAM);
  for (let k = 0; k < 4; k++) hline(10, 15, y + 8 + k * 2, C.CRS);
  vline(8, y + 5, y + 17, C.DBR);
  if (G.newNotes) { fillRect(19, y + 3, 5, 5, C.RED); drawText('' , 20, y + 3, C.WHITE); }
  // slots
  for (let i = 0; i < G.inv.length; i++) {
    const sx = INV_X0 + i * INV_SLOT;
    rectOutline(sx, y + 3, 16, 17, G.sel === G.inv[i] ? C.GLOW : C.ST0);
    if (G.sel !== G.inv[i]) drawIcon(G.inv[i], sx + 1, y + 4);
  }
  // menu button
  const mx = W - 20;
  for (let k = 0; k < 3; k++) hline(mx, mx + 10, y + 7 + k * 4, C.CREAM);
}
function updateInventory() {
  const want = UI.invPinned || (UI.mouseSeen && !UI.kbMode && UI.my < 5 && G.mode === 'play' && !scriptBusy()) ||
               (UI.invOpen && UI.my < 30 && !UI.kbMode);
  UI.invOpen = want ? 1 : 0;
  if (scriptBusy() && !UI.invPinned) UI.invOpen = 0;
  UI.invY += ((UI.invOpen ? 0 : -24) - UI.invY) * 0.3;
  if (Math.abs(UI.invY) < 0.5) UI.invY = 0;
  for (const k in UI.flash) if (UI.flash[k] > 0) UI.flash[k]--;
}

// =================================================================== DIALOGUE CHOICES
function choiceLayout() {
  const ch = S.choice; if (!ch) return null;
  const lines = [];
  ch.opts.forEach((o, i) => {
    const wr = wrapText((i + 1) + '. ' + o.t, W - 24);
    wr.forEach((l, k) => lines.push({ text: k ? '   ' + l : l, opt: i }));
  });
  const h = lines.length * LINE_H + 8;
  return { lines, y0: H - h, h };
}
function drawChoices() {
  const L = choiceLayout(); if (!L) return;
  remapRect(0, L.y0, W, L.h, DIM);
  hline(0, W - 1, L.y0, C.ST1);
  L.lines.forEach((ln, k) => {
    const hov = ln.opt === S.choice.hover;
    drawTextShadow(ln.text, 10, L.y0 + 5 + k * LINE_H, hov ? C.GLOW : C.CREAM);
  });
}
function choiceAt(mx, my) {
  const L = choiceLayout(); if (!L || my < L.y0) return -1;
  const k = Math.floor((my - L.y0 - 4) / LINE_H);
  if (k < 0 || k >= L.lines.length) return -1;
  return L.lines[k].opt;
}

// =================================================================== NOTEBOOK
const NB = { x: 8, y: 6, w: 304, h: 168, perCol: 10 };
function noteEntries() { return { clues: G.clues.slice(), deds: G.deds.slice() }; }
function noteLayout() {
  const e = noteEntries(), out = [];
  const page = UI.notePage, per = NB.perCol;
  const cl = e.clues.slice(page * per, page * per + per), dd = e.deds.slice(page * per, page * per + per);
  cl.forEach((id, i) => out.push({ id, x: NB.x + 10, y: NB.y + 34 + i * LINE_H, w: 140 }));
  dd.forEach((id, i) => out.push({ id, x: NB.x + 158, y: NB.y + 34 + i * LINE_H, w: 140, ded: true }));
  const pages = Math.max(1, Math.ceil(Math.max(e.clues.length, e.deds.length) / per));
  return { items: out, pages };
}
function drawNotebook() {
  remapRect(0, 0, W, H, DIM);
  const x = NB.x, y = NB.y, w = NB.w, h = NB.h;
  fillRect(x + 2, y + 2, w, h, C.BLK);
  fillRect(x, y, w, h, C.STL);
  rectOutline(x, y, w, h, C.BRN);
  for (let yy = y + 32; yy < y + h - 24; yy += LINE_H) for (let xx = x + 4; xx < x + w - 4; xx++) if (((xx + yy) & 1) === 0) pset(xx, yy + 9, C.CREAM);
  vline(x + w / 2, y + 24, y + h - 36, C.CRS);
  vline(x + 1 + w / 2, y + 24, y + h - 36, C.TANL);
  drawText('CASE: ' + (G.caseTitle || 'EVELYN HART'), x + 10, y + 5, C.OX);
  const goal = G.goal ? 'NOW: ' + G.goal : '';
  let gl = goal;
  if (textWidth(gl) > w - 20) { while (textWidth(gl + '...') > w - 20) gl = gl.slice(0, -1); gl += '...'; }
  if (gl) drawText(gl, x + 10, y + 15, C.INK);
  drawText('CLUES', x + 10, y + 25, C.BRN); drawText('DEDUCTIONS', x + 158, y + 25, C.BRN);
  const L = noteLayout();
  for (const it of L.items) {
    const sel = UI.noteSel === it.id, hov = UI.noteHover === it.id;
    if (sel) fillRect(it.x - 2, it.y - 1, it.w, LINE_H, C.PALEY);
    else if (hov) fillRect(it.x - 2, it.y - 1, it.w, LINE_H, C.CREAM);
    let t = entryTitle(it.id);
    while (textWidth(t) > it.w - 6) t = t.slice(0, -2) + '.';
    drawText(t, it.x, it.y, it.ded ? C.OX : C.INK);
  }
  if (!G.clues.length) drawText('Nothing yet.', x + 10, y + 34, C.CRS);
  if (L.pages > 1) drawText('< ' + (UI.notePage + 1) + '/' + L.pages + ' >', x + w / 2 - 14, y + h - 34, C.BRN);
  // footer: hovered entry detail or last message
  fillRect(x, y + h - 24, w, 24, C.CREAM); hline(x, x + w - 1, y + h - 24, C.CRS);
  let foot = UI.noteMsg, fcol = UI.noteMsgOk ? C.OX : C.INK;
  if (UI.noteHover && !UI.noteMsg) { foot = entryText(UI.noteHover); fcol = C.INK; }
  if (!foot) foot = UI.noteSel ? 'Now pick a second entry to connect it with.' : 'Click two entries to connect them. N or Esc to close.';
  const fl = wrapText(foot, w - 16);
  for (let i = 0; i < Math.min(2, fl.length); i++) drawText(fl[i], x + 8, y + h - 21 + i * LINE_H, fcol);
  // close box
  drawText('x', x + w - 10, y + 3, C.BRN);
}
function noteAt(mx, my) {
  const L = noteLayout();
  for (const it of L.items) if (mx >= it.x - 2 && mx < it.x - 2 + it.w && my >= it.y - 1 && my < it.y - 1 + LINE_H) return it.id;
  return null;
}
function noteClick(mx, my, right) {
  if (mx >= NB.x + NB.w - 14 && my < NB.y + 14) { closeNotebook(); return; }
  const L = noteLayout();
  if (L.pages > 1 && my >= NB.y + NB.h - 36 && my < NB.y + NB.h - 24) {
    if (mx < NB.x + NB.w / 2) UI.notePage = (UI.notePage + L.pages - 1) % L.pages; else UI.notePage = (UI.notePage + 1) % L.pages;
    return;
  }
  const id = noteAt(mx, my);
  if (!id) { UI.noteSel = null; UI.noteMsg = ''; return; }
  if (right) { UI.noteMsg = entryText(id); UI.noteMsgOk = false; return; }
  if (!UI.noteSel) { UI.noteSel = id; UI.noteMsg = ''; sfx('tick'); return; }
  if (UI.noteSel === id) { UI.noteSel = null; UI.noteMsg = ''; return; }
  const r = connect(UI.noteSel, id);
  UI.noteMsg = r.text; UI.noteMsgOk = r.ok; UI.noteSel = null;
  if (!r.ok) sfx('nope');
}
function openNotebook() { UI.note = true; UI.noteSel = null; UI.noteMsg = ''; G.newNotes = 0; UI.invPinned = false; sfx('page'); }
function closeNotebook() { UI.note = false; UI.noteSel = null; UI.noteMsg = ''; sfx('page'); }

// =================================================================== DOCUMENTS
const DOCS = {};        // id -> {title, lines[], paper, ink, sig}
function drawDoc() {
  const d = DOCS[S.doc]; if (!d) return;
  remapRect(0, 0, W, H, DIM);
  const lines = []; for (const p of d.text) for (const l of wrapText(p, (d.w || 200) - 24)) lines.push(l);
  const w = d.w || 200, h = Math.max(60, lines.length * LINE_H + 30 + (d.sig ? 12 : 0));
  const x = Math.round((W - w) / 2), y = Math.round((H - h) / 2);
  fillRect(x + 3, y + 3, w, h, C.BLK);
  fillRect(x, y, w, h, d.paper || C.CREAM);
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (hash(xx, yy) < 0.03) pset(xx, yy, C.STL);
  if (d.crest) drawCrest(x + w - 22, y + 6, d.paper || C.CREAM);
  if (d.title) drawText(d.title, x + 12, y + 8, d.ink || C.INK);
  lines.forEach((l, i) => drawText(l, x + 12, y + (d.title ? 20 : 10) + i * LINE_H, d.ink || C.INK));
  if (d.sig) drawText(d.sig, x + w - 12 - textWidth(d.sig), y + h - 16, d.ink || C.INK);
  const hint = 'click to put it away';
  drawTextOutlined(hint, Math.round((W - textWidth(hint)) / 2), y + h + 5, C.CRS);
}
// blind-embossed crest: visible only as a faint relief
function drawCrest(x, y, paper) {
  const rows = ['..ooooo..', '.o.....o.', 'o..o.o..o', 'o...o...o', 'o..ooo..o', 'o...o...o', '.o.....o.', '..ooooo..'];
  for (let r = 0; r < rows.length; r++) for (let i = 0; i < 9; i++) if (rows[r][i] === 'o') { pset(x + i, y + r, C.CRS); pset(x + i + 1, y + r + 1, C.WHITE); }
}

// =================================================================== CAPTIONS, FADES, LETTERBOX
function drawCaption() {
  if (!S.caption) return;
  const a = S.capT < 20 ? S.capT / 20 : S.capT > S.capDur ? 1 - (S.capT - S.capDur) / 30 : 1;
  if (a < 0.5 && ((tick >> 1) & 1)) return;
  const lines = S.caption.split('\n');
  const y0 = Math.max(10, letterboxH() + 6);
  lines.forEach((l, i) => { const w = textWidth(l); drawTextOutlined(l, Math.round((W - w) / 2), y0 + i * LINE_H, i ? C.CRS : C.PALEY); });
}
function applyFade() {
  const f = S.fade; if (f <= 0) return;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = y * W + x, k = Math.floor(f * 4 + bay(x, y) - 0.001);
    if (k >= 4) { fb[p] = C.BLK; continue; }
    let c = fb[p]; for (let i = 0; i < k; i++) c = SHD[c];
    fb[p] = c;
  }
}
function letterboxH() { return Math.round(S.lb * 20); }        // text near the edges keeps clear of the bars as they slide in
function drawLetterbox() {
  const h = letterboxH();
  if (h > 0) { fillRect(0, 0, W, h, C.BLK); fillRect(0, H - h, W, h, C.BLK); }
}
// overlay timers run on the fixed game step, so captions last as long on a 144 Hz screen as on a 60 Hz one;
// they pause with the script while the menu is open (toasts keep counting down: see update())
function updateOverlays() {
  S.lb += (S.lbTo - S.lb) * 0.08;
  if (Math.abs(S.lb - S.lbTo) < 0.01) S.lb = S.lbTo;
  if (S.caption && ++S.capT > S.capDur + 30) S.caption = null;
}
function drawToast() {
  if (!UI.toast) return;
  const w = textWidth(UI.toast);
  drawTextOutlined(UI.toast, Math.round((W - w) / 2), H - 14, C.PALEY);
}
// small notification when a clue / deduction / item is added
function drawNotify() {
  if (UI.flash.note > 0 && !UI.note) {
    const t = 'Notebook updated (N)';
    if ((UI.flash.note >> 3) & 1 || UI.flash.note > 60) drawTextOutlined(t, W - textWidth(t) - 4, H - 12 - letterboxH(), C.PALEY);
  }
  if (UI.flash.goal > 0 && G.goal && !UI.note) {
    const lines = wrapText('Goal: ' + G.goal, W - 8), y0 = H - 2 - lines.length * LINE_H - letterboxH() - (UI.flash.note > 0 ? 10 : 0);
    if (UI.flash.goal > 20 || ((UI.flash.goal >> 2) & 1)) lines.forEach((l, i) => drawTextOutlined(l, 4, y0 + i * LINE_H, C.CRS));
  }
}

// =================================================================== MENU / HELP
const MENU_ITEMS = [
  { id: 'resume', t: 'Resume' }, { id: 'save', t: 'Save game' }, { id: 'load', t: 'Load game' },
  { id: 'sound', t: () => 'Sound: ' + (AUD.muted ? 'off' : 'on') }, { id: 'help', t: 'Controls' }, { id: 'title', t: 'Quit to title' }
];
function menuText(m) { return typeof m.t === 'function' ? m.t() : m.t; }
function drawMenu() {
  remapRect(0, 0, W, H, DIM);
  const w = 120, h = MENU_ITEMS.length * 13 + 22, x = (W - w) >> 1, y = (H - h) >> 1;
  fillRect(x, y, w, h, C.BLK); rectOutline(x, y, w, h, C.ST1);
  drawText('PAUSED', x + (w - textWidth('PAUSED')) / 2, y + 6, C.PALEY);
  MENU_ITEMS.forEach((m, i) => {
    const t = menuText(m), sel = UI.menuSel === i;
    drawText(t, x + (w - textWidth(t)) / 2, y + 20 + i * 13, sel ? C.GLOW : C.CREAM);
    if (sel) { drawText('>', x + 8, y + 20 + i * 13, C.GLOW); }
  });
}
function menuAt(mx, my) {
  const w = 120, h = MENU_ITEMS.length * 13 + 22, x = (W - w) >> 1, y = (H - h) >> 1;
  if (mx < x || mx > x + w) return -1;
  const i = Math.floor((my - y - 18) / 13);
  return i >= 0 && i < MENU_ITEMS.length ? i : -1;
}
function menuPick(i) {
  const m = MENU_ITEMS[i]; if (!m) return;
  sfx('tick');
  if (m.id === 'resume') UI.menu = false;
  else if (m.id === 'save') { saveGame(); toast('Game saved.'); UI.menu = false; }
  else if (m.id === 'load') { if (loadGame()) { toast('Game loaded.'); UI.menu = false; } else toast('No saved game.'); }
  else if (m.id === 'sound') { AUD.muted = !AUD.muted; audioApplyMute(); }
  else if (m.id === 'help') { UI.help = true; }
  else if (m.id === 'title') { UI.menu = false; toTitle(); }
}
const HELP_LINES = [
  'MOUSE', 'Left click: walk, use, talk, pick up', 'Right click: look at something', 'Top edge: inventory. Click an item,',
  '  then click what to use it on.', '',
  'KEYBOARD', 'WASD / arrows: walk     E / Space: use', 'Q: look     Tab: next nearby thing', 'I: inventory     N: notebook',
  '1-4: dialogue     Esc: menu', '', 'Click Frank himself if you are stuck.'
];
function drawHelp() {
  remapRect(0, 0, W, H, DIM);
  const w = 230, h = HELP_LINES.length * 10 + 16, x = (W - w) >> 1, y = (H - h) >> 1;
  fillRect(x, y, w, h, C.BLK); rectOutline(x, y, w, h, C.ST1);
  HELP_LINES.forEach((l, i) => drawText(l, x + 10, y + 8 + i * 10, (l === 'MOUSE' || l === 'KEYBOARD') ? C.PALEY : C.CREAM));
}
