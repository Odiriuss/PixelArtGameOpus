// =================================================================== THE INVENTORY: THE PAPER DOLL, THE BAG, WHATEVER ELSE IS OPEN
// Left: Frank and what he wears, a box per slot. Middle: the bag. Right: the other thing (a drawer, a body, the
// trunk, the floor). At a counter the counter's list takes the left and middle and the bag moves to the right.
// Drag with the left button; the right button uses, wears, takes or sells. The world waits while this is open.
const CELL = 12;
const UI = { mode: null, K: null, shop: null, rows: null, drag: null, hover: null, msg: '', msgT: 0, scroll: 0, down: false, took: false };
const BAGXY = [110, 17], OTHERXY = [216, 17], ROWS = { x0: 5, x1: 209, y: 17, h: 11, n: 11 };
function uiLayout() { BAGXY[0] = UI.rows ? 216 : 110; }
const DOLL = { hat: [8, 17, 26, 13], coat: [8, 33, 26, 38], suit: [8, 75, 26, 26], shoes: [8, 104, 26, 13], side: [70, 17, 26, 13], melee: [70, 33, 13, 38],
  throw: [85, 33, 13, 24], gloves: [85, 60, 13, 11], belt: [70, 75, 26, 13], long: [38, 122, 58, 13] };
