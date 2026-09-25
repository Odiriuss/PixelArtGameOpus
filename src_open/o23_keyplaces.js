// =================================================================== THE PLACES THAT MATTER: 1140 FERRIER, THE MIRADOR, THE BLUE COMET, PIER 9
// These have more than one floor. The floor plans are fixed by hand; the stairs and the lift join the floors.
INT_TPL.office1140 = B => {
  const [G, U] = B.floors, R = intBounds(B), xh = 24.3;
  // ground floor: the street door into a narrow hall and the stairs; Molnar & Son behind the partition, shut a month
  beginFloor(G); shell(G, { floor: FLOORS.planks(C.BRN, C.DBR, C.INK), wall: WALLS.paper(C.STS, C.ST1) });
  floorArea(G, xh, R.y0, R.x1, R.y1, FLOORS.tile(C.CRS, C.STS));
  partX(G, xh, R.y0, R.y1, [30.6]);
  const S = stairFlight(G, 25.65, 28.7, 26.65, 33.0, '-y', U, 'UP TO THE OFFICE');
  cWallY(R.y0 + 0.02, 24.5, 25.5, G.z + 1.0, G.z + 1.6, (x, z) => (frac((x - 24.5) / 0.33) < 0.1 || frac((z - G.z) / 0.3) < 0.12) ? C.INK : C.BRASS);   // the mailboxes
  ceilingLamp(G, 25.4, 33.6, 1.3, C.PALEY);
  // the shop: dust sheets over everything, a dress form, bolts of cloth, the till
  const sheet = (x0, y0, x1, y1, h) => { fbox(G, x0, y0, 0, x1, y1, h, (x, y, px, py) => vnoise(x * 3, y * 3, 71) > 0.6 ? C.CRS : C.CREAM, (y, z) => frac(y * 1.7 + z * 0.3) < 0.25 ? C.CRS : C.CREAM, (x, z) => frac(x * 1.7 + z * 0.3) < 0.25 ? C.CRS : C.CREAM); fsolid(G, x0, y0, x1, y1, h); use(G, x0, y0, x1, y1); };
  sheet(20.0, 28.2, 23.4, 28.8, 1.0); sheet(20.4, 31.4, 21.8, 32.6, 0.85);
  shelves(G, R.x0 + 0.05, R.y0 + 0.2, R.x0 + 0.45, 30.2, 2.1, GOODS.cloth); use(G, R.x0, R.y0, R.x0 + 0.5, 30.2);
  mannequin(G, 22.8, 31.2, C.NAV); mannequin(G, 23.4, 33.2, C.PLUM); use(G, 22.5, 30.9, 23.7, 33.5);
  desk(G, 21.2, 34.0, 'y-', { w: 1.4, name: "MOLNAR'S LEDGER", lamp: false, chair: false, phone: false });
  rug(G, 19.8, 29.4, 22.2, 31.0, C.OX, C.DBR);
  ceilingLamp(G, 21.6, 30.5, 1.2, C.PALEY);
  G.spots.push({ x: 25.9, y: 34.0, dir: 'y+', role: 'door' });
  endFloor();
  // upstairs: the landing, Frank's office, the washroom
  beginFloor(U); shell(U, { floor: FLOORS.planks(C.BRN, C.DBR, C.INK), wall: WALLS.paper(C.VIO, C.VDK), cap: C.INK });
  floorArea(U, xh, R.y0, R.x1, R.y1, FLOORS.lino(C.STS, C.ST1));
  stairWell(U, S, G, { x: 26.1, y: 28.1 });
  partX(U, xh, R.y0, R.y1, [28.2]);
  partY(U, 33.1, R.x0, xh, [22.4]);
  floorArea(U, R.x0, 33.1, xh, R.y1, FLOORS.tile(C.S3, C.S2));
  toilet(U, 20.0, 34.0); sink(U, 20.7, 34.3, 21.4, 34.7); use(U, R.x0, 33.1, 21.5, R.y1);
  rug(U, 20.2, 28.6, 23.6, 31.8, C.OX, C.BRASS);
  desk(U, 21.4, 30.1, 'x+', { w: 1.5, name: "FRANK'S DESK", lampCol: C.G1, typewriter: true });
  use(U, 20.2, 29.2, 21.8, 31.0);
  U.frankDesk = { x: 21.4, y: 30.1 };
  const locker = cabinet(U, R.x0 + 0.05, R.y0 + 0.1, R.x0 + 0.6, R.y0 + 0.75, 'YOUR FILING CABINET');
  locker.kind = 'stash'; locker.owner = 'frank'; locker.restricted = false;
  use(U, R.x0, R.y0, R.x0 + 0.7, R.y0 + 0.8);
  sofa(U, 22.4, R.y0 + 0.45, 'y+', C.OX); use(U, 21.4, R.y0, 23.4, R.y0 + 0.9);
  coatRack(U, 23.8, 32.6); plant(U, 23.8, R.y0 + 0.4, 0.8);
  pictureX(U, R.x0, 31.8, 1.8, C.G1);
  ceilingLamp(U, 22.0, 31.0, 0.9, C.GLOW);
  ceilingLamp(U, 25.6, 31.5, 1.1, C.PALEY);
  INTER.push({ F: U, x: 22.4, y: R.y0 + 1.2, r: 0.9, kind: 'sleep', label: 'SLEEP ON THE SOFA', B, own: true });
  INTER.push({ F: U, x: 22.4, y: 30.1, r: 1.0, kind: 'phone', label: 'THE TELEPHONE', B });
  endFloor();
};
INT_TPL.hotel = B => {
  const [G, U] = B.floors;
  // the lobby: marble, the front desk across the back, the lift, a chandelier
  beginFloor(G); const R = shell(G, STYLE.grand);
  serviceCounter(G, 'y', 1.4, { top: C.CREAM, side: C.WOOD, shop: 'hotel', label: 'THE FRONT DESK', inset: 1.6 });
  cWallY(R.y0 + 0.02, R.x0 + 2.0, R.x1 - 1.2, G.z + 1.2, G.z + 2.4, (x, z) => { const c = frac((x - R.x0) / 0.3), r = frac((z - G.z) / 0.3); return c < 0.12 || r < 0.12 ? C.DBR : (c > 0.4 && c < 0.6 && r > 0.3 && r < 0.6 ? C.BRASS : C.BRN); });   // the pigeonholes
  cStamp(R.x0 + 3.2, R.y0 + 1.7, G.z + 1.0, ['.b.', 'bbb'], { b: C.BRASS });                                          // the bell
  const L = liftDoor(G, R.x0, 32.4, U, 'TAKE THE ELEVATOR (7TH FLOOR)');
  rug(G, 29.0, 29.8, 33.6, 33.4, C.OX, C.BRASS);
  sofa(G, 30.2, 32.6, 'y-', C.G0); armchair(G, 29.4, 30.6, 'x+', C.OX); armchair(G, 29.4, 31.8, 'x+', C.OX);
  table(G, 30.6, 31.2, 0.8, 0.8, 1); use(G, 28.8, 29.9, 31.2, 33.5);
  for (const [x, y] of [[R.x1 - 0.5, R.y0 + 2.0], [R.x0 + 0.5, R.y1 - 0.5], [R.x1 - 0.5, R.y1 - 0.5]]) plant(G, x, y, 1.2);
  spot(G, 30.2, 32.6, 'y-', 'seat'); spot(G, 29.4, 30.6, 'x+', 'seat');
  ceilingLamp(G, 31.2, 31.6, 2.6, C.PALEY); ceilingLamp(G, 32.6, R.y0 + 1.0, 1.4, C.GLOW);
  endFloor();
  // the seventh floor: a corridor from the lift, rooms either side; 714 is the one
  beginFloor(U); const Q = shell(U, { floor: FLOORS.planks(C.BRN, C.DBR, C.INK), wall: WALLS.paper(C.TAN, C.BRN) });
  const c0 = 31.6, c1 = 33.2;
  floorArea(U, Q.x0, c0, Q.x1, c1, carpet(Q.x0, c0, Q.x1, c1, C.OX, C.CRIM, C.BRASS, C.DBR));
  partY(U, c0, Q.x0, Q.x1, [29.4, 33.2]); partY(U, c1, Q.x0, Q.x1, [29.4, 33.2]);
  partX(U, 31.2, Q.y0, c0, []); partX(U, 31.2, c1, Q.y1, []);
  const L2 = liftDoor(U, Q.x0, 32.4, G, 'TAKE THE ELEVATOR (LOBBY)');
  L.arrive = { x: L2.x + 0.3, y: L2.y }; L2.arrive = { x: L.x + 0.3, y: L.y };
  const room = (x0, y0, x1, y1, n, mess) => {
    rug(U, x0 + 0.4, y0 + 0.4, x1 - 0.4, y1 - 0.4, mess ? C.PLUM : C.G0, C.DBR);
    put(U, x0 + 1.1, y0 + 1.15, 2.1, 1.5, (x, y) => bed(U, x, y, 'x+', mess ? C.PLUM : C.NAV));
    put(U, x1 - 0.45, y0 + 0.4, 0.7, 0.6, (x, y) => wardrobe(U, x - 0.35, y - 0.3, x + 0.35, y + 0.3, mess ? 'THE WARDROBE IN 714' : 'WARDROBE'));
    put(U, x1 - 0.5, y1 - 0.6, 0.8, 0.8, (x, y) => armchair(U, x, y, 'x-', C.OX));
    floorLamp(U, x0 + 0.3, y1 - 0.4, C.PALEY);
    if (y0 === Q.y0) cDecalY(y0 + 0.01, (x0 + x1) / 2, U.z + 2.0, ['bbbbbb', 'b' + (n % 2 ? 'cc' : 'c.') + 'cb', 'bbbbbb'], { b: C.BRASS, c: C.INK });
    if (mess) { container(U, x0 + 2.3, y0 + 0.6, 'suitcase', 'A SUITCASE', { restricted: true, locked: true, lock: 1 }); fboxc(U, x0 + 2.0, y0 + 0.4, 0, x0 + 2.6, y0 + 0.8, 0.35, C.BRN, C.DBR, C.TAN); spot(U, x0 + 1.2, y1 - 0.8, 'y-', 'guard'); }
  };
  room(Q.x0, Q.y0, 31.2, c0, 712, false); room(31.2, Q.y0, Q.x1, c0, 714, true);
  room(Q.x0, c1, 31.2, Q.y1, 713, false); room(31.2, c1, Q.x1, Q.y1, 715, false);
  U.room714 = { x0: 31.2, y0: Q.y0, x1: Q.x1, y1: c0 };
  for (const x of [29, 33]) ceilingLamp(U, x, (c0 + c1) / 2, 1.2, C.GLOW);
  endFloor();
};
INT_TPL.club = B => {
  const [G, U] = B.floors;
  beginFloor(G); const R = shell(G, { floor: FLOORS.planks(C.INK, C.BLK, C.BLK), wall: WALLS.paper(C.NBD, C.NAV), noWin: true });
  const S = stairFlight(G, R.x0 + 0.05, R.y0 + 1.2, R.x0 + 0.95, R.y1 - 1.0, '-y', U, 'UP TO THE OFFICE');
  floorArea(G, R.x0 + 1.4, R.y0 + 1.9, R.x1 - 1.4, R.y1 - 1.9, checker(C.NBD, C.INK, 0.45));
  use(G, R.x0 + 1.4, R.y0 + 1.9, R.x1 - 1.4, R.y1 - 1.9);
  // the bandstand at the back, the bar along the front wall, tables by the door
  stage(G, R.x0 + 1.3, R.y0 + 0.05, R.x0 + 3.9, R.y0 + 1.5); piano(G, R.x0 + 2.1, R.y0 + 0.45, 0.4); use(G, R.x0 + 1.2, R.y0, R.x0 + 4.0, R.y0 + 1.6);
  spot(G, R.x0 + 3.3, R.y0 + 0.8, 'y+', 'band', 0.4); spot(G, R.x0 + 2.2, R.y0 + 1.15, 'y+', 'band', 0.4);
  intLight(G, { x: R.x0 + 2.6, y: R.y0 + 2.2, z: G.z + 2.6, r: 4, k: 2.0 });
  counter(G, R.x0 + 1.4, R.y1 - 1.3, R.x1 - 1.3, R.y1 - 0.8, { top: C.S3, side: C.NBD }); use(G, R.x0 + 1.3, R.y1 - 1.35, R.x1 - 1.2, R.y1);
  for (let x = R.x0 + 1.8; x < R.x1 - 1.4; x += 0.75) { stool(G, x, R.y1 - 1.75); spot(G, x, R.y1 - 1.75, 'y+', 'bar'); }
  spot(G, R.x0 + 2.8, R.y1 - 0.4, 'y-', 'staff');
  INTER.push({ F: G, x: R.x0 + 3.2, y: R.y1 - 2.2, r: 0.8, kind: 'shop', stock: 'bar', label: 'ORDER A DRINK', B });
  G.private = [[R.x0 + 1.3, R.y1 - 0.8, R.x1 - 1.2, R.y1]];
  jukebox(G, R.x1 - 0.5, R.y0 + 0.4); use(G, R.x1 - 1.0, R.y0, R.x1, R.y0 + 0.8);
  spot(G, R.x1 - 0.7, R.y0 + 1.6, 'x-', 'stand'); spot(G, R.x0 + 2.4, R.y0 + 2.6, 'y-', 'stand'); spot(G, R.x0 + 3.2, R.y0 + 3.1, 'y-', 'stand');
  for (const [x, y] of [[R.x0 + 3, R.y0 + 3.2], [R.x1 - 1.5, R.y1 - 2.4]]) intLight(G, { x, y, z: G.z + 2.6, r: 4.5, k: 1.5, map: BLUW });
  ceilingLamp(G, R.x0 + 3.2, R.y1 - 1.1, 1.0, C.NBL);
  endFloor();
  // upstairs: the office of the man who runs the place
  beginFloor(U); const Q = shell(U, { floor: carpet(Q0(B).x0, Q0(B).y0, Q0(B).x1, Q0(B).y1, C.NBD, C.NAV, C.BRASS, C.INK), wall: WALLS.panel(C.BRN, C.DBR) });
  stairWell(U, S, G, { x: Q.x0 + 0.5, y: Q.y0 + 0.6 });
  desk(U, 33.2, 61.4, 'x-', { w: 1.6, name: "THE BOSS'S DESK", restricted: true, locked: true, lock: 2, lampCol: C.NBL });
  use(U, 32.7, 60.4, 34.2, 62.4);
  safeBox(U, Q.x1 - 0.45, Q.y0 + 0.45, { name: "THE COMET'S SAFE", restricted: true, lock: 4 }); use(U, Q.x1 - 0.9, Q.y0, Q.x1, Q.y0 + 0.9);
  sofa(U, 31.6, Q.y0 + 0.45, 'y+', C.NBD); use(U, 30.6, Q.y0, 32.6, Q.y0 + 0.9);
  cabinet(U, Q.x0 + 1.3, Q.y1 - 0.65, Q.x0 + 1.9, Q.y1 - 0.1, 'LEDGERS', { restricted: true, locked: true, lock: 2 });
  spot(U, 33.95, 61.4, 'x-', 'boss'); spot(U, Q.x0 + 1.4, Q.y0 + 1.6, 'x+', 'guard'); spot(U, 31.6, 63.6, 'y-', 'guard');
  ceilingLamp(U, 32.0, 61.5, 1.5, C.GLOW);
  ZONES.cometOffice = { F: U, x0: Q.x0, y0: Q.y0, x1: Q.x1, y1: Q.y1, restricted: true, zone: 'comet' };
  endFloor();
};
function Q0(B) { return { x0: B.x0, y0: B.y0, x1: B.x1, y1: B.y1 }; }
INT_TPL.mobwarehouse = B => {
  const [G, U] = B.floors;
  beginFloor(G); const R = shell(G, STYLE.work);
  const S = stairFlight(G, R.x0 + 0.05, R.y0 + 1.9, R.x0 + 1.05, R.y1 - 1.1, '-y', U, 'UP TO THE OFFICE');
  for (const [x0, y0, x1, y1, h] of [[98.6, 95.6, 100.4, 97.2, 2.2], [100.4, 95.6, 102.4, 97.0, 1.1], [98.8, 99.4, 100.6, 101.0, 1.1], [101.2, 104.0, 102.6, 105.6, 2.2], [98.4, 103.8, 100.2, 105.4, 1.1]]) { const K = crates(G, x0, y0, x1, y1, h); K.restricted = true; K.name = 'ASTERION CRATE'; use(G, x0, y0, x1, y1); }
  for (const [x, y] of [[101.9, 98.6], [102.2, 99.3], [97.8, 105.2]]) { drum(G, x, y, C.OX); use(G, x - 0.33, y - 0.33, x + 0.33, y + 0.33); }
  table(G, 100.2, 102.4, 1.0, 1.0, 2, C.G0); chair(G, 99.5, 102.4, 'x+', 2); chair(G, 100.9, 102.4, 'x-', 2); use(G, 99.2, 101.8, 101.1, 103.0);
  spot(G, 99.5, 102.4, 'x+', 'guard'); spot(G, 100.9, 102.4, 'x-', 'guard'); spot(G, 101.8, 100.6, 'x-', 'guard'); spot(G, 97.8, 97.6, 'y+', 'guard');
  for (const [x, y] of [[99.5, 98.5], [100.5, 103.5]]) ceilingLamp(G, x, y, 1.8, C.PALEY);
  G.private = [[R.x0, R.y0, R.x1, R.y1]];
  endFloor();
  beginFloor(U); const Q = shell(U, { floor: FLOORS.planks(C.BRN, C.DBR, C.INK), wall: WALLS.plank });
  stairWell(U, S, G, { x: Q.x0 + 1.6, y: S.box[1] + 0.4 });
  desk(U, 100.8, 98.4, 'x-', { w: 1.6, name: "THE BOOKKEEPER'S DESK", restricted: true, locked: true, lock: 2, typewriter: true });
  use(U, 100.3, 97.4, 101.8, 99.4);
  safeBox(U, Q.x1 - 0.45, Q.y0 + 0.45, { name: 'THE PIER 9 SAFE', restricted: true, lock: 3 }); use(U, Q.x1 - 0.9, Q.y0, Q.x1, Q.y0 + 0.9);
  cabinet(U, Q.x0 + 1.4, Q.y0 + 0.05, Q.x0 + 2.0, Q.y0 + 0.6, 'SHIPPING PAPERS', { restricted: true }); use(U, Q.x0 + 1.3, Q.y0, Q.x0 + 2.1, Q.y0 + 0.7);
  put(U, 100.5, 103.8, 2.1, 1.5, (x, y) => bed(U, x, y, 'x+', C.ST1));
  table(U, 99.6, 101.2, 0.9, 0.9, 2); chair(U, 99.0, 101.2, 'x+', 2); use(U, 98.8, 100.6, 100.2, 101.8);
  spot(U, 101.55, 98.4, 'x-', 'boss'); spot(U, Q.x0 + 1.8, 100.2, 'x+', 'guard');
  ceilingLamp(U, 100.2, 99.4, 1.4, C.GLOW);
  ZONES.pier9Office = { F: U, x0: Q.x0, y0: Q.y0, x1: Q.x1, y1: Q.y1, restricted: true, zone: 'pier9' };
  endFloor();
};
