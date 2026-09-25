// =================================================================== THE BLOCKS: FERRIER STREET'S NORTH SIDE (DOWNTOWN)
function buildBlock11() {           // the Hotel Mirador, 1140 Ferrier (Frank's office over Molnar & Son), a barber, an office tower
  bld(27, 27, 35, 35, 24,
    F(MATL.stone, 8, 24, { lit: 0.38, seed: 1, pier: C.STS, shops: [{ u0: 0.3, u1: 7.7, kind: 'lobby' }] }),
    F(MATL.stone, 8, 24, { lit: 0.38, seed: 2, pier: C.STS, shops: [{ u0: 0.3, u1: 2.6, kind: 'lobby' }, { u0: 5.4, u1: 7.7, kind: 'lobby' }] }),
    { enter: 'hotel', name: 'HOTEL MIRADOR', levels: [0, 6], doors: [{ face: 'y', u: 4, w: 1.9, kind: 'grand' }, { face: 'x', u: 4, w: 1.6, kind: 'grand' }], key: 'mirador' });
  bladeSign('x', 35, 29.2, 5.2, 'MIRADOR', C.GLOW, 1);
  layer(1); cBox(29, 35, 2.9, 33, 37.2, 3.4, flat(C.S1), flat(C.S0), (x, z) => wallTextHit('MIRADOR', 30.1 - 29, 3.36, x - 29, z) ? E(C.GLOW) : C.INK); layer(0);
  addLight({ x: 31, y: 36.4, z: 2.8, r: 5, k: 1.6 });
  addLight({ x: 36, y: 29.5, z: 7, r: 7, k: 1.1, tag: 1 });
  bld(27, 19, 35, 27, 11, F(MATL.brick, 8, 11, { lit: 0.3, seed: 3, shops: [{ u0: 0.3, u1: 3.9, kind: 'shop', text: 'BARBER', tc: C.CREAM, bg: C.OX }, { u0: 4.1, u1: 7.7, kind: 'dark' }] }), null,
    { enter: 'barber', name: 'TONY THE BARBER', doors: [{ face: 'x', u: 5.9, kind: 'glass' }], hours: [8, 18] });
  // barber's pole
  layer(0); mat(MAT_OUTSIDE); cCyl(35.3, 26.2, 0.1, 1.2, 2.2, (a, z) => frac(z * 3 + a * 0.5) < 0.5 ? C.RED : C.CREAM, () => C.S2);
  // 1140 Ferrier: Molnar & Son, Tailors, shut a month; a street door to the stairs; Frank's office on the second floor
  bld(19, 27, 27, 35, 11, null, F(MATL.stucco, 8, 11, { lit: 0.25, seed: 4, shops: [{ u0: 0.3, u1: 5.2, kind: 'shut', text: 'MOLNAR & SON', tc: C.BRASS }] }),
    { enter: 'office1140', name: '1140 FERRIER STREET', levels: [0, 1], doors: [{ face: 'y', u: 6.6, w: 1.0 }], key: 'office' });
  cStamp(25.6, 35.02, 2.5, ['yyyy', 'y..y', 'yyyy'], { y: C.BRASS });                           // the brass number plate
  bld(19, 19, 27, 27, 30, F(MATL.steel, 8, 30, { lit: 0.45, seed: 5, wp: 1.6, ww: 1.1 }), F(MATL.steel, 8, 30, { lit: 0.45, seed: 6, wp: 1.6, ww: 1.1 }),
    { enter: 'office', name: 'MERIDIAN TRUST TOWER', doors: [{ face: '-x', u: 4, w: 1.6, kind: 'glass' }, { face: '-y', u: 4, w: 1.6, kind: 'glass' }], hours: [7, 19] });
  backDoorMark(18.4, 23); backDoorMark(23, 18.4);
  layer(1); mat(MAT_OUTSIDE | MAT_EMIT); tag(20); cSphere(23, 23, 31.2, 0.25, () => C.RED); tag(0); mat(MAT_OUTSIDE); layer(0);
  roofBox(20, 20, 23, 22, 30, 1.2);
}
function buildBlock21() {           // the Orpheum, Chop Suey, Radio, Hats, a walk-up with a water tower
  bld(59, 27, 69, 35, 13,
    F(MATL.stucco, 8, 13, { lit: 0.15, seed: 7, wp: 2.6, shops: [{ u0: 0.3, u1: 7.7, kind: 'shop', text: 'TICKETS', tc: C.GLOW }] }),
    F(MATL.stucco, 10, 13, { lit: 0.15, seed: 8, wp: 2.6, shops: [{ u0: 0.3, u1: 3.4, kind: 'lobby' }, { u0: 6.6, u1: 9.7, kind: 'lobby' }] }),
    { enter: 'cinema', name: 'THE ORPHEUM', doors: [{ face: 'y', u: 5, w: 2.4, kind: 'glass' }], hours: [13, 1] });
  bladeSign('y', 68.2, 35, 4.6, 'ORPHEUM', C.RED, 3, C.CREAM);
  addLight({ x: 68, y: 37, z: 6, r: 7.5, k: 1.2, tag: 3, map: REDW });
  // marquee: text on the front, chasing bulbs top and bottom (tags 5 / 6 alternate)
  layer(1); mat(MAT_OUTSIDE);
  cBox(59.5, 35, 3.1, 67.5, 37.4, 4.5, flat(C.S1), (y, z) => z > 4.3 || z < 3.3 ? C.INK : C.CREAM, (x, z) => {
    if (z > 4.32 || z < 3.28) return C.INK;
    if (z > 4.12 || z < 3.48) return C.S0;
    return wallTextHit('SWEET SMELL OF SUCCESS', 0.1, 4.08, x - 59.5, z, 1) ? C.INK : C.CREAM;
  });
  for (const tg of [5, 6]) { tag(tg); cWallY(37.405, 59.5, 67.5, 3.28, 4.32, (x, z) => (z > 4.12 || z < 3.48) && Math.abs(frac((x - 59.5) / 0.3) - 0.5) < 0.2 && ((Math.floor((x - 59.5) / 0.3) & 1) === tg - 5) && Math.abs(frac(z / 0.2) - 0.5) < 0.3 ? E(C.HOT) : T); }
  tag(0); layer(0);
  addLight({ x: 63.5, y: 38.2, z: 3.2, r: 6, k: 1.8 });
  bld(61, 23, 69, 27, 9, F(MATL.brick, 4, 9, { lit: 0.3, seed: 9, shops: [{ u0: 0.3, u1: 3.7, kind: 'shop', text: 'RADIO', tc: C.CYAN }] }), null,
    { enter: 'radio', name: 'SPARKY RADIO', doors: [{ face: 'x', u: 2.8, kind: 'glass' }], hours: [9, 19] });
  bld(61, 19, 69, 23, 9, F(MATL.brick, 4, 9, { lit: 0.3, seed: 90, shops: [{ u0: 0.3, u1: 3.7, kind: 'shop', text: 'HATS', tc: C.PALEY, bg: C.PLUM }] }), null,
    { enter: 'hats', name: 'LOUIE HATS', doors: [{ face: 'x', u: 1.2, kind: 'glass' }], hours: [9, 18] });
  bld(53, 27, 59, 35, 8, null, F(MATL.brickD, 6, 8, { lit: 0.4, seed: 10, shops: [{ u0: 0.3, u1: 4.2, kind: 'diner' }] }),
    { enter: 'diner', name: 'CHOP SUEY', doors: [{ face: 'y', u: 5.0, kind: 'glass' }], hours: [11, 3] });
  neonTextY(35, 53, 0.35, 3.3, 'CHOP SUEY', C.RED, 7, 1.0);
  addLight({ x: 56, y: 36.3, z: 3, r: 4.5, k: 1.2, tag: 7, map: REDW });
  bld(53, 19, 61, 27, 18, F(MATL.brickD, 8, 18, { lit: 0.42, seed: 11 }), F(MATL.brickD, 8, 18, { lit: 0.42, seed: 12 }), APT(160, { doors: [{ face: '-y', u: 4 }] }));
  backDoorMark(57, 18.4);
  waterTower(57, 22.5, 18);
}
function buildBlock31() {           // offices on the alley, the garage, the bank, the Royale
  bld(87, 19, 93, 27, 16, F(MATL.stone, 8, 16, { lit: 0.25, seed: 13 }), F(MATL.stone, 6, 16, { lit: 0.25, seed: 14 }),
    { enter: 'office', name: 'HALLORAN BUILDING', doors: [{ face: 'x', u: 4, kind: 'wood' }], hours: [8, 18] });
  bld(87, 27, 93, 35, 9, F(MATL.brick, 8, 9, { lit: 0.2, seed: 15, shops: [{ u0: 0.3, u1: 7.7, kind: 'garage' }] }),
    F(MATL.brick, 6, 9, { lit: 0.2, seed: 16, shops: [{ u0: 0.3, u1: 3.8, kind: 'garage', text: 'GARAGE', tc: C.PALEY }] }),
    { enter: 'garage', name: 'DOYLE GARAGE', doors: [{ face: 'y', u: 4.9, kind: 'steel' }], hours: [7, 19] });
  bld(97, 27, 103, 35, 12, F(MATL.stone, 8, 12, { lit: 0.1, seed: 17, pier: C.CREAM, wp: 1.6, shops: [{ u0: 0.3, u1: 7.7, kind: 'lobby' }] }),
    F(MATL.stone, 6, 12, { lit: 0.1, seed: 18, pier: C.CREAM, wp: 1.5, shops: [{ u0: 0.2, u1: 5.8, kind: 'lobby', text: 'MERIDIAN BANK', tc: C.BRASS }] }),
    { enter: 'bank', name: 'MERIDIAN SAVINGS BANK', doors: [{ face: 'y', u: 3, w: 1.6, kind: 'grand' }], hours: [9, 15], zone: 'bank' });
  bld(97, 19, 103, 27, 20, F(MATL.brick, 8, 20, { lit: 0.4, seed: 19, shops: [{ u0: 0.3, u1: 7.7, kind: 'lobby' }] }), F(MATL.brick, 6, 20, { lit: 0.4, seed: 20 }),
    { enter: 'flophouse', name: 'HOTEL ROYALE', doors: [{ face: 'x', u: 4, w: 1.4, kind: 'glass' }] });
  bladeSign('x', 103, 23, 4.8, 'ROYALE', C.LAV, 13);
  addLight({ x: 104.5, y: 23, z: 6.5, r: 6.5, k: 1.2, tag: 13 });
  roofBox(98, 20, 101, 22, 20, 1.5);
}
