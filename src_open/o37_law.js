// =================================================================== THE LAW: CRIMES, WITNESSES, HEAT, THE PATROL CARS
// A crime counts when somebody sees it (or hears the shots). A civilian who saw it runs for a phone and the heat
// goes up when they get there; a cop who saw it needs no phone. Heat 1: a cop who sees Frank comes over to have a
// word. Heat 2 and up: they shoot. Out of every cop's sight long enough, the heat comes down a step at a time.
const LAW = { heat: 0, unseen: 0, lastX: 0, lastY: 0, lastT: -1e9, reports: [], cars: [], fine: 0, arrest: null, wanted: '' };
const CRIME = {                      // how bad (heat it brings) and what the city calls it
  brandish: [0, 'WAVING A GUN'], trespass: [1, 'TRESPASSING'], breakin: [1, 'BREAKING AND ENTERING'], theft: [1, 'THEFT'], cartheft: [1, 'CAR THEFT'],
  vandal: [1, 'DAMAGE TO PROPERTY'], carjack: [2, 'CARJACKING'], assault: [2, 'ASSAULT'], shooting: [2, 'DISCHARGING A FIREARM'], copcar: [2, 'STEALING A PATROL CAR'],
  hitcop: [3, 'ASSAULTING AN OFFICER'], killgoon: [2, 'MANSLAUGHTER'], murder: [3, 'MURDER'], killcop: [4, 'KILLING A POLICE OFFICER'],
  evading: [2, 'EVADING ARREST'], robbery: [3, 'BANK ROBBERY']
};
function copsLook() { return LAW.heat >= 2; }
// something Frank did right now, where people might see it
function witnessAct(kind, x, y) {
  const [sev] = CRIME[kind] || [0];
  for (const p of PEOPLE) {
    if (p === FRANK || !p.alive || p.down || p.inCar || !p.ai || p.team === 'goons') continue;
    if (!sameFloor(p, FRANK.F) || Math.hypot(p.x - x, p.y - y) > (kind === 'shooting' ? 30 : 18)) continue;
    const heard = kind === 'shooting' && Math.hypot(p.x - x, p.y - y) < 20;
    if (!heard && !canSee(p, FRANK, 0.5)) continue;
    if (p.team === 'law') { if (sev > 0) raiseHeat(sev, kind, x, y); else if (LAW.heat === 0 && kind === 'brandish') copWarn(p); continue; }
    if (p.ai.mode !== 'flee' && p.ai.mode !== 'cower') civFlee(p, [x, y]);
    if (sev > 0) report(p, kind, x, y);
  }
}
// a crime with a result (a body, a stolen car): the people who can see the place see it
function crimeAt(kind, x, y) { if (FRANK && FRANK.alive) witnessAct(kind, x, y); }
// a quiet crime (picking a lock, going through a man's pockets): only if someone is watching Frank
function crimeWitness(kind) {
  const R = restrictedHere();
  for (const p of PEOPLE) {
    if (p === FRANK || !p.alive || p.down || !p.ai || !sameFloor(p, FRANK.F) || Math.hypot(p.x - FRANK.x, p.y - FRANK.y) > 16) continue;
    if (!canSee(p, FRANK, 0.8)) continue;
    if (p.team === 'goons') { if (R || p.staff === FRANK.B) alertGuard(p, FRANK.x, FRANK.y); continue; }
    if (p.team === 'law') { raiseHeat(CRIME[kind][0], kind, FRANK.x, FRANK.y); continue; }
    if (p.staff === FRANK.B || !p.B) { toastOnce(p.staff ? '"Hey! What do you think you\'re doing?"' : '"Somebody call a cop!"'); report(p, kind, FRANK.x, FRANK.y); civFlee(p, [FRANK.x, FRANK.y]); }
  }
}
function report(p, kind, x, y) {
  if (LAW.reports.some(r => r.p === p)) return;
  LAW.reports.push({ p, kind, x, y, t: 360 + Math.floor(rnd() * 240) });
}
function raiseHeat(sev, kind, x, y) {
  const was = LAW.heat;
  LAW.heat = Math.min(5, Math.max(LAW.heat, sev) + (sev >= 2 && LAW.heat >= sev ? 1 : 0) * (tick - LAW.lastT > 300 ? 1 : 0));
  LAW.lastX = x; LAW.lastY = y; LAW.lastT = tick; LAW.unseen = 0; LAW.wanted = CRIME[kind][1];
  if (LAW.heat > was) { toast('WANTED: ' + CRIME[kind][1]); dispatch(); }
}
function toastOnce(t) { if (!TOASTS.some(q => q.text === t)) toast(t); }
// ------------------------------------------------------------------ every tick
function lawTick() {
  for (let i = LAW.reports.length - 1; i >= 0; i--) {                       // the witnesses reach a phone
    const r = LAW.reports[i];
    if (!r.p.alive || r.p.down) { LAW.reports.splice(i, 1); continue; }
    if (--r.t <= 0) { LAW.reports.splice(i, 1); raiseHeat(CRIME[r.kind][0], r.kind, r.x, r.y); }
  }
  if (LAW.heat <= 0) { LAW.unseen = 0; return; }
  let seen = false;
  for (const p of PEOPLE) if (p.team === 'law' && p.alive && !p.down && p.ai && p.ai.seesFrank) { seen = true; break; }
  for (const V of LAW.cars) if (!V.gone && !V.wreck && V.driver === 'ai' && Math.hypot(V.x - FRANK.x, V.y - FRANK.y) < 18 && (!FRANK.B || FRANK.B === null) && lineClear(V.x, V.y, 1.3, FRANK.x, FRANK.y, 1.2, V)) { seen = true; break; }
  if (seen) { LAW.unseen = 0; LAW.lastX = FRANK.x; LAW.lastY = FRANK.y; LAW.lastT = tick; }
  else if (++LAW.unseen > 60 * (20 + LAW.heat * 12)) {
    LAW.heat--; LAW.unseen = 0;
    toast(LAW.heat ? 'The heat is cooling off.' : 'They\'ve lost you.');
    if (!LAW.heat) standDown();
  }
  if (tick % 240 === 0 && LAW.heat >= 2) dispatch();
}
// ------------------------------------------------------------------ patrol cars: sent to where he was last seen
function carsWanted() { return [0, 1, 2, 3, 4, 4][LAW.heat]; }
function dispatch() {
  LAW.cars = LAW.cars.filter(V => !V.gone && !V.wreck && V.driver === 'ai');
  for (let k = LAW.cars.length; k < carsWanted(); k++) { const V = spawnPatrolCar(true); if (!V) break; }
  for (const V of LAW.cars) { V.siren = LAW.heat >= 2; routeTo(V, LAW.lastX, LAW.lastY); }
}
function spawnPatrolCar(respond) {
  const [fx, fy] = frankPos();
  for (let tries = 0; tries < 20; tries++) {
    const n0 = Math.floor(rnd() * AV.length * NS), nb = nodeNeighbours(n0), n1 = nb[Math.floor(rnd() * nb.length)];
    const [ax, ay] = nodeXY(n0), [bx, by] = nodeXY(n1), d = Math.hypot((ax + bx) / 2 - fx, (ay + by) / 2 - fy);
    if (d < 30 || d > 75 || !offScreen((ax + bx) / 2, (ay + by) / 2)) continue;
    const dx = Math.sign(bx - ax), dy = Math.sign(by - ay), o = laneOffset(dx, dy), x = (ax + bx) / 2 + o[0], y = (ay + by) / 2 + o[1];
    if (VEH.some(V => !V.gone && Math.hypot(V.x - x, V.y - y) < 8)) continue;
    const V = makeVehicle('police', x, y, Math.atan2(dy, dx), 'black', 'cream', { name: 'PATROL CAR' });
    trafficInit(V, n0, n1); V.ai.cruise = respond ? 14 : 8; V.driver = 'ai'; V.keep = true; V.cops = 2;
    LAW.cars.push(V);
    return V;
  }
  return null;
}
// a route through the streets to a point: the road nodes nearest each end, the lane path between
function routeTo(V, x, y) {
  const a = nearestNode(V.x, V.y), b = nearestNode(x, y), nodes = roadPath(a, b);
  if (nodes.length < 2) nodes.push(nodeNeighbours(a)[0]);
  if (nodes.length < 3) nodes.unshift(nodeNeighbours(nodes[0]).find(n => n !== nodes[1]));
  aiInit(V, lanePath(nodes), { cruise: LAW.heat >= 2 ? 16 : 11, corner: 7, decel: 6.5, mode: 'patrol', stopAtEnd: true, look: 4.5 });
  V.ai.goal = [x, y]; V.ai.nodes = nodes;
}
function roadPath(a, b) {                                     // breadth first over the grid of junctions
  const prev = new Map([[a, -1]]), q = [a];
  while (q.length) { const n = q.shift(); if (n === b) break; for (const m of nodeNeighbours(n)) if (!prev.has(m)) { prev.set(m, n); q.push(m); } }
  const out = []; for (let n = b; n !== -1 && n !== undefined; n = prev.get(n)) out.push(n);
  return out.reverse();
}
// a patrol car at the end of its run: the cops get out if there is someone to catch; otherwise it drives on
function patrolUpdate(V) {
  const ai = V.ai;
  if (ai.done) {
    if (LAW.heat > 0 && V.cops > 0 && Math.hypot(V.x - LAW.lastX, V.y - LAW.lastY) < 25) {
      for (let k = 0; k < V.cops; k++) { const [x, y] = doorPoint(V, k ? 1 : -1); spawnCop(x, y).car = V; }
      V.cops = 0; V.driver = null; V.ai = null; V.thr = 0; V.brk = 1; V.hand = 1;
    } else { const n0 = nearestNode(V.x, V.y), nb = nodeNeighbours(n0); trafficInit(V, n0, nb[Math.floor(rnd() * nb.length)]); }          // wander on
  }
}
function spawnCop(x, y) {
  const p = makePerson('cop', 'cop', x, y, { hp: 100, hold: LAW.heat >= 3 ? 'long' : 'pistol' });
  p.team = 'law'; p.gun = makeGun(LAW.heat >= 3 && rnd() < 0.5 ? 'riot' : 'service'); p.street = false; p.persist = true;
  p.ai = copBrain(p, 'search');
  return p;
}
function standDown() {
  for (const V of LAW.cars) { V.siren = false; if (V.ai) { const n0 = nearestNode(V.x, V.y), nb = nodeNeighbours(n0); trafficInit(V, n0, nb[0]); V.ai.cruise = 8; } }
  for (const p of PEOPLE) if (p.team === 'law' && p.ai && p.alive && p.car) { p.ai.mode = 'return'; }
}
// ------------------------------------------------------------------ settling up: a word with a cop at heat 1, or the desk sergeant
function copWarn(p) { if (p.ai.warned) return; p.ai.warned = true; say('Officer', 'Put that away, mac, before somebody gets hurt.'); }
function payFine() {
  if (!LAW.heat) { say('Sergeant', 'Something I can do for you, Calder?'); return; }
  if (LAW.heat > 2) { say('Sergeant', 'Pay a fine? For that? Get out of here before I remember who you are.'); return; }
  const f = LAW.heat * 60;
  if (INV.money < f) { say('Sergeant', 'That\'ll be ' + money(f) + '. Come back when you have it.'); return; }
  giveMoney(-f); STATS.spent += f; LAW.heat = 0; LAW.reports.length = 0; standDown(); sfx('coin');
  say('Sergeant', 'Paid in full. Keep your nose clean, Calder.');
}
