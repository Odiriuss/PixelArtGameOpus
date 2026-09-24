
// =================================================================== ROOM: SEVENTH-FLOOR CORRIDOR
// floor x 0..12, y 0..2.6. Right back wall y = 0: doors 710-716, the service pantry, the east stairs.
// Left end wall x = 0: the lift. Three slave dials, all stopped at 2:17.
const COR_WALL = papered(C.STL, C.TANL, C.WOOD, C.BRN, C.DBR, 0.95, 0.4);
const COR_DOORS = [['710', 1.9], ['712', 4.1], ['714', 6.3], ['716', 8.5]];
function dialLook(n) {
  setFlag('dial_' + n);
  const seen = ['a', 'b', 'c'].filter(k => flag('dial_' + k)).length;
  const out = [['say', 'frank', ["A slave dial over the lift. 2:17.", "The dial by 714. 2:17.", "The dial by the pantry. 2:17."][['a', 'b', 'c'].indexOf(n)]]];
  if (seen === 3) out.push(['say', 'frank', "Every clock on this floor stopped at the same minute. And they don't have springs to run down. They run off the wires."], ['clue', 'dials_217']);
  else if (seen === 1) out.push(['say', 'frank', "It's twenty to eight."]);
  return out;
}
defRoom({
  id: 'corridor7', name: 'Seventh floor', bounds: [0, 0, 12, 2.6], zmax: 3.1, start: [1.1, 1.3, 'SE'],
  ambient: -0.9,
  dark: (x, y, z) => (z > 2.3 ? -0.4 : 0),
  lights: [
    { x: 3.0, y: 0.25, z: 2.1, r: 2.6, k: 1.5 }, { x: 7.4, y: 0.25, z: 2.1, r: 2.6, k: 1.5 }, { x: 10.6, y: 0.25, z: 2.1, r: 2.4, k: 1.2 },
    { x: 6.3, y: 0.6, z: 1.6, r: 1.6, k: 0.7 }                 // grey daylight out of 714's open door
  ],
  occluders: [],
  walk: [[0.3, 0.35, 11.8, 2.45]],
  block: [[3.95, 0.3, 4.35, 0.62]],
  hotspots: [
    { id: 'lift', name: 'Lift', at: [0.6, 1.3], pos: [0, 1.3], face: 'NW', exitDir: 'left',
      exit: { room: 'lobby', x: 0.75, y: 2.1, dir: 'SE', sfx: 'lift' },
      look: "Brass gate, walnut car. The operator went off shift at seven and nobody replaced him." },
    { id: 'dialA', name: 'Clock over the lift', at: [0.9, 1.3], pos: [0, 1.3, 2.5], mark: [0, 1.3, 2.62], look: () => dialLook('a') },
    { id: 'dialB', name: 'Wall clock', at: [5.2, 0.8], pos: [5.2, 0, 2.3], mark: [5.2, 0, 2.5], look: () => dialLook('b') },
    { id: 'dialC', name: 'Wall clock', at: [9.6, 0.8], pos: [9.6, 0, 2.3], mark: [9.6, 0, 2.5], look: () => dialLook('c') },
    { id: 'd710', name: 'Room 710', at: [1.9, 0.75], pos: [1.9, 0], face: 'NE',
      look: "710. Do Not Disturb on the knob, and quiet on the other side. Government quiet.", use: () => [['say', 'frank', "Locked. The seventh floor doesn't answer knocks this morning."]] },
    { id: 'd712', name: 'Room 712', at: [3.7, 0.9], pos: [4.1, 0], face: 'NE',
      look: "712. The connecting room. A breakfast tray outside the door that nobody's touched.",
      use: () => [['say', 'frank', "Locked. Somebody inside coughed and then decided not to."]] },
    { id: 'tray', name: 'Breakfast tray', at: [3.6, 1.0], pos: [4.15, 0.45],
      look: "Eggs, toast, coffee. Ordered for seven, left at the door, and gone cold waiting. Somebody in 712 lost their appetite.",
      use: () => [['say', 'frank', "I've eaten worse off hotel floors. Not today."]] },
    { id: 'd714', name: 'Room 714', at: [6.3, 0.75], pos: [6.3, 0], face: 'NE', exitDir: 'up',
      exit: { room: 'room714', x: 0.75, y: 4.0, dir: 'SE', sfx: 'door', cond: () => flag('let_in'), no: () => mulroneyStop() },
      look: "714. The chain's hanging in two pieces off the frame inside. Somebody took bolt cutters to it." },
    { id: 'd716', name: 'Room 716', at: [8.5, 0.75], pos: [8.5, 0], face: 'NE',
      look: "716. Empty, by the look of the card. The other neighbour, if you don't count the one who died.", use: () => [['say', 'frank', "Locked."]] },
    { id: 'pantry', name: 'Service pantry', at: [10.3, 0.8], pos: [10.3, 0], face: 'NE',
      look: "SERVICE. Dumbwaiter, a sink, trays, and the room-service carbon book on a nail.", use: () => pantryUse() },
    { id: 'stairs', name: 'East stairs', at: [11.35, 0.8], pos: [11.35, 0], face: 'NE',
      look: () => [['say', 'frank', "EXIT. The east fire stairs. They come down by the kitchens, not the lobby."],
        ['say', 'frank', "You could walk up to seven and down again and the front desk would never know you'd been born."], ['clue', 'east_stairs']],
      use: () => [['say', 'frank', "Seven flights down to the kitchens. I'll take them on the way out if I want to go unseen. Today I want to be seen."], ['clue', 'east_stairs']] }
  ],
  people: {
    cop: { id: 'mulroney', actor: 'cop', name: 'Mulroney', look: "Patrolman Mulroney. Twenty years on the beat and still hasn't found a door he couldn't stand in front of.",
           talk: () => mulroneyTalk() },
    russo: { id: 'russo', actor: 'russo', name: 'Russo', look: "Detective Lena Russo, homicide. Nine years ago we were partners. Now she looks at me like I'm the rain.",
             talk: () => [['say', 'russo', "Inside, Calder. Five minutes."]] }
  },
  cast: () => flag('ch2_done') ? [['cop', 7.0, 0.9, 'SW']] : [['cop', 6.95, 0.85, 'SW']],
  build(rb, h) {
    const Wd = 12, D = 2.6, Ht = 3.0;
    setHot(0);
    roomShell(Wd, D, Ht, planks(0, C.BRN, C.WOOD, C.DBR, 31), COR_WALL, COR_WALL);
    rFloor(0.2, 0.75, Wd - 0.1, 2.0, 0.004, carpet(0.2, 0.75, Wd - 0.1, 2.0, C.OX, C.CRIM, C.PLUM, C.INK));
    // lift
    setHot(h('lift'));
    rWallX(0.004, 0.75, 1.85, 0, 2.3, (y, z) => {
      if (y < 0.83 || y > 1.77 || z > 2.22) return C.BRASS;
      return (frac((y - 0.83) / 0.12) < 0.25 || frac(z / 0.5) < 0.06) ? C.BRASS : C.INK;
    });
    // doors
    for (const [num, x] of COR_DOORS) {
      setHot(h('d' + num));
      rWallY(0.004, x - 0.5, x + 0.5, 0, 2.2, doorShader(x - 0.5, x + 0.5, 2.2, C.BRN, C.DBR, C.WOOD));
      rStamp(x + 0.36, 0.05, 1.0, ['yy', 'y.'], { y: C.BRASS });
      if (num === '714') rWallY(0.006, x - 0.44, x + 0.44, 0.06, 2.14, (u, z, px, py) => z > 1.9 ? C.DBR : (bay(px, py) < 0.2 ? C.S1 : C.S0));  // door open, grey room beyond
    }
    // number plates: tiny text above each door
    for (const [num, x] of COR_DOORS) { setHot(h('d' + num)); rWallY(0.013, x - 0.55, x + 0.55, 2.22, 2.72, (u, z) => wallTextHit(num, x - textWidth(num) / 32, 2.68, u, z) ? C.BRASS : T); }
    // pantry + east stairs
    setHot(h('pantry'));
    rWallY(0.004, 9.95, 10.65, 0, 2.1, doorShader(9.95, 10.65, 2.1, C.S0, C.INK, C.S1, C.SLT, 1.4));
    setHot(h('stairs'));
    rWallY(0.004, 11.0, 11.7, 0, 2.1, doorShader(11.0, 11.7, 2.1, C.OX, C.PLUM, C.S1));
    setMat(MAT_EMIT);
    rWallY(0.01, 11.1, 11.6, 2.2, 2.42, (u, z) => (z > 2.26 && z < 2.36 && u > 11.16 && u < 11.54) ? C.CORAL : C.RED);
    setMat(0);
    // slave dials, all at 2:17
    setHot(h('dialA')); wallClockX(0.01, 1.3, 2.62, 0.2, 2, 17, C.CREAM, C.BRASS, C.INK);
    setHot(h('dialB')); wallClockY(0.01, 5.2, 2.5, 0.2, 2, 17, C.CREAM, C.BRASS, C.INK);
    setHot(h('dialC')); wallClockY(0.01, 9.6, 2.5, 0.2, 2, 17, C.CREAM, C.BRASS, C.INK);
    // sconces
    setHot(0); setMat(MAT_EMIT);
    for (const sx of [3.0, 7.4, 10.6]) rDecalY(0.01, sx, 2.05, ['.ggg.', 'ggggg', '.yyy.', '..y..'], { g: C.GLOW, y: C.BRASS });
    setMat(0);
    // tray outside 712
    setHot(h('tray'));
    rBox(3.95, 0.3, 0, 4.35, 0.62, 0.05, (x, y) => (Math.hypot(x - 4.08, y - 0.44) < 0.08) ? C.CREAM : (Math.hypot(x - 4.25, y - 0.4) < 0.05 ? C.DBR : C.S2), flat(C.S1), flat(C.S1));
    rCyl(4.25, 0.4, 0.05, 0.05, 0.12, () => C.CREAM, () => C.DBR);
    setHot(0);
  },
  onEnter() {
    setAmbience(0.1, 0, 0, 0);
    if (!flag('cor_seen')) {
      setFlag('cor_seen');
      return [['say', 'frank', "Seven. Quiet as a church on a weekday. The kind of quiet somebody pays for."]];
    }
    return [];
  }
});
function mulroneyStop() {
  if (flag('ch2_done')) return [['say', 'cop', "Go on in, Calder. She said you could have your five minutes. Just don't take anything."]];
  return [['face', 'cop', 'frank'], ['say', 'cop', "Whoa, whoa. Nobody goes in. Detective Russo's orders."], ['fn', russoAtDoor]];
}
function mulroneyTalk() {
  if (flag('ch2_done')) return [['say', 'cop', "It's a quiet floor now, Calder. I'd like it to stay that way."]];
  if (flag('let_in')) return [['say', 'cop', "Two bolt cutters and a sergeant's temper, that chain took. She's waiting on you."]];
  return [['say', 'cop', "Calder. Heard you went private. Heard it didn't take."], ['say', 'frank', "Heard right. Is Russo in there?"], ['fn', russoAtDoor]];
}
// Russo comes to the door: the first reading of Frank
function russoAtDoor() {
  const letIn = [['say', 'russo', "Five minutes. You touch nothing, you tell me everything, and you're gone before the captain gets here."],
    ['flag', 'let_in'], ['walk', 'russo', 6.3, 0.35, 'NE'], ['remove', 'russo'], ['goal', "Look over room 714 while Russo lets you."]];
  return [
    ['say', 'cop', "Detective! It's Calder."], ['wait', 0.4],
    ['place', 'russo', 6.3, 0.35, 'SE'], ['sfx', 'door'], ['walk', 'russo', 6.0, 1.05], ['face', 'russo', 'frank'], ['face', 'frank', 'russo'],
    ['say', 'russo', "Frank Calder. The sun's barely up and you're already standing where you're not wanted."],
    ['say', 'russo', "Who called you?"],
    ['choice', [
      { t: "[Truth] Show her the note.", c: () => has('letter'),
        d: [['pose', 'frank', 'reach', 0.8, true], ['wait', 0.6],
            ['say', 'russo', "'Do not let Russo leave the hotel alone.'"], ['wait', 0.5], ['say', 'russo', "Where did you get this?"],
            ['say', 'frank', "Under my door at ten to seven. Before anybody knew there was a girl in 714."],
            ['say', 'russo', "...It's signed with your initials, Frank."], ['say', 'frank', "I noticed."], ['flag', 'letter_shown']].concat(letIn) },
      { t: "[Lie] Nobody. I was in the neighbourhood.",
        d: [['say', 'russo', "You live across the street, Calder. That's not a neighbourhood, that's an alibi."], ['flag', 'lied']].concat(letIn) },
      { t: "Chester Rook, the Herald. He's paying.",
        d: [['say', 'russo', "Rook. Of course. The Herald wants a story, and my captain wants a gangster. Everybody wants something this morning."]].concat(letIn) }
    ]]
  ];
}
function pantryUse() {
  if (hasClue('carbon_book')) return [['say', 'frank', "7-0411, and a blank pad waiting for 7-0412. It's not going anywhere."]];
  if (!hasClue('receipt_tomorrow')) return [['pose', 'frank', 'reach', 0.5, true], ['say', 'frank', "Trays, a sink, a dumbwaiter, and a carbon book full of other people's breakfasts. Nothing I need. Yet."]];
  return [['pose', 'frank', 'reach', 0.8, true], ['sfx', 'page'],
    ['say', 'frank', "The carbon book. Every room-service docket on seven, in order. The last one written is 7-0411. Coffee for two, 710, yesterday."],
    ['say', 'frank', "The pad underneath is blank. The next docket in it is 7-0412."], ['clue', 'carbon_book'],
    ['say', 'frank', "That's the number on the receipt in 714. The receipt dated tomorrow."]];
}
