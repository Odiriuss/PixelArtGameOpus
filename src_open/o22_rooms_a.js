// =================================================================== ROOMS: HOMES, BARS, SHOPS, EATERIES
// Each template lays out the ground floor of a kind of building from its shape and its doors: the business end
// (a counter, a bar) against the back wall that faces the way in, goods on the other back wall, the rest in between.
function mainDoor(B) { return B.doorList.find(D => !D.locked && (D.face === 'y' || D.face === 'x')) || B.doorList.find(D => !D.locked) || B.doorList[0]; }
// the back wall a customer faces coming in, and the other one. 'x': the wall x = R.x0; 'y': y = R.y0
function facing(B) { const D = mainDoor(B); return D.face === 'x' || D.face === '-x' ? 'x' : 'y'; }
// things against a back wall, one after another where they fit. wall 'x': along x = R.x0 (a runs over y); 'y': y = R.y0
function alongWall(F, wall, depth, len, gap, draw, off) {
  const R = F.R, o = off || 0, a0 = wall === 'x' ? R.y0 : R.x0, a1 = wall === 'x' ? R.y1 : R.x1;
  let n = 0;
  for (let a = a0 + 0.1; a + len <= a1 - 0.1; a += len + gap) {
    const x0 = wall === 'x' ? R.x0 + o : a, y0 = wall === 'x' ? a : R.y0 + o, x1 = wall === 'x' ? R.x0 + o + depth : a + len, y1 = wall === 'x' ? a + len : R.y0 + o + depth;
    if (!free(F, x0, y0, x1, y1, 0)) continue;
    use(F, x0, y0, x1, y1); draw(x0, y0, x1, y1, n++);
  }
  return n;
}
// a counter across the room, parallel to the back wall `wall`, `off` metres out from it, leaving a gap at the end
// nearest the front for the staff to get round. Returns the rectangle behind it (private ground).
function serviceCounter(F, wall, off, o) {
  const R = F.R, op = o || {}, t = 0.55, gap = 0.9;
  let rect;
  if (wall === 'y') { const a = R.x0 + (op.inset || 0.1), b = R.x1 - gap; if (!free(F, a, R.y0 + off, b, R.y0 + off + t, 0)) return null; counter(F, a, R.y0 + off, b, R.y0 + off + t, op); use(F, a, R.y0 + off, b, R.y0 + off + t); rect = [R.x0, R.y0, R.x1, R.y0 + off]; spot(F, (a + b) / 2, R.y0 + off / 2, 'y+', 'staff'); }
  else { const a = R.y0 + (op.inset || 0.1), b = R.y1 - gap; if (!free(F, R.x0 + off, a, R.x0 + off + t, b, 0)) return null; counter(F, R.x0 + off, a, R.x0 + off + t, b, op); use(F, R.x0 + off, a, R.x0 + off + t, b); rect = [R.x0, R.y0, R.x0 + off, R.y1]; spot(F, R.x0 + off / 2, (a + b) / 2, 'x+', 'staff'); }
  use(F, rect[0], rect[1], rect[2], rect[3]);
  F.private = F.private || []; F.private.push(rect);
  const cx = wall === 'y' ? (R.x0 + R.x1 - gap) / 2 : R.x0 + off + t + 0.6, cy = wall === 'y' ? R.y0 + off + t + 0.6 : (R.y0 + R.y1 - gap) / 2;
  if (op.shop) INTER.push({ F, x: cx, y: cy, r: 1.0, kind: 'shop', stock: op.shop, label: op.label || 'BUY', B: F.B });
  F.clear.push([cx - 0.5, cy - 0.5, cx + 0.5, cy + 0.5]);
  return rect;
}
const GOODS = {
  drug: [C.WHITE, C.CYD, C.CORAL, C.CREAM, C.WL], hard: [C.S1, C.OX, C.G1, C.BRASS, C.S2, C.DBR], booze: [C.G1, C.BRASS, C.OX, C.CREAM, C.AMB],
  cloth: [C.PLUM, C.NAV, C.ST1, C.TAN, C.OX, C.CREAM], tins: [C.CRIM, C.CREAM, C.BRASS, C.G1, C.WL], radio: [C.BRN, C.WOOD, C.DBR, C.CREAM], hats: [C.INK, C.ST1, C.TAN, C.BRN]
};
// ------------------------------------------------------------------ homes
// a walk-up's ground floor: a hall with the mailboxes and the stairs, and two flats off it
function flatHome(F, x0, y0, x1, y1, seed) {
  floorArea(F, x0, y0, x1, y1, FLOORS.planks(C.WOOD, C.BRN, C.DBR));
  const w = x1 - x0, d = y1 - y0, bl = [C.OX, C.NAV, C.G1, C.PLUM][seed & 3];
  put(F, x0 + 1.1, y0 + 0.8, 2.1, 1.5, (x, y) => bed(F, x, y, 'y+', bl)) || put(F, x0 + 0.8, y0 + 1.1, 1.5, 2.1, (x, y) => bed(F, x, y, 'x+', bl));
  put(F, x1 - 0.5, y0 + 0.4, 0.7, 0.6, (x, y) => wardrobe(F, x - 0.35, y - 0.3, x + 0.35, y + 0.3));
  put(F, x0 + w * 0.6, y0 + d * 0.62, 1.1, 0.8, (x, y) => { table(F, x, y, 0.9, 0.7, 0, (seed & 1) ? C.CREAM : undefined); chair(F, x - 0.6, y, 'x+'); });
  put(F, x0 + 0.35, y1 - 0.9, 0.6, 0.6, (x, y) => stove(F, x - 0.3, y - 0.3, x + 0.3, y + 0.3));
  put(F, x0 + 0.35, y1 - 1.6, 0.6, 0.6, (x, y) => sink(F, x - 0.3, y - 0.3, x + 0.3, y + 0.3));
  put(F, x1 - 0.5, y1 - 0.6, 0.8, 0.8, (x, y) => armchair(F, x, y, 'x-', C.G1));
  ceilingLamp(F, (x0 + x1) / 2, (y0 + y1) / 2, 1.9);
  put(F, (x0 + x1) / 2 + 0.3, y0 + 0.3, 0.9, 0.45, (x, y) => chest(F, x - 0.45, y - 0.22, x + 0.45, y + 0.22, 'CHEST OF DRAWERS', { restricted: true }));
}
INT_TPL.apartment = B => {
  const F = B.floors[0]; beginFloor(F); const R = shell(F, STYLE.home), D = mainDoor(B);
  // the hall runs in from the door; the flats either side of it
  if (D.face === 'x' || D.face === '-x') {
    const hy0 = D.cy - 1.0, hy1 = D.cy + 1.0;
    floorArea(F, R.x0, hy0, R.x1, hy1, FLOORS.tile(C.CREAM, C.CRS));
    partY(F, hy0, R.x0, R.x1, [R.x0 + 2.5]); partY(F, hy1, R.x0, R.x1, [R.x1 - 2.5]);
    stairFlight(F, (R.x0 + R.x1) / 2 - 1.3, hy0 + 0.1, (R.x0 + R.x1) / 2 + 1.3, hy0 + 0.95, '-x', null, 'NOBODY YOU KNOW UPSTAIRS');
    flatHome(F, R.x0, R.y0, R.x1, hy0, B.seed); flatHome(F, R.x0, hy1, R.x1, R.y1, B.seed + 1);
    ceilingLamp(F, (R.x0 + R.x1) / 2 + 1.5, D.cy, 1.6);
  } else {
    const hx0 = D.cx - 1.0, hx1 = D.cx + 1.0;
    floorArea(F, hx0, R.y0, hx1, R.y1, FLOORS.tile(C.CREAM, C.CRS));
    partX(F, hx0, R.y0, R.y1, [R.y0 + 2.5]); partX(F, hx1, R.y0, R.y1, [R.y1 - 2.5]);
    stairFlight(F, hx0 + 0.1, (R.y0 + R.y1) / 2 - 1.3, hx0 + 0.95, (R.y0 + R.y1) / 2 + 1.3, '-y', null, 'NOBODY YOU KNOW UPSTAIRS');
    flatHome(F, R.x0, R.y0, hx0, R.y1, B.seed); flatHome(F, hx1, R.y0, R.x1, R.y1, B.seed + 1);
    ceilingLamp(F, D.cx, (R.y0 + R.y1) / 2 + 1.5, 1.6);
  }
  endFloor();
};
// ------------------------------------------------------------------ bars
INT_TPL.bar = B => {
  const F = B.floors[0]; beginFloor(F); const R = shell(F, STYLE.bar), wall = facing(B);
  let back = null;
  if (B.zone === 'lucky') {                                  // Lucky's: the back room behind a door at the end of the bar
    const yb = R.y0 + 2.9;
    partY(F, yb, R.x0, R.x1, [R.x0 + 1.2]);
    floorArea(F, R.x0, R.y0, R.x1, yb, FLOORS.planks(C.DBR, C.INK, C.BLK));
    put(F, R.x0 + 3.6, R.y0 + 1.4, 1.6, 1.6, (x, y) => { table(F, x, y, 1.2, 1.2, 1, C.G0); chair(F, x - 0.85, y, 'x+'); chair(F, x + 0.85, y, 'x-'); chair(F, x, y - 0.85, 'y+'); spot(F, x - 0.85, y, 'x+', 'guard'); spot(F, x, y - 0.85, 'y+', 'guard'); });
    safeBox(F, R.x0 + 0.5, R.y0 + 0.5, { name: "LUCKY'S SAFE", restricted: true });
    put(F, R.x1 - 0.8, R.y0 + 0.4, 1.4, 0.6, (x, y) => crates(F, x - 0.7, y - 0.3, x + 0.7, y + 0.3, 1.1));
    ceilingLamp(F, R.x0 + 3.6, R.y0 + 1.4, 2.0, C.GLOW);
    back = [R.x0, R.y0, R.x1, yb]; F.private = [back];
    ZONES.luckyBack = { F, x0: back[0], y0: back[1], x1: back[2], y1: back[3], restricted: true, zone: 'lucky' };
    bottleShelfX(F, R.x0, yb + 0.3, R.y1 - 1.2);
  }
  const W_ = wall === 'y' ? 'y' : 'x';
  if (!back) {
    const d = (W_ === 'y' ? R.y1 - R.y0 : R.x1 - R.x0) > 5 ? 1.2 : 1.0;
    serviceCounter(F, W_, d, { top: C.OX, side: C.DBR, shop: 'bar', label: 'ORDER A DRINK' });
    if (W_ === 'y') bottleShelfY(F, R.y0, R.x0 + 0.3, R.x1 - 1.2); else bottleShelfX(F, R.x0, R.y0 + 0.3, R.y1 - 1.2);
    // stools along the customer side of the counter
    const n = Math.floor(((W_ === 'y' ? R.x1 - R.x0 : R.y1 - R.y0) - 1.2) / 0.75);
    for (let k = 0; k < n; k++) {
      const a = (W_ === 'y' ? R.x0 : R.y0) + 0.5 + k * 0.75, sx = W_ === 'y' ? a : R.x0 + d + 0.95, sy = W_ === 'y' ? R.y0 + d + 0.95 : a;
      put(F, sx, sy, 0.4, 0.4, () => { stool(F, sx, sy); spot(F, sx, sy, W_ === 'y' ? 'y-' : 'x-', 'bar'); }, 0);
    }
  } else serviceCounter(F, 'x', 1.2, { top: C.OX, side: C.DBR, shop: 'bar', label: 'ORDER A DRINK', inset: back[3] - R.y0 + 0.2 });
  // tables and booths in the rest of the room
  for (let y = R.y0 + 1.2; y < R.y1 - 0.8; y += 1.9) for (let x = R.x0 + 1.2; x < R.x1 - 0.8; x += 2.1)
    put(F, x, y, 1.9, 1.5, (cx, cy) => { table(F, cx, cy, 0.8, 0.8, 1, C.CREAM); chair(F, cx - 0.65, cy, 'x+', 1); chair(F, cx + 0.65, cy, 'x-', 1); spot(F, cx - 0.65, cy, 'x+', 'seat'); spot(F, cx + 0.65, cy, 'x-', 'seat'); ceilingLamp(F, cx, cy, 1.1, C.GLOW); });
  put(F, R.x1 - 0.6, R.y0 + 0.5, 0.9, 0.7, (x, y) => jukebox(F, x, y)) || put(F, R.x0 + 0.6, R.y1 - 0.5, 0.9, 0.7, (x, y) => jukebox(F, x, y));
  put(F, R.x0 + 0.4, R.y1 - 1.3, 0.5, 0.5, (x, y) => plant(F, x, y, 0.9));
  ceilingLamp(F, (R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2, 1.8, C.GLOW);
  pictureX(F, R.x0, R.y1 - 1.0, 1.7, C.OX); pictureY(F, R.y0, R.x1 - 1.0, 1.7, C.G1);
  endFloor();
};
// ------------------------------------------------------------------ shops
function shopFloor(B, st, goods, stock, extra) {
  const F = B.floors[0]; beginFloor(F); const R = shell(F, st), wall = facing(B), other = wall === 'y' ? 'x' : 'y';
  serviceCounter(F, wall, 1.1, { register: wall === 'y' ? [R.x0 + 1.0, R.y0 + 1.35] : [R.x0 + 1.35, R.y0 + 1.0], shop: stock, label: 'SHOP' });
  if (wall === 'y') shelves(F, R.x0 + 0.1, R.y0 + 0.05, R.x1 - 0.2, R.y0 + 0.45, 2.1, goods); else shelves(F, R.x0 + 0.05, R.y0 + 0.1, R.x0 + 0.45, R.y1 - 0.2, 2.1, goods);
  alongWall(F, other, 0.45, 1.6, 0.15, (x0, y0, x1, y1) => shelves(F, x0, y0, x1, y1, 1.9, goods));
  if (extra) extra(F, R, wall);
  ceilingLamp(F, (R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2, 2.2, C.PALEY);
  endFloor();
  return F;
}
INT_TPL.drugstore = B => shopFloor(B, STYLE.shop, GOODS.drug, 'drugstore', (F, R) => {
  // the soda fountain: a counter with stools down the middle of the shop
  put(F, (R.x0 + R.x1) / 2 + 0.5, (R.y0 + R.y1) / 2 + 0.9, 3.2, 1.4, (x, y) => barCounter(F, x - 1.5, y - 0.3, x + 1.5, y + 0.25, 1));
  put(F, R.x1 - 0.6, (R.y0 + R.y1) / 2, 0.8, 1.6, (x, y) => displayCase(F, x - 0.35, y - 0.75, x + 0.35, y + 0.75, [C.WHITE, C.CORAL, C.CYD]));
});
INT_TPL.hardware = B => shopFloor(B, STYLE.work, GOODS.hard, 'hardware', (F, R) => {
  put(F, (R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2 + 0.6, 2.0, 0.8, (x, y) => workbench(F, x - 0.9, y - 0.35, x + 0.9, y + 0.35));
  for (const [x, y] of [[R.x1 - 0.5, R.y0 + 2.4], [R.x1 - 1.2, R.y0 + 2.4], [R.x1 - 0.5, R.y0 + 3.1]]) put(F, x, y, 0.62, 0.62, (cx, cy) => drum(F, cx, cy, C.DBR), 0);
});
INT_TPL.laundry = B => {
  const F = B.floors[0]; beginFloor(F); const R = shell(F, STYLE.tile);
  serviceCounter(F, facing(B), 1.1, { shop: 'laundry', label: 'THE COUNTER' });
  // washing machines against the other back wall, with round doors
  const mach = (x0, y0, x1, y1) => fbox(F, x0, y0, 0, x1, y1, 0.95, flat(C.WHITE), (y, z) => Math.hypot(y - (y0 + y1) / 2, z - 0.5) < 0.2 ? (Math.hypot(y - (y0 + y1) / 2, z - 0.5) > 0.16 ? C.S2 : C.WM) : C.CREAM, (x, z) => Math.hypot(x - (x0 + x1) / 2, z - 0.5) < 0.2 ? (Math.hypot(x - (x0 + x1) / 2, z - 0.5) > 0.16 ? C.S2 : C.WM) : C.CREAM);
  alongWall(F, facing(B) === 'y' ? 'x' : 'y', 0.7, 0.75, 0.05, (x0, y0, x1, y1) => { mach(x0, y0, x1, y1); fsolid(F, x0, y0, x1, y1, 0.95); });
  put(F, (R.x0 + R.x1) / 2 + 0.6, (R.y0 + R.y1) / 2 + 0.6, 2.2, 0.9, (x, y) => table(F, x, y, 2.0, 0.8, 2, C.CREAM));
  put(F, R.x1 - 0.4, R.y1 - 2.2, 0.5, 1.8, (x, y) => clothesRack(F, x, y - 0.8, x, y + 0.8, GOODS.cloth));
  ceilingLamp(F, (R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2, 2.2, C.PALEY);
  endFloor();
};
INT_TPL.tailor = B => shopFloor(B, STYLE.home, GOODS.cloth, 'tailor', (F, R) => {
  for (const [dx, dy, c] of [[1.4, 2.4, C.NAV], [2.3, 2.4, C.ST1], [3.2, 2.4, C.PLUM]]) put(F, R.x0 + dx + 1.0, R.y0 + dy + 0.4, 0.5, 0.5, (x, y) => mannequin(F, x, y, c));
  put(F, R.x1 - 0.5, (R.y0 + R.y1) / 2 + 0.4, 0.5, 2.2, (x, y) => clothesRack(F, x, y - 1.0, x, y + 1.0, GOODS.cloth));
  put(F, R.x0 + 1.5, R.y1 - 1.1, 1.6, 0.9, (x, y) => table(F, x, y, 1.4, 0.8, 1, C.CRS));
  rug(F, R.x0 + 2.4, R.y0 + 3.2, R.x1 - 1.3, R.y1 - 1.8, C.OX, C.BRASS);
});
INT_TPL.hats = B => shopFloor(B, STYLE.home, GOODS.hats, 'hats', (F, R) => {
  for (let x = R.x0 + 2.4; x < R.x1 - 0.8; x += 1.4) put(F, x, (R.y0 + R.y1) / 2 + 0.2, 0.5, 0.5, (cx, cy) => { cCyl(cx, cy, 0.03, F.z, F.z + 1.3, () => C.BRASS); cStamp(cx, cy, F.z + 1.3, ['.hhh.', 'hhhhh', 'bbbbb'], { h: C.ST1, b: C.INK }); fsolid(F, cx - 0.2, cy - 0.2, cx + 0.2, cy + 0.2, 1.4); });
});
INT_TPL.radio = B => shopFloor(B, STYLE.shop, GOODS.radio, 'radio', (F, R) => {
  put(F, R.x1 - 1.2, (R.y0 + R.y1) / 2, 0.8, 0.6, (x, y) => radioSet(F, x, y));
  put(F, R.x0 + 2.8, R.y1 - 0.5, 1.8, 0.7, (x, y) => workbench(F, x - 0.8, y - 0.3, x + 0.8, y + 0.3));
});
// ------------------------------------------------------------------ eating and drinking
INT_TPL.diner = B => {
  const F = B.floors[0]; beginFloor(F); const R = shell(F, { floor: FLOORS.checker(C.CREAM, C.CRIM), wall: WALLS.tile(C.CREAM, C.CRS) }), wall = facing(B);
  // the kitchen behind a partition at the back, the counter in front of it
  const k = 1.7;
  if (wall === 'y') { partY(F, R.y0 + k, R.x0, R.x1, [R.x1 - 0.8]); floorArea(F, R.x0, R.y0, R.x1, R.y0 + k, FLOORS.tile(C.WHITE, C.CRS)); }
  else { partX(F, R.x0 + k, R.y0, R.y1, [R.y1 - 0.8]); floorArea(F, R.x0, R.y0, R.x0 + k, R.y1, FLOORS.tile(C.WHITE, C.CRS)); }
  const kit = wall === 'y' ? [R.x0, R.y0, R.x1, R.y0 + k] : [R.x0, R.y0, R.x0 + k, R.y1];
  F.private = [kit];
  if (wall === 'y') { stove(F, R.x0 + 0.2, R.y0 + 0.1, R.x0 + 1.2, R.y0 + 0.7); fridge(F, R.x0 + 1.3, R.y0 + 0.1, R.x0 + 2.0, R.y0 + 0.75); sink(F, R.x0 + 2.2, R.y0 + 0.1, R.x0 + 3.0, R.y0 + 0.65); use(F, R.x0, R.y0, R.x1 - 1.3, R.y0 + k); spot(F, R.x0 + 1.5, R.y0 + 1.2, 'y-', 'staff'); }
  else { stove(F, R.x0 + 0.1, R.y0 + 0.2, R.x0 + 0.7, R.y0 + 1.2); fridge(F, R.x0 + 0.1, R.y0 + 1.3, R.x0 + 0.75, R.y0 + 2.0); sink(F, R.x0 + 0.1, R.y0 + 2.2, R.x0 + 0.65, R.y0 + 3.0); use(F, R.x0, R.y0, R.x0 + k, R.y1 - 1.3); spot(F, R.x0 + 1.2, R.y0 + 1.5, 'x-', 'staff'); }
  serviceCounter(F, wall, k + 1.0, { top: C.S3, side: C.CRIM, shop: 'diner', label: 'ORDER FOOD', inset: 0.1 });
  const n = Math.floor(((wall === 'y' ? R.x1 - R.x0 : R.y1 - R.y0) - 1.2) / 0.75);
  for (let i = 0; i < n; i++) {
    const a = (wall === 'y' ? R.x0 : R.y0) + 0.5 + i * 0.75, sx = wall === 'y' ? a : R.x0 + k + 1.95, sy = wall === 'y' ? R.y0 + k + 1.95 : a;
    put(F, sx, sy, 0.4, 0.4, () => { stool(F, sx, sy); spot(F, sx, sy, wall === 'y' ? 'y-' : 'x-', 'bar'); }, 0);
  }
  // booths along the front windows
  for (let a = (wall === 'y' ? R.x0 : R.y0) + 1.3; a < (wall === 'y' ? R.x1 : R.y1) - 1.0; a += 2.3)
    if (wall === 'y') put(F, a, R.y1 - 1.1, 1.3, 2.1, (x, y) => booth(F, x, y, 'y', C.CRIM)); else put(F, R.x1 - 1.1, a, 2.1, 1.3, (x, y) => booth(F, x, y, 'x', C.CRIM));
  ceilingLamp(F, (R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2 + 0.8, 2.2, C.PALEY);
  ceilingLamp(F, kit[0] + 1.2, kit[1] + 0.8, 1.5, C.PALEY);
  endFloor();
};
INT_TPL.billiards = B => {
  const F = B.floors[0]; beginFloor(F); const R = shell(F, { floor: FLOORS.planks(C.DBR, C.INK, C.BLK), wall: WALLS.paper(C.G0, C.G1) });
  put(F, (R.x0 + R.x1) / 2 - 0.3, R.y0 + 2.0, 3.0, 1.9, (x, y) => poolTable(F, x, y));
  put(F, (R.x0 + R.x1) / 2 - 0.3, R.y0 + 4.6, 3.0, 1.9, (x, y) => poolTable(F, x, y));
  gunRackX(F, R.x0, R.y0 + 1.0, R.y0 + 3.0);                                          // the cue rack
  put(F, R.x1 - 0.8, R.y0 + 0.6, 1.4, 0.8, (x, y) => { counter(F, x - 0.7, y - 0.3, x + 0.7, y + 0.3, { top: C.DBR, side: C.BRN }); INTER.push({ F, x, y: y + 0.9, r: 0.9, kind: 'shop', stock: 'bar', label: 'ORDER A DRINK', B }); spot(F, x, y - 0.1, 'y+', 'staff'); });
  for (let y = R.y0 + 1.5; y < R.y1 - 1; y += 1.6) put(F, R.x0 + 0.5, y, 0.6, 0.6, (x, yy) => { chair(F, x, yy, 'x+', 1); spot(F, x, yy, 'x+', 'seat'); });
  endFloor();
};
INT_TPL.dancehall = B => {
  const F = B.floors[0]; beginFloor(F); const R = shell(F, { floor: FLOORS.planks(C.TAN, C.WOOD, C.BRN), wall: WALLS.paper(C.PLUM, C.OX) });
  put(F, R.x0 + 1.3, (R.y0 + R.y1) / 2, 2.4, 3.6, (x, y) => { stage(F, x - 1.1, y - 1.7, x + 1.1, y + 1.7); piano(F, x - 0.1, y - 0.9, 0.4); spot(F, x, y + 0.6, 'x+', 'band', 0.4); spot(F, x + 0.2, y - 0.2, 'x+', 'band', 0.4); });
  rug(F, R.x0 + 2.9, R.y0 + 1.6, R.x1 - 1.6, R.y1 - 1.6, C.TAN, C.BRASS);
  use(F, R.x0 + 2.9, R.y0 + 1.6, R.x1 - 1.6, R.y1 - 1.6);
  for (let a = R.x0 + 3.2; a < R.x1 - 0.6; a += 1.6) put(F, a, R.y0 + 0.7, 1.2, 1.2, (x, y) => { table(F, x, y, 0.7, 0.7, 1, C.CREAM); chair(F, x, y + 0.55, 'y-', 1); spot(F, x, y + 0.55, 'y-', 'seat'); });
  for (let a = R.y0 + 1.8; a < R.y1 - 0.8; a += 1.6) put(F, R.x1 - 0.7, a, 1.2, 1.2, (x, y) => { table(F, x, y, 0.7, 0.7, 1, C.CREAM); chair(F, x - 0.55, y, 'x+', 1); spot(F, x - 0.55, y, 'x+', 'seat'); });
  for (const [x, y] of [[R.x0 + 4, R.y0 + 3], [R.x1 - 3, R.y1 - 3]]) ceilingLamp(F, x, y, 2.2, C.LAV);
  endFloor();
};
