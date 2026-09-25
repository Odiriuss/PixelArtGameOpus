// =================================================================== THE BLOCKS: HELPERS, THE NORTH ROW (CROWN HILL'S EDGE) AND THE WEST SIDE
// Facades that matter face +x (onto the avenue east of a block) and +y (onto the street south of it): those are the
// faces the camera sees. A building in the back corner of a block has its door on a back face (-x or -y), on the
// street behind it. Neon tags: see NEON_FX in the harbour file.
function F(base, len, h, o) { return facade(Object.assign({ base, len, h }, o || {})); }
function bld(x0, y0, x1, y1, h, fx, fy, extra) { return building(Object.assign({ x0, y0, x1, y1, h, fx, fy, seed: (x0 * 7 + y0) | 0 }, extra || {})); }
// a doormat and a wall lamp at a back door, so it can be found from the street
function backDoorMark(x, y) { layer(0); mat(MAT_OUTSIDE); cFloor(x - 0.5, y - 0.35, x + 0.5, y + 0.35, 0.152, (xx, yy) => frac((xx + yy) / 0.12) < 0.5 ? C.OX : C.PLUM); }
const APT = (seed, o) => Object.assign({ enter: 'apartment', name: 'APARTMENTS', hours: [7, 23], seed }, o || {});

