// =================================================================== THINGS: WHAT THERE IS TO CARRY, WEAR, USE AND SELL
// An item has a size on the grid of a bag (w x h cells), a price, and depending on what it is: the gun it is, the
// rounds it holds, the slot it is worn in and what wearing it changes. Everything Frank wears or carries feeds one
// function, playerStats(); attributes, when they come, are one more source of numbers for it.
const ITEMS = {
  // firearms and what they eat
  snub:     { name: '.38 Snub-nose', cat: 'weapon', slot: 'side', gun: 'snub', w: 2, h: 1, price: 45, icon: 'revolver', col: C.S1, desc: 'Five shots. Fits a coat pocket.' },
  service:  { name: '.38 Service revolver', cat: 'weapon', slot: 'side', gun: 'service', w: 2, h: 1, price: 60, icon: 'revolver', col: C.S2, desc: 'Six shots. The gun you carried on the force.' },
  m1911:    { name: '.45 Automatic', cat: 'weapon', slot: 'side', gun: 'm1911', w: 2, h: 1, price: 95, icon: 'auto', col: C.S0, desc: 'Seven in the clip. Hits like a mule.' },
  pistol:   { name: '.32 Pocket pistol', cat: 'weapon', slot: 'side', gun: 'pistol', w: 1, h: 1, price: 25, icon: 'auto', col: C.S1, desc: 'A lady\'s gun, they say. Tell that to the man it hits.' },
  pump:     { name: 'Pump shotgun', cat: 'weapon', slot: 'long', gun: 'pump', w: 4, h: 1, price: 110, icon: 'long', col: C.WOOD, desc: 'Six shells. Close work only.' },
  riot:     { name: 'Police riot gun', cat: 'weapon', slot: 'long', gun: 'riot', w: 4, h: 1, price: 150, icon: 'long', col: C.DBR, illegal: true, desc: 'Property of the city. Somebody will miss it.' },
  rifle:    { name: 'Bolt-action rifle', cat: 'weapon', slot: 'long', gun: 'rifle', w: 4, h: 1, price: 140, icon: 'rifle', col: C.BRN, desc: 'A Springfield from the war. Reaches across a street and then some.' },
  tommy:    { name: 'Thompson', cat: 'weapon', slot: 'long', gun: 'tommy', w: 3, h: 2, price: 420, icon: 'tommy', col: C.WOOD, illegal: true, desc: 'The Chicago typewriter. Thirty rounds of bad news.' },
  proto:    { name: 'Asterion prototype', cat: 'weapon', slot: 'side', gun: 'proto', w: 2, h: 2, price: 900, icon: 'proto', col: C.CYAN, illegal: true, desc: 'Brass coils and a humming cell. It is not a gun. It is worse.' },
  blackjack:{ name: 'Blackjack', cat: 'weapon', slot: 'melee', gun: 'blackjack', w: 1, h: 2, price: 12, icon: 'sap', col: C.INK, desc: 'From behind, and he never knew. Quiet.' },
  knuckles: { name: 'Brass knuckles', cat: 'weapon', slot: 'melee', gun: 'knuckles', w: 1, h: 1, price: 10, icon: 'knuckles', col: C.BRASS, desc: 'Makes a point.' },
  tireiron: { name: 'Tire iron', cat: 'weapon', slot: 'melee', gun: 'tireiron', w: 1, h: 3, price: 6, icon: 'bar', col: C.S1, desc: 'For tyres. Also for other things.' },
  bat:      { name: 'Baseball bat', cat: 'weapon', slot: 'melee', gun: 'bat', w: 1, h: 3, price: 8, icon: 'bat', col: C.TAN, desc: 'Louisville Slugger. Never been near a ball.' },
  knife:    { name: 'Switchblade', cat: 'weapon', slot: 'melee', gun: 'knife', w: 1, h: 1, price: 9, icon: 'knife', col: C.S2, desc: 'Click.' },
  molotov:  { name: 'Molotov cocktail', cat: 'weapon', slot: 'throw', gun: 'molotov', w: 1, h: 2, price: 8, stack: 3, icon: 'bottle', col: C.G1, illegal: true, desc: 'Rye, a rag, a match.' },
  dynamite: { name: 'Dynamite', cat: 'weapon', slot: 'throw', gun: 'dynamite', w: 1, h: 1, price: 30, stack: 5, icon: 'dynamite', col: C.CRIM, illegal: true, desc: 'Five seconds of fuse. Count them.' },
  a38:      { name: '.38 rounds', cat: 'ammo', w: 1, h: 1, price: 0.25, stack: 60, icon: 'box', col: C.BRASS, desc: 'Special. Round nose.' },
  a45:      { name: '.45 rounds', cat: 'ammo', w: 1, h: 1, price: 0.4, stack: 60, icon: 'box', col: C.S2, desc: 'ACP. Fits the automatic and the Thompson.' },
  a32:      { name: '.32 rounds', cat: 'ammo', w: 1, h: 1, price: 0.2, stack: 60, icon: 'box', col: C.CREAM, desc: 'Small, and they know it.' },
  a12:      { name: '12-gauge shells', cat: 'ammo', w: 1, h: 1, price: 0.5, stack: 30, icon: 'shells', col: C.CRIM, desc: 'Buckshot.' },
  a30:      { name: '.30-06 rounds', cat: 'ammo', w: 1, h: 1, price: 0.8, stack: 30, icon: 'box', col: C.G2, desc: 'Rifle rounds in stripper clips.' },
  cell:     { name: 'Fusion cell', cat: 'ammo', w: 1, h: 1, price: 40, stack: 8, icon: 'cell', col: C.CYAN, illegal: true, desc: 'Crown Energy. Warm to the touch. Do not drop.' },
  // clothes: armour, how easily he is seen and heard, how people take him
  fedora:   { name: 'Grey fedora', cat: 'gear', slot: 'hat', w: 2, h: 1, price: 8, icon: 'hat', col: C.ST1, mods: { charm: 1 }, desc: 'Every man in the city has one. That is the point.' },
  homburg:  { name: 'Black homburg', cat: 'gear', slot: 'hat', w: 2, h: 1, price: 22, icon: 'hat', col: C.INK, mods: { charm: 3 }, desc: 'A banker\'s hat. Doors open.' },
  cap:      { name: 'Flat cap', cat: 'gear', slot: 'hat', w: 2, h: 1, price: 3, icon: 'cap', col: C.BRN, mods: { stealth: 0.05 }, desc: 'A working man. Nobody looks twice.' },
  trench:   { name: 'Trench coat', cat: 'gear', slot: 'coat', w: 2, h: 3, price: 30, icon: 'coat', col: C.TAN, mods: { armor: 4, conceal: 1 }, desc: 'Hides a long gun. Keeps most of the rain out.' },
  overcoat: { name: 'Dark overcoat', cat: 'gear', slot: 'coat', w: 2, h: 3, price: 45, icon: 'coat', col: C.INK, mods: { armor: 5, conceal: 1, stealth: 0.1 }, desc: 'Charcoal wool. The night takes you in.' },
  leather:  { name: 'Leather jacket', cat: 'gear', slot: 'coat', w: 2, h: 2, price: 35, icon: 'jacket', col: C.DBR, mods: { armor: 9, charm: -1 }, desc: 'Horsehide. Turns a blade, sometimes.' },
  vest:     { name: 'Steel-plate vest', cat: 'gear', slot: 'suit', w: 2, h: 2, price: 160, icon: 'vest', col: C.S0, mods: { armor: 30, speed: -0.08, noise: 0.15 }, illegal: true, desc: 'Army surplus. Heavy. Worth it.' },
  suit:     { name: 'Brown suit', cat: 'gear', slot: 'suit', w: 2, h: 2, price: 25, icon: 'suit', col: C.BRN, mods: { charm: 1 }, desc: 'Off the rack. Seen better days.' },
  sharp:    { name: 'Silverman three-piece', cat: 'gear', slot: 'suit', w: 2, h: 2, price: 90, icon: 'suit', col: C.NAV, mods: { charm: 5 }, desc: 'Tailored. Head waiters remember you.' },
  overalls: { name: 'Work overalls', cat: 'gear', slot: 'suit', w: 2, h: 2, price: 6, icon: 'suit', col: C.DW, mods: { stealth: 0.1, charm: -2 }, desc: 'A man in overalls can walk in anywhere with a clipboard.' },
  crepe:    { name: 'Crepe-soled shoes', cat: 'gear', slot: 'shoes', w: 2, h: 1, price: 14, icon: 'shoes', col: C.BRN, mods: { noise: -0.35 }, desc: 'Quiet on a wooden floor.' },
  brogues:  { name: 'Brogues', cat: 'gear', slot: 'shoes', w: 2, h: 1, price: 10, icon: 'shoes', col: C.DBR, mods: { charm: 1 }, desc: 'Polished. Loud on a marble floor.' },
  gloves:   { name: 'Kid gloves', cat: 'gear', slot: 'gloves', w: 1, h: 1, price: 6, icon: 'gloves', col: C.INK, mods: { prints: 1, lockpick: 0.1 }, desc: 'No prints on anything.' },
  holster:  { name: 'Shoulder holster', cat: 'gear', slot: 'belt', w: 2, h: 1, price: 12, icon: 'holster', col: C.BRN, mods: { draw: 0.5, conceal: 1 }, desc: 'The gun comes out faster and nobody sees it go in.' },
  // things to use
  bandage:  { name: 'Bandages', cat: 'use', w: 1, h: 1, price: 3, stack: 5, icon: 'bandage', col: C.CREAM, heal: 25, desc: 'Stops the bleeding. Mostly.' },
  firstaid: { name: 'First-aid kit', cat: 'use', w: 2, h: 1, price: 12, stack: 2, icon: 'kit', col: C.WHITE, heal: 70, desc: 'Iodine, gauze, a bottle of pills.' },
  whiskey:  { name: 'Bottle of rye', cat: 'use', w: 1, h: 2, price: 4, stack: 2, icon: 'bottle', col: C.AMB, heal: 10, drunk: 1, desc: 'Old Crow. Steadies the hand, some say.' },
  coffee:   { name: 'Coffee', cat: 'use', w: 1, h: 1, price: 0.1, stack: 3, icon: 'cup', col: C.CREAM, heal: 4, desc: 'Black. Hot. Bad.' },
  sandwich: { name: 'Sandwich', cat: 'use', w: 1, h: 1, price: 0.35, stack: 3, icon: 'food', col: C.TAN, heal: 12, desc: 'Pastrami on rye.' },
  smokes:   { name: 'Cigarettes', cat: 'use', w: 1, h: 1, price: 0.25, stack: 5, icon: 'pack', col: C.CRIM, calm: 1, desc: 'Lucky Strike. Something to do with your hands.' },
  lockpick: { name: 'Lock picks', cat: 'tool', w: 1, h: 1, price: 20, stack: 1, icon: 'picks', col: C.S2, mods: { lockpick: 0.35 }, illegal: true, desc: 'A tension wrench and a rake. Illegal to carry.' },
  crowbar:  { name: 'Crowbar', cat: 'tool', w: 1, h: 3, price: 5, icon: 'bar', col: C.CRIM, mods: { pry: 1 }, desc: 'Opens crates. And doors, loudly.' },
  flashlight:{ name: 'Flashlight', cat: 'tool', w: 1, h: 2, price: 3, icon: 'torch', col: C.S2, desc: 'Two D cells. Shows you, too.' },
  scanner:  { name: 'Police-band radio', cat: 'tool', w: 2, h: 1, price: 60, icon: 'radio', col: C.BRN, mods: { scanner: 1 }, desc: 'Every squad car on the map.' },
  // things worth money, and papers worth more
  watch:    { name: 'Gold watch', cat: 'valuable', w: 1, h: 1, price: 40, icon: 'watch', col: C.BRASS, desc: 'Engraved to somebody else.' },
  ring:     { name: 'Diamond ring', cat: 'valuable', w: 1, h: 1, price: 120, icon: 'ring', col: C.WL, desc: 'Somebody said yes to this.' },
  cufflinks:{ name: 'Silver cufflinks', cat: 'valuable', w: 1, h: 1, price: 15, icon: 'ring', col: C.S3, desc: 'A pair.' },
  cash:     { name: 'Envelope of cash', cat: 'money', w: 1, h: 1, price: 1, icon: 'envelope', col: C.CREAM, desc: 'Money.' },
  bonds:    { name: 'Bearer bonds', cat: 'valuable', w: 2, h: 1, price: 300, icon: 'papers', col: C.G2, illegal: true, desc: 'Meridian Savings. Whoever holds them owns them.' },
  ledger:   { name: 'A ledger', cat: 'paper', w: 2, h: 2, price: 0, icon: 'book', col: C.OX, desc: 'Columns of numbers and initials.' },
  letter:   { name: 'A letter', cat: 'paper', w: 1, h: 1, price: 0, icon: 'envelope', col: C.CREAM, desc: 'Somebody else\'s mail.' },
  photo:    { name: 'A photograph', cat: 'paper', w: 1, h: 1, price: 0, icon: 'photo', col: C.S2, desc: 'Two people who should not have been together.' },
  roomkey:  { name: 'Room key 714', cat: 'key', w: 1, h: 1, price: 0, icon: 'key', col: C.BRASS, opens: 'mirador714', desc: 'Hotel Mirador. A brass fob.' },
  manifest: { name: 'Asterion manifest', cat: 'paper', w: 2, h: 1, price: 0, icon: 'papers', col: C.STL, desc: 'Kessler Point to Pier 9: forty crates, "industrial cells". Signed M.' },
  dockpass: { name: 'Pier 9 dock pass', cat: 'key', w: 1, h: 1, price: 0, icon: 'papers', col: C.STL, pass: 'pier9', desc: 'Asterion Shipping. On the back, in pencil: 2:17.' },
  carkey:   { name: 'Car keys', cat: 'key', w: 1, h: 1, price: 0, icon: 'key', col: C.S2, desc: 'Your Buick. Such as it is.' }
};
// ------------------------------------------------------------------ an item in the world: a kind, how many, and for a gun its state
let IID = 1;
function newItem(key, n) {
  const I = ITEMS[key], it = { id: IID++, key, n: n || 1 };
  if (I.cat === 'weapon' && GUNS[I.gun].kind === 'gun') { it.gun = makeGun(I.gun); it.gun.item = it; }
  return it;
}
function itemDef(it) { return ITEMS[it.key]; }
function itemName(it) { const I = ITEMS[it.key]; return I.stack && it.n > 1 ? I.name + ' (' + it.n + ')' : I.name; }
function itemValue(it) { const I = ITEMS[it.key]; return I.price * (I.stack ? it.n : 1); }
// ------------------------------------------------------------------ what Frank is, with what he wears and carries
const PSTAT = { armor: 0, stealth: 0, noiseMul: 1, speedMul: 1, charm: 0, conceal: 0, lockpick: 0, dmgMul: 1, meleeMul: 1, drawMul: 1, scanner: 0, prints: 0, pry: 0 };
const ATTRS = null;                                            // character attributes: a later source of the same numbers
function playerStats() {
  const m = { armor: 0, stealth: 0, noise: 0, speed: 0, charm: 0, conceal: 0, lockpick: 0, draw: 0, scanner: 0, prints: 0, pry: 0 };
  const add = mods => { if (mods) for (const k in mods) m[k] = (m[k] || 0) + mods[k]; };
  for (const s in INV.equip) { const it = INV.equip[s]; if (it) add(ITEMS[it.key].mods); }
  const tools = new Set(); for (const e of INV.bag) if (ITEMS[e.it.key].cat === 'tool') tools.add(e.it.key);   // a second set of picks is no help
  for (const k of tools) add(ITEMS[k].mods);
  if (ATTRS) add(ATTRS);
  PSTAT.armor = m.armor; PSTAT.stealth = m.stealth; PSTAT.noiseMul = clamp(1 + m.noise, 0.4, 1.6); PSTAT.speedMul = clamp(1 + m.speed, 0.7, 1.2);
  PSTAT.charm = m.charm; PSTAT.conceal = m.conceal; PSTAT.lockpick = m.lockpick; PSTAT.drawMul = 1 - clamp(m.draw, 0, 0.7);
  PSTAT.scanner = m.scanner; PSTAT.prints = m.prints; PSTAT.pry = m.pry;
  PSTAT.dmgMul = 1; PSTAT.meleeMul = 1 + (FRANK && FRANK.drunk > 0 ? 0.15 : 0);
  return PSTAT;
}
// armour soaks a share of every hit (all of a small one), and the vest wears down
function playerDamage(dmg, src) {
  const a = PSTAT.armor;
  if (a <= 0 || src === 'blast' || src === 'fire') return dmg;
  const soak = Math.min(dmg * 0.6, a * 0.5);
  const v = INV.equip.suit; if (v && v.key === 'vest') { v.wear = (v.wear || 0) + soak; if (v.wear > 160) { INV.equip.suit = null; toast('The vest is done for.'); playerStats(); } }
  return dmg - soak;
}
