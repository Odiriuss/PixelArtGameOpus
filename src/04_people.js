
// =================================================================== PEOPLE (procedural paper dolls)
// Two drawn views: FRONT = facing SE (toward the viewer, turned right), BACK = facing NE.
// SW / NW are mirrors. Frames are Uint8 palette buffers, feet anchored at (SPR_AX, SPR_BY).
const SPR_W = 26, SPR_H = 42, SPR_AX = 13, SPR_BY = 40;
let SF = null;                                              // frame being drawn
function newFrame() { return new Uint8Array(SPR_W * SPR_H).fill(T); }
function sp(x, y, c) { if (c !== T && c !== undefined && x >= 0 && y >= 0 && x < SPR_W && y < SPR_H) SF[y * SPR_W + x] = c; }
function spr(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) sp(x + i, y + j, c); }
function spget(x, y) { return (x < 0 || y < 0 || x >= SPR_W || y >= SPR_H) ? T : SF[y * SPR_W + x]; }
function spline(x0, y0, x1, y1, c, w) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let k = 0; k <= n; k++) {
    const x = Math.round(lerp(x0, x1, k / n)), y = Math.round(lerp(y0, y1, k / n));
    for (let j = 0; j < (w || 1); j++) sp(x + j, y, c);
  }
}
// string map at (x0, y0). key maps chars to colours from the costume
function spmap(x0, y0, rows, key, flip) {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let i = 0; i < row.length; i++) {
      const ch = row[flip ? row.length - 1 - i : i];
      if (ch === '.' || ch === ' ') continue;
      sp(x0 + i, y0 + r, key[ch]);
    }
  }
}
// dark outline around the silhouette (selective: lit top-left edge gets ink, rest black)
function outline(oc) {
  const src = SF.slice();
  for (let y = 0; y < SPR_H; y++) for (let x = 0; x < SPR_W; x++) {
    if (src[y * SPR_W + x] !== T) continue;
    const n = (x > 0 && src[y * SPR_W + x - 1] !== T) || (x < SPR_W - 1 && src[y * SPR_W + x + 1] !== T) ||
              (y > 0 && src[(y - 1) * SPR_W + x] !== T) || (y < SPR_H - 1 && src[(y + 1) * SPR_W + x] !== T);
    if (n) SF[y * SPR_W + x] = oc;
  }
}

