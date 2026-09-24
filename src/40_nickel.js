
// =================================================================== ROOM: THE NICKEL MILE (9:40 p.m.)
// x 0..14, y 0..8. Right facade y = 0: the Blue Comet (canopy, neon comet), the alley, a pawnshop.
// Left facade x = 0: the Volta diner. Tracks centred on y 4.2, near kerb at y 7.0.
const NK_BRICK = bricks(C.INK, C.HAIRD, C.BLK, 13);
// neon comet on the club wall: a star head and three trails that light in sequence (tags 4, 7, 8, 9)
// returns [tag, distance to the nearest tube]
function cometTube(x, z) {
  const dx = x - 7.4, dz = z - 5.7, r = Math.hypot(dx, dz), a = Math.atan2(dz, dx);
  const s = 0.28 + 0.42 * Math.pow(Math.abs(Math.cos(a * 2.5)), 3);
  let best = [4, Math.abs(r - s)];
  for (let k = 0; k < 3; k++) {
    const cx = 7.0 - k * 0.25, cz = 1.2 + k * 0.35, rad = Math.hypot(7.4 - 0.1 - cx, 5.7 - 0.12 * (k - 1) - cz);
    if (x > 3.3 + k * 0.5 && x < 6.85 && z > 3.7) { const d = Math.abs(Math.hypot(x - cx, z - cz) - rad); if (d < best[1]) best = [7 + k, d]; }
  }
  return best;
}
defRoom({
  id: 'nickel', name: 'The Nickel Mile', bounds: [0, 0, 14, 8], zmax: 7.0, start: [2.6, 5.9, 'NE'], bg: C.NAV, camBias: -20,
  ambient: -0.9,
  dark: (x, y, z) => (z > 4.2 ? -0.5 : 0),
  lights: [
    { x: 5.9, y: 1.1, z: 2.9, r: 4.4, k: 1.9 },                                            // canopy bulbs
    { x: 2.0, y: 2.0, z: 4.1, r: 5.0, k: 1.4 }, { x: 12.6, y: 2.0, z: 4.1, r: 5.0, k: 1.4 }, { x: 9.0, y: 7.4, z: 4.1, r: 5.0, k: 1.3 },
    { x: 0.5, y: 5.0, z: 1.4, r: 3.2, k: 1.2 },                                            // diner windows
    { x: 11.4, y: 0.5, z: 1.2, r: 2.2, k: 0.7 },                                           // pawnshop window
    { x: 9.25, y: -2.3, z: 2.4, r: 3.2, k: 2.0 },                                          // bulb deep in the alley
    { x: 6.0, y: 0.7, z: 5.0, r: 7.5, k: 1.3, tag: 4, map: BLUW },                         // the comet
    { x: 0.6, y: 4.9, z: 3.0, r: 4.5, k: 1.3, tag: 5, map: REDW }                          // VOLTA
  ],
  occluders: [[3.0, 5.15, 0, 7.6, 6.95, 1.3], [9.4, 5.15, 0, 13.9, 6.95, 1.3], [4.0, 0, 3.0, 7.8, 1.0, 3.55]],
  walk: [[0.3, 0.3, 13.8, 7.8]],
  block: [[3.0, 5.15, 7.6, 6.95], [9.4, 5.15, 13.9, 6.95], [1.85, 1.85, 2.15, 2.15], [12.45, 1.85, 12.75, 2.15], [8.85, 7.25, 9.15, 7.55],
          [3.95, 0.85, 4.15, 1.05], [7.65, 0.85, 7.85, 1.05]],
  hotspots: [
    { id: 'clubdoor', name: 'The Blue Comet', at: [5.3, 2.4], pos: [5.9, 0], face: 'NE', exitDir: 'up',
      exit: { room: 'club', x: 5.6, y: 7.3, dir: 'NE', sfx: 'door', cond: () => flag('paid_cover'), no: () => [['face', 'doorman', 'frank'], ['say', 'doorman', "Two dollars, friend. The music don't play itself. Well. Tonight it almost does."]] },
      look: "Black glass and chrome, and a doorman built like the door." },
    { id: 'comet', name: 'Neon comet', at: [6.2, 2.6], pos: [6.0, 0, 5.0], mark: [6.0, 0, 5.2], face: 'NE',
      look: "The Blue Comet. The tubes light up one trail at a time, like it's trying to leave and can't." },
    { id: 'poster', name: 'Poster', at: [7.5, 1.3], pos: [7.5, 0, 1.3], face: 'NE',
      look: "'TONIGHT AND NIGHTLY: EVELYN HART.' Somebody's already pinned a black ribbon across the corner. Somebody works fast." },
    { id: 'alley', name: 'Alley', at: [9.25, 0.6], pos: [9.25, -1], face: 'NE', exitDir: 'up',
      exit: { room: 'alley', x: 9.2, y: 2.2, dir: 'NW', sfx: 'step' },
      look: "The alley down the side of the Comet. The kind of dark you have to walk into to find out how deep it goes." },
    { id: 'pawn', name: 'Pawnshop', at: [11.4, 1.0], pos: [11.4, 0], face: 'NE',
      look: "LOANS. Trumpets in the window, and wedding rings, and a watch that stopped at ten past four. Everybody's second chance, at forty percent." },
    { id: 'volta', name: 'Volta diner', at: [0.9, 4.8], pos: [0, 4.8], face: 'NW',
      look: "The Volta. Chrome stools, pie under glass, a waitress who's heard every line and liked none of them.",
      use: () => [['say', 'frank', "Coffee at the Volta tastes like it was brewed during the war. Which war, they won't say. Later."]] },
    { id: 'car', name: 'My car', at: [5.3, 4.8], pos: [5.3, 5.9],
      look: "Parked where the tow trucks can't see it and the rain can.",
      use: () => [['say', 'frank', "I didn't drive across town to sit in the car."]] },
    { id: 'tracks', name: 'Streetcar tracks', at: [8.0, 4.2], pos: [8.0, 4.2], noFocus: true,
      look: "The Nickel Mile line. Runs till two. Last car at five to." }
  ],
  people: {
    doorman: { id: 'gus', actor: 'doorman', name: 'Gus', at: [5.4, 2.45],
               look: "The doorman. Gus, on a brass badge. Shoulders like a closed door and a face that's been opened a few times.",
               talk: () => gusTalk(), items: { matchbook: () => [['say', 'doorman', "Matchbooks are free, pal. That's the idea of matchbooks."]],
                 licence: () => [['say', 'doorman', "A private ticket. Privates pay like everybody else. Two dollars."]] } }
  },
  cast: () => [['doorman', 5.9, 1.55, 'SE']],
  build(rb, h) {
    const WX = 14, DY = 8, HT = 7.0;
    setMat(MAT_OUTSIDE);
    const walkSh = flagstones(C.ST0, C.ST1, C.INK, 17, 0.7), road = asphalt(C.INK, C.NAV, 19);
    rFloor(0, 0, WX, 2.2, 0.15, walkSh); rFloor(0, 2.2, 2.2, DY, 0.15, walkSh); rFloor(2.2, 7.0, WX, DY, 0.15, walkSh);
    rWallY(2.2, 2.2, WX, 0, 0.15, flat(C.ST0)); rWallX(2.2, 2.2, 7.0, 0, 0.15, flat(C.ST0));
    rFloor(2.2, 2.2, WX, 7.0, 0, (x, y, px, py) => {
      if (Math.abs(y - 3.6) < 0.04 || Math.abs(y - 4.8) < 0.04) return C.S1;
      if (Math.abs(y - 3.6) < 0.1 || Math.abs(y - 4.8) < 0.1) return C.BLK;
      return road(x, y, px, py);
    });
    rWallX(WX, 0, DY, -0.3, 0.15, flat(C.BLK)); rWallY(DY, 0, WX, -0.3, 0.15, flat(C.BLK));
    setMat(MAT_OUTSIDE | MAT_PUDDLE);
    for (const p of [[6.0, 2.9, 1.3, 0.45], [9.6, 4.1, 1.0, 0.35], [3.6, 3.2, 0.7, 0.3], [11.9, 3.0, 0.9, 0.4], [8.4, 6.6, 0.8, 0.3], [1.1, 6.0, 0.4, 0.7], [9.25, -1.2, 0.5, 0.6]])
      rFloor(p[0] - p[2], p[1] - p[3], p[0] + p[2], p[1] + p[3], p[1] < 2.2 || p[0] < 2.2 || p[1] > 7.0 ? 0.152 : 0.002, (x, y) =>
        ((x - p[0]) / p[2]) ** 2 + ((y - p[1]) / p[3]) ** 2 + (vnoise(x * 3, y * 3, 23) - 0.5) * 0.5 < 1 ? C.NAV : T);
    setMat(MAT_OUTSIDE);
    // ---- left facade: the Volta diner
    setHot(0);
    rWallX(0, 0, DY, 0, HT, (y, z, px, py) => {
      if (z > 3.6 && z < 3.72) return C.ST0;
      for (const wy of [1.2, 3.6, 6.0]) if (z > 4.2 && z < 5.6 && Math.abs(y - wy) < 0.55) return Math.abs(y - wy) > 0.48 ? C.BLK : (hash(wy, 7) < 0.4 ? (bay(px, py) < 0.4 ? C.GLOW : C.AMB) : C.NAV);
      return NK_BRICK(y, z, px, py);
    });
    setHot(h('volta'));
    setMat(MAT_EMIT | MAT_OUTSIDE);
    rWallX(0.002, 2.8, 7.3, 0.15, 2.5, (y, z, px, py) => {
      if (z < 0.6 || z > 2.42 || y < 2.88 || y > 7.22 || frac((y - 2.8) / 1.5) < 0.03) return C.S2;
      if (z < 0.72) return (frac(y / 0.45) < 0.3) ? C.CRIM : C.OX;                                  // stools
      if (z < 0.98) return C.CRIM;                                                                  // counter front
      if (z < 1.04) return C.S3;
      if (z < 1.8 && Math.abs(y - 5.2) < 0.13) return z > 1.6 ? C.SKM : C.CREAM;                   // waitress
      if (z > 1.55 && z < 1.75 && frac(y / 0.9) < 0.28) return C.CORAL;                             // pies under glass
      if (z > 2.0) return bay(px, py) < 0.3 ? C.GLOW : C.AMB;
      return bay(px, py) < 0.2 ? C.HOT : C.GLOW;
    });
    setMat(MAT_OUTSIDE);
    rWallX(0.002, 7.35, 7.95, 0.15, 2.4, doorShader(7.35, 7.95, 2.4, C.S1, C.S0, C.S2, C.GLOW, 1.0));
    setMat(MAT_EMIT | MAT_OUTSIDE);
    rWallX(0.004, 3.1, 6.9, 2.62, 3.5, (y, z) => {
      if (wallTextHit('VOLTA', 0.55, 3.44, 6.9 - y, z, 1.6)) return C.CORAL;
      return (Math.abs(z - 2.66) < 0.03 || Math.abs(z - 3.46) < 0.03) ? C.RED : T;
    });
    setMat(MAT_OUTSIDE);
    // ---- right facade: the Blue Comet, the alley, the pawnshop
    setHot(0);
    rWallY(0, 0, WX, 0, HT, (x, z, px, py) => {
      if (x > 8.5 && x < 10.0) return T;                                                               // the alley gap, open to the sky
      if (z > 3.4 && z < 3.5) return C.ST0;
      for (const wx of [2.9, 11.4, 13.2]) if (z > 4.1 && z < 5.5 && Math.abs(x - wx) < 0.45) return Math.abs(x - wx) > 0.38 ? C.BLK : (hash(wx, 3) < 0.4 ? (bay(px, py) < 0.4 ? C.GLOW : C.AMB) : C.NAV);
      if (x > 2.4 && x < 8.5 && z < 2.7) return (frac(z / 0.5) < 0.06) ? C.S0 : C.INK;               // black glass cladding
      return NK_BRICK(x, z, px, py);
    });
    // alley mouth: a real recess with a far bulb and the fire escape in silhouette
    setHot(h('alley'));
    rFloor(8.5, -2.6, 10.0, 0, 0.15, (x, y, px, py) => hash3(Math.floor(x / 0.5), Math.floor(y / 0.5), 3) > 0.7 ? C.ST0 : C.INK);
    rWallX(8.5, -2.6, 0, 0.15, HT, NK_BRICK);
    rWallY(-2.6, 8.5, 10.0, 0.15, HT, (x, z, px, py) => {
      if (z > 2.9 && z < 5.6 && x > 8.7 && x < 9.4 && (frac(z / 0.45) < 0.12 || Math.abs(x - 8.75) < 0.03 || Math.abs(x - 9.35) < 0.03)) return C.BLK;   // fire escape
      if (x > 9.45 && x < 9.9 && z > 0.15 && z < 2.0) return C.INK;                                   // back door
      return NK_BRICK(x, z, px, py);
    });
    setMat(MAT_EMIT | MAT_OUTSIDE);
    rDecalY(-2.58, 9.65, 2.25, ['.ggg.', 'ghhhg', '.ggg.'], { g: C.AMB, h: C.HOT });
    setMat(MAT_OUTSIDE);
    // club entrance: double doors with portholes
    setHot(h('clubdoor'));
    rWallY(0.003, 5.2, 6.6, 0.15, 2.4, (x, z, px, py) => {
      if (x < 5.27 || x > 6.53 || z > 2.33 || Math.abs(x - 5.9) < 0.03) return C.S2;
      for (const c of [5.58, 6.22]) if (Math.hypot(x - c, z - 1.6) < 0.16) return Math.hypot(x - c, z - 1.6) > 0.12 ? C.S2 : (bay(px, py) < 0.35 ? C.NBL : C.NBD);
      return C.INK;
    });
    // canopy with the name in tubes on its front edge
    rBox(4.0, 0, 3.0, 7.8, 1.0, 3.55, flat(C.INK), flat(C.BLK), (x, z) => (z > 3.06 && z < 3.5 && wallTextHit('BLUE COMET', 4.17, 3.47, x, z)) ? C.NBL : C.BLK);
    setMat(MAT_EMIT | MAT_OUTSIDE);
    rWallY(1.002, 4.0, 7.8, 2.96, 3.06, (x, z, px, py) => frac(x / 0.25) < 0.4 ? (hash(Math.floor(x / 0.25), 5) < 0.15 ? C.AMB : C.HOT) : C.S1);
    setMat(MAT_OUTSIDE);
    for (const cx of [4.05, 7.75]) rCyl(cx, 0.95, 0.04, 0.15, 3.0, (a) => a < 0 ? C.S3 : C.S1);
    // the neon comet
    setHot(h('comet'));
    setMat(MAT_EMIT | MAT_OUTSIDE);
    rWallY(0.004, 3.2, 8.3, 3.55, 6.5, (x, z, px, py) => { const d = cometTube(x, z)[1]; return d < 0.045 ? C.NBL : (d < 0.13 && bay(px, py) < 0.5 * (1 - d / 0.13) + 0.1) ? C.NBD : T; });
    setMat(MAT_OUTSIDE);
    // Evelyn's poster, black ribbon across the corner
    setHot(h('poster'));
    rWallY(0.004, 7.15, 7.85, 0.6, 2.0, (x, z) => {
      if (x < 7.2 || x > 7.8 || z < 0.65 || z > 1.95) return C.S2;
      if (Math.abs((x - 7.2) - (1.95 - z)) < 0.07 && x < 7.55) return C.BLK;
      if (Math.hypot(x - 7.5, z - 1.5) < 0.14) return z > 1.62 ? C.HAIRL : C.SKL;
      if (Math.abs(x - 7.5) < 0.16 - (z - 0.7) * 0.05 && z < 1.38 && z > 0.8) return C.NBD;
      return z < 0.78 ? C.CREAM : C.NAV;
    });
    // pawnshop
    setHot(h('pawn'));
    rWallY(0.003, 10.4, 12.4, 0.15, 2.6, (x, z, px, py) => {
      if (z > 2.1) return wallTextHit('LOANS', 10.57, 2.55, x, z) ? C.BRASS : C.DBR;
      if (z < 0.5 || x < 10.48 || x > 12.32 || z > 2.02) return C.DBR;
      if (frac(x / 0.2) < 0.15) return C.S1;                                                          // bars
      if (z < 1.0 && frac(x / 0.6) < 0.3) return C.BRASS;                                             // trumpets in the window
      return bay(px, py) < 0.25 ? C.AMB : C.BRN;
    });
    rStamp(11.4, 0.12, 2.95, ['.yy..yy.', 'yyyyyyyy', '.yy..yy.', '...yy...', '..yyyy..', '...yy...'], { y: C.BRASS });
    // street lamps
    setHot(0);
    for (const L of [[2.0, 2.0], [12.6, 2.0], [9.0, 7.4]]) {
      rCyl(L[0], L[1], 0.07, 0.15, 3.9, (a) => a < -0.2 ? C.S1 : C.S0);
      rCyl(L[0], L[1], 0.14, 0.15, 0.5, (a) => a < -0.2 ? C.S1 : C.S0, () => C.S1);
      setMat(MAT_EMIT | MAT_OUTSIDE);
      rSphere(L[0], L[1], 4.12, 0.2, (nx, ny) => ny < -0.4 ? C.HOT : nx * nx + ny * ny > 0.75 ? C.GLOW : C.PALEY);
      setMat(MAT_OUTSIDE);
      rCyl(L[0], L[1], 0.1, 4.3, 4.36, () => C.S0, () => C.S0);
    }
    // Frank's Mercury and a cab
    setHot(h('car'));
    sedanGeom(3.0, 5.15, 4.6, C.OX, C.PLUM, C.S2, C.SLT, 1);
    setHot(0);
    sedanGeom(9.4, 5.15, 4.5, C.BRASS, C.AMB, C.S2, C.NAV, -1);
    rBox(11.4, 5.85, 1.35, 11.9, 6.25, 1.5, flat(C.PALEY), flat(C.BRASS), flat(C.AMB));
    setHot(h('tracks'));
    rFloor(2.4, 3.52, WX, 3.68, 0.003, () => C.S1);
    setHot(0); setMat(0);
  },
  postBake(rb, h) {
    skyFill(rb, C.NAV, C.VDK);
    // neon tubes: the lit colour lives in alt, the dark tube in col, keyed to a light tag (world coords still exist here)
    const hc = h('comet'), hd = h('volta'), hcl = h('clubdoor');
    for (let i = 0; i < rb.col.length; i++) {
      const c = rb.col[i];
      if (rb.hot[i] === hc && (c === C.NBL || c === C.NBD)) { rb.lgt[i] = cometTube(rb.wx[i], rb.wz[i])[0]; rb.alt[i] = c; rb.col[i] = c === C.NBL ? C.NBD : C.INK; }
      else if (rb.hot[i] === hd && (c === C.CORAL || c === C.RED)) { rb.lgt[i] = 5; rb.alt[i] = c; rb.col[i] = C.OX; }
      else if (rb.hot[i] === hcl && c === C.NBL) { rb.lgt[i] = 4; rb.alt[i] = C.NBL; rb.col[i] = C.NBD; }
    }
  },
  drawBack(cx, cy) { drawStreetcar(cx, cy, 4.2); },
  drawFront(cx, cy) { drawRain(cx, cy, 100, true); vignette(0.9); },
  update() {
    const t = tick % 1500;
    lightState[4] = (t > 700 && t < 706) || (t > 716 && t < 719) ? 0 : 1;
    lightState[5] = ((tick >> 5) % 23 === 0) ? 0 : 1;
    const ph = tick % 240;                                   // comet trails light one after another
    for (let k = 0; k < 3; k++) lightState[7 + k] = lightState[4] && ph > 30 + k * 30 ? 1 : 0;
    streetcarUpdate(4.2);
  },
  onEnter() {
    setAmbience(0.8, 1, 0.15, 0.05);
    return [];
  }
});
// ------------------------------------------------------------------ Gus
function gusTalk() {
  const pay = (amt) => [['sfx', 'coin'], ['flag', 'paid_cover'], ['flag', 'spent_cover'], ['say', 'doorman', amt === 4 ? "Four. Pleasure doing business with the private sector." : "Enjoy the music. Don't enjoy it loud."],
    ['walk', 'doorman', 6.9, 1.5, 'SW'], ['goal', "Find out what Evelyn left behind at the Blue Comet."]];
  const menu = () => [['choice', [
    { t: "Customer. (pay two dollars)", c: () => !flag('paid_cover') && !flag('gus_private'), d: () => pay(2) },
    { t: "I'm a private detective.", c: () => !flag('paid_cover') && !flag('gus_private'),
      d: [['flag', 'gus_private'], ['say', 'doorman', "I know. Cops don't pay and they don't wait. You're waiting, so you're private."], ['say', 'doorman', "Privates pay double. Four dollars."], ['fn', menu]] },
    { t: "Fine. Four dollars.", c: () => !flag('paid_cover') && flag('gus_private'), d: () => pay(4) },
    { t: "I'm here about Evelyn.", once: 'gus_ev',
      d: [['say', 'doorman', "Everybody's here about Evelyn tonight. Band's playing her set without her. Place is full of people who never bought her a drink."],
          ['say', 'doorman', "She went out the back last night, twenty past twelve. The alley. She always used the alley. Said the front had too many eyes."], ['fn', menu]] },
    { t: "Never mind.", d: [] }
  ]]];
  if (flag('paid_cover')) return [['say', 'doorman', "You're paid up. Go on in."]];
  if (flag('gus_met')) return [['say', 'doorman', "Still out here?"], ['fn', menu]];
  setFlag('gus_met');
  return [['say', 'doorman', "Evening."], ['wait', 0.8], ['say', 'doorman', "Customer, cop, or problem?"], ['fn', menu]];
}
