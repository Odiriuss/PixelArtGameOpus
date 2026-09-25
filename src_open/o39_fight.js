// =================================================================== A FIGHT, ON WHATEVER FLOOR IT HAPPENS
// The test level's cover fighting (the walk grid, cover that hides a crouching man, two guns up at a time), taken
// indoors and upstairs: heights are measured from the floor the man stands on, and the walk grid is built on
// Frank's floor, clipped to the room when he is upstairs. Men with clubs and knives just come at him.
function ensureNav() {
  const [fx, fy] = frankPos(), z = FRANK.inCar ? 0 : FRANK.z, clip = FRANK.F && FRANK.F.f > 0 ? FRANK.F.R : null;
  if (Math.abs(NAV.z - z) < 0.1 && NAV.clip === clip && Math.hypot(NAV.cx - fx, NAV.cy - fy) < 8 && tick - NAV.built < 90) return;
  NAV.z = z; NAV.clip = clip; buildNav(fx, fy);
}
function navUsable(p, x, y) {
  if (Math.abs(NAV.z - p.z) > 0.1 || tick - NAV.built > 200) return false;
  const h = NAV.gw * NAV.cell / 2 - 0.5;
  return Math.abs(p.x - NAV.cx) < h && Math.abs(p.y - NAV.cy) < h && Math.abs(x - NAV.cx) < h && Math.abs(y - NAV.cy) < h;
}
// walk toward a point (by the grid when there is one here); true when there
function goTo(p, x, y, speed) {
  const ai = p.ai;
  if (Math.hypot(x - p.x, y - p.y) < 0.35) { p.moving = false; ai.path = null; return true; }
  if (!ai.path || ai.gx !== x || ai.gy !== y || ai.pi >= ai.path.length) {
    ai.gx = x; ai.gy = y; ai.pi = 0;
    ai.path = (navUsable(p, x, y) && navPath(p.x, p.y, x, y)) || [[x, y]];
  }
  const [tx, ty] = ai.path[ai.pi], dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy), st = speed * DT;
  if (d < st + 0.05) { if (personFree(tx, ty, p.r, p.z, p)) { p.x = tx; p.y = ty; if (p.z < 0.5) placePerson(p); } ai.pi++; p.moving = true; return false; }
  const moved = movePerson(p, dx / d * st, dy / d * st) || movePerson(p, (dx - dy) / d * st * 0.7, (dy + dx) / d * st * 0.7);
  p.moving = moved; if (moved) p.dist += st;
  if (!p.aiming) faceTo(p, dx, dy);
  if (!moved && ++ai.repath > 25) { ai.repath = 0; ai.path = null; if (++ai.stuck > 4) { ai.stuck = 0; return true; } }
  else if (moved) ai.stuck = 0;
  return false;
}
// ------------------------------------------------------------------ seeing to shoot
function shotFrom(p, standing) { return p.z + (standing || !p.crouch ? 1.4 : 0.95); }
function shotClear(p, standing) {
  const [fx, fy, fV] = frankPos();
  if (Math.hypot(fx - p.x, fy - p.y) > 32 || (!fV && (FRANK.F || null) !== (p.F || null))) return false;
  const oz = shotFrom(p, standing), t = fV ? [fV.x, fV.y, fV.z + 1.0] : aimPoint(p.x, p.y, oz, FRANK, null);
  return lineClear(p.x, p.y, oz, t[0], t[1], t[2], null, fV, p.z);
}
function guardShoot(p, spreadExtra) {
  const g = p.gun; if (!g || g.G.kind !== 'gun' || g.cool > 0 || g.reload > 0) return;
  if (g.ammo <= 0) { startReload(g); return; }
  const [fx, fy, fV] = frankPos(), oz = shotFrom(p);
  const t = fV ? [fV.x, fV.y, fV.z + 1.0] : aimPoint(p.x, p.y, oz, FRANK, null);
  const d = Math.hypot(t[0] - p.x, t[1] - p.y), a = Math.atan2(t[1] - p.y, t[0] - p.x), mv = fV ? vehSpeed(fV) * 0.06 : (FRANK.moving ? 0.5 : 0);
  faceTo(p, t[0] - p.x, t[1] - p.y);
  fireShot(p, g, p.x + Math.cos(a) * 0.35, p.y + Math.sin(a) * 0.35, oz, t[0], t[1], t[2], 1 + d * 0.025 + mv + (spreadExtra || 0) + (LIGHTM.v < 0.25 ? 0.6 : 0), null);
}
function takeCover(p) {
  const c = navUsable(p, p.x, p.y) ? pickCover(p) : null;
  if (!c) { p.ai.state = 'advance'; p.ai.t = 90; return; }
  p.ai.path = navPath(p.x, p.y, c.x, c.y); p.ai.pi = 0; p.ai.gx = c.x; p.ai.gy = c.y;
  p.ai.state = p.ai.path ? 'move' : 'advance'; p.crouch = false;
}
function dodgeCars(p) {
  if (p.z > 0.5 || p.B) return false;
  for (const V of VEH) {
    if (V.gone || vehSpeed(V) < 5 || Math.abs(V.x - p.x) > 20 || Math.abs(V.y - p.y) > 20) continue;
    const dx = p.x - V.x, dy = p.y - V.y, vs = vehSpeed(V), ux = V.vx / vs, uy = V.vy / vs, along = dx * ux + dy * uy, side = dx * uy - dy * ux;
    if (along > 0 && along < vs * 0.9 + 3 && Math.abs(side) < V.M.hw + 1) { const s = side >= 0 ? 1 : -1; p.ai.dodge = 20; p.ai.dx = uy * s; p.ai.dy = -ux * s; p.crouch = false; return true; }
  }
  return false;
}
// ------------------------------------------------------------------ one tick of a man in a fight with Frank
function fightTick(p) {
  const ai = p.ai, [fx, fy] = frankPos(), dF = Math.hypot(fx - p.x, fy - p.y);
  p.sink = 0; p.pose = null;
  if (!FRANK.alive) { p.aiming = 0; p.crouch = false; p.moving = false; return; }
  if (ai.dodge > 0) { ai.dodge--; const st = 4.5 * DT; p.moving = movePerson(p, ai.dx * st, ai.dy * st); p.dist += st; if (!ai.dodge) takeCover(p); return; }
  if (dodgeCars(p)) return;
  if (!p.gun || p.gun.G.kind !== 'gun') {                                      // a club, a knife, bare hands: close in and swing
    p.aiming = 0; p.crouch = false;
    if (dF > (p.gun ? p.gun.G.reach : 1) * 0.9 || (FRANK.F || null) !== (p.F || null)) goTo(p, fx, fy, 4.2);
    else { p.moving = false; faceTo(p, fx - p.x, fy - p.y); if (!FRANK.inCar) swing(p, p.gun || (p.gun = makeGun('fists'))); }
    return;
  }
  switch (ai.state) {
    case 'spawn': p.moving = false; if (--ai.t <= 0) takeCover(p); break;
    case 'move': {
      p.aiming = dF < 18 ? 1 : 0;
      if (p.aiming) { faceTo(p, fx - p.x, fy - p.y); if (p.gun.cool <= 0 && rnd() < 0.015 && shotClear(p, true)) guardShoot(p, 1.2); }
      if (goTo(p, ai.gx, ai.gy, ai.role === 'rush' ? 3.9 : 3.5)) { ai.state = 'cover'; ai.t = 40 + rnd() * 70; p.crouch = true; p.moving = false; }
      break;
    }
    case 'cover':
      p.crouch = true; p.aiming = 0; p.moving = false; faceTo(p, fx - p.x, fy - p.y);
      if (p.gun.ammo < p.gun.G.mag * 0.34 && !p.gun.reload) startReload(p.gun);
      if (--ai.t > 0) break;
      if (!ai.cover || lineClear(fx, fy, FRANK.z + 1.3, p.x, p.y, p.z + 0.75, FRANK.inCar, null, p.z)) { takeCover(p); break; }     // flanked: move
      if (p.gun.reload) { ai.t = 15; break; }
      if (!shotClear(p, true)) { if (rnd() < 0.5) takeCover(p); else ai.t = 40; break; }
      if (PEOPLE.filter(q => q.team === p.team && q.alive && q.ai && q.ai.state === 'peek').length >= 2) { ai.t = 20 + rnd() * 30; break; }
      ai.state = 'peek'; ai.t = 45 + rnd() * 45; ai.peekShots = p.gun.G.auto ? 12 : 2 + Math.floor(rnd() * 3); p.crouch = false; ai.aimT = 10;
      break;
    case 'peek':
      p.crouch = false; p.aiming = 1; p.moving = false; faceTo(p, fx - p.x, fy - p.y);
      if (ai.aimT > 0) ai.aimT--;
      else if (p.gun.cool <= 0 && ai.peekShots > 0) {
        if (shotClear(p, true)) { guardShoot(p, 0); ai.peekShots--; if (p.gun.G.auto && ai.peekShots % 6 === 0) p.gun.cool = 45; }
        else { takeCover(p); break; }
      }
      if (--ai.t <= 0 || ai.peekShots <= 0 || p.gun.ammo <= 0) { ai.state = 'cover'; ai.t = 55 + rnd() * 80; p.crouch = true; if (rnd() < 0.25) takeCover(p); }
      break;
    case 'advance': {                                                             // no cover anywhere: walk at him shooting
      p.crouch = false; p.aiming = 1; faceTo(p, fx - p.x, fy - p.y);
      const see = shotClear(p, true);
      if (see && p.gun.cool <= 0) guardShoot(p, 0.6);
      if (dF > 8 || !see) { if (--ai.t <= 0) { ai.path = null; ai.t = 60; } goTo(p, fx, fy, 2.6); if (see) faceTo(p, fx - p.x, fy - p.y); }
      else p.moving = false;
      if (rnd() < 0.01) takeCover(p);
      break;
    }
    default: ai.state = 'spawn'; ai.t = 10;
  }
}
