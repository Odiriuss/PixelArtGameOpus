// =================================================================== THE TEST DRIVER (?auto=1) AND THE TEST HOOKS
// It plays the level through the same inputs a player has: walks to the nearest car and presses E, drives after
// the sedan with the AI's own pursuit code, fires with F, and in the fight shoots from cover and crouches to reload.
const AUTO = { on: QS.get('auto') === '1', log: [], car: null, walk: null, t: 0 };
function autoInput() {
  if (!AUTO.on || MISSION.lockInput || !FRANK.alive) return;
  const k = INPUT.keys; for (const c in k) k[c] = false;
  AUTO.t++;
  const ph = MISSION.phase;
  if (ph === 'take' && !PLAYER.car) {
    const V = enterableNear(FRANK.x, FRANK.y);
    if (V) { INPUT.pressed.KeyE = true; return; }
    let best = null, bd = 1e9;
    for (const O of VEH) if (!O.gone && !O.kin && !O.noEnter && O.parked && !O.fire) { const d = Math.hypot(O.x - FRANK.x, O.y - FRANK.y); if (d < bd) { bd = d; best = O; } }
    if (best) autoWalk(best.x, best.y);
    return;
  }
  if (ph === 'chase') {
    if (!PLAYER.car) { const V = enterableNear(FRANK.x, FRANK.y); if (V) INPUT.pressed.KeyE = true; else { const O = nearestCar(); if (O) autoWalk(O.x, O.y); } return; }
    const S = MISSION.sedan, d = Math.hypot(S.x - PLAYER.car.x, S.y - PLAYER.car.y);
    if (PLAYER.car.fire || PLAYER.car.sinking) { INPUT.pressed.KeyE = true; return; }       // bail out of a burning car
    if (d < 24 && !S.wreck) { k.KeyF = true; }
    return;
  }
  const fire = !PLAYER.car && VEH.find(V => V.fire === 1 && Math.hypot(V.x - FRANK.x, V.y - FRANK.y) < 8);
  if (fire) { autoWalk(FRANK.x * 2 - fire.x, FRANK.y * 2 - fire.y); return; }           // away from a car about to go up
  if (ph === 'fight') {
    if (PLAYER.car) { if (vehSpeed(PLAYER.car) < 3) INPUT.pressed.KeyE = true; return; }
    const T = autoTarget();
    const lowHp = (!PLAYER.god && FRANK.hp < 45) || FRANK.gun.reload > 0;
    FRANK.crouch = lowHp;
    if (T && !lowHp) k.KeyF = true;
    if (!T && !lowHp) {                                  // hunt: walk the nav grid toward the nearest man
      const g = PEOPLE.filter(p => p.team === 'goons' && p.alive && p.visible).sort((a, b) => Math.hypot(a.x - FRANK.x, a.y - FRANK.y) - Math.hypot(b.x - FRANK.x, b.y - FRANK.y))[0];
      if (g) {
        if (!AUTO.path || AUTO.t % 30 === 0) AUTO.path = navPath(FRANK.x, FRANK.y, g.x, g.y);
        const P = AUTO.path; while (P && P.length > 1 && Math.hypot(P[0][0] - FRANK.x, P[0][1] - FRANK.y) < 0.5) P.shift();
        if (P && P.length) autoWalk(P[0][0], P[0][1]); else autoWalk(g.x, g.y);
      }
    }
    if (T) { const [sx, sy] = worldToScreen(T.x, T.y, 1.1); INPUT.mx = clamp(sx, 0, W - 1); INPUT.my = clamp(sy, 0, H - 1); }
  }
}
function nearestCar() { let best = null, bd = 1e9; for (const O of VEH) if (!O.gone && !O.kin && !O.noEnter && !O.fire && !O.wreck) { const d = Math.hypot(O.x - FRANK.x, O.y - FRANK.y); if (d < bd) { bd = d; best = O; } } return best; }
function autoWalk(tx, ty) {                                // walk by screen direction keys toward a point
  const dx = tx - FRANK.x, dy = ty - FRANK.y, sx = dx - dy, sy = dx + dy, k = INPUT.keys;
  if (Math.abs(sx) > 0.4) { if (sx > 0) k.KeyD = true; else k.KeyA = true; }
  if (Math.abs(sy) > 0.4) { if (sy > 0) k.KeyS = true; else k.KeyW = true; }
  // stuck against something: sidestep
  if (AUTO.walk && Math.hypot(FRANK.x - AUTO.walk[0], FRANK.y - AUTO.walk[1]) < 0.01 && (AUTO.t % 60) < 30) { k.KeyA = !k.KeyA; k.KeyW = !k.KeyW; }
  AUTO.walk = [FRANK.x, FRANK.y];
}
function autoDrive() {
  if (!AUTO.on || !PLAYER.car || MISSION.phase !== 'chase' || MISSION.lockInput) return;
  const V = PLAYER.car, S = MISSION.sedan;
  if (!V.autoAi || V.autoAi.src !== S.ai) {
    // follow the sedan's own route, from wherever we joined it
    V.autoAi = aiInit({ M: V.M }, S.ai ? S.ai.path : ROUTE, { cruise: 20, corner: 7.2, decel: 7.5, mode: 'chase', look: 4.5 });
    V.autoAi.src = S.ai; V.autoAi.i = 0;
    const P = V.autoAi.path; let bi = 0, bd = 1e9;
    for (let k = 0; k < P.length - 1; k++) { const d = Math.hypot(P[k][0] - V.x, P[k][1] - V.y); if (d < bd) { bd = d; bi = k; } }
    V.autoAi.i = Math.max(0, bi - 1);
  }
  const keep = V.ai; V.ai = V.autoAi;
  const d = Math.hypot(S.x - V.x, S.y - V.y), ahead = S.ai && (V.ai.i + V.ai.t) > (S.ai.i + S.ai.t) - 0.15;
  V.ai.band = S.wreck ? 0.3 : ahead ? (d < 12 ? 0.3 : 0) : d < 9 ? 0.75 : d < 16 ? 0.95 : 1.1;
  aiDrive(V);
  V.ai = keep;
}
// ------------------------------------------------------------------ hooks for the headless tests
function routeCheck(path, hl, hw) {                          // sample a path with a car-sized box; report what it would hit
  const P = path || ROUTE, out = [], probe = { x: 0, y: 0, a: 0, M: { hl: hl || 2.45, hw: hw || 0.95 } };
  for (let k = 0; k < P.length - 1; k++) {
    const L = segLen(P, k), n = Math.ceil(L / 0.5);
    probe.a = Math.atan2(P[k + 1][1] - P[k][1], P[k + 1][0] - P[k][0]);
    for (let q = 0; q <= n; q++) {
      probe.x = lerp(P[k][0], P[k + 1][0], q / n); probe.y = lerp(P[k][1], P[k + 1][1], q / n);
      for (const S of staticsNear(probe.x - 3, probe.y - 3, probe.x + 3, probe.y + 3)) {
        if (S.h < 0.3) continue;
        if (S.circle ? obbVsCircle(probe, S.cx, S.cy, S.r) : obbVsBox(probe, S)) out.push({ seg: k, at: [+probe.x.toFixed(1), +probe.y.toFixed(1)], kind: S.kind, s: S.circle ? [S.cx, S.cy, S.r] : [S.x0, S.y0, S.x1, S.y1] });
      }
      if (surfAt(probe.x, probe.y) === 2) out.push({ seg: k, at: [probe.x, probe.y], kind: 'water' });
    }
  }
  const seen = new Set(); return out.filter(o => { const key = o.kind + o.s; if (seen.has(key)) return false; seen.add(key); return true; });
}
function exposeTest() {
  window.__test = {
    GAME, PROF, MISSION, VEH, PEOPLE, STATS, PLAYER, INPUT, ROUTE, AUTO, NAV, CAMF, get FRANK() { return FRANK; },
    routeCheck, startIntro, startTake, startFightCheckpoint, retry, BAKE_STATS, TILES, CITY, STATICS,
    step: n => { for (let i = 0; i < n; i++) update(); },
    begin: () => { GAME.mode = 'play'; beginPlay(); },
    bakeAll: () => { for (const k of bakeTotal()) if (!TILES.has(k)) bakeTileNow(Math.floor(k / 4096) - 1024, (k % 4096) - 1024); },
    state: () => ({ phase: MISSION.phase, t: MISSION.t, frank: FRANK && [+FRANK.x.toFixed(1), +FRANK.y.toFixed(1), Math.round(FRANK.hp)], car: PLAYER.car && [+PLAYER.car.x.toFixed(1), +PLAYER.car.y.toFixed(1), Math.round(PLAYER.car.hp)],
      sedan: MISSION.sedan && [+MISSION.sedan.x.toFixed(1), +MISSION.sedan.y.toFixed(1), Math.round(MISSION.sedan.hp), MISSION.sedan.ai ? MISSION.sedan.ai.i : -1], lost: MISSION.lostT, goons: goonsLeft(), perf: GAME.perf })
  };
}
