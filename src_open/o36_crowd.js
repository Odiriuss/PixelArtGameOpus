// =================================================================== THE CROWD: PEOPLE IN THE STREETS, PEOPLE IN PLACES
// Pedestrians walk the sidewalk round a block, corner to corner, and sometimes cross to the next block. They are
// kept near the player: sent in out of sight, taken away when far off. Inside, a floor is peopled when Frank comes
// onto it: staff at their counters while the place is open, customers at the tables, a band on the stand.
const CROWD = { n: 0 };
function crowdWant() { const h = clockHour(); return h >= 8 && h < 19 ? 18 : h >= 19 && h < 23 ? 12 : h >= 6 && h < 8 ? 9 : 4; }
function ring(c, r) { const b = blockRect(c, r); return [b[0] + 1.35, b[1] + 1.35, b[2] - 1.35, b[3] - 1.35]; }
function ringCorner(c, r, i) { const R = ring(c, r); return [i === 0 || i === 3 ? R[0] : R[2], i < 2 ? R[1] : R[3]]; }
function spawnPedestrian(force) {
  const [fx, fy] = frankPos();
  for (let tries = 0; tries < 8; tries++) {
    const c = Math.floor(rnd() * NCOL), r = Math.floor(rnd() * NROW), i = Math.floor(rnd() * 4), dir = rnd() < 0.5 ? 1 : -1;
    const a = ringCorner(c, r, i), b = ringCorner(c, r, (i + dir + 4) % 4), t = rnd(), x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t);
    const d = Math.hypot(x - fx, y - fy);
    if (d < (force ? 8 : 22) || d > 60 || (!force && !offScreen(x, y)) || !personFree(x, y, 0.35, 0)) continue;
    const p = makePerson('civ', CIV_IDS[Math.floor(rnd() * CIV_IDS.length)], x, y, { hp: 60, hold: 'none' });
    p.speed = 1.2 + rnd() * 0.5;
    p.ai = { mode: 'walk', c, r, i: (i + dir + 4) % 4, dir, stuck: 0, t: 0, aware: 0 };
    p.street = true;
    return p;
  }
  return null;
}
function manageCrowd(force) {
  if (!force && tick % 20 !== 3) return;
  const [fx, fy] = frankPos();
  let n = 0;
  for (let k = PEOPLE.length - 1; k >= 0; k--) {
    const p = PEOPLE[k]; if (!p.street) continue;
    const d = Math.hypot(p.x - fx, p.y - fy);
    if (d > 75 && offScreen(p.x, p.y)) { PEOPLE.splice(k, 1); continue; }
    if (p.alive) n++;
  }
  CROWD.n = n;
  for (let tries = 0, want = crowdWant(); n < want && tries < (force ? 40 : 2); tries++) if (spawnPedestrian(force)) n++;
}
// ------------------------------------------------------------------ what a civilian does
function civTick(p) {
  personPhysics(p);
  const ai = p.ai; if (!ai) return;
  if (!p.alive || p.down) { p.moving = false; return; }
  hearAndSee(p);
  switch (ai.mode) {
    case 'walk': {
      const [tx, ty] = ringCorner(ai.c, ai.r, ai.i), dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
      if (d < 0.4) {                                                      // at a corner: go on round, or cross to the next block
        const cross = rnd() < 0.3 ? crossFrom(ai.c, ai.r, ai.i) : null;
        if (cross) { ai.c = cross[0]; ai.r = cross[1]; ai.i = cross[2]; }
        else ai.i = (ai.i + ai.dir + 4) % 4;
        break;
      }
      stepToward(p, dx / d, dy / d, p.speed);
      if (!p.moving && ++ai.stuck > 40) { ai.stuck = 0; ai.dir = -ai.dir; ai.i = (ai.i + ai.dir + 4) % 4; } else if (p.moving) ai.stuck = 0;
      break;
    }
    case 'spot': {                                                         // sitting or standing where they belong
      p.moving = false;
      if (Math.hypot(p.x - ai.hx, p.y - ai.hy) > 0.15) { const dx = ai.hx - p.x, dy = ai.hy - p.y, d = Math.hypot(dx, dy); stepToward(p, dx / d, dy / d, 1.3); break; }
      p.dir = ai.face; p.sink = ai.sink || 0; p.pose = ai.pose || null;
      break;
    }
    case 'flee': {
      p.sink = 0; p.pose = null;
      const dx = ai.tx - p.x, dy = ai.ty - p.y, d = Math.hypot(dx, dy);
      if (d < 0.6) { if (p.B) { ai.mode = 'cower'; } else { ai.mode = 'walk'; const cr = nearestRing(p.x, p.y); ai.c = cr[0]; ai.r = cr[1]; ai.i = cr[2]; } p.moving = false; break; }
      stepToward(p, dx / d, dy / d, 3.6);
      if (!p.moving && ++ai.t > 40) { ai.t = 0; if (p.B) ai.mode = 'cower'; else civFlee(p); }
      break;
    }
    case 'cower': p.moving = false; p.crouch = true; p.sink = 0; p.pose = null; if (++ai.t > 900 && !recentNoise(p, 30)) { p.crouch = false; ai.t = 0; ai.mode = ai.hx !== undefined ? 'spot' : 'walk'; } break;
  }
}
function stepToward(p, ux, uy, speed) {
  const st = speed * DT;
  p.moving = movePerson(p, ux * st, uy * st) || movePerson(p, -uy * st * 0.7 + ux * st * 0.5, ux * st * 0.7 + uy * st * 0.5);
  if (p.moving) { p.dist += st; p.dir = dirFromVec(ux, uy, p.dir); p.faceX = ux; p.faceY = uy; }
}
// across the road from a corner: [c, r, corner] of the block on the other side, or null at the edge of town
function crossFrom(c, r, i) {
  const opts = [];
  if (i === 0) { if (c > 0) opts.push([c - 1, r, 1]); if (r > 0) opts.push([c, r - 1, 3]); }
  if (i === 1) { if (c < NCOL - 1) opts.push([c + 1, r, 0]); if (r > 0) opts.push([c, r - 1, 2]); }
  if (i === 2) { if (c < NCOL - 1) opts.push([c + 1, r, 3]); if (r < NROW - 1) opts.push([c, r + 1, 1]); }
  if (i === 3) { if (c > 0) opts.push([c - 1, r, 2]); if (r < NROW - 1) opts.push([c, r + 1, 0]); }
  return opts.length ? opts[Math.floor(rnd() * opts.length)] : null;
}
function nearestRing(x, y) {
  let best = [0, 0, 0], bd = 1e9;
  for (let c = 0; c < NCOL; c++) for (let r = 0; r < NROW; r++) for (let i = 0; i < 4; i++) { const [cx, cy] = ringCorner(c, r, i), d = Math.hypot(cx - x, cy - y); if (d < bd) { bd = d; best = [c, r, i]; } }
  return best;
}
// run from a noise: outdoors, away down the street; inside, out of the nearest door (or down behind something)
function civFlee(p, from) {
  const ox = from ? from[0] : NOISE.x, oy = from ? from[1] : NOISE.y, ai = p.ai;
  ai.t = 0; p.crouch = false;
  if (p.B) {
    const D = p.B.doorList.filter(D => D.stat.off || true).sort((a, b) => Math.hypot(a.cx - p.x, a.cy - p.y) - Math.hypot(b.cx - p.x, b.cy - p.y))[0];
    if (D && p.F && p.F.f === 0) { ai.tx = D.cx + D.nx * 2.5; ai.ty = D.cy + D.ny * 2.5; ai.mode = 'flee'; p.street = true; return; }
    ai.mode = 'cower'; return;
  }
  const ang = Math.atan2(p.y - oy, p.x - ox);
  for (let k = 0; k < 12; k++) {
    const a = ang + (k & 1 ? 1 : -1) * Math.ceil(k / 2) * 0.4, tx = p.x + Math.cos(a) * 22, ty = p.y + Math.sin(a) * 22;
    if (!blockedAt(tx, ty, 0.4, 0)) { ai.tx = tx; ai.ty = ty; ai.mode = 'flee'; return; }
  }
  ai.mode = 'cower';
}
function recentNoise(p, r) { for (const n of NOISE.list) if (tick - n.t < 300 && Math.hypot(n.x - p.x, n.y - p.y) < Math.min(r, n.r)) return true; return false; }
function spawnCivilian(x, y, flee) {
  const p = makePerson('civ', CIV_IDS[PID % CIV_IDS.length], x, y, { hp: 60, hold: 'none' });
  p.ai = { mode: 'walk', c: 0, r: 0, i: 0, dir: 1, stuck: 0, t: 0, aware: 0 }; p.street = true;
  const cr = nearestRing(x, y); p.ai.c = cr[0]; p.ai.r = cr[1]; p.ai.i = cr[2];
  if (flee) civFlee(p, [FRANK.x, FRANK.y]);
  return p;
}
// ------------------------------------------------------------------ people in places
const STAFF_CAST = { bar: 'bartender', club: 'bartender', dancehall: 'bartender', billiards: 'bartender', diner: 'vendor', drugstore: 'clerk', hardware: 'vendor', laundry: 'civF3',
  tailor: 'clerk', hats: 'clerk', radio: 'vendor', gunsmith: 'vendor', pawn: 'clerk', liquor: 'vendor', station: 'civM5', hotel: 'clerk', flophouse: 'civM3', bank: 'clerk',
  barber: 'vendor', cinema: 'civF4', newspaper: 'civM2', office: 'civM2', precinct: 'cop', garage: 'civM5', warehouse: 'civM5', depot: 'civM5' };
