// =================================================================== THE INVENTORY, DRAWN
// Three panels over the dimmed street and a line of words under them. Whatever the mouse is on (or carries) is
// described at the bottom, and the numbers under the bag show what wearing it would change, green for better.
const STAT_ROWS = [
  ['ARMOR', P => P.armor, v => String(v), 1, false], ['STEALTH', P => P.stealth, v => Math.round(v * 100) + '%', 1, true],
  ['NOISE', P => P.noiseMul, v => Math.round(v * 100) + '%', -1, true], ['CHARM', P => P.charm, v => (v > 0 ? '+' : '') + v, 1, false],
  ['PICKS', P => P.lockpick, v => v ? Math.round(v * 100) + '%' : '-', 1, true]
];
const MOD_TEXT = { armor: v => 'ARMOR ' + signed(v), stealth: v => 'STEALTH ' + signedPct(v), noise: v => 'NOISE ' + signedPct(v), speed: v => 'SPEED ' + signedPct(v),
  charm: v => 'CHARM ' + signed(v), conceal: () => 'HIDES A GUN', lockpick: v => 'PICKS ' + signedPct(v), prints: () => 'NO PRINTS', draw: () => 'QUICK DRAW',
  scanner: () => 'HEARS THE POLICE BAND', pry: () => 'PRIES THINGS OPEN' };
