
// =================================================================== ROOM: THE ALLEY BEHIND THE BLUE COMET (midnight)
// floor x 0..10, y 0..4. Right wall y = 0: the back of the club, stage door, fire escape. Left wall x = 0: the warehouse next door.
// The street is off the front-right edge (x = 10).
const AL_BRICK = bricks(C.HAIRD, C.OX, C.INK, 29);
defRoom({
  id: 'alley', name: 'The alley', bounds: [0, 0, 10, 4], zmax: 6.2, start: [9.2, 2.2, 'NW'], bg: C.NAV, camBias: -10,
  ambient: -0.95,
  dark: (x, y, z) => (z > 3.5 ? -0.4 : 0),
  lights: [
    { x: 6.4, y: 0.35, z: 2.55, r: 3.4, k: 2.0, tag: 10 },                 // caged bulb over the stage door
    { x: 10.6, y: 2.2, z: 2.2, r: 3.6, k: 1.2, map: BLUW },               // the comet's glow from the street
    { x: 0.4, y: 2.6, z: 3.2, r: 2.2, k: 0.7 }                            // a warehouse window
  ],
  occluders: [[8.0, 0.2, 0, 9.3, 0.9, 0.8], [0.8, 0.3, 0, 1.9, 1.2, 0.9]],
  walk: [[0.3, 0.3, 9.95, 3.8]],
  block: [[8.0, 0.2, 9.3, 0.9], [0.8, 0.3, 1.9, 1.2], [0, 3.0, 0.5, 3.4]],
  hotspots: [
    { id: 'street', name: 'The Nickel Mile', at: [9.7, 2.2], pos: [10.4, 2.2], face: 'SE', exitDir: 'right',
      use: () => alleyLeave(),
      look: "The mouth of the alley, and the Mile going by in blue." },
    { id: 'stagedoor', name: 'Stage door', at: [6.4, 0.8], pos: [6.4, 0], face: 'NE', exitDir: 'up',
      exit: { room: 'backstage', x: 7.55, y: 0.55, dir: 'SW', sfx: 'door', cond: () => flag('stagedoor_open'),
              no: () => [['say', 'frank', "Locked. Stage doors open from the inside. That's the point of stage doors."]] },
      look: "The Blue Comet's stage door, under a bulb in a cage. Twenty past twelve last night, Evelyn came out of here." },
    { id: 'fireescape', name: 'Fire escape', at: [3.8, 1.3], pos: [3.8, 0.4, 3.0], mark: [3.8, 0.4, 3.1], face: 'NE',
      look: "The fire escape, two storeys of black iron. The ladder's been let down and never pulled up again." },
    { id: 'rung', name: 'Bottom rung', at: [4.4, 1.3], pos: [4.6, 0.5, 1.3], mark: [4.6, 0.5, 1.4], face: 'NE',
      look: () => [['say', 'frank', "The bottom rung of the ladder. It's furred white."], ['pose', 'frank', 'reach', 0.7, true],
        ['say', 'frank', "Frost. In June. Same as the latch in 714. I'd put my hand in a fire before I'd call that a coincidence."], ['clue', 'rime_rung']] },
    { id: 'cans', name: 'Ash cans', at: [8.6, 1.4], pos: [8.6, 0.55],
      look: "Ash cans, and around them a year of cigarette ends. Lucky Sevens, most of them. Her smoking spot, before she stopped going up on the roof.",
      use: () => [['say', 'frank', "I've been through worse garbage for less. Nothing in it tonight but ash and rain."]],
      items: { letter: () => midnightChoice() } },
    { id: 'crates', name: 'Crates', at: [2.2, 1.6], pos: [1.35, 0.75], noFocus: true,
      look: "Empty crates stamped HAVANA. Mickey's cigars come in the back door, like everything else good on the Mile." },
    { id: 'puddle', name: 'Puddle', at: [4.2, 2.1], pos: [4.2, 2.6],
      look: () => [['say', 'frank', flag('midnight') ? "The puddle has the whole sky in it. I'm not looking at the sky." : "A puddle wide enough to drown a hat in. The stage-door bulb swims in it."]] }
  ],
  cast: () => [],
  build(rb, h) {
    const WX = 10, DY = 4, HT = 6.0;
    setMat(MAT_OUTSIDE);
    const stones = flagstones(C.ST0, C.INK, C.BLK, 37, 0.45);
    rFloor(0, 0, WX, DY, 0, (x, y, px, py) => Math.abs(y - 2.0) < 0.08 ? C.BLK : stones(x, y, px, py));   // a gutter down the middle
    rWallX(WX, 0, DY, -0.3, 0, flat(C.BLK)); rWallY(DY, 0, WX, -0.3, 0, flat(C.BLK));
    setMat(MAT_OUTSIDE | MAT_PUDDLE);
    for (const p of [[4.2, 2.6, 1.2, 0.55], [7.6, 1.8, 0.6, 0.3], [1.8, 3.1, 0.5, 0.35]])
      rFloor(p[0] - p[2], p[1] - p[3], p[0] + p[2], p[1] + p[3], 0.002, (x, y) => ((x - p[0]) / p[2]) ** 2 + ((y - p[1]) / p[3]) ** 2 + (vnoise(x * 3, y * 3, 43) - 0.5) * 0.4 < 1 ? C.NAV : T);
    setMat(MAT_OUTSIDE);
    setHot(0);
    // walls
    rWallX(0, 0, DY, 0, HT, (y, z, px, py) => {
      if (z > 2.8 && z < 3.6 && Math.abs(y - 2.6) < 0.4) return Math.abs(y - 2.6) > 0.34 ? C.BLK : (bay(px, py) < 0.3 ? C.AMB : C.BRN);
      return AL_BRICK(y, z, px, py);
    });
    rWallY(0, 0, WX, 0, HT, (x, z, px, py) => {
      if (Math.abs(x - 9.5) < 0.05) return C.S0;                                     // drainpipe
      return AL_BRICK(x, z, px, py);
    });
    rFloor(-0.15, 0, 0, DY, HT, flat(C.INK)); rFloor(-0.15, -0.15, WX, 0, HT, flat(C.INK));
    // stage door with its caged bulb
    setHot(h('stagedoor'));
    rWallY(0.004, 6.0, 6.8, 0, 2.1, doorShader(6.0, 6.8, 2.1, C.S1, C.S0, C.S2));
    rWallY(0.006, 6.05, 6.75, 1.0, 1.08, flat(C.S2));
    setMat(MAT_EMIT | MAT_OUTSIDE); rStamp(6.4, 0.12, 2.45, ['.i.', 'ihi', 'ihi', '.i.'], { i: C.INK, h: C.HOT }); setMat(MAT_OUTSIDE);
    // fire escape: two landings, rails, and a ladder down to the bottom rung
    setHot(h('fireescape'));
    for (const zl of [2.9, 5.0]) {
      rBox(2.6, 0, zl - 0.06, 5.0, 0.9, zl, (x, y) => (frac(x / 0.15) < 0.5 || frac(y / 0.15) < 0.5) ? C.S0 : C.BLK, flat(C.S0), flat(C.S1));
      rLine3(2.6, 0.9, zl + 0.9, 5.0, 0.9, zl + 0.9, C.S1); rLine3(5.0, 0.0, zl + 0.9, 5.0, 0.9, zl + 0.9, C.S1);
      for (let x = 2.6; x <= 5.01; x += 0.3) rLine3(x, 0.9, zl, x, 0.9, zl + 0.9, C.S0);
    }
    rLine3(2.8, 0.45, 2.9, 4.8, 0.45, 5.0, C.S0, 1);                                 // stair between landings
    for (const yy of [0.35, 0.65]) rLine3(4.6, yy, 1.15, 4.6, yy, 2.9, C.S0);
    for (let z = 1.55; z < 2.9; z += 0.3) rLine3(4.6, 0.35, z, 4.6, 0.65, z, C.S0);
    setHot(h('rung'));
    rLine3(4.6, 0.35, 1.25, 4.6, 0.65, 1.25, C.WL, 1);                                 // the rung, white with rime
    rStamp(4.6, 0.5, 1.18, ['w.w.w'], { w: C.WHITE });
    // ash cans and crates
    setHot(h('cans'));
    for (const c of [[8.35, 0.55], [8.95, 0.6]]) { rCyl(c[0], c[1], 0.28, 0, 0.75, (a) => (Math.floor((a + 1) * 5) & 1) ? C.S1 : C.S0, () => C.S0); rCyl(c[0], c[1], 0.3, 0.75, 0.8, () => C.S1, () => C.S2); }
    rFloor(7.9, 0.95, 9.4, 1.4, 0.003, (x, y, px, py) => hash(px, py) < 0.08 ? C.CREAM : T);
    setHot(h('crates'));
    rBox(0.8, 0.3, 0, 1.9, 1.2, 0.5, flat(C.WOOD), (y, z) => frac(z / 0.1) < 0.2 ? C.DBR : C.BRN, (x, z) => frac(z / 0.1) < 0.2 ? C.DBR : C.WOOD);
    rBox(1.0, 0.4, 0.5, 1.7, 1.0, 0.9, flat(C.WOOD), (y, z) => frac(z / 0.1) < 0.2 ? C.DBR : C.BRN, (x, z) => wallTextHit('HAVANA', 1.02, 0.84, x, z) ? C.INK : (frac(z / 0.1) < 0.2 ? C.DBR : C.WOOD));
    setHot(h('puddle'));
    setMat(MAT_OUTSIDE | MAT_PUDDLE);
    rFloor(3.2, 2.2, 5.2, 3.0, 0.0025, (x, y) => ((x - 4.2) / 1.2) ** 2 + ((y - 2.6) / 0.55) ** 2 + (vnoise(x * 3, y * 3, 43) - 0.5) * 0.4 < 1 ? C.NAV : T);
    setMat(0);
    setHot(h('street'));
    setMat(MAT_EMIT | MAT_OUTSIDE);
    rFloor(9.6, 0.1, 10, 3.95, 0.001, (x, y, px, py) => bay(px, py) < (x - 9.6) * 1.5 ? C.NBD : T);
    setMat(0);
    setHot(0);
  },
  postBake(rb) { skyFill(rb, C.NAV, C.VDK); },
  drawBack(cx, cy) {
    // the green: for a moment the big puddle has the harbour lights in it
    if (G.flags.green_t && tick - G.flags.green_t < 150) {
      const k = 1 - Math.abs((tick - G.flags.green_t) - 75) / 75;
      const hp = HS(this, 'puddle');
      for (let p = 0; p < W * H; p++) if ((mb[p] & MAT_PUDDLE) && hb[p] === hp) { const y = (p / W) | 0, b = bay(p - y * W, y); if (b < k * 0.95) fb[p] = b < k * 0.45 ? C.GRNL : C.G3; }
    }
  },
  drawFront(cx, cy) {
    drawRain(cx, cy, 60, true);
    // a burning letter in Frank's hand
    if (G.flags.burn_t && tick - G.flags.burn_t < 200) {
      const fr = ACT.frank, sx = toScreenX(fr.x, fr.y) + (fr.dir === 1 || fr.dir === 3 ? -5 : 5), sy = toScreenY(fr.x, fr.y, 0) - 22, t = tick - G.flags.burn_t;
      for (let k = 0; k < 14; k++) {
        const up = (hashi(k, t >> 2) % 7), dx = (hashi(k + 5, t >> 2) % 5) - 2;
        pset(sx + dx, sy - up, up < 2 ? C.HOT : up < 4 ? C.GLOW : C.AMB);
      }
      for (let k = 0; k < 3; k++) { const a = ((t + k * 40) % 120) / 120; pset(sx + Math.round(Math.sin(a * 9 + k) * 3), sy - 8 - Math.round(a * 30), C.CRS); }
    }
    vignette(1.0);
  },
  update() { lightState[10] = (tick % 400 > 396 || (tick % 1300 > 1290 && tick % 4 < 2)) ? 0 : 1; },
  onEnter() {
    setAmbience(0.6, 1, 0.25, 0.08);
    if (hasClue('lipstick_message') && !flag('midnight')) {
      setFlag('midnight');
      return [['lb', 1], ['caption', '12:00 A.M.', 2.2], ['lb', 0],
        ['say', 'frank', "Midnight. Somewhere in the club the band is starting the next number without her."],
        ['say', 'frank', "'Burn this after midnight.'"],
        ['goal', "It's after midnight. Burn the letter, or keep it."]];
    }
    if (!flag('alley_seen')) { setFlag('alley_seen'); return [['say', 'frank', "The alley she always used. Too many eyes out front."]]; }
    return [];
  }
});
function alleyLeave() {
  if (flag('midnight') && !flag('letter_decided')) return [['say', 'frank', "Not yet. The note's still in my pocket, and it's after midnight."]];
  return exitCmds({ room: 'nickel', x: 9.25, y: 0.7, dir: 'SE', sfx: 'step' });
}
// ------------------------------------------------------------------ the end of Act I
function midnightChoice() {
  if (flag('midnight') && G.roomId !== 'alley' && !flag('letter_decided')) return [['say', 'frank', "Not in here. Outside, in the alley, where she always went."]];
  if (!flag('midnight') || G.roomId !== 'alley') return [['say', 'frank', "'Burn this after midnight.' It isn't midnight yet. Not by my watch, and not by the note's."]];
  if (flag('letter_decided')) return [['say', 'frank', "I've made my choice. I'll have to live in it."]];
  return [['say', 'frank', "Five lines, my initials, and good paper."], ['choice', [
    { t: "Burn it.", say: '', d: () => endingBurn() },
    { t: "Keep it.", say: '', d: () => endingKeep() },
    { t: "Not yet.", say: '', d: [['say', 'frank', "It'll still be after midnight in a minute."]] }
  ]]];
}
function endingGreen() {
  return [['wait', 1.0], ['sfx', 'hum'], ['fn', () => { setFlag('green_t', tick); return []; }], ['wait', 1.4],
    ['say', 'frank', "Green. In the puddle at my feet, for a second. The same green as Saturday over the harbour."], ['wait', 1.2],
    ['say', 'frank', "I didn't look up."], ['wait', 1.5],
    ['lb', 1], ['fade', 'out', 2.0], ['end']];
}
function endingBurn() {
  return [['flag', 'letter_decided'], ['flag', 'burned_letter'],
    ['pose', 'frank', 'reach', 4.5], ['sfx', 'match'], ['wait', 0.4], ['fn', () => { setFlag('burn_t', tick); return []; }], ['sfx', 'burn'],
    ['say', 'frank', "A match from the Blue Comet book that came in the envelope. It catches on the second try."], ['take', 'letter'],
    ['say', 'frank', "Whoever you are, F.C., I did one thing you told me."], ['wait', 1.5]].concat(endingGreen());
}
function endingKeep() {
  return [['flag', 'letter_decided'], ['flag', 'kept_letter'],
    ['say', 'frank', "No. A man who signs my initials can burn his own letters."],
    ['say', 'frank', "I fold it twice and put it in the inside pocket, next to my heart. It's cold there. Colder than it should be."]].concat(endingGreen());
}
