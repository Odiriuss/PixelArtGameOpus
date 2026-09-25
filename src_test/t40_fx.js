// =================================================================== EFFECTS: PARTICLES, TRACERS, SKID MARKS, FIRE, LIGHTS THAT MOVE
const PARTS = [], TRACERS = [];
const SKID = { x: new Float32Array(2400), y: new Float32Array(2400), n: 0, i: 0 };
const SHAKE = { v: 0, x: 0, y: 0 };
function shake(v) { SHAKE.v = Math.max(SHAKE.v, v); }
let PART_GZ;                                            // the floor under particles being spawned (undefined: the ground)
function part(kind, x, y, z, vx, vy, vz, life, c) { if (PARTS.length < 900) PARTS.push({ kind, x, y, z, vx, vy, vz, life, max: life, c, gz: PART_GZ }); }
function fxTracer(x0, y0, z0, x1, y1, z1, mine) { TRACERS.push({ x0, y0, z0, x1, y1, z1, life: 3, c: mine ? C.PALEY : C.GLOW }); }
function fxMuzzle(x, y, z, ang) {
  DYNQ.push({ x, y, z, r: 5, k: 2.4, life: 2 });
  part('flash', x, y, z, 0, 0, 0, 2, C.HOT);
  for (let k = 0; k < 3; k++) part('smoke', x, y, z, Math.cos(ang) * 0.6 + (rnd() - 0.5) * 0.4, Math.sin(ang) * 0.6 + (rnd() - 0.5) * 0.4, 0.3, 30 + rnd() * 20, 1.2);
}
function fxSparks(x, y, z, nx, ny, n) {
  for (let k = 0; k < n; k++) part('spark', x, y, z, nx * (1 + rnd() * 3) + (rnd() - 0.5) * 3, ny * (1 + rnd() * 3) + (rnd() - 0.5) * 3, rnd() * 3, 8 + rnd() * 10, rnd() < 0.5 ? C.HOT : C.GLOW);
  part('smoke', x, y, z, 0, 0, 0.2, 25, 1.5);
}
function fxBlood(x, y, z, dx, dy) { for (let k = 0; k < 5; k++) part('drop', x, y, z, dx * (1 + rnd() * 2) + (rnd() - 0.5), dy * (1 + rnd() * 2) + (rnd() - 0.5), rnd() * 1.5, 18 + rnd() * 10, rnd() < 0.5 ? C.CRIM : C.OX); }
function fxExplosion(x, y, z) {
  DYNQ.push({ x, y, z: 1.5, r: 16, k: 3.2, life: 10 });
  for (let k = 0; k < 40; k++) { const a = rnd() * TAU, s = 2 + rnd() * 7; part('fire', x, y, z + rnd(), Math.cos(a) * s, Math.sin(a) * s, 1 + rnd() * 4, 20 + rnd() * 25, 0); }
  for (let k = 0; k < 25; k++) { const a = rnd() * TAU, s = 3 + rnd() * 8; part('debris', x, y, z + 0.5, Math.cos(a) * s, Math.sin(a) * s, 3 + rnd() * 6, 60 + rnd() * 40, rnd() < 0.5 ? C.INK : C.S0); }
  for (let k = 0; k < 16; k++) part('smoke', x + (rnd() - 0.5) * 2, y + (rnd() - 0.5) * 2, z + rnd() * 2, (rnd() - 0.5), (rnd() - 0.5), 0.8 + rnd(), 90 + rnd() * 60, 3.5);
}
function fxCrash(x, y, j) {
  const n = Math.min(14, Math.floor(j * 1.2));
  for (let k = 0; k < n; k++) part(rnd() < 0.5 ? 'glass' : 'spark', x, y, 0.6 + rnd() * 0.4, (rnd() - 0.5) * j * 0.6, (rnd() - 0.5) * j * 0.6, 1 + rnd() * 3, 20 + rnd() * 30, rnd() < 0.5 ? C.WL : C.S3);
}
function fxSplash(x, y) { for (let k = 0; k < 20; k++) part('drop', x, y, WATER_Z, (rnd() - 0.5) * 4, (rnd() - 0.5) * 4, 3 + rnd() * 4, 30 + rnd() * 20, rnd() < 0.5 ? C.WL : C.WM); }
// ------------------------------------------------------------------ per tick
const DYNQ = [];                                        // short-lived lights (flashes); rebuilt into DYN each frame with the cars' own
function fxTick() {
  for (let i = PARTS.length - 1; i >= 0; i--) {
    const p = PARTS[i];
    if (--p.life <= 0) { PARTS.splice(i, 1); continue; }
    p.x += p.vx * DT; p.y += p.vy * DT; p.z += p.vz * DT;
    if (p.kind === 'smoke') { p.vx *= 0.97; p.vy *= 0.97; p.vz = p.vz * 0.98 + 0.01; p.x -= 0.004; }
    else if (p.kind === 'fire') { p.vx *= 0.9; p.vy *= 0.9; p.vz = p.vz * 0.93 + 0.08; }
    else if (p.kind !== 'flash') {
      p.vz -= 9.8 * DT;
      const gz = p.gz !== undefined ? p.gz : groundZ(p.x, p.y);
      if (p.z < gz) { p.z = gz; p.vz *= -0.3; p.vx *= 0.6; p.vy *= 0.6; if (p.kind === 'drop') p.life = Math.min(p.life, 3); }
    }
  }
  for (let i = TRACERS.length - 1; i >= 0; i--) if (--TRACERS[i].life <= 0) TRACERS.splice(i, 1);
  for (let i = DYNQ.length - 1; i >= 0; i--) if (--DYNQ[i].life <= 0) DYNQ.splice(i, 1);
  if (SHAKE.v > 0.1) { SHAKE.x = Math.round((rnd() - 0.5) * SHAKE.v); SHAKE.y = Math.round((rnd() - 0.5) * SHAKE.v); SHAKE.v *= 0.86; } else { SHAKE.v = 0; SHAKE.x = SHAKE.y = 0; }
  // cars: skid marks, smoke from a beaten engine, fire
  for (const V of VEH) {
    if (V.gone) continue;
    const c = Math.cos(V.a), s = Math.sin(V.a);
    if (V.skid && V.surf !== 2) for (const side of [-1, 1]) {
      const u = -V.M.wb / 2, v = side * (V.M.hw - 0.2);
      SKID.x[SKID.i] = V.x + u * c - v * s; SKID.y[SKID.i] = V.y + u * s + v * c; SKID.i = (SKID.i + 1) % SKID.x.length; SKID.n = Math.min(SKID.n + 1, SKID.x.length);
      if ((tick & 3) === 0 && vehSpeed(V) > 3) part('smoke', V.x + u * c - v * s, V.y + u * s + v * c, 0.2, -V.vx * 0.1, -V.vy * 0.1, 0.3, 30, 1.3);
    }
    const hx = V.x + c * (V.M.hl - 0.6), hy = V.y + s * (V.M.hl - 0.6);
    if (!V.fire && (V.hp < V.maxHp * 0.35 || V.smoke) && (tick % (V.hp < V.maxHp * 0.15 || V.smoke ? 3 : 7)) === 0) part('smoke', hx, hy, V.z + 1.0, (rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.5, 0.9, 70, V.smoke ? 2.4 : 1.6);
    if (V.fire) {
      const big = V.fire === 1 || V.burnT > 120;
      if (big || (tick & 1)) part('fire', hx + (rnd() - 0.5) * 1.2, hy + (rnd() - 0.5) * 1.2, V.z + 0.9 + rnd() * 0.3, (rnd() - 0.5) * 0.6, (rnd() - 0.5) * 0.6, 1 + rnd(), 18 + rnd() * 14, 0);
      if ((tick & 3) === 0) part('smoke', hx, hy, V.z + 1.8, (rnd() - 0.5) * 0.3, (rnd() - 0.5) * 0.3, 1.1, 110, 3);
    }
  }
}
// ------------------------------------------------------------------ the frame's dynamic lights
function gatherLights() {
  DYN.length = 0;
  for (const L of DYNQ) DYN.push(L);
  const cars = VEH.filter(V => !V.gone && Math.hypot(V.x - CAMF.x, V.y - CAMF.y) < 34);
  cars.sort((a, b) => Math.hypot(a.x - CAMF.x, a.y - CAMF.y) - Math.hypot(b.x - CAMF.x, b.y - CAMF.y));
  let heads = 0;
  for (const V of cars) {
    const c = Math.cos(V.a), s = Math.sin(V.a);
    if (V.fire) DYN.push({ x: V.x + c * (V.M.hl - 0.6), y: V.y + s * (V.M.hl - 0.6), z: 1.6, r: 7 + rnd() * 0.8, k: 1.6 + rnd() * 0.5 });
    if (V.lightsOn && !V.headOut && heads < 5 * VW / 320) {           // a wider view (the open city zoomed out) lights more of them
      heads++;
      const hl = V.kin ? V.M.hl : V.M.hl - 0.1;
      DYN.push({ x: V.x + c * hl, y: V.y + s * hl, z: 0.75, r: V.kin ? 11 : 15, k: 3.2, cone: true, dx: c, dy: s, ang: 0.42, cos: Math.cos(0.42) });
    }
    if ((V.lightsOn || V.braking) && !V.kin) DYN.push({ x: V.x - c * (V.M.hl + 0.2), y: V.y - s * (V.M.hl + 0.2), z: 0.6, r: V.braking ? 2.6 : 1.7, k: V.braking ? 0.85 : 0.45, map: REDW });
  }
}
// ------------------------------------------------------------------ drawing
function drawSkids(cx, cy) {
  for (let k = 0; k < SKID.n; k++) {
    const x = SKID.x[k], y = SKID.y[k], px = Math.round(isoX(x, y)) - cx, py = Math.round(isoY(x, y, groundZ(x, y))) - cy;
    if (px < 0 || py < 0 || px >= W || py >= H) continue;
    const p = py * W + px; if (!(mb[p] & MAT_FLOOR) || Math.abs(zb[p] - (x + y)) > 0.3) continue;
    fb[p] = SHD[fb[p]]; if (px + 1 < W && (mb[p + 1] & MAT_FLOOR)) fb[p + 1] = SHD[fb[p + 1]];
  }
}
function drawParts(cx, cy) {
  for (const p of PARTS) {
    const px = Math.round(isoX(p.x, p.y)) - cx, py = Math.round(isoY(p.x, p.y, p.z)) - cy, d = p.x + p.y + 0.3, f = p.life / p.max;
    if (px < -20 || py < -20 || px >= W + 20 || py >= H + 20) continue;
    switch (p.kind) {
      case 'smoke': puff(px, py, p.c * (1.6 - f * 0.6) * 2.2, 0.55 * f, (p.c > 2 ? SHD : LIT), d); break;
      case 'fire': { const c = f > 0.7 ? C.HOT : f > 0.45 ? C.GLOW : f > 0.25 ? C.AMB : C.CRIM; dpset(px, py, c, d); if (f > 0.5) { dpset(px + 1, py, c, d); dpset(px, py - 1, C.GLOW, d); } break; }
      case 'flash': for (let k = -2; k <= 2; k++) { dpset(px + k, py, C.HOT, d); dpset(px, py + k, C.HOT, d); } dpset(px + 1, py + 1, C.GLOW, d); dpset(px - 1, py - 1, C.GLOW, d); break;
      default: dpset(px, py, p.c, d);
    }
  }
  for (const t of TRACERS) {
    const a = [Math.round(isoX(t.x0, t.y0)) - cx, Math.round(isoY(t.x0, t.y0, t.z0)) - cy], b = [Math.round(isoX(t.x1, t.y1)) - cx, Math.round(isoY(t.x1, t.y1, t.z1)) - cy];
    const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), 1);
    const d0 = t.x0 + t.y0, d1 = t.x1 + t.y1;
    for (let k = 0; k <= n; k++) {
      if (t.life < 3 && (k & 1)) continue;
      const u = k / n; dpset(Math.round(lerp(a[0], b[0], u)), Math.round(lerp(a[1], b[1], u)), k > n * 0.8 ? C.HOT : t.c, lerp(d0, d1, u) + 0.4);
    }
  }
}
