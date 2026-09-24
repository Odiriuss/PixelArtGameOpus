// =================================================================== GOON BEHAVIOUR
// spawn -> move to cover -> crouch (reload, wait) -> stand and shoot -> crouch ... ; a goon whose cover is no
// longer cover moves on; a flanker works round the side; nobody stands in front of a car coming at him.
function goonInit(p, role, delay) {
  p.ai = { state: 'spawn', t: delay || 20, cover: null, path: null, pi: 0, role: role || 'hold', range: role === 'rush' ? 7 : role === 'boss' ? 14 : 10,
    peekShots: 0, burst: 0, homeX: p.x, homeY: p.y, repath: 0, dodge: 0,
    onHurt: () => { if (p.ai.state === 'peek' && p.alive && rnd() < 0.7) { p.ai.state = 'cover'; p.ai.t = 50 + rnd() * 60; } } };
  p.aiming = 0;
}
function goonCanSee(p, standing) {
  const [fx, fy, fV] = frankPos(), oz = standing ? 1.4 : (p.crouch ? 0.95 : 1.4);
  if (Math.hypot(fx - p.x, fy - p.y) > 32) return false;
  const t = fV ? [fV.x, fV.y, fV.z + 1.0] : aimPoint(p.x, p.y, oz, FRANK, null);
  return lineClear(p.x, p.y, oz, t[0], t[1], t[2], null, fV);
}
function goonShoot(p, spreadExtra) {
  const g = p.gun; if (g.cool > 0 || g.reload > 0) return;
  if (g.ammo <= 0) { startReload(g); return; }
  const [fx, fy, fV] = frankPos(), oz = p.crouch ? 0.95 : 1.4;
  const t = fV ? [fV.x, fV.y, fV.z + 1.0] : aimPoint(p.x, p.y, oz, FRANK, null);
  const d = Math.hypot(t[0] - p.x, t[1] - p.y), a = Math.atan2(t[1] - p.y, t[0] - p.x);
  const mv = fV ? vehSpeed(fV) * 0.06 : (FRANK.moving ? 0.5 : 0);
  p.dir = dirFromVec(t[0] - p.x, t[1] - p.y, p.dir);
  fireShot(p, g, p.x + Math.cos(a) * 0.35, p.y + Math.sin(a) * 0.35, oz, t[0], t[1], t[2], 1 + d * 0.025 + mv + (spreadExtra || 0), null);
}
function followPath(p, speed) {
  const P = p.ai.path; if (!P || p.ai.pi >= P.length) { p.moving = false; return true; }
  const [tx, ty] = P[p.ai.pi], dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy), st = speed * DT;
  if (d < st + 0.05) { p.x = tx; p.y = ty; p.ai.pi++; p.moving = true; return p.ai.pi >= P.length; }
  const moved = movePerson(p, dx / d * st, dy / d * st);
  p.moving = moved; if (moved) p.dist += st;
  if (!moved && ++p.ai.repath > 30) { p.ai.repath = 0; p.ai.path = null; return true; }
  if (!p.aiming) p.dir = dirFromVec(dx, dy, p.dir);
  return false;
}
function goToCover(p) {
  const c = pickCover(p);
  if (!c) { p.ai.state = 'advance'; p.ai.t = 90; return; }
  p.ai.path = navPath(p.x, p.y, c.x, c.y); p.ai.pi = 0;
  p.ai.state = p.ai.path ? 'move' : 'advance'; p.crouch = false;
}
// a car bearing down: step out of its way
function dodgeCars(p) {
  for (const V of VEH) {
    if (V.gone || vehSpeed(V) < 5) continue;
    const dx = p.x - V.x, dy = p.y - V.y, vs = vehSpeed(V), ux = V.vx / vs, uy = V.vy / vs, along = dx * ux + dy * uy, side = dx * uy - dy * ux;
    if (along > 0 && along < vs * 0.9 + 3 && Math.abs(side) < V.M.hw + 1) {
      const s = side >= 0 ? 1 : -1; p.ai.dodge = 20; p.ai.dx = uy * s; p.ai.dy = -ux * s; p.crouch = false; return true;
    }
  }
  return false;
}
function goonTick(p) {
  gunTick(p.gun); personPhysics(p);
  const ai = p.ai;
  if (!p.alive) { if (ai.cover) { ai.cover.by = null; ai.cover = null; } p.moving = false; p.aiming = 0; return; }
  if (p.down || p.inCar || !ai) { p.moving = false; return; }
  const [fx, fy] = frankPos(), dF = Math.hypot(fx - p.x, fy - p.y);
  if (!FRANK.alive) { p.aiming = 0; p.crouch = false; p.moving = false; return; }
  if (ai.dodge > 0) { ai.dodge--; const st = 4.5 * DT; p.moving = movePerson(p, ai.dx * st, ai.dy * st); p.dist += st; if (!ai.dodge) goToCover(p); return; }
  if (dodgeCars(p)) return;
  if (NAV.built < tick - 60) buildNav(NAV.cx, NAV.cy);
  switch (ai.state) {
    case 'spawn':
      p.moving = false;
      if (--ai.t <= 0) goToCover(p);
      break;
    case 'move': {
      p.aiming = dF < 18 ? 1 : 0;
      if (p.aiming) { p.dir = dirFromVec(fx - p.x, fy - p.y, p.dir); if (p.gun.cool <= 0 && rnd() < 0.015 && goonCanSee(p, true)) goonShoot(p, 1.2); }
      if (followPath(p, p.ai.role === 'rush' ? 3.9 : 3.5)) {
        if (!ai.path) { goToCover(p); break; }
        ai.state = 'cover'; ai.t = 40 + rnd() * 70; p.crouch = true; p.moving = false;
      }
      break;
    }
    case 'cover':
      p.crouch = true; p.aiming = 0; p.moving = false;
      p.dir = dirFromVec(fx - p.x, fy - p.y, p.dir);
      if (p.gun.ammo < p.gun.G.mag * 0.34 && !p.gun.reload) startReload(p.gun);
      if (--ai.t > 0) break;
      if (!ai.cover || lineClear(fx, fy, 1.3, p.x, p.y, 0.75, FRANK.inCar)) { goToCover(p); break; }     // flanked: move
      if (p.gun.reload) { ai.t = 15; break; }
      if (!goonCanSee(p, true)) { if (rnd() < 0.5) goToCover(p); else ai.t = 40; break; }
      if (PEOPLE.filter(q => q.team === 'goons' && q.alive && q.ai && q.ai.state === 'peek').length >= 2) { ai.t = 20 + rnd() * 30; break; }   // two guns up at a time
      ai.state = 'peek'; ai.t = 45 + rnd() * 45; ai.peekShots = p.gun.type === 'tommy' ? 12 : 2 + Math.floor(rnd() * 3); p.crouch = false; ai.aimT = 10;
      break;
    case 'peek':
      p.crouch = false; p.aiming = 1; p.moving = false;
      p.dir = dirFromVec(fx - p.x, fy - p.y, p.dir);
      if (ai.aimT > 0) ai.aimT--;
      else if (p.gun.cool <= 0 && ai.peekShots > 0) {
        if (goonCanSee(p, true)) {
          goonShoot(p, 0); ai.peekShots--;
          if (p.gun.type === 'tommy' && ai.peekShots % 6 === 0) p.gun.cool = 45;          // bursts
        } else { goToCover(p); break; }
      }
      if (--ai.t <= 0 || ai.peekShots <= 0 || p.gun.ammo <= 0) { ai.state = 'cover'; ai.t = 55 + rnd() * 80; p.crouch = true; if (rnd() < 0.25) goToCover(p); }
      break;
    case 'advance': {                                     // no cover anywhere: walk at him shooting
      p.crouch = false; p.aiming = 1;
      p.dir = dirFromVec(fx - p.x, fy - p.y, p.dir);
      const see = goonCanSee(p, true);
      if (see && p.gun.cool <= 0) goonShoot(p, 0.6);
      if (dF > 8 || !see) {
        if (--ai.t <= 0 || (ai.path && ai.pi >= ai.path.length)) { ai.path = navPath(p.x, p.y, fx, fy); ai.pi = 0; ai.t = 60; }
        if (ai.path) followPath(p, 2.6); else p.moving = false;
      } else p.moving = false;
      if (rnd() < 0.01) goToCover(p);
      break;
    }
  }
}
// ------------------------------------------------------------------ the chase: the man in the back seat shoots at Frank
function sedanGunner(S) {
  const g = S.gunner; if (!g || S.wreck || !FRANK.alive || MISSION.phase !== 'chase') return;
  gunTick(g.gun);
  if (--S.gunT > 0) return;
  S.gunT = 12;
  const [fx, fy, fV] = frankPos(), d = Math.hypot(fx - S.x, fy - S.y);
  if (d > 24 || d < 3) return;
  if (g.gun.ammo <= 0) { startReload(g.gun); return; }
  if (g.gun.reload) return;
  // lean out of the side window facing Frank
  const a = Math.atan2(fy - S.y, fx - S.x), rel = a - S.a, off = Math.min(S.M.hl / (Math.abs(Math.cos(rel)) + 1e-6), S.M.hw / (Math.abs(Math.sin(rel)) + 1e-6)) + 0.2;
  const ox = S.x + Math.cos(a) * off, oy = S.y + Math.sin(a) * off, oz = S.z + 1.25;
  const tz = fV ? fV.z + 1.0 : 1.2;
  if (!lineClear(ox, oy, oz, fx, fy, tz, S, fV)) return;
  fireShot(g, g.gun, ox, oy, oz, fx, fy, tz, 1.4 + vehSpeed(S) * 0.05 + d * 0.03, S);
  S.gunT = 50 + Math.floor(rnd() * 50);
}
