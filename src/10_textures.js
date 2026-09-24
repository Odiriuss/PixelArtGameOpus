
// =================================================================== SURFACE TEXTURES (shader factories)
// floorboards running along x (axis 0) or y (axis 1)
function planks(axis, c0, c1, seam, seed, w) {
  const bw = w || 0.3;
  return (x, y, px, py) => {
    const u = axis ? x : y, v = axis ? y : x;
    const b = Math.floor(u / bw), f = u / bw - b;
    const len = 1.1 + hash(b, seed) * 1.4, off = hash(b, seed + 1) * len, seg = Math.floor((v + off) / len);
    if (f < 0.09) return seam;
    if (frac((v + off) / len) < 0.02) return seam;
    const tone = hash3(b, seg, seed + 2) > 0.8;
    const streak = vnoise(v * 4, b * 3.7, seed) > 0.84 && f > 0.3 && f < 0.7;
    return (tone !== streak) ? c1 : c0;
  };
}
// wall: wallpaper above a chair rail, wainscot below. u runs along the wall.
function papered(top, stripe, rail, wain, wainLine, railZ, period) {
  const P = period || 0.3;
  return (u, z, px, py) => {
    if (z < railZ - 0.06) {
      const pu = frac(u / 0.9);
      if (z < 0.1) return C.INK;
      if (pu < 0.04 || z > railZ - 0.14) return wainLine;
      return wain;
    }
    if (z < railZ + 0.02) return rail;
    const s = frac(u / P);
    if (s < 0.12) return stripe;
    if (s > 0.45 && s < 0.55 && ((Math.floor(z / 0.12) + Math.floor(u / P)) & 1)) return stripe;
    return top;
  };
}
// brick courses (exteriors). u along the wall
function bricks(c0, c1, mortar, seed) {
  return (u, z, px, py) => {
    const row = Math.floor(z / 0.1), off = (row & 1) * 0.12;
    const b = Math.floor((u + off) / 0.24);
    if (frac(z / 0.1) < 0.2 || frac((u + off) / 0.24) < 0.1) return mortar;
    return hash3(b, row, seed) + bay(px, py) * 0.3 > 0.78 ? c1 : c0;
  };
}
// checker tiles (floor)
function checker(c0, c1, size, grout) {
  return (x, y, px, py) => {
    const fx = frac(x / size), fy = frac(y / size);
    if (grout !== undefined && (fx < 0.05 || fy < 0.05)) return grout;
    return ((Math.floor(x / size) + Math.floor(y / size)) & 1) ? c1 : c0;
  };
}
// patterned carpet with a border
function carpet(x0, y0, x1, y1, field, fieldDot, border, borderLine) {
  return (x, y, px, py) => {
    const bx = Math.min(x - x0, x1 - x), by = Math.min(y - y0, y1 - y), e = Math.min(bx, by);
    if (e < 0.08) return borderLine;
    if (e < 0.22) return (e > 0.13 && e < 0.16) ? borderLine : border;
    const u = frac(x / 0.4), v = frac(y / 0.4);
    if (Math.abs(u - 0.5) + Math.abs(v - 0.5) < 0.16) return fieldDot;
    return field;
  };
}
// wet asphalt / stone with dithered noise
function asphalt(c0, c1, seed) {
  return (x, y, px, py) => vnoise(x * 3, y * 3, seed) * 0.7 + hash(px, py) * 0.3 > 0.62 ? c1 : c0;
}
function flagstones(c0, c1, seam, seed, size) {
  const s = size || 0.6;
  return (x, y, px, py) => {
    const row = Math.floor(y / s), off = (row & 1) * s * 0.5, col = Math.floor((x + off) / s);
    if (frac(y / s) < 0.07 || frac((x + off) / s) < 0.05) return seam;
    return hash3(col, row, seed) + bay(px, py) * 0.25 > 0.75 ? c1 : c0;
  };
}
// cutaway room shell: two back walls with thickness caps and a floor slab edge
function roomShell(w, d, h, floorSh, wallXSh, wallYSh, opts) {
  const o = opts || {}, th = o.thick || 0.15, cap = o.cap === undefined ? C.INK : o.cap;
  rFloor(0, 0, w, d, 0, floorSh);
  if (wallXSh) rWallX(0, 0, d, 0, h, wallXSh);          // left back wall (x = 0)
  if (wallYSh) rWallY(0, 0, w, 0, h, wallYSh);          // right back wall (y = 0)
  // wall tops
  if (wallXSh) rFloor(-th, 0, 0, d, h, flat(cap));
  if (wallYSh) rFloor(-th, -th, w, 0, h, flat(cap));
  if (wallXSh) rWallY(d, -th, 0, -0.3, h, flat(C.BLK));
  if (wallYSh) rWallX(w, -th, 0, -0.3, h, flat(C.BLK));
  // floor slab edge
  rWallX(w, 0, d, -0.3, 0, flat(C.BLK));
  rWallY(d, 0, w, -0.3, 0, flat(C.BLK));
}
// a door leaf with frame in a wall plane. axis 'x' (wall x = const) or 'y'
function doorShader(a0, a1, z1, leaf, leafDark, frame, glass, glassTop) {
  return (u, z, px, py) => {
    const fu = u - a0, W = a1 - a0;
    if (fu < 0.07 || fu > W - 0.07 || z > z1 - 0.07) return frame;
    if (glass !== undefined && z > (glassTop || 1.25) && z < z1 - 0.18 && fu > 0.18 && fu < W - 0.18) return glass;
    const pz = z < 1.0 ? (z > 0.2 && z < 0.9 && fu > 0.18 && fu < W - 0.18 ? 1 : 0) : 0;
    if (pz && (Math.abs(fu - 0.18) < 0.03 || Math.abs(z - 0.2) < 0.03)) return leafDark;
    return leaf;
  };
}
// frosted / rain-glass window seen from inside: returns glass colour for the outside
function nightGlass(base, glow, seed) {
  return (u, z, px, py) => vnoise(u * 2, z * 3, seed) + bay(px, py) * 0.3 > 0.85 ? glow : base;
}
// venetian blinds seen from inside, backlit: dark slats, bright gaps
function blinds(slat, gap, period, duty) {
  return (u, z, px, py) => frac(z / period) < duty ? slat : gap;
}