function signed(v) { return (v > 0 ? '+' : '') + v; }
function signedPct(v) { return (v > 0 ? '+' : '') + Math.round(v * 100) + '%'; }
function fitText(s, w) { while (s.length > 1 && textWidth(s) > w) s = s.slice(0, -1); return s; }
function hoverItem() { const h = UI.hover; return UI.drag ? UI.drag.it : h ? (h.e ? h.e.it : h.it || (h.row && h.row.item) || null) : null; }
// Frank's numbers if he wore (or carried) this instead; null when it would change nothing
function statsWith(it) {
  const I = ITEMS[it.key]; if (!I.mods || (!I.slot && I.cat !== 'tool')) return null;
  if (I.slot ? INV.equip[I.slot] === it : INV.bag.some(e => e.it.key === it.key)) return null;
  let Q;
  if (I.slot) { const old = INV.equip[I.slot]; INV.equip[I.slot] = it; Q = Object.assign({}, playerStats()); INV.equip[I.slot] = old; }
  else { INV.bag.push({ it, x: -9, y: -9 }); Q = Object.assign({}, playerStats()); INV.bag.pop(); }
  playerStats(); return Q;
}
// one line of what a thing does, in numbers
function specLine(it) {
  const I = ITEMS[it.key], G = I.gun && GUNS[I.gun];
  if (G && G.kind === 'gun') return 'HITS ' + G.dmg + (G.pellets ? 'x' + G.pellets : '') + '   RANGE ' + G.range + '   HOLDS ' + G.mag + '   ' + ITEMS[G.ammo].name.toUpperCase() + (G.auto ? '   AUTOMATIC' : '');
  if (G && G.kind === 'melee') return 'HITS ' + G.dmg + '   REACH ' + G.reach + (G.ko ? '   KNOCKS THEM OUT' : '') + (G.bleed ? '   THEY BLEED' : '') + (G.noise <= 4 ? '   QUIET' : '');
  if (G) return G.fire ? 'SETS A FIRE WHERE IT BREAKS' : 'FIVE SECONDS OF FUSE, THEN A HOLE IN THINGS';
  if (I.mods) return Object.keys(I.mods).map(k => MOD_TEXT[k](I.mods[k])).join('   ');
  if (I.heal) return 'HEALS ' + I.heal + (I.drunk ? '   GOES TO YOUR HEAD' : '');
  if (I.cat === 'ammo') { const g = Object.keys(ITEMS).filter(k => ITEMS[k].gun && GUNS[ITEMS[k].gun].ammo === it.key); return g.length ? 'FITS THE ' + g.map(k => ITEMS[k].name.toUpperCase()).join(', ') : ''; }
  return '';
}
// ------------------------------------------------------------------ the pieces
function header(x, y, w, left, right, cl, cr) {
  const rw = right ? textWidth(right) + 6 : 0;
  drawTextOutlined(fitText(left, w - rw), x, y, cl);
  if (right) drawTextOutlined(right, x + w - textWidth(right), y, cr);
}
function drawGrid(G, gx, gy) {
  fillRect(gx - 1, gy - 1, G.w * CELL + 1, G.h * CELL + 1, C.BLK);
  for (let j = 0; j < G.h; j++) for (let i = 0; i < G.w; i++) fillRect(gx + i * CELL, gy + j * CELL, CELL - 1, CELL - 1, (i + j) & 1 ? C.ST0 : C.INK);
  const hot = UI.hover && UI.hover.G === G && UI.hover.e;
  for (const e of G.items) {
    const I = ITEMS[e.it.key], x = gx + e.x * CELL, y = gy + e.y * CELL, w = I.w * CELL - 1, h = I.h * CELL - 1;
    fillRect(x, y, w, h, e === hot ? C.S1 : e.it === INV.quick[4] ? C.PLUM : I.illegal ? C.OX : C.S0);
    drawIcon(e.it, x, y, w, h);
  }
}
function drawDoll() {
  panel(4, 4, 100, 136);
  header(8, 5, 92, 'CALDER', clockText(), C.CREAM, C.ST2);
  const f = FRANK.cast.front.idle[0], sx0 = 52 - SPR_AX, sy0 = 112 - SPR_BY;
  for (let r = 0; r < SPR_H; r++) for (let i = 0; i < SPR_W; i++) { const c = f[r * SPR_W + i]; if (c !== T) pset(sx0 + i, sy0 + r, c); }
  for (const s in DOLL) {
    const [x, y, w, h] = DOLL[s], it = INV.equip[s], hot = UI.hover && UI.hover.slot === s, can = UI.drag && ITEMS[UI.drag.it.key].slot === s;
    fillRect(x - 1, y - 1, w + 2, h + 2, can ? C.PALEY : hot ? C.CREAM : C.BLK); fillRect(x, y, w, h, C.INK);
    if (it) drawIcon(it, x, y, w, h); else drawGhost(s, x, y, w, h);
    if (QUICK_OF[s]) drawTiny(String(QUICK_OF[s]), x + 1, y + 1, PLAYER.slot === QUICK_OF[s] - 1 && PLAYER.drawn ? C.PALEY : C.ST2, C.BLK);
  }
}
function drawStats(x, y, it) {
  const P = Object.assign({}, playerStats()), Q = it ? statsWith(it) : null;
  STAT_ROWS.forEach(([lab, get, fmt, better, pct], i) => {
    const yy = y + i * 9, v = get(P), s = fmt(v);
    drawText(lab, x, yy, C.ST2); drawText(s, x + 96 - textWidth(s), yy, C.CREAM);
    const d = Q ? get(Q) - v : 0; if (Math.abs(d) < 1e-6) return;
    const ds = pct ? signedPct(d) : signed(Math.round(d * 100) / 100);
    drawText(ds, x + 72 - textWidth(ds), yy, d * better > 0 ? C.GRNL : C.CORAL);
  });
}
function drawBag(it) {
  const x = BAGXY[0];
  panel(x - 3, 4, 103, 136);
  header(x, 5, 96, 'BAG', money(INV.money), C.PALEY, C.PALEY);
  drawGrid(INV.grid, x, BAGXY[1]);
  drawStats(x, BAGXY[1] + INV.grid.h * CELL + 4, it);
}
function drawOther() {
  const K = UI.K, x = OTHERXY[0];
  panel(x - 3, 4, 103, 136);
  header(x, 5, 96, K.name || '', '', C.PALEY);
  drawGrid(K.grid, x, OTHERXY[1]);
  if (K.cash > 0) { const y = cashRowY(), hot = UI.hover && UI.hover.where === 'panel' && INPUT.my > y - 2 && INPUT.my < y + 10; drawText(money(K.cash) + ' IN CASH', x, y, hot ? C.PALEY : C.GRNL); drawText('CLICK', x + 96 - textWidth('CLICK'), y, C.ST2); }
  if (!mineK(K) && !UI.took) drawText('NOT YOURS', x, 128, C.CORAL);
}
function drawRows() {
  panel(4, 4, 206, 136);
  const n = UI.rows.length, more = n > ROWS.n;
  header(8, 5, 198, UI.title || '', more ? (UI.scroll + 1) + '-' + Math.min(n, UI.scroll + ROWS.n) + ' OF ' + n : clockText(), C.PALEY, C.ST2);
  UI.rows.slice(UI.scroll, UI.scroll + ROWS.n).forEach((r, k) => {
    const y = ROWS.y + k * ROWS.h, hot = UI.hover && UI.hover.row === r, tx = r.item ? 21 : 8;
    if (hot) fillRect(ROWS.x0, y, ROWS.x1 - ROWS.x0, ROWS.h, C.ST0);
    if (r.item) { fillRect(8, y, 10, 10, C.INK); drawIcon(r.item, 8, y, 10, 10, true); }
    const p = r.price !== undefined ? money(r.price) : '', pw = p ? textWidth(p) + 6 : 0;
    drawText(fitText(r.label, 205 - tx - pw), tx, y + 2, r.dim ? C.ST1 : hot ? C.PALEY : C.CREAM);
    if (p) drawText(p, 205 - textWidth(p), y + 2, r.dim ? C.ST1 : INV.money >= r.price ? C.GRNL : C.CORAL);
  });
}
// ------------------------------------------------------------------ the words at the bottom
function helpLines() {
  const S = UI.shop && SHOPS[UI.shop.stock];
  if (UI.shop && !S) return ['CLICK a line to put money in or take it out.', 'ESC to close.'];
  if (S) return [(S.service ? 'CLICK to pay.' : 'CLICK a line to buy.') + (S.buys ? '   RIGHT CLICK your things to sell them.' : '   They buy nothing here.'), 'ESC to close.'];
  if (UI.K) return ['DRAG to move.   RIGHT CLICK to take.   SHIFT CLICK to move.', 'Drag a thing off the panels to drop it.   ESC to close.'];
  return ['DRAG to move.   RIGHT CLICK to use or put on.', 'Drag a thing off the panels to drop it.   ESC to close.'];
}
function infoNote(it, h) {
  const I = ITEMS[it.key];
  if (h && h.row) { const n = I.stack ? gridCount(INV.grid, it.key) : 0; return n ? 'YOU HAVE ' + n : ''; }
  if (UI.shop && SHOPS[UI.shop.stock] && SHOPS[UI.shop.stock].buys && !UI.drag) { const v = sellPrice(it); return v === null ? 'HE WON\'T BUY IT' : 'HE GIVES ' + money(v); }
  const v = itemValue(it); return v > 0 ? 'WORTH ' + money(v) : '';
}
function drawInfo(it) {
  panel(4, 143, W - 8, 34);
  const h = UI.hover, L = [];
  if (it) {
    const I = ITEMS[it.key], note = infoNote(it, h), title = itemName(it).toUpperCase() + (it.gun ? '   ' + it.gun.ammo + ' OF ' + it.gun.G.mag + ' LOADED' : '');
    header(8, 145, W - 16, title, note, I.illegal ? C.CORAL : C.CREAM, C.ST2);
    const spec = specLine(it); if (spec) L.push([fitText(spec, W - 16), C.ST2]);
    for (const l of wrapText(I.desc, W - 16)) L.push([l, C.CRS]);
  } else if (h && h.row) { drawText(fitText(h.row.label, W - 16), 8, 145, C.CREAM); if (h.row.note) L.push([h.row.note, C.CRS]); }
  else if (h && h.where === 'slot') { drawText(SLOT_NAMES[h.slot], 8, 145, C.CREAM); L.push(['Empty. Drag one here, or right-click it in the bag.', C.CRS]); }
  else { const [a, b] = helpLines(); drawText(a, 8, 145, C.ST2); L.push([b, C.ST1]); }
  if (UI.msgT > 0) { L.length = Math.min(L.length, 1); L[1] = [UI.msg, C.PALEY]; }
  L.slice(0, 2).forEach(([s, c], i) => { if (s) drawText(s, 8, 155 + i * LINE_H, c); });
}
function drawInventory() {
  uiLayout();
  remapRect(0, 0, W, H, DIM);
  const it = hoverItem();
  if (UI.rows) drawRows(); else drawDoll();
  drawBag(it);
  if (UI.K && !UI.shop) drawOther();
  drawInfo(it);
  if (UI.drag) { const I = ITEMS[UI.drag.it.key], w = I.w * CELL - 1, h = I.h * CELL - 1, x = Math.round(INPUT.mx) - UI.drag.ox * CELL - 5, y = Math.round(INPUT.my) - UI.drag.oy * CELL - 5; ditherRect(x, y, w, h, SHD, 0.5); drawIcon(UI.drag.it, x, y, w, h); }
  drawCursor();
}
function drawCursor() {
  const x = Math.round(INPUT.mx), y = Math.round(INPUT.my);
  for (let k = 0; k < 6; k++) { pset(x + k, y + k, C.BLK); pset(x, y + k, C.BLK); }
  for (let k = 0; k < 5; k++) { pset(x + k, y + k, C.CREAM); pset(x, y + k, C.CREAM); if (k < 3) pset(x + 1, y + k + 1, C.CREAM); }
}
