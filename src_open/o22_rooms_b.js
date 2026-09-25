// =================================================================== ROOMS: OFFICES, THE LAW, MONEY, WORK, THE PICTURES
INT_TPL.generic = B => { const F = B.floors[0]; beginFloor(F); const R = shell(F, STYLE.plain); ceilingLamp(F, (R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2, 2); endFloor(); };
// an office floor: a reception desk by the door, desks in rows, filing cabinets on the back walls
function officeFloor(F, st, o) {
  const op = o || {}, R = shell(F, st);
  alongWall(F, 'x', 0.5, 0.6, 0.35, (x0, y0, x1, y1, n) => { if (n < 4) cabinet(F, x0, y0, x1, y1, 'FILING CABINET', { restricted: !!op.restricted }); });
  for (let y = R.y0 + 1.6; y < R.y1 - 0.9; y += 2.2) for (let x = R.x0 + 1.9; x < R.x1 - 0.9; x += 2.4)
    put(F, x, y, 1.8, 1.9, (cx, cy) => { desk(F, cx, cy - 0.3, 'y-', { typewriter: hash(cx | 0, cy | 0) > 0.5, restricted: !!op.restricted, w: 1.3 }); spot(F, cx, cy + 0.45, 'y-', 'desk'); });
  put(F, R.x1 - 0.5, R.y0 + 0.5, 0.6, 0.6, (x, y) => plant(F, x, y, 1));
  for (let x = R.x0 + 2.5; x < R.x1; x += 3.5) for (let y = R.y0 + 2.5; y < R.y1; y += 3.5) ceilingLamp(F, x, y, 2.0, C.PALEY);
  return R;
}
INT_TPL.office = B => {
  const F = B.floors[0]; beginFloor(F); const R = officeFloor(F, STYLE.office, { restricted: true });
  pictureY(F, R.y0, R.x0 + 1.4, 1.7, C.NAV);
  endFloor();
};
INT_TPL.newspaper = B => {
  const F = B.floors[0]; beginFloor(F); const R = shell(F, { floor: FLOORS.planks(C.TAN, C.WOOD, C.BRN), wall: WALLS.panel(C.CRS, C.STS) });
  // the editor's glass box in the back corner, the press at the other end, the newsroom between
  partX(F, R.x0 + 3.2, R.y0, R.y0 + 3.2, [R.y0 + 2.4]); partY(F, R.y0 + 3.2, R.x0, R.x0 + 3.2, []);
  floorArea(F, R.x0, R.y0, R.x0 + 3.2, R.y0 + 3.2, carpet(R.x0, R.y0, R.x0 + 3.2, R.y0 + 3.2, C.OX, C.CRIM, C.BRASS, C.DBR));
  desk(F, R.x0 + 1.4, R.y0 + 1.1, 'y-', { w: 1.6, name: "THE EDITOR'S DESK", restricted: true, locked: true, lock: 1 });
  cabinet(F, R.x0 + 0.1, R.y0 + 2.2, R.x0 + 0.6, R.y0 + 2.9, 'FILES', { restricted: true });
  F.private = [[R.x0, R.y0, R.x0 + 3.2, R.y0 + 3.2]];
  const press = (x0, y0, x1, y1) => { fbox(F, x0, y0, 0, x1, y1, 1.8, flat(C.S0), (y, z) => frac(z / 0.3) < 0.1 ? C.INK : (Math.hypot(frac(y / 0.6) - 0.5, frac(z / 0.6) - 0.5) < 0.3 ? C.S2 : C.S1), (x, z) => frac(x / 0.8) < 0.1 ? C.INK : C.S1); fsolid(F, x0, y0, x1, y1, 1.8, 'wall'); };
  put(F, R.x1 - 1.4, R.y0 + 1.6, 2.2, 2.6, (x, y) => press(x - 1.0, y - 1.2, x + 1.0, y + 1.2));
  for (let x = R.x0 + 4.4; x < R.x1 - 3; x += 2.3) for (const y of [R.y0 + 1.2, R.y0 + 3.6]) put(F, x, y, 1.7, 1.9, (cx, cy) => { desk(F, cx, cy - 0.3, 'y-', { typewriter: true, w: 1.2 }); spot(F, cx, cy + 0.45, 'y-', 'desk'); });
  put(F, R.x0 + 1.2, R.y1 - 1.0, 1.8, 1.2, (x, y) => { table(F, x, y, 1.5, 0.8, 2, C.CREAM); cFloor(x - 0.6, y - 0.3, x + 0.6, y + 0.3, F.z + 0.765, (xx, yy) => frac(yy / 0.1) < 0.3 ? C.INK : C.CREAM); });
  for (let x = R.x0 + 4; x < R.x1; x += 4) ceilingLamp(F, x, R.y0 + 2.5, 2.1, C.PALEY);
  ceilingLamp(F, R.x0 + 1.6, R.y0 + 1.6, 1.6, C.GLOW);
  endFloor();
};
INT_TPL.precinct = B => {
  const F = B.floors[0]; beginFloor(F); const R = shell(F, { floor: FLOORS.lino(C.CRS, C.STS), wall: WALLS.panel(C.G0, C.G1) }), D = mainDoor(B);
  // the desk sergeant faces the door; the bullpen west of him; the cells and the captain in the back
  const xs = D.cx;
  put(F, xs, R.y1 - 3.0, 3.2, 0.8, (x, y) => { counter(F, x - 1.5, y - 0.3, x + 1.5, y + 0.3, { top: C.WOOD, side: C.DBR }); spot(F, x, y - 0.7, 'y+', 'staff'); INTER.push({ F, x, y: y + 0.9, r: 1, kind: 'desk', label: 'THE DESK SERGEANT', B }); });
  partY(F, R.y0 + 3.0, R.x0, R.x1, [R.x0 + 4.2, R.x1 - 2.2]);
  // cells along the -y back wall, west half
  for (let k = 0; k < 3; k++) { const x0 = R.x0 + k * 1.9; cellBars(F, x0, R.y0, x0 + 1.8, R.y0 + 2.2, x0 + 1.2); use(F, x0, R.y0, x0 + 1.8, R.y0 + 2.2); spot(F, x0 + 0.5, R.y0 + 0.8, 'y+', 'cell'); }
  // the captain's office, east half of the back
  partX(F, R.x1 - 5.0, R.y0, R.y0 + 3.0, []);
  floorArea(F, R.x1 - 5.0, R.y0, R.x1, R.y0 + 3.0, carpet(R.x1 - 5.0, R.y0, R.x1, R.y0 + 3.0, C.G0, C.G1, C.BRN, C.DBR));
  desk(F, R.x1 - 2.6, R.y0 + 1.1, 'y-', { w: 1.6, name: "THE CAPTAIN'S DESK", restricted: true, locked: true, lock: 2 });
  cabinet(F, R.x1 - 4.8, R.y0 + 0.1, R.x1 - 4.2, R.y0 + 0.6, 'CASE FILES', { restricted: true, locked: true, lock: 2 });
  gunRackY(F, R.y0, R.x1 - 1.2, R.x1 - 0.2);
  container(F, R.x1 - 0.7, R.y0 + 0.4, 'rack', 'THE GUN RACK', { restricted: true, locked: true, lock: 3 });
  F.private = [[R.x0, R.y0, R.x1, R.y0 + 3.0], [xs - 1.6, R.y1 - 3.8, xs + 1.6, R.y1 - 3.3]];
  // the bullpen
  for (let x = R.x0 + 1.5; x < xs - 2; x += 2.4) put(F, x, R.y1 - 1.9, 1.8, 1.9, (cx, cy) => { desk(F, cx, cy, 'y-', { typewriter: true, w: 1.2, restricted: true }); spot(F, cx, cy + 0.75, 'y-', 'desk'); });
  for (let x = xs + 2.6; x < R.x1 - 1; x += 2.4) put(F, x, R.y1 - 1.9, 1.8, 1.9, (cx, cy) => { desk(F, cx, cy, 'y-', { w: 1.2, restricted: true }); spot(F, cx, cy + 0.75, 'y-', 'desk'); });
  put(F, R.x0 + 0.4, R.y0 + 3.9, 0.5, 1.6, (x, y) => { fboxc(F, x - 0.25, y - 0.8, 0, x + 0.25, y + 0.8, 0.45, C.WOOD, C.BRN, C.BRN); fsolid(F, x - 0.25, y - 0.8, x + 0.25, y + 0.8, 0.5); spot(F, x, y, 'x+', 'seat'); });
  for (let x = R.x0 + 2; x < R.x1; x += 3.6) ceilingLamp(F, x, R.y1 - 2.5, 1.8, C.PALEY);
  for (let x = R.x0 + 2; x < R.x1; x += 4.5) ceilingLamp(F, x, R.y0 + 1.5, 1.4, C.PALEY);
  endFloor();
};
INT_TPL.bank = B => {
  const F = B.floors[0]; beginFloor(F); const R = shell(F, STYLE.grand);
  // the tellers' cages across the room, the vault door in the back wall behind them
  const yc = R.y0 + 2.8;
  counter(F, R.x0 + 0.1, yc, R.x1 - 1.0, yc + 0.5, { top: C.CREAM, side: C.WOOD });
  cWallY(yc + 0.25, R.x0 + 0.1, R.x1 - 1.0, F.z + 1.05, F.z + 2.2, (x, z) => (frac((x - R.x0) / 0.12) < 0.2 || z > F.z + 2.12) ? C.BRASS : T);
  use(F, R.x0, R.y0, R.x1, yc + 0.5);
  for (let x = R.x0 + 0.9; x < R.x1 - 1.2; x += 1.5) { spot(F, x, yc - 0.5, 'y+', 'staff'); INTER.push({ F, x, y: yc + 1.0, r: 0.7, kind: 'teller', label: 'THE TELLER', B }); }
  cWallY(R.y0 + 0.02, R.x0 + 1.4, R.x0 + 3.2, F.z, F.z + 2.2, (x, z) => { const d = Math.hypot(x - R.x0 - 2.3, z - F.z - 1.1); return d > 0.9 ? T : d > 0.8 ? C.S3 : Math.abs(d - 0.35) < 0.05 ? C.S3 : (Math.hypot(x - R.x0 - 2.3, z - F.z - 1.1) < 0.1 ? C.S3 : C.S1); });
  container(F, R.x0 + 2.3, R.y0 + 0.4, 'vault', 'THE VAULT', { restricted: true, locked: true, lock: 4 });
  desk(F, R.x1 - 1.0, R.y0 + 1.3, 'x-', { w: 1.3, name: "THE MANAGER'S DESK", restricted: true });
  F.private = [[R.x0, R.y0, R.x1, yc]];
  put(F, R.x0 + 0.4, R.y1 - 1.8, 0.5, 1.8, (x, y) => { fboxc(F, x - 0.25, y - 0.9, 0, x + 0.25, y + 0.9, 0.45, C.WOOD, C.BRN, C.BRN); fsolid(F, x - 0.25, y - 0.9, x + 0.25, y + 0.9, 0.5); spot(F, x, y, 'x+', 'seat'); });
  put(F, R.x1 - 0.5, R.y1 - 0.5, 0.6, 0.6, (x, y) => plant(F, x, y, 1.1));
  ceilingLamp(F, (R.x0 + R.x1) / 2, R.y1 - 2.2, 2.4, C.PALEY); ceilingLamp(F, (R.x0 + R.x1) / 2, R.y0 + 1.4, 1.8, C.PALEY);
  endFloor();
};
INT_TPL.flophouse = B => {
  const F = B.floors[0]; beginFloor(F); const R = shell(F, { floor: FLOORS.lino(C.STS, C.ST1), wall: WALLS.paper(C.G0, C.ST0) });
  serviceCounter(F, facing(B), 1.1, { top: C.DBR, side: C.BRN, shop: 'room', label: 'RENT A BED ($1)' });
  // the dormitory: cots in rows
  for (let y = R.y0 + 2.2; y < R.y1 - 0.6; y += 1.3) for (let x = R.x0 + 2.4; x < R.x1 - 0.9; x += 2.4)
    put(F, x, y, 2.1, 1.0, (cx, cy) => { fboxc(F, cx - 1.0, cy - 0.4, 0.25, cx + 1.0, cy + 0.4, 0.45, C.ST1, C.ST0, C.CRS); for (const dx of [-0.95, 0.9]) fboxc(F, cx + dx, cy - 0.4, 0, cx + dx + 0.05, cy + 0.4, 0.25, C.S1, C.S0, C.S0); fsolid(F, cx - 1.0, cy - 0.4, cx + 1.0, cy + 0.4, 0.5); spot(F, cx, cy, 'x+', 'bed'); });
  ceilingLamp(F, (R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2, 1.4, C.PALEY);
  INTER.push({ F, x: R.x1 - 1.2, y: R.y0 + 2.2, r: 1, kind: 'sleep', label: 'SLEEP (8 HOURS)', B });
  endFloor();
};
INT_TPL.pawn = B => shopFloor(B, STYLE.shop, [C.BRASS, C.S2, C.OX, C.WOOD, C.CREAM], 'pawn', (F, R, wall) => {
  put(F, (R.x0 + R.x1) / 2 + 0.6, (R.y0 + R.y1) / 2 + 0.5, 1.8, 0.8, (x, y) => displayCase(F, x - 0.8, y - 0.35, x + 0.8, y + 0.35));
  safeBox(F, R.x0 + 0.5, R.y0 + 0.5, { name: "GOLDIE'S SAFE", restricted: true });
  if (wall === 'y') gunRackY(F, R.y0, R.x1 - 2.2, R.x1 - 1.1); else gunRackX(F, R.x0, R.y1 - 2.2, R.y1 - 1.1);
});
INT_TPL.gunsmith = B => shopFloor(B, { floor: FLOORS.planks(C.BRN, C.DBR, C.INK), wall: WALLS.panel(C.WOOD, C.BRN) }, [C.S1, C.BRASS, C.DBR, C.INK], 'guns', (F, R, wall) => {
  if (wall === 'y') { gunRackY(F, R.y0, R.x0 + 0.5, R.x1 - 1.5); } else { gunRackX(F, R.x0, R.y0 + 0.5, R.y1 - 1.5); }
  put(F, (R.x0 + R.x1) / 2 + 0.8, (R.y0 + R.y1) / 2 + 0.8, 1.8, 0.8, (x, y) => displayCase(F, x - 0.8, y - 0.35, x + 0.8, y + 0.35, [C.S2, C.INK, C.BRASS]));
  put(F, R.x1 - 1.3, R.y1 - 2.4, 1.8, 0.8, (x, y) => workbench(F, x - 0.8, y - 0.35, x + 0.8, y + 0.35));
});
INT_TPL.barber = B => {
  const F = B.floors[0]; beginFloor(F); const R = shell(F, { floor: FLOORS.checker(C.CREAM, C.INK), wall: WALLS.tile(C.WHITE, C.CRS) });
  // the chairs face the mirror on the back wall x = x0
  cWallX(R.x0 + 0.02, R.y0 + 0.6, R.y1 - 1.8, F.z + 1.0, F.z + 2.1, (y, z) => z > F.z + 2.05 || z < F.z + 1.05 ? C.S2 : (frac((y + z) * 1.5) < 0.12 ? C.WHITE : C.WL));
  for (let y = R.y0 + 1.2; y < R.y1 - 2; y += 1.7) {
    put(F, R.x0 + 1.1, y, 0.9, 0.9, (x, yy) => { cCyl(x, yy, 0.12, F.z, F.z + 0.45, () => C.S2); fboxc(F, x - 0.3, yy - 0.3, 0.45, x + 0.3, yy + 0.3, 0.6, C.CRIM, C.OX, C.CRIM); fboxc(F, x - 0.36, yy - 0.3, 0.6, x - 0.26, yy + 0.3, 1.25, C.CRIM, C.OX, C.CRIM); fsolid(F, x - 0.35, yy - 0.35, x + 0.35, yy + 0.35, 1.2); spot(F, x, yy, 'x-', 'seat'); spot(F, x + 0.7, yy + 0.3, 'x-', 'staff'); });
  }
  put(F, R.x1 - 0.5, R.y0 + 1.6, 0.6, 2.4, (x, y) => { for (const dy of [-0.8, 0, 0.8]) { chair(F, x, y + dy, 'x-'); spot(F, x, y + dy, 'x-', 'seat'); } }, 0);
  put(F, R.x1 - 0.4, R.y0 + 0.4, 0.4, 0.4, (x, y) => coatRack(F, x, y));
  INTER.push({ F, x: R.x0 + 2.0, y: R.y0 + 1.2, r: 0.9, kind: 'shop', stock: 'barber', label: 'A SHAVE AND A TRIM ($1)', B });
  ceilingLamp(F, (R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2, 2.2, C.PALEY);
  endFloor();
};
// ------------------------------------------------------------------ work
function yardFloor(B, st, fill) {
  const F = B.floors[0]; beginFloor(F); const R = shell(F, st);
  fill(F, R);
  for (let x = R.x0 + 2; x < R.x1; x += 3.5) for (let y = R.y0 + 2; y < R.y1; y += 3.5) ceilingLamp(F, x, y, 2.0, C.PALEY);
  endFloor();
}
function stacks(F, R, n, seed, tall) {
  for (let k = 0; k < n * 3 && n > 0; k++) {
    const w = 1.1 + hash(k, seed) * 0.8, d = 1.0 + hash(k, seed + 1) * 0.7, x = R.x0 + 0.8 + hash(k, seed + 2) * (R.x1 - R.x0 - 1.6), y = R.y0 + 0.8 + hash(k, seed + 3) * (R.y1 - R.y0 - 1.6);
    if (put(F, x, y, w, d, (cx, cy) => crates(F, cx - w / 2, cy - d / 2, cx + w / 2, cy + d / 2, hash(k, seed + 4) < tall ? 2.2 : 1.1), 0.5)) n--;
  }
}
INT_TPL.warehouse = B => yardFloor(B, STYLE.work, (F, R) => {
  stacks(F, R, 6, 13, 0.4);
  put(F, R.x1 - 1.4, R.y0 + 1.0, 2.2, 1.4, (x, y) => { desk(F, x, y, 'y-', { w: 1.2, name: 'THE FOREMAN\'S DESK', restricted: true }); });
  for (let k = 0; k < 4; k++) put(F, R.x0 + 0.5 + k * 0.7, R.y1 - 0.5, 0.65, 0.65, (x, y) => drum(F, x, y, C.CRIM), 0);
});
INT_TPL.garage = B => yardFloor(B, STYLE.work, (F, R) => {
  // the pit and the lift, tyres, the bench along the back
  floorArea(F, R.x0 + 1.8, R.y0 + 1.4, R.x0 + 2.8, R.y1 - 1.6, (x, y) => (x < R.x0 + 1.9 || x > R.x0 + 2.7) ? C.PALEY : C.BLK);
  use(F, R.x0 + 1.7, R.y0 + 1.3, R.x0 + 2.9, R.y1 - 1.5); solid(R.x0 + 1.8, R.y0 + 1.4, R.x0 + 2.8, R.y1 - 1.6, 0.6, 'low');
  alongWall(F, 'y', 0.7, 1.6, 0.3, (x0, y0, x1, y1, n) => n & 1 ? cabinet(F, x0, y0, x1, y1, 'TOOL CHEST') : workbench(F, x0, y0, x1, y1));
  for (let k = 0; k < 3; k++) put(F, R.x1 - 0.5, R.y1 - 1.0 - k * 0.7, 0.6, 0.6, (x, y) => { cCyl(x, y, 0.3, F.z, F.z + 0.25, (a) => a < -0.2 ? C.S0 : C.INK, (xx, yy) => Math.hypot(xx, yy) < 0.12 ? C.S2 : C.INK); cCyl(x, y, 0.3, F.z + 0.25, F.z + 0.5, (a) => a < -0.2 ? C.S0 : C.INK, (xx, yy) => Math.hypot(xx, yy) < 0.12 ? C.S2 : C.INK); fsolid(F, x - 0.3, y - 0.3, x + 0.3, y + 0.3, 0.5); }, 0);
  put(F, R.x1 - 1.3, R.y0 + 2.4, 1.8, 1.4, (x, y) => desk(F, x, y, 'x-', { w: 1.2, name: 'THE BOOKS', restricted: true }));
});
INT_TPL.station = B => shopFloor(B, STYLE.shop, GOODS.tins, 'station', (F, R) => {
  put(F, R.x1 - 1.0, (R.y0 + R.y1) / 2, 1.0, 1.0, (x, y) => { fbox(F, x - 0.45, y - 0.45, 0, x + 0.45, y + 0.45, 1.3, flat(C.CRIM), (yy, z) => z > 0.4 && z < 1.1 ? E(C.WL) : C.CRIM, (xx, z) => z > 0.9 ? C.CREAM : C.CRIM); fsolid(F, x - 0.45, y - 0.45, x + 0.45, y + 0.45, 1.3); container(F, x, y, 'cooler', 'THE COOLER'); });
});
INT_TPL.depot = B => yardFloor(B, STYLE.work, (F, R) => {
  for (let k = 0; k < 7; k++) put(F, R.x0 + 0.5 + (k % 4) * 0.72, R.y0 + 0.5 + Math.floor(k / 4) * 0.72, 0.66, 0.66, (x, y) => drum(F, x, y, C.CYD), 0);
  // fusion cells: cyan-banded canisters in a rack
  put(F, R.x1 - 1.6, R.y0 + 0.7, 2.4, 0.9, (x, y) => { fbox(F, x - 1.1, y - 0.4, 0, x + 1.1, y + 0.4, 1.4, flat(C.S0), flat(C.S1), (xx, z) => frac((xx - x) / 0.44) < 0.15 ? C.INK : (Math.abs(z - 0.9) < 0.06 ? (curExt = EXT_ALWAYS, E(C.CYAN)) : C.S2)); fsolid(F, x - 1.1, y - 0.4, x + 1.1, y + 0.4, 1.4); container(F, x, y, 'rack', 'FUSION CELLS', { restricted: true }); });
  container(F, R.x1 - 1.6, R.y0 + 1.5, 'cells', 'THE CELL RACK', { restricted: true, locked: true, lock: 2 });
  stacks(F, R, 3, 29, 0.3);
  F.private = [[R.x0, R.y0, R.x1, R.y1]];
});
INT_TPL.shed = B => yardFloor(B, { floor: FLOORS.boards, wall: WALLS.plank }, (F, R) => {
  stacks(F, R, 2, 41, 0);
  put(F, R.x0 + 1.2, R.y0 + 0.5, 1.8, 0.7, (x, y) => workbench(F, x - 0.8, y - 0.3, x + 0.8, y + 0.3));
  put(F, R.x0 + 0.6, R.y1 - 0.8, 0.8, 0.8, (x, y) => { cCyl(x, y, 0.35, F.z, F.z + 0.35, (a) => frac(a * 6) < 0.3 ? C.TAN : C.BRN, () => C.TAN); fsolid(F, x - 0.35, y - 0.35, x + 0.35, y + 0.35, 0.4); });   // a coil of rope
});
// ------------------------------------------------------------------ the pictures
INT_TPL.cinema = B => {
  const F = B.floors[0]; beginFloor(F); const R = shell(F, { floor: carpet(B.x0, B.y0, B.x1, B.y1, C.OX, C.CRIM, C.PLUM, C.OX), wall: WALLS.paper(C.OX, C.PLUM), noWin: true });
  // the screen on the back wall x = x0, rows of seats facing it, the lobby and the candy counter by the doors
  cWallX(R.x0 + 0.02, R.y0 + 0.6, R.y1 - 0.6, F.z + 0.9, F.z + 3.2, (y, z) => { curExt = EXT_ALWAYS; return (y < R.y0 + 0.7 || y > R.y1 - 0.7 || z < F.z + 1.0 || z > F.z + 3.1) ? C.INK : (vnoise(y * 1.5, z * 2, 61) > 0.62 ? E(C.WHITE) : E(C.HAZE)); });
  intLight(F, { x: R.x0 + 1.2, y: (R.y0 + R.y1) / 2, z: F.z + 2.0, r: 6, k: 1.4, map: null });
  const xl = R.x1 - 2.4;
  partX(F, xl, R.y0, R.y1, [R.y0 + 1.2, R.y1 - 1.8]);
  for (let x = R.x0 + 2.2; x < xl - 0.6; x += 1.0) for (let y = R.y0 + 0.9; y < R.y1 - 0.8; y += 0.62) {
    if (Math.abs(y - (R.y0 + R.y1) / 2) < 0.4) continue;                              // the aisle
    put(F, x, y, 0.55, 0.55, (cx, cy) => { fboxc(F, cx - 0.25, cy - 0.25, 0.3, cx + 0.25, cy + 0.25, 0.45, C.CRIM, C.OX, C.CRIM); fboxc(F, cx + 0.2, cy - 0.25, 0.45, cx + 0.3, cy + 0.25, 1.0, C.CRIM, C.OX, C.CRIM); fsolid(F, cx - 0.25, cy - 0.25, cx + 0.3, cy + 0.25, 1.0, 'low'); spot(F, cx, cy, 'x-', 'seat'); }, 0);
  }
  put(F, R.x1 - 1.2, R.y0 + 2.8, 0.9, 2.2, (x, y) => { counter(F, x - 0.3, y - 1.0, x + 0.3, y + 1.0, { top: C.BRASS, side: C.CRIM }); spot(F, x - 0.1, y, 'x+', 'staff'); INTER.push({ F, x: x + 0.8, y, r: 0.9, kind: 'shop', stock: 'candy', label: 'THE CANDY COUNTER', B }); });
  ceilingLamp(F, R.x1 - 1.2, (R.y0 + R.y1) / 2, 1.8, C.GLOW);
  for (let y = R.y0 + 1; y < R.y1; y += 2.5) ceilingLamp(F, R.x0 + 4, y, 0.5, C.OX);
  endFloor();
};
INT_TPL.liquor = B => {
  // the stock room at the back behind a partition, the counter across the shop in front of it
  const F = B.floors[0]; beginFloor(F); const R = shell(F, STYLE.shop), yb = R.y0 + 4.5;
  partY(F, yb, R.x0, R.x1, [R.x0 + 1.0]);
  floorArea(F, R.x0, R.y0, R.x1, yb, FLOORS.concrete);
  stacks(F, { x0: R.x0, y0: R.y0 + 0.2, x1: R.x1, y1: yb - 0.2 }, 3, 51, 0.5);
  serviceCounter(F, 'y', yb - R.y0 + 1.2, { register: [R.x0 + 1.0, yb + 1.45], shop: 'liquor', label: 'SHOP' });
  shelves(F, R.x0 + 1.6, yb + 0.12, R.x1 - 0.2, yb + 0.5, 1.9, GOODS.booze);
  alongWall(F, 'x', 0.45, 1.6, 0.15, (x0, y0, x1, y1) => shelves(F, x0, y0, x1, y1, 1.9, GOODS.booze));
  put(F, (R.x0 + R.x1) / 2 + 0.4, yb + 5.2, 0.8, 3.0, (x, y) => shelves(F, x - 0.4, y - 1.5, x + 0.4, y + 1.5, 1.6, GOODS.booze));
  ceilingLamp(F, (R.x0 + R.x1) / 2, yb + 4, 2.2, C.PALEY); ceilingLamp(F, (R.x0 + R.x1) / 2, R.y0 + 2, 1.5, C.PALEY);
  endFloor();
};
