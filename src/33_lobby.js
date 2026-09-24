
// =================================================================== ROOM: THE MIRADOR LOBBY
// floor x 0..9, y 0..7. Right back wall y = 0: front desk, pigeonholes, the master regulator.
// Left back wall x = 0: lift, phone booth. The street doors are on the cut-away front edge (y = 7).
const LOB_WALL = (u, z, px, py) => {
  if (z > 3.55) return z > 3.9 ? C.TRIM : (Math.abs(frac(u / 0.3) - 0.5) * 0.6 > Math.abs(z - 3.72) ? C.BRASS : C.OX);   // chevron frieze
  if (z > 3.45) return C.BRASS;
  if (z < 1.1) {                                                                  // green marble wainscot
    if (z < 0.12) return C.INK;
    if (z > 1.04) return C.BRASS;
    return vnoise(u * 3 + z * 5, z * 2, 41) > 0.72 ? C.G2 : C.G1;
  }
  const f = frac((u - 0.6) / 1.8);                                                // fluted pilasters
  if (f < 0.17) return (Math.floor((u - 0.6) / 0.075) & 1) ? C.STL : C.TANL;
  return bay(px, py) < 0.06 ? C.STL : C.TANL;
};
const LOB_FLOOR = (x, y, px, py) => {
  const dx = x - 4.5, dy = y - 3.9, r = Math.hypot(dx, dy);
  if (r < 1.25) {                                                                 // compass medallion
    if (r > 1.17) return C.BRASS;
    const a = Math.atan2(dy, dx), star = 0.35 + 0.75 * Math.pow(Math.abs(Math.cos(a * 4)), 6);
    if (r < star) return r < 0.12 ? C.BRASS : C.STL;
    return r > 1.0 ? C.OX : C.PLUM;
  }
  if (x < 0.35 || y < 0.35) return C.OX;                                          // border band
  const fx = frac(x / 0.75), fy = frac(y / 0.75);
  if (fx < 0.04 || fy < 0.04) return C.ST0;
  return ((Math.floor(x / 0.75) + Math.floor(y / 0.75)) & 1) ? C.ST1 : C.STL;
};
defRoom({
  id: 'lobby', name: 'Mirador lobby', bounds: [0, 0, 9, 7], zmax: 4.1, start: [3.6, 5.6, 'NE'],
  ambient: -0.7,
  dark: (x, y, z) => (z > 3.2 ? -0.5 : 0),
  lights: [
    { x: 4.5, y: 3.9, z: 3.1, r: 6.8, k: 2.4 },               // chandelier
    { x: 3.25, y: 1.3, z: 1.5, r: 2.3, k: 1.1 },              // desk lamp
    { x: 0.25, y: 3.6, z: 2.45, r: 2.4, k: 1.1 }, { x: 7.7, y: 0.25, z: 2.45, r: 2.4, k: 1.1 },   // sconces
    { x: 3.7, y: 7.9, z: 2.2, r: 4.2, k: 0.9 }                // grey daylight from the street doors
  ],
  occluders: [[2.8, 1.0, 0, 6.6, 1.7, 1.1], [0, 4.2, 0, 0.9, 5.2, 2.35]],
  walk: [[0.3, 0.3, 8.8, 6.95]],
  block: [[2.75, 0, 6.65, 1.75], [0, 4.15, 0.95, 5.25], [6.35, 4.6, 8.25, 5.2], [8.2, 0.3, 8.8, 0.9], [0.3, 6.1, 0.9, 6.7], [0, 0, 2.75, 0.45]],
  hotspots: [
    { id: 'doors', name: 'Street doors', at: [3.7, 6.7], pos: [3.7, 7.2], face: 'SW', exitDir: 'down',
      use: () => flag('ch2_done') ? driveToNickelMile() : exitCmds({ room: 'ferrier', x: 8.0, y: 2.7, dir: 'SE', sfx: 'door' }),
      look: "The revolving door, and Ferrier Street going round in it." },
    { id: 'desk', name: 'Front desk', at: [4.0, 2.1], pos: [4.4, 1.3],
      look: "Walnut and brass, polished until you can see how much it cost." },
    { id: 'register', name: 'Register', at: [3.9, 2.1], pos: [3.9, 1.35],
      look: () => registerLook(), use: () => registerLook() },
    { id: 'bell', name: 'Desk bell', at: [5.2, 2.1], pos: [5.2, 1.4],
      look: "A brass bell. The kind that makes a clerk hate you in one note.",
      use: () => [['pose', 'frank', 'reach', 0.3, true], ['sfx', 'coin'], ['say', 'clerk', "I am standing right here, sir."]] },
    { id: 'stationery', name: 'Hotel stationery', at: [6.1, 2.1], pos: [6.2, 1.35],
      look: "Mirador letterhead in a rack. The crest is pressed into the corner without ink: an M in a ring, two stars.",
      use: () => [['say', 'frank', "It's the same paper. I'd bet my licence on it. I'd want to hold them side by side first."]],
      items: { letter: () => hasClue('mirador_paper') ? [['say', 'frank', "Same paper, same crest. I knew that already."]]
        : [['pose', 'frank', 'reach', 0.6, true], ['say', 'frank', "Side by side. Same weight, same crest, same blind pressing."], ['say', 'frank', "The note was written on Mirador paper."], ['clue', 'mirador_paper']] } },
    { id: 'pigeon', name: 'Key pigeonholes', at: [4.2, 2.1], pos: [4.1, 0, 2.0], mark: [4.1, 0, 2.2],
      look: "A key and a pigeonhole for every room. Every hook on seven is empty. The police, or somebody who got there first." },
    { id: 'master', name: 'Master clock', at: [5.7, 2.1], pos: [5.7, 0, 2.2], mark: [5.7, 0, 2.6],
      look: () => [['say', 'frank', "A regulator in a walnut case, wired into the wall. 7:41 and a pendulum you could set a bank by."],
        ['say', 'frank', "The brass plate: 'MASTER. Standard Electric Time Co.' Every clock in the building takes its orders from this one."], ['clue', 'master_clock']],
      use: () => [['say', 'frank', "Glass case, and it's locked. It isn't my clock to wind."]] },
    { id: 'wallclock', name: 'Lobby clock', at: [1.5, 1.2], pos: [1.5, 0, 2.6], mark: [1.5, 0, 3.1],
      look: () => [['say', 'frank', hasClue('d_217') ? "Running fine. Everything down here is running fine." : "A sunburst clock, running off the master. 7:41. Same as my watch, for once."]] },
    { id: 'lift', name: 'Lift', at: [0.6, 2.1], pos: [0, 2.1], face: 'NW', exitDir: 'left',
      exit: { room: 'corridor7', x: 1.1, y: 1.3, dir: 'SE', sfx: 'lift' },
      look: "The lift. The needle says it's on seven. Everybody wants to be on seven this morning." },
    { id: 'booth', name: 'Telephone booth', at: [1.3, 4.7], pos: [0.9, 4.7], face: 'NW',
      look: "Oak, glass and a nickel slot. Where husbands phone home to say they're working late.",
      use: () => [['say', 'frank', flag('ch2_done') ? "I've made all the calls I'm going to make today." : "Nobody I want to call yet. And nobody I want to know where I am."]] },
    { id: 'bench', name: 'Bench', at: [7.2, 5.6], pos: [7.2, 4.9],
      look: "Red leather and brass nails. Built for waiting in style.",
      use: () => [['say', 'frank', "If I sit down in a place like this, somebody brings me a bill."]] },
    { id: 'chandelier', name: 'Chandelier', at: [4.5, 5.2], pos: [4.5, 3.9, 3.4], mark: [4.5, 3.9, 3.3], noFocus: true,
      look: "Frosted glass and brass, like a wedding cake the war forgot to eat." },
    { id: 'palm', name: 'Potted palm', at: [7.9, 1.2], pos: [8.5, 0.6], noFocus: true,
      look: "A palm tree, a long way from anywhere palm trees live. We have that in common." }
  ],
  people: {
    clerk: { id: 'pell', actor: 'clerk', name: 'Pell', at: [4.7, 2.1], noTurn: false,
             look: "The day clerk. Pell, says the brass bar on his lapel. A man who has spent his life being told what not to see.",
             talk: () => pellTalk() },
    russo: { id: 'russo', actor: 'russo', name: 'Russo', look: "Lena Russo.", talk: () => [['say', 'russo', "Not now, Frank."]] }
  },
  cast: () => [['clerk', 4.7, 0.6, 'SE']],
  build(rb, h) {
    const Wd = 9, D = 7, Ht = 4.0;
    setHot(0);
    setMat(MAT_GLOSS);
    rFloor(0, 0, Wd, D, 0, LOB_FLOOR);
    setMat(0);
    rWallX(0, 0, D, 0, Ht, LOB_WALL); rWallY(0, 0, Wd, 0, Ht, LOB_WALL);
    rFloor(-0.15, 0, 0, D, Ht, flat(C.INK)); rFloor(-0.15, -0.15, Wd, 0, Ht, flat(C.INK));
    rWallX(Wd, -0.15, 0, -0.3, Ht, flat(C.BLK)); rWallY(D, -0.15, 0, -0.3, Ht, flat(C.BLK));
    rWallX(Wd, 0, D, -0.3, 0, flat(C.BLK)); rWallY(D, 0, Wd, -0.3, 0, flat(C.BLK));
    // entrance mat and the brass threshold at the front edge
    rFloor(2.9, 5.9, 4.5, 6.95, 0.004, carpet(2.9, 5.9, 4.5, 6.95, C.OX, C.PLUM, C.PLUM, C.BRASS));
    setHot(h('doors'));
    rFloor(2.7, 6.95, 4.7, 7.0, 0.006, flat(C.BRASS));
    // ---- lift (left wall)
    setHot(h('lift'));
    rWallX(0.004, 1.5, 2.7, 0, 2.5, (y, z) => {
      if (y < 1.58 || y > 2.62 || z > 2.42) return C.BRASS;
      if (Math.abs(y - 2.1) < 0.02) return C.INK;
      const u = Math.abs(y - 2.1), v = frac((z + u * 0.8) / 0.4);
      return v < 0.1 ? C.BRASS : (z < 0.2 ? C.INK : C.DBR);
    });
    rWallX(0.004, 1.8, 2.4, 2.55, 2.95, (y, z) => {                                      // floor indicator
      const du = 2.1 - y, dz = z - 2.58, d = Math.hypot(du, dz);
      if (d > 0.3 || dz < 0) return T;
      if (d > 0.26) return C.BRASS;
      return (d > 0.2 && Math.abs(frac(Math.atan2(du, dz) / Math.PI * 6 + 0.5) - 0.5) < 0.12) ? C.INK : C.CREAM;
    });
    rDecalX(0.01, 2.8, 1.2, ['bb', 'oo', 'bb'], { b: C.BRASS, o: C.GLOW });
    // ---- phone booth (left wall, near the front)
    setHot(h('booth'));
    rBox(0, 4.2, 0, 0.9, 5.2, 2.35, flat(C.DBR), (y, z, px, py) => {
      if (y < 4.28 || y > 5.12 || z > 2.25 || z < 0.1) return C.WOOD;
      if (Math.abs(y - 4.7) < 0.03 || Math.abs(z - 1.0) < 0.03) return C.BRN;
      if (z > 1.2 && z < 1.6 && Math.abs(y - 4.5) < 0.1) return C.INK;                   // the telephone inside
      if (z > 1.95) return bay(px, py) < 0.3 ? C.GLOW : C.AMB;                             // lit sign panel
      return bay(px, py) < 0.12 ? C.S0 : C.NAV;
    }, (x, z) => (frac(x / 0.3) < 0.1 || z < 0.1 || z > 2.25) ? C.BRN : C.WOOD);
    // ---- front desk (right wall), pigeonholes, master regulator
    setHot(h('pigeon'));
    rWallY(0.004, 3.05, 5.05, 1.35, 2.6, (x, z) => {
      const fx = frac((x - 3.05) / 0.25), fz = frac((z - 1.35) / 0.25);
      if (fx < 0.16 || fz < 0.16) return C.WOOD;
      const cell = Math.floor((x - 3.05) / 0.25) + Math.floor((z - 1.35) / 0.25) * 8;
      if (hash(cell, 3) < 0.25) return C.CREAM;                                           // letters
      return (fz > 0.6 && Math.abs(fx - 0.55) < 0.12 && Math.floor((z - 1.35) / 0.25) !== 3) ? C.BRASS : C.INK;
    });
    setHot(h('master'));
    rBox(5.35, 0, 1.05, 6.05, 0.26, 3.05, flat(C.DBR), flat(C.BRN), (x, z, px, py) => {
      if (x < 5.41 || x > 5.99 || z < 1.11 || z > 2.99) return C.WOOD;
      if (z > 2.25) { const d = Math.hypot(x - 5.7, z - 2.6); return d < 0.27 ? T : C.BRN; }
      if (z > 2.12) return C.BRASS;
      return bay(px, py) < 0.1 ? C.SLT : C.NAV;                                           // pendulum window
    });
    wallClockY(0.265, 5.7, 2.6, 0.27, 7, 41, C.CREAM, C.BRASS, C.INK);
    setHot(h('wallclock'));
    rWallY(0.004, 0.8, 2.2, 1.9, 3.3, (x, z) => {                                        // sunburst behind the lobby clock
      const du = x - 1.5, dz = z - 2.6, d = Math.hypot(du, dz), a = Math.atan2(du, dz);
      return (d < 0.7 && d > 0.44 && Math.abs(frac(a / TAU * 16) - 0.5) < 0.18 * (0.7 - d) / 0.26 + 0.05) ? C.BRASS : T;
    });
    wallClockY(0.006, 1.5, 2.6, 0.42, -1, 0, C.CREAM, C.BRASS, C.INK);
    setHot(h('desk'));
    const deskFront = (u, z) => (z > 0.95 ? C.BRASS : z < 0.08 ? C.INK : frac(u / 0.4) < 0.07 ? C.BRASS : (frac(u / 0.4) < 0.2 ? C.PLUM : C.OX));
    rBox(2.8, 1.0, 0, 6.6, 1.7, 1.08, (x, y) => (y > 1.64 || x > 6.54) ? C.BRASS : C.G1, (y, z) => deskFront(1.7 - y, z), (x, z) => deskFront(x, z));
    // desk lamp, register, bell, stationery rack
    rCyl(3.25, 1.3, 0.02, 1.08, 1.35, () => C.BRASS);
    setMat(MAT_EMIT); rStamp(3.25, 1.3, 1.35, ['.ggggg.', 'gGGGGGg', '.hhhhh.'], { g: C.G1, G: C.G2, h: C.PALEY }); setMat(0);
    setHot(h('register'));
    rStamp(3.9, 1.35, 1.08, ['.wwww.wwww.', 'wiwiw.wiwiw', 'wwwwwowwwww', 'ooooooooooo'], { w: C.CREAM, i: C.S1, o: C.OX });
    setHot(h('bell'));
    rStamp(5.2, 1.4, 1.08, ['.y.', 'yyy', 'ooo'], { y: C.BRASS, o: C.INK });
    setHot(h('stationery'));
    rBox(6.0, 1.2, 1.08, 6.4, 1.5, 1.28, flat(C.CREAM), flat(C.WOOD), (x, z) => z > 1.2 ? C.CREAM : C.WOOD);
    // ---- sconces
    setHot(0);
    setMat(MAT_EMIT);
    rDecalX(0.01, 3.6, 2.45, ['.ggg.', 'ggggg', '.yyy.', '..y..'], { g: C.GLOW, y: C.BRASS });
    rDecalY(0.01, 7.7, 2.45, ['.ggg.', 'ggggg', '.yyy.', '..y..'], { g: C.GLOW, y: C.BRASS });
    setMat(0);
    // ---- bench
    setHot(h('bench'));
    rBox(6.4, 4.65, 0.4, 8.2, 5.15, 0.5, flat(C.CRIM), flat(C.OX), (x, z) => frac(x / 0.3) < 0.08 ? C.BRASS : C.OX);
    rBox(6.4, 4.62, 0.5, 8.2, 4.74, 1.0, (x) => frac(x / 0.3) < 0.08 ? C.BRASS : C.CRIM, flat(C.OX), (x, z) => frac(x / 0.3) < 0.06 || z > 0.95 ? C.BRASS : C.OX);
    for (const lx of [6.5, 8.1]) for (const ly of [4.72, 5.08]) rCyl(lx, ly, 0.03, 0, 0.4, () => C.BRASS);
    // ---- palms
    setHot(h('palm')); palm(8.5, 0.6); setHot(0); palm(0.6, 6.4);
    // ---- chandelier
    setHot(h('chandelier'));
    rLine3(4.5, 3.9, 4.0, 4.5, 3.9, 3.62, C.BRASS);
    rCyl(4.5, 3.9, 0.36, 3.26, 3.34, () => C.BRASS, () => C.BRASS);
    setMat(MAT_EMIT);
    rCyl(4.5, 3.9, 0.3, 3.34, 3.5, (a, z) => Math.abs(frac(a * 3) - 0.5) < 0.1 ? C.BRASS : (z < 3.4 ? C.HOT : C.GLOW), () => C.PALEY);
    rCyl(4.5, 3.9, 0.16, 3.5, 3.62, () => C.GLOW, () => C.BRASS);
    rSphere(4.5, 3.9, 3.2, 0.07, () => C.HOT);
    setMat(0);
    setHot(0);
  },
  drawBack(cx, cy) {
    // the lobby clock keeps real time from 7:41; the master's pendulum swings
    const mins = 41 + Math.floor(tick / 3600);
    handsLiveY(0.03, 1.5, 2.6, 0.42, 7 + Math.floor(mins / 60), mins % 60, C.INK);
    const sw = Math.sin(tick / 60 * Math.PI) * 0.12;
    line3Live(5.7, 0.27, 2.08, 5.7 + sw, 0.27, 1.35, C.BRASS);
    const bx = toScreenX(5.7 + sw, 0.27), by = toScreenY(5.7 + sw, 0.27, 1.32);
    dpset(bx, by, C.BRASS, 6); dpset(bx - 1, by, C.AMB, 6); dpset(bx + 1, by, C.AMB, 6); dpset(bx, by + 1, C.AMB, 6);
    // lift needle: sits on seven, sweeps when the lift moves
    const flr = G.flags.lift_anim ? 7 - Math.min(6, (tick - G.flags.lift_anim) / 20) : 7, a = -Math.PI / 2 + flr / 12 * Math.PI;
    const nx = toScreenX(0.02, 2.1), ny = toScreenY(0.02, 2.1, 2.58);
    line3Live(0.02, 2.1, 2.58, 0.02, 2.1 - Math.sin(a) * 0.2, 2.58 + Math.cos(a) * 0.2, C.CRIM, 0.1);
    dpset(nx, ny, C.INK, 5);
  },
  post(cx, cy) {
    if (flag('russo_hurt') && flag('russo_in_lobby')) {
      const r = ACT.russo, sx = toScreenX(r.x, r.y) + ((r.dir === 1 || r.dir === 3) ? 2 : -2), sy = toScreenY(r.x, r.y, 0) - 21 + (r.sink || 0);
      for (const d of [[0, 0], [1, 0], [0, 1], [-1, 1], [1, 1], [0, 2]]) pset(sx + d[0], sy + d[1], C.CRIM);
    }
  },
  onEnter() {
    setAmbience(0.15, 0, 0, 0);
    if (!flag('lobby_seen')) {
      setFlag('lobby_seen');
      return [['say', 'frank', "The Mirador. Marble you could skate on, and the day clerk's already watching my shoes."]];
    }
    return [];
  }
});
function registerLook() {
  const first = !hasClue('blank_register');
  return [['say', 'frank', "The register. Last night's arrivals, this morning's departures. And the seventh floor..."],
    ['say', 'frank', "Seven lines since the twelfth. Room numbers, no names. Blank as a nun's diary."],
    ['clue', 'blank_register']].concat(first ? [['say', 'clerk', "Please, sir. The book is for staff."]] : []);
}
// ------------------------------------------------------------------ Pell
function pellTalk() {
  const menu = () => [['choice', [
    { t: "Who found her?", once: 'pell_found',
      d: [['say', 'clerk', "Room service went up at twenty to three. Nobody answered, so the waiter left the tray at the door."],
          ['say', 'clerk', "At six the maid tried her pass key. The chain was on. She came down to me, and I called the police."], ['fn', menu]] },
    { t: "Anyone go up after midnight?",
      d: [['say', 'clerk', "Nobody passed this desk after midnight, sir. I was on all night. I'd swear to it on anything you like."], ['clue', 'desk_nobody'], ['fn', menu]] },
    { t: "Tell me about your clocks.",
      d: [['say', 'clerk', "The master regulator, sir, behind me. It runs every clock in the building over the wires."],
          ['say', 'clerk', "It hasn't lost a second since 1931. The manager winds it himself on Sundays."], ['clue', 'master_clock'], ['fn', menu]] },
    { t: "Evelyn Hart. Did you know her?",
      d: [['say', 'clerk', "Miss Hart kept 714 by the month. Musicians' hours. Always said good night to the desk."],
          ['say', 'clerk', "She used the east stairs, mostly. She said the lift made her seasick."], ['flag', 'pell_evelyn'], ['fn', menu]] },
    { t: "Seven rooms on seven and not one name in your book.", c: () => hasClue('blank_register') && !hasClue('block_booking'),
      d: [['say', 'clerk', "I... couldn't say, sir."], ['fn', pellBooking]] },
    { t: "That's all, Mr. Pell.", d: [['say', 'clerk', "Very good, sir."]] }
  ]]];
  if (flag('pell_met')) return [['say', 'clerk', "Sir?"], ['fn', menu]];
  setFlag('pell_met');
  return [['say', 'clerk', "Good morning, sir. I'm afraid the hotel is not receiving visitors this morning."],
    ['say', 'frank', "I'm not visiting. Frank Calder. Private licence. The Herald's paying me to be here."],
    ['say', 'clerk', "...The Herald. How nice for everybody."], ['fn', menu]];
}
function pellBooking() {
  const got = [['say', 'clerk', "A block booking, sir. The whole seventh floor from the twelfth. Government."],
    ['say', 'clerk', "Paid in advance. They don't use the dining room and they don't sign. The manager said not to write it down."], ['clue', 'block_booking']];
  return [['choice', [
    { t: "[Pressure] The police read this book before lunch. I can read it to you first.",
      d: [['say', 'clerk', "Sir, I have a family and a pension..."], ['wait', 0.5], ['say', 'clerk', "...Very well."]].concat(got) },
    { t: "[Charm] You keep a beautiful book, Mr. Pell. A page like that must hurt.", c: () => !flag('pell_charm'),
      d: [['flag', 'pell_charm'], ['say', 'clerk', "It does, sir. You can't imagine."], ['say', 'clerk', "I'm not allowed to say who. I can say they paid in advance and they don't use the dining room."], ['fn', pellBooking]] },
    { t: "[Bribe] Five dollars says you remember who booked it.", c: () => has('cash') && !flag('pell_bribed'),
      d: [['flag', 'pell_bribed'], ['sfx', 'coin'], ['say', 'clerk', "...I never saw that, sir. And you never heard this."]].concat(got) },
    { t: "Never mind.", d: [] }
  ]]];
}
