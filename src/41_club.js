
// =================================================================== ROOM: THE BLUE COMET
// floor x 0..11, y 0..8. Stage in the back-left corner (x 0..4.2, y 0..4.2, 0.45 high).
// Bar along the right back wall (y = 0). Backstage door in the left wall (x = 0) past the stage. Salvi's booth front right.
const CLUB_WALL = (u, z, px, py) => {
  if (z < 0.1) return C.INK;
  if (z < 1.0) return frac(u / 0.6) < 0.05 ? C.PLUM : C.OX;
  if (z < 1.07) return C.BRASS;
  if (z > 2.9) return hash(Math.floor(u / 0.3), Math.floor(z / 0.2)) < 0.12 ? C.BRASS : C.NAV;    // starry frieze
  return frac(u / 0.9) < 0.04 ? C.BRASS : (frac(u / 0.9) < 0.5 ? C.PNV : C.NAV);
};
const CURTAIN = (u, z, px, py) => z > 2.95 ? C.BRASS : (frac(u / 0.28) < 0.35 ? C.NBD : (frac(u / 0.28) < 0.75 ? C.PNV : C.NAV));
const CLUB_TABLES = [[5.3, 3.7], [7.6, 3.9], [6.0, 6.0], [3.0, 7.0]];
defRoom({
  id: 'club', name: 'The Blue Comet', bounds: [0, 0, 11, 8], zmax: 3.5, start: [5.6, 7.3, 'NE'],
  ambient: -1.15,
  dark: (x, y, z) => (z > 2.6 ? -0.4 : 0),
  lights: [
    { x: 2.6, y: 3.3, z: 3.2, r: 2.6, k: 2.6 },                                     // the spotlight on her microphone
    { x: 2.0, y: 1.8, z: 3.0, r: 4.6, k: 1.4, map: BLUW },                           // blue stage wash
    { x: 7.7, y: 0.3, z: 1.9, r: 3.6, k: 1.9 },                                     // back bar
    { x: 9.9, y: 5.6, z: 1.05, r: 2.0, k: 1.4 },                                    // Salvi's booth lamp
    ...CLUB_TABLES.map(t => ({ x: t[0], y: t[1], z: 1.0, r: 1.6, k: 1.1 })),
    { x: 0.2, y: 6.8, z: 2.0, r: 1.6, k: 0.8 }                                      // phone alcove bulb
  ],
  occluders: [[4.95, 0.95, 0, 10.65, 1.6, 1.1]],
  walk: [[0.3, 0.3, 10.8, 7.95]],
  block: [[0, 0, 4.3, 4.3], [4.95, 0, 10.65, 1.65], [8.7, 4.4, 10.9, 4.95], [8.7, 4.4, 9.1, 6.3], [9.4, 5.2, 10.4, 6.1],
          ...CLUB_TABLES.map(t => [t[0] - 0.4, t[1] - 0.4, t[0] + 0.4, t[1] + 0.4])],
  hotspots: [
    { id: 'front', name: 'Front door', at: [5.6, 7.7], pos: [5.6, 8.2], face: 'SW', exitDir: 'down',
      exit: { room: 'nickel', x: 5.3, y: 2.5, dir: 'SE', sfx: 'door' },
      look: "The way out to the Nickel Mile, past a coat-check girl who's seen everything twice." },
    { id: 'backdoor', name: 'Backstage door', at: [0.8, 5.95], pos: [0, 5.45], face: 'NW', exitDir: 'left',
      exit: { room: 'backstage', x: 0.75, y: 3.55, dir: 'SE', sfx: 'door', cond: () => flag('backstage_ok'), no: () => brunoBlock() },
      look: "STAFF ONLY, in brass. The kind of door behind which a nightclub keeps everything it can't sell." },
    { id: 'mic', name: 'Microphone', at: [3.3, 4.7], pos: [2.6, 3.3], face: 'NW',
      look: "Her microphone. They left it standing, and they left the spotlight on it. Spotlight on nobody.",
      use: () => [['say', 'frank', "I'm not singing. Nobody here's drunk enough, including me."]] },
    { id: 'stage', name: 'Bandstand', at: [4.6, 3.2], pos: [2.4, 2.0],
      look: "The house band, playing her set without her. The trumpet's missing. So's the singer." },
    { id: 'comet', name: 'Neon comet', at: [3.5, 4.6], pos: [0, 2.2, 2.2], mark: [0, 2.2, 2.4], noFocus: true,
      look: "The club's comet, in blue tube behind the band. It's the only thing in here that isn't smoking." },
    { id: 'bar', name: 'Bar', at: [6.8, 2.1], pos: [6.8, 1.3],
      look: "Mahogany, brass rail, and a mirror behind the bottles so you can watch yourself make bad decisions." },
    { id: 'bottles', name: 'Back bar', at: [8.4, 2.1], pos: [8.4, 0, 1.6], mark: [8.4, 0, 1.9], noFocus: true,
      look: "Rye, bourbon, gin, and a bottle of something green nobody's ordered since Repeal." },
    { id: 'wreath', name: 'Wreath', at: [10.1, 2.0], pos: [10.1, 1.3], cond: () => !flag('got_wreath'),
      look: "A funeral wreath on the end of the bar. Lilies. The card says 'FOR EVELYN - THE BOYS IN THE BAND.'",
      use: () => wreathTake() },
    { id: 'phone', name: 'Phone alcove', at: [0.8, 6.9], pos: [0, 6.9], face: 'NW',
      look: "The club phone, in a nook by the back door. Private enough for a girl to take a call. Not private enough for her to be sure.",
      use: () => [['say', 'frank', "I've got nobody to call who'd want to hear from me at this hour."]] },
    { id: 'booth', name: "Salvi's booth", at: [8.4, 6.6], pos: [9.9, 5.6], noFocus: true,
      look: "The best booth in the house, with a lamp, a bottle, and a view of the door." }
  ],
  people: {
    bartender: { id: 'lou', actor: 'bartender', name: 'Lou', at: [7.6, 2.0], look: "Lou. Tends bar like he's defusing it.", talk: () => louTalk() },
    salvi: { id: 'mickey', actor: 'salvi', name: 'Mickey Salvi', at: [8.4, 6.4], noTurn: true,
             look: "Mickey Salvi. Owns the Comet, and three other things on the Mile you don't put on a tax form. Tonight he looks like a man who lost something he never had.",
             talk: () => salviTalk() },
    goon: { id: 'bruno', actor: 'goon', name: 'Bruno', look: "Bruno. Mickey's help. Hands like shovels, and about as chatty.",
            talk: () => brunoBlock(), items: { wreath: () => brunoWreath() } },
    pianist: { id: 'pianist', actor: 'pianist', name: 'Pianist', noTurn: true, look: "The piano player. Eyes shut, left hand walking.", talk: () => [['say', 'frank', "He's working. So am I."]] },
    bassist: { id: 'bassist', actor: 'bassist', name: 'Bass player', noTurn: true, look: "The bass player, keeping the whole room upright.", talk: () => [['say', 'frank', "He's working. So am I."]] },
    drummer: { id: 'drummer', actor: 'drummer', name: 'Drummer', noTurn: true, look: "Brushes on the snare, slow, like rain on a car roof.", talk: () => [['say', 'frank', "He's working. So am I."]] },
    teague: { id: 'teague', actor: 'teague', name: 'Roy Teague', noTurn: true, look: "Roy Teague, second trumpet, back on the stand. Playing like somebody's listening.", talk: () => [['say', 'frank', "He's on. It'll keep."]] },
    patronF: { id: 'pf', actor: 'patronF', name: 'Customer', look: "A redhead in red. She's here to be looked at, and she's getting her money's worth.", talk: () => [['say', 'patronF', "Buy your own table, sugar."]] },
    patronM: { id: 'pm', actor: 'patronM', name: 'Customer', look: "Her date. He's here to be seen with her. He's not getting his money's worth.", talk: () => [['say', 'patronM', "Do I know you?"], ['say', 'frank', "No. Keep it that way."]] },
    patronM2: { id: 'pm2', actor: 'patronM2', name: 'Customer', look: "A regular on a stool, working his way to the bottom of something.", talk: () => [['say', 'patronM2', "She sang like... like... ah, forget it."]] },
    patronF2: { id: 'pf2', actor: 'patronF2', name: 'Customer', look: "A woman on her own, watching the door like she's owed a man.", talk: () => [['say', 'patronF2', "You're not him."]] }
  },
  cast: () => {
    const c = [['bartender', 7.6, 0.5, 'SE'], ['salvi', 9.6, 4.98, 'SE', null, { sink: 8 }], ['pianist', 1.25, 1.9, 'NE', 'play', { z: 0.45, sink: 7 }],
      ['bassist', 0.75, 2.75, 'SE', 'play', { z: 0.45 }], ['drummer', 3.45, 0.65, 'SW', 'play', { z: 0.45, sink: 7 }],
      ['patronF', 4.95, 3.3, 'SE'], ['patronM', 5.75, 3.25, 'SW'], ['patronM2', 6.4, 2.05, 'NE', null, { sink: 6 }], ['patronF2', 6.35, 6.45, 'NW', null, { sink: 7 }]];
    c.push(flag('backstage_ok') ? ['goon', 9.7, 6.75, 'SW'] : ['goon', 0.95, 5.5, 'SE']);
    if (flag('teague_on_stage')) c.push(['teague', 2.0, 3.0, 'SE', 'play', { z: 0.45 }]);
    return c;
  },
  build(rb, h) {
    const Wd = 11, D = 8, Ht = 3.4;
    setHot(0);
    roomShell(Wd, D, Ht, carpet(0, 0, Wd, D, C.PLUM, C.OX, C.OX, C.INK), CLUB_WALL, CLUB_WALL);
    rFloor(0.2, 4.3, 4.4, 6.9, 0.003, (x, y) => ((Math.floor(x / 0.4) + Math.floor(y / 0.4)) & 1) ? C.WOOD : C.BRN);       // dance floor
    // ---- stage: curtains on both walls behind it, raised platform with brass nosing
    setHot(h('stage'));
    rWallX(0.003, 0, 4.2, 0.45, 3.2, CURTAIN); rWallY(0.003, 0, 4.2, 0.45, 3.2, CURTAIN);
    rBox(0, 0, 0, 4.2, 4.2, 0.45, (x, y) => ((Math.floor(x / 0.3) + Math.floor(y * 0)) & 1) ? C.WOOD : C.BRN,
      (y, z) => z > 0.39 ? C.BRASS : (frac(y / 0.6) < 0.08 ? C.BRASS : C.INK), (x, z) => z > 0.39 ? C.BRASS : (frac(x / 0.6) < 0.08 ? C.BRASS : C.INK));
    // grand piano (lid raised), drum kit, bass
    rBox(0.45, 0.35, 0.95, 1.95, 1.45, 1.2, (x, y) => (x > 1.9 || y > 1.4) ? C.S1 : C.S0, flat(C.INK), (x, z) => (z < 1.08 && x > 0.6 && x < 1.8) ? (frac((x - 0.6) / 0.05) < 0.55 ? C.CREAM : C.INK) : (z > 1.15 ? C.S1 : C.INK));
    for (const p of [[0.6, 0.5], [1.8, 0.5], [1.2, 1.35]]) rCyl(p[0], p[1], 0.04, 0.45, 0.95, () => C.INK);
    for (let k = 0; k <= 10; k++) rLine3(0.45 + k * 0.15, 0.35, 1.2, 0.45 + k * 0.15, 0.75, 1.9 - k * 0.03, k === 0 || k === 10 ? C.S1 : C.INK);
    rLine3(0.45, 0.75, 1.9, 1.95, 0.75, 1.6, C.S1);
    rCyl(2.9, 1.05, 0.28, 0.45, 0.8, (a, z) => (z < 0.5 || z > 0.75) ? C.CRIM : (a < -0.3 ? C.CREAM : a > 0.5 ? C.CRS : C.STL), () => C.CREAM);   // floor tom
    rCyl(3.3, 1.45, 0.18, 0.95, 1.1, (a) => a < 0 ? C.S2 : C.S1, () => C.CREAM);                                            // snare
    rCyl(3.3, 1.45, 0.02, 0.45, 0.95, () => C.S1);
    rCyl(2.55, 0.65, 0.02, 0.45, 1.5, () => C.S1); rCyl(2.55, 0.65, 0.28, 1.5, 1.52, () => C.BRASS, () => C.BRASS);        // cymbal
    // the comet behind the band
    setHot(h('comet'));
    setMat(MAT_EMIT);
    rWallX(0.006, 1.0, 3.6, 1.5, 3.0, (y, z) => {
      const u = 3.6 - y, dz = z - 2.5, du = u - 0.5, r = Math.hypot(du, dz), a = Math.atan2(dz, du);
      const s = 0.14 + 0.2 * Math.pow(Math.abs(Math.cos(a * 2.5)), 3);
      if (Math.abs(r - s) < 0.03) return C.NBL;
      if (u > 0.7 && u < 2.5 && Math.abs(z - (2.45 - (u - 0.7) * 0.38 + Math.sin(u * 2) * 0.05)) < 0.025) return C.NBL;
      if (u > 0.8 && u < 2.2 && Math.abs(z - (2.3 - (u - 0.8) * 0.4)) < 0.022) return C.NBL;
      return T;
    });
    setMat(0);
    // microphone on its stand
    setHot(h('mic'));
    rCyl(2.6, 3.3, 0.12, 0.45, 0.48, () => C.S2, () => C.S2);
    rLine3(2.6, 3.3, 0.48, 2.6, 3.3, 1.95, C.S2);
    rStamp(2.6, 3.3, 1.95, ['.o.', 'ooo', 'ooo', '.o.'], { o: C.S3 });
    // ---- bar: counter, stools, back bar with lit bottles and a mirror
    setHot(h('bottles'));
    rWallY(0.004, 5.0, 10.6, 1.2, 2.5, (x, z, px, py) => {
      if (Math.abs(z - 1.55) < 0.03 || Math.abs(z - 2.0) < 0.03) return C.WOOD;                                             // shelves
      const shelf = z > 2.0 ? 2.03 : z > 1.55 ? 1.58 : 1.2, bx = Math.floor(x / 0.14), bh = 0.22 + hash(bx, shelf * 10) * 0.12;
      if (z - shelf < bh && frac(x / 0.14) > 0.25 && frac(x / 0.14) < 0.8 && hash(bx, shelf * 7) < 0.8)
        return z - shelf > bh - 0.06 ? C.INK : [C.AMB, C.G2, C.BRN, C.CORAL, C.GLOW][Math.floor(hash(bx, shelf) * 5)];
      return bay(px, py) < 0.15 ? C.S1 : C.S0;                                                                            // mirror
    });
    setHot(h('bar'));
    rBox(4.95, 0.95, 0, 10.65, 1.6, 1.1, (x, y) => (y > 1.52 ? C.BRASS : C.WOOD), (y, z) => z > 1.02 ? C.BRASS : C.DBR,
      (x, z) => (z > 1.02 ? C.BRASS : z < 0.12 ? C.BRASS : (frac(x / 0.5) < 0.1 ? C.BRN : C.DBR)));
    for (let sx = 5.6; sx < 10.4; sx += 0.8) { rCyl(sx, 2.05, 0.03, 0, 0.7, () => C.S2); rCyl(sx, 2.05, 0.18, 0.7, 0.78, () => C.OX, () => C.CRIM); }
    // ---- tables with little red lamps
    setHot(0);
    for (const t of CLUB_TABLES) {
      rCyl(t[0], t[1], 0.04, 0, 0.72, () => C.INK);
      rCyl(t[0], t[1], 0.38, 0.72, 0.76, () => C.INK, () => C.CREAM);
      setMat(MAT_EMIT); rStamp(t[0], t[1], 0.76, ['.rr.', 'rRRr', '.yy.'], { r: C.CRIM, R: C.CORAL, y: C.BRASS }); setMat(0);
    }
    // ---- Salvi's booth: L-shaped red leather, a round table and a lamp
    setHot(h('booth'));
    rBox(8.7, 4.4, 0, 10.9, 4.95, 0.45, flat(C.CRIM), flat(C.OX), flat(C.OX));
    rBox(8.7, 4.4, 0.45, 10.9, 4.58, 1.15, (x) => frac(x / 0.25) < 0.15 ? C.OX : C.CRIM, flat(C.OX), (x, z) => frac(x / 0.25) < 0.1 ? C.PLUM : C.OX);
    rBox(8.7, 4.95, 0, 9.1, 6.3, 0.45, flat(C.CRIM), flat(C.OX), flat(C.OX));
    rCyl(9.9, 5.65, 0.05, 0, 0.72, () => C.INK);
    rCyl(9.9, 5.65, 0.48, 0.72, 0.76, () => C.INK, () => C.CREAM);
    setMat(MAT_EMIT); rStamp(9.9, 5.55, 0.76, ['.rr.', 'rRRr', '.yy.'], { r: C.CRIM, R: C.CORAL, y: C.BRASS }); setMat(0);
    rStamp(10.15, 5.7, 0.76, ['.g.', '.g.', 'ggg', 'ggg'], { g: C.G1 });
    // ---- backstage door and the phone alcove
    setHot(h('backdoor'));
    rWallX(0.004, 5.0, 5.9, 0, 2.2, doorShader(5.0, 5.9, 2.2, C.OX, C.PLUM, C.BRASS));
    rDecalX(0.012, 5.45, 1.8, ['yyyyy'], { y: C.BRASS });
    setHot(h('front'));
    rFloor(5.0, 7.55, 6.2, 8.0, 0.004, (x, y) => y > 7.93 ? C.BRASS : carpet(5.0, 7.55, 6.2, 8.0, C.NBD, C.PNV, C.NAV, C.BRASS)(x, y));
    setHot(h('phone'));
    rWallX(0.004, 6.5, 7.3, 0.9, 2.1, (y, z) => (y < 6.56 || y > 7.24 || z > 2.04) ? C.BRASS : C.INK);
    rDecalX(0.012, 6.9, 1.5, ['.oo.', 'oiio', 'oooo', '.oo.'], { o: C.BLK, i: C.S1 });
    setHot(0);
  },
  drawBack(cx, cy) {
    // wreath on the bar until taken
    if (!flag('got_wreath')) drawStampLive(10.1, 1.25, 1.1, ['..gGGg..', '.gw..Gg.', 'gG....wg', 'gw....Gg', 'gG....gg', '.gGwwGg.', '..gGrg..', '...rr...'],
      { g: C.G1, G: C.G2, w: C.CREAM, r: C.CRIM }, HS(this, 'wreath'), cx, cy);
    // the double bass, in front of its player
    drawStampLive(0.98, 2.98, 0.45, ['...o...', '...o...', '...o...', '..obo..', '.obbbo.', '.obdbo.', '..obo..', '.obbbo.', 'obbdbbo', 'obbdbbo', 'obbbbbo', '.obbbo.', '..ooo..', '...o...'],
      { o: C.DBR, b: C.WOOD, d: C.INK }, HS(this, 'stage'), cx, cy);
    // Teague's trumpet while he's on the stand
    if (flag('teague_on_stage')) drawStampLive(2.25, 3.05, 1.55, ['yyyyy.', '.y..yy', '....yy'], { y: C.BRASS }, 0, cx, cy);
  },
  drawFront(cx, cy) {
    // the spotlight's cone down onto the microphone, and smoke hanging under the ceiling
    const tx = toScreenX(2.6, 3.3), ty = toScreenY(2.6, 3.3, 0.45), top = toScreenY(2.6, 3.3, 3.4);
    for (let y = top; y < ty; y++) {
      const w = Math.round(2 + (y - top) / (ty - top) * 12);
      for (let x = tx - w; x <= tx + w; x++) if (x >= 0 && y >= 0 && x < W && y < H && bay(x, y) < 0.16) fb[y * W + x] = LIT[fb[y * W + x]];
    }
    for (let k = 0; k < 90; k++) {
      const x = Math.floor((hash(k, 91) * 360 + tick * (0.05 + hash(k, 92) * 0.08)) % 360) - 20, y = Math.floor(hash(k, 93) * 70 + Math.sin(tick / 200 + k) * 4);
      for (let d = 0; d < 6; d++) { const px = x + d, py = y + (d >> 2); if (px >= 0 && py >= 0 && px < W && py < H && bay(px, py) < 0.3) fb[py * W + px] = LIT[fb[py * W + px]]; }
    }
  },
  onEnter() {
    setAmbience(0.05, 0, 1, 1);
    if (!flag('club_seen')) {
      setFlag('club_seen');
      return [['say', 'frank', "The Blue Comet. Smoke, brass, and a band playing a dead girl's set without her."],
        ['say', 'frank', "The room reads me in four seconds. Customer, cop, or problem. It hasn't decided."]];
    }
    return [];
  }
});
