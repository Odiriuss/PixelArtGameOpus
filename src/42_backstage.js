
// =================================================================== ROOM: BACKSTAGE AT THE BLUE COMET
// floor x 0..8, y 0..4.5. Dressing room x < 4 (Evelyn's vanity on the right wall, the door to the club on the left wall).
// A cut-down partition at x = 4 with a doorway. Band room x > 4: the lathe, a phonograph, the stage door to the alley.
const BS_WALL = (u, z, px, py) => {
  if (z < 0.1) return C.INK;
  if (z < 0.95) return frac(u / 0.45) < 0.05 ? C.VDK : C.PLUM;
  if (z < 1.0) return C.WOOD;
  return (frac(u / 0.3) < 0.1 || (Math.abs(frac(u / 0.3) - 0.55) < 0.06 && (Math.floor(z / 0.15) & 1))) ? C.VIO : C.MAU;
};
const BAND_WALL = (u, z, px, py) => (z < 0.1 ? C.INK : (frac(z / 0.1) < 0.18 || frac((u + (Math.floor(z / 0.1) & 1) * 0.12) / 0.24) < 0.08) ? C.ST1 : C.STS);
VOICES.stagehand = { color: C.CRS, tag: '(from the stage)', anchor: () => [0, 3.6, 2.4] };
defRoom({
  id: 'backstage', name: 'Backstage', bounds: [0, 0, 8, 4.5], zmax: 3.0, start: [0.75, 3.55, 'SE'],
  ambient: -1.0,
  dark: (x, y, z) => (z > 2.3 ? -0.4 : 0),
  lights: [
    { x: 1.5, y: 0.35, z: 1.5, r: 2.8, k: 2.0 },               // bulbs round her mirror
    { x: 6.0, y: 2.0, z: 2.6, r: 3.4, k: 1.7 },                // bare bulb in the band room
    { x: 7.55, y: 0.25, z: 2.35, r: 0.9, k: 0.6, map: REDW }   // EXIT lamp
  ],
  occluders: [[0.8, 0, 0, 2.2, 0.55, 0.75], [4.5, 0.2, 0, 5.7, 0.9, 0.8]],
  walk: [[0.3, 0.3, 7.8, 4.3]],
  block: [[3.95, 0, 4.1, 2.6], [3.95, 3.6, 4.1, 4.5], [0.75, 0, 2.25, 0.6], [0.1, 0.85, 0.6, 2.65], [2.55, 0.1, 3.65, 0.35],
          [4.45, 0.15, 5.75, 0.95], [6.05, 0.15, 6.65, 0.75], [6.95, 0.95, 7.85, 1.35], [6.7, 0, 7.07, 0.3], [1.3, 0.7, 1.7, 1.1]],
  hotspots: [
    { id: 'clubdoor', name: 'Door to the club', at: [0.7, 3.6], pos: [0, 3.6], face: 'NW', exitDir: 'left',
      exit: { room: 'club', x: 0.8, y: 5.95, dir: 'SE', sfx: 'door' },
      look: "Back out to the club. The band's on the other side of it, playing her set a little too fast." },
    { id: 'stagedoor', name: 'Stage door', at: [7.55, 0.55], pos: [7.55, 0], face: 'NE', exitDir: 'up',
      exit: { room: 'alley', x: 6.4, y: 0.9, dir: 'SE', sfx: 'door' },
      look: "The stage door, out to the alley. The bar's worn bright where people push it. Evelyn pushed it last night at twenty past twelve." },
    { id: 'vanity', name: 'Dressing table', at: [1.5, 1.35], pos: [1.5, 0.3], face: 'NE',
      look: () => [['say', 'frank', "Powder, pins, cold cream, a hat pin long enough to argue with. A photo of the band, curling at the corners."],
        ['say', 'frank', "No lipstick. A singer with no lipstick on her table."], ['clue', 'no_lipstick']],
      use: () => magsGuard() || [['pose', 'frank', 'reach', 0.8, true], ['say', 'frank', "I go through the drawers. Stockings, set lists, three bus transfers, a Blue Comet matchbook with every match still in it."],
        ['say', 'frank', "And no lipstick anywhere. Not a tube, not a smear on a tissue."], ['clue', 'no_lipstick']] },
    { id: 'mirror', name: 'Mirror', at: [1.5, 1.35], pos: [1.5, 0, 1.45], mark: [1.5, 0, 1.6], face: 'NE',
      look: () => [['say', 'frank', "A dressing mirror in a ring of bulbs. It doesn't sit flat."], ['say', 'frank', "It's hung on two brass hooks. Not screwed. It was made to come down."], ['clue', 'hooks']],
      use: () => magsGuard() || mirrorLift() },
    { id: 'rack', name: 'Costume rack', at: [1.0, 1.8], pos: [0.35, 1.75], face: 'NW',
      look: "Her gowns, on the rail in the order she wore them. Midnight blue for the late set. There's a gap where it should be." },
    { id: 'screen', name: 'Dressing screen', at: [3.1, 0.9], pos: [3.1, 0.2], noFocus: true,
      look: "A lacquered screen with cranes on it. The cranes have seen things." },
    { id: 'lathe', name: 'Recording lathe', at: [5.1, 1.35], pos: [5.1, 0.55], face: 'NE',
      look: "A Presto recording lathe, on a bench with three legs and a book under the fourth. Cuts a record while you play." },
    { id: 'acetate', name: 'Acetate disc', at: [5.1, 1.35], pos: [5.25, 0.55], face: 'NE', cond: () => !flag('got_acetate'),
      look: "A single acetate on the lathe's turntable. 'E.H. 6/13' in grease pencil.",
      use: () => acetateTake() },
    { id: 'phono', name: 'Phonograph', at: [6.35, 1.2], pos: [6.35, 0.45], face: 'NE',
      look: "A portable phonograph on a beer crate. The band uses it to learn charts off records.",
      use: () => has('acetate') ? playAcetate() : [['say', 'frank', "Nothing on the platter. Nothing I want to hear, anyway."]],
      items: { acetate: () => playAcetate() } },
    { id: 'setlist', name: 'Chalkboard', at: [5.6, 1.35], pos: [5.7, 0, 1.8], mark: [5.7, 0, 1.9], face: 'NE',
      look: "Tonight's set, in chalk. Her name's rubbed out at the top. The chalk's still on the eraser." },
    { id: 'bclock', name: 'Clock', at: [6.7, 1.3], pos: [6.7, 0, 2.4], mark: [6.7, 0, 2.5], noFocus: true,
      look: () => [['say', 'frank', hasClue('lipstick_message') ? "Six minutes to midnight." : "Twenty past eleven. The night's still young enough to lie about its age."]] },
    { id: 'cases', name: 'Instrument cases', at: [7.4, 1.8], pos: [7.4, 1.15], noFocus: true,
      look: "A trumpet case with ROY stencilled on it, and a bass case leaning like a drunk." }
  ],
  people: {
    mags: { id: 'mags', actor: 'mags', name: 'Mags', at: [2.2, 2.1],
            look: "Mags. Wardrobe, pins in her mouth, and eyes that haven't stopped being red since seven this morning.",
            talk: () => magsTalk(), items: { wreath: () => magsWreath() } },
    teague: { id: 'teague', actor: 'teague', name: 'Roy Teague', at: [5.4, 2.4],
              look: "Roy Teague, second trumpet. White dinner jacket, a lip scar from the horn, and a look like he's been waiting for somebody all day.",
              talk: () => teagueTalk() }
  },
  cast: () => {
    const c = [];
    if (!flag('mags_gone')) c.push(['mags', 2.35, 1.35, 'SW']);
    if (!flag('teague_on_stage')) c.push(['teague', 5.95, 1.6, 'NW']);
    return c;
  },
  build(rb, h) {
    const Wd = 8, D = 4.5, Ht = 2.9;
    setHot(0);
    const boards = planks(1, C.BRN, C.WOOD, C.DBR, 51);
    rFloor(0, 0, Wd, D, 0, (x, y, px, py) => x < 4.05 ? boards(x, y, px, py) : ((frac(x / 0.6) < 0.04 || frac(y / 0.6) < 0.04) ? C.ST0 : C.ST1));
    rWallX(0, 0, D, 0, Ht, BS_WALL); rWallY(0, 0, Wd, 0, Ht, (u, z, px, py) => u < 4.05 ? BS_WALL(u, z, px, py) : BAND_WALL(u, z, px, py));
    rFloor(-0.15, 0, 0, D, Ht, flat(C.INK)); rFloor(-0.15, -0.15, Wd, 0, Ht, flat(C.INK));
    rWallX(Wd, -0.15, 0, -0.3, Ht, flat(C.BLK)); rWallY(D, -0.15, 0, -0.3, Ht, flat(C.BLK));
    rWallX(Wd, 0, D, -0.3, 0, flat(C.BLK)); rWallY(D, 0, Wd, -0.3, 0, flat(C.BLK));
    rFloor(0.8, 1.4, 3.6, 3.2, 0.004, carpet(0.8, 1.4, 3.6, 3.2, C.VDK, C.VIO, C.PLUM, C.INK));
    // cut-down partition at x = 4 with a doorway, posts up to the lintel line
    for (const s of [[0, 2.6], [3.6, 4.5]]) rBox(3.95, s[0], 0, 4.1, s[1], 0.3, flat(C.TRIM), flat(C.MAU), flat(C.VIO));
    for (const y of [2.6, 3.6]) rCyl(4.02, y, 0.05, 0, 2.2, (a) => a < 0 ? C.WOOD : C.BRN);
    // door to the club
    setHot(h('clubdoor'));
    rWallX(0.004, 3.2, 4.0, 0, 2.1, doorShader(3.2, 4.0, 2.1, C.OX, C.PLUM, C.WOOD));
    // costume rack along the left wall
    setHot(h('rack'));
    for (const y of [0.9, 2.6]) rCyl(0.35, y, 0.025, 0, 1.75, () => C.S2);
    rLine3(0.35, 0.9, 1.75, 0.35, 2.6, 1.75, C.S2);
    for (let k = 0; k < 6; k++) {
      const y0 = 1.0 + k * 0.26, col = [C.NBD, C.CRIM, C.G2, C.LAV, C.PNV, C.CREAM][k];
      if (k === 4) continue;                                                              // the gap: the gown she wore
      rWallX(0.5, y0, y0 + 0.22, 0.45, 1.7, (y, z) => z > 1.62 ? C.S1 : (Math.abs(y - y0 - 0.11) < 0.11 - (1.7 - z) * 0.02 ? col : T));
    }
    // dressing screen
    setHot(h('screen'));
    rBox(2.6, 0.18, 0, 3.6, 0.28, 1.75, flat(C.INK), flat(C.PLUM), (x, z) => frac((x - 2.6) / 0.33) < 0.06 ? C.INK : (Math.hypot(frac((x - 2.6) / 0.33) - 0.5, (z - 1.1) * 1.5) < 0.18 ? C.CREAM : C.OX));
    // vanity table, chair, the mirror on two hooks inside a ring of bulbs
    setHot(h('vanity'));
    rBox(0.8, 0, 0, 2.2, 0.55, 0.75, flat(C.CREAM), flat(C.CRS), (x, z) => (Math.abs(z - 0.55) < 0.02 || frac((x - 0.8) / 0.7) < 0.03) ? C.CRS : C.STL);
    rStamp(1.0, 0.25, 0.75, ['.o.', 'ooo', 'ooo'], { o: C.CORAL });
    rStamp(1.25, 0.3, 0.75, ['ww', 'ww'], { w: C.WHITE });
    rLine3(1.85, 0.35, 0.76, 2.1, 0.2, 0.76, C.S3);
    rStamp(2.0, 0.2, 0.75, ['.bb.', 'bbbb', 'bbbb'], { b: C.LAV });
    setHot(0);
    rBox(1.3, 0.7, 0.42, 1.7, 1.1, 0.47, flat(C.PLUM), flat(C.VDK), flat(C.VDK));
    for (const p of [[1.33, 0.73], [1.67, 0.73], [1.33, 1.07], [1.67, 1.07]]) rCyl(p[0], p[1], 0.02, 0, 0.42, () => C.BRASS);
    setHot(h('mirror'));
    rWallY(0.006, 1.1, 1.9, 1.0, 1.9, (x, z, px, py) => (x < 1.14 || x > 1.86 || z < 1.04 || z > 1.86) ? C.BRASS : (bay(px, py) < 0.2 ? C.S3 : C.S2));
    rStamp(1.25, 0.012, 1.98, ['y', 'y'], { y: C.BRASS }); rStamp(1.75, 0.012, 1.98, ['y', 'y'], { y: C.BRASS });
    setMat(MAT_EMIT);
    for (let k = 0; k < 14; k++) {
      const t = k / 14, per = 2 * (0.9 + 1.0), d = t * per;
      let x, z;
      if (d < 0.9) { x = 1.05 + d; z = 1.95; } else if (d < 1.9) { x = 1.95; z = 1.95 - (d - 0.9); } else if (d < 2.8) { x = 1.95 - (d - 1.9); z = 0.95; } else { x = 1.05; z = 0.95 + (d - 2.8); }
      rDecalY(0.01, x, z, ['hh', 'hh'], { h: k === 9 ? C.S2 : C.HOT });                         // one bulb dead
    }
    setMat(0);
    // ---- band room: lathe, phonograph, chalkboard, clock, cases, stage door
    setHot(h('lathe'));
    rBox(4.5, 0.2, 0.75, 5.7, 0.9, 0.8, flat(C.WOOD), flat(C.BRN), flat(C.BRN));
    for (const p of [[4.55, 0.25], [5.65, 0.25], [4.55, 0.85], [5.65, 0.85]]) rCyl(p[0], p[1], 0.03, 0, 0.75, () => C.DBR);
    rBox(4.65, 0.28, 0.8, 5.55, 0.82, 1.0, flat(C.S1), flat(C.S0), flat(C.S0));
    rCyl(5.25, 0.55, 0.22, 1.0, 1.03, () => C.S2, () => C.S2);
    rLine3(4.8, 0.35, 1.18, 5.15, 0.55, 1.08, C.S3); rCyl(4.8, 0.35, 0.03, 1.0, 1.2, () => C.S2);
    setHot(h('phono'));
    rBox(6.1, 0.2, 0, 6.6, 0.7, 0.5, flat(C.WOOD), (y, z) => frac(z / 0.12) < 0.15 ? C.DBR : C.BRN, (x, z) => frac(z / 0.12) < 0.15 ? C.DBR : C.WOOD);
    rBox(6.12, 0.24, 0.5, 6.58, 0.66, 0.66, flat(C.OX), flat(C.PLUM), flat(C.PLUM));
    rCyl(6.35, 0.45, 0.15, 0.66, 0.68, () => C.INK, () => C.INK);
    rBox(6.12, 0.2, 0.66, 6.58, 0.26, 1.05, flat(C.OX), flat(C.PLUM), flat(C.OX));
    setHot(h('setlist'));
    rWallY(0.004, 5.0, 6.4, 1.4, 2.2, (x, z, px, py) => {
      if (x < 5.05 || x > 6.35 || z < 1.45 || z > 2.15) return C.WOOD;
      if (z > 2.0 && x < 5.9) return bay(px, py) < 0.5 ? C.CRS : C.S0;                           // rubbed out
      return (frac(z / 0.1) < 0.3 && hash(Math.floor(x / 0.08), Math.floor(z / 0.1)) < 0.6 && x < 6.1) ? C.CRS : C.S0;
    });
    setHot(h('bclock'));
    wallClockY(0.01, 6.7, 2.4, 0.18, -1, 0, C.CREAM, C.S2, C.INK);
    setHot(h('cases'));
    rBox(7.0, 1.0, 0, 7.8, 1.3, 0.2, flat(C.INK), flat(C.BLK), (x, z) => Math.abs(x - 7.4) < 0.05 ? C.BRASS : C.INK);
    rBox(6.72, 0.05, 0, 7.05, 0.28, 1.8, flat(C.DBR), flat(C.DBR), flat(C.BRN));
    setHot(h('stagedoor'));
    rWallY(0.004, 7.2, 7.9, 0, 2.1, doorShader(7.2, 7.9, 2.1, C.S1, C.S0, C.S2));
    rWallY(0.006, 7.25, 7.85, 1.0, 1.08, flat(C.S3));
    setMat(MAT_EMIT); rWallY(0.01, 7.35, 7.75, 2.24, 2.42, (x, z) => (z > 2.28 && z < 2.38 && x > 7.4 && x < 7.7) ? C.CORAL : C.RED); setMat(0);
    // bare bulb over the band room
    setHot(0);
    rLine3(6.0, 2.0, 2.9, 6.0, 2.0, 2.65, C.INK);
    setMat(MAT_EMIT); rSphere(6.0, 2.0, 2.6, 0.06, () => C.HOT); setMat(0);
  },
  drawBack(cx, cy) {
    if (!flag('got_acetate')) drawStampLive(5.25, 0.55, 1.03, ['.oooo.', 'ooiioo', '.oooo.'], { o: C.BLK, i: C.CRIM }, HS(this, 'acetate'), cx, cy);
    const m = hasClue('lipstick_message') ? 54 + Math.min(5, Math.floor((tick - (G.flags.lip_t || tick)) / 1800)) : 20;
    handsLiveY(0.02, 6.7, 2.4, 0.18, 11, m, C.INK);
  },
  update() {
    if (scriptBusy()) return;
    // Mags gets called away after a while; Teague gets called to the stand
    if (!flag('mags_gone') && !flag('mags_ok') && tick - (G.flags.bs_t || tick) > 60 * 40) run(magsLeaves());
    if (!flag('teague_on_stage') && !flag('got_acetate') && flag('teague_met') && tick - (G.flags.tg_t || tick) > 60 * 55) run(teagueCalled());
  },
  onEnter() {
    setAmbience(0.05, 0, 0.55, 0.12);
    setFlag('stagedoor_open'); setFlag('bs_t', tick);
    if (!flag('bs_seen')) {
      setFlag('bs_seen');
      return [['face', 'mags', 'frank'], ['say', 'mags', "Who let you back here? This is her room. Nobody touches her things."]]
        .concat(has('wreath') ? [['say', 'frank', "The boys in the band sent these."], ['fn', magsWreath]] : [['say', 'frank', "Frank Calder. I'm trying to find out who did it."]]);
    }
    return [];
  }
});
