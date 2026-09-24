
// =================================================================== DISPLAY
const QS = new URLSearchParams(location.search);
const DEBUG = QS.get('debug') === '1';
const TURBO = Math.max(1, Math.min(16, +QS.get('turbo') || 1));     // test harness: run the simulation faster
const screen = document.getElementById('screen');
const sctx = screen.getContext('2d');
const off = document.createElement('canvas'); off.width = W; off.height = H;
const octx = off.getContext('2d');
const img = octx.createImageData(W, H);
const px32 = new Uint32Array(img.data.buffer);
const PAL32 = new Uint32Array(256);
PAL_HEX.forEach((h, i) => {
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  PAL32[i] = (255 << 24) | (b << 16) | (g << 8) | r;
});
const view = { scale: 1, ox: 0, oy: 0, dpr: 1 };
function resize() {
  const dpr = window.devicePixelRatio || 1;
  const cw = Math.floor(window.innerWidth * dpr), ch = Math.floor(window.innerHeight * dpr);
  screen.width = cw; screen.height = ch;
  const s = Math.max(1, Math.floor(Math.min(cw / W, ch / H)));
  view.scale = s; view.dpr = dpr; view.ox = Math.floor((cw - W * s) / 2); view.oy = Math.floor((ch - H * s) / 2);
  sctx.imageSmoothingEnabled = false;
}
function present() {
  for (let i = 0; i < W * H; i++) px32[i] = PAL32[fb[i]];
  octx.putImageData(img, 0, 0);
  sctx.fillStyle = '#000'; sctx.fillRect(0, 0, screen.width, screen.height);
  sctx.imageSmoothingEnabled = false;
  sctx.drawImage(off, 0, 0, W, H, view.ox, view.oy, W * view.scale, H * view.scale);
}
window.addEventListener('resize', resize);

// =================================================================== INPUT
const keys = {};
function toLogical(e) {
  const r = screen.getBoundingClientRect();
  const x = ((e.clientX - r.left) * view.dpr - view.ox) / view.scale, y = ((e.clientY - r.top) * view.dpr - view.oy) / view.scale;
  return [clamp(x, 0, W - 1), clamp(y, 0, H - 1)];
}
screen.addEventListener('mousemove', e => {
  const p = toLogical(e); UI.mx = p[0]; UI.my = p[1]; UI.mouseSeen = true; UI.kbMode = false;
});
screen.addEventListener('contextmenu', e => e.preventDefault());
screen.addEventListener('mousedown', e => {
  e.preventDefault(); screen.focus(); audioInit();
  const p = toLogical(e); UI.mx = p[0]; UI.my = p[1]; UI.mouseSeen = true; UI.kbMode = false;
  if (e.button === 2) rightClick(); else if (e.button === 0) leftClick();
});
screen.addEventListener('wheel', e => { if (UI.note) { const L = noteLayout(); UI.notePage = (UI.notePage + (e.deltaY > 0 ? 1 : L.pages - 1)) % L.pages; } }, { passive: true });
window.addEventListener('keydown', e => {
  audioInit();
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'tab'].indexOf(k) >= 0) e.preventDefault();
  if (!keys[k]) onKey(k, e);
  keys[k] = true;
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

