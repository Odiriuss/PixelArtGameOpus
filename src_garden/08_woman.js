
// =================================================================== THE WOMAN (procedural sprite)
const SPR_W = 44, SPR_H = 40, AX = 16, AY = 36;          // anchor = shoe sole under the body centre
const spr = new Uint8Array(SPR_W * SPR_H);              // built facing right
const sprOut = new Uint8Array(SPR_W * SPR_H);           // flipped + rim-lit, screen oriented
const herSpout = { x: 0, y: 0 };                        // spout rose, sprite-local (facing right)
let herFace = 1, herX = STEP_X, herFeet = FEET;

function sp(x, y, c) {                                  // x,y relative to anchor
  const sx = x + AX, sy = y + AY;
  if (sx < 0 || sy < 0 || sx >= SPR_W || sy >= SPR_H) return;
  spr[sy * SPR_W + sx] = c;
}
function spLine(x0, y0, x1, y1, c0, c1, split) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) sp(Math.round(lerp(x0, x1, i / n)), Math.round(lerp(y0, y1, i / n)), i <= split ? c0 : c1);
}
// head bitmap facing right, columns -3..3, rows -28..-22 (level head)
// C cream  c cream-shadow  h hair-lit  H hair-dark  S skin-mid  s skin-shadow  K eye  k knot  n neck
const HEAD = [
  '.CCCC..',
  'CCCCCh.',
  'cCCChS.',
  'ccCHKSS',
  'kccHSS.',
  '...HSs.',
  '....n..'
];
const HEAD_COL = { C: C.CREAM, c: C.CREAMS, h: C.HAIRL, H: C.HAIRD, S: C.SKM, s: C.SKS, K: C.HAIRD, k: C.CREAM, n: C.SKS };
const HEAD_PX = [];     // [dx, dy, colour] precomputed
const SKIRT_B = [-2, -3, -4, -5, -5, -6, -6, -6, -7, -6], SKIRT_F = [1, 2, 3, 3, 4, 4, 5, 5, 5, 5];
for (let r = 0; r < HEAD.length; r++) for (let c = 0; c < 7; c++) {
  const ch = HEAD[r][c];
  if (ch !== '.') HEAD_PX.push([c - 3, r - 28, HEAD_COL[ch]]);
}

// chrome watering can, rasterised analytically in can space (origin = gripped handle)
function inCan(u, v) {
  // returns palette index or T
  const tf = u > 0.6;
  const ax = tf ? 3.1 : 4.3, by = 2.25 * (tf ? 1 : 1 - 0.32 * (0.6 - u) / 4.3);
  const du = (u - 0.6) / ax, dv = (v - 3.4) / by;
  if (du * du + dv * dv <= 1) return v < 2.0 ? C.S3 : v < 3.5 ? C.S2 : v < 4.7 ? C.S1 : C.S0;
  // tapered spout
  const sx0 = 3.0, sy0 = 4.4, sx1 = 9.2, sy1 = 0.9;
  const ex = sx1 - sx0, ey = sy1 - sy0, L2 = ex * ex + ey * ey;
  const s = clamp(((u - sx0) * ex + (v - sy0) * ey) / L2, 0, 1);
  const px = sx0 + ex * s - u, py = sy0 + ey * s - v;
  if (px * px + py * py <= Math.pow(lerp(0.78, 0.5, s), 2)) return py < 0 ? C.S1 : C.S2;
  // rose head
  const rx = u - 9.8, ry = v - 0.5;
  if (rx * rx + ry * ry <= 1.3) return rx + ry < 0 ? C.S3 : C.S1;
  // top handle loop
  const hx = u - 0.2, hy = v - 2.4, hr = Math.sqrt(hx * hx + hy * hy);
  if (v < 2.3 && hr >= 1.9 && hr <= 2.85) return C.S1;
  return T;
}
function drawCan(hx, hy, ang) {
  const ca = Math.cos(ang), sa = Math.sin(ang);
  for (let y = hy - 4; y <= hy + 11; y++) for (let x = hx - 6; x <= hx + 13; x++) {
    const dx = x - hx, dy = y - hy;                     // inverse rotate into can space
    const u = dx * ca + dy * sa, v = -dx * sa + dy * ca;
    const c = inCan(u, v);
    if (c !== T) sp(x, y, c);
  }
  // one warm sunset specular, one cool sky pixel
  sp(Math.round(hx + 2.2 * ca - 2.3 * sa), Math.round(hy + 2.2 * sa + 2.3 * ca), C.GLOW);
  sp(Math.round(hx - 1.6 * ca - 2.6 * sa), Math.round(hy - 1.6 * sa + 2.6 * ca), C.HAZE);
  herSpout.x = hx + 10.3 * ca - 0.4 * sa; herSpout.y = hy + 10.3 * sa + 0.4 * ca;
}

