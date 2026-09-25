// =================================================================== THE TEST DRIVER AND THE TEST HOOKS
// A script of plain inputs, run a step at a time: walk to a point (by the walk grid when there is one), press a
// key, hold one, aim at a person, wait. The headless tests queue these and read the state back through __test.
const AUTO = { on: false, q: [], t: 0, walk: null, stuck: 0, log: [] };
function autoInput() {
  if (!AUTO.on || !AUTO.q.length) return;
  const k = INPUT.keys, c = AUTO.q[0];
  AUTO.t++;
  if (c.wait !== undefined) { if (AUTO.t >= c.wait) next(); return; }
  if (c.press) { INPUT.pressed[c.press] = true; next(); return; }
  if (c.hold) { k[c.hold] = c.on !== false; next(); return; }
  if (c.click) { INPUT.clicks++; INPUT.mdown = false; next(); return; }
  if (c.aimAt) { const p = typeof c.aimAt === 'function' ? c.aimAt() : c.aimAt; if (p) { const [sx, sy] = worldToScreen(p.x, p.y, (p.z || 0) + 1.1); INPUT.mx = clamp(sx, 0, UW - 1); INPUT.my = clamp(sy, 0, UH - 1); } next(); return; }
  if (c.walk) {
    const [tx, ty] = c.walk, d = Math.hypot(tx - FRANK.x, ty - FRANK.y);
    if (d < (c.near || 0.45) || AUTO.t > (c.ms || 1200)) { if (d >= (c.near || 0.45)) AUTO.log.push('walk timeout ' + tx + ',' + ty + ' at ' + FRANK.x.toFixed(1) + ',' + FRANK.y.toFixed(1)); next(); return; }
    for (const key of ['KeyW', 'KeyA', 'KeyS', 'KeyD']) k[key] = false;
    if (c.run) k.ShiftLeft = true;
    if (!c.path || AUTO.t % 45 === 0) { NAV.z = FRANK.z; NAV.clip = FRANK.F && FRANK.F.f > 0 ? FRANK.F.R : null; buildNav(FRANK.x, FRANK.y); c.path = navPath(FRANK.x, FRANK.y, tx, ty) || [[tx, ty]]; }
    while (c.path.length > 1 && Math.hypot(c.path[0][0] - FRANK.x, c.path[0][1] - FRANK.y) < 0.4) c.path.shift();
    autoWalk(c.path[0][0], c.path[0][1]);
    return;
  }
  next();
}
function next() { const c = AUTO.q.shift(); AUTO.t = 0; INPUT.keys.ShiftLeft = false; if (c && c.walk) for (const key of ['KeyW', 'KeyA', 'KeyS', 'KeyD']) INPUT.keys[key] = false; }
// the eight ways the keys walk (world directions) and the keys for each; the free one most toward the point wins
const KEY8 = [[1, 0, 'KeyS', 'KeyD'], [1, 1, 'KeyS'], [0, 1, 'KeyS', 'KeyA'], [-1, 1, 'KeyA'], [-1, 0, 'KeyW', 'KeyA'], [-1, -1, 'KeyW'], [0, -1, 'KeyW', 'KeyD'], [1, -1, 'KeyD']];
function autoWalk(tx, ty) {
  const dx = tx - FRANK.x, dy = ty - FRANK.y, d = Math.hypot(dx, dy) || 1, k = INPUT.keys;
  let best = null, bs = 0.05;
  for (const K of KEY8) {
    const l = Math.hypot(K[0], K[1]), ux = K[0] / l, uy = K[1] / l, s = (ux * dx + uy * dy) / d;
    if (s <= bs || !personFree(FRANK.x + ux * 0.12, FRANK.y + uy * 0.12, FRANK.r, FRANK.z, FRANK)) continue;
    bs = s; best = K;
  }
  if (!best) { if (++AUTO.stuck > 20) { k[KEY8[(AUTO.t >> 4) % 8][2]] = true; } return; }
  AUTO.stuck = 0; for (const key of best.slice(2)) k[key] = true;
  AUTO.walk = [FRANK.x, FRANK.y];
}
// ------------------------------------------------------------------ hooks for the headless tests
function findB(name) { return BUILDINGS.find(b => b && b.name === name); }
// put Frank somewhere: a point in the street, or a floor of a named building
function teleport(x, y, bname, f) {
  if (PLAYER.car) exitVehicle(true);
  const B = bname ? findB(bname) : null, F = B ? B.floors[f || 0] : null;
  FRANK.B = B; FRANK.F = F; FRANK.z = F && F.f > 0 ? F.z : 0; FRANK.x = x; FRANK.y = y;
  if (!personFree(x, y, 0.3, FRANK.z, FRANK)) { const [lx, ly] = landNear(x, y, FRANK.z); FRANK.x = lx; FRANK.y = ly; }
  if (!B) placePerson(FRANK);
  if (B) { LIFT.b = B; LIFT.f = B.floors.indexOf(F); LIFT.k = 1; LIFT.cut = LIFT.f === 0 ? WCUT : cutZ(F); populateFloor(F); }
  else { LIFT.k = 0; LIFT.b = null; }
  CAMF.snap = true; updateCam(); audioPlace();
  return [FRANK.x, FRANK.y];
}
function setHour(h) { const now = CLOCK.min / 60; passTime(Math.round((((h - now) % 24) + 24) % 24 * 60)); updateLightParams(); updateLamps(); updateDoors(); }
function exposeTest() {
  window.__test = {
    GAME, PROF, VEH, PEOPLE, STATS, PLAYER, INPUT, AUTO, NAV, CAMF, INV, LAW, JOBS, UI, CLOCK, BUILDINGS, ZONES, CONTAINERS, INTER, DOORS, LIGHTS, LAMPS, LIFT, TILES, ITILES, BAKE_STATS, ITEMS, WEATHER, BANK, CASE, LIGHTM, ROSTER, get FRANK() { return FRANK; },
    step: n => { for (let i = 0; i < n; i++) update(); }, world: n => { for (let i = 0; i < n; i++) worldStep(); },
    begin: () => { while (bakeReady() < 1) prebake(50); GAME.mode = 'play'; CAMF.snap = true; audioPlace(); },
    teleport, setHour, findB, giveItem, newItem, gridAdd, equipItem, openContainer, openShop, openJobs, closeUI, saveGame, loadGame, wipeSave, hasSave, restrictedHere,
    canSee, lightLevel, frankLight, raiseHeat, spawnGoon, rosterFor, passTime, render, bakeTileNow,
    ZOOM, zoomStep, zoomSnap, zoomRange, worldToScreen, screenToWorld, view: () => ({ scale: view.scale, VW, VH }),
    run: q => { AUTO.on = true; AUTO.q.push(...q); AUTO.t = 0; },
    busy: () => AUTO.q.length > 0,
    state: () => ({ mode: GAME.mode, ui: UI.mode, clock: clockText(), frank: FRANK && [+FRANK.x.toFixed(2), +FRANK.y.toFixed(2), +FRANK.z.toFixed(2), FRANK.B ? FRANK.B.name : null, Math.round(FRANK.hp), FRANK.alive],
      car: PLAYER.car && [+PLAYER.car.x.toFixed(1), +PLAYER.car.y.toFixed(1), PLAYER.car.name], money: INV.money, heat: LAW.heat, prompt: PLAYER.prompt, light: +LIGHTM.v.toFixed(2),
      people: PEOPLE.length, cars: VEH.filter(V => !V.gone).length, perf: { frame: +GAME.perf.frame.toFixed(2), update: +GAME.perf.update.toFixed(2) }, tiles: TILES.size, zoom: [ZOOM.ws, VW, VH], auto: AUTO.log.slice(-5) })
  };
}
