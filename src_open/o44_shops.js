// =================================================================== SHOPS, THE BANK, THE TRUNK OF THE BUICK
// A counter sells what its kind of place sells, while it is open and somebody is behind it. Ammunition comes by
// the box. A few places buy: the gunsmith (guns, legal ones), the pawnbroker (anything with a price; he asks no
// questions about most of it), and the man at Lucky's back-room door, after dark (anything the law would mind).
const SHOPS = {
  bar: { title: 'THE BAR', items: ['whiskey', 'coffee', 'sandwich', 'smokes'] },
  diner: { title: 'THE COUNTER', items: ['coffee', 'sandwich', 'smokes'] },
  candy: { title: 'THE CANDY COUNTER', items: ['smokes', 'coffee', 'sandwich'] },
  drugstore: { title: 'CORNER DRUGS', items: ['bandage', 'firstaid', 'smokes', 'coffee', 'sandwich', 'whiskey'] },
  hardware: { title: 'BAUER HARDWARE', items: ['flashlight', 'crowbar', 'tireiron', 'bat', 'knife', 'gloves', 'overalls'] },
  hats: { title: 'LOUIE HATS', items: ['fedora', 'homburg', 'cap'] },
  tailor: { title: 'SILVERMAN', items: ['suit', 'sharp', 'overcoat', 'trench', 'brogues', 'crepe', 'gloves'] },
  laundry: { title: 'UNCLAIMED CLOTHES', items: ['overalls', 'cap', 'suit', 'leather'] },
  radio: { title: 'SPARKY RADIO', items: ['scanner', 'flashlight'] },
  station: { title: 'CROWN SERVICE', items: ['flashlight', 'tireiron', 'coffee', 'sandwich', 'smokes'] },
  liquor: { title: 'NICKEL LIQUORS', items: ['whiskey', 'smokes'] },
  hotel: { title: 'THE FRONT DESK', items: ['coffee', 'smokes'] },
  guns: { title: 'KELLER & SON', items: ['snub', 'service', 'm1911', 'pistol', 'pump', 'rifle', 'a38', 'a45', 'a32', 'a12', 'a30', 'holster', 'blackjack'], buys: I => I.cat === 'weapon' && !I.illegal || I.cat === 'ammo' && !I.illegal, rate: 0.45 },
  pawn: { title: 'GOLDIE LOANS', items: ['watch', 'ring', 'knuckles', 'snub', 'leather', 'flashlight', 'lockpick'], buys: I => I.price > 0 && I.cat !== 'key' && I.cat !== 'paper', rate: I => I.illegal ? 0.3 : 0.4 },
  black: { title: 'THE MAN AT THE DOOR', items: ['tommy', 'a45', 'riot', 'a12', 'dynamite', 'molotov', 'lockpick', 'vest', 'proto', 'cell'], buys: I => I.illegal || I.cat === 'valuable', rate: 0.5, night: true },
  room: { title: 'HOTEL ROYALE', service: [{ label: 'A BED FOR THE NIGHT', price: 1, act: () => { RENT.until = clockAbs() + 24 * 60; RENT.B = UI.shop.B; uiMsg('Room 3, upstairs. Checkout is noon.'); } }] },
  barber: { title: 'TONY THE BARBER', service: [{ label: 'A SHAVE AND A TRIM', price: 1, act: () => { FRANK.hp = Math.min(FRANK.maxHp, FRANK.hp + 10); PLAYER.shaved = clockAbs(); uiMsg('You look like a new man. Almost.'); } }] }
};
const PACK = { a38: 12, a45: 14, a32: 16, a12: 6, a30: 10 };
function priceOf(key) { const I = ITEMS[key]; return Math.round(I.price * (PACK[key] || 1) * (1 - clamp(PSTAT.charm, -5, 8) * 0.02) * 100) / 100; }
function staffAt(it) { return PEOPLE.find(p => p.staff === it.B && p.alive && !p.down && p.ai && p.ai.mode === 'spot' && (p.F || null) === (it.F || null)); }
function shopOpenHere(it) {
  if (it.kind === 'teller') return businessOpen(it.B) && !!staffAt(it);
  const S = SHOPS[it.stock]; if (!S) return false;
  if (it.who) return it.who.alive && !it.who.down && it.who.ai && !it.who.ai.hostile && it.who.ai.aware < AW.SEARCH && (!S.night || nightHours() || clockHour() >= 18);
  if (!businessOpen(it.B)) return false;
  return !!staffAt(it) || it.stock === 'hotel' || it.stock === 'room';
}
function shopLabel(it) {
  if (it.who) return shopOpenHere(it) ? it.label : null;
  if (!businessOpen(it.B)) return null;
  return shopOpenHere(it) ? it.label : 'NOBODY BEHIND THE COUNTER';
}
function openShop(it) {
  if (!shopOpenHere(it)) { toast('Nobody to serve you.'); return; }
  const S = SHOPS[it.stock];
  UI.mode = 'inv'; UI.K = null; UI.shop = it; UI.scroll = 0; UI.title = S.title;
  UI.rows = S.service ? S.service.map(r => ({ label: r.label, price: r.price, act: () => { if (INV.money < r.price) { uiMsg('You can\'t afford it.'); sfx('nope'); return; } giveMoney(-r.price); STATS.spent += r.price; sfx('coin'); r.act(); } }))
    : S.items.map(key => { const n = PACK[key] || 1, item = newItem(key, n); return { item, label: ITEMS[key].name + (n > 1 ? ' x' + n : ''), get price() { return priceOf(key); }, act: () => buyItem(key) }; });
  if (it.stock === 'room' && RENT.until > clockAbs() && RENT.B === it.B) uiMsg('You have a bed here until ' + hhmm(RENT.until % 1440) + '.');
  sfx('coin');
}
function buyItem(key) {
  const p = priceOf(key), I = ITEMS[key];
  if (INV.money < p) { uiMsg('You can\'t afford it.'); sfx('nope'); return; }
  const it = newItem(key, PACK[key] || 1), left = gridAdd(INV.grid, it);
  if (left) { if (left.n !== (PACK[key] || 1)) { left.n = (PACK[key] || 1) - left.n; gridTake(INV.grid, key, left.n); } uiMsg('No room in the bag.'); sfx('nope'); return; }
  giveMoney(-p); STATS.spent += p; sfx('coin'); autoQuick(); playerStats();
  uiMsg('Bought: ' + I.name + '.');
}
// what the man behind this counter gives for a thing (null: he doesn't want it)
function sellPrice(it) {
  const S = UI.shop && SHOPS[UI.shop.stock], I = ITEMS[it.key];
  if (!S || !S.buys || !S.buys(I)) return null;
  const rate = typeof S.rate === 'function' ? S.rate(I) : S.rate;
  return Math.max(0.05, Math.round(itemValue(it) * rate * 100) / 100);
}
function sellItem(it) {
  const S = UI.shop && SHOPS[UI.shop.stock], I = ITEMS[it.key], v = sellPrice(it);
  if (v === null) { uiMsg(S && S.buys ? 'Not interested in that.' : 'They don\'t buy here.'); sfx('nope'); return; }
  gridRemove(INV.grid, it); giveMoney(v); sfx('coin'); autoQuick(); playerStats();
  uiMsg('Sold ' + I.name + ' for ' + money(v) + '.');
}
// ------------------------------------------------------------------ the bank: money kept there survives a bad night
const BANK = { money: 0 };
function openBank(it) {
  if (!shopOpenHere(it)) { toast(businessOpen(it.B) ? 'Nobody at the window.' : 'The bank is closed.'); return; }
  UI.mode = 'inv'; UI.K = null; UI.shop = it; UI.title = 'MERIDIAN SAVINGS'; UI.scroll = 0;
  const dep = v => () => { v = Math.min(v, INV.money); if (v <= 0) { sfx('nope'); return; } giveMoney(-v); STATS.earned -= v; BANK.money = Math.round((BANK.money + v) * 100) / 100; sfx('coin'); };
  const wd = v => () => { v = Math.min(v, BANK.money); if (v <= 0) { sfx('nope'); return; } BANK.money = Math.round((BANK.money - v) * 100) / 100; INV.money = Math.round((INV.money + v) * 100) / 100; sfx('coin'); };
  UI.rows = [{ get label() { return 'IN YOUR ACCOUNT  ' + money(BANK.money); }, act: () => {}, dim: true, note: 'Money in the bank is safe if you wake up at the doctor\'s.' },
    { label: 'DEPOSIT $10', act: dep(10) }, { label: 'DEPOSIT $100', act: dep(100) }, { label: 'DEPOSIT IT ALL', act: () => dep(INV.money)() },
    { label: 'WITHDRAW $10', act: wd(10) }, { label: 'WITHDRAW $100', act: wd(100) }, { label: 'WITHDRAW IT ALL', act: () => wd(BANK.money)() }];
}
// ------------------------------------------------------------------ the trunk: the Buick's, behind the back bumper
function trunkNear(x, y) {
  for (const V of VEH) {
    if (V.gone || !V.trunk || V.wreck || PLAYER.car) continue;
    const bx = V.x - Math.cos(V.a) * (V.M.hl + 0.5), by = V.y - Math.sin(V.a) * (V.M.hl + 0.5);
    if (Math.hypot(bx - x, by - y) < 1.0) return V;
  }
  return null;
}