// ------------------------------------------------------------------ costume palettes
// o outline, H/h/b hat, S/s/L skin, e eye, m mouth, A/a hair, C/c/K main garment (mid/dark/light),
// B belt, k buckle, T/t trousers or skirt, F shoes, W shirt, N tie, G gloves/hands override, X extra
function costume(o) {
  const d = { o: C.BLK, S: C.SKM, s: C.SKS, L: C.SKL, e: C.INK, m: C.SKS, A: C.HAIRD, a: C.HAIRL,
              H: C.ST1, h: C.ST0, b: C.INK, C: C.S1, c: C.S0, K: C.S2, B: C.INK, k: C.BRASS,
              T: C.ST0, t: C.NAV, F: C.INK, W: C.CREAM, N: C.OX, X: C.BRASS, Y: C.CRS };
  for (const k in o) d[k] = o[k];
  return d;
}
// ------------------------------------------------------------------ figure builder
// def: {h: height rows, body: 'coat'|'suit'|'skirt'|'vest'|'long', hat: 'fedora'|'cap'|'none'|'doorman',
//       hair: 'short'|'bob'|'bun'|'bald'|'slick', wide: 0|1 (stocky), key: costume}
// pose: {dir: 0 front / 1 back, q: leg swing -1..1, lift: 0/1 which foot lifted, arm: swing -1..1,
//        reach: 0..1, talk: 0/1, bob: 0/1, hold: item id}
function drawFigure(def, pose) {
  const K = def.key, back = pose.dir === 1, wd = def.wide ? 1 : 0;
  const top = SPR_BY - def.h + 1 + pose.bob;
  const fem = def.body === 'skirt' || def.body === 'dress';
  // vertical landmarks
  const headTop = top + (def.hat === 'none' ? 1 : 3);             // first face row (brim row is headTop-1)
  const faceY = headTop, chin = faceY + 4, sh = chin + 1;           // shoulders row
  const waist = sh + (fem ? 6 : 7), hem = fem ? SPR_BY - 6 : SPR_BY - 6 - (def.body === 'long' ? -2 : def.body === 'coat' ? 0 : 5);
  const cx = SPR_AX;                                                // figure centre column
  const fwdX = 1, fwdY = back ? -0.5 : 0.5;
  // ---------------- far arm (behind torso)
  const as = pose.arm;
  {
    const sx = cx + 3 + wd, hx = sx + Math.round(-as * 0.8 * fwdX), hy = waist + 1 + Math.round(-as * 0.6 * fwdY);
    spline(sx, sh + 1, hx, hy, back ? K.C : K.c, 2);
    spr(hx, hy + 1, 2, 1, back ? K.s : K.s);
  }
  // ---------------- legs
  const q = pose.q;
  const hipY = hem - 1;
  for (let leg = 0; leg < 2; leg++) {
    const near = leg === 0, sgn = near ? 1 : -1;
    const baseX = near ? cx - 2 : cx + 1, baseY = near ? SPR_BY : SPR_BY - 1;
    const dx = Math.round(q * sgn * 2.2 * fwdX), dy = Math.round(q * sgn * 2.2 * fwdY);
    const lift = (pose.lift === (near ? 1 : 2)) ? 1 : 0;
    const fx = baseX + dx, fy = baseY + dy - lift;
    const legC = fem ? (near ? K.L : K.S) : (near ? K.T : K.t);
    spline(baseX + (near ? 0 : 0), hipY, fx, fy - 1, legC, 2);
    // shoe: points along facing
    if (back) { sp(fx, fy, K.F); sp(fx + 1, fy, K.F); sp(fx + 1, fy - 1, fem ? K.F : legC); }
    else { spr(fx, fy, 3, 1, K.F); if (fem) sp(fx, fy - 1, K.F); }
  }
  // ---------------- lower garment (coat skirt / skirt / trousers top)
  if (def.body === 'coat' || def.body === 'long') {
    for (let y = waist + 1; y <= hem; y++) {
      const t = (y - waist) / (hem - waist), flare = Math.round(t * 1.4);
      const x0 = cx - 3 - wd - flare + (y === hem ? Math.round(q * 0.6) : 0), x1 = cx + 3 + wd + flare + (y === hem ? Math.round(q * 0.6) : 0);
      for (let x = x0; x <= x1; x++) {
        let c = K.C;
        if (x <= x0) c = K.K; else if (x >= x1 - 1) c = K.c;
        if (!back && x === cx + 1) c = K.c;                        // front opening
        if (back && x === cx && y > waist + 3) c = K.c;            // back vent
        if (y === hem) c = x <= x0 + 1 ? K.C : K.c;
        sp(x, y, c);
      }
    }
  } else if (fem) {
    for (let y = waist + 1; y <= hem; y++) {
      const t = (y - waist) / (hem - waist), flare = def.body === 'dress' ? Math.round(t * 2) : 0;
      const x0 = cx - 3 - flare, x1 = cx + 2 + flare;
      for (let x = x0; x <= x1; x++) sp(x, y, x <= x0 ? K.T : x >= x1 ? K.t : K.T);
      if (!back) sp(cx, y, K.t);
    }
  } else {
    // suit / vest: trousers from waist to feet are the legs; add seat
    for (let y = waist + 1; y <= hipY; y++) for (let x = cx - 3 - wd; x <= cx + 2 + wd; x++) sp(x, y, x >= cx + 1 ? K.t : K.T);
  }
  // ---------------- torso
  for (let y = sh; y <= waist; y++) {
    const narrow = (y > waist - 2) ? 1 : 0, sw = (y === sh) ? 1 : 0;
    const x0 = cx - 4 - wd + narrow + sw, x1 = cx + 4 + wd - narrow - sw;
    for (let x = x0; x <= x1; x++) {
      let c = K.C;
      if (x <= x0) c = K.K; else if (x >= x1 - (back ? 0 : 1)) c = K.c;
      sp(x, y, c);
    }
  }
  if (!back) {
    // lapels + shirt + tie (V opening slightly right of centre: the chest faces SE)
    if (def.body === 'vest') {
      for (let y = sh; y <= waist; y++) { sp(cx - 4 - wd + 1, y, K.W); sp(cx + 3 + wd, y, K.W); }
      for (let y = sh; y <= sh + 2; y++) sp(cx, y, K.W), sp(cx + 1, y, K.W);
      sp(cx, sh, K.N); sp(cx + 1, sh, K.N);                       // bow tie
    } else if (def.body !== 'long') {
      const vy = fem ? 2 : 3;
      for (let y = sh; y <= sh + vy; y++) {
        const hw = vy - (y - sh);
        for (let x = cx + 1 - (hw > 1 ? 1 : 0); x <= cx + 1 + (hw > 0 ? 1 : 0); x++) sp(x, y, K.W);
        if (!fem) sp(cx + 1, y, y > sh ? K.N : K.W);
      }
      sp(cx - 1, sh + 2, K.c); sp(cx + 3, sh + 2, K.K);           // lapel edges
      if (!fem) { sp(cx - 1, waist - 2, K.c); sp(cx - 1, waist - 4, K.c); } // buttons
    } else {
      for (let y = sh + 1; y <= waist; y++) sp(cx + 1, y, K.c);
      sp(cx - 2, sh + 3, K.X); sp(cx - 2, sh + 6, K.X);             // brass buttons
    }
  } else {
    sp(cx, sh + 2, K.c); sp(cx, sh + 3, K.c);                     // back seam
  }
  if (def.body === 'coat') {
    // belt with buckle, turned-up collar
    for (let x = cx - 3 - wd; x <= cx + 3 + wd; x++) sp(x, waist, K.B);
    if (!back) sp(cx + 1, waist, K.k); else sp(cx - 3 - wd, waist, K.B);
    if (!back) { sp(cx - 3, sh - 1, K.C); sp(cx - 2, sh - 1, K.K); sp(cx + 3, sh - 1, K.c); sp(cx + 3, sh - 2, K.C); sp(cx - 3, sh - 2, K.K); }
    else { for (let x = cx - 3; x <= cx + 3; x++) sp(x, sh - 1, x < cx - 1 ? K.K : K.C); sp(cx - 3, sh - 2, K.K); sp(cx + 3, sh - 2, K.C); }
  }
  if (def.body === 'suit' || def.body === 'skirt') { for (let x = cx - 2 - wd; x <= cx + 2 + wd; x++) sp(x, waist, K.c); }
  // ---------------- head
  drawHead(def, K, back, cx, faceY, pose);
  // ---------------- near arm (in front)
  {
    const sx = cx - 4 - wd, reach = pose.reach || 0;
    let hx = sx + Math.round(as * 1.2 * fwdX), hy = waist + 2 + Math.round(as * 0.8 * fwdY);
    if (reach > 0) { hx = Math.round(lerp(hx, cx + 5, reach)); hy = Math.round(lerp(hy, sh + 3 + (back ? -2 : 0), reach)); }
    if (pose.talk) { hx = sx + 1; hy = waist - 1; }
    spline(sx, sh + 1, sx + Math.round((hx - sx) * 0.4), sh + 4, K.C, 2);
    spline(sx + Math.round((hx - sx) * 0.4), sh + 4, hx, hy, K.C, 2);
    sp(sx, sh + 1, K.K); sp(sx, sh + 2, K.K);
    if (!back || reach > 0) spr(hx, hy + 1, 2, 2, K.G !== undefined ? K.G : K.S); else spr(hx, hy + 1, 2, 1, K.s);
    if (pose.hold && def.holdDraw) def.holdDraw(hx, hy + 1, back);
  }
  if (def.extra) def.extra(K, back, cx, faceY, sh, waist, hem, pose);
  outline(K.o);
}
function drawHead(def, K, back, cx, fy, pose) {
  // face rows fy..fy+3, chin fy+4; head spans cx-2..cx+2
  const x0 = cx - 2;
  if (!back) {
    spmap(x0, fy, [
      'AsSSS',
      'sSSeS',
      'sSSSSS',
      '.smSs'
    ], K);
    if (pose.talk) sp(x0 + 2, fy + 3, K.e);
    sp(x0 + 1, fy + 4, K.s); sp(x0 + 2, fy + 4, K.s);
  } else {
    spmap(x0, fy, [
      'sAAAa',
      'SAaAA',
      'sSSSs',
      '.sSs.'
    ], K);
    sp(x0 + 1, fy + 4, K.s); sp(x0 + 2, fy + 4, K.s);
  }
  // hair styles
  if (def.hair === 'bob') {
    if (!back) { spmap(x0 - 1, fy - 2, ['.AAAAa.', 'AAAAAAa', 'AAss...', 'AA.....', 'AA.....', '.A.....'], K); }
    else { spmap(x0 - 1, fy - 2, ['.AAAAa.', 'AAAAAAa', 'AAAAAAa', 'AAAAAAa', 'AAAAAa.', '.AAAA..'], K); }
  } else if (def.hair === 'bun') {
    if (!back) { spmap(x0 - 1, fy - 2, ['.AAAa..', 'AAAAAa.', 'AAs....', 'A......'], K); spmap(x0 - 2, fy - 2, ['aA', 'AA'], K); }
    else { spmap(x0 - 1, fy - 2, ['.AAAa..', 'AAAAAa.', 'AAAAAa.', '.AaAA..'], K); spmap(x0 + 1, fy - 3, ['aAa'], K); }
  } else if (def.hair === 'short' || def.hair === 'slick') {
    if (!back) spmap(x0 - 1, fy - 2, ['.AAAa.', 'AAAAAa', 'AA....'], K);
    else spmap(x0 - 1, fy - 2, ['.AAAa.', 'AAAAAa', 'AAAAAa'], K);
  } else if (def.hair === 'bald') {
    if (!back) spmap(x0 - 1, fy - 2, ['..SSL.', '.SSSSL', 'AS....'], K);
    else spmap(x0 - 1, fy - 2, ['..SSs.', '.SSSSs', 'AAAAAA'], K);
  }
  // hats
  if (def.hat === 'fedora') {
    if (!back) spmap(x0 - 2, fy - 4, ['...HHH...', '..HHHHH..', '..bbbbb..', 'hhhhhhhhh', '......hh.'], K);
    else spmap(x0 - 2, fy - 4, ['...HHH...', '..HHHHH..', '..bbbbb..', 'hhhhhhhhh', '.hh......'], K);
  } else if (def.hat === 'cap') {
    if (!back) spmap(x0 - 1, fy - 3, ['.HHHH..', 'HHHXHH.', 'hhhhhhh', '....hhh'], K);
    else spmap(x0 - 1, fy - 3, ['.HHHH..', 'HHHHHH.', 'hhhhhh.', '.......'], K);
  } else if (def.hat === 'doorman') {
    if (!back) spmap(x0 - 1, fy - 4, ['.HHHH.', 'HHHHHH', 'XXXXXX', 'hhhhhhh', '....hh.'], K);
    else spmap(x0 - 1, fy - 4, ['.HHHH.', 'HHHHHH', 'XXXXXX', 'hhhhhh.', '......'], K);
  } else if (def.hat === 'pillbox') {
    spmap(x0, fy - 3, ['.HHH.', 'HHHHH'], K);
  }
}
// ------------------------------------------------------------------ animation sets
// walk: 6 frames per cycle. idle: 2 (breath). talk: 2. reach: 1.
const WALK_Q = [0, 0.7, 1, 0, -0.7, -1], WALK_BOB = [0, 0, 1, 0, 0, 1], WALK_LIFT = [0, 2, 0, 0, 1, 0];
function buildPerson(def) {
  const P = { def, front: {}, back: {} };
  for (let dir = 0; dir < 2; dir++) {
    const set = dir ? P.back : P.front;
    set.idle = []; set.walk = []; set.talk = []; set.reach = [];
    for (let f = 0; f < 2; f++) { SF = newFrame(); drawFigure(def, { dir, q: 0, arm: 0, bob: f, lift: 0 }); set.idle.push(SF); }
    for (let f = 0; f < 6; f++) {
      SF = newFrame();
      drawFigure(def, { dir, q: WALK_Q[f], arm: -WALK_Q[f], bob: WALK_BOB[f], lift: WALK_LIFT[f] });
      set.walk.push(SF);
    }
    for (let f = 0; f < 2; f++) { SF = newFrame(); drawFigure(def, { dir, q: 0, arm: 0, bob: 0, talk: f }); set.talk.push(SF); }
    SF = newFrame(); drawFigure(def, { dir, q: 0, arm: 0, bob: 0, reach: 1 }); set.reach.push(SF);
    if (def.poses) for (const name in def.poses) {
      set[name] = [];
      for (const pz of def.poses[name]) { SF = newFrame(); drawFigure(def, Object.assign({ dir, q: 0, arm: 0, bob: 0 }, pz)); set[name].push(SF); }
    }
  }
  SF = null;
  return P;
}

