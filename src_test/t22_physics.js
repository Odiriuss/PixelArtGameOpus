// =================================================================== VEHICLE PHYSICS
// Arcade rigid bodies: engine and brakes along the heading, tyre grip pulls the velocity back onto it (a capped
// friction, so a fast turn slides), yaw from a bicycle model. Collisions are separating-axis tests of the car's
// box against the static boxes and posts (found through a grid) and against the other cars, answered with impulses
// at the contact point: a glancing hit spins you, a square one stops you. The streetcar is kinematic.
const VEH = [];
const SUB = 2;                                          // physics substeps per 60 Hz tick
const SGRID = { cell: 4, gw: 0, gh: 0, cells: null, stamp: 0 };
function buildStaticGrid() {
  const c = SGRID.cell; SGRID.gw = Math.ceil((MAP.x1 - MAP.x0 + 20) / c); SGRID.gh = Math.ceil((MAP.y1 - MAP.y0 + 20) / c);
  SGRID.cells = Array.from({ length: SGRID.gw * SGRID.gh }, () => []);
  for (const S of STATICS) {
    S.q = 0;
    const b = S.circle ? [S.cx - S.r, S.cy - S.r, S.cx + S.r, S.cy + S.r] : [S.x0, S.y0, S.x1, S.y1];
    S.bb = b;
    for (let j = Math.max(0, Math.floor((b[1] - MAP.y0 + 10) / c)); j <= Math.min(SGRID.gh - 1, Math.floor((b[3] - MAP.y0 + 10) / c)); j++)
      for (let i = Math.max(0, Math.floor((b[0] - MAP.x0 + 10) / c)); i <= Math.min(SGRID.gw - 1, Math.floor((b[2] - MAP.x0 + 10) / c)); i++) SGRID.cells[j * SGRID.gw + i].push(S);
  }
}
const QOUT = [];
function staticsNear(x0, y0, x1, y1) {
  QOUT.length = 0; const st = ++SGRID.stamp, c = SGRID.cell;
  for (let j = Math.max(0, Math.floor((y0 - MAP.y0 + 10) / c)); j <= Math.min(SGRID.gh - 1, Math.floor((y1 - MAP.y0 + 10) / c)); j++)
    for (let i = Math.max(0, Math.floor((x0 - MAP.x0 + 10) / c)); i <= Math.min(SGRID.gw - 1, Math.floor((x1 - MAP.x0 + 10) / c)); i++)
      for (const S of SGRID.cells[j * SGRID.gw + i]) if (S.q !== st) { S.q = st; QOUT.push(S); }
  return QOUT;
}
function makeVehicle(model, x, y, a, paint, paint2, opt) {
  const M = CAR_MODELS[model], o = opt || {};
  const V = { M, model, x, y, z: groundZ(x, y), a, vx: 0, vy: 0, w: 0, bob: 0, id: VEH.length, seed: VEH.length * 7 + 3,
    lut: carLut(PAINTS[paint], PAINTS[paint2 || paint], o.plate), paint, paint2: paint2 || paint,
    hp: o.hp || M.hp, maxHp: o.hp || M.hp, mass: M.mass, I: M.mass * (M.L * M.L + M.W * M.W) / 12,
    thr: 0, brk: 0, steer: 0, hand: 0, driver: null, lightsOn: true, braking: false, signOn: model === 'taxi', headOut: false,
    flash: 0, fire: 0, wreck: false, skid: 0, kin: model === 'tram', surf: 0, sinking: false, overKerb: false, gone: false, dmgLook: 0,
    topMul: 1, xray: 0, horn: 0, parked: !!o.parked, ai: null, name: o.name || M.label, lastHit: 0, bumpT: 0 };
  VEH.push(V); return V;
}
function vehSpeed(V) { return Math.hypot(V.vx, V.vy); }
function vehFwd(V) { return V.vx * Math.cos(V.a) + V.vy * Math.sin(V.a); }
function vehCorners(V, pad) {
  const c = Math.cos(V.a), s = Math.sin(V.a), hl = V.M.hl + (pad || 0), hw = V.M.hw + (pad || 0);
  return [[V.x + c * hl - s * hw, V.y + s * hl + c * hw], [V.x + c * hl + s * hw, V.y + s * hl - c * hw],
          [V.x - c * hl + s * hw, V.y - s * hl - c * hw], [V.x - c * hl - s * hw, V.y - s * hl + c * hw]];
}
// ------------------------------------------------------------------ driving forces
function driveStep(V, dt) {
  const M = V.M, c = Math.cos(V.a), s = Math.sin(V.a);
  let vf = V.vx * c + V.vy * s, vl = -V.vx * s + V.vy * c;
  const dead = V.wreck || V.sinking, thr = dead ? 0 : V.thr, brk = dead ? 0.25 : V.brk;
  const top = M.top * V.topMul * (V.hp < V.maxHp * 0.3 ? 0.82 : 1);
  if (thr > 0) { if (vf < -0.3) vf += M.brake * thr * dt; else vf += M.acc * thr * Math.max(0, 1 - vf / top) * (vf < 4 ? 1.6 : 1) * dt; }
  if (brk > 0) { if (vf > 0.3) vf -= M.brake * brk * dt; else if (!dead) vf -= M.acc * 0.7 * brk * Math.max(0, 1 + vf / (top * 0.3)) * dt; }   // stopped: brake means reverse
  V.braking = brk > 0 && vf > 0.3;
  vf -= Math.sign(vf) * Math.min(Math.abs(vf), (0.3 + 0.01 * vf * vf + (thr || brk ? 0 : 0.9)) * dt);
  if (V.hand) vf -= Math.sign(vf) * Math.min(Math.abs(vf), 4.5 * dt);
  // tyres: lateral slip decays at the grip rate, capped by friction
  const grip = V.hand ? 1.4 : M.grip, cap = (V.hand ? 3.5 : 9.5) * dt;
  vl -= clamp(vl * (1 - Math.exp(-grip * dt)), -cap, cap);
  // yaw: bicycle model toward the steering target; less authority while sliding
  const maxSteer = 0.6 * M.turn / (1 + Math.abs(vf) / 13), target = vf / M.wb * Math.tan(V.steer * maxSteer) * (V.hand ? 1.45 : 1);
  const slide = Math.abs(vl) > 3 ? 2.5 : 9;
  V.w += (target - V.w) * Math.min(1, (V.hand ? 4 : slide) * dt);
  V.vx = vf * c - vl * s; V.vy = vf * s + vl * c;
  V.skid = (Math.abs(vl) > 2.4 || (V.hand && Math.abs(vf) > 4) || (thr > 0.9 && vf > 0.5 && vf < 3.5) || (V.braking && brk > 0.9 && vf > 6)) ? 1 : 0;
}
function surfaceStep(V, dt) {
  const s = surfAt(V.x, V.y); V.surf = s;
  if (s === 2 && !V.kin) {                                                 // off the quay: into the harbour
    V.sinking = true; V.z = Math.max(V.z - (V.z > WATER_Z ? 4 : 0.35) * dt, -2.2);
    V.vx *= 1 - 2.5 * dt; V.vy *= 1 - 2.5 * dt; V.w *= 1 - 3 * dt;
    if (V.z <= -2.1 && !V.gone) { V.gone = true; V.wreck = true; V.hp = 0; }
    return;
  }
  const gz = s === 1 ? 0.15 : 0;
  if (gz > V.z + 0.05 && vehSpeed(V) > 3 && V.bumpT <= 0) { V.bob = 0.12; V.bumpT = 0.4; V.vx *= 0.94; V.vy *= 0.94; FXQ.push({ k: 'kerb', x: V.x, y: V.y, j: vehSpeed(V) }); }
  V.z += (gz - V.z) * Math.min(1, 14 * dt);
}
// ------------------------------------------------------------------ contacts
const HIT = { nx: 0, ny: 0, d: 0, px: 0, py: 0 };
function supportAvg(pts, nx, ny, sign) {                  // the extreme point(s) along ±n, averaged when an edge is flush
  let best = -1e9; for (const p of pts) best = Math.max(best, sign * (p[0] * nx + p[1] * ny));
  let sx = 0, sy = 0, n = 0; for (const p of pts) if (sign * (p[0] * nx + p[1] * ny) > best - 0.08) { sx += p[0]; sy += p[1]; n++; }
  return [sx / n, sy / n];
}
function obbVsBox(V, B) {
  const c = Math.cos(V.a), s = Math.sin(V.a), hl = V.M.hl, hw = V.M.hw;
  const ex = (B.x1 - B.x0) / 2, ey = (B.y1 - B.y0) / 2, dx = (B.x0 + B.x1) / 2 - V.x, dy = (B.y0 + B.y1) / 2 - V.y;
  let best = 1e9, nx = 0, ny = 0, carAxis = false, o;
  o = hl * Math.abs(c) + hw * Math.abs(s) + ex - Math.abs(dx); if (o <= 0) return false; if (o < best) { best = o; nx = dx > 0 ? -1 : 1; ny = 0; }
  o = hl * Math.abs(s) + hw * Math.abs(c) + ey - Math.abs(dy); if (o <= 0) return false; if (o < best) { best = o; nx = 0; ny = dy > 0 ? -1 : 1; }
  const df = dx * c + dy * s; o = hl + ex * Math.abs(c) + ey * Math.abs(s) - Math.abs(df); if (o <= 0) return false; if (o < best) { best = o; nx = df > 0 ? -c : c; ny = df > 0 ? -s : s; carAxis = true; }
  const dl = -dx * s + dy * c; o = hw + ex * Math.abs(s) + ey * Math.abs(c) - Math.abs(dl); if (o <= 0) return false; if (o < best) { best = o; nx = dl > 0 ? s : -s; ny = dl > 0 ? -c : c; carAxis = true; }
  HIT.nx = nx; HIT.ny = ny; HIT.d = best;
  const p = carAxis ? supportAvg([[B.x0, B.y0], [B.x1, B.y0], [B.x1, B.y1], [B.x0, B.y1]], nx, ny, 1) : supportAvg(vehCorners(V), nx, ny, -1);
  HIT.px = p[0]; HIT.py = p[1];
  return true;
}
function obbVsCircle(V, cx, cy, r) {
  const c = Math.cos(V.a), s = Math.sin(V.a), hl = V.M.hl, hw = V.M.hw, dx = cx - V.x, dy = cy - V.y;
  const u = dx * c + dy * s, v = -dx * s + dy * c, qu = clamp(u, -hl, hl), qv = clamp(v, -hw, hw);
  const px = V.x + qu * c - qv * s, py = V.y + qu * s + qv * c;
  let nx = px - cx, ny = py - cy, d = Math.hypot(nx, ny);
  if (d > r) return false;
  if (d < 1e-6) { // centre inside the box: out along the nearest face
    if (hl - Math.abs(u) < hw - Math.abs(v)) { nx = -Math.sign(u) * c; ny = -Math.sign(u) * s; d = -(hl - Math.abs(u)); }
    else { nx = Math.sign(v) * s; ny = -Math.sign(v) * c; d = -(hw - Math.abs(v)); }
  } else { nx /= d; ny /= d; }
  HIT.nx = nx; HIT.ny = ny; HIT.d = r - d; HIT.px = px; HIT.py = py;
  return true;
}
function obbVsObb(A, B) {
  const ca = Math.cos(A.a), sa = Math.sin(A.a), cb = Math.cos(B.a), sb = Math.sin(B.a);
  const axes = [[ca, sa], [-sa, ca], [cb, sb], [-sb, cb]], dx = B.x - A.x, dy = B.y - A.y;
  let best = 1e9, bn = null;
  for (let i = 0; i < 4; i++) {
    const [ax, ay] = axes[i];
    const ra = A.M.hl * Math.abs(ca * ax + sa * ay) + A.M.hw * Math.abs(-sa * ax + ca * ay);
    const rb = B.M.hl * Math.abs(cb * ax + sb * ay) + B.M.hw * Math.abs(-sb * ax + cb * ay);
    const d = dx * ax + dy * ay, o = ra + rb - Math.abs(d);
    if (o <= 0) return false;
    if (o < best) { best = o; bn = d > 0 ? [-ax, -ay, i] : [ax, ay, i]; }
  }
  HIT.nx = bn[0]; HIT.ny = bn[1]; HIT.d = best;               // normal pushes A away from B
  const p = bn[2] < 2 ? supportAvg(vehCorners(B), bn[0], bn[1], 1) : supportAvg(vehCorners(A), bn[0], bn[1], -1);
  HIT.px = p[0]; HIT.py = p[1];
  return true;
}
// impulse between A and B (B null = static) at HIT; returns the change of speed it caused
function impulse(A, B) {
  const nx = HIT.nx, ny = HIT.ny, px = HIT.px, py = HIT.py;
  const imA = A.kin ? 0 : 1 / A.mass, iIA = A.kin ? 0 : 1 / A.I, imB = !B || B.kin ? 0 : 1 / B.mass, iIB = !B || B.kin ? 0 : 1 / B.I;
  const tot = imA + imB; if (tot <= 0) return 0;
  A.x += nx * HIT.d * imA / tot; A.y += ny * HIT.d * imA / tot;
  if (B) { B.x -= nx * HIT.d * imB / tot; B.y -= ny * HIT.d * imB / tot; }
  const rax = px - A.x, ray = py - A.y, rbx = B ? px - B.x : 0, rby = B ? py - B.y : 0;
  let vx = A.vx - A.w * ray, vy = A.vy + A.w * rax;
  if (B) { vx -= B.vx - B.w * rby; vy -= B.vy + B.w * rbx; }
  const vn = vx * nx + vy * ny; if (vn >= 0) return 0;
  const rna = rax * ny - ray * nx, rnb = rbx * ny - rby * nx;
  const j = -(1 + 0.2) * vn / (imA + imB + rna * rna * iIA + rnb * rnb * iIB);
  A.vx += j * nx * imA; A.vy += j * ny * imA; A.w += rna * j * iIA;
  if (B) { B.vx -= j * nx * imB; B.vy -= j * ny * imB; B.w -= rnb * j * iIB; }
  // scraping friction along the contact
  const tx = -ny, ty = nx, vt = vx * tx + vy * ty, rta = rax * ty - ray * tx, rtb = rbx * ty - rby * tx;
  const jt = clamp(-vt / (imA + imB + rta * rta * iIA + rtb * rtb * iIB), -0.35 * j, 0.35 * j);
  A.vx += jt * tx * imA; A.vy += jt * ty * imA; A.w += rta * jt * iIA;
  if (B) { B.vx -= jt * tx * imB; B.vy -= jt * ty * imB; B.w -= rtb * jt * iIB; }
  return -vn;
}
const FXQ = [];                                           // physics events for sound and sparks
function crashDamage(V, dv, other) {
  if (V.kin || dv < 4) return;
  const d = (dv - 4) * 2.4 * (V.armor || 1);
  damageVehicle(V, d, other ? other.driver : null);
}
const KERB_JUMP = 6.5;                                     // m/s straight at the quay kerb to go over it
function collideVehicle(V) {
  const r = V.M.hl + 0.4; let onKerb = false;
  for (const S of staticsNear(V.x - r, V.y - r, V.x + r, V.y + r)) {
    if (S.h < 0.3) continue;
    if (S.circle ? !obbVsCircle(V, S.cx, S.cy, S.r) : !obbVsBox(V, S)) continue;
    if (S.kind === 'quay') {                               // once a car is going over, the kerb lets it go
      onKerb = true;
      if (V.overKerb || V.sinking) continue;
      if (V.vx * S.nx + V.vy * S.ny > KERB_JUMP) { V.overKerb = true; V.bob = 0.15; FXQ.push({ k: 'kerb', x: V.x, y: V.y, j: vehSpeed(V) }); continue; }
    }
    const dv = impulse(V, null);
    if (dv > 1) { FXQ.push({ k: 'crash', x: HIT.px, y: HIT.py, j: dv, v: V }); crashDamage(V, dv, null); }
  }
  if (!onKerb) V.overKerb = false;
}
function collideVehicles() {
  for (let i = 0; i < VEH.length; i++) for (let k = i + 1; k < VEH.length; k++) {
    const A = VEH[i], B = VEH[k]; if (A.gone || B.gone || (A.kin && B.kin)) continue;
    const rr = A.M.hl + B.M.hl; if (Math.abs(A.x - B.x) > rr || Math.abs(A.y - B.y) > rr) continue;
    if (!obbVsObb(A, B)) continue;
    const dv = impulse(A, B);
    if (dv > 1) {
      FXQ.push({ k: 'crash', x: HIT.px, y: HIT.py, j: dv, v: A, o: B });
      crashDamage(A, dv * (B.kin ? 1.4 : B.mass / (A.mass + B.mass) * 2), B); crashDamage(B, dv * (A.kin ? 1.4 : A.mass / (A.mass + B.mass) * 2), A);
      A.lastHit = B.lastHit = tick;
      if (A.ai) A.ai.hitBy = B; if (B.ai) B.ai.hitBy = A;
    }
  }
}
function physicsTick() {
  const dt = DT / SUB;
  for (let s = 0; s < SUB; s++) {
    for (const V of VEH) {
      if (V.gone) continue;
      if (V.kin) { V.x += V.vx * dt; V.y += V.vy * dt; continue; }
      driveStep(V, dt);
      V.a += V.w * dt; V.x += V.vx * dt; V.y += V.vy * dt;
      surfaceStep(V, dt);
      collideVehicle(V);
    }
    collideVehicles();
  }
  for (const V of VEH) {
    V.bob *= 0.8; if (V.bumpT > 0) V.bumpT -= DT; if (V.flash > 0) V.flash--;
    V.a = ((V.a % TAU) + TAU) % TAU;
  }
}