function overlayOpen() { return UI.help || UI.menu || S.doc || UI.note || S.choice; }
function leftClick() {
  if (G.mode === 'title') { titleClick(); return; }
  if (G.mode === 'end') { endClick(); return; }
  if (UI.help) { UI.help = false; return; }
  if (UI.menu) { const i = menuAt(UI.mx, UI.my); if (i >= 0) menuPick(i); return; }
  if (S.doc) { S.doc = null; sfx('page'); return; }
  if (UI.note) { noteClick(UI.mx, UI.my, false); return; }
  if (S.choice) { const i = choiceAt(UI.mx, UI.my); if (i >= 0) chooseOption(i); return; }
  if (S.speech) { skipSpeech(); return; }
  if (scriptBusy()) return;
  if (UI.invY > -18 && UI.my < UI.invY + 23) { invClick(false); return; }
  const hs = UI.hoverHs;
  if (hs) {
    if (hs === FRANK_HS) { if (G.sel) { const it = G.sel; G.sel = null; run(ITEMS[it].self ? ITEMS[it].self() : lookItem(it)); } else run(FRANK_HS.use()); return; }
    interact(hs, G.sel ? { item: G.sel } : 'use'); return;
  }
  if (G.sel) { G.sel = null; return; }
  walkToScreen(UI.mx, UI.my);
}
function rightClick() {
  if (G.mode !== 'play') { leftClick(); return; }
  if (UI.help) { UI.help = false; return; }
  if (UI.menu) { UI.menu = false; return; }
  if (S.doc) { S.doc = null; return; }
  if (UI.note) { noteClick(UI.mx, UI.my, true); return; }
  if (S.choice) return;
  if (S.speech) { skipSpeech(); return; }
  if (scriptBusy()) return;
  if (G.sel) { G.sel = null; return; }
  if (UI.invY > -18 && UI.my < UI.invY + 23) { invClick(true); return; }
  const hs = UI.hoverHs;
  if (hs) { if (hs === FRANK_HS) run(FRANK_HS.look ? lookCmds(FRANK_HS) : FRANK_HS.use()); else interact(hs, 'look'); }
}
function lookItem(id) { const it = ITEMS[id]; const l = typeof it.look === 'function' ? it.look() : it.look; return Array.isArray(l) ? l : [['say', 'frank', l]]; }
function invClick(right) {
  for (const b of INV_BTNS) if (UI.mx >= b.x && UI.mx < b.x + b.w) {
    if (b.id === 'note') openNotebook(); else UI.menu = true;
    return;
  }
  const i = invSlotAt(UI.mx, UI.my); if (i < 0) return;
  const id = G.inv[i];
  if (right) { run(lookItem(id)); return; }
  if (G.sel && G.sel !== id) { useItemOnItem(G.sel, id); G.sel = null; return; }
  if (G.sel === id) { G.sel = null; return; }
  if (ITEMS[id].use && !ITEMS[id].useOn) { run(ITEMS[id].use()); return; }      // self-contained items (open, read)
  G.sel = id; sfx('tick');
}
function useItemOnItem(a, b) {
  const A = ITEMS[a], B = ITEMS[b];
  if (A.on && A.on[b]) run(A.on[b]());
  else if (B.on && B.on[a]) run(B.on[a]());
  else run([['say', 'frank', "They don't go together."]]);
}
function screenToFloor(mx, my) {
  const sx = mx + Math.round(cam.x) + 0.5, sy = my + Math.round(cam.y) + 0.5;
  const a = sx / TW, b = sy / TH;
  return [(a + b) / 2, (b - a) / 2];
}
function walkToScreen(mx, my) {
  const p = screenToFloor(mx, my), fr = ACT.frank;
  walkTo(fr, p[0], p[1]);
  clickMark.x = p[0]; clickMark.y = p[1]; clickMark.t = 24;
}
const clickMark = { x: 0, y: 0, t: 0 };