const SLOT_NAMES = { hat: 'HAT', coat: 'COAT', suit: 'SUIT', shoes: 'SHOES', gloves: 'GLOVES', belt: 'BELT', side: 'SIDEARM', long: 'LONG GUN', melee: 'CLOSE WORK', throw: 'THROWN' };
const QUICK_OF = { side: 1, long: 2, melee: 3, throw: 4 };
function uiMsg(t) { UI.msg = t; UI.msgT = 150; }
// a word for the player: on the screen he is looking at
function tell(t) { if (UI.mode === 'inv') uiMsg(t); else toast(t); }
function openInventory() { UI.mode = 'inv'; UI.K = null; UI.shop = null; UI.rows = null; UI.took = false; }
function openContainer(K) {
  if (!K.grid) fillContainer(K);
  UI.mode = 'inv'; UI.K = K; UI.shop = null; UI.rows = null; UI.took = false; sfx('clunk');
  if (K.kind === 'vault') vaultAlarm(K);
}
function closeUI() {
  if (UI.drag) returnDrag();
  UI.mode = null; UI.K = null; UI.shop = null; UI.rows = null;
  for (let i = DROPS.length - 1; i >= 0; i--) if (!DROPS[i].grid.items.length) DROPS.splice(i, 1);
  autoQuick(); playerStats(); clearPressed(); INPUT.mdown = false;
}
// taking what is not his: the first thing taken from somebody else's drawer is a theft, if anybody sees
function mineK(K) { return !K || K.owner === 'frank' || K.kind === 'drop' || K.kind === 'trunk' || K.kind === 'stash'; }
function tookFrom(K) { if (UI.took || mineK(K)) return; UI.took = true; crimeWitness('theft'); }
// ------------------------------------------------------------------ what is under the mouse
function gridCell(G, gx, gy, mx, my) { const cx = Math.floor((mx - gx) / CELL), cy = Math.floor((my - gy) / CELL); return cx >= 0 && cy >= 0 && cx < G.w && cy < G.h ? [cx, cy] : null; }
function slotAt(mx, my) { for (const s in DOLL) { const [x, y, w, h] = DOLL[s]; if (mx >= x && my >= y && mx < x + w && my < y + h) return s; } return null; }
function otherGrid() { return UI.K && !UI.shop ? UI.K.grid : null; }
function uiHit(mx, my) {
  const B = gridCell(INV.grid, BAGXY[0], BAGXY[1], mx, my); if (B) return { where: 'bag', G: INV.grid, c: B, e: gridAt(INV.grid, B[0], B[1]) };
  const G = otherGrid(); if (G) { const c = gridCell(G, OTHERXY[0], OTHERXY[1], mx, my); if (c) return { where: 'other', G, c, e: gridAt(G, c[0], c[1]) }; }
  if (UI.rows) {
    const r = rowAt(mx, my); if (r >= 0) return { where: 'row', row: UI.rows[r] };
    if (mx >= 4 && mx < 210 && my >= 4 && my < 140) return { where: 'panel' };
    return null;
  }
  const s = slotAt(mx, my); if (s) return { where: 'slot', slot: s, it: INV.equip[s] };
  if (UI.K && mx >= OTHERXY[0] - 3 && my >= 4 && my < 140) return { where: 'panel' };
  return null;
}
function rowAt(mx, my) {
  if (mx < ROWS.x0 || mx > ROWS.x1 || my < ROWS.y) return -1;
  const k = Math.floor((my - ROWS.y) / ROWS.h), i = k + UI.scroll;
  return k < ROWS.n && i < UI.rows.length ? i : -1;
}
// ------------------------------------------------------------------ one tick of the screen
function uiTick() {
  if (UI.msgT > 0) UI.msgT--;
  if (UI.mode === 'map') { mapTick(); return; }
  if (UI.mode === 'jobs') { jobsUiTick(); return; }
  if (pressed('Escape') || pressed('KeyI') || pressed('Tab') || (pressed('KeyE') && !UI.drag)) { closeUI(); return; }
  uiLayout();
  if (UI.rows && INPUT.wheel) { UI.scroll = clamp(UI.scroll + Math.sign(INPUT.wheel), 0, Math.max(0, UI.rows.length - ROWS.n)); INPUT.wheel = 0; }
  const mx = INPUT.mx, my = INPUT.my, h = uiHit(mx, my), shift = INPUT.keys.ShiftLeft || INPUT.keys.ShiftRight;
  UI.hover = h;
  if (INPUT.clicks > 0 && !UI.drag && h) {
    if (h.where === 'row') { if (!h.row.dim || h.row.always) h.row.act(); }
    else if (h.where === 'bag' && h.e) { if (shift && otherGrid()) moveTo(h.e.it, INV.grid, otherGrid()); else startDrag(h.e.it, { G: INV.grid, x: h.e.x, y: h.e.y }, h.c[0] - h.e.x, h.c[1] - h.e.y); }
    else if (h.where === 'other' && h.e) { tookFrom(UI.K); if (shift) moveTo(h.e.it, h.G, INV.grid); else startDrag(h.e.it, { G: h.G, x: h.e.x, y: h.e.y, K: UI.K }, h.c[0] - h.e.x, h.c[1] - h.e.y); }
    else if (h.where === 'slot' && h.it) { startDrag(h.it, { slot: h.slot }, 0, 0); INV.equip[h.slot] = null; }
    else if (h.where === 'panel' && UI.K && UI.K.cash > 0 && my > cashRowY() - 2 && my < cashRowY() + 10) takeCash();
  }
  if (INPUT.rclicks > 0 && !UI.drag && h) {
    if (h.where === 'bag' && h.e) { if (UI.shop) sellItem(h.e.it); else useFromBag(h.e.it); }
    else if (h.where === 'other' && h.e) { tookFrom(UI.K); moveTo(h.e.it, h.G, INV.grid); }
    else if (h.where === 'slot' && h.it) { if (!unequip(h.slot)) uiMsg('No room in the bag.'); }
  }
  if (UI.drag && !INPUT.mdown) dropDrag(h);
  INPUT.clicks = 0; INPUT.rclicks = 0;
}
function useFromBag(it) {
  const I = ITEMS[it.key];
  if (!I.heal && !I.calm && !I.slot) { uiMsg('Nothing to do with that here.'); return; }
  if (!useItem(it) && I.slot) uiMsg('No room in the bag for what you had on.');
}
function startDrag(it, from, ox, oy) { if (from.G) gridRemove(from.G, it); UI.drag = { it, from, ox, oy }; sfx('tick'); }
function returnDrag() {
  const D = UI.drag; UI.drag = null; if (!D) return;
  if (D.from.slot) { INV.equip[D.from.slot] = D.it; autoQuick(); playerStats(); return; }
  if (gridFits(D.from.G, D.it, D.from.x, D.from.y)) gridPlace(D.from.G, D.it, D.from.x, D.from.y); else if (gridAdd(D.from.G, D.it)) dropItem(D.it, FRANK.x, FRANK.y, FRANK.F);
}
function dropDrag(h) {
  const D = UI.drag, it = D.it, I = ITEMS[it.key];
  const place = (G, c) => {
    const x = c[0] - D.ox, y = c[1] - D.oy, e = gridAt(G, c[0], c[1]);
    if (e && e.it.key === it.key && I.stack && e.it.n < I.stack) { const k = Math.min(I.stack - e.it.n, it.n); e.it.n += k; it.n -= k; if (it.n <= 0) { UI.drag = null; return true; } return false; }
    if (gridFits(G, it, x, y)) { gridPlace(G, it, x, y); UI.drag = null; return true; }
    return false;
  };
  let ok = false;
  if (!h) { UI.drag = null; dropItem(it, FRANK.x, FRANK.y, FRANK.F); uiMsg('Dropped.'); sfx('clunk'); ok = true; }
  else if (h.where === 'bag' || h.where === 'other') ok = place(h.G, h.c);
  else if (h.where === 'slot') { if (I.slot === h.slot) { const old = INV.equip[h.slot]; INV.equip[h.slot] = it; UI.drag = null; if (old && gridAdd(INV.grid, old)) dropItem(old, FRANK.x, FRANK.y, FRANK.F); sfxF('holster'); ok = true; } else uiMsg('That doesn\'t go there.'); }
  else if ((h.where === 'panel' || h.where === 'row') && UI.shop) { UI.drag = null; returnToBag(it); sellItem(it); ok = true; }
  if (!ok) returnDrag();
  autoQuick(); playerStats(); updateFrankLook();
}
function returnToBag(it) { if (gridAdd(INV.grid, it)) dropItem(it, FRANK.x, FRANK.y, FRANK.F); }
function moveTo(it, from, to) {
  gridRemove(from, it);
  const left = gridAdd(to, it);
  if (left) { gridAdd(from, left); uiMsg('No room.'); return false; }
  autoQuick(); playerStats(); sfx('tick'); return true;
}
function cashRowY() { const G = otherGrid(); return OTHERXY[1] + (G ? G.h * CELL : 0) + 4; }
function takeCash() { tookFrom(UI.K); giveMoney(UI.K.cash); uiMsg('You pocket ' + money(UI.K.cash) + '.'); UI.K.cash = 0; sfx('coin'); }
