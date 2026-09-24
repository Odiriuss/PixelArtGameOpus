// =================================================================== THE MISSION: THE BLACK SEDAN
// intro (the drive-by outside the Blue Comet) -> take (grab any car) -> chase (don't lose them) -> fight (where the
// sedan stops: Pier 9, or wherever Frank disables it) -> outro (what the leader carried) -> end. Retry points:
// the start of the chase, and the fight at Pier 9.
const ROUTE = [                                        // [x, y, speed limit from here]
  [39.2, 57], [40.4, 60.5], [41.6, 65],              // pull out from the kerb
  [41.6, 75.6], [12.4, 75.6], [12.4, 46.4],          // south on the first avenue, west, north
  [89, 46.4, 8], [95, 41, 6], [95, 12, 8], [92, 7.6], // east, then up the alley behind the bank
  [41.6, 7.6], [41.6, 41.6], [30, 41.6, 7], [27, 45, 6], // west along the north side, south past the streetcar, west
  [27, 74, 9], [29.5, 81], [33, 88],                 // down the alley behind the Blue Comet, out over the waterfront
  [104, 88, 9], [109, 91.5, 7], [110, 97.3]          // along the promenade and in through the Pier 9 gate
];
const MISSION = { phase: 'title', t: 0, sedan: null, crew: [], lockInput: false, checkpoint: 'take', lostT: 0, goal: '', lines: [], caption: null,
  onEnter: null, fightAt: null, outroT: 0, failWhy: '', fade: 0, fadeTo: 0 };