function onKey(k, e) {
  if (G.mode === 'title') { titleKey(k); return; }
  if (G.mode === 'end') { endKey(k); return; }
  if (k === 'escape') {
    if (UI.help) UI.help = false; else if (UI.menu) UI.menu = false; else if (S.doc) S.doc = null; else if (UI.note) closeNotebook();
    else if (G.sel) G.sel = null; else if (UI.invPinned) UI.invPinned = false; else if (!S.choice) { UI.menu = true; UI.menuSel = 0; }
    return;
  }
  if (UI.help) { UI.help = false; return; }
  if (UI.menu) {
    if (k === 'arrowup' || k === 'w') UI.menuSel = (UI.menuSel + MENU_ITEMS.length - 1) % MENU_ITEMS.length;
    else if (k === 'arrowdown' || k === 's') UI.menuSel = (UI.menuSel + 1) % MENU_ITEMS.length;
    else if (k === 'enter' || k === ' ' || k === 'e') menuPick(UI.menuSel);
    return;
  }
  if (S.doc) { if (k === 'enter' || k === ' ' || k === 'e' || k === 'q') S.doc = null; return; }
  if (UI.note) { noteKey(k); return; }
  if (S.choice) {
    const n = parseInt(k, 10);
    if (n >= 1 && n <= S.choice.opts.length) { chooseOption(n - 1); return; }
    if (k === 'arrowup' || k === 'w') S.choice.hover = (S.choice.hover + S.choice.opts.length - 1) % S.choice.opts.length;
    else if (k === 'arrowdown' || k === 's') S.choice.hover = (S.choice.hover + 1) % S.choice.opts.length;
    else if ((k === 'enter' || k === ' ' || k === 'e') && S.choice.hover >= 0) chooseOption(S.choice.hover);
    return;
  }
  if (S.speech && (k === ' ' || k === 'enter' || k === 'e' || k === '.')) { skipSpeech(); return; }
  if (scriptBusy()) return;
  if (k === 'n') { openNotebook(); return; }
  if (k === 'i') { UI.invPinned = !UI.invPinned; UI.kbInv = 0; UI.kbMode = true; return; }
  if (UI.invPinned) {
    if (k === 'arrowleft' || k === 'a') UI.kbInv = Math.max(0, (UI.kbInv || 0) - 1);
    else if (k === 'arrowright' || k === 'd') UI.kbInv = Math.min(G.inv.length - 1, (UI.kbInv || 0) + 1);
    else if ((k === 'e' || k === 'enter' || k === ' ') && G.inv.length) {
      const id = G.inv[UI.kbInv || 0];
      if (G.sel && G.sel !== id) { useItemOnItem(G.sel, id); G.sel = null; UI.invPinned = false; }
      else if (ITEMS[id].use && !ITEMS[id].useOn) { run(ITEMS[id].use()); UI.invPinned = false; }
      else { G.sel = id; UI.invPinned = false; toast('Now pick what to use it on (Tab, E).'); }
    } else if (k === 'q' && G.inv.length) run(lookItem(G.inv[UI.kbInv || 0]));
    else if (k === 'arrowup' || k === 'arrowdown' || k === 'w' || k === 's') UI.invPinned = false;   // walking away closes the bar
    return;
  }
  if (k === 'tab') { UI.kbMode = true; UI.focusIdx++; return; }
  if (k === 'e' || k === ' ' || k === 'enter') {
    UI.kbMode = true;
    const hs = UI.focus;
    if (hs) interact(hs, G.sel ? { item: G.sel } : 'use');
    return;
  }
  if (k === 'q') { UI.kbMode = true; if (UI.focus) interact(UI.focus, 'look'); return; }
  if (k === 'f1' || k === 'h') { UI.help = true; return; }
}
function noteKey(k) {
  if (k === 'n') { closeNotebook(); return; }
  const L = noteLayout(); const ids = L.items.map(i => i.id);
  if (!ids.length) return;
  let i = ids.indexOf(UI.noteHover);
  if (k === 'arrowdown' || k === 's') i = (i + 1) % ids.length;
  else if (k === 'arrowup' || k === 'w') i = (i + ids.length - 1) % ids.length;
  else if (k === 'arrowright' || k === 'd' || k === 'arrowleft' || k === 'a') {
    const it = L.items[Math.max(0, i)], other = L.items.filter(o => !!o.ded !== !!it.ded);
    if (other.length) { let best = other[0]; for (const o of other) if (Math.abs(o.y - it.y) < Math.abs(best.y - it.y)) best = o; i = ids.indexOf(best.id); }
  } else if (k === 'enter' || k === ' ' || k === 'e') {
    const it = L.items[Math.max(0, i)]; noteClick(it.x + 2, it.y + 2, false); return;
  } else if (k === 'q') { const it = L.items[Math.max(0, i)]; noteClick(it.x + 2, it.y + 2, true); return; }
  UI.noteHover = ids[Math.max(0, i)]; UI.noteMsg = '';
}

// =================================================================== UPDATE
function keyMove() {
  if (scriptBusy() || overlayOpen() || UI.invPinned) return false;
  let vx = 0, vy = 0;
  if (keys.w || keys.arrowup) { vx -= 1; vy -= 1; }
  if (keys.s || keys.arrowdown) { vx += 1; vy += 1; }
  if (keys.a || keys.arrowleft) { vx -= 1; vy += 1; }
  if (keys.d || keys.arrowright) { vx += 1; vy -= 1; }
  if (!vx && !vy) return false;
  UI.kbMode = true;
  const fr = ACT.frank, d = Math.hypot(vx, vy), st = fr.speed * DT;
  const nx = fr.x + vx / d * st, ny = fr.y + vy / d * st, gr = room.grid;
  fr.path = []; fr.onArrive = null;
  if (walkable(gr, nx, ny)) { fr.x = nx; fr.y = ny; }
  else if (walkable(gr, nx, fr.y)) fr.x = nx;
  else if (walkable(gr, fr.x, ny)) fr.y = ny;
  fr.dir = dirFromVec(vx, vy, fr.dir); fr.anim = 'walk'; fr.dist += st;
  if (room.onStep) room.onStep(fr);
  return true;
}
function update() {
  tick++;
  if (UI.toast && --UI.toastT <= 0) UI.toast = null;
  if (G.mode === 'title') { titleUpdate(); return; }
  if (G.mode === 'end') { endUpdate(); return; }
  if (UI.menu || UI.help) return;
  updateScript();
  updateOverlays();
  const moved = keyMove();
  for (const a of actors) if (!(a === ACT.frank && moved)) updateActor(a);
  if (!moved && ACT.frank.anim === 'walk' && !ACT.frank.path.length) ACT.frank.anim = 'idle';
  // footsteps
  const fr = ACT.frank;
  if (fr.anim === 'walk') { const st = Math.floor(fr.dist / 0.6); if (st !== fr._lastStep) { fr._lastStep = st; sfx('step'); } }
  if (room.update) room.update();
  if (room.onStep && fr.path.length) room.onStep(fr);
  updateCamera(false);
  updateInventory();
  // keyboard focus
  if (UI.kbMode && !scriptBusy()) {
    UI.focusList = hotspotsNearFrank(2.6);
    UI.focus = UI.focusList.length ? UI.focusList[UI.focusIdx % UI.focusList.length] : null;
  } else if (!UI.kbMode) UI.focus = null;
  if (clickMark.t > 0) clickMark.t--;
}

