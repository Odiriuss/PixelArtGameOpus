// =================================================================== THE BAG, WHAT HE WEARS, THE QUICK SLOTS, MONEY, WHAT IS IN THINGS
// A grid holds items at cell positions; a stackable item tops up a stack of its kind before taking a new cell.
// The car's trunk and the office's filing cabinet are grids too. Containers in the world get their contents the
// first time they are opened, from what kind of thing they are and whose.
function makeGrid(w, h) { return { w, h, items: [] }; }         // items: [{it, x, y}]
const INV = { bag: null, grid: makeGrid(8, 6), equip: { hat: null, coat: null, suit: null, shoes: null, gloves: null, belt: null, side: null, long: null, melee: null, throw: null }, quick: [null, null, null, null, null], money: 0 };
Object.defineProperty(INV, 'bag', { get() { return INV.grid.items; } });
const EQUIP_SLOTS = ['hat', 'coat', 'suit', 'shoes', 'gloves', 'belt', 'side', 'long', 'melee', 'throw'];
function gridFits(G, it, x, y, ignore) {
  const I = ITEMS[it.key];
  if (x < 0 || y < 0 || x + I.w > G.w || y + I.h > G.h) return false;
  for (const e of G.items) {
    if (e.it === ignore || e.it === it) continue;
    const J = ITEMS[e.it.key];
    if (x < e.x + J.w && x + I.w > e.x && y < e.y + J.h && y + I.h > e.y) return false;
  }
  return true;
}
function gridAt(G, cx, cy) { for (const e of G.items) { const J = ITEMS[e.it.key]; if (cx >= e.x && cx < e.x + J.w && cy >= e.y && cy < e.y + J.h) return e; } return null; }
function gridPlace(G, it, x, y) { G.items.push({ it, x, y }); return true; }
function gridRemove(G, it) { const i = G.items.findIndex(e => e.it === it); if (i >= 0) G.items.splice(i, 1); return i >= 0; }
// put an item anywhere it fits (stacks first); returns what did not fit (null if all of it went in)
function gridAdd(G, it) {
  const I = ITEMS[it.key];
  if (I.stack) for (const e of G.items) if (e.it.key === it.key && e.it.n < I.stack) { const k = Math.min(I.stack - e.it.n, it.n); e.it.n += k; it.n -= k; if (it.n <= 0) return null; }
  for (let y = 0; y <= G.h - I.h; y++) for (let x = 0; x <= G.w - I.w; x++) if (gridFits(G, it, x, y)) { gridPlace(G, it, x, y); return null; }
  return it;
}
function gridCount(G, key) { let n = 0; for (const e of G.items) if (e.it.key === key) n += e.it.n; return n; }
function gridTake(G, key, n) {
  let got = 0;
  for (let i = G.items.length - 1; i >= 0 && got < n; i--) {
    const e = G.items[i]; if (e.it.key !== key) continue;
    const k = Math.min(n - got, e.it.n); e.it.n -= k; got += k;
    if (e.it.n <= 0) G.items.splice(i, 1);
  }
  return got;
}
// ------------------------------------------------------------------ Frank's things
function giveItem(key, n) {
  const it = newItem(key, n), left = gridAdd(INV.grid, it);
  if (left) { dropItem(left, FRANK.x, FRANK.y, FRANK.F); toast('No room. It\'s on the floor.'); }
  autoQuick(); playerStats();
  return it;
}
function ammoCount(type) { return gridCount(INV.grid, type); }
function takeAmmo(type, n) { return gridTake(INV.grid, type, n); }
function giveMoney(v) { INV.money = Math.round((INV.money + v) * 100) / 100; if (v > 0) STATS.earned = (STATS.earned || 0) + v; }
function money(v) { return '$' + (Math.round(v * 100) / 100).toFixed(v % 1 ? 2 : 0); }
// wearing and holding: an item goes from the bag to its slot (whatever was there goes back to the bag)
function equipItem(it) {
  const I = ITEMS[it.key], s = I.slot; if (!s) return false;
  const old = INV.equip[s];
  gridRemove(INV.grid, it);
  INV.equip[s] = it;
  if (old) { const left = gridAdd(INV.grid, old); if (left) { INV.equip[s] = old; gridRemove(INV.grid, it); gridAdd(INV.grid, it); return false; } }
  autoQuick(); playerStats(); updateFrankLook();
  return true;
}
function unequip(slot) {
  const it = INV.equip[slot]; if (!it) return false;
  if (gridAdd(INV.grid, it)) return false;
  INV.equip[slot] = null; autoQuick(); playerStats(); updateFrankLook();
  return true;
}
// the quick slots follow what is worn: 1 sidearm, 2 long gun, 3 club or blade, 4 something to throw, 5 something to heal with
function autoQuick() {
  const Q = INV.quick;
  Q[0] = INV.equip.side; Q[1] = INV.equip.long; Q[2] = INV.equip.melee; Q[3] = INV.equip.throw;
  if (!Q[4] || !INV.bag.some(e => e.it === Q[4])) { const e = INV.bag.find(e => ITEMS[e.it.key].heal); Q[4] = e ? e.it : null; }
  if (PLAYER.slot >= 0 && !Q[PLAYER.slot]) { PLAYER.slot = -1; PLAYER.drawn = false; }
  frankArm();
}
// what Frank has in his hands right now: the gun object the rest of the game fires
function frankArm() {
  if (!FRANK) return;
  const it = PLAYER.slot >= 0 ? INV.quick[PLAYER.slot] : null, I = it && ITEMS[it.key];
  let g;
  if (!I || I.cat !== 'weapon' || !PLAYER.drawn) g = FIST_GUN;
  else if (it.gun) g = it.gun;
  else { it.melee = it.melee || makeGun(I.gun); g = it.melee; }
  g.owner = FRANK; FRANK.gun = g;
  const hold = PLAYER.drawn ? (g.G.hold || 'pistol') : 'none';
  if (FRANK.hold !== hold) { FRANK.hold = hold; FRANK.cast = castFor('frank', hold); }
}
const FIST_GUN = makeGun('fists');
function useItem(it) {
  const I = ITEMS[it.key];
  if (I.heal) {
    if (FRANK.hp >= FRANK.maxHp && !I.drunk) { tell('You feel fine.'); return false; }
    FRANK.hp = Math.min(FRANK.maxHp, FRANK.hp + I.heal); sfxF('use');
    if (I.drunk) { FRANK.drunk = (FRANK.drunk || 0) + 60 * 90; tell('That hit the spot.'); }
  } else if (I.calm) { PLAYER.calm = 999; tell('You light one up.'); }
  else if (I.slot) return equipItem(it);
  else return false;
  it.n--; if (it.n <= 0) gridRemove(INV.grid, it);
  autoQuick(); playerStats();
  return true;
}
function updateFrankLook() { /* the paper doll: hats and coats change the figure's colours */ if (FRANK) frankArm(); }
// ------------------------------------------------------------------ things lying about: dropped, or on a body
const DROPS = [];                                               // {x, y, z, F, grid}
function dropItem(it, x, y, F) {
  let D = DROPS.find(d => d.F === (F || null) && Math.hypot(d.x - x, d.y - y) < 0.8);
  if (!D) { D = { x, y, F: F || null, grid: makeGrid(6, 4), name: 'ON THE FLOOR', kind: 'drop' }; DROPS.push(D); }
  if (gridAdd(D.grid, it)) { D.grid.h++; gridAdd(D.grid, it); }
  return D;
}
// ------------------------------------------------------------------ what is in things: loot by kind of container and kind of place
const LOOT = {
  desk:     [['letter', 0.3], ['smokes', 0.4], ['cash', 0.35, 2, 25], ['whiskey', 0.2], ['pistol', 0.05], ['a32', 0.1, 6, 12], ['photo', 0.1], ['cufflinks', 0.1]],
  cabinet:  [['letter', 0.5], ['ledger', 0.08], ['cash', 0.1, 5, 40], ['photo', 0.15]],
  wardrobe: [['fedora', 0.2], ['trench', 0.1], ['suit', 0.15], ['brogues', 0.15], ['cash', 0.2, 1, 12], ['snub', 0.05], ['a38', 0.1, 5, 12]],
  drawer:   [['cash', 0.35, 1, 15], ['watch', 0.1], ['ring', 0.04], ['letter', 0.3], ['smokes', 0.3], ['bandage', 0.25], ['cufflinks', 0.1], ['snub', 0.04]],
  safe:     [['cash', 1, 80, 400], ['bonds', 0.25], ['ring', 0.3], ['watch', 0.4], ['m1911', 0.3], ['a45', 0.4, 7, 21], ['ledger', 0.3]],
  vault:    [['cash', 1, 1500, 4000], ['bonds', 1], ['bonds', 0.6], ['ring', 0.5]],
  crate:    [['whiskey', 0.3, 1, 2], ['smokes', 0.3, 2, 5], ['a45', 0.2, 20, 40], ['tommy', 0.04], ['dynamite', 0.1, 1, 3], ['crowbar', 0.1], ['cell', 0.06]],
  fridge:   [['sandwich', 0.6, 1, 2], ['coffee', 0.3], ['whiskey', 0.2]],
  cooler:   [['coffee', 0.6, 1, 3], ['sandwich', 0.4]],
  toolbox:  [['tireiron', 0.4], ['crowbar', 0.3], ['flashlight', 0.3], ['lockpick', 0.05]],
  cells:    [['cell', 1, 2, 3]],
  rack:     [['riot', 0.7], ['a12', 0.9, 10, 20], ['service', 0.5], ['a38', 0.6, 12, 24]],
  suitcase: [['sharp', 0.5], ['watch', 0.4], ['cash', 0.8, 40, 160], ['letter', 1], ['photo', 0.6], ['m1911', 0.4], ['a45', 0.5, 7, 14]],
  body:     [['cash', 0.7, 1, 20], ['smokes', 0.3], ['watch', 0.08], ['bandage', 0.1], ['letter', 0.1]],
  bodyGoon: [['cash', 0.9, 10, 60], ['a45', 0.3, 6, 14], ['a32', 0.4, 6, 12], ['knuckles', 0.15], ['knife', 0.15], ['dynamite', 0.05]],
  bodyCop:  [['cash', 0.5, 2, 15], ['a38', 0.8, 6, 18], ['blackjack', 0.4], ['bandage', 0.3]],
  stash:    []
};
function fillContainer(K) {
  if (K.grid) return K.grid;
  const G = K.grid = makeGrid(K.gw || 6, K.gh || 4), table = LOOT[K.kind] || LOOT.drawer;
  const seed = Math.floor(K.x * 13 + K.y * 7);
  table.forEach(([key, p, a, b], i) => {
    if (hash(seed, i + 3) >= p) return;
    if (key === 'cash') { K.cash = (K.cash || 0) + Math.round(a + hash(seed, i + 40) * (b - a)); return; }
    const I = ITEMS[key], n = I.stack && a ? Math.round(a + hash(seed, i + 50) * (b - a)) : 1;
    gridAdd(G, newItem(key, Math.max(1, n)));
  });
  if (K.extra) for (const [key, n] of K.extra) gridAdd(G, newItem(key, n || 1));
  return G;
}
// a man who goes down has what he carried on him, gun and all
function bodyLoot(p) {
  if (p === FRANK) return;
  const K = { x: p.x, y: p.y, F: p.F, kind: p.team === 'goons' ? 'bodyGoon' : p.team === 'law' ? 'bodyCop' : 'body', name: 'THE BODY', body: p, gw: 6, gh: 4 };
  fillContainer(K);
  if (p.gun && p.gun.G.kind === 'gun') { const key = Object.keys(ITEMS).find(k => ITEMS[k].gun === p.gun.type); if (key) { const it = newItem(key); it.gun.ammo = Math.max(0, p.gun.ammo); gridAdd(K.grid, it); } }
  p.loot = K; CONTAINERS.push(K);
}
