// =================================================================== START: BUILD THE CITY, PUT FRANK AT HIS DESK, GO
function newWorld() {
  const B = BUILDINGS.find(b => b && b.key === 'office'), U = B.floors[1];
  const [x, y] = landNear(22.2, 31.0, U.z);
  FRANK = makePerson('frank', 'frank', x, y, { F: U, hp: 100, hold: 'none' });
  FRANK.team = 'frank'; FRANK.dir = 1; FRANK.faceX = 0; FRANK.faceY = 1;
  // a private eye's pockets: his old service revolver, a sap, a set of picks, a coat against the rain
  for (const [k, n] of [['service', 1], ['a38', 30], ['blackjack', 1], ['fedora', 1], ['trench', 1], ['suit', 1], ['brogues', 1], ['lockpick', 1], ['bandage', 2], ['smokes', 1], ['carkey', 1]]) {
    const it = newItem(k, n); if (ITEMS[k].slot && !INV.equip[ITEMS[k].slot]) INV.equip[ITEMS[k].slot] = it; else gridAdd(INV.grid, it);
  }
  INV.money = 40;
  PLAYER.slot = -1; PLAYER.drawn = false; autoQuick(); playerStats(); frankArm();
  spawnFrankCar(); spawnParked(); spawnTram(TRAM.y0 + 6, 1); spawnTram(TRAM.y1 - 6, -1);
  for (let k = 0; k < 400; k++) weatherTick();
  updateLightParams(); updateLamps(); updateDoors();
  LIFT.b = B; LIFT.f = 1; LIFT.k = 1; LIFT.cut = cutZ(U);
  populateFloor(U);
  manageTraffic(true); manageCrowd(true);
  CAMF.snap = true; updateCam();
}
function init() {
  resize(); window.addEventListener('resize', resize);
  AUD.muted = QS.get('mute') === '1';
  if (QS.get('hour') !== null) CLOCK.min = ((+QS.get('hour') % 24) + 24) % 24 * 60;
  if (QS.get('god') === '1') PLAYER.god = true;
  const t0 = performance.now();
  buildCity(); buildStaticGrid(); buildLightGrid(); buildCarModels(); buildCast(); buildCombatCast();
  room = CITY_ROOM;
  NAV.r = 0.24;                                              // doorways inside are a metre wide: the walk grid must fit through them
  newWorld();
  buildBigMap();
  GAME.buildMs = performance.now() - t0;
  exposeTest();
  requestAnimationFrame(t => { lastT = t; frame(t); });
}
init();