// =================================================================== RENDER
function render() {
  if (G.mode === 'title') { drawTitle(); drawCursor(); present(); return; }
  if (G.mode === 'end') { drawEnd(); drawCursor(); present(); return; }
  const cx = Math.round(cam.x), cy = Math.round(cam.y);
  copyRoom(cx, cy);
  if (room.drawBack) room.drawBack(cx, cy);
  applyReflections();
  if (room.props) for (const p of room.props) if (!p.cond || p.cond()) drawStampLive(p.x, p.y, p.z || 0, p.rows, p.key, p.hot ? HS(room, p.hot) : 0, cx, cy, p.flip);
  drawActors(cx, cy);
  if (room.drawFront) room.drawFront(cx, cy);
  if (clickMark.t > 0 && !scriptBusy()) {
    const sx = toScreenX(clickMark.x, clickMark.y), sy = toScreenY(clickMark.x, clickMark.y, 0), r = Math.round((24 - clickMark.t) / 6) + 1;
    pset(sx - r, sy, C.CRS); pset(sx + r, sy, C.CRS); pset(sx, sy - (r >> 1), C.CRS); pset(sx, sy + (r >> 1), C.CRS);
  }
  if (DEBUG) debugOverlay(cx, cy);
  if (room.post) room.post(cx, cy);
  grain();
  // hover detection uses the frame just drawn
  UI.hoverHs = null; UI.hoverItem = null; UI.hoverBtn = null;
  if (!overlayOpen() && G.mode === 'play' && UI.mouseSeen && !UI.kbMode) {
    if (UI.invY > -18 && UI.my < UI.invY + 23) {
      const i = invSlotAt(UI.mx, UI.my); if (i >= 0) UI.hoverItem = G.inv[i];
      for (const b of INV_BTNS) if (UI.mx >= b.x && UI.mx < b.x + b.w) UI.hoverBtn = b;
    } else UI.hoverHs = hotspotById(hb[Math.floor(UI.my) * W + Math.floor(UI.mx)]);
  }
  if (S.choice && UI.mouseSeen && !UI.kbMode) S.choice.hover = choiceAt(UI.mx, UI.my);
  if (UI.note && !UI.kbMode) UI.noteHover = noteAt(UI.mx, UI.my);
  drawSpeech();
  drawHoverLabel();
  drawNotify();
  drawInventory();
  if (UI.invPinned && G.inv.length) { const i = UI.kbInv || 0; rectOutline(INV_X0 + i * INV_SLOT - 1, Math.round(UI.invY) + 2, 18, 19, C.GLOW); const nm = ITEMS[G.inv[i]].name; drawTextOutlined(nm, clamp(INV_X0 + i * INV_SLOT + 8 - (textWidth(nm) >> 1), 2, W - textWidth(nm) - 2), 28, C.CREAM); }
  drawLetterbox();
  drawChoices();
  if (UI.note) drawNotebook();
  if (S.doc) drawDoc();
  drawToast();
  applyFade();
  if (!UI.note && !S.doc && !UI.menu) drawCaption();
  if (UI.menu) drawMenu();
  if (UI.help) drawHelp();
  drawCursor();
  present();
}
// very sparse film grain on the darkest colours
const GRN = new Uint8Array(256); [[0, 1], [1, 0], [2, 1], [11, 12], [22, 1], [27, 26], [28, 2], [40, 1], [44, 1], [48, 0], [13, 2]].forEach(p => { GRN[p[0]] = p[1] + 1; });
function grain() {
  const seed = (tick / 5) | 0;
  for (let k = 0; k < 400; k++) {
    const p = hashi(seed, k * 7 + 1) * 57600 >>> 16;
    const g = GRN[fb[p]]; if (g) fb[p] = g - 1;
  }
}
function debugOverlay(cx, cy) {
  const gr = room.grid;
  for (let j = 0; j < gr.gh; j++) for (let i = 0; i < gr.gw; i++) {
    if (!gr.g[j * gr.gw + i]) continue;
    const x = gr.x0 + (i + 0.5) * GRID, y = gr.y0 + (j + 0.5) * GRID;
    pset(toScreenX(x, y), toScreenY(x, y, 0), C.G3);
  }
  room.hotspots.forEach(hs => { const p = hs.at; if (p) pset(toScreenX(p[0], p[1]), toScreenY(p[0], p[1], 0), C.RED); });
  drawText(room.id + ' ' + ACT.frank.x.toFixed(2) + ',' + ACT.frank.y.toFixed(2), 2, H - 10, C.CYAN);
}