function buildHer(p) {
  spr.fill(T);
  const walking = p.walking, ph = p.phase;
  const swing = walking ? Math.sin(TAU * ph) : 0;
  const bob = walking && Math.abs(swing) > 0.7 ? 1 : 0;
  const headQ = p.head > 0.45 ? 1 : p.head < -0.45 ? -1 : 0;
  // ---- far arm (behind the body, swings opposite)
  if (walking) { const fx = Math.round(-1.5 * swing); sp(fx - 1, -15 + bob, C.SKS); sp(fx - 1, -16 + bob, C.SKS); }
  // ---- legs and low pumps
  for (let leg = 0; leg < 2; leg++) {
    const lp = ph + (leg ? 0.5 : 0);
    const o = walking ? 3.4 * Math.sin(TAU * lp) : (leg ? -1 : 1);
    const lift = walking && Math.cos(TAU * lp) > 0.45 ? 1 : 0;
    const fx = Math.round(o), col = leg ? C.SKS : C.SKM;
    for (let y = -7; y <= -2; y++) sp(Math.round(lerp(leg ? -0.5 : 0.5, fx, (y + 8) / 6)), y - lift, col);
    sp(fx, -1 - lift, col);
    sp(fx - 1, 0 - lift, C.INK); sp(fx, 0 - lift, leg ? C.INK : C.S1); sp(fx + 1, 0 - lift, C.INK); sp(fx + 1, -1 - lift, C.TRIM);   // patent glint
  }
  // ---- full swing skirt: bell silhouette from the belted waist (-15) to the tea-length hem (-6)
  const hemS = p.hem;
  for (let r = 0; r <= 9; r++) {
    const y = -15 + bob + r;
    const sh = r >= 5 ? Math.round(hemS * (r - 4) / 5) : 0;
    const xb = SKIRT_B[r] + sh, xf = SKIRT_F[r] + sh + (walking && r > 5 && swing > 0.3 ? 1 : 0);
    for (let x = xb; x <= xf; x++) {
      let c = C.CRIM;
      if (x <= xb + 1) c = C.OX;
      else if (r >= 3 && r < 9 && (x === -3 + (sh >> 1) || x === 1 + sh)) c = C.OX;              // soft folds
      if (r === 9) c = (x === xb || x === xf) ? C.OX : C.PLUM;                                    // hem shadow
      sp(x, y, c);
    }
    // short cream half-apron on the front
    if (r <= 5) for (let x = xf - (r < 2 ? 1 : 2); x <= xf; x++) sp(x, y, r === 5 ? C.CREAMS : (x === xf && r < 4 ? C.CREAM : (r > 2 ? C.CREAMS : C.CREAM)));
  }
  // apron ties at the back of the waist
  sp(-3, -15 + bob, C.CREAM); sp(-4, -14 + bob, C.CREAMS);
  // ---- belt, fitted bodice, shoulders
  for (let x = -2; x <= 1; x++) sp(x, -16 + bob, x === 1 ? C.S2 : C.PLUM);
  for (let y = -21; y <= -17; y++) {
    const xf = (y === -19 || y === -20) ? 2 : 1;
    for (let x = -2; x <= xf; x++) sp(x, y + bob, x === -2 ? C.OX : C.CRIM);
  }
  sp(-1, -22 + bob, C.CRIM); sp(0, -22 + bob, C.CRIM);
  // ---- head with tilt (front columns move with the gaze)
  for (let i = 0; i < HEAD_PX.length; i++) {
    const hp = HEAD_PX[i];
    const dy = hp[0] >= 1 ? -headQ : 0;                // face tips up or down
    const dx = headQ < 0 && hp[1] < -23 ? 1 : 0;        // bowed head leans forward
    sp(hp[0] + dx, hp[1] + bob + dy, hp[2]);
  }
  if (headQ > 0) sp(1, -22 + bob, C.SKS);            // throat shows when she looks up
  // scarf tails at the nape, fluttering; loose strands of auburn hair
  const s = p.scarf, ta = s > 0.6 ? 1 : 0, tb = s > 1.3 ? 1 : (s < -0.6 ? -1 : 0);
  sp(-4, -24 + bob, C.CREAMS); sp(-5 - ta, -23 + bob - ta, C.CREAM);                 // upper tail lifts in the breeze
  sp(-4, -23 + bob, C.CREAM); sp(-4 - (tb > 0 ? 1 : 0), -22 + bob, C.CREAMS);        // lower tail
  if (tb < 0) sp(-3, -22 + bob, C.CREAMS);
  const hs = p.hair;
  if (hs > 0.2) sp(-2, -22 + bob, C.HAIRL);
  if (hs > 0.9) sp(-3, -21 + bob, C.HAIRL);
  if (hs < -0.3 || hs > 1.1) sp(3 + (headQ < 0 ? 1 : 0), -27 + bob - (headQ > 0 ? 1 : 0), C.HAIRL);
  // ---- near arm + gloved hand + chrome can
  const arm = p.arm;
  const reach = Math.max(0, arm - 1);
  let hx = lerp(1, 5, Math.min(arm, 1)) + reach * 6, hy = lerp(-14, -20, Math.min(arm, 1)) - reach * 2;
  if (walking) hx += Math.round(0.9 * Math.sin(TAU * ph + Math.PI));
  hx = Math.round(hx); hy = Math.round(hy) + bob;
  const shx = 0, shy = -21 + bob;
  const ex = Math.round((shx + hx) / 2 - (arm > 0.5 ? 0 : 1)), ey = Math.round((shy + hy) / 2 + (arm > 0.5 ? 1 : 0));
  spLine(shx, shy, ex, ey, C.CRIM, C.SKM, 1);
  spLine(ex, ey, hx, hy, C.SKM, C.SKM, 99);
  const canAng = walking ? 0.1 * Math.sin(TAU * ph - 1.2) : (p.tilt * 0.62);
  drawCan(hx, hy, canAng);
  sp(hx, hy, C.CREAM); sp(hx - 1, hy, C.CREAMS); sp(hx, hy - 1, C.CREAM);  // glove over the grip
}
function sprEmpty(x, y) { return x < 0 || y < 0 || x >= SPR_W || y >= SPR_H || spr[y * SPR_W + x] === T; }
// flip to facing and add the 1px hot rim toward the sun's on-screen position
function finishHer(face, sunDx, sunDy) {
  const sdx = sunDx > 3 ? 1 : sunDx < -3 ? -1 : 0;
  for (let y = 0; y < SPR_H; y++) for (let x = 0; x < SPR_W; x++) {
    const sx = face > 0 ? x : SPR_W - 1 - x;
    sprOut[y * SPR_W + x] = spr[y * SPR_W + sx];
  }
  // rim pass on the oriented sprite (write into spr as scratch to avoid read-after-write)
  for (let i = 0; i < spr.length; i++) spr[i] = sprOut[i];
  for (let y = 0; y < SPR_H; y++) for (let x = 0; x < SPR_W; x++) {
    const i = y * SPR_W + x, c = spr[i];
    if (c === T || c === C.INK) continue;
    let rim = false;
    const ax = face > 0 ? AX : SPR_W - 1 - AX;
    if (sdx !== 0 && sprEmpty(x + sdx, y)) rim = true;
    else if (sunDy < 0 && sprEmpty(x, y - 1) && (sdx === 0 || (x - ax) * sdx >= 0)) rim = true;
    if (!rim || y >= AY - 6 || c === C.HAIRD) continue;          // legs, pumps and the eye stay in shadow
    sprOut[i] = (c === C.SKM || c === C.SKS) ? C.SKL : C.RIM;
  }
}
