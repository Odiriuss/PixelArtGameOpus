// =================================================================== VEHICLES: VOXEL MODELS, RENDERED AT 64 HEADINGS
// A model is a solid over (u forward, v left, z up) in metres, sampled at 1/24 m. Its surface voxels are lit by a
// fixed key light and splatted into one sprite per heading (rendered on first use). Every sprite pixel keeps a
// material code and its own ground depth, so a car passes behind a lamp post with its nose and in front with its tail.
const VS = 1 / 24, NHEAD = 64;
const VM = { PAINT: 1, PAINT2: 2, TRIM: 3, GLASS: 4, TIRE: 5, HUB: 6, HEAD: 7, TAIL: 8, GRILLE: 9, SIGN: 10, PLATE: 11, WALL: 12, DARK: 13 };
// sprite pixel codes: palette index < 64; 200+k paint level k; 210+k second paint; 240 headlamp, 241 tail lamp, 242 roof sign, 243 plate
const CODE_HEAD = 240, CODE_TAIL = 241, CODE_SIGN = 242, CODE_PLATE = 243;
const PAINTS = {
  black: [C.BLK, C.INK, C.NAV, C.SLT, C.VIO], oxblood: [C.PLUM, C.OX, C.CRIM, C.CORAL, C.SKL],
  cream: [C.TAN, C.TANL, C.STL, C.CREAM, C.WHITE], teal: [C.DW, C.CYD, C.CYD, C.CYAN, C.WL],
  yellow: [C.DBR, C.AMB, C.BRASS, C.PALEY, C.HOT], green: [C.G0, C.G1, C.G2, C.G3, C.PALEY],
  navy: [C.DW, C.PNV, C.SLT, C.S1, C.S2], red: [C.PLUM, C.CRIM, C.RED, C.CORAL, C.CREAM],
  steel: [C.S0, C.S1, C.S2, C.S3, C.WHITE], tan: [C.DBR, C.BRN, C.TAN, C.TANL, C.STL],
  burnt: [C.BLK, C.BLK, C.INK, C.ST0, C.ST0], ink: [C.BLK, C.BLK, C.INK, C.INK, C.NAV]
};
const RAMP_TRIM = [C.S0, C.S1, C.S2, C.S3, C.WHITE], RAMP_GLASS = [C.BLK, C.INK, C.NAV, C.SLT, C.S1];