// ------------------------------------------------------------------ the cast
const CAST_DEFS = {
  frank: { h: 31, body: 'coat', hat: 'fedora', hair: 'short', color: C.CREAM, name: 'Frank',
           key: costume({ C: C.TAN, c: C.BRN, K: C.TANL, B: C.BRN, k: C.BRASS, H: C.ST1, h: C.ST0, b: C.INK,
                          T: C.ST0, t: C.NAV, F: C.INK, W: C.CREAM, N: C.OX, A: C.HAIRD, a: C.HAIRL }) },
  russo: { h: 29, body: 'skirt', hat: 'none', hair: 'bob', color: C.WL, name: 'Russo',
           key: costume({ C: C.S1, c: C.S0, K: C.S2, T: C.S0, t: C.NAV, W: C.CREAM, A: C.HAIRD, a: C.HAIRL,
                          F: C.INK, S: C.SKM, L: C.SKL, s: C.SKS, m: C.CRIM }) },
  cop:   { h: 31, body: 'suit', hat: 'cap', hair: 'short', color: C.S2, name: 'Mulroney', wide: 1,
           key: costume({ C: C.PNV, c: C.DW, K: C.SLT, T: C.PNV, t: C.DW, H: C.PNV, h: C.DW, X: C.BRASS, W: C.S2, N: C.DW }) },
  clerk: { h: 29, body: 'suit', hat: 'none', hair: 'slick', color: C.PALEY, name: 'Pell',
           key: costume({ C: C.OX, c: C.PLUM, K: C.CRIM, T: C.ST0, t: C.NAV, A: C.INK, a: C.ST1, W: C.CREAM, N: C.INK,
                          S: C.SKL, s: C.SKM, L: C.CREAM }) },
  doorman: { h: 32, body: 'long', hat: 'doorman', hair: 'short', color: C.CORAL, name: 'Gus', wide: 1,
           key: costume({ C: C.OX, c: C.PLUM, K: C.CRIM, H: C.OX, h: C.PLUM, X: C.BRASS, T: C.INK, t: C.INK,
                          S: C.DSM, s: C.DSS, L: C.SKM, A: C.INK }) },
  bartender: { h: 30, body: 'vest', hat: 'none', hair: 'bald', color: C.GLOW, name: 'Lou', wide: 1,
           key: costume({ C: C.INK, c: C.BLK, K: C.ST0, W: C.CREAM, N: C.CRIM, T: C.ST0, t: C.NAV, A: C.CRS }) },
  salvi: { h: 30, body: 'suit', hat: 'fedora', hair: 'slick', color: C.CORAL, name: 'Mickey', wide: 1,
           key: costume({ C: C.ST0, c: C.INK, K: C.ST1, T: C.ST0, t: C.INK, H: C.INK, h: C.BLK, b: C.OX, W: C.CREAM, N: C.CRIM }) },
  goon:  { h: 32, body: 'suit', hat: 'fedora', hair: 'short', color: C.S2, name: 'Bruno', wide: 1,
           key: costume({ C: C.NAV, c: C.BLK, K: C.SLT, T: C.NAV, t: C.BLK, H: C.NAV, h: C.BLK, W: C.S2, N: C.NAV }) },
  teague: { h: 30, body: 'suit', hat: 'none', hair: 'short', color: C.BRASS, name: 'Teague',
           key: costume({ C: C.CREAM, c: C.CRS, K: C.WHITE, T: C.INK, t: C.BLK, W: C.WHITE, N: C.INK,
                          S: C.DSM, s: C.DSS, L: C.SKM, A: C.INK, a: C.HAIRD }) },
  mags:  { h: 27, body: 'dress', hat: 'none', hair: 'bun', color: C.LAV, name: 'Mags',
           key: costume({ C: C.VIO, c: C.VDK, K: C.LAV, T: C.VIO, t: C.VDK, A: C.CRS, a: C.S2, W: C.CREAM }) },
  vendor: { h: 29, body: 'suit', hat: 'cap', hair: 'short', color: C.PALEY, name: 'Sal',
           key: costume({ C: C.BRN, c: C.DBR, K: C.TAN, H: C.ST1, h: C.ST0, X: C.ST1, T: C.ST0, t: C.NAV }) },
  // the Blue Comet's band and customers (no dialogue; 'play' bobs on the beat)
  pianist: { h: 29, body: 'suit', hat: 'none', hair: 'slick', color: C.S2, name: 'Pianist',
           key: costume({ C: C.INK, c: C.BLK, K: C.ST0, T: C.INK, t: C.BLK, W: C.CREAM, N: C.INK, S: C.DSM, s: C.DSS, L: C.SKM }),
           poses: { play: [{ reach: 0.55 }, { reach: 0.7, bob: 1 }] } },
  bassist: { h: 31, body: 'suit', hat: 'none', hair: 'short', color: C.S2, name: 'Bassist',
           key: costume({ C: C.CREAM, c: C.CRS, K: C.WHITE, T: C.INK, t: C.BLK, W: C.WHITE, N: C.INK, A: C.HAIRD }),
           poses: { play: [{ reach: 0.4, arm: 0.3 }, { reach: 0.4, arm: -0.3, bob: 1 }] } },
  drummer: { h: 29, body: 'vest', hat: 'none', hair: 'short', color: C.S2, name: 'Drummer',
           key: costume({ C: C.INK, c: C.BLK, K: C.ST0, W: C.CREAM, N: C.INK, T: C.ST0, t: C.NAV, S: C.SKS, s: C.DSS, L: C.SKM }),
           poses: { play: [{ reach: 0.8, arm: 0.6 }, { reach: 0.3, arm: -0.6, bob: 1 }] } },
  patronF: { h: 27, body: 'dress', hat: 'none', hair: 'bob', color: C.CORAL, name: 'Customer',
           key: costume({ C: C.CRIM, c: C.OX, K: C.CORAL, T: C.CRIM, t: C.OX, A: C.INK, a: C.HAIRD }) },
  patronM: { h: 30, body: 'suit', hat: 'fedora', hair: 'short', color: C.S2, name: 'Customer',
           key: costume({ C: C.ST1, c: C.ST0, K: C.ST2, T: C.ST0, t: C.INK, H: C.BRN, h: C.DBR, W: C.CREAM, N: C.OX }) }
};
const CAST = {};
function buildCast() { for (const id in CAST_DEFS) CAST[id] = buildPerson(CAST_DEFS[id]); }
