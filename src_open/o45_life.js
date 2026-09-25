// =================================================================== LIFE: SLEEP, RENT, GETTING HURT, FIRE AND DYNAMITE, THE SOUNDS OF IT ALL
function clockAbs() { return CLOCK.day * 1440 + CLOCK.min; }
// ------------------------------------------------------------------ sleep: his own sofa, or a bed he has paid for; eight hours go by
const RENT = { until: -1, B: null };
function trySleep(it) {
  if (!(it.own || (RENT.until > clockAbs() && RENT.B === it.B))) { toast(it.B.enter === 'flophouse' ? 'Pay at the desk for a bed first.' : 'Not your bed.'); sfx('nope'); return; }
  if (enemiesNear(FRANK.x, FRANK.y, 30).length || LAW.heat >= 2) { toast('You can\'t sleep with people after you.'); sfx('nope'); return; }
  PLAYER.sleep = { t: 0, hours: 8 }; PLAYER.fadeTo = 1;
}
function sleepTick() {
  const S = PLAYER.sleep; if (!S) return;
  if (PLAYER.fade < 1) return;
  if (S.t++ === 0) {
    passTime(S.hours * 60);
    FRANK.hp = FRANK.maxHp; LAW.heat = 0; LAW.reports.length = 0; FRANK.drunk = 0;
    toast('You sleep. It is ' + clockText() + '.');
    saveGame(true);
  }
  if (S.t > 40) { PLAYER.sleep = null; PLAYER.fadeTo = 0; }
}
// the world after a jump in time: lamps, doors, the streets, who is in the building
function passTime(min) {
  CLOCK.min += min; while (CLOCK.min >= 1440) { CLOCK.min -= 1440; CLOCK.day++; }
  for (let k = 0; k < 400; k++) weatherTick();
  updateLightParams(); updateLamps(); updateDoors();
  for (let k = PEOPLE.length - 1; k >= 0; k--) { const p = PEOPLE[k]; if (p !== FRANK && (p.street || !p.alive)) PEOPLE.splice(k, 1); }
  for (let i = 1; i < BUILDINGS.length; i++) { const B = BUILDINGS[i]; if (B.floors) for (const F of B.floors) if (F !== FRANK.F) { for (const p of F.people || []) { const k = PEOPLE.indexOf(p); if (k >= 0) PEOPLE.splice(k, 1); } F.people = []; F.populated = 0; } }
  if (FRANK.F) { for (const p of FRANK.F.people || []) { const k = PEOPLE.indexOf(p); if (k >= 0 && p.alive) PEOPLE.splice(k, 1); } FRANK.F.people = []; FRANK.F.populated = 0; populateFloor(FRANK.F); }
  for (const Y of YARDS) Y.pop = false;
  MUG.men = []; mugEnd();
  manageTraffic(true); manageCrowd(true);
}
// ------------------------------------------------------------------ down and out: he comes to on his own sofa, the doctor's bill paid from his wallet
const LIFE = { deadT: 0, why: '' };
function lifeTick() {
  if (FRANK.alive) return;
  if (++LIFE.deadT === 1) { LIFE.why = LAW.heat >= 2 ? 'THE POLICE' : 'SOMEBODY'; PLAYER.drawn = false; if (PLAYER.car) exitVehicle(true); }
  if (LIFE.deadT === 150) PLAYER.fadeTo = 1;
  if (LIFE.deadT > 150 && PLAYER.fade >= 1 && !LIFE.woke) {
    LIFE.woke = true;
    const bill = Math.min(INV.money, Math.max(10, Math.round(INV.money * 0.15)));
    giveMoney(-bill); STATS.spent += bill;
    const B = BUILDINGS.find(b => b && b.key === 'office'), U = B.floors[1], bed = INTER.find(i => i.kind === 'sleep' && i.own);
    FRANK.alive = true; FRANK.hp = FRANK.maxHp; FRANK.down = 0; FRANK.crouch = false; FRANK.flash = 0; FRANK.kx = FRANK.ky = 0;
    FRANK.F = U; FRANK.B = B; FRANK.z = U.z; FRANK.x = bed ? bed.x : U.R.x0 + 1.5; FRANK.y = bed ? bed.y : U.R.y0 + 1.5;
    passTime(6 * 60); LAW.heat = 0; LAW.reports.length = 0; standDown();
    for (const V of LAW.cars) V.cops = 0;
    LIFT.b = B; LIFT.f = 1; LIFT.k = 1; LIFT.cut = cutZ(U); CAMF.snap = true;
    populateFloor(U); audioPlace();
    say('Doc Abernathy', 'You\'re lucky, Calder. I took ' + money(bill) + ' for the stitches. Try not to need me again this week.');
  }
  if (LIFE.woke && LIFE.deadT > 200) { LIFE.deadT = 0; LIFE.woke = false; PLAYER.fadeTo = 0; }
}
// ------------------------------------------------------------------ fire: a molotov's pool burns for eight seconds
const FIRES = [];
function fireAt(x, y, fz, F) {
  FIRES.push({ x, y, z: fz, F: F || null, t: 480, r: 1.8 });
  sfxAt('glass', x, y); sfxAt('boom', x, y, 0.3); makeNoise(x, y, 26, F ? F.B : null);
  for (const V of VEH) if (!V.gone && !F && distToVehicle(V, x, y) < 1.5 && !V.fire) { V.fire = 2; V.burnT = 0; }
}
function fireTick() {
  for (let i = FIRES.length - 1; i >= 0; i--) {
    const f = FIRES[i];
    if (--f.t <= 0) { FIRES.splice(i, 1); continue; }
    PART_GZ = f.F ? f.z : undefined;
    if (tick & 1) { const a = rnd() * TAU, r = rnd() * f.r; part('fire', f.x + Math.cos(a) * r, f.y + Math.sin(a) * r, f.z + 0.1, 0, 0, 1 + rnd(), 16 + rnd() * 14, 0); }
    if (tick % 6 === 0) part('smoke', f.x, f.y, f.z + 1.2, (rnd() - 0.5) * 0.3, (rnd() - 0.5) * 0.3, 0.9, 90, 2.2);
    PART_GZ = undefined;
    if (tick % 3 === 0) DYNQ.push({ x: f.x, y: f.y, z: f.z + 0.8, r: 6 + rnd(), k: 1.4 + rnd() * 0.4, life: 3 });
    if (tick % 15 === 0) for (const p of PEOPLE) if (p.alive && (p.F || null) === f.F && Math.hypot(p.x - f.x, p.y - f.y) < f.r) { hurtPerson(p, 6, p === FRANK ? 'fire' : 'frank', 0, 0); if (p.ai && p !== FRANK && p.ai.mode !== 'flee') { p.ai.lx = f.x; p.ai.ly = f.y; } }
  }
}
// dynamite: a blast that throws people down and wrecks cars (walls stop it)
function blastAt(x, y, fz, F) {
  PART_GZ = F ? fz : undefined; fxExplosion(x, y, fz); PART_GZ = undefined;
  sfxAt('boom', x, y); shake(8); makeNoise(x, y, 70, F ? F.B : null);
  for (const p of PEOPLE) {
    if (!p.alive || (p.F || null) !== (F || null)) continue;
    const d = Math.hypot(p.x - x, p.y - y); if (d > 6) continue;
    if (!lineClear(x, y, fz + 0.5, p.x, p.y, p.z + 0.8, null, null, fz)) continue;
    const k = 1 - d / 6; hurtPerson(p, 130 * k * k + 10, p === FRANK ? 'blast' : 'frank', (p.x - x) / (d + 0.1) * 3 * k, (p.y - y) / (d + 0.1) * 3 * k);
    if (p.alive) p.down = Math.max(p.down, Math.round(120 * k));
  }
  if (!F) for (const V of VEH) if (!V.gone) { const d = distToVehicle(V, x, y); if (d < 5) damageVehicle(V, 60 * (1 - d / 5) + 10, 'frank'); }
  for (const Lp of LAMPS) if (!Lp.L.broken && Math.hypot(Lp.x - x, Lp.y - y) < 4) { breakLight(Lp.L); dirtyRect(Lp.L.rect); }
  witnessAct('shooting', x, y);
}
// the Asterion prototype: a bolt of cold light
function fxBeam(ox, oy, oz, hx, hy, hz) {
  for (let k = 0; k < 2; k++) TRACERS.push({ x0: ox, y0: oy, z0: oz + k * 0.05, x1: hx, y1: hy, z1: hz + k * 0.05, life: 7, c: k ? C.WHITE : C.CYAN });
  DYNQ.push({ x: hx, y: hy, z: hz, r: 5, k: 2, life: 6, map: CYNW }); DYNQ.push({ x: ox, y: oy, z: oz, r: 3, k: 1.5, life: 4, map: CYNW });
  for (let k = 0; k < 8; k++) part('spark', hx, hy, hz, (rnd() - 0.5) * 4, (rnd() - 0.5) * 4, rnd() * 3, 14, rnd() < 0.5 ? C.CYAN : C.WHITE);
}
// ------------------------------------------------------------------ sounds this level adds to the shared set
function sfxF(name) { if (FRANK) sfxAt(name, FRANK.x, FRANK.y); }
function sfxExtra(name, t, d) {
  switch (name) {
    case 'holster': noiseBurst(t, 0.05, 0.12, 'bandpass', 2400, 2, d); tone(420, t + 0.03, 0.03, 'square', 0.03, d); break;
    case 'use': noiseBurst(t, 0.12, 0.1, 'bandpass', 900, 1.5, d); break;
    case 'swish': { const s = AUD.ctx.createBufferSource(), f = AUD.ctx.createBiquadFilter(), g = AUD.ctx.createGain(); s.buffer = AUD.noise; f.type = 'bandpass'; f.Q.value = 3;
      f.frequency.setValueAtTime(700, t); f.frequency.exponentialRampToValueAtTime(2600, t + 0.12); env(g, t, 0.02, 0.2, 0.1); s.connect(f); f.connect(g); g.connect(d); s.start(t, rnd()); s.stop(t + 0.18); break; }
    case 'punch': tone(90, t, 0.1, 'sine', 0.4, d); noiseBurst(t, 0.06, 0.4, 'lowpass', 900, 1, d); break;
    case 'glass': for (let k = 0; k < 4; k++) tone(2200 + rnd() * 2400, t + k * 0.03, 0.12, 'sine', 0.05, d); noiseBurst(t, 0.2, 0.2, 'highpass', 4500, 1, d); break;
    case 'zap': sweep(t, 2400, 200, 0.35, 'sawtooth', 0.12, d); noiseBurst(t, 0.2, 0.2, 'bandpass', 3000, 3, d); break;
    case 'shotgun': noiseBurst(t, 0.06, 0.8, 'highpass', 1500, 0.7, d); noiseBurst(t, 0.5, 1.0, 'lowpass', 900, 0.7, d); tone(60, t, 0.35, 'sine', 0.7, d); break;
    case 'rifle': noiseBurst(t, 0.04, 0.8, 'highpass', 3000, 0.7, d); noiseBurst(t, 0.6, 0.7, 'lowpass', 1600, 0.6, d); tone(70, t, 0.4, 'sine', 0.5, d); break;
    case 'alarm': for (let k = 0; k < 10; k++) { tone(880, t + k * 0.25, 0.12, 'square', 0.08, d); tone(660, t + k * 0.25 + 0.12, 0.12, 'square', 0.08, d); } break;
    default: sfx(name);
  }
}
// what Frank hears where he is: the rain outside, muffled indoors; the band or the jukebox in a place that is open
function audioPlace() {
  if (!FRANK) return;
  const B = FRANK.inCar ? null : FRANK.B, music = B && businessOpen(B) && ['bar', 'club', 'dancehall', 'billiards', 'diner'].includes(B.enter);
  if (!B && AUD.want.song) playSong(false);
  setAmbience(WEATHER.rain * (B ? 0.5 : 1), B ? 0.15 : 1, music ? (B.enter === 'club' || B.enter === 'dancehall' ? 0.8 : 0.35) : 0, music ? 1 : 0.2);
}