// ------------------------------------------------------------------ shapes
function carShape(M) {
  const L2 = M.L / 2, W2 = M.W / 2, wb = M.wb / 2, wr = M.wr || 0.36;
  return (u, v, z) => {
    const av = Math.abs(v), au = Math.abs(u);
    for (const wu of [wb, -wb]) {
      const r = Math.hypot(u - wu, z - wr);
      if (r < wr && av > W2 - 0.3 && av < W2 - 0.03) return r < wr * 0.33 ? VM.HUB : (r > wr * 0.55 && r < wr * 0.72 && M.whitewall ? VM.WALL : VM.TIRE);
    }
    if (au > L2 || av > W2) return 0;
    const cu = au - (L2 - 0.25), cv = av - (W2 - 0.25);
    if (cu > 0 && cv > 0 && cu * cu + cv * cv > 0.0625) return 0;                         // rounded corners in plan
    const belt = M.belt(u);
    if (z >= 0.24 && z < belt) {
      for (const wu of [wb, -wb]) if (av > W2 - 0.34 && Math.hypot(u - wu, z - wr) < wr + 0.08) return 0;   // wheel arches
      if (au > L2 - 0.1 && z < 0.44) return VM.TRIM;                                       // bumpers
      if (u > L2 - 0.1) {
        if (Math.hypot(av - (W2 - 0.36), z - 0.66) < 0.12) return VM.HEAD;
        if (av < W2 - 0.52 && z > 0.44 && z < 0.64) return (Math.floor(z / VS) & 1) ? VM.GRILLE : VM.TRIM;
      }
      if (u < -L2 + 0.1) {
        if (av > W2 - 0.52 && av < W2 - 0.26 && z > 0.55 && z < 0.8) return VM.TAIL;
        if (av < 0.24 && z > 0.46 && z < 0.58) return VM.PLATE;
      }
      if (av > W2 - 0.05 && Math.abs(z - 0.62) < 0.022) return VM.TRIM;                  // side spear
      if (M.stripe && av > W2 - 0.05 && Math.abs(z - 0.5) < 0.06) return (Math.floor(u / 0.16) + Math.floor(z / 0.06)) & 1 ? VM.DARK : VM.PAINT2;
      return (M.twoTone && z > 0.62) ? VM.PAINT2 : VM.PAINT;
    }
    if (M.box && u < M.box && u > -L2 + 0.02) {                                           // a van's cargo box
      if (z < M.H && av < W2 - 0.02) return (M.boxText && av > W2 - 0.06 && M.boxText(u, z, v)) ? VM.DARK : VM.PAINT2;
      return 0;
    }
    if (z >= belt && z <= M.cabH) {
      const t = (z - belt) / (M.cabH - belt);
      const front = M.c1 - t * M.rakeF, back = M.c0 + t * M.rakeB, half = W2 - 0.08 - t * 0.2;
      if (u > front || u < back || av > half) return 0;
      if (z > M.cabH - 0.06) return M.roof2 ? VM.PAINT2 : VM.PAINT;
      if (front - u < 0.07 || u - back < 0.09 || (M.bp !== undefined && Math.abs(u - M.bp) < 0.05)) return M.roof2 ? VM.PAINT2 : VM.PAINT;
      return VM.GLASS;
    }
    if (M.sign && z > M.cabH && z < M.cabH + 0.18 && Math.abs(u - M.sign) < 0.24 && av < 0.3) return VM.SIGN;
    return 0;
  };
}
// a PCC streetcar: green skirt, cream window band and roof, rounded double ends
function tramShape(M) {
  const L2 = M.L / 2, W2 = M.W / 2;
  return (u, v, z) => {
    const av = Math.abs(v), au = Math.abs(u);
    if (z < 0.25) return (av < W2 - 0.4 && Math.abs(au - 3.6) < 0.9) ? VM.TIRE : 0;          // bogies
    const nose = au - (L2 - 1.1), half = nose > 0 ? W2 - nose * nose * 0.9 : W2;
    if (av > half || au > L2) return 0;
    const roofZ = 2.95 - (av / W2) ** 4 * 0.35 - (nose > 0 ? nose * 0.25 : 0);
    if (z > roofZ) return 0;
    if (z > roofZ - 0.08) return VM.PAINT2;
    if (z < 1.25) {
      if (au > L2 - 0.12 && z < 0.5) return VM.TRIM;
      if (au > L2 - 0.3 && av < 0.18 && Math.abs(z - 0.95) < 0.12) return VM.HEAD;
      if (au > L2 - 0.5 && av > half - 0.1 && Math.abs(z - 0.95) < 0.08) return VM.TAIL;
      if (Math.abs(z - 0.8) < 0.03 && av > half - 0.08) return VM.TRIM;
      return VM.PAINT;
    }
    if (z < 1.35 || z > 2.3) return VM.PAINT2;
    if (au > L2 - 0.7) return frac(v / 0.9) < 0.08 ? VM.PAINT2 : VM.GLASS;                   // end windows
    if (Math.abs(au - (L2 - 1.6)) < 0.5 && v < 0) return VM.DARK;                            // doors on the kerb side
    return frac((u + L2) / 1.1) < 0.14 ? VM.PAINT2 : VM.GLASS;
  };
}
const CAR_MODELS = {
  sedan: { L: 4.9, W: 1.9, cabH: 1.46, wb: 2.9, c0: -1.35, c1: 0.55, rakeF: 0.62, rakeB: 0.42, bp: -0.35, whitewall: true,
           belt: u => u > 1.1 ? 0.86 - (u - 1.1) * 0.05 : (u < -1.35 ? 0.9 : 0.87),
           mass: 1500, top: 17, acc: 4.4, brake: 11, grip: 7.5, turn: 1.0, hp: 120, label: 'SEDAN' },
  coupe: { L: 4.5, W: 1.82, cabH: 1.33, wb: 2.7, c0: -1.45, c1: 0.3, rakeF: 0.6, rakeB: 0.85, whitewall: true, roof2: true, twoTone: true,
           belt: u => u > 0.8 ? 0.8 - (u - 0.8) * 0.04 : 0.82,
           mass: 1250, top: 19.5, acc: 5.4, brake: 12, grip: 8.2, turn: 1.12, hp: 95, label: 'COUPE' },
  taxi:  { L: 4.9, W: 1.9, cabH: 1.46, wb: 2.9, c0: -1.35, c1: 0.55, rakeF: 0.62, rakeB: 0.42, bp: -0.35, sign: -0.35, stripe: true,
           belt: u => u > 1.1 ? 0.86 - (u - 1.1) * 0.05 : (u < -1.35 ? 0.9 : 0.87),
           mass: 1550, top: 16.5, acc: 4.2, brake: 11, grip: 7.5, turn: 1.0, hp: 120, label: 'CAB' },
  van:   { L: 5.3, W: 2.0, cabH: 2.05, H: 2.35, wb: 3.3, wr: 0.42, c0: 1.05, c1: 1.9, rakeF: 0.45, rakeB: 0, box: 1.05,
           belt: u => u > 1.05 ? 1.02 : 1.0, mass: 2600, top: 13.5, acc: 3.0, brake: 9, grip: 7, turn: 0.82, hp: 180, label: 'VAN',
           boxText: (u, z, v) => wallTextHit('MERIDIAN DAIRY', 0, 1.78, v < 0 ? 0.85 - u : u + 2.45, z, 0.75) },
  tram:  { L: 12, W: 2.5, H: 2.95, shape: tramShape, nr: 1, mass: 1e9, label: 'STREETCAR', hp: 1e9 }
};
const KEYL = (() => { const l = [0.35, -0.45, 0.82], n = Math.hypot(l[0], l[1], l[2]); return [l[0] / n, l[1] / n, l[2] / n]; })();
function buildCarModel(name) {
  const M = CAR_MODELS[name], shape = (M.shape || carShape)(M), L2 = M.L / 2, W2 = M.W / 2, top = (M.H || M.cabH) + 0.25;
  const nu = Math.ceil(M.L / VS) + 3, nv = Math.ceil(M.W / VS) + 3, nz = Math.ceil(top / VS) + 3;
  const grid = new Uint8Array(nu * nv * nz), at = (i, j, k) => (i < 0 || j < 0 || k < 0 || i >= nu || j >= nv || k >= nz) ? 0 : grid[(k * nv + j) * nu + i];
  for (let k = 0; k < nz; k++) for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++)
    grid[(k * nv + j) * nu + i] = shape(-L2 - VS + (i + 0.5) * VS, -W2 - VS + (j + 0.5) * VS, (k - 1 + 0.5) * VS);
  // surface voxels with normals smoothed over a (2R+1)^3 neighbourhood
  const vox = [], R = M.nr || 2;
  for (let k = 0; k < nz; k++) for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const m = at(i, j, k); if (!m) continue;
    if (at(i - 1, j, k) && at(i + 1, j, k) && at(i, j - 1, k) && at(i, j + 1, k) && at(i, j, k - 1) && at(i, j, k + 1)) continue;
    let nx = 0, ny = 0, nzz = 0;
    for (let c = -R; c <= R; c++) for (let b = -R; b <= R; b++) for (let a = -R; a <= R; a++) if (!at(i + a, j + b, k + c)) { nx += a; ny += b; nzz += c; }
    const nn = Math.hypot(nx, ny, nzz) || 1;
    vox.push(-L2 - VS + (i + 0.5) * VS, -W2 - VS + (j + 0.5) * VS, (k - 1 + 0.5) * VS, m, nx / nn, ny / nn, nzz / nn);
  }
  const rad = Math.hypot(L2, W2) + 0.1;
  M.vox = new Float32Array(vox); M.SW = 2 * Math.ceil(rad * 22.7) + 6; M.SH = Math.ceil(rad * 22.7 + top * 16) + 6;
  M.ax = M.SW >> 1; M.ay = Math.ceil(rad * 11.4) + Math.ceil(top * 16) + 3;
  M.frames = new Array(NHEAD).fill(null); M.name = name; M.hl = L2; M.hw = W2; M.height = M.H || M.cabH;
  return M;
}
// splat one heading; pixels as parallel arrays: offset x, y, code, ground depth (1/16 m)
const VBUF = { c: null, k: null, f: null, n: 0 };
function renderHeading(M, hIdx) {
  const SW = M.SW, SH = M.SH, n = SW * SH;
  if (VBUF.n < n) { VBUF.c = new Uint8Array(n); VBUF.k = new Float32Array(n); VBUF.f = new Float32Array(n); VBUF.n = n; }
  const cbuf = VBUF.c, kbuf = VBUF.k, fbuf = VBUF.f, V = M.vox;
  cbuf.fill(T, 0, n); kbuf.fill(-1e9, 0, n);
  const hd = hIdx / NHEAD * TAU, c = Math.cos(hd), s = Math.sin(hd), ax = M.ax, ay = M.ay;
  for (let q = 0; q < V.length; q += 7) {
    const u = V[q], v = V[q + 1], z = V[q + 2], m = V[q + 3];
    const wx = u * c - v * s, wy = u * s + v * c;
    const px = Math.round(ax + (wx - wy) * 16), py = Math.round(ay + (wx + wy) * 8 - z * 16);
    if (px < 0 || py < 0 || px >= SW || py >= SH) continue;
    const p = py * SW + px, key = wx + wy + z;
    if (key <= kbuf[p]) continue;
    kbuf[p] = key; fbuf[p] = wx + wy;
    const nwx = V[q + 4] * c - V[q + 5] * s, nwy = V[q + 4] * s + V[q + 5] * c, nz = V[q + 6];
    const l = nwx * KEYL[0] + nwy * KEYL[1] + nz * KEYL[2];
    const spec = Math.pow(Math.max(0, (nwx + nwy + nz) / 1.732 * 0.5 + l * 0.5), 12);
    const lv = (base, gain) => clamp(Math.floor(base + gain * l + spec * 2.2 + 0.5 + (bay(px, py) - 0.5) * 0.35), 0, 4);
    let code;
    switch (m) {
      case VM.PAINT: code = 200 + lv(1.6, 2.2); break;
      case VM.PAINT2: code = 210 + lv(1.6, 2.2); break;
      case VM.TRIM: code = RAMP_TRIM[lv(1.8, 2.8)]; break;
      case VM.GLASS: code = RAMP_GLASS[clamp(lv(0.8, 1.6) + (frac(u * 1.1 + z * 2.4) < 0.1 ? 2 : 0), 0, 4)]; break;
      case VM.TIRE: code = l > 0.3 ? C.INK : C.BLK; break;
      case VM.HUB: code = l > 0 ? C.S3 : C.S2; break;
      case VM.WALL: code = l > 0 ? C.CREAM : C.CRS; break;
      case VM.HEAD: code = CODE_HEAD; break;
      case VM.TAIL: code = CODE_TAIL; break;
      case VM.SIGN: code = CODE_SIGN; break;
      case VM.PLATE: code = CODE_PLATE; break;
      default: code = C.INK;
    }
    cbuf[p] = code;
  }
  const out = [];
  for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
    const p = y * SW + x;
    if (cbuf[p] !== T) { out.push(x - ax, y - ay, cbuf[p], Math.round(fbuf[p] * 16)); continue; }
    let best = -1e9, bf = 0;                                  // outline: black, at the depth of the nearest neighbour
    if (x > 0 && cbuf[p - 1] !== T && kbuf[p - 1] > best) { best = kbuf[p - 1]; bf = fbuf[p - 1]; }
    if (x < SW - 1 && cbuf[p + 1] !== T && kbuf[p + 1] > best) { best = kbuf[p + 1]; bf = fbuf[p + 1]; }
    if (y > 0 && cbuf[p - SW] !== T && kbuf[p - SW] > best) { best = kbuf[p - SW]; bf = fbuf[p - SW]; }
    if (y < SH - 1 && cbuf[p + SW] !== T && kbuf[p + SW] > best) { best = kbuf[p + SW]; bf = fbuf[p + SW]; }
    if (best > -1e9) out.push(x - ax, y - ay, C.BLK, Math.round(bf * 16));
  }
  const cnt = out.length / 4, fr = { n: cnt, x: new Int16Array(cnt), y: new Int16Array(cnt), c: new Uint8Array(cnt), d: new Int16Array(cnt) };
  for (let k = 0; k < cnt; k++) { fr.x[k] = out[k * 4]; fr.y[k] = out[k * 4 + 1]; fr.c[k] = out[k * 4 + 2]; fr.d[k] = out[k * 4 + 3]; }
  return fr;
}
function headIndex(a) { return ((Math.round(a / TAU * NHEAD) % NHEAD) + NHEAD) % NHEAD; }
function modelFrame(M, a) { const h = headIndex(a); return M.frames[h] || (M.frames[h] = renderHeading(M, h)); }
function buildCarModels() { for (const k in CAR_MODELS) buildCarModel(k); }
// per-car colour lookup: codes -> palette
function carLut(paint, paint2, plate) {
  const lut = new Uint8Array(256);
  for (let i = 0; i < 64; i++) lut[i] = i;
  for (let k = 0; k < 5; k++) { lut[200 + k] = paint[k]; lut[210 + k] = (paint2 || paint)[k]; }
  lut[CODE_HEAD] = C.S3; lut[CODE_TAIL] = C.OX; lut[CODE_SIGN] = C.PALEY; lut[CODE_PLATE] = plate === undefined ? C.CREAM : plate;
  return lut;
}
