
// =================================================================== ROOM: FRANK'S OFFICE (1140 Ferrier St, 2nd floor)
// floor x 0..6, y 0..5. Left back wall x = 0 (door to the landing), right back wall y = 0 (window on Ferrier St).
const OFF_WALL = papered(C.VIO, C.VDK, C.BRN, C.TRIM, C.INK, 0.95, 0.34);
const PHONE_ROWS = ['..ooooo..', '.oiiiiio.', 'oiioooiio', 'oiioeoiio', 'oiiiiiiio', '.ooooooo.'];
const PHONE_UP = ['.........', '..ooooo..', '.oiiiiio.', 'oiioooiio', 'oiioeoiio', 'ooooooooo'];
const ENVELOPE_ROWS = ['cccccc', 'cwwwwc', 'cccccc'];
defRoom({
  id: 'office', name: "Frank's office", bounds: [0, 0, 6, 5], zmax: 3.1, start: [2, 3.5, 'SE'],
  ambient: -1.0,
  dark: (x, y, z, n) => (z > 2.2 ? -0.7 : 0),
  lights: [
    { x: 1.85, y: 1.4, z: 1.05, r: 2.9, k: 2.3 },                                        // green banker's lamp
    { slat: 1, wall: 'y', plane: 0, a0: 3.5, a1: 5.4, z0: 0.95, z1: 2.35, dx: -0.15, dy: 1, dz: -0.42,
      period: 0.2, duty: 0.52, k: 2.2, tag: 1 },                                           // the Mirador's sign through the blinds
    { x: 0.5, y: 3.75, z: 2.9, r: 1.9, k: 0.9 }                                            // spill from the landing transom
  ],
  occluders: [[1.65, 1.15, 0, 3.35, 2.1, 0.8], [0.05, 0.4, 0, 0.6, 1.0, 1.35], [3.6, 0, 0, 5.3, 0.16, 0.62], [5.45, 0.25, 0, 5.95, 0.8, 0.75]],
  walk: [[0.25, 0.25, 5.85, 4.85]],
  block: [[1.65, 1.15, 3.35, 2.1], [0, 0.35, 0.65, 1.05], [2.3, 0.5, 2.7, 0.95], [2.3, 2.55, 2.7, 2.95], [3.5, 1.4, 3.8, 1.7],
          [0.35, 2.45, 0.65, 2.75], [5.45, 0.25, 5.95, 0.8], [3.5, 0, 5.4, 0.3]],
  amb: [0.55, 0.25, 0, 0],
  hotspots: [
    { id: 'door', name: 'Door to the landing', at: [0.45, 3.75], pos: [0, 3.75], face: 'NW', exitDir: 'left',
      exit: { room: 'landing', x: 3.3, y: 1.1, dir: 'SE', sfx: 'door' },
      look: "Frosted glass, my name on it backwards from this side. The door sticks when it rains. It always rains." },
    { id: 'envelope', name: 'Envelope', at: [1.25, 3.75], pos: [0.75, 3.6], cond: () => !flag('got_envelope'),
      look: "An envelope, face down, just inside the door. Somebody slid it under.",
      use: () => [['pose', 'frank', 'reach', 0.5, true], ['flag', 'got_envelope'], ['give', 'envelope'],
        ['say', 'frank', "No stamp. No name."], ['say', 'frank', "And it's dry. Bone dry. It's been pouring since before dawn."], ['clue', 'dry_envelope']] },
    { id: 'desk', name: 'Desk', at: [1.45, 2.45], pos: [2.5, 1.6],
      look: "Two drawers of unpaid bills and one of rye. Business is good.",
      use: () => flag('desk_rye') ? [['say', 'frank', "It's seven in the morning. Even I have standards. They're low, but they're there."]]
        : [['flag', 'desk_rye'], ['pose', 'frank', 'reach', 0.6, true], ['say', 'frank', "Bills. Bills. A bottle of Old Crow with two fingers left in it. I'll save them for later. I've got a feeling about later."]] },
    { id: 'shoebox', name: 'Shoebox of hotel stationery', at: [3.6, 2.3], pos: [2.95, 1.45],
      look: "Ten years of hotel stationery. Husbands write love letters on it, then swear they were never there.",
      use: () => [['pose', 'frank', 'reach', 0.6, true], ['say', 'frank', "Twelve hotels in there. The Ambassador, the Carlyle, the Mirador, the Starlite... Every one of them sure it's the only one."]],
      items: {
        letter: () => hasClue('mirador_paper') ? [['say', 'frank', "Already matched it. The Mirador."]] : [
          ['pose', 'frank', 'reach', 0.8, true], ['say', 'frank', "No ink on the crest, just the pressing. Hold it at an angle to the lamp..."],
          ['say', 'frank', "An M in a ring, two stars. The Hotel Mirador. Across the street."], ['clue', 'mirador_paper']],
        herald: () => [['say', 'frank', "The Herald doesn't print on hotel stationery. It barely prints on paper."]]
      } },
    { id: 'phone', name: 'Telephone', at: [1.75, 2.45], pos: [2.15, 1.5],
      look: () => flag('phone_ringing') ? "It's ringing. At seven in the morning, that's never a wrong number." : "A telephone. It rings when somebody needs something I can't afford to say no to.",
      use: () => flag('phone_ringing') ? rookCall() : flag('took_case') ? [['say', 'frank', "I'll call Rook when I've got something worth his nickel."]]
        : [['say', 'frank', "Nobody I'd call is awake. Nobody who's awake would call me."]] },
    { id: 'lamp', name: 'Desk lamp', at: [1.3, 2.35], pos: [1.85, 1.4],
      look: "Green glass shade. It came with the office. So did the damp.",
      use: () => [['say', 'frank', "I'll leave it on. The room looks better with most of it in the dark."]] },
    { id: 'window', name: 'Blinds', at: [4.5, 0.95], pos: [4.45, 0.1],
      look: "Ferrier Street, through the slats. Across the street the Mirador's sign is still burning at seven in the morning. Rain since before dawn.",
      use: () => [['say', 'frank', "If I open those, the day gets in. I'm not ready for the day."]] },
    { id: 'basket', name: 'Wastebasket', at: [4.0, 2.1], pos: [3.65, 1.55],
      look: () => flag('got_herald') ? "Empty, apart from my better judgement." : "Saturday's Herald, and not much else. I read it so you don't have to.",
      use: () => flag('got_herald') ? [['say', 'frank', "Nothing else in there."]]
        : [['pose', 'frank', 'reach', 0.6, true], ['flag', 'got_herald'], ['give', 'herald'], ['say', 'frank', "Saturday's Herald. Three days old. The day of the lights."]] },
    { id: 'cabinet', name: 'Filing cabinet', at: [1.0, 1.3], pos: [0.35, 0.7], face: 'NW',
      look: "Closed cases. Most of them closed on me.",
      use: () => [['say', 'frank', "Nothing in there about an Evelyn Hart. I'd remember. I remember all the ones that got away."]] },
    { id: 'coatrack', name: 'Coat rack', at: [1.1, 2.7], pos: [0.5, 2.6], face: 'NW',
      look: "My hat's on my head and my coat's on my back. The rack is there for show.",
      use: () => [['say', 'frank', "I'm wearing everything I own that's worth hanging up."]] },
    { id: 'coffee', name: 'Percolator', at: [5.3, 1.3], pos: [5.7, 0.55],
      look: "Yesterday's coffee. It's had all night to think about what it did.",
      use: () => [['say', 'frank', "I've been poisoned before. It was quicker."]] },
    { id: 'photo', name: 'Photograph', at: [0.85, 2.1], pos: [0, 2.1],
      look: "Homicide squad, 1948. Lena Russo's third from the left. I'm the one looking at the door.",
      use: () => [['say', 'frank', "Nine years ago I walked out of that picture. Russo stayed in it."]] },
    { id: 'clock', name: 'Wall clock', at: [1.15, 0.8], pos: [1.1, 0],
      look: "Seven o'clock, give or take. It keeps better time than I do.",
      use: () => [['say', 'frank', "Wound it Sunday. It's the only thing in here that runs."]] },
    { id: 'chair', name: 'Client chair', at: [3.2, 3.3], pos: [2.5, 2.75],
      look: "The client chair. Last sat in by a woman who wanted her husband followed. He was at the pictures. Every night. Alone.",
      use: () => [['say', 'frank', "I think better on my feet. I think worse sitting down, and I don't need the help."]] },
    { id: 'radiator', name: 'Radiator', at: [4.5, 0.95], pos: [4.45, 0.1], noFocus: true,
      look: "It knocks twice an hour, like a landlord.", use: () => [['say', 'frank', "Cold. It's June. It'll be hot in August."]] }
  ],
  props: [
    { x: 0.75, y: 3.6, z: 0, rows: ENVELOPE_ROWS, key: { c: C.CRS, w: C.CREAM }, hot: 'envelope', cond: () => !flag('got_envelope') }
  ],
  build(rb, h) {
    const Wd = 6, D = 5, Ht = 3.0;
    setHot(0);
    roomShell(Wd, D, Ht, planks(0, C.BRN, C.WOOD, C.DBR, 11), OFF_WALL, OFF_WALL);
    rFloor(1.2, 2.3, 5.3, 4.3, 0.005, carpet(1.2, 2.3, 5.3, 4.3, C.OX, C.PLUM, C.PLUM, C.INK));
    // window in the right wall (y = 0): backlit blinds, frame, sill
    setHot(h('window'));
    setMat(MAT_EMIT);
    rWallY(0.001, 3.5, 5.4, 0.95, 2.35, (x, z) => frac((z - 0.95) / 0.2) < 0.52 ? C.TRIM : ((x > 3.9 && x < 4.9 && z > 1.4) ? C.GLOW : C.AMB));
    setMat(0);
    rWallY(0.002, 3.4, 3.5, 0.9, 2.45, flat(C.INK)); rWallY(0.002, 5.4, 5.5, 0.9, 2.45, flat(C.INK));
    rWallY(0.002, 3.4, 5.5, 2.35, 2.45, flat(C.INK));
    rBox(3.4, 0, 0.86, 5.5, 0.12, 0.92, flat(C.WOOD), flat(C.BRN), flat(C.DBR));
    rBox(3.47, 0.14, 2.36, 5.43, 0.18, 2.42, flat(C.S1), flat(C.S0), flat(C.S0));
    rLine3(5.3, 0.17, 2.36, 5.3, 0.17, 1.4, C.CRS);
    // radiator
    setHot(h('radiator'));
    rBox(3.6, 0.02, 0.08, 5.3, 0.16, 0.62, (x) => frac(x / 0.08) < 0.5 ? C.S1 : C.S0, flat(C.S0), (x) => frac(x / 0.08) < 0.5 ? C.S1 : C.S0);
    // wall clock (right wall)
    setHot(h('clock'));
    rDecalY(0.01, 1.1, 2.2, ['.ooooo.', 'occcico', 'occcico', 'occiico', 'occccco', 'occccco', '.ooooo.'], { o: C.INK, c: C.CREAM, i: C.INK });
    // photograph (left wall)
    setHot(h('photo'));
    rDecalX(0.01, 2.1, 1.75, ['oooooooooo', 'oeeEeeEeeo', 'oeEEEeEEeo', 'oeeeeeeeeo', 'oooooooooo'], { o: C.BRN, e: C.ST1, E: C.CRS });
    // door (left wall x = 0)
    setHot(h('door'));
    rWallX(0.004, 3.25, 4.25, 0, 2.2, doorShader(3.25, 4.25, 2.2, C.BRN, C.DBR, C.DBR, C.CRS, 1.2));
    rDecalX(0.012, 3.75, 1.75, ['iii.i.iii', '.........', 'ii.iii.ii'], { i: C.INK });
    // filing cabinet
    setHot(h('cabinet'));
    rBox(0.05, 0.4, 0, 0.6, 1.0, 1.35, flat(C.S1), (y, z) => (frac(z / 0.33) < 0.08 ? C.INK : (frac(z / 0.33) > 0.75 && Math.abs(y - 0.7) < 0.06) ? C.S2 : C.S0), (x, z) => frac(z / 0.33) < 0.08 ? C.INK : C.S1);
    // side table + percolator in the far corner
    setHot(h('coffee'));
    rBox(5.45, 0.25, 0, 5.95, 0.8, 0.75, flat(C.WOOD), flat(C.DBR), flat(C.BRN));
    rCyl(5.7, 0.52, 0.08, 0.75, 1.05, (a) => a < -0.3 ? C.S2 : a > 0.5 ? C.S0 : C.S1, () => C.S2);
    rStamp(5.7, 0.52, 1.05, ['.o.', 'ooo'], { o: C.INK });
    // coat rack
    setHot(h('coatrack'));
    rCyl(0.5, 2.6, 0.04, 0, 1.85, (a) => a < 0 ? C.WOOD : C.DBR);
    rCyl(0.5, 2.6, 0.18, 0, 0.05, () => C.DBR, () => C.BRN);
    rStamp(0.5, 2.6, 1.7, ['o.....o', '.o...o.', '..ooo..'], { o: C.DBR });
    // Frank's chair behind the desk
    setHot(0);
    rBox(2.3, 0.55, 0.42, 2.7, 0.95, 0.5, flat(C.BRN), flat(C.DBR), flat(C.DBR));
    rBox(2.3, 0.55, 0.5, 2.7, 0.61, 1.05, flat(C.BRN), flat(C.DBR), flat(C.BRN));
    rCyl(2.5, 0.75, 0.04, 0, 0.42, () => C.INK);
    // desk: two pedestals and a top
    setHot(h('desk'));
    const deskFace = (x, z) => (Math.abs(frac(z / 0.24) - 0.5) < 0.06 ? C.DBR : Math.abs(frac(z / 0.24) - 0.25) < 0.03 && Math.abs(frac(x / 0.45) - 0.5) < 0.1 ? C.BRASS : C.BRN);
    rBox(1.7, 1.2, 0, 2.15, 2.05, 0.74, flat(C.BRN), flat(C.DBR), deskFace);
    rBox(2.85, 1.2, 0, 3.3, 2.05, 0.74, flat(C.BRN), flat(C.DBR), deskFace);
    rBox(2.15, 1.2, 0.55, 2.85, 1.97, 0.74, flat(C.BRN), flat(C.DBR), flat(C.DBR));
    rBox(1.65, 1.15, 0.74, 3.35, 2.1, 0.8, (x, y) => (x > 2.3 && x < 2.95 && y > 1.45 && y < 1.9) ? C.G1 : (frac(x / 0.5) < 0.03 ? C.BRN : C.WOOD), flat(C.BRN), flat(C.DBR));
    rStamp(3.2, 1.95, 0.8, ['.o.', '.o.', 'obo', 'obo', 'obo'], { o: C.INK, b: C.DBR });
    rStamp(3.02, 2.0, 0.8, ['sss', 'ses'], { s: C.S2, e: C.BRASS });
    // shoebox
    setHot(h('shoebox'));
    rBox(2.75, 1.3, 0.8, 3.15, 1.6, 0.95, flat(C.STL), flat(C.STS), flat(C.TAN));
    rStamp(2.95, 1.45, 0.95, ['cwcw', 'wcwc'], { c: C.CREAM, w: C.WHITE });
    // lamp: brass stand, green shade
    setHot(h('lamp'));
    rCyl(1.85, 1.4, 0.02, 0.8, 1.0, () => C.BRASS);
    rCyl(1.85, 1.4, 0.08, 0.8, 0.83, () => C.BRASS);
    setMat(MAT_EMIT);
    rStamp(1.85, 1.4, 1.0, ['.ggggg.', 'gGGGGGg', 'ggggggg', '.hhhhh.'], { g: C.G1, G: C.G2, h: C.PALEY });
    setMat(0);
    // telephone
    setHot(h('phone'));
    rStamp(2.15, 1.5, 0.8, PHONE_ROWS, { o: C.BLK, i: C.INK, e: C.CRS });
    // client chair
    setHot(h('chair'));
    rBox(2.3, 2.55, 0.42, 2.7, 2.95, 0.48, flat(C.WOOD), flat(C.BRN), flat(C.BRN));
    rBox(2.3, 2.89, 0.48, 2.7, 2.95, 0.95, flat(C.WOOD), flat(C.BRN), flat(C.BRN));
    for (const p of [[2.33, 2.58], [2.67, 2.58], [2.33, 2.92], [2.67, 2.92]]) rCyl(p[0], p[1], 0.02, 0, 0.42, () => C.DBR);
    // wastebasket
    setHot(h('basket'));
    rCyl(3.65, 1.55, 0.15, 0, 0.33, (a) => (Math.floor((a + 1) * 6) & 1) ? C.S0 : C.S1, () => C.INK);
  },
  drawBack(cx, cy) {
    // Herald sticking out of the basket until taken
    if (!flag('got_herald')) drawStampLive(3.65, 1.55, 0.33, ['.sss', 'sisi', 'sss.'], { s: C.CRS, i: C.ST1 }, HS(this, 'basket'), cx, cy);
    // rain on the window glass: short streaks sliding down between slats
    for (let k = 0; k < 26; k++) {
      const x0 = 3.55 + hash(k, 3) * 1.8, sp = 0.25 + hash(k, 4) * 0.5, ph = frac(tick * sp / 180 + hash(k, 5));
      const z = 2.3 - ph * 1.3;
      const sx = toScreenX(x0, 0.001), sy = toScreenY(x0, 0.001, z);
      if (sx < 0 || sy < 0 || sx >= W || sy >= H - 1) continue;
      const p = sy * W + sx;
      if (hb[p] === HS(this, 'window') && fb[p] !== C.TRIM) { fb[p] = C.PALEY; if (fb[p + W] !== C.TRIM) fb[p + W] = C.GLOW; }
    }
    // phone jiggles while ringing
    if (flag('phone_ringing') && ((tick >> 2) & 1)) drawStampLive(2.15, 1.5, 0.8, PHONE_UP, { o: C.BLK, i: C.INK, e: C.CRS }, HS(this, 'phone'), cx, cy);
  },
  drawFront(cx, cy) {
    // dust motes turning in the slat light
    for (let k = 0; k < 18; k++) {
      const x = 3.4 + hash(k, 21) * 2.4 + Math.sin(tick / 240 + k) * 0.2, y = 1.2 + hash(k, 22) * 3.4 + Math.cos(tick / 300 + k * 2) * 0.2;
      const z = 0.4 + frac(hash(k, 23) + tick / 2600) * 1.4;
      if (slatLightAt(this.lights[1], x, y, z, this.occluders) <= 0 || !lightOn(1)) continue;
      const sx = toScreenX(x, y), sy = toScreenY(x, y, z);
      if (sx >= 0 && sy >= 0 && sx < W && sy < H && zb[sy * W + sx] <= x + y) fb[sy * W + sx] = C.PALEY;
    }
  },
  update() {
    // the Mirador's sign stutters now and then
    const t = tick % 900;
    lightState[1] = (t > 610 && t < 616) || (t > 624 && t < 628) ? 0 : 1;
    if (flag('read_letter') && !flag('phone_rang') && !scriptBusy() && tick - (G.flags.letter_t || 0) > 60 * 12) {
      setFlag('phone_rang'); setFlag('phone_ringing'); loopStart('phone'); setFlag('ring_t', tick);
      run([['say', 'frank', "Ninety seconds. Maybe less."]]);
    }
    if (flag('phone_ringing') && !scriptBusy() && tick - G.flags.ring_t > 60 * 14) {
      G.flags.ring_t = tick;
      run([['say', 'frank', ["It's not going to stop.", "Somebody wants me badly. That's a first.", "The phone, Calder."][(tick >> 4) % 3]]]);
    }
  },
  onLeave() { if (flag('phone_ringing')) loopStop('phone'); },
  onEnter() {
    tagMap[1] = LIT;
    setAmbience(0.55, 0.25, 0, 0);
    if (flag('phone_ringing')) loopStart('phone');
    return [];
  }
});
// ------------------------------------------------------------------ the call
function rookCall() {
  loopStop('phone'); setFlag('phone_ringing', false);
  const accept = () => [['choice', [
    { t: "I'll take the case.", d: () => rookEnd() },
    { t: "What does it pay?", d: [['say', 'rook', "Twenty a day and expenses. The expenses had better be expenses."], ['fn', accept]] },
    { t: "Find somebody else.", d: [['say', 'rook', "There isn't anybody else, Calder. That's rather the point."], ['fn', accept]] }
  ]]];
  return [
    ['sfx', 'clunk'], ['pose', 'frank', 'reach', 0.4, true],
    ['say', 'frank', "Calder."],
    ['say', 'rook', "Mr. Calder. Chester Rook, the Herald."],
    ['say', 'rook', "A singer named Evelyn Hart was found dead this morning at the Hotel Mirador. Room seven-fourteen."],
    ['wait', 0.5],
    ['say', 'frank', "Seven-fourteen."],
    ['say', 'rook', "The police will have a gangster in handcuffs by lunch. I'd like someone to look at it who won't be finished by lunch."],
    ['choice', [
      { t: '[Charm] The Herald must be doing well, if it can afford me.', once: 'rook1',
        d: [['say', 'rook', "The Herald is doing terribly. I'm paying out of my own pocket. I trust that tells you something."]] },
      { t: '[Pressure] Why me, Rook? And why the hurry?',
        d: [['say', 'rook', "Because you're the only man in this city who walked off the force rather than lose a file."], ['say', 'rook', "And because she mentioned you. Once."]] },
      { t: '[Empathy] You knew her.',
        d: [['say', 'rook', "She brought me a story last week. Something about the Asterion plant. I told her to come back with proof."], ['wait', 0.6],
            ['say', 'rook', "She's dead, Calder."], ['clue', 'rook_refused'], ['flag', 'rook_trust']] },
      { t: '[Silence] ...', say: '',
        d: [['wait', 1.2], ['say', 'rook', "...She came to me with a story about Asterion. I wanted proof before I'd print a word. I suppose she was out getting it."], ['clue', 'rook_refused']] }
    ]],
    ['say', 'rook', "Will you take it?"],
    ['fn', accept]
  ];
}
function rookEnd() {
  return [
    ['say', 'rook', "Good. Detective Russo has the scene. She won't be pleased to see you."],
    ['say', 'frank', "She never is."],
    ['sfx', 'clunk'],
    ['clue', 'case_714'], ['flag', 'took_case'],
    ['say', 'frank', "'When they ask about the girl in room 714, take the case.'"],
    ['say', 'frank', "Somebody knew. Before the police did. Before Rook did."],
    ['goal', 'Get across the street to the Hotel Mirador, room 714.'],
    ['save']
  ];
}
