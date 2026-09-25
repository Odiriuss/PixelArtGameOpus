// =================================================================== THE ZONES: WHO GUARDS WHAT, AND WHEN
// Each zone keeps a roster: where each man stands or walks, with what, by day or by night. A man killed is gone for
// the rest of the day; a zone that was raised stays jumpy for three hours. Inside a building the roster comes on
// with the floor; out in a yard, when Frank comes within sight of it.
const ROSTER = {};
function rosterFor(zone) {
  if (ROSTER[zone]) return ROSTER[zone];
  const L = ROSTER[zone] = [], B = BUILDINGS.find(b => b && b.zone === zone), add = (F, x, y, o) => L.push(Object.assign({ F, x, y }, o));
  const spots = (F, role) => F.spots.filter(s => s.role === role);
  if (zone === 'lucky') {
    const F = B.floors[0], R = F.R, Z = ZONES.luckyBack;
    for (const s of spots(F, 'guard')) add(F, s.x, s.y, { dir: dirOf(s.dir), sink: 6, gun: 'm1911', guarded: true });
    add(F, R.x0 + 1.2, Z.y1 + 0.7, { dir: 1, gun: 'snub', cast: 'goon2', black: true });                             // minds the back-room door; sells, after dark
  } else if (zone === 'comet') {
    const U = B.floors[1];
    for (const s of spots(U, 'boss')) add(U, s.x, s.y, { dir: dirOf(s.dir), sink: 2, gun: 'm1911', cast: 'leader', guarded: true, hp: 140 });
    spots(U, 'guard').forEach((s, k) => add(U, s.x, s.y, { dir: dirOf(s.dir), gun: k ? 'm1911' : 'tommy', guarded: true, armed: true }));
  } else if (zone === 'pier9') {
    const [G, U] = B.floors;
    spots(G, 'guard').forEach((s, k) => add(G, s.x, s.y, { dir: dirOf(s.dir), sink: k < 2 ? 2 : 0, gun: k === 3 ? 'pump' : 'm1911', guarded: true, armed: k >= 2, night: k >= 2 }));
    for (const s of spots(U, 'boss')) add(U, s.x, s.y, { dir: dirOf(s.dir), sink: 2, gun: 'pistol', cast: 'civM2', guarded: true, hp: 70 });
    for (const s of spots(U, 'guard')) add(U, s.x, s.y, { dir: dirOf(s.dir), gun: 'tommy', guarded: true, armed: true });
    add(null, 109.0, 94.0, { dir: 2, gun: 'riot', guarded: true, armed: true, night: true, torch: true });              // the gate
    add(null, 109.0, 93.6, { route: [[109, 93.6], [119.5, 93.6], [119.5, 99.5], [114.5, 99.5], [109, 99.5]], gun: 'm1911', guarded: true, armed: true, night: true, torch: true });
    add(null, 106.0, 102.0, { route: [[106, 102], [115, 102.5], [118, 102.5], [118, 105], [106, 105]], gun: 'rifle', guarded: true, armed: true, night: true, torch: true });
    add(null, 110.5, 94.2, { dir: 2, gun: 'snub', cast: 'goon3', day: true });                                        // by day a man at the gate, no more
  } else if (zone === 'crown') {
    const F = B.floors[0], R = F.R;
    add(F, R.x0 + 1.4, R.y1 - 1.4, { dir: 2, gun: 'service', cast: 'goon3', guarded: true, armed: true });
    add(null, 93.6, 66.0, { dir: 0, gun: 'service', cast: 'goon3', guarded: true, armed: true, torch: true });
    add(null, 90.2, 65.8, { route: [[90.2, 65.8], [93.6, 65.8], [93.6, 63.0], [90.2, 63.0]], gun: 'service', cast: 'goon3', guarded: true, armed: true, torch: true, night: true });
  } else if (zone === 'bank') {
    const F = B.floors[0], D = mainDoor(B);
    add(F, D.cx - D.nx * 1.6 + D.ny * 1.2, D.cy - D.ny * 1.6 + D.nx * 1.2, { dir: dirFromVec(D.nx, D.ny, 0), gun: 'service', cast: 'cop', law: true, open: true });
  }
  return L;
}
function rosterSpawn(e, zone) {
  if (e.gone === CLOCK.day || (e.night && !nightHours()) || (e.day && nightHours()) || (e.open && !businessOpen(e.F.B))) return null;
  if (e.p && e.p.alive && PEOPLE.includes(e.p)) return null;
  let p;
  if (e.law) { p = makePerson('cop', e.cast || 'cop', e.x, e.y, { F: e.F, hp: 100, hold: 'none' }); p.team = 'law'; p.gun = makeGun(e.gun); p.ai = copBrain(p, 'post'); p.ai.post = [e.x, e.y, e.dir || 0, 0]; p.dir = e.dir || 0; }
  else p = spawnGoon(e.F, e.x, e.y, Object.assign({ zone, roster: e }, e));
  e.p = p;
  if (e.black) { if (!e.it) { e.it = { F: e.F, x: e.x, y: e.y, r: 1.4, kind: 'shop', stock: 'black', label: 'PSST. LOOKING FOR SOMETHING?', B: e.F.B }; INTER.push(e.it); } e.it.who = p; e.it.x = e.x; e.it.y = e.y; }
  return p;
}
const ZONE_POP = {};
for (const z of ['lucky', 'comet', 'pier9', 'crown', 'bank']) ZONE_POP[z] = F => { for (const e of rosterFor(z)) if (e.F === F) { const p = rosterSpawn(e, z); if (p) F.people.push(p); } };
// walking in: a line to set the mood the first time
const ZONE_ENTER = {
  lucky: B => onceToast('lucky', 'Lucky\'s. The back room is where the real business is.'),
  comet: B => onceToast('comet', 'The Blue Comet. The office is upstairs, and they don\'t like visitors.'),
  pier9: B => onceToast('pier9w', 'Asterion crates, stencilled and sealed. Somebody pays to keep this quiet.'),
  crown: B => onceToast('crown', 'Crown Energy. The racks hum.'),
  bank: B => { if (!businessOpen(B)) onceToast('bankc', 'The bank, after hours. There will be an alarm on that vault.'); },
  precinct: B => { if (LAW.heat) onceToast('prec', 'Walking into a police station with the heat on. Bold.'); }
};
const SEEN_TOASTS = new Set();
function onceToast(k, t) { if (SEEN_TOASTS.has(k)) return; SEEN_TOASTS.add(k); toast(t); }
// ------------------------------------------------------------------ the yards: peopled when Frank comes near
const YARDS = [{ zone: 'pier9', Z: () => ZONES.pier9, cx: 112, cy: 99 }, { zone: 'crown', Z: () => ZONES.crownYard, cx: 90.5, cy: 65 }];
function zonesTick() {
  if (tick % 30 !== 7) return;
  const [fx, fy] = frankPos(), night = nightHours();
  for (const Y of YARDS) {
    const d = Math.hypot(Y.cx - fx, Y.cy - fy);
    if (d < 55 && (!Y.pop || Y.night !== night)) {
      Y.pop = true; Y.night = night;
      for (const e of rosterFor(Y.zone)) if (!e.F) rosterSpawn(e, Y.zone);
    } else if (d > 95 && Y.pop) {
      Y.pop = false;
      for (const e of rosterFor(Y.zone)) if (!e.F && e.p && e.p.alive && offScreen(e.p.x, e.p.y)) { const k = PEOPLE.indexOf(e.p); if (k >= 0) PEOPLE.splice(k, 1); e.p = null; }
    }
    if (Y.pop && !night) for (const e of rosterFor(Y.zone)) if (!e.F && e.night && e.p && e.p.alive && e.p.ai.aware === AW.NONE && offScreen(e.p.x, e.p.y)) { const k = PEOPLE.indexOf(e.p); if (k >= 0) PEOPLE.splice(k, 1); e.p = null; }
  }
}
// the bank vault has an alarm on it after hours: opening it brings the police whoever saw
function vaultAlarm(K) {
  if (K.kind !== 'vault' || K.alarmed) return;
  K.alarmed = true; if (businessOpen(K.F.B)) return;                                   // by day the tellers are the alarm
  sfxF('alarm'); toast('An alarm bell goes off!'); makeNoise(K.x, K.y, 40, K.F.B); raiseHeat(3, 'robbery', K.x, K.y);
}
// ------------------------------------------------------------------ muggers: after dark, off the lit streets
const MUG = { next: 0, men: [], ask: 0, it: null, t: 0 };
function muggerTick() {
  if (MUG.men.length) { mugRun(); return; }
  if (tick % 300 !== 123 || !FRANK.alive || FRANK.inCar || FRANK.B || LAW.heat || clockAbs() < MUG.next) return;
  const h = clockHour(); if (!(h >= 22 || h < 5) || LIGHTM.v > 0.3 || rnd() > 0.35) return;
  if (PEOPLE.some(p => p.team === 'law' && p.alive && Math.hypot(p.x - FRANK.x, p.y - FRANK.y) < 30)) return;
  const f = faceOf(FRANK);
  for (let k = 0; k < 8; k++) {
    const a = Math.atan2(-f[1], -f[0]) + (rnd() - 0.5) * 1.6, x = FRANK.x + Math.cos(a) * 13, y = FRANK.y + Math.sin(a) * 13;
    if (!personFree(x, y, 0.35, 0) || !personFree(x + 1, y, 0.35, 0) || (!offScreen(x, y) && LIGHTM.v > 0.1)) continue;
    MUG.men = [['knife', 'goon3'], ['snub', 'civM3']].map(([g, c], i) => { const p = spawnGoon(null, x + i, y + (i ? 0.6 : 0), { gun: g, cast: c, zone: null, hp: 70 }); p.ai.mode = 'mug'; p.street = true; return p; });
    MUG.ask = Math.round(10 + Math.min(40, INV.money * 0.2)); MUG.t = 0; MUG.next = clockAbs() + 60 * (3 + rnd() * 4);
    return;
  }
}
function mugRun() {
  const men = MUG.men.filter(p => p.alive && !p.down && PEOPLE.includes(p));
  if (!men.length || !FRANK.alive) { mugEnd(); return; }
  const lead = men[0], d = Math.hypot(lead.x - FRANK.x, lead.y - FRANK.y), fight = men.some(p => p.ai.aware === AW.ALERT);
  if (fight) { if (MUG.it) mugEnd(true); return; }
  if (MUG.paid) { for (const p of men) { const ax = p.x - FRANK.x, ay = p.y - FRANK.y, l = Math.hypot(ax, ay) || 1; stepToward(p, ax / l, ay / l, 2.2); } if (men.every(p => offScreen(p.x, p.y))) mugEnd(); return; }
  if (d > 25 || FRANK.B) { mugEnd(); return; }
  for (const p of men) { p.ai.aware = AW.NONE; if (Math.hypot(p.x - FRANK.x, p.y - FRANK.y) > 1.8) goTo(p, FRANK.x, FRANK.y, 3.4); else { p.moving = false; faceTo(p, FRANK.x - p.x, FRANK.y - p.y); } }
  if (d < 3.2) {
    if (!MUG.it) { MUG.it = { F: null, x: FRANK.x, y: FRANK.y, r: 4, kind: 'mug' }; INTER.push(MUG.it); lead.ai.bark = 'Evening, pal. ' + money(MUG.ask) + ' and nobody gets cut.'; lead.ai.barkT = 240; for (const p of men) { p.ai.armed = true; armFor(p); } }
    MUG.it.x = FRANK.x; MUG.it.y = FRANK.y;
    if (++MUG.t > 60 * 8) { lead.ai.bark = 'Have it your way.'; lead.ai.barkT = 120; for (const p of men) { p.ai.hostile = true; p.ai.lx = FRANK.x; p.ai.ly = FRANK.y; setAware(p, AW.ALERT); } }
  }
}
function mugEnd(keepMen) {
  if (MUG.it) { const k = INTER.indexOf(MUG.it); if (k >= 0) INTER.splice(k, 1); MUG.it = null; }
  if (!keepMen) MUG.men = []; MUG.paid = false;
}
INTERACT.mug = { label: it => INV.money >= MUG.ask ? 'HAND OVER ' + money(MUG.ask) : 'YOU DON\'T HAVE ' + money(MUG.ask), act: it => {
  if (INV.money < MUG.ask) { toast('"No money? Then we\'ll take it out of your hide."'); for (const p of MUG.men) { p.ai.hostile = true; setAware(p, AW.ALERT); } return; }
  giveMoney(-MUG.ask); STATS.spent += MUG.ask; sfxF('coin'); MUG.paid = true; MUG.men[0].ai.bark = 'Pleasure doing business.'; MUG.men[0].ai.barkT = 120;
  const k = INTER.indexOf(MUG.it); if (k >= 0) INTER.splice(k, 1); MUG.it = null;
} };
