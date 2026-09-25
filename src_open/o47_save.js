// =================================================================== SAVING: ONE SLOT IN THE BROWSER
// What is kept: the hour and the day, where Frank is, what he has on him and in the trunk and the bank, the jobs,
// what has been taken from which drawer, which doors he forced, who is dead today. Saved on sleep, on a finished
// job and from the pause screen; loaded from the title. Storage can be missing or full: then nothing is kept.
const SAVE_KEY = 'hourglass-opencity-v1';
function packItem(it) { const o = { k: it.key, n: it.n }; if (it.gun) o.a = it.gun.ammo; if (it.wear) o.w = it.wear; if (it.job) o.j = it.job; return o; }
function unpackItem(o) { if (!ITEMS[o.k]) return null; const it = newItem(o.k, o.n); if (it.gun && o.a !== undefined) it.gun.ammo = o.a; if (o.w) it.wear = o.w; if (o.j) it.job = o.j; return it; }
function packGrid(G) { return { w: G.w, h: G.h, i: G.items.map(e => [e.x, e.y, packItem(e.it)]) }; }
function unpackGrid(G, o) { G.items.length = 0; G.w = o.w; G.h = o.h; for (const [x, y, p] of o.i) { const it = unpackItem(p); if (it) gridPlace(G, it, x, y); } }
function saveGame(quiet) {
  if (!FRANK || !FRANK.alive) return false;
  const [x, y, V] = frankPos();
  const car = VEH.find(v => v.own && !v.gone);
  const S = {
    v: 1, clock: [CLOCK.day, CLOCK.min], frank: { x, y, b: V ? 0 : FRANK.B ? FRANK.B.id : 0, f: V || !FRANK.F ? 0 : FRANK.B.floors.indexOf(FRANK.F), hp: Math.round(FRANK.hp) },
    money: INV.money, bank: BANK.money, bag: packGrid(INV.grid), equip: Object.fromEntries(EQUIP_SLOTS.map(s => [s, INV.equip[s] ? packItem(INV.equip[s]) : null])),
    trunk: car && car.trunk ? packGrid(car.trunk.grid) : null, car: car ? [car.x, car.y, car.a, Math.round(car.hp)] : null,
    jobs: JOBS.map(J => [J.id, J.state, !!J.got]), rent: [RENT.until, RENT.B ? RENT.B.id : 0], stats: STATS,
    boxes: CONTAINERS.map((K, i) => K.grid && !K.body ? [i, packGrid(K.grid), K.cash || 0, K.locked ? 1 : 0] : null).filter(Boolean),
    doors: DOORS.filter(D => D.forced).map(D => D.id), gone: Object.fromEntries(Object.entries(ROSTER).map(([z, L]) => [z, L.map(e => e.gone || 0)])), seen: [...SEEN_TOASTS]
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { if (!quiet) toast('Could not save: the browser will not keep it.'); return false; }
  if (!quiet) toast('Saved. ' + clockText() + '.');
  return true;
}
function readSave() { try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function hasSave() { const S = readSave(); return !!(S && S.v === 1); }
function loadGame() {
  const S = readSave(); if (!S || S.v !== 1) return false;
  try {
    CLOCK.day = S.clock[0]; CLOCK.min = S.clock[1];
    unpackGrid(INV.grid, S.bag);
    for (const s of EQUIP_SLOTS) INV.equip[s] = S.equip[s] ? unpackItem(S.equip[s]) : null;
    INV.money = S.money; BANK.money = S.bank || 0;
    const car = VEH.find(v => v.own && !v.gone);
    if (car && S.car) { car.x = S.car[0]; car.y = S.car[1]; car.a = S.car[2]; car.hp = S.car[3]; car.vx = car.vy = car.w = 0; }
    if (car && S.trunk) unpackGrid(car.trunk.grid, S.trunk);
    for (const [id, st, got] of S.jobs) { const J = JOBS.find(j => j.id === id); if (!J) continue; if (st === 'active') { J.state = 'active'; J.accept(J); J.got = got; gridTakeJob(id); } else J.state = st; }
    for (const [i, g, cash, locked] of S.boxes) { const K = CONTAINERS[i]; if (!K) continue; K.grid = makeGrid(g.w, g.h); unpackGrid(K.grid, g); K.cash = cash; K.locked = !!locked; }
    for (const id of S.doors) if (DOORS[id]) DOORS[id].forced = true;
    for (const z in S.gone) { const L = rosterFor(z); S.gone[z].forEach((g, i) => { if (L[i] && g) L[i].gone = g; }); }
    for (const k of S.seen || []) SEEN_TOASTS.add(k);
    Object.assign(STATS, S.stats || {});
    RENT.until = S.rent[0]; RENT.B = BUILDINGS[S.rent[1]] || null;
    const B = S.frank.b ? BUILDINGS[S.frank.b] : null;
    FRANK.B = B; FRANK.F = B ? B.floors[S.frank.f] || B.floors[0] : null; FRANK.z = FRANK.F && FRANK.F.f > 0 ? FRANK.F.z : 0;
    FRANK.x = S.frank.x; FRANK.y = S.frank.y; FRANK.hp = clamp(S.frank.hp, 30, FRANK.maxHp);
    if (!personFree(FRANK.x, FRANK.y, 0.3, FRANK.z, FRANK)) { const [lx, ly] = landNear(FRANK.x, FRANK.y, FRANK.z); FRANK.x = lx; FRANK.y = ly; }
    if (B) { LIFT.b = B; LIFT.f = B.floors.indexOf(FRANK.F); LIFT.k = 1; LIFT.cut = LIFT.f === 0 ? WCUT : cutZ(FRANK.F); populateFloor(FRANK.F); }
    PLAYER.slot = -1; PLAYER.drawn = false; autoQuick(); playerStats(); updateFrankLook();
    updateLightParams(); updateLamps(); updateDoors();
    return true;
  } catch (e) { console.warn('save unreadable', e); return false; }
}
// a job re-taken on load hands its item out again; the saved bag already has it
function gridTakeJob(id) {
  const seen = new Set();
  for (let i = INV.grid.items.length - 1; i >= 0; i--) { const e = INV.grid.items[i]; if (e.it.job !== id) continue; const k = e.it.key; if (seen.has(k)) INV.grid.items.splice(i, 1); else seen.add(k); }
}
function wipeSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* nothing kept anyway */ } }
