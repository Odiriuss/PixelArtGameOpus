// =================================================================== USING THINGS: DOORS, STAIRS, THE LIFT, THE ROOF THAT COMES OFF, WHATEVER E IS NEAR
// One thing at a time can be used: the nearest of a car, a thing on this floor (stairs, a counter, a bed, a phone),
// a container, a body, a locked door. The roof of the building Frank is in comes off (LIFT) and goes back on when he
// leaves; a staircase or a lift is a short fade to the floor it goes to.
const INTERACT = {};
function interactTick() {
  const c = findInteract();
  PLAYER.target = c;
  PLAYER.prompt = c ? 'E  ' + c.label : '';
  if (c && pressed('KeyE')) c.act();
  pressed('KeyE');
}
function sameFloor(a, F) { return (a.F || null) === (F || null); }
function findInteract() {
  const x = FRANK.x, y = FRANK.y, F = FRANK.F;
  let best = null, bd = 1e9;
  const take = (d, label, act) => { if (d < bd) { bd = d; best = { label, act }; } };
  if (!F) {
    const V = enterableNear(x, y);
    if (V) take(distToVehicle(V, x, y), (V.own ? 'DRIVE ' : V.driver === 'ai' ? 'TAKE HIS ' : 'TAKE THE ') + V.name, () => enterVehicle(V));
    const O = trunkNear(x, y); if (O) take(0.6, 'OPEN THE TRUNK', () => openContainer(O.trunk));
    for (const P of PHONES) { const d = Math.hypot(P.x - x, P.y - y); if (d < 1.2) take(d, 'USE THE PAYPHONE', () => openJobs('phone')); }
  }
  for (const it of INTER) {
    if (!sameFloor(it, F)) continue;
    const d = Math.hypot(it.x - x, it.y - y); if (d > it.r) continue;
    const h = INTERACT[it.kind]; if (!h) continue;
    const lab = h.label ? h.label(it) : it.label; if (!lab) continue;
    take(d + 0.2, lab, () => h.act(it));
  }
  for (const K of CONTAINERS) {
    if (!sameFloor(K, F) || (K.body && !K.body.visible)) continue;
    const d = Math.hypot(K.x - x, K.y - y); if (d > (K.body ? 1.1 : 1.25)) continue;
    const keyed = K.locked && K.key && INV.bag.some(e => ITEMS[e.it.key].opens === K.key);
    take(d, K.locked && !keyed ? 'PICK THE LOCK: ' + K.name : 'SEARCH ' + K.name, () => { if (keyed) { K.locked = false; sfx('pick'); } if (K.locked) startPick(K); else openContainer(K); });
  }
  for (const D of DROPS) { if (!sameFloor(D, F) || !D.grid.items.length) continue; const d = Math.hypot(D.x - x, D.y - y); if (d < 1.0) take(d, 'PICK UP', () => openContainer(D)); }
  for (const p of PEOPLE) {                                           // a man who is out cold can be gone through
    if (p === FRANK || !p.ko || !p.alive || p.loot || !sameFloor(p, F)) continue;
    const d = Math.hypot(p.x - x, p.y - y); if (d < 1.1) take(d, 'GO THROUGH HIS POCKETS', () => { bodyLoot(p); openContainer(p.loot); crimeWitness('theft'); });
  }
  const D = doorNear(x, y);
  if (D) take(0.9, doorLabel(D), () => doorAct(D));
  return best;
}
// ------------------------------------------------------------------ doors: shut outside business hours, some locked for good
function businessOpen(B) { return !B.hours || hourIn(clockHour(), B.hours[0], B.hours[1]); }
function updateDoors() {
  for (const D of DOORS) {
    const open = D.forced || (!D.locked && (businessOpen(D.B) || (D.B.enter === 'apartment' && D.face.startsWith('-'))));
    D.stat.off = open;
  }
}
function doorNear(x, y) {
  if (FRANK.B) return null;
  for (const D of DOORS) {
    if (D.stat.off) continue;
    const d = Math.hypot(D.cx + D.nx * 0.5 - x, D.cy + D.ny * 0.5 - y); if (d < 1.1) return D;
  }
  return null;
}
function doorLabel(D) {
  if (!D.locked && !businessOpen(D.B)) return 'CLOSED - OPENS AT ' + hhmm(D.B.hours[0] * 60);
  return INV.bag.some(e => e.it.key === 'lockpick') ? 'PICK THE LOCK' : 'LOCKED';
}
function doorAct(D) {
  if (!INV.bag.some(e => e.it.key === 'lockpick')) { sfx('nope'); toast(D.locked ? 'Locked. You would need picks for that.' : 'Closed. Come back when they open, or bring picks.'); return; }
  startPick({ door: D, lock: D.lock || 1, name: D.B.name, x: D.cx, y: D.cy });
}
// ------------------------------------------------------------------ lock picking: hold still for a while; it makes a little noise
function startPick(K) {
  if (!INV.bag.some(e => e.it.key === 'lockpick')) { sfx('nope'); toast('Locked. You need lock picks.'); return; }
  const t = Math.round(60 * (1.2 + (K.lock || 1) * 1.1) * (1 - PSTAT.lockpick));
  PLAYER.busy = { kind: 'pick', K, t, max: t, x: FRANK.x, y: FRANK.y };
  crimeWitness('breakin');
}
function busyTick() {
  const b = PLAYER.busy;
  if (Math.hypot(FRANK.x - b.x, FRANK.y - b.y) > 0.3 || !FRANK.alive || FRANK.down) { PLAYER.busy = null; return; }
  const k = INPUT.keys; if (k.KeyW || k.KeyA || k.KeyS || k.KeyD || INPUT.clicks) { PLAYER.busy = null; toast('You stop.'); return; }
  FRANK.moving = false; FRANK.crouch = true;
  if (tick % 20 === 0) { sfxF('pick'); makeNoise(FRANK.x, FRANK.y, 3, FRANK.B); }
  if (--b.t > 0) return;
  PLAYER.busy = null; FRANK.crouch = false;
  if (b.K.door) { b.K.door.forced = true; b.K.door.stat.off = true; sfx('door'); toast('Click. You\'re in.'); }
  else { b.K.locked = false; sfx('pick'); openContainer(b.K); }
}
// ------------------------------------------------------------------ stairs and lifts: a fade, and Frank is on the other floor
INTERACT.stairs = { label: it => it.to ? it.label : 'NOBODY YOU KNOW UPSTAIRS', act: it => { if (!it.to) { toast('Nobody you know up there.'); return; } travel(it.to, it.arrive, 'step'); } };
INTERACT.lift = { act: it => travel(it.to, it.arrive, 'lift') };
function travel(F, at, snd) {
  if (PLAYER.pending) return;
  PLAYER.pending = { F, x: at.x, y: at.y }; PLAYER.fadeTo = 1;
  if (snd === 'lift') sfx('lift'); else sfx('step');
}
function fadeTick() {
  PLAYER.fade += clamp(PLAYER.fadeTo - PLAYER.fade, -0.08, 0.08);
  const P = PLAYER.pending;
  if (P && PLAYER.fade >= 1) {
    FRANK.F = P.F; FRANK.B = P.F.B; FRANK.z = P.F.f === 0 ? 0 : P.F.z; FRANK.x = P.x; FRANK.y = P.y; FRANK.moving = false;
    PLAYER.pending = null; PLAYER.fadeTo = 0; CAMF.snap = true;
    LIFT.b = FRANK.B; LIFT.f = FRANK.B.floors.indexOf(FRANK.F); LIFT.k = 1; LIFT.cut = LIFT.f === 0 ? WCUT : cutZ(FRANK.F);
    populateFloor(FRANK.F);
  }
}
// ------------------------------------------------------------------ the roof comes off the building Frank is in
function liftTick() {
  const B = FRANK && !FRANK.inCar ? FRANK.B : null;
  if (B) {
    if (LIFT.b && LIFT.b !== B) { LIFT.k -= 0.1; if (LIFT.k > 0) return; }
    if (LIFT.b !== B) { LIFT.b = B; LIFT.k = 0; }
    LIFT.f = Math.max(0, B.floors.indexOf(FRANK.F)); LIFT.cut = LIFT.f === 0 ? WCUT : cutZ(FRANK.F);
    LIFT.k = Math.min(1, LIFT.k + 0.07);
  } else if (LIFT.b) { LIFT.k -= 0.07; if (LIFT.k <= 0) { LIFT.k = 0; LIFT.b = null; } }
}
function onFrankMoved(B) {
  if (B) { populateFloor(B.floors[0]); if (B.zone && ZONE_ENTER[B.zone]) ZONE_ENTER[B.zone](B); }
  audioPlace();
}
// the building behind the nearest door, for baking its ground floor before he walks in
function doorAhead() {
  if (FRANK.B || FRANK.inCar) return null;
  let best = null, bd = 7;
  for (const D of DOORS) { const d = Math.hypot(D.cx - FRANK.x, D.cy - FRANK.y); if (d < bd) { bd = d; best = D.B; } }
  return best ? best.floors[0] : null;
}
// ------------------------------------------------------------------ the rest of what E does
INTERACT.jukebox = { act: it => { AUD.want = AUD.want || {}; const on = !(AUD.want.song > 0); playSong(on); toast(on ? 'A nickel in the slot. Something slow.' : 'The record winds down.'); } };
INTERACT.radio = { act: it => { const on = !(AUD.want && AUD.want.song > 0); playSong(on); toast(on ? 'Dance music from the Starlite Room.' : 'You switch it off.'); } };
INTERACT.shop = { label: it => shopLabel(it), act: it => openShop(it) };
INTERACT.teller = { label: it => shopOpenHere(it) ? 'THE TELLER' : null, act: it => openBank(it) };
INTERACT.desk = { label: it => LAW.heat > 0 ? 'THE DESK SERGEANT (PAY YOUR FINE)' : 'THE DESK SERGEANT', act: it => payFine() };
INTERACT.sleep = { label: it => it.own || RENT.until > clockAbs() && RENT.B === it.B ? it.label : it.B.enter === 'flophouse' ? 'RENT A BED FIRST' : 'A BED', act: it => trySleep(it) };
INTERACT.phone = { act: it => openJobs('office') };