function buildBlock00() {           // the 11th Precinct, its lot, a walk-up
  const P = bld(-15, -7, 1, 1, 14, F(MATL.stone, 8, 14, { lit: 0.5, seed: 101, pier: C.STS }),
    F(MATL.stone, 16, 14, { lit: 0.55, seed: 102, pier: C.STS, shops: [{ u0: 5.2, u1: 10.8, kind: 'lobby', text: '11TH PRECINCT', tc: C.CREAM, bg: C.PNV }] }),
    { enter: 'precinct', name: '11TH PRECINCT', doors: [{ face: 'y', u: 8, w: 1.8, kind: 'grand' }], zone: 'precinct' });
  for (const x of [-9.4, -4.6]) {                                                              // the green lamps either side of the steps
    layer(0); mat(MAT_OUTSIDE); cCyl(x, 1.6, 0.06, 0.15, 2.6, () => C.INK); mat(MAT_OUTSIDE | MAT_EMIT);
    cSphere(x, 1.6, 2.8, 0.2, (nx, ny) => { curExt = EXT_GLOBE; return ny < -0.3 ? C.GRNL : C.G2; }); mat(MAT_OUTSIDE);
    registerLight({ x, y: 1.6, z: 2.8, r: 4.5, k: 1.4, map: GRNW }, 'glow'); CITY_LIGHTS.push(LIGHTS[LIGHTS.length - 1]);
  }
  // the police lot: a fence round the back, the patrol cars park here
  layer(0); mat(MAT_OUTSIDE);
  cFloor(-7, -15, 1, -7, 0.152, (x, y) => (frac((x + 7) / 2.7) < 0.04 && y > -14) ? C.CRS : T);
  const fence = (u, z) => z > 1.9 ? C.S1 : (frac(u / 2.5) < 0.04 ? C.S1 : ((Math.floor(u * 10) + Math.floor(z * 10)) & 1) && ((Math.floor(u * 10) ^ Math.floor(z * 10)) & 2) ? C.S0 : T);
  cWallX(1, -15, -10, 0.15, 2.0, (y, z) => fence(y, z)); solid(0.8, -15, 1, -10, 2, 'fence');
  bld(-15, -15, -7, -7, 12, null, null, APT(103, { doors: [{ face: '-x', u: 4 }] }));
  backDoorMark(-15.6, -11);
}
function buildBlock10() {           // Lucky's Bar and its back room, the drugstore, a laundry, a walk-up
  bld(27, -7, 35, 1, 10, F(MATL.brickD, 8, 10, { lit: 0.4, seed: 111, shops: [{ u0: 0.4, u1: 3.4, kind: 'dark' }] }),
    F(MATL.brickD, 8, 10, { lit: 0.4, seed: 112, shops: [{ u0: 0.3, u1: 5.2, kind: 'diner' }] }),
    { enter: 'bar', name: "LUCKY'S BAR", doors: [{ face: 'y', u: 6.4 }, { face: 'x', u: 5.8, locked: true, lock: 2 }], hours: [15, 3], zone: 'lucky' });
  neonTextY(1, 27, 0.5, 3.3, "LUCKY'S", C.CORAL, 21, 1.1);
  addLight({ x: 30, y: 2.4, z: 3, r: 4.5, k: 1.2, tag: 21, map: REDW });
  bld(19, -7, 27, 1, 11, null, F(MATL.stucco, 8, 11, { lit: 0.35, seed: 113, shops: [{ u0: 0.3, u1: 4.8, kind: 'shop' }] }),
    { enter: 'drugstore', name: 'CORNER DRUGS', doors: [{ face: 'y', u: 6.2, kind: 'glass' }], hours: [7, 22] });
  neonTextY(1, 19, 0.6, 3.25, 'DRUGS', C.CYAN, 2, 1.2);
  addLight({ x: 21.5, y: 2.5, z: 3, r: 4.5, k: 1.2, tag: 2, map: CYNW });
  awningY(1, 19.3, 23.9, 2.6, C.CYD, C.CREAM);
  bld(27, -15, 35, -7, 13, F(MATL.brick, 8, 13, { lit: 0.35, seed: 114, shops: [{ u0: 0.3, u1: 7.7, kind: 'shop', text: 'LAUNDRY', tc: C.WL, bg: C.DW }] }), null,
    { enter: 'laundry', name: 'STAR LAUNDRY', doors: [{ face: 'x', u: 5.5, kind: 'glass' }], hours: [7, 20] });
  bld(19, -15, 27, -7, 15, null, null, APT(115, { doors: [{ face: '-y', u: 4 }] }));
  backDoorMark(23, -15.6);
}
function buildBlock20() {           // the Herald, the Palomar dance hall, a walk-up
  const H = bld(53, -7, 69, 1, 19, F(MATL.stone, 8, 19, { lit: 0.6, seed: 121, pier: C.STS }),
    F(MATL.stone, 16, 19, { lit: 0.6, seed: 122, pier: C.STS, shops: [{ u0: 0.4, u1: 5.8, kind: 'lobby' }, { u0: 10.2, u1: 15.6, kind: 'lobby' }], wp: 1.8 }),
    { enter: 'newspaper', name: 'THE HERALD', doors: [{ face: 'y', u: 8, w: 1.8, kind: 'grand' }], hours: [0, 24] });
  neonTextY(1, 53, 6.1, 3.5, 'HERALD', C.CREAM, 0, 1.0);
  // the Herald's rooftop sign on its frame
  dlBid = H.id; layer(1);
  for (let x = 55; x <= 67; x += 3) cBoxC(x - 0.06, -3.2, 19, x + 0.06, -3.1, 21.8, C.S0, C.INK, C.INK);
  tag(15); mat(MAT_OUTSIDE);
  cWallY(-3.0, 54.5, 67.5, 19.4, 22, (x, z) => wallTextHit('THE HERALD', 0.6, 21.9, x - 54.5, z, 2.8) ? E(C.RED) : T);
  tag(0); layer(0); dlBid = 0;
  addLight({ x: 61, y: 0, z: 20, r: 10, k: 1.0, tag: 15, map: REDW });
  bld(61, -15, 69, -7, 9, F(MATL.stucco, 8, 9, { lit: 0.5, seed: 123, shops: [{ u0: 0.3, u1: 7.7, kind: 'lobby' }] }), null,
    { enter: 'dancehall', name: 'PALOMAR BALLROOM', doors: [{ face: 'x', u: 4, w: 1.6, kind: 'glass' }], hours: [19, 2] });
  neonTextX(69, -7, 0.6, 7.6, 'DANCING', C.LAV, 23, 1.1);
  addLight({ x: 70.5, y: -11, z: 7, r: 5.5, k: 1.1, tag: 23 });
  bld(53, -15, 61, -7, 16, null, null, APT(124, { doors: [{ face: '-x', u: 4 }] }));
  backDoorMark(52.4, -11);
}
function buildBlock30() {           // the Atomic Diner under its billboard, Silverman the tailor, a walk-up, the Cola depot
  bld(95, -7, 103, 1, 7, F(MATL.tile, 8, 7, { lit: 0.6, seed: 131, gh: 3.4, shops: [{ u0: 0.3, u1: 7.7, kind: 'diner' }] }),
    F(MATL.tile, 8, 7, { lit: 0.6, seed: 132, gh: 3.4, shops: [{ u0: 0.3, u1: 4.6, kind: 'diner' }] }),
    { enter: 'diner', name: 'ATOMIC DINER', doors: [{ face: 'y', u: 6.2, kind: 'glass' }], hours: [6, 2] });
  neonTextY(1, 95, 0.4, 3.3, 'ATOMIC DINER', C.PALEY, 27, 0.8);
  addLight({ x: 99, y: 2.4, z: 3, r: 5, k: 1.3, tag: 27 });
  // the Atomic Cola billboard on the roof
  layer(1);
  cBoxC(96, -3.2, 7, 96.2, -3, 8.2, C.S0, C.INK, C.INK); cBoxC(102, -3.2, 7, 102.2, -3, 8.2, C.S0, C.INK, C.INK);
  cWallY(-2.9, 95, 103.4, 8.2, 11.6, (x, z) => {
    if (x < 95.1 || x > 103.3 || z < 8.3 || z > 11.5) return C.CREAM;
    if (wallTextHit('ATOMIC', 0.45, 11.3, x - 95, z, 1.4)) return C.CRIM;
    if (wallTextHit('COLA', 1.6, 10.2, x - 95, z, 1.4)) return C.CRIM;
    const d = Math.hypot(x - 101.8, z - 9.3); return d < 0.8 ? (Math.abs(d - 0.5) < 0.07 ? C.CRIM : C.CREAM) : C.PALEY;
  });
  layer(0);
  addLight({ x: 99, y: -1, z: 12.5, r: 5, k: 1.4 });
  bld(87, -7, 95, 1, 10, null, F(MATL.stone, 8, 10, { lit: 0.3, seed: 133, shops: [{ u0: 0.3, u1: 5.0, kind: 'shop', text: 'SILVERMAN', tc: C.PALEY, bg: C.PLUM }] }),
    { enter: 'tailor', name: 'SILVERMAN TAILORING', doors: [{ face: 'y', u: 6.4, kind: 'glass' }], hours: [9, 18] });
  awningY(1, 87.3, 92.3, 2.6, C.PLUM, C.CREAM);
  bld(95, -15, 103, -7, 14, F(MATL.brick, 8, 14, { lit: 0.4, seed: 134 }), null, APT(135, { doors: [{ face: 'x', u: 4 }] }));
  bld(87, -15, 95, -7, 7, null, null, { enter: 'warehouse', name: 'COLA DEPOT', doors: [{ face: '-y', u: 4, w: 2.2, kind: 'steel' }], hours: [7, 17], seed: 136 });
  backDoorMark(91, -15.6);
}
function buildBlock01() {           // the west side: Billiards, the Astor Lounge, tenements
  bld(-7, 27, 1, 35, 9, F(MATL.brickD, 8, 9, { lit: 0.3, seed: 141, shops: [{ u0: 0.3, u1: 7.7, kind: 'dark' }] }),
    F(MATL.brickD, 8, 9, { lit: 0.3, seed: 142, shops: [{ u0: 0.3, u1: 5.0, kind: 'shop' }] }),
    { enter: 'billiards', name: 'CUE BALL BILLIARDS', doors: [{ face: 'y', u: 6.3 }], hours: [12, 3] });
  neonTextX(1, 35, 0.8, 3.3, 'BILLIARDS', C.GRNL, 18, 1.1);
  addLight({ x: 2.4, y: 31, z: 3, r: 4.5, k: 1.2, tag: 18, map: GRNW });
  bld(-7, 19, 1, 27, 12, F(MATL.stucco, 8, 12, { lit: 0.4, seed: 143, shops: [{ u0: 0.3, u1: 7.7, kind: 'lobby' }] }), null,
    { enter: 'bar', name: 'ASTOR LOUNGE', doors: [{ face: 'x', u: 4, w: 1.4, kind: 'glass' }], hours: [17, 3] });
  bladeSign('x', 1, 21.5, 4.6, 'ASTOR', C.NBL, 24);
  addLight({ x: 2.5, y: 21.5, z: 6, r: 6, k: 1.1, tag: 24, map: BLUW });
  bld(-15, 27, -7, 35, 14, null, F(MATL.brick, 8, 14, { lit: 0.35, seed: 144 }), APT(145, { doors: [{ face: 'y', u: 4 }] }));
  fireEscapeY(35, -14, -11, 14);
  bld(-15, 19, -7, 27, 16, null, null, APT(146, { doors: [{ face: '-x', u: 4 }] }));
  backDoorMark(-15.6, 23);
}
function buildBlock02() {           // the west side, south: Keller the gunsmith, a hardware store, tenements
  bld(-7, 61, 1, 69, 8, F(MATL.brick, 8, 8, { lit: 0.3, seed: 151, shops: [{ u0: 0.3, u1: 7.7, kind: 'shop', text: 'HARDWARE', tc: C.CREAM, bg: C.DBR }] }),
    F(MATL.brick, 8, 8, { lit: 0.3, seed: 152, shops: [{ u0: 0.3, u1: 5.0, kind: 'shop' }] }),
    { enter: 'hardware', name: 'BAUER HARDWARE', doors: [{ face: 'y', u: 6.3, kind: 'glass' }], hours: [8, 18] });
  bld(-7, 53, 1, 61, 10, F(MATL.stone, 8, 10, { lit: 0.2, seed: 153, shops: [{ u0: 0.3, u1: 7.7, kind: 'shop', text: 'KELLER GUNS', tc: C.BRASS, bg: C.INK }] }), null,
    { enter: 'gunsmith', name: 'KELLER & SON GUNSMITHS', doors: [{ face: 'x', u: 2.0, kind: 'wood' }], hours: [9, 17] });
  bld(-15, 61, -7, 69, 13, null, F(MATL.brickD, 8, 13, { lit: 0.3, seed: 154 }), APT(155, { doors: [{ face: 'y', u: 4 }] }));
  fireEscapeY(69, -13, -10, 13);
  bld(-15, 53, -7, 61, 11, null, null, APT(156, { doors: [{ face: '-x', u: 4 }], name: 'ROOMING HOUSE' }));
  backDoorMark(-15.6, 57);
}
