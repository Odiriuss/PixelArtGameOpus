// =================================================================== GUNS
// Hitscan in 3D. A shot is a line from the muzzle (1.4 m standing, 0.95 m crouched) to a point on its target;
// anything in between stops it: a wall, a car, a crate you can crouch behind but not stand behind.
const GUNS = {
  revolver: { mag: 6, cool: 16, reload: 96, dmg: 34, spread: 0.035, range: 42, snd: 'revolver', carDmg: 4 },
  pistol:   { mag: 8, cool: 24, reload: 120, dmg: 7, spread: 0.05, range: 34, snd: 'pistol', carDmg: 2 },
  tommy:    { mag: 30, cool: 6, reload: 150, dmg: 5, spread: 0.11, range: 30, snd: 'tommy', carDmg: 2.5 }
};
function makeGun(type) { return { type, G: GUNS[type], ammo: GUNS[type].mag, cool: 0, reload: 0 }; }
function gunTick(g) { if (g.cool > 0) g.cool--; if (g.reload > 0 && --g.reload === 0) { g.ammo = g.G.mag; } }
function startReload(g) { if (g.reload > 0 || g.ammo === g.G.mag) return false; g.reload = g.G.reload; return true; }
// ------------------------------------------------------------------ the ray: nearest of statics, cars, people
const RAY = { t: 0, kind: '', what: null, x: 0, y: 0, z: 0 };
function rayBox2(ox, oy, dx, dy, x0, y0, x1, y1) {                 // returns [t0, t1] or null
  let t0 = -1e9, t1 = 1e9;
  if (Math.abs(dx) < 1e-9) { if (ox < x0 || ox > x1) return null; } else { let a = (x0 - ox) / dx, b = (x1 - ox) / dx; if (a > b) [a, b] = [b, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, b); }
  if (Math.abs(dy) < 1e-9) { if (oy < y0 || oy > y1) return null; } else { let a = (y0 - oy) / dy, b = (y1 - oy) / dy; if (a > b) [a, b] = [b, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, b); }
  return t0 <= t1 && t1 >= 0 ? [Math.max(0, t0), t1] : null;
}
function rayCircle2(ox, oy, dx, dy, cx, cy, r) {
  const fx = ox - cx, fy = oy - cy, b = fx * dx + fy * dy, c = fx * fx + fy * fy - r * r, disc = b * b - c;
  if (disc < 0) return -1; const t = -b - Math.sqrt(disc); return t >= 0 ? t : (c < 0 ? 0 : -1);
}
// first t in [t0, t1] where the ray is below height h (and above the ground), or -1
function columnHit(oz, slope, t0, t1, h) {
  const z0 = oz + slope * t0, z1 = oz + slope * t1;
  if (z0 < h && z0 >= -0.05) return t0;
  if (slope < 0 && z1 < h) return t0 + (h - z0) / slope;
  return -1;
}
function castRay(ox, oy, oz, dx, dy, slope, range, ignP, ignV, noPeople) {
  RAY.t = range; RAY.kind = 'none'; RAY.what = null;
  const ex = ox + dx * range, ey = oy + dy * range;
  for (const S of staticsNear(Math.min(ox, ex), Math.min(oy, ey), Math.max(ox, ex), Math.max(oy, ey))) {
    let t;
    if (S.circle) { const tc = rayCircle2(ox, oy, dx, dy, S.cx, S.cy, S.r); if (tc < 0 || tc >= RAY.t) continue; t = columnHit(oz, slope, tc, tc + S.r, S.h); }
    else { const iv = rayBox2(ox, oy, dx, dy, S.x0, S.y0, S.x1, S.y1); if (!iv || iv[0] >= RAY.t) continue; t = columnHit(oz, slope, iv[0], Math.min(iv[1], RAY.t), S.h); }
    if (t >= 0 && t < RAY.t) { RAY.t = t; RAY.kind = 'static'; RAY.what = S; }
  }
  for (const V of VEH) {
    if (V.gone || V === ignV) continue;
    const c = Math.cos(V.a), s = Math.sin(V.a), lx = ox - V.x, ly = oy - V.y;
    const u = lx * c + ly * s, v = -lx * s + ly * c, du = dx * c + dy * s, dv = -dx * s + dy * c;
    const iv = rayBox2(u, v, du, dv, -V.M.hl, -V.M.hw, V.M.hl, V.M.hw); if (!iv || iv[0] >= RAY.t) continue;
    const t = columnHit(oz - V.z, slope, iv[0], Math.min(iv[1], RAY.t), V.M.height * 0.92);
    if (t >= 0 && t < RAY.t) { RAY.t = t; RAY.kind = 'car'; RAY.what = V; }
  }
  if (!noPeople) for (const p of PEOPLE) {
    if (p === ignP || !p.visible || p.inCar || p.down) continue;
    const t = rayCircle2(ox, oy, dx, dy, p.x, p.y, 0.3); if (t < 0 || t >= RAY.t) continue;
    const z = oz + slope * t; if (z < 0 || z > personHeight(p)) continue;
    RAY.t = t; RAY.kind = 'person'; RAY.what = p;
  }
  RAY.x = ox + dx * RAY.t; RAY.y = oy + dy * RAY.t; RAY.z = oz + slope * RAY.t;
  return RAY;
}
// can a shot from (a, az) reach (b, bz) through the scenery (people and the two ends' own cars ignored)?
function lineClear(ax, ay, az, bx, by, bz, ignV, ignV2) {
  const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1e-6;
  castRay(ax, ay, az, dx / d, dy / d, (bz - az) / d, d, null, ignV, true);
  return RAY.kind === 'none' || (RAY.kind === 'car' && RAY.what === ignV2);
}
// the point to aim at on a target: chest if it can be seen, else the head, else the chest anyway
function aimPoint(ax, ay, az, p, ignV) {
  if (p.inCar) { const V = p.inCar; return [V.x, V.y, V.z + 1.0, V]; }
  const chest = p.crouch ? 0.72 : 1.2, head = p.crouch ? 1.02 : 1.58;
  if (lineClear(ax, ay, az, p.x, p.y, chest, ignV)) return [p.x, p.y, chest, null];
  if (lineClear(ax, ay, az, p.x, p.y, head, ignV)) return [p.x, p.y, head, null];
  return [p.x, p.y, chest, null];
}
// ------------------------------------------------------------------ one shot
function fireShot(shooter, gun, ox, oy, oz, tx, ty, tz, spreadMul, ignV) {
  const G = gun.G, dx0 = tx - ox, dy0 = ty - oy, d = Math.hypot(dx0, dy0) || 1e-3;
  const sd = G.spread * (spreadMul || 1), ang = Math.atan2(dy0, dx0) + (rnd() + rnd() - 1) * sd;
  const dx = Math.cos(ang), dy = Math.sin(ang), slope = (tz - oz) / d + (rnd() - 0.5) * sd * 0.6;
  const byFrank = shooter === FRANK;
  castRay(ox, oy, oz, dx, dy, slope, G.range, shooter, ignV);
  const hx = RAY.x, hy = RAY.y, hz = RAY.z, kind = RAY.kind, what = RAY.what;
  gun.ammo--; gun.cool = G.cool;
  fxTracer(ox, oy, oz, hx, hy, hz, byFrank);
  fxMuzzle(ox + dx * 0.3, oy + dy * 0.3, oz, ang);
  sfxAt(G.snd, ox, oy);
  makeNoise(ox, oy);
  if (byFrank) STATS.shots++;
  if (kind === 'person') {
    const src = byFrank ? 'frank' : 'goons';
    if (!(what.team === shooter.team && what !== FRANK && shooter !== FRANK)) hurtPerson(what, G.dmg, src, dx * 0.4, dy * 0.4);
    fxBlood(hx, hy, hz, dx, dy);
    if (byFrank) STATS.hits++;
  } else if (kind === 'car') {
    damageVehicle(what, G.carDmg * (what.bulletArmor || 1), byFrank ? 'frank' : 'goons');
    if (what.driver === 'frank' && !byFrank && rnd() < 0.3) hurtPerson(FRANK, G.dmg * 0.35, 'goons');
    fxSparks(hx, hy, hz, -dx, -dy, 5); sfxAt('ping', hx, hy);
    if (byFrank && what.target) STATS.hits++;
  } else if (kind === 'static') { fxSparks(hx, hy, hz, -dx, -dy, 3); if (rnd() < 0.35) sfxAt('rico', hx, hy); }
  // a near miss makes Frank flinch: the screen jolts a little
  if (!byFrank && kind !== 'person' && FRANK.alive) {
    const px = FRANK.x - ox, py = FRANK.y - oy, along = px * dx + py * dy;
    if (along > 0 && along < RAY.t + 2 && Math.abs(px * dy - py * dx) < 1.2) { shake(1.5); sfxAt('whiz', FRANK.x, FRANK.y); }
  }
  return kind;
}
