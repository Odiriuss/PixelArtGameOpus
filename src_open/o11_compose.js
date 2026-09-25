// =================================================================== COMPOSE: THE BAKED TILES OF THE CITY AND THE FLOOR HE IS ON, INTO THE FRAME
// ------------------------------------------------------------------ compose the visible tiles into the frame
// LIFT: the building whose roof is off (its pixels above the cut dissolve by k), the floor shown, the cut height.
// IB per pixel: 1 interior, 2 weak (a cut-away pixel an interior pixel may cover whatever its depth).
// CUT: the see-through round Frank. Only what stands between the camera and him is cut: the buildings that cover
// his box on the screen (over a wide ellipse, so he sees the street he is on) and loose things in front (close by).
const CUT = { on: false, sx: 0, sy: 0, d: 0, rx: 150, ry: 96, box: [0, 0, 0, 0], stamp: 0 };
const CUTB = new Uint32Array(4096);                           // building id -> the frame it covers Frank in
const LIFT = { b: null, f: 0, k: 0, cut: WCUT };
const IB = new Uint8Array(SCR_N);
function composeCity(cx, cy) {
  const n = W * H;                                              // the buffers hold the widest view; this one is W x H
  fb.fill(LP.sky, 0, n); zb.fill(-1e9, 0, n); hb.fill(0, 0, n); sm.fill(0, 0, n); mb.fill(0, 0, n); rsrc.fill(-1, 0, n); IB.fill(0, 0, n);
  RELIGHT.t0 = performance.now();
  const tx0 = Math.floor(cx / TS), tx1 = Math.floor((cx + W - 1) / TS), ty0 = Math.floor(cy / TS), ty1 = Math.floor((cy + H - 1) / TS);
  const B = LIFT.k > 0 && LIFT.b ? LIFT.b : null, bid = B ? B.id : -1, cutq = LIFT.cut * 6, fk = LIFT.k;
  // under
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    const t = getTile(tx, ty); if (!t || !t.U) continue;
    const ox = tx * TS, oy = ty * TS, U = t.U; ensureLit(U, ox, oy);
    const x0 = Math.max(cx, ox), x1 = Math.min(cx + W, ox + TS), y0 = Math.max(cy, oy), y1 = Math.min(cy + H, oy + TS);
    const col = U.col, lit = U.lit, alt = U.alt, ft = U.ft, dep = U.dep, mt = U.mat, ub = U.bid, zq = U.zq;
    for (let sy = y0; sy < y1; sy++) {
      const ti = (sy - oy) * TS - ox, si = (sy - cy) * W - cx;
      for (let sx = x0; sx < x1; sx++) {
        const i = ti + sx; if (col[i] === T) continue;
        const p = si + sx, f = ft[i];
        fb[p] = f && !FAST_ON[f] ? alt[i] : lit[i]; zb[p] = dep[i] / DSC; mb[p] = mt[i];
        if (B && ub[i] && zq[i] > cutq && (ub[i] !== bid || bay(sx, sy) < fk)) IB[p] = 2;
      }
    }
  }
  if (B) composeInterior(B.floors[LIFT.f], cx, cy);
  // over
  const cut = CUT.on, fsx = CUT.sx, fsy = CUT.sy, fd = CUT.d, irx = 1 / CUT.rx, iry = 1 / CUT.ry, st = ++CUT.stamp;
  if (cut) coverers(cx, cy, st);
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    const t = getTile(tx, ty); if (!t || !t.O) continue;
    const ox = tx * TS, oy = ty * TS, O = t.O; ensureLit(O, ox, oy);
    const x0 = Math.max(cx, ox), x1 = Math.min(cx + W, ox + TS), y0 = Math.max(cy, oy), y1 = Math.min(cy + H, oy + TS);
    const col = O.col, lit = O.lit, alt = O.alt, ft = O.ft, dep = O.dep, obd = O.bid, zq = O.zq;
    for (let sy = y0; sy < y1; sy++) {
      const ti = (sy - oy) * TS - ox, si = (sy - cy) * W - cx, ey = (sy - fsy) * iry, ey2 = ey * ey;
      for (let sx = x0; sx < x1; sx++) {
        const i = ti + sx; if (col[i] === T) continue;
        const p = si + sx, d = dep[i] / DSC;
        if (B) {
          if (obd[i] === bid) { if (zq[i] > cutq && bay(sx, sy) < fk) continue; }         // the lifted roof; its walls below the cut stay
          else if (IB[p] === 1) continue;                                                  // nothing else in front of the interior
        }
        if (d < zb[p]) continue;
        if (cut && d > fd) {
          const ob = obd[i], ex = (sx - fsx) * irx, e = ob ? (CUTB[ob] === st ? ex * ex + ey2 : 2) : (ex * ex + ey2) * 12;
          if (e < 1) {
            const k = Math.min(1, (d - fd) / 1.2) * (e < 0.6 ? 1 : 1 - (e - 0.6) / 0.4);
            if (bay(sx, sy) < k) continue;
          }
        }
        const f = ft[i];
        fb[p] = f && !FAST_ON[f] ? alt[i] : lit[i]; zb[p] = d; mb[p] = MAT_OUTSIDE;
      }
    }
  }
}
// mark the buildings whose upper pixels stand in front of Frank inside his box on the screen
function coverers(cx, cy, st) {
  const [bx0, by0, bx1, by1] = CUT.box, fd = CUT.d;
  const X0 = Math.max(cx, bx0 + cx), X1 = Math.min(cx + W, bx1 + cx), Y0 = Math.max(cy, by0 + cy), Y1 = Math.min(cy + H, by1 + cy);
  for (let ty = Math.floor(Y0 / TS); ty <= Math.floor((Y1 - 1) / TS); ty++) for (let tx = Math.floor(X0 / TS); tx <= Math.floor((X1 - 1) / TS); tx++) {
    const t = TILES.get(tkey(tx, ty)); if (!t || !t.O) continue;
    const O = t.O, ox = tx * TS, oy = ty * TS, col = O.col, dep = O.dep, obd = O.bid;
    for (let y = Math.max(Y0, oy); y < Math.min(Y1, oy + TS); y++) for (let x = Math.max(X0, ox); x < Math.min(X1, ox + TS); x++) {
      const i = (y - oy) * TS + x - ox; if (col[i] === T || !obd[i] || dep[i] / DSC <= fd) continue;
      CUTB[obd[i]] = st;
    }
  }
}
function composeInterior(F, cx, cy) {
  const b = F.cb, tx0 = Math.floor(Math.max(cx, b[0]) / TS), tx1 = Math.floor(Math.min(cx + W - 1, b[2]) / TS);
  const ty0 = Math.floor(Math.max(cy, b[1]) / TS), ty1 = Math.floor(Math.min(cy + H - 1, b[3]) / TS);
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    const t = getIntTile(F, tx, ty); if (!t) continue;
    const ox = tx * TS, oy = ty * TS, L = t.L; ensureLit(L, ox, oy);
    const x0 = Math.max(cx, ox), x1 = Math.min(cx + W, ox + TS), y0 = Math.max(cy, oy), y1 = Math.min(cy + H, oy + TS);
    const col = L.col, lit = L.lit, alt = L.alt, ft = L.ft, dep = L.dep, mt = L.mat;
    for (let sy = y0; sy < y1; sy++) {
      const ti = (sy - oy) * TS - ox, si = (sy - cy) * W - cx;
      for (let sx = x0; sx < x1; sx++) {
        const i = ti + sx; if (col[i] === T) continue;
        const p = si + sx, d = dep[i] / DSC;
        if (IB[p] !== 2 && d < zb[p] - 0.02) continue;
        const f = ft[i];
        fb[p] = f && !FAST_ON[f] ? alt[i] : lit[i]; zb[p] = d; mb[p] = mt[i]; IB[p] = 1;
      }
    }
  }
}
// puddles and wet paving mirror whatever stands above them in the same screen column (only while the street is wet)
function cityReflections() {
  const wet = WEATHER.wet, gloss = wet > 0.45;
  for (let x = 0; x < W; x++) {
    let base = -1;
    for (let y = 0; y < H; y++) {
      const p = y * W + x, m = mb[p];
      if (!(m & MAT_FLOOR)) { base = y; continue; }
      if (base < 0 || !(m & (MAT_PUDDLE | MAT_GLOSS))) continue;
      if ((m & MAT_OUTSIDE) && !(m & MAT_WATER) && (m & MAT_PUDDLE ? wet < 0.15 : !gloss)) continue;
      const src = 2 * base + 1 - y;
      if (src >= 0) rsrc[p] = src * W + x;
    }
  }
  applyReflections();
}
