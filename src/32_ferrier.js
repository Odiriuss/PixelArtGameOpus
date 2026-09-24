
// =================================================================== ROOM: FERRIER STREET (7:30 a.m., rain)
// x 0..15, y 0..10. Left facade x = 0: 1140 Ferrier (Frank's building). Right facade y = 0: the Hotel Mirador.
// Mirador sidewalk y 0..2.2, Frank's sidewalk x 0..2.2, street, tram track at y 4.8 / 6.2, near kerb y 8.8.
const FER_BRICK = bricks(C.HAIRD, C.HAIRL, C.INK, 5);
const FER_STONE = (x, z, px, py) => {
  if (frac(z / 0.5) < 0.05 || frac(x / 1.0 + (Math.floor(z / 0.5) & 1) * 0.5) < 0.03) return C.STS;
  return hash3(Math.floor(x), Math.floor(z / 0.5), 3) > 0.85 ? C.STS : C.CRS;
};
defRoom({
  id: 'ferrier', name: 'Ferrier Street', bounds: [0, 0, 15, 10], zmax: 7.2, start: [1.2, 6.2, 'SE'], bg: C.NAV, camBias: -18,
  ambient: -0.35,
  dark: (x, y, z, n) => (z > 4.5 ? -0.6 : 0),
  lights: [
    { x: 8, y: 1.3, z: 2.75, r: 5.2, k: 2.2 },                  // canopy bulbs
    { x: 4, y: 0.7, z: 1.4, r: 3.0, k: 1.0 }, { x: 12.2, y: 0.7, z: 1.4, r: 3.0, k: 1.0 },   // lobby windows
    { x: 2.0, y: 2.0, z: 4.1, r: 5.0, k: 1.5 }, { x: 14.4, y: 2.0, z: 4.1, r: 5.0, k: 1.5 }, { x: 8.6, y: 9.4, z: 4.1, r: 5.0, k: 1.4 },
    { x: 0.35, y: 6.1, z: 2.6, r: 2.6, k: 1.4 },              // 1140 door lamp
    { x: 11.9, y: 0.9, z: 5.0, r: 6.0, k: 1.0, tag: 2 },      // MIRADOR blade sign (flickers)
    { x: 12.2, y: 3.3, z: 1.8, r: 4.6, k: 0.9, tag: 3, map: REDW }  // police beacon
  ],
  occluders: [[3.0, 6.9, 0, 7.6, 8.7, 1.3], [9.6, 6.9, 0, 14.3, 8.7, 1.3], [9.9, 2.4, 0, 14.6, 4.2, 1.3], [2.7, 0.4, 0, 4.3, 1.4, 2.3]],
  walk: [[0.3, 0.3, 14.8, 9.8]],
  block: [[2.65, 0.3, 4.35, 1.45], [3.0, 6.9, 7.6, 8.7], [9.6, 6.9, 14.3, 8.7], [9.9, 2.4, 14.6, 4.2],
          [1.85, 1.85, 2.15, 2.15], [14.25, 1.85, 14.55, 2.15], [5.7, 2.25, 5.9, 2.45], [10.1, 2.25, 10.3, 2.45], [8.45, 9.25, 8.75, 9.55], [1.95, 8.15, 2.25, 8.45]],
  hotspots: [
    { id: 'door1140', name: '1140 Ferrier', at: [0.6, 6.1], pos: [0, 6.1], face: 'NW', exitDir: 'left',
      exit: { room: 'landing', x: 0.85, y: 0.75, dir: 'SE', sfx: 'door' },
      look: "1140 Ferrier. My building. The door's green because the landlord bought the paint cheap in 1946." },
    { id: 'molnar', name: 'Molnar & Son', at: [0.8, 3.1], pos: [0, 3.1], face: 'NW',
      look: "Dummies in last season's suits. Molnar's been shut a month. The dust has moved in and started a family." },
    { id: 'offwin', name: 'My office window', at: [0.8, 3.9], pos: [0, 3.9, 4.8], face: 'NW', mark: [0, 3.9, 5.0],
      look: "Second floor. My blinds, lit up by the Mirador's sign. From down here my office looks like somewhere a man would want to be." },
    { id: 'barber', name: "Nicky's barber shop", at: [0.8, 8.1], pos: [0, 8.1], face: 'NW',
      look: "Nicky's. Closed Tuesdays. The pole turns anyway. It doesn't know what day it is either." },
    { id: 'poster', name: 'Crown Energy poster', at: [0.8, 9.3], pos: [0, 9.3], face: 'NW',
      look: "'ASTERION. POWERING A BRIGHTER TOMORROW.' A smiling family under a smiling atom. The family has never been to Asterion Point." },
    { id: 'kiosk', name: 'Newsstand', at: [3.5, 1.9], pos: [3.5, 0.9], face: 'NE',
      look: "Sal's newsstand. Sal's been on this corner since before the war. He'll be here after the next one." },
    { id: 'mirador', name: 'Hotel Mirador', at: [8.0, 1.2], pos: [8.0, 0], face: 'NE', exitDir: 'up',
      exit: { room: 'lobby', x: 3.6, y: 5.3, dir: 'NE', sfx: 'door' },
      look: "The Hotel Mirador. Twelve floors of good manners, and on one of them a woman got shot last night." },
    { id: 'blade', name: 'MIRADOR sign', at: [11.0, 1.9], pos: [11.9, 0.4, 5], mark: [11.9, 0.4, 4.2], face: 'NE',
      look: "MIRADOR, top to bottom in amber tube. It's been lighting my office for free for six years. I've never thanked it." },
    { id: 'police', name: 'Police car', at: [11.0, 4.9], pos: [12.2, 3.3], face: 'NE',
      look: "NMPD black-and-white, beacon going round for nobody's benefit. Russo's. She likes people to know she's arrived." },
    { id: 'sedan', name: 'Black sedan', at: [11.2, 6.2], pos: [11.9, 7.8],
      look: () => sedanLook(),
      use: () => [['say', 'frank', "You knock on the window of a car like that and you find out how the rest of your day goes. I'll keep my day."], ...sedanLook()] },
    { id: 'mycar', name: 'My car', at: [5.3, 6.3], pos: [5.3, 7.8],
      look: "A '49 Mercury with a heater that works when it feels like it. We understand each other.",
      use: () => [['say', 'frank', "The Mirador's thirty steps away. Even I can walk that."]] },
    { id: 'hydrant', name: 'Fire hydrant', at: [2.5, 8.0], pos: [2.1, 8.3], noFocus: true,
      look: "A fire hydrant. In this weather it's just showing off." },
    { id: 'tracks', name: 'Streetcar tracks', at: [6.5, 5.4], pos: [6.5, 5.5], noFocus: true,
      look: "The Ferrier line. The bell goes twice, then once more, a little late. It's gone that way as long as I've lived here." }
  ],
  people: {
    vendor: { id: 'sal', actor: 'vendor', name: 'Sal', look: "Sal. Newsprint on his fingers, a racing form in his back pocket, and a knee that tells him about the weather.",
              talk: () => salTalk() }
  },
  cast: () => [['vendor', 3.5, 1.85, 'SE']],
  props: [],
  build(rb, h) {
    const WX = 15, DY = 10, HT = 7.2;
    setMat(MAT_OUTSIDE);
    // ---- ground: sidewalks (z 0.15) with kerbs, street, tracks, puddles
    const walkSh = flagstones(C.ST1, C.ST2, C.ST0, 7, 0.7), road = asphalt(C.ST0, C.NAV, 9);
    rFloor(0, 0, WX, 2.2, 0.15, walkSh); rFloor(0, 2.2, 2.2, DY, 0.15, walkSh);
    rFloor(2.2, 8.8, WX, DY, 0.15, walkSh);
    rWallY(2.2, 2.2, WX, 0, 0.15, flat(C.ST1)); rWallX(2.2, 2.2, 8.8, 0, 0.15, flat(C.ST1));
    rFloor(2.2, 2.2, WX, 8.8, 0, (x, y, px, py) => {
      const r1 = Math.abs(y - 4.8) < 0.04 || Math.abs(y - 6.2) < 0.04;
      if (r1) return C.S1;
      if (Math.abs(y - 4.8) < 0.1 || Math.abs(y - 6.2) < 0.1) return C.INK;
      return road(x, y, px, py);
    });
    // front slab edges
    rWallX(WX, 0, DY, -0.3, 0.15, flat(C.BLK)); rWallY(DY, 0, WX, -0.3, 0.15, flat(C.BLK));
    // puddles
    setMat(MAT_OUTSIDE | MAT_PUDDLE);
    const puddles = [[5.2, 3.3, 1.1, 0.45], [8.6, 5.5, 1.4, 0.5], [3.4, 5.9, 0.8, 0.35], [12.8, 5.8, 1.2, 0.4], [6.8, 7.8, 0.9, 0.3], [1.1, 4.8, 0.5, 0.8], [10.8, 1.2, 0.8, 0.3], [4.8, 9.3, 0.9, 0.3]];
    for (const p of puddles) rFloor(p[0] - p[2], p[1] - p[3], p[0] + p[2], p[1] + p[3], p[1] < 2.2 || p[0] < 2.2 || p[1] > 8.8 ? 0.152 : 0.002, (x, y, px, py) => {
      const d = ((x - p[0]) / p[2]) ** 2 + ((y - p[1]) / p[3]) ** 2 + (vnoise(x * 3, y * 3, 17) - 0.5) * 0.5;
      return d < 1 ? C.NAV : T;
    });
    setMat(MAT_OUTSIDE);
    // ---- left facade: 1140 Ferrier + Nicky's
    setHot(0);
    rWallX(0, 0, DY, 0, HT, (y, z, px, py) => {
      if (z > 3.3 && z < 3.45) return C.ST1;                                          // string course
      // upper windows
      const up = (z > 4.0 && z < 5.6) || (z > 6.1 && z < 7.0);
      for (const wy of [1.3, 3.9, 6.6, 8.9]) if (up && Math.abs(y - wy) < 0.7) {
        if (Math.abs(y - wy) > 0.62 || Math.abs(z - 5.62) < 0.06) return C.INK;
        if (wy === 3.9 && z < 5.6) return T;                                           // office window drawn below
        return (hash(Math.round(wy), Math.round(z)) < 0.3 && z > 6) ? C.AMB : (bay(px, py) < 0.12 ? C.SLT : C.NAV);
      }
      return FER_BRICK(y, z, px, py);
    });
    // Frank's office window, blinds lit amber
    setHot(h('offwin')); setMat(MAT_EMIT);
    rWallX(0.001, 3.25, 4.55, 4.05, 5.55, (y, z) => frac((z - 4.05) / 0.16) < 0.5 ? C.TRIM : C.AMB);
    setMat(MAT_OUTSIDE);
    // Molnar & Son shopfront
    setHot(h('molnar'));
    rWallX(0.002, 0.9, 5.3, 0.15, 3.2, (y, z, px, py) => {
      if (z > 2.6) return wallTextHit('MOLNAR & SON', 0.1, 3.08, 5.3 - y, z) ? C.BRASS : C.INK;
      if (z < 0.5 || Math.abs(y - 2.2) < 0.04 || Math.abs(y - 4.0) < 0.04 || y < 0.98 || y > 5.22 || z > 2.52) return C.DBR;
      if (Math.abs(y - 3.1) < 0.38 && z < 2.2) return Math.abs(y - 3.1) > 0.33 || z > 2.15 ? C.DBR : (Math.abs(y - 2.85) < 0.03 && Math.abs(z - 1.2) < 0.05 ? C.BRASS : C.INK);
      if (z < 1.9 && z > 0.6 && (Math.abs(y - 1.6) < 0.18 || Math.abs(y - 4.6) < 0.18)) return z > 1.55 ? C.SKL : (z > 0.9 ? C.ST0 : C.INK);   // dummies
      return bay(px, py) < 0.1 ? C.SLT : C.NAV;
    });
    // 1140 street door with transom and lamp
    setHot(h('door1140'));
    rWallX(0.002, 5.6, 6.6, 0.15, 2.5, (y, z) => {
      if (y < 5.68 || y > 6.52 || z > 2.42) return C.INK;
      if (z > 2.0) return C.SLT;
      if (Math.abs(z - 1.55) < 0.05 && Math.abs(y - 6.4) < 0.05) return C.BRASS;
      return (Math.abs(y - 6.1) < 0.03) ? C.G0 : C.G1;
    });
    rDecalX(0.01, 6.1, 2.22, ['yyyy'], { y: C.BRASS });
    rStamp(0.25, 6.1, 2.55, ['.i.', 'ihi', '.i.'], { i: C.INK, h: C.HOT });
    // Nicky's barber shop + pole
    setHot(h('barber'));
    rWallX(0.002, 6.95, 9.25, 0.15, 2.85, (y, z, px, py) => {
      if (z > 2.25) return wallTextHit("NICKY'S", 0.06, 2.74, 9.25 - y, z) ? C.CREAM : C.OX;
      if (z < 0.45 || y < 7.02 || y > 9.18 || z > 2.2) return C.OX;
      return bay(px, py) < 0.08 ? C.SLT : C.NAV;
    });
    // Crown Energy poster
    setHot(h('poster'));
    rWallX(0.003, 9.35, 9.95, 0.9, 2.3, (y, z) => {
      if (y < 9.39 || y > 9.91 || z < 0.94 || z > 2.26) return C.CREAM;
      if (z > 1.85) return C.CYD;
      const dy = y - 9.65, dz = z - 1.45;
      if (Math.abs(Math.hypot(dy * 1.4, dz) - 0.16) < 0.03) return C.CYAN;
      if (z < 1.1) return C.CRIM;
      return C.PALEY;
    });
    // ---- right facade: the Hotel Mirador
    setHot(0);
    rWallY(0, 0, WX, 0, HT, (x, z, px, py) => {
      if (z > 3.35 && z < 3.55) return C.STS;                                          // cornice
      const pier = frac((x - 0.5) / 3.0) < 0.08;
      if (pier) return z > 3.55 ? C.CRS : C.STS;
      if (z > 3.55) {
        const inWin = ((z > 4.1 && z < 5.4) || (z > 5.9 && z < 7.0)) && (frac((x - 0.5) / 1.5) > 0.25 && frac((x - 0.5) / 1.5) < 0.75);
        if (inWin) {
          const lit = hash(Math.floor((x - 0.5) / 1.5), Math.floor(z)) < 0.25;
          return lit ? (bay(px, py) < 0.3 ? C.GLOW : C.AMB) : (bay(px, py) < 0.15 ? C.SLT : C.NAV);
        }
        return FER_STONE(x, z, px, py);
      }
      return FER_STONE(x, z, px, py);
    });
    // lobby windows (warm, emissive)
    setMat(MAT_EMIT | MAT_OUTSIDE);
    for (const wx of [[2.6, 5.6], [10.4, 13.9]]) {
      setHot(0);
      rWallY(0.002, wx[0], wx[1], 0.35, 2.9, (x, z, px, py) => {
        if (x < wx[0] + 0.08 || x > wx[1] - 0.08 || z < 0.43 || z > 2.82 || frac((x - wx[0]) / 1.0) < 0.04) return C.BRASS;
        if (z < 1.3 && Math.abs(frac((x - wx[0]) / 1.5) - 0.5) < 0.12) return C.G1;           // potted palms
        if (z > 2.3) return C.GLOW;
        return bay(px, py) < 0.25 ? C.GLOW : C.AMB;
      });
    }
    // entrance: revolving door between brass-framed doors
    setHot(h('mirador'));
    rWallY(0.002, 6.6, 9.4, 0.15, 2.8, (x, z, px, py) => {
      if (x < 6.68 || x > 9.32 || z > 2.72) return C.BRASS;
      if (Math.abs(x - 8.0) < 0.75) {
        const r = Math.abs(x - 8.0);
        if (r > 0.7 || Math.abs(frac((x - 7.25) / 0.5) - 0.5) < 0.04) return C.BRASS;
        return z > 2.4 ? C.BRASS : (bay(px, py) < 0.3 ? C.GLOW : C.AMB);
      }
      if (Math.abs(x - 6.95) < 0.02 || Math.abs(x - 9.05) < 0.02) return C.BRASS;
      return bay(px, py) < 0.2 ? C.GLOW : C.AMB;
    });
    setMat(MAT_OUTSIDE);
    // canopy (marquee) with its name along the front edge and bulbs underneath
    setHot(h('mirador'));
    rBox(5.5, 0, 2.9, 10.5, 2.45, 3.5, flat(C.S1), flat(C.S0), (x, z) => (z > 2.95 && z < 3.46 && wallTextHit('HOTEL MIRADOR', 5.72, 3.42, x, z, 1)) ? C.GLOW : (z < 2.94 || z > 3.46 ? C.BRASS : C.INK));
    setMat(MAT_EMIT | MAT_OUTSIDE);
    rWallY(2.452, 5.5, 10.5, 2.9, 2.96, (x) => frac(x / 0.25) < 0.4 ? C.HOT : C.S1);
    setMat(MAT_OUTSIDE);
    for (const cx of [5.8, 10.2]) { rCyl(cx, 2.35, 0.04, 0.15, 2.9, (a) => a < 0 ? C.BRASS : C.BRN); }
    // blade sign
    setHot(h('blade'));
    rBox(11.8, 0.02, 3.2, 12.0, 0.75, 7.1, flat(C.INK), (y, z) => {
      if (y < 0.06 || y > 0.71 || z < 3.24 || z > 7.06) return C.AMB;
      const L = 'MIRADOR', i = Math.floor((6.98 - z) / 0.53);
      if (i < 0 || i >= L.length) return C.INK;
      const gw = charW(L.charCodeAt(i)) * 1.15 / 16, y0 = 0.385 + gw / 2;
      const col = Math.floor((y0 - y) * 16 / 1.15), row = Math.floor(((6.98 - i * 0.53) - z) * 16 / 1.15);
      return glyphBit(L[i], col, row) ? C.GLOW : C.INK;
    }, flat(C.AMB));
    // kiosk
    setHot(h('kiosk'));
    rBox(2.7, 0.4, 0, 4.3, 1.4, 2.2, flat(C.G0), flat(C.G0), (x, z, px, py) => {
      if (z > 1.72) return wallTextHit('NEWS', 3.06, 2.16, x, z) ? C.PALEY : C.G1;
      if (z < 0.6) return C.G0;
      const col = Math.floor((x - 2.7) / 0.32), row = Math.floor((z - 0.6) / 0.37);
      return frac((x - 2.7) / 0.32) < 0.12 || frac((z - 0.6) / 0.37) < 0.15 ? C.INK : ((col + row) % 3 === 0 ? C.CREAM : (col + row) % 3 === 1 ? C.CRS : C.CRIM);
    });
    rBox(2.6, 0.3, 2.2, 4.4, 1.6, 2.3, (x, y) => frac(x / 0.3) < 0.5 ? C.G1 : C.CREAM, flat(C.G0), (x) => frac(x / 0.3) < 0.5 ? C.G1 : C.CREAM);
    // street lamps
    setHot(0);
    for (const L of [[2.0, 2.0], [14.4, 2.0], [8.6, 9.4]]) {
      rCyl(L[0], L[1], 0.07, 0.15, 3.9, (a) => a < -0.2 ? C.S1 : C.S0);
      rCyl(L[0], L[1], 0.14, 0.15, 0.5, (a) => a < -0.2 ? C.S1 : C.S0, () => C.S1);
      setMat(MAT_EMIT | MAT_OUTSIDE);
      rSphere(L[0], L[1], 4.12, 0.2, (nx, ny) => ny < -0.4 ? C.HOT : nx * nx + ny * ny > 0.75 ? C.GLOW : C.PALEY);
      setMat(MAT_OUTSIDE);
      rCyl(L[0], L[1], 0.1, 4.3, 4.36, () => C.S0, () => C.S0);
    }
    // police car (facing -x), Frank's Mercury, the black sedan
    setHot(h('police'));
    sedanGeom(9.9, 2.4, 4.7, C.INK, C.BLK, C.S2, C.SLT, -1);
    rBox(11.9, 2.95, 1.35, 12.3, 3.35, 1.5, flat(C.S0), flat(C.INK), flat(C.INK));
    rWallY(4.21, 11.0, 12.6, 0.4, 0.8, (x, z) => z > 0.45 && z < 0.75 ? C.S3 : C.INK);        // white door
    setHot(h('mycar'));
    sedanGeom(3.0, 6.9, 4.6, C.OX, C.PLUM, C.S2, C.SLT, 1);
    setHot(h('sedan'));
    sedanGeom(9.6, 6.9, 4.7, C.BLK, C.BLK, C.S1, C.NAV, -1);
    // hydrant
    setHot(h('hydrant'));
    rCyl(2.1, 8.3, 0.12, 0.15, 0.7, (a) => a < -0.3 ? C.RED : C.CRIM, () => C.CRIM);
    rCyl(2.1, 8.3, 0.07, 0.7, 0.8, () => C.CRIM, () => C.RED);
    // tracks hotspot strip
    setHot(h('tracks'));
    rFloor(2.4, 4.72, WX, 4.88, 0.003, (x) => C.S1);
    setHot(0); setMat(0);
  },
  postBake(rb) { skyFill(rb, C.NAV, C.VDK); },
  drawBack(cx, cy) {
    // passenger in the sedan with his newspaper; exhaust from the idling engine
    const sx = toScreenX(12.1, 7.5), sy = toScreenY(12.1, 7.5, 1.25);
    fillRect(sx - 1, sy - 3, 3, 3, C.INK); fillRect(sx + 2, sy - 2, 3, 2, C.CRS);
    const ex = toScreenX(14.35, 8.4), ey = toScreenY(14.35, 8.4, 0.35);
    for (let k = 0; k < 4; k++) { const ph = frac(tick / 90 + k / 4); puff(ex + ph * 10, ey - ph * 7, 1.5 + ph * 3, 0.45 * (1 - ph), LIT, 99); }
    // barber pole stripes
    for (let z = 0; z < 12; z++) { const px = toScreenX(0.05, 6.8), py = toScreenY(0.05, 6.8, 1.1 + z / 16); pset(px, py, ((z + (tick >> 3)) % 4) < 2 ? C.CRIM : C.CREAM); pset(px + 1, py, ((z + 1 + (tick >> 3)) % 4) < 2 ? C.CRIM : C.CREAM); }
    // streetcar
    drawStreetcar(cx, cy);
  },
  drawFront(cx, cy) { drawRain(cx, cy, 150, true); vignette(0.9); },
  update() {
    const t = tick % 1320;
    lightState[2] = (t > 900 && t < 905) || (t > 915 && t < 921) ? 0 : 1;          // sign stutter
    lightState[3] = ((tick % 48) < 18) ? 1 : 0;                                     // beacon
    streetcarUpdate();
  },
  onEnter() {
    setAmbience(1, 1, 0, 0);
    if (!flag('ferrier_seen')) { setFlag('ferrier_seen'); return [['caption', 'FERRIER STREET\n7:31 A.M.', 2.5, 'nb']]; }
    return [];
  }
});
function skyFill(rb, top, bot) {
  for (let by = 0; by < rb.h; by++) for (let bx = 0; bx < rb.w; bx++) {
    const i = by * rb.w + bx; if (rb.col[i] !== T) continue;
    rb.col[i] = bay(bx, by) < by / rb.h * 0.8 ? bot : top; rb.nrm[i] = NRM_SKY; rb.dep[i] = -1e8;
  }
}
// ------------------------------------------------------------------ the streetcar (bell: twice, then once more, a little late)
const TRAM = { x: -40, active: false, next: 60 * 25 };
// yc: the track centre line (the car is 2.4 m wide); it waits while Frank stands on the tracks
function streetcarUpdate(yc) {
  const c = yc || 5.5;
  if (!TRAM.active) {
    if (--TRAM.next <= 0) {
      const fr = ACT.frank;
      if (fr.y > c - 1.7 && fr.y < c + 1.7 && fr.x > 1) { TRAM.next = 120; return; }
      TRAM.active = true; TRAM.x = -14; sfx('bell');
    }
    return;
  }
  TRAM.x += 0.09;
  if (TRAM.x > 30) { TRAM.active = false; TRAM.next = 60 * (40 + Math.floor(hash(tick, 1) * 20)); }
}
function drawStreetcar(cx, cy, yc) {
  if (!TRAM.active) return;
  const c = yc || 5.5, x0 = TRAM.x, x1 = x0 + 10, y0 = c - 1.2, y1 = c + 1.2;
  beginScreen(cx, cy);
  rBox(x0, y0, 0.25, x1, y1, 1.35, flat(C.CRIM), flat(C.OX), (x, z) => z < 0.4 ? C.INK : C.CRIM);
  rBox(x0, y0, 1.35, x1, y1, 2.6, flat(C.CREAM), flat(C.CRS), (x, z) => (z > 1.55 && z < 2.3 && frac((x - x0) / 1.1) > 0.15) ? (bay(Math.floor(x * 16), Math.floor(z * 16)) < 0.3 ? C.GLOW : C.AMB) : C.CREAM);
  rBox(x0 + 0.3, y0 + 0.2, 2.6, x1 - 0.3, y1 - 0.2, 2.9, flat(C.CRS), flat(C.S1), flat(C.S1));
  rLine3(x0 + 5, c, 2.9, x0 + 6.2, c, 4.4, C.INK);
  endScreen();
}
function sedanLook() {
  const first = !flag('saw_sedan');
  setFlag('saw_sedan');
  return [['say', 'frank', "A black '54 sedan across from the Mirador. Mud on the plate, and not the kind you get from driving."],
    ['say', 'frank', "Engine running, wipers off in the rain. Two men. The passenger's reading a newspaper he isn't reading."], ['clue', 'sedan']];
}
function salTalk() {
  const menu = () => [['choice', [
    { t: "What's going on at the Mirador?", d: [['say', 'vendor', "Cops since seven. Meat wagon at a quarter past. Russo went in with a face like a Sunday."],
        ['say', 'vendor', "They're saying it's the singer from the Blue Comet. Evelyn."], ['flag', 'sal_told'], ['fn', menu]] },
    { t: "You knew Evelyn Hart?", c: () => flag('sal_told') || flag('took_case'),
      d: [['say', 'vendor', "She bought the Herald every morning, Variety on Fridays. Always asked about my knee. Nobody asks about my knee."],
          ['say', 'vendor', "Saturday morning, the morning of the lights, she came by early. Everybody on this corner was staring at the sky over the harbour."],
          ['say', 'vendor', "Not her. Kept her eyes on her shoes the whole time. Like somebody told her not to look."], ['clue', 'eyes_down'], ['fn', menu]] },
    { t: "The black sedan across the street. Seen it before?",
      d: [['say', 'vendor', "That? Been there since seven. Engine running the whole time, wipers off. Who pays for gas like that?"],
          ['say', 'vendor', "Two fellas. The one on the passenger side's been on the same page for an hour. Nobody reads the Herald that slow. I've tried."],
          ['fn', () => { setFlag('saw_sedan'); return [['clue', 'sedan']]; }], ['fn', menu]] },
    { t: "[Bribe] Anything else you've seen this morning? (a dollar)", c: () => !flag('sal_paid'),
      d: [['flag', 'sal_paid'], ['sfx', 'coin'], ['say', 'vendor', "For a dollar? A fella in a blue suit went in the Mirador at six. Came out at six-thirty without his hat. Nobody forgets their hat in this weather."],
          ['clue', 'blue_suit'], ['fn', menu]] },
    { t: "See you, Sal.", d: [['say', 'vendor', "Keep your collar up, Frank."]] }
  ]]];
  if (flag('sal_met')) return [['say', 'vendor', "Frank."], ['fn', menu]];
  setFlag('sal_met');
  return [['say', 'vendor', "Frank. You look like a man who just got a phone call."], ['say', 'frank', "I look like a man who always just got a phone call."], ['fn', menu]];
}