// =================================================================== SAVE / LOAD
const SAVE_KEY = 'hourglass_city_act1_v1';
function saveGame() {
  const fr = ACT.frank;
  const data = { G: { flags: G.flags, inv: G.inv, clues: G.clues, deds: G.deds, goal: G.goal, chapter: G.chapter },
                 room: G.roomId, x: fr.x, y: fr.y, dir: fr.dir, visited: Object.keys(ROOMS).filter(k => ROOMS[k].visited) };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); return true; } catch (e) { toast('Could not save (storage unavailable).'); return false; }
}
function savedGame() {
  if (QS.get('nosave') === '1') return null;
  try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; }
}
function loadGame() {
  const d = savedGame(); if (!d || !ROOMS[d.room]) return false;
  resetGame();
  G.flags = d.G.flags || {};
  for (const k in G.flags) if (/_t$/.test(k) && typeof G.flags[k] === 'number') G.flags[k] = tick;   // frame timers restart from the load
  G.inv = d.G.inv || []; G.clues = d.G.clues || []; G.deds = d.G.deds || []; G.goal = d.G.goal || ''; G.chapter = d.G.chapter || 1;
  (d.visited || []).forEach(k => { if (ROOMS[k]) ROOMS[k].visited = true; });
  G.mode = 'play';
  enterRoom(d.room, d.x, d.y, d.dir);
  S.fade = 1; run([['fade', 'in', 0.5]]);
  return true;
}
function resetGame() {
  S.q.length = 0; S.cur = null; S.speech = null; S.choice = null; S.doc = null; S.caption = null; S.lb = S.lbTo = 0;
  G.flags = {}; G.inv = []; G.clues = []; G.deds = []; G.sel = null; G.goal = ''; G.newNotes = 0; G.chapter = 1;
  UI.note = false; UI.menu = false; UI.help = false; UI.invPinned = false;
  for (const k in ROOMS) ROOMS[k].visited = false;
  loopsStopAll(); playSong(false);
}

// =================================================================== MAIN LOOP
const clk = new Float64Array(3); clk[1] = -1;
function frameLoop(now) {
  if (clk[1] < 0) clk[1] = now;
  let dt = (now - clk[1]) / 1000; clk[1] = now;
  if (dt > 0.25) dt = 0.25;
  clk[0] += dt * TURBO;
  let steps = 0;
  while (clk[0] >= DT && steps < 8 * TURBO) { update(); clk[0] -= DT; steps++; }
  if (steps === 8 * TURBO) clk[0] = 0;
  render();
  requestAnimationFrame(frameLoop);
}
function init() {
  resize();
  buildCast();
  for (const id in CAST) ACT[id] = makeActor(id);
  ACT.patronM2 = makeActor('patronM2', 'patronM'); ACT.patronF2 = makeActor('patronF2', 'patronF');
  storyInit();
  if (QS.get('mute') === '1') AUD.muted = true;
  const start = QS.get('room');
  if (start && ROOMS[start]) { G.mode = 'play'; debugStart(start); }
  else toTitle();
  screen.focus();
  requestAnimationFrame(frameLoop);
}
window.__game = { G, S, ACT, ROOMS, ITEMS, CLUES, DEDS, enterRoom, run, interact, connect, get room() { return room; }, get actors() { return actors; }, hotspotById, UI, chooseOption,
                  cam, saveGame, loadGame, keys, newGame, useItemOnItem, lookItem, scriptBusy, get tick() { return tick; } };
init();