// how busy a kind of place is at this hour (0..1) for its customers
function busyness(B) {
  const h = clockHour(), e = B.enter;
  if (!businessOpen(B)) return e === 'apartment' ? (h >= 18 || h < 8 ? 0.6 : 0.3) : 0;
  if (e === 'bar' || e === 'club' || e === 'dancehall' || e === 'billiards') return h >= 20 || h < 2 ? 0.75 : h >= 17 ? 0.4 : 0.15;
  if (e === 'diner') return (h >= 7 && h < 9) || (h >= 12 && h < 14) || (h >= 18 && h < 20) ? 0.7 : 0.3;
  if (e === 'office' || e === 'newspaper' || e === 'precinct') return h >= 9 && h < 17 ? 0.8 : 0.2;
  if (e === 'cinema') return h >= 19 ? 0.6 : 0.3;
  return 0.35;
}
function populateFloor(F) {
  if (!F || F.populated) return;
  F.populated = tick; F.people = [];
  const B = F.B, open = businessOpen(B), busy = busyness(B), seed = Math.floor(clockAbs() / 60) * 31 + B.id;
  F.spots.forEach((s, k) => {
    let cast = null, role = s.role, hold = 'none';
    if (role === 'staff') { if (!open) return; cast = STAFF_CAST[B.enter] || 'clerk'; if (cast === 'cop') hold = 'pistol'; }
    else if (role === 'seat' || role === 'bar' || role === 'stand' || role === 'desk') { if (hash(seed, k) >= busy) return; cast = CIV_IDS[hashi(seed, k + 99) % CIV_IDS.length]; }
    else if (role === 'band') { if (!open || clockHour() < 19 && clockHour() > 4) return; cast = ['pianist', 'bassist', 'drummer'][k % 3]; }
    else if (role === 'cell') { if (hash(seed, k) > 0.5) return; cast = 'civM3'; }
    else if (role === 'bed') { if (B.enter !== 'flophouse' || hash(seed, k) > busy) return; cast = CIV_IDS[hashi(seed, k) % CIV_IDS.length]; }
    else return;                                                      // guards and bosses belong to the zones
    const p = makePerson(cast === 'cop' ? 'cop' : 'civ', cast, s.x, s.y, { F, hp: cast === 'cop' ? 100 : 60, hold });
    if (cast === 'cop') { p.team = 'law'; p.gun = makeGun('service'); p.ai = copBrain(p, 'desk'); }
    else p.ai = { mode: 'spot', hx: s.x, hy: s.y, face: dirOf(s.dir), sink: role === 'seat' ? 6 : role === 'bar' ? 2 : role === 'bed' ? 0 : 0, pose: role === 'band' ? 'play' : null, t: 0, aware: 0 };
    p.z += s.dz || 0;
    p.dir = dirOf(s.dir); p.role = role; p.home = F;
    if (role === 'staff') p.staff = B;
    if (role === 'bed') { p.down = 1e9; p.asleep = true; }
    F.people.push(p);
  });
  if (ZONE_POP[B.zone]) ZONE_POP[B.zone](F);
}
function dirOf(d) { return d === 'x+' ? 0 : d === 'y+' ? 1 : d === 'y-' ? 2 : 3; }
// a floor Frank has left well behind is emptied (the dead stay where they fell)
function depopulate() {
  if (tick % 60 !== 11) return;
  for (let i = 1; i < BUILDINGS.length; i++) {
    const B = BUILDINGS[i]; if (!B.floors) continue;
    for (const F of B.floors) {
      if (!F.populated || FRANK.F === F) continue;
      const d = Math.hypot((B.x0 + B.x1) / 2 - FRANK.x, (B.y0 + B.y1) / 2 - FRANK.y);
      if (d < 30 && FRANK.B === B) continue;
      if (d < 22) continue;
      for (const p of F.people) { if (p.alive && !p.street && !p.persist) { const k = PEOPLE.indexOf(p); if (k >= 0) PEOPLE.splice(k, 1); } }
      F.people = []; F.populated = 0;
    }
  }
}
