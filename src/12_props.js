
// =================================================================== SHARED PROP HELPERS (clocks, live lines)
// clock hands as a shader test: (du, dz) from the dial centre, du to the viewer's right. Returns 1 on a hand.
function onHands(du, dz, r, h, m) {
  const am = m / 60 * TAU, ah = ((h % 12) + m / 60) / 12 * TAU;
  for (const [a, len, wd] of [[am, r * 0.8, 0.034], [ah, r * 0.5, 0.045]]) {
    const ux = Math.sin(a), uz = Math.cos(a), t = du * ux + dz * uz, perp = Math.abs(du * uz - dz * ux);
    if (t > -0.02 && t < len && perp < wd) return 1;
  }
  return 0;
}
// dial shader: face, rim, ticks, optional fixed hands (h < 0 = no hands, drawn live instead)
function dialShade(du, dz, r, h, m, face, rim, ink) {
  const d = Math.hypot(du, dz);
  if (d > r) return T;
  if (d > r - 0.045) return rim;
  if (d < 0.03) return ink;
  if (h >= 0 && onHands(du, dz, r, h, m)) return ink;
  const a = Math.atan2(du, dz) / TAU * 12;
  if (d > r - 0.1 && Math.abs(a - Math.round(a)) < 0.12 && Math.round(a) % 3 === 0) return ink;
  return face;
}
// wall clocks baked into a wall plane (y = yw facing +y, or x = xw facing +x)
function wallClockY(yw, xc, zc, r, h, m, face, rim, ink) {
  rWallY(yw, xc - r, xc + r, zc - r, zc + r, (x, z) => dialShade(x - xc, z - zc, r, h, m, face, rim, ink));
}
function wallClockX(xw, yc, zc, r, h, m, face, rim, ink) {
  rWallX(xw, yc - r, yc + r, zc - r, zc + r, (y, z) => dialShade(yc - y, z - zc, r, h, m, face, rim, ink));
}
// live (per-frame) world line with a depth test
function line3Live(xa, ya, za, xb, yb, zb, c, bias) {
  const sxa = toScreenX(xa, ya), sya = toScreenY(xa, ya, za), sxb = toScreenX(xb, yb), syb = toScreenY(xb, yb, zb);
  const n = Math.max(1, Math.abs(sxb - sxa), Math.abs(syb - sya));
  for (let k = 0; k <= n; k++) {
    const t = k / n;
    dpset(Math.round(lerp(sxa, sxb, t)), Math.round(lerp(sya, syb, t)), c, lerp(xa + ya, xb + yb, t) + (bias || 0.03));
  }
}
// live clock hands on a y-wall dial
function handsLiveY(yw, xc, zc, r, h, m, c) {
  const am = m / 60 * TAU, ah = ((h % 12) + m / 60) / 12 * TAU;
  line3Live(xc, yw, zc, xc + Math.sin(am) * r * 0.8, yw, zc + Math.cos(am) * r * 0.8, c);
  line3Live(xc, yw, zc, xc + Math.sin(ah) * r * 0.5, yw, zc + Math.cos(ah) * r * 0.5, c);
}
// text laid along a wall at 1 texel per 1/16 m (u = distance along the wall, z height). Returns 1 on ink.
function glyphBit(ch, c, r) {
  const k = ch.charCodeAt(0), bits = glyphBits[k];
  if (!bits || c < 0 || r < 0 || r >= FONT_H || c >= glyphW[k]) return 0;
  return bits[r * glyphW[k] + c];
}
function wallTextHit(str, u0, zTop, u, z, sc) {
  const s = sc || 1, col = Math.floor((u - u0) * 16 / s), row = Math.floor((zTop - z) * 16 / s);
  if (col < 0 || row < 0 || row >= FONT_H) return 0;
  let x = 0;
  for (let i = 0; i < str.length; i++) {
    const w = charW(str.charCodeAt(i));
    if (col < x + w) return glyphBit(str[i], col - x, row);
    x += w + 1;
  }
  return 0;
}
// potted palm (lobbies, clubs)
function palm(x, y, s) {
  const k = s || 1;
  rCyl(x, y, 0.2 * k, 0, 0.45 * k, (a) => a < -0.3 ? C.BRASS : a > 0.4 ? C.DBR : C.AMB, () => C.INK);
  rStamp(x, y, 0.45 * k, [
    '....g.......g....', '..gg.g....gG.gg..', '.g...gg..Gg....g.', 'g.....gGGg......g', '....ggGGGGgg.....',
    '..gG..gGGg..Gg...', '.g...g.GG.g...g..', 'g...g..GG..g...g.', '......gGGg.......', '.......GG........', '.......GG........'
  ], { g: C.G1, G: C.G2 });
}
