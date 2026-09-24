
// =================================================================== ROOM 714
// floor x 0..6, y 0..5. Left wall x = 0: corridor door (key inside, chain cut), transom, connecting door to 712.
// Right wall y = 0: the window (north face, over Ferrier), the dresser and its spiral-cracked mirror.
const R714_WALL = papered(C.TANL, C.TAN, C.WOOD, C.DBR, C.INK, 0.9, 0.45);
const R714_CLUES = ['cold_latch', 'frost_glass', 'mirror_spiral', 'locket_empty', 'ash_tray', 'her_brand', 'receipt_tomorrow', 'clock_217', 'window_latched', 'locked_door', 'shot_heart'];
function r714Count() { return R714_CLUES.filter(hasClue).length; }
function r714Ready() { return hasClue('cold_latch') && r714Count() >= 7; }
defRoom({
  id: 'room714', name: 'Room 714', bounds: [0, 0, 6, 5], zmax: 3.1, start: [0.75, 4.0, 'SE'],
  ambient: -0.8,
  dark: (x, y, z) => (z > 2.3 ? -0.5 : 0),
  lights: [
    { x: 2.6, y: 0.5, z: 1.7, r: 3.6, k: 1.3 },               // grey morning through the window
    { x: 0.28, y: 1.3, z: 0.95, r: 2.2, k: 1.3 },             // bedside lamp, still on
    { x: 5.6, y: 0.45, z: 1.62, r: 2.9, k: 1.5 }              // floor lamp
  ],
  occluders: [[0.12, 1.6, 0, 2.1, 3.0, 0.6], [3.9, 0, 0, 5.1, 0.5, 0.8], [4.3, 2.6, 0, 4.95, 3.25, 0.9]],
  walk: [[0.3, 0.3, 5.8, 4.8]],
  block: [[0, 1.55, 2.15, 3.05], [0, 1.05, 0.55, 1.55], [3.85, 0, 5.15, 0.55], [4.25, 2.55, 5.0, 3.3], [3.9, 2.15, 4.3, 2.55],
          [1.15, 4.0, 1.95, 4.55], [5.45, 0.3, 5.75, 0.6], [1.9, 0, 3.3, 0.3]],
  hotspots: [
    { id: 'door', name: 'Door to the corridor', at: [0.75, 4.0], pos: [0, 4.0], face: 'NW', exitDir: 'left',
      look: () => [['say', 'frank', "Key in the lock, on this side. The chain's hanging off the frame in two pieces. Mulroney's bolt cutters."],
        ['say', 'frank', "Locked from the inside, key and chain. Nobody went out this way."], ['clue', 'locked_door']],
      use: () => r714Leave() },
    { id: 'transom', name: 'Transom', at: [0.75, 3.9], pos: [0, 4.0, 2.4], mark: [0, 4.0, 2.45],
      look: "The transom over the door. Painted shut about six coats ago. A cat couldn't get through it. Neither could a bullet." },
    { id: 'connect', name: 'Connecting door', at: [0.75, 0.9], pos: [0, 0.65], face: 'NW',
      look: "The door through to 712. Bolted on this side. Russo says it's bolted on theirs too.",
      use: () => [['say', 'frank', "Bolted. Painted over the bolt, even. Nobody's used this door since Truman."]] },
    { id: 'window', name: 'Window', at: [2.6, 0.75], pos: [2.6, 0], face: 'NE',
      look: () => [['say', 'frank', "Latched on the inside. Seventh floor, north face. No ledge, no fire escape, nothing but rain."],
        ['say', 'frank', "Down there across Ferrier, second floor, the amber blinds. That's my office. She could see my window from here."], ['clue', 'window_latched']],
      use: () => [['say', 'frank', "I'm not opening it. Whatever came in didn't open it either."]] },
    { id: 'latch', name: 'Window latch', at: [2.6, 0.75], pos: [2.6, 0, 1.45], mark: [2.6, 0, 1.5],
      look: () => [['say', 'frank', "A grey-white bloom around the latch. First I thought scorch."], ['pose', 'frank', 'reach', 0.7, true],
        ['say', 'frank', "It's frost. Cold as a skate blade. In June, in a room with the radiator ticking."], ['clue', 'cold_latch']] },
    { id: 'mirror', name: 'Dresser mirror', at: [4.5, 0.95], pos: [4.5, 0, 1.45], mark: [4.5, 0, 1.6],
      look: () => [['say', 'frank', "Cracked in a spiral, round and round from the middle out. Not broken. Twisted."],
        ['say', 'frank', "And it's shifted in the frame, half an inch left. Like something turned it on the wall."], ['clue', 'mirror_spiral']] },
    { id: 'locket', name: 'Locket', at: [4.3, 0.95], pos: [4.15, 0.3],
      look: () => [['say', 'frank', "Her locket, open on the dresser. The frame's empty."], ['pose', 'frank', 'reach', 0.6, true],
        ['say', 'frank', "Not torn. No scraps under the rim. Somebody lifted the picture out with care. Maybe her."], ['clue', 'locket_empty']] },
    { id: 'handbag', name: 'Handbag', at: [4.8, 0.95], pos: [4.8, 0.3],
      look: () => [['pose', 'frank', 'reach', 0.6, true], ['say', 'frank', "Her handbag. Compact, streetcar token, a Blue Comet set list, and a half pack of Lucky Sevens."],
        ['say', 'frank', "No gun, no letters, no photograph."], ['clue', 'her_brand']] },
    { id: 'ashtray', name: 'Ashtray', at: [3.7, 2.7], pos: [4.1, 2.35],
      look: () => [['say', 'frank', "Two stubs smoked down to the lettering. Pall Royale."], ['clue', 'ash_tray']]
        .concat(hasClue('her_brand') ? [['say', 'frank', "She smoked Lucky Sevens."]] : []) },
    { id: 'armchair', name: 'Armchair', at: [3.9, 3.4], pos: [4.6, 2.9],
      look: "Somebody sat in this chair facing the bed long enough to smoke two cigarettes. The cushion remembers them." },
    { id: 'glass', name: 'Glass of water', at: [0.8, 1.2], pos: [0.18, 1.3],
      look: () => [['say', 'frank', "A glass of water on the nightstand. There's a skin of frost across the top of it."], ['pose', 'frank', 'reach', 0.6, true],
        ['say', 'frank', "It hasn't melted. The room's warm enough to grow orchids."], ['clue', 'frost_glass']] },
    { id: 'clock', name: 'Travel clock', at: [0.8, 1.2], pos: [0.38, 1.3],
      look: () => [['say', 'frank', "A travel clock. Stopped at 2:17."], ['pose', 'frank', 'reach', 0.6, true],
        ['say', 'frank', "It's a wind-up, and it's fully wound. It didn't run down. It stopped."], ['clue', 'clock_217']] },
    { id: 'body', name: 'Evelyn Hart', at: [1.4, 3.35], pos: [1.0, 2.3],
      look: () => [['say', 'frank', "Evelyn Hart. Twenty-nine. She still has her shoes on. She was dressed to go somewhere, or she'd just come back."],
        ['say', 'frank', "One hole, over the heart. Not much blood. She didn't have time to be surprised."], ['clue', 'shot_heart']],
      use: () => [['say', 'frank', "I don't need to touch her to know she's gone. I've touched enough of them to know."]] },
    { id: 'trolley', name: 'Room-service trolley', at: [1.55, 3.6], pos: [1.55, 4.25],
      look: () => [['say', 'frank', "The tray that went up at twenty to three. Coffee for one, never poured. The docket's tucked under the saucer."],
        ['pose', 'frank', 'reach', 0.7, true], ['say', 'frank', "Docket 7-0412. Stamped JUN 19 1957."], ['wait', 0.5],
        ['say', 'frank', "Today's the eighteenth."], ['say', 'frank', "Block capitals. Somebody who didn't want their hand known."], ['clue', 'receipt_tomorrow']] },
    { id: 'painting', name: 'Painting', at: [0.75, 3.4], pos: [0, 3.0, 1.7], mark: [0, 3.0, 1.75], noFocus: true,
      look: "Ships in a harbour, by somebody who'd never seen one. Every room in the Mirador has one. They're all of the same harbour." },
    { id: 'lamp', name: 'Floor lamp', at: [5.3, 1.1], pos: [5.6, 0.45], noFocus: true,
      look: "Left on all night. The hotel will bill her estate for the electric." }
  ],
  people: {
    russo: { id: 'russo', actor: 'russo', name: 'Russo', look: "Russo. Hat off, coat on, notebook out. She's been up since four and it shows only if you know her.",
             talk: () => russoTalk() }
  },
  props: [],
  cast: () => flag('ch2_done') ? [] : [['russo', 3.5, 1.2, 'SW']],
  build(rb, h) {
    const Wd = 6, D = 5, Ht = 3.0;
    setHot(0);
    roomShell(Wd, D, Ht, planks(1, C.BRN, C.WOOD, C.DBR, 41), R714_WALL, R714_WALL);
    rFloor(2.3, 1.1, 5.5, 4.0, 0.004, carpet(2.3, 1.1, 5.5, 4.0, C.PLUM, C.OX, C.OX, C.INK));
    // corridor door with key and cut chain, transom
    setHot(h('door'));
    rWallX(0.004, 3.55, 4.45, 0, 2.2, doorShader(3.55, 4.45, 2.2, C.BRN, C.DBR, C.WOOD));
    rDecalX(0.012, 3.72, 1.05, ['y', 'y', 'o'], { y: C.BRASS, o: C.INK });
    rLine3(0.03, 3.62, 1.55, 0.05, 3.7, 1.3, C.S2); rLine3(0.03, 4.02, 1.55, 0.05, 3.98, 1.35, C.S2);
    setHot(h('transom'));
    rWallX(0.004, 3.6, 4.4, 2.25, 2.62, (y, z) => (y < 3.66 || y > 4.34 || z < 2.3 || z > 2.57) ? C.WOOD : C.TAN);
    // connecting door
    setHot(h('connect'));
    rWallX(0.004, 0.25, 1.05, 0, 2.1, doorShader(0.25, 1.05, 2.1, C.WOOD, C.BRN, C.DBR));
    rDecalX(0.012, 0.35, 1.1, ['yy'], { y: C.S2 });
    // painting over the bed
    setHot(h('painting'));
    rDecalX(0.01, 2.3, 1.75, ['yyyyyyyyyyyyyy', 'ynnnnnnnnnnnny', 'ynnnnwnnnnnnny', 'ynnnnwnnnnwnny', 'ynnnwwwnnnwnny', 'yssssssssssssy', 'ysSsssSsssSssy', 'yyyyyyyyyyyyyy'],
      { y: C.BRASS, n: C.S1, w: C.CREAM, s: C.WM, S: C.WL });
    // ---- window: rain, Ferrier Street below, my own office window across the way
    setHot(h('window'));
    setMat(MAT_EMIT);
    rWallY(0.003, 1.9, 3.3, 0.8, 2.4, (x, z, px, py) => {
      if (x < 1.97 || x > 3.23 || z < 0.87 || z > 2.33 || Math.abs(x - 2.6) < 0.03 || Math.abs(z - 1.6) < 0.03) return C.TRIM;
      if (z < 1.25 && x > 2.05 && x < 2.55) {                                                        // 1140 Ferrier across the street
        if (x > 2.18 && x < 2.42 && z > 0.98 && z < 1.14) return frac(z / 0.035) < 0.5 ? C.AMB : C.TRIM;
        return bay(px, py) < 0.2 ? C.HAIRD : C.INK;
      }
      return vnoise(x * 3, z * 4, 71) + bay(px, py) * 0.3 > 0.9 ? C.S2 : (bay(px, py) < 0.35 ? C.S1 : C.SLT);
    });
    setMat(0);
    rBox(1.85, 0, 0.74, 3.35, 0.14, 0.8, flat(C.WOOD), flat(C.BRN), flat(C.DBR));
    setHot(h('latch'));
    setMat(MAT_EMIT);
    rWallY(0.004, 2.3, 2.9, 1.2, 1.7, (x, z, px, py) => {                                            // the frost bloom round the latch
      const d = Math.hypot(x - 2.6, (z - 1.45) * 1.3);
      return d < 0.2 + hash(px, py) * 0.07 ? (d < 0.1 ? C.WHITE : (bay(px, py) < 0.6 ? C.WL : C.S3)) : T;
    });
    setMat(0);
    rStamp(2.6, 0.02, 1.4, ['yy', 'y.'], { y: C.BRASS });
    setHot(0);
    rBox(2.0, 0.02, 0.08, 3.2, 0.2, 0.6, (x) => frac(x / 0.08) < 0.5 ? C.S1 : C.S0, flat(C.S0), (x) => frac(x / 0.08) < 0.5 ? C.S1 : C.S0);
    // ---- dresser with the spiral-cracked mirror, locket, handbag
    setHot(h('mirror'));
    rWallY(0.004, 4.05, 4.95, 0.95, 1.95, (x, z, px, py) => {
      if (x < 4.1 || x > 4.9 || z < 1.0 || z > 1.9) return C.BRASS;
      const du = x - 4.46, dz = z - 1.47, r = Math.hypot(du, dz), a = Math.atan2(dz, du);
      if (r > 0.04 && Math.abs(frac((r * 14 - a / TAU * 1.0)) - 0.5) < 0.06) return C.WHITE;             // the spiral
      return bay(px, py) < 0.18 ? C.S2 : C.S1;
    });
    setHot(0);
    rBox(3.9, 0, 0, 5.1, 0.5, 0.8, flat(C.WOOD), flat(C.BRN), (x, z) => (Math.abs(frac(z / 0.26) - 0.5) < 0.05) ? C.DBR : (Math.abs(frac(z / 0.26) - 0.25) < 0.03 && Math.abs(frac((x - 3.9) / 0.4) - 0.5) < 0.08 ? C.BRASS : C.BRN));
    setHot(h('locket'));
    rStamp(4.15, 0.3, 0.8, ['y.y', 'yoy', '.y.'], { y: C.BRASS, o: C.INK });
    setHot(h('handbag'));
    rStamp(4.8, 0.3, 0.8, ['.yy.', 'nnnn', 'nNNn', 'nnnn'], { y: C.BRASS, n: C.INK, N: C.PNV });
    // ---- bed, nightstand, and Evelyn
    setHot(0);
    rBox(0, 1.55, 0, 0.14, 3.05, 1.25, flat(C.DBR), (y, z) => (frac((y - 1.55) / 0.3) < 0.12 || z > 1.18) ? C.DBR : C.WOOD, flat(C.BRN));
    rBox(0.14, 1.6, 0.2, 2.1, 3.0, 0.5, flat(C.CREAM), (y, z) => z < 0.3 ? C.DBR : C.STL, (x, z) => z < 0.3 ? C.DBR : C.STL);
    rBox(0.14, 1.6, 0.5, 2.1, 3.0, 0.55, (x, y) => (x > 1.35 ? (frac((x + y) / 0.25) < 0.5 ? C.OX : C.PLUM) : C.CREAM), flat(C.STL), (x, z) => x > 1.35 ? C.OX : C.STL);
    rBox(0.2, 1.75, 0.55, 0.62, 2.85, 0.66, flat(C.WHITE), flat(C.CREAM), flat(C.CREAM));
    setHot(h('body'));
    evelynOnBed();
    setHot(0);
    rBox(0.05, 1.05, 0, 0.5, 1.5, 0.6, flat(C.WOOD), flat(C.BRN), (x, z) => Math.abs(z - 0.4) < 0.03 ? C.DBR : C.BRN);
    rCyl(0.18, 1.2, 0.025, 0.6, 0.85, () => C.BRASS);
    setMat(MAT_EMIT); rStamp(0.18, 1.2, 0.85, ['.ggg.', 'ggggg', '.hhh.'], { g: C.GLOW, h: C.PALEY }); setMat(0);
    setHot(h('clock'));
    rStamp(0.38, 1.33, 0.6, ['.ooo.', 'owiwo', 'owwio', 'ooooo'], { o: C.BRASS, w: C.CREAM, i: C.INK });
    setHot(h('glass'));
    rCyl(0.2, 1.4, 0.05, 0.6, 0.76, (a) => a < -0.3 ? C.S3 : C.S2, () => C.WHITE);
    // ---- armchair and side table with the ashtray
    setHot(h('armchair'));
    rBox(4.3, 2.6, 0, 4.95, 3.25, 0.42, flat(C.G1), flat(C.G0), flat(C.G0));
    rBox(4.78, 2.6, 0.42, 4.95, 3.25, 0.95, flat(C.G1), flat(C.G0), flat(C.G1));
    rBox(4.3, 2.6, 0.42, 4.78, 2.72, 0.62, flat(C.G1), flat(C.G0), flat(C.G0));
    rBox(4.3, 3.13, 0.42, 4.78, 3.25, 0.62, flat(C.G2), flat(C.G1), flat(C.G1));
    setHot(h('ashtray'));
    rCyl(4.1, 2.35, 0.18, 0.5, 0.55, () => C.WOOD, () => C.WOOD);
    rCyl(4.1, 2.35, 0.03, 0, 0.5, () => C.DBR);
    rStamp(4.1, 2.35, 0.55, ['.ooo.', 'oiwio', '.ooo.'], { o: C.S2, i: C.ST1, w: C.CREAM });
    // ---- room-service trolley
    setHot(h('trolley'));
    rBox(1.2, 4.05, 0.72, 1.9, 4.5, 0.76, (x, y) => (Math.hypot(x - 1.72, y - 4.3) < 0.08 ? C.STL : C.CREAM), flat(C.CRS), flat(C.CRS));
    for (const p of [[1.25, 4.1], [1.85, 4.1], [1.25, 4.45], [1.85, 4.45]]) rCyl(p[0], p[1], 0.02, 0, 0.72, () => C.S2);
    rCyl(1.45, 4.25, 0.14, 0.76, 0.86, (a) => a < -0.3 ? C.S3 : C.S2, () => C.S3);
    rStamp(1.72, 4.3, 0.76, ['cc.', 'ccw'], { c: C.CREAM, w: C.WHITE });
    // ---- floor lamp
    setHot(h('lamp'));
    rCyl(5.6, 0.45, 0.02, 0, 1.45, () => C.BRASS);
    rCyl(5.6, 0.45, 0.12, 0, 0.03, () => C.BRASS, () => C.BRASS);
    setMat(MAT_EMIT); rCyl(5.6, 0.45, 0.17, 1.42, 1.72, (a) => a < 0 ? C.GLOW : C.AMB, () => C.PALEY); setMat(0);
    setHot(0);
  },
  update() {
    if (flag('ch2_done') || scriptBusy()) return;
    if (r714Ready() && !flag('amb_warned')) {
      setFlag('amb_warned'); setFlag('amb_t', tick);
      run([['face', 'russo', 'frank'], ['say', 'russo', "Two more minutes, Calder. Then I'm going down to phone the captain, and you're going home."]]);
    } else if (flag('amb_warned') && !flag('ambush') && tick - G.flags.amb_t > 60 * 45) run(ambushScene());
  },
  onEnter() {
    setAmbience(0.3, 0.2, 0, 0);
    if (flag('ch2_done')) return [['say', 'frank', "Quiet now. Just me and her, and the clock that stopped."]];
    if (!flag('r714_seen')) {
      setFlag('r714_seen');
      return [['walk', 'frank', 1.5, 3.5], ['face', 'russo', 'frank'],
        ['say', 'russo', "Evelyn Hart. Twenty-nine. Sang at the Blue Comet on the Nickel Mile."],
        ['say', 'russo', "One shot, through the heart. No gun in the room. Door locked from the inside with the key in it, and the chain on."], ['clue', 'shot_heart'], ['clue', 'locked_door'],
        ['say', 'russo', "My captain said 'gangster' before the M.E. got his hat off. Mickey Salvi. She sang in his club, and he was sweet on her."], ['clue', 'captain_gangster'],
        ['say', 'russo', "So don't make this harder than it needs to be, Frank."],
        ['say', 'frank', "I never make things harder. I just find out how hard they already were."]];
    }
    return [];
  }
});
// Evelyn, lying on the bed, head on the pillow toward the headboard (x = 0)
function evelynOnBed() {
  const zb = 0.55, yc = 2.3;
  rFloor(0.22, 2.08, 0.58, 2.52, 0.665, (x, y) => ((x - 0.42) / 0.19) ** 2 + ((y - 2.3) / 0.21) ** 2 < 1 ? C.HAIRL : T);   // hair on the pillow
  rSphere(0.48, yc, 0.73, 0.085, (nx, ny) => nx * nx + ny * ny > 0.6 ? C.SKM : C.SKL);
  rBox(0.6, yc - 0.17, zb, 1.2, yc + 0.17, zb + 0.14, (x, y) => (Math.hypot(x - 0.82, y - yc + 0.04) < 0.05 ? C.CRIM : C.PNV), flat(C.SLT), flat(C.NAV));
  rBox(0.62, yc + 0.19, zb, 1.12, yc + 0.29, zb + 0.08, flat(C.SKL), flat(C.SKM), flat(C.SKM));     // near arm
  rBox(1.2, yc - 0.2, zb, 1.78, yc + 0.2, zb + 0.12, (x, y) => frac((x + y * 0.3) / 0.18) < 0.15 ? C.SLT : C.PNV, flat(C.SLT), flat(C.NAV));
  rBox(1.78, yc - 0.13, zb, 2.0, yc - 0.03, zb + 0.07, flat(C.SKM), flat(C.SKS), flat(C.SKS));
  rBox(1.78, yc + 0.03, zb, 2.02, yc + 0.13, zb + 0.07, flat(C.SKM), flat(C.SKS), flat(C.SKS));
  rBox(2.0, yc - 0.13, zb, 2.08, yc + 0.13, zb + 0.1, flat(C.INK), flat(C.BLK), flat(C.BLK));
  rFloor(0.72, 2.46, 0.95, 2.62, zb + 0.003, (x, y, px, py) => bay(px, py) < 0.4 ? C.CRIM : T);        // stain on the spread
}
function russoTalk() {
  const menu = () => [['choice', [
    { t: "Who found her?", once: 'ru_found', d: [['say', 'russo', "The maid, at six. Pass key wouldn't do it with the chain on. Mulroney had to go at it with bolt cutters."], ['fn', menu]] },
    { t: "The window?", d: [['say', 'russo', "Latched. Seventh floor, north face, no ledge, no fire escape. Transom's painted shut. The door to 712's bolted on both sides. I checked it myself."], ['clue', 'window_latched'], ['fn', menu]] },
    { t: "Time of death?", once: 'ru_time', d: [['say', 'russo', "The M.E. says between two and three. The clock by the bed says 2:17, if you believe clocks."], ['fn', menu]] },
    { t: "Mickey Salvi?", once: 'ru_salvi', d: [['say', 'russo', "Mickey was sweet on her, and she wasn't sweet on him. In this city that's a motive."], ['say', 'russo', "The captain likes motives he can spell."], ['fn', menu]] },
    { t: "[Empathy] You look tired, Lena.", once: 'ru_soft', d: [['say', 'russo', "I've been up since four, Frank. Don't."], ['wait', 0.4], ['say', 'russo', "...She was twenty-nine."], ['flag', 'russo_soft'], ['fn', menu]] },
    { t: "I'm done here.", c: () => r714Ready(), say: "I've seen enough.", d: () => ambushScene() },
    { t: "Nothing.", d: [] }
  ]]];
  return [['fn', menu]];
}
function r714Leave() {
  if (!flag('ch2_done') && r714Ready()) return ambushScene();
  if (!flag('ch2_done')) return [['face', 'russo', 'frank'], ['say', 'russo', "Leaving already? Mulroney will walk you to the lift."], ['sfx', 'door'], ['fade', 'out', 0.35], ['room', 'corridor7', 6.3, 1.0, 'SW'], ['fade', 'in', 0.35]];
  return exitCmds({ room: 'corridor7', x: 6.3, y: 1.0, dir: 'SW', sfx: 'door' });
}
