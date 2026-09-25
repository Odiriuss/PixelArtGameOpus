// =================================================================== WEAPONS: GUNS, CLUBS, BLADES, THINGS THAT ARE THROWN
// Hitscan in 3D, as in the test level, now with floors: a shot fired on a floor only meets what stands on it.
// Shotguns throw pellets; the Asterion prototype throws a bolt of light. Clubs and blades hit what is in front of
// you; the blackjack puts a man down without a sound if he never saw you coming.
const GUNS = {
  // firearms. mag: rounds, cool: ticks between shots, reload: ticks, dmg per hit, spread in radians, range in m, noise: how far it is heard
  snub:     { name: '.38 SNUB-NOSE', kind: 'gun', ammo: 'a38', mag: 5, cool: 18, reload: 90, dmg: 28, spread: 0.05, range: 30, snd: 'revolver', carDmg: 3, hold: 'pistol', noise: 34 },
  service:  { name: '.38 SERVICE REVOLVER', kind: 'gun', ammo: 'a38', mag: 6, cool: 16, reload: 96, dmg: 34, spread: 0.035, range: 42, snd: 'revolver', carDmg: 4, hold: 'pistol', noise: 38 },
  m1911:    { name: '.45 AUTOMATIC', kind: 'gun', ammo: 'a45', mag: 7, cool: 13, reload: 80, dmg: 38, spread: 0.04, range: 40, snd: 'pistol', carDmg: 4, hold: 'pistol', noise: 40 },
  pistol:   { name: 'POCKET PISTOL', kind: 'gun', ammo: 'a32', mag: 8, cool: 24, reload: 120, dmg: 9, spread: 0.05, range: 34, snd: 'pistol', carDmg: 2, hold: 'pistol', noise: 30 },
  pump:     { name: 'PUMP SHOTGUN', kind: 'gun', ammo: 'a12', mag: 6, cool: 48, reload: 160, dmg: 11, pellets: 8, spread: 0.13, range: 18, snd: 'shotgun', carDmg: 6, hold: 'long', noise: 50 },
  riot:     { name: 'POLICE RIOT GUN', kind: 'gun', ammo: 'a12', mag: 5, cool: 40, reload: 140, dmg: 12, pellets: 8, spread: 0.11, range: 20, snd: 'shotgun', carDmg: 6, hold: 'long', noise: 50 },
  rifle:    { name: 'BOLT-ACTION RIFLE', kind: 'gun', ammo: 'a30', mag: 5, cool: 62, reload: 150, dmg: 85, spread: 0.008, range: 75, snd: 'rifle', carDmg: 9, hold: 'long', noise: 60 },
  tommy:    { name: 'THOMPSON SUBMACHINE GUN', kind: 'gun', ammo: 'a45', mag: 30, cool: 6, reload: 150, dmg: 11, spread: 0.1, range: 30, snd: 'tommy', carDmg: 2.5, hold: 'tommy', auto: true, noise: 50 },
  proto:    { name: 'ASTERION PROTOTYPE', kind: 'gun', ammo: 'cell', mag: 4, cool: 45, reload: 180, dmg: 70, spread: 0.01, range: 50, snd: 'zap', carDmg: 30, hold: 'pistol', beam: true, noise: 26 },
  // held in the hand
  fists:    { name: 'FISTS', kind: 'melee', dmg: 8, reach: 1.0, cool: 22, hold: 'none', noise: 6 },
  blackjack:{ name: 'BLACKJACK', kind: 'melee', dmg: 16, reach: 1.1, cool: 26, hold: 'club', ko: true, noise: 4 },
  knuckles: { name: 'BRASS KNUCKLES', kind: 'melee', dmg: 18, reach: 1.0, cool: 20, hold: 'none', noise: 6 },
  tireiron: { name: 'TIRE IRON', kind: 'melee', dmg: 26, reach: 1.3, cool: 34, hold: 'club', noise: 10 },
  bat:      { name: 'BASEBALL BAT', kind: 'melee', dmg: 30, reach: 1.5, cool: 38, hold: 'club', noise: 10 },
  knife:    { name: 'SWITCHBLADE', kind: 'melee', dmg: 30, reach: 0.9, cool: 18, hold: 'club', bleed: true, noise: 3 },
  // thrown
  molotov:  { name: 'MOLOTOV COCKTAIL', kind: 'throw', dmg: 0, fire: true, cool: 50, hold: 'none', noise: 30 },
  dynamite: { name: 'DYNAMITE', kind: 'throw', dmg: 0, fuse: 150, cool: 50, hold: 'none', noise: 70 }
};
function makeGun(type, ammo) { const G = GUNS[type]; return { type, G, ammo: G.mag !== undefined ? (ammo === undefined ? G.mag : ammo) : 0, cool: 0, reload: 0 }; }
function gunTick(g) {
  if (!g) return;
  if (g.cool > 0) g.cool--;
  if (g.reload > 0 && --g.reload === 0) g.ammo = g.owner ? g.ammo + takeAmmo(g.G.ammo, g.G.mag - g.ammo) : g.G.mag;
}
// reloading uses the carrier's rounds (Frank's come from his bag; everybody else has enough)
function startReload(g) {
  if (!g || g.G.kind !== 'gun' || g.reload > 0 || g.ammo === g.G.mag) return false;
  if (g.owner && ammoCount(g.G.ammo) <= 0) return false;
  g.reload = g.G.reload; return true;
}
// ------------------------------------------------------------------ the ray: nearest of statics, cars, people (on this floor)
const RAY = { t: 0, kind: '', what: null, x: 0, y: 0, z: 0 };
function rayBox2(ox, oy, dx, dy, x0, y0, x1, y1) {
  let t0 = -1e9, t1 = 1e9;
  if (Math.abs(dx) < 1e-9) { if (ox < x0 || ox > x1) return null; } else { let a = (x0 - ox) / dx, b = (x1 - ox) / dx; if (a > b) [a, b] = [b, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, b); }
  if (Math.abs(dy) < 1e-9) { if (oy < y0 || oy > y1) return null; } else { let a = (y0 - oy) / dy, b = (y1 - oy) / dy; if (a > b) [a, b] = [b, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, b); }
  return t0 <= t1 && t1 >= 0 ? [Math.max(0, t0), t1] : null;
}
function rayCircle2(ox, oy, dx, dy, cx, cy, r) {
  const fx = ox - cx, fy = oy - cy, b = fx * dx + fy * dy, c = fx * fx + fy * fy - r * r, disc = b * b - c;
  if (disc < 0) return -1; const t = -b - Math.sqrt(disc); return t >= 0 ? t : (c < 0 ? 0 : -1);
}
// first t in [t0, t1] where the ray is inside the height band [lo, hi), or -1
function columnHit(oz, slope, t0, t1, hi, lo) {
  const b = lo || 0, z0 = oz + slope * t0, z1 = oz + slope * t1;
  if (z0 < hi && z0 >= b - 0.05) return t0;
  if (slope < 0 && z1 < hi && z0 >= hi) return t0 + (hi - z0) / slope;
  if (slope > 0 && z0 < b && z1 >= b) return t0 + (b - z0) / slope;
  return -1;
}
// oz: absolute height of the muzzle; fz: the floor the shooter stands on (0 outdoors)
function castRay(ox, oy, oz, dx, dy, slope, range, ignP, ignV, noPeople, fz) {
  RAY.t = range; RAY.kind = 'none'; RAY.what = null;
  const f0 = fz || 0, ex = ox + dx * range, ey = oy + dy * range;
  for (const S of staticsNear(Math.min(ox, ex), Math.min(oy, ey), Math.max(ox, ex), Math.max(oy, ey))) {
    if (S.off) continue;
    const lo = S.z0 || 0, hi = lo + S.h;
    if (hi < f0 + 0.05 || lo > f0 + 3) continue;
    let t;
    if (S.circle) { const tc = rayCircle2(ox, oy, dx, dy, S.cx, S.cy, S.r); if (tc < 0 || tc >= RAY.t) continue; t = columnHit(oz, slope, tc, tc + S.r, hi, lo); }
    else { const iv = rayBox2(ox, oy, dx, dy, S.x0, S.y0, S.x1, S.y1); if (!iv || iv[0] >= RAY.t) continue; t = columnHit(oz, slope, iv[0], Math.min(iv[1], RAY.t), hi, lo); }
    if (t >= 0 && t < RAY.t) { RAY.t = t; RAY.kind = 'static'; RAY.what = S; }
  }
  if (f0 < 0.5) for (const V of VEH) {
    if (V.gone || V === ignV) continue;
    const c = Math.cos(V.a), s = Math.sin(V.a), lx = ox - V.x, ly = oy - V.y;
    const u = lx * c + ly * s, v = -lx * s + ly * c, du = dx * c + dy * s, dv = -dx * s + dy * c;
    const iv = rayBox2(u, v, du, dv, -V.M.hl, -V.M.hw, V.M.hl, V.M.hw); if (!iv || iv[0] >= RAY.t) continue;
    const t = columnHit(oz - V.z, slope, iv[0], Math.min(iv[1], RAY.t), V.M.height * 0.92);
    if (t >= 0 && t < RAY.t) { RAY.t = t; RAY.kind = 'car'; RAY.what = V; }
  }
  if (!noPeople) for (const p of PEOPLE) {
    if (p === ignP || !p.visible || p.inCar || p.down) continue;
    if (Math.abs(p.z - f0) > 1) continue;
    const t = rayCircle2(ox, oy, dx, dy, p.x, p.y, 0.3); if (t < 0 || t >= RAY.t) continue;
    const z = oz + slope * t - p.z; if (z < 0 || z > personHeight(p)) continue;
    RAY.t = t; RAY.kind = 'person'; RAY.what = p;
  }
  RAY.x = ox + dx * RAY.t; RAY.y = oy + dy * RAY.t; RAY.z = oz + slope * RAY.t;
  return RAY;
}
function lineClear(ax, ay, az, bx, by, bz, ignV, ignV2, fz) {
  const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1e-6;
  castRay(ax, ay, az, dx / d, dy / d, (bz - az) / d, d, null, ignV, true, fz);
  return RAY.kind === 'none' || (RAY.kind === 'car' && RAY.what === ignV2);
}
function aimPoint(ax, ay, az, p, ignV) {
  if (p.inCar) { const V = p.inCar; return [V.x, V.y, V.z + 1.0, V]; }
  const chest = p.z + (p.crouch ? 0.72 : 1.2), head = p.z + (p.crouch ? 1.02 : 1.58);
  if (lineClear(ax, ay, az, p.x, p.y, chest, ignV, null, p.z)) return [p.x, p.y, chest, null];
  if (lineClear(ax, ay, az, p.x, p.y, head, ignV, null, p.z)) return [p.x, p.y, head, null];
  return [p.x, p.y, chest, null];
}
// ------------------------------------------------------------------ one shot (a shotgun fires several)
function fireShot(shooter, gun, ox, oy, oz, tx, ty, tz, spreadMul, ignV) {
  const G = gun.G, n = G.pellets || 1, byFrank = shooter === FRANK, fz = shooter.z || 0;
  PART_GZ = fz > 0.5 ? fz : undefined;                                // sparks and blood fall to the floor he is on
  gun.ammo--; gun.cool = G.cool;
  sfxAt(G.snd, ox, oy);
  makeNoise(ox, oy, G.noise * (byFrank ? PSTAT.noiseMul : 1), shooter.B);
  if (byFrank) STATS.shots++;
  let kind = 'none';
  for (let k = 0; k < n; k++) {
    const dx0 = tx - ox, dy0 = ty - oy, d = Math.hypot(dx0, dy0) || 1e-3;
    const sd = G.spread * (spreadMul || 1), ang = Math.atan2(dy0, dx0) + (rnd() + rnd() - 1) * sd;
    const dx = Math.cos(ang), dy = Math.sin(ang), slope = (tz - oz) / d + (rnd() - 0.5) * sd * 0.6;
    castRay(ox, oy, oz, dx, dy, slope, G.range, shooter, ignV, false, fz);
    const hx = RAY.x, hy = RAY.y, hz = RAY.z, what = RAY.what;
    kind = RAY.kind;
    if (G.beam) fxBeam(ox, oy, oz, hx, hy, hz); else if (k < 3) fxTracer(ox, oy, oz, hx, hy, hz, byFrank);
    if (k === 0) fxMuzzle(ox + dx * 0.3, oy + dy * 0.3, oz, ang, G.beam);
    const dmg = G.dmg * (byFrank ? PSTAT.dmgMul : 1) * (n > 1 ? clamp(1.3 - RAY.t / G.range, 0.3, 1) : 1);
    if (kind === 'person') {
      const src = byFrank ? 'frank' : shooter.team;
      if (!(what.team === shooter.team && what !== FRANK && shooter !== FRANK)) hurtPerson(what, dmg, src, dx * 0.4, dy * 0.4);
      fxBlood(hx, hy, hz, dx, dy);
      if (byFrank) STATS.hits++;
    } else if (kind === 'car') {
      damageVehicle(what, G.carDmg * (what.bulletArmor || 1), byFrank ? 'frank' : shooter.team);
      if (what.driver === 'frank' && !byFrank && rnd() < 0.3) hurtPerson(FRANK, dmg * 0.35, shooter.team);
      if (k < 2) { fxSparks(hx, hy, hz, -dx, -dy, 5); sfxAt('ping', hx, hy); }
    } else if (kind === 'static') { if (k < 2) fxSparks(hx, hy, hz, -dx, -dy, 3); if (rnd() < 0.2) sfxAt('rico', hx, hy); }
    if (kind !== 'person' && kind !== 'car') shootLamp(ox, oy, oz, hx, hy, hz, byFrank);
    if (!byFrank && kind !== 'person' && FRANK.alive && k === 0) {
      const px = FRANK.x - ox, py = FRANK.y - oy, along = px * dx + py * dy;
      if (along > 0 && along < RAY.t + 2 && Math.abs(px * dy - py * dx) < 1.2) { shake(1.5); sfxAt('whiz', FRANK.x, FRANK.y); }
    }
  }
  PART_GZ = undefined;
  return kind;
}
// a street lamp's globe on the line of a shot goes out
function shootLamp(ox, oy, oz, hx, hy, hz, byFrank) {
  for (const Lp of LAMPS) {
    if (Lp.L.broken) continue;
    const dx = hx - ox, dy = hy - oy, dz = hz - oz, L2 = dx * dx + dy * dy + dz * dz || 1;
    const t = clamp(((Lp.x - ox) * dx + (Lp.y - oy) * dy + (Lp.z - oz) * dz) / L2, 0, 1);
    if (Math.hypot(ox + dx * t - Lp.x, oy + dy * t - Lp.y, oz + dz * t - Lp.z) < 0.28) {
      breakLight(Lp.L); dirtyRect(Lp.L.rect); fxSparks(Lp.x, Lp.y, Lp.z, 0, 0, 8); sfxAt('glass', Lp.x, Lp.y);
      for (let k = 0; k < 6; k++) part('glass', Lp.x, Lp.y, Lp.z, (rnd() - 0.5) * 2, (rnd() - 0.5) * 2, rnd(), 40, C.WL);
      if (byFrank) STATS.lampsOut = (STATS.lampsOut || 0) + 1;
      return true;
    }
  }
  return false;
}
// ------------------------------------------------------------------ close work: whatever is in front of you
function meleeHit(p, G) {
  const a = Math.atan2(p.faceY || 0, p.faceX || 1);
  let best = null, bd = G.reach + 0.35;
  for (const q of PEOPLE) {
    if (q === p || !q.alive || !q.visible || q.inCar || Math.abs(q.z - p.z) > 0.5) continue;
    const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy); if (d > bd) continue;
    let da = Math.atan2(dy, dx) - a; da = Math.atan2(Math.sin(da), Math.cos(da));
    if (Math.abs(da) > 0.9) continue;
    if (!lineClear(p.x, p.y, p.z + 1.2, q.x, q.y, q.z + 1.2, null, null, p.z)) continue;
    bd = d; best = q;
  }
  return best;
}
function swing(p, gun) {
  const G = gun.G; if (gun.cool > 0) return null;
  gun.cool = G.cool;
  const q = meleeHit(p, G), byFrank = p === FRANK;
  sfxAt(q ? 'punch' : 'swish', p.x, p.y);
  if (!q) return null;
  const unaware = q.ai && q.ai.aware !== undefined ? q.ai.aware < AW.ALERT : !!q.ai, behind = isBehind(p, q);
  const dmg = G.dmg * (byFrank ? PSTAT.meleeMul : 1);
  if (G.ko && unaware && behind) {                                     // a clean knock-out: down, quiet, for a long time
    q.down = 60 * 60 * 3; q.ko = true; q.aiming = 0; q.crouch = false; q.moving = false; STATS.takedowns = (STATS.takedowns || 0) + 1;
    if (q.ai && q.ai.onKO) q.ai.onKO(); if (byFrank && q.team !== 'goons') crimeAt('assault', q.x, q.y, q);
    makeNoise(q.x, q.y, 4, q.B);
  } else {
    hurtPerson(q, (behind ? dmg * 1.5 : dmg), byFrank ? 'frank' : p.team, (q.x - p.x), (q.y - p.y));
    if (q.alive && dmg >= 20 && rnd() < 0.35) q.down = Math.max(q.down, 80);
    makeNoise(q.x, q.y, G.noise, q.B);
  }
  PART_GZ = q.z > 0.5 ? q.z : undefined; fxBlood(q.x, q.y, q.z + 1.3, q.x - p.x, q.y - p.y); PART_GZ = undefined;
  return q;
}
function isBehind(p, q) {                                     // is p behind q (outside q's front half)?
  const f = q.faceX !== undefined ? [q.faceX, q.faceY] : DIRV[q.dir], dx = p.x - q.x, dy = p.y - q.y, d = Math.hypot(dx, dy) || 1;
  return (dx * f[0] + dy * f[1]) / d < -0.2;
}
// the way each of the four sprite directions faces in the world (see dirFromVec: 0 +x, 1 +y, 2 -y, 3 -x)
const DIRV = [[1, 0], [0, 1], [0, -1], [-1, 0]];