function say(who, text, dur) { MISSION.lines.push({ who, text, t: 0, dur: dur || Math.max(120, text.length * 4) }); }
function caption(text) { MISSION.caption = { text, t: 0, dur: 200 }; }
const TOASTS = [];
function toast(text) { if (!TOASTS.some(t => t.text === text)) TOASTS.push({ text, t: 150 }); }
function resetWorld() {
  VEH.length = 0; PEOPLE.length = 0; PARTS.length = 0; TRACERS.length = 0; DYNQ.length = 0; SKID.n = 0; SKID.i = 0; TOASTS.length = 0;
  MISSION.lines.length = 0; MISSION.caption = null; MISSION.lostT = 0; MISSION.lockInput = false; MISSION.fightAt = null; MISSION.outroT = 0;
  FRANK = makePerson('frank', 'frank', 36.4, 61.6, { hp: 100 }); FRANK.gun = makeGun('revolver'); FRANK.dir = 0;
  PLAYER.car = null; PLAYER.calm = 999; PLAYER.lastFire = -999; PLAYER.god = !!QS.get('god'); CAMF.override = null; CAMF.snap = true;
  spawnParked();
  spawnTram(30, 1);
  spawnTraffic(7, 0);
  makeSedan(ROUTE[0][0], ROUTE[0][1], Math.PI / 2);
  NOISE.t = 0;
}
function makeSedan(x, y, a) {
  const S = makeVehicle('sedan', x, y, a, 'black', 'black', { hp: 300, plate: C.PALEY, name: 'BLACK SEDAN' });
  S.target = true; S.noExplode = true; S.noEnter = true; S.driver = 'goons'; S.armor = 0.6; S.bulletArmor = 0.6; S.gunT = 60;   // a heavy Packard
  aiInit(S, ROUTE.map(p => p.slice()), { cruise: 16.5, corner: 7, decel: 6.5, stopAtEnd: true, mode: 'chase', look: 4.5, band: 0 });
  S.onDisabled = () => { if (MISSION.phase === 'chase' || MISSION.phase === 'take') startFight(false); };
  MISSION.sedan = S;
  const crew = MISSION.crew = [makePerson('goon', 'goon', x, y, { hp: 100 }), makePerson('goon', 'goon2', x, y, { hp: 100 }),
    makePerson('goon', 'goon3', x, y, { hp: 100 }), makePerson('goon', 'leader', x, y, { hp: 150, leader: true })];
  crew.forEach((p, k) => { p.inCar = S; p.visible = false; p.gun = makeGun(k === 3 ? 'tommy' : 'pistol'); });
  S.gunner = crew[1];
  return S;
}
// ------------------------------------------------------------------ phases
function startIntro() {
  resetWorld();
  MISSION.phase = 'intro'; MISSION.t = 0; MISSION.lockInput = true; MISSION.checkpoint = 'take'; MISSION.fade = 1; MISSION.fadeTo = 0;
  MISSION.sedan.ai.band = 0;
  spawnCivilian(35.6, 63.8, false); spawnCivilian(37.3, 64.6, false); spawnCivilian(37.0, 55.5, false);
  CAMF.override = [38.5, 60];
  setAmbience(1, 1, 0.5, 0.15); setMusic('none');
}
function startTake() {
  if (MISSION.phase !== 'intro') { resetWorld(); MISSION.fade = 1; MISSION.fadeTo = 0; }
  MISSION.phase = 'take'; MISSION.t = 0; MISSION.lockInput = false; CAMF.override = null; FRANK.crouch = false;
  MISSION.goal = 'TAKE A CAR  -  ANY CAR  [E]';
  MISSION.onEnter = () => { if (MISSION.phase === 'take') startChase(); };
  MISSION.sedan.ai.band = 0.55; MISSION.sedan.xray = C.CORAL;
  setAmbience(1, 1, 0.25, 0.15);
}
function startChase() {
  MISSION.phase = 'chase'; MISSION.t = 0; MISSION.goal = 'STAY ON THE BLACK SEDAN - RAM IT, SHOOT IT';
  caption("DON'T LOSE THEM");
  say('Frank', ['Come on, you old crate.', 'Easy does it. Then not easy at all.', 'Let\'s see what you\'ve got.'][STATS.carsTaken % 3]);
  setMusic('chase'); setAmbience(1, 1, 0, 1);
}
function sedanTick() {
  const S = MISSION.sedan; if (!S) return;
  if (S.sinking && (MISSION.phase === 'chase' || MISSION.phase === 'take')) { startFight(false); say('Frank', 'Swim for it, boys.'); return; }
  if (S.gone) return;
  const ai = S.ai; if (!ai) return;
  const [fx, fy] = frankPos(), d = Math.hypot(S.x - fx, S.y - fy);
  if (MISSION.phase === 'take') ai.band = d > 60 ? 0.3 : 0.55;
  else if (MISSION.phase === 'chase') ai.band = d > 70 ? 0.6 : d > 45 ? 0.78 : d > 22 ? 0.95 : 1.06;
  sedanGunner(S);
  if (ai.done && (MISSION.phase === 'chase' || MISSION.phase === 'take')) startFight(true);
}
// the crew gets out and the shooting starts
function startFight(atPier) {
  const S = MISSION.sedan;
  MISSION.phase = 'fight'; MISSION.t = 0; MISSION.checkpoint = 'fight'; MISSION.goal = 'TAKE THEM DOWN';
  S.ai = null; S.thr = 0; S.brk = 0; S.hand = 1; S.driver = null; S.noEnter = true;
  caption(atPier ? 'PIER 9' : 'END OF THE LINE');
  setMusic('fight');
  const roles = ['hold', 'flank', 'rush', 'boss'];
  MISSION.crew.forEach((p, k) => {
    const side = k & 1 ? 1 : -1, c = Math.cos(S.a), s = Math.sin(S.a), u = k < 2 ? 0.5 : -0.9, v = side * (S.M.hw + 0.55);
    let x = S.x + u * c - v * s, y = S.y + u * s + v * c;
    if (!personFree(x, y, 0.3)) { [x, y] = doorPoint(S, -side); if (!personFree(x, y, 0.3)) [x, y] = landNear(x, y); }   // or up onto the quay
    p.x = x; p.y = y; p.inCar = null; p.visible = true;
    if (p.alive) goonInit(p, roles[k], 8 + k * 14);
  });
  if (atPier) for (const [x, y, k] of [[103.9, 100.2, 0], [103.9, 101.6, 1]]) {
    const g = makePerson('goon', k ? 'goon3' : 'goon2', x, y, { hp: 100 }); g.gun = makeGun('pistol'); goonInit(g, k ? 'flank' : 'hold', 120 + k * 80);
  }
  MISSION.fightAt = [(S.x + FRANK.x) / 2, (S.y + FRANK.y) / 2];
  if (PLAYER.car) MISSION.fightAt = [(S.x + PLAYER.car.x) / 2, (S.y + PLAYER.car.y) / 2];
  buildNav(S.x, S.y);
  S.gunner = null; S.target = true;
}
function startFightCheckpoint() {
  resetWorld();
  for (const V of VEH) if (V.ai && V.ai.mode === 'traffic' && Math.hypot(V.x - 109, V.y - 90) < 30) V.gone = true;
  const S = MISSION.sedan, end = ROUTE[ROUTE.length - 1];
  S.x = end[0]; S.y = end[1]; S.a = Math.PI / 2 + 0.1;
  const car = makeVehicle('coupe', 108.4, 91.2, Math.PI / 2 - 0.05, 'red', 'cream');     // just through the gate behind them
  FRANK.x = 108; FRANK.y = 89; enterVehicle(car); car.vy = 2;
  CAMF.snap = true;
  MISSION.fade = 1; MISSION.fadeTo = 0;
  startFight(true);
}
function landNear(x, y) {                                  // the nearest spot a man can stand, spiralling out
  for (let r = 0.5; r < 8; r += 0.5) for (let k = 0; k < 16; k++) {
    const a = (k + r) / 16 * Math.PI * 2, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    if (personFree(px, py, 0.3)) return [px, py];
  }
  return [x, y];
}
function goonsLeft() { return PEOPLE.filter(p => p.team === 'goons' && p.alive && !p.inCar).length; }
function missionTick() {
  const M = MISSION; M.t++;
  M.fade += clamp(M.fadeTo - M.fade, -0.03, 0.03);
  for (const L of M.lines.slice(0, 1)) if (++L.t > L.dur) M.lines.shift();
  if (M.caption && ++M.caption.t > M.caption.dur) M.caption = null;
  for (let i = TOASTS.length - 1; i >= 0; i--) if (--TOASTS[i].t <= 0) TOASTS.splice(i, 1);
  if (NOISE.t > 0) NOISE.t--;
  const S = M.sedan;
  switch (M.phase) {
    case 'intro': {
      const t = M.t;
      if (t === 1) caption('THE NICKEL MILE  -  11:48 P.M.');
      if (t === 80) say('Frank', "That black Packard. It was outside the Mirador an hour ago.");
      if (t === 150) { S.ai.band = 0.5; sfxAt('horn', S.x, S.y); }
      if (t >= 175 && t <= 235 && t % 20 === 15) {                            // the drive-by: three shots over his head
        const g = S.gunner, ox = S.x + 1.2, oy = S.y, oz = 1.3;
        fireShot(g, g.gun, ox, oy, oz, FRANK.x - 0.6, FRANK.y + 0.4, 2.6, 0.2, S); g.gun.ammo = g.gun.G.mag;
        FRANK.crouch = true; FRANK.aiming = 0;
        for (const p of PEOPLE) if (p.team === 'civ') civFlee(p);
      }
      if (t === 250) { S.ai.band = 1; sfxAt('crash', S.x, S.y, 2); }
      if (t === 260) { FRANK.crouch = false; say('Frank', "Not tonight, you don't."); }
      if (t > 300 || (t > 40 && (pressed('Enter') || pressed('Space')))) { if (t < 300) { S.x = 41.6; S.y = 75; S.ai.i = 3; S.ai.band = 0.55; S.vy = 8; } startTake(); }
      break;
    }
    case 'take':
      if (M.t % 600 === 300 && !PLAYER.car) toast('Any car will do. Walk up to one and press E.');
      break;
    case 'chase': {
      STATS.chaseT++;
      const [fx, fy] = frankPos(), d = Math.hypot(S.x - fx, S.y - fy);
      if (d > 85) { if (++M.lostT > 420) fail('THEY GOT AWAY'); } else M.lostT = Math.max(0, M.lostT - 3);
      if (!PLAYER.car && M.t % 400 === 200) toast('Get back in a car!');
      break;
    }
    case 'fight':
      STATS.fightT++;
      if (MISSION.fightAt && M.t % 90 === 0) { const [fx, fy] = frankPos(); NAV.cx = (NAV.cx * 3 + fx) / 4; NAV.cy = (NAV.cy * 3 + fy) / 4; }
      if (goonsLeft() === 0) { if (++M.outroT > 100) startOutro(); }
      break;
    case 'outro': outroTick(); break;
  }
  if ((M.phase === 'take' || M.phase === 'chase' || M.phase === 'fight') && !FRANK.alive && M.phase !== 'fail') fail('FRANK CALDER IS DOWN');
  if (M.phase !== 'fail' && M.phase !== 'end' && !FRANK.inCar && FRANK.alive && surfAt(FRANK.x, FRANK.y) === 2) { FRANK.alive = false; fail('INTO THE HARBOUR'); }
}
function fail(why) {
  MISSION.phase = 'fail'; MISSION.failWhy = why; MISSION.t = 0; MISSION.lockInput = true; setMusic('none');
  STATS.retries++;
}
function retry() { if (MISSION.checkpoint === 'fight') startFightCheckpoint(); else startTake(); }
// ------------------------------------------------------------------ what the leader carried
function startOutro() {
  const M = MISSION; M.phase = 'outro'; M.t = 0; M.lockInput = true; M.goal = ''; setMusic('none');
  const L = PEOPLE.find(p => p.leader) || FRANK;
  M.outroAt = [L.x, L.y]; CAMF.override = [L.x, L.y];
  if (PLAYER.car) exitVehicle(true);
  FRANK.aiming = 0; FRANK.crouch = false;
}
function outroTick() {
  const M = MISSION, t = M.t, [lx, ly] = M.outroAt;
  const dx = lx - FRANK.x, dy = ly - FRANK.y, d = Math.hypot(dx, dy);
  if (d > 1.2 && t < 400) { const st = 2.2 * DT; FRANK.moving = movePerson(FRANK, dx / d * st, dy / d * st); FRANK.dist += st; FRANK.dir = dirFromVec(dx, dy, FRANK.dir); }
  else FRANK.moving = false;
  if (t === 30) say('Frank', 'Nico Vance. You drive like a man with somewhere to be.');
  if (t === 190) say('Frank', "Let's see where.");
  if (t === 300) { caption('IN HIS COAT'); M.clue = 0; }
  if (t > 300 && M.clue !== undefined) M.clue = Math.min(1, M.clue + 0.02);
  if (t === 420) say('Frank', 'A dock pass for Pier 9. Asterion Shipping. And on the back, in pencil: 2:17.', 260);
  if (t === 700) say('Frank', "Two-seventeen. Whatever's coming in tonight, it isn't on anybody's schedule.", 260);
  if (t > 1000 || (t > 460 && pressed('Enter'))) { M.phase = 'end'; M.t = 0; setMusic('none'); }
}
