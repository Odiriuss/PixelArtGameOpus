
// =================================================================== STORY: ITEMS
// Calendar: the lights were 02:17, Saturday 15 June 1957. Today is Tuesday 18 June. Evelyn died at 02:17 this morning.
function item(id, def) { ITEMS[id] = def; }
item('envelope', {
  name: 'Envelope', icon: ['..............', '..............', 'oooooooooooooo', 'occcccccccccco', 'owcccccccccwco', 'ocwcccccccwcco',
    'occwcccccwccco', 'occcwcccwcccco', 'occccwcwccccco', 'occcccwcccccco', 'occcccccccccco', 'oooooooooooooo'],
  look: "Plain envelope. No stamp, no name. Somebody slid it under the door. It's bone dry.",
  use: () => [['say', 'frank', "Let's see who thinks I'm worth writing to."], ['sfx', 'page'], ['take', 'envelope'],
    ['give', 'letter'], ['give', 'cash'], ['give', 'matchbook'],
    ['say', 'frank', "Two hundred dollars in a bank band. A matchbook from the Blue Comet. And a note."]]
});
item('letter', {
  name: 'Note', icon: ['...ccccccccc..', '...cwwwwwwwc..', '...ciiiiicwc..', '...cwwwwwwwc..', '...ciiiicwwc..', '...cwwwwwwwc..',
    '...ciiiiiiwc..', '...cwwwwwwwc..', '...ciiiwwwwc..', '...cwwwwwwwc..', '...cwwwwiiic..', '...ccccccccc..'],
  look: () => [['doc', 'letter'], ['fn', afterLetter]],
  use: () => [['doc', 'letter'], ['fn', afterLetter]], useOn: true
});
function afterLetter() {
  if (flag('midnight') && G.roomId === 'alley' && !flag('letter_decided')) return midnightChoice();
  if (flag('read_letter')) return [['say', 'frank', "Same five lines. They don't get friendlier."]];
  setFlag('read_letter'); setFlag('letter_t', tick);
  return [['clue', 'letter'], ['say', 'frank', "Signed F.C. My initials."], ['say', 'frank', "Somebody's idea of a joke. Or a threat that doesn't know how to spell it."],
    ['say', 'frank', "And it's on good paper. There's a crest pressed into the corner. No ink."]];
}
item('cash', {
  name: 'Cash', icon: ['..............', '..gggggggggg..', '.gGGGGGGGGGGg.', '.gGgGGyyGGgGg.', '.gGGGGyyGGGGg.', '.gGgGGyyGGgGg.',
    '.gGGGGyyGGGGg.', '.ggggggggggggg', '..gGGGGGGGGGg.', '..gggggggggg..', '..............', '..............'],
  look: () => [['say', 'frank', "Two hundred dollars in a First Meridian counting band. The band's stamped the fifteenth. Three days ago."], ['clue', 'bank_band']],
  useOn: true
});
item('matchbook', {
  name: 'Matchbook', icon: ['..............', '...NNNNNNNN...', '...NnnNNNNN...', '...NNnnNNNN...', '...NNNnnhNN...', '...NNNNNhhN...',
    '...NNNNNNNN...', '...iiiiiiii...', '...ccccccccc..', '...rrrrrrrr...', '..............', '..............'],
  look: () => [['say', 'frank', "A Blue Comet matchbook. Nightclub on the Nickel Mile. Two matches gone."], ['clue', 'matchbook']],
  useOn: true
});
item('herald', {
  name: "Saturday's Herald", icon: ['..............', '.ssssssssssss.', '.siiiiiiiiiis.', '.ssssssssssss.', '.siiisssiiiis.', '.sssssssssiss.',
    '.siiisssiiiis.', '.sssssssssiss.', '.siiisssiiiis.', '.ssssssssssss.', '..............', '..............'],
  look: () => [['doc', 'herald'], ['fn', () => addClue('herald_lights') ? [['say', 'frank', "Saturday. The morning of the lights."]] : []]],
  use: () => [['doc', 'herald'], ['fn', () => addClue('herald_lights') ? [['say', 'frank', "Saturday. The morning of the lights."]] : []]], useOn: true
});
item('licence', {
  name: 'P.I. licence', icon: ['..............', '.pppppppppppp.', '.pMMpiiiiiiip.', '.pmmppppppppp.', '.pmmpiiiiiiip.', '.ppppppppppp..',
    '.piiiiiiiiiip.', '.pppppppppppp.', '..............', '..............', '..............', '..............'],
  look: "City of New Meridian, private investigator, Frank J. Calder. It's cost me more than it's earned.", useOn: true
});
item('wallet', {
  name: 'Wallet', icon: ['..............', '..............', '.dddddddddddd.', '.dbbbbbbbbbbd.', '.dbbbbbbbbbbd.', '.ddddddddgggd.',
    '.dbbbbbbbbbbd.', '.dbbbbbbbbbbd.', '.dddddddddddd.', '..............', '..............', '..............'],
  look: () => [['say', 'frank', "My own money. Eleven dollars and a pawn ticket." + (flag('spent_cover') ? " Nine now." : "")]], useOn: true
});

// =================================================================== STORY: DOCUMENTS
DOCS.letter = { w: 210, crest: true, text: [
  'Calder -', '',
  'When they ask about the girl in room 714, take the case.',
  'Do not let Russo leave the hotel alone.',
  'The dead man in the blue suit is lying.',
  'At 2:17, do not look at the sky.',
  'Burn this after midnight.'
], sig: '- F.C.' };
DOCS.herald = { w: 230, paper: C.STL, title: 'NEW MERIDIAN HERALD  -  SAT. JUNE 15, 1957', text: [
  'LIGHTS OVER HARBOUR "HYSTERIA," SAYS MAYOR', '',
  'Hundreds report silent green lights over Blackwater Bay at 2:17 a.m. Radio static across South Dock. ' +
  'Crown Energy: Asterion station "performing exactly as designed." Mayor Hale urges calm and an early night.'
] };

// =================================================================== STORY: CLUES
function clue(id, title, text) { CLUES[id] = { title, text }; }
clue('street_door', 'Street door was locked', "I unlocked the street door myself at ten to seven. The landlord has the only other key, and he's in Florida.");
clue('dry_envelope', 'Envelope bone dry', "Raining since before dawn, and the envelope under my door is bone dry.");
clue('letter', 'The note: five warnings', "Room 714. Russo, not alone. The dead man in the blue suit is lying. 2:17, don't look at the sky. Burn this after midnight. Signed F.C.");
clue('bank_band', 'Cash banded Saturday', "Two hundred dollars in a First Meridian counting band stamped June 15. Three days ago.");
clue('herald_lights', 'Lights over the harbour', "Saturday's Herald: silent green lights over the bay at 2:17 a.m. on the 15th. The Mayor calls it hysteria.");
clue('matchbook', 'Blue Comet matchbook', "A matchbook from the Blue Comet, a nightclub on the Nickel Mile. Two matches gone.");
clue('wet_patches', 'Wet patches by my door', "Two dark patches on the runner right outside my door. Somebody stood there in a wet coat.");
clue('mopped_six', 'Landing mopped at 6:00', "The janitor's card: landing and stairs mopped at 6:00 a.m.");
clue('roof_hatch', 'Roof hatch bolt drawn', "The roof hatch bolt is drawn back. Fresh rust flakes on the floor under it.");
clue('mirador_paper', 'Note on Mirador paper', "The crest pressed into the note matches the Hotel Mirador's stationery.");
clue('case_714', 'Evelyn Hart, room 714', "Evelyn Hart, singer at the Blue Comet, found dead this morning in room 714 of the Hotel Mirador. Rook is paying.");
clue('sedan', 'Black sedan outside', "A black '54 sedan across from the Mirador. Mud on the plate, engine running, wipers off, two men. The passenger isn't reading his paper.");
clue('eyes_down', "Evelyn wouldn't look up", "Sal: the morning of the lights everybody stared at the sky. Evelyn kept her eyes on her shoes, like someone had told her not to look.");
clue('blue_suit', 'A man in a blue suit', "Sal: a man in a blue suit went into the Mirador at six and came out at half past without his hat.");
clue('rook_refused', 'Rook refused her story', "Evelyn brought Chester Rook a story about the Asterion plant. He wouldn't print it without proof.");

// =================================================================== STORY: DEDUCTIONS
function ded(id, a, b, title, text, then, need, needText) { DEDS.push({ id, a, b, title, text, then, need, needText }); }
ded('d_window', 'wet_patches', 'mopped_six', 'Delivered after six', "The landing was mopped at six. Somebody stood dripping at my door after that, and was gone before ten to seven.");
ded('d_inside', 'dry_envelope', 'street_door', 'Never came off the street', "A dry envelope and a locked street door. Whoever brought it never came in from the street.");
ded('d_roof', 'd_inside', 'roof_hatch', 'Came down from the roof', "They came across the roofs and down through the hatch. They knew the building. And they stood at my door long enough to drip.");
ded('d_band', 'bank_band', 'herald_lights', 'Paid the morning after', "The money was banded the morning after the lights. Whoever sent it started on this that same day.");
ded('d_hotel', 'mirador_paper', 'case_714', 'Written where she died', "The note is on Mirador paper, and Evelyn died at the Mirador. Whoever wrote it had been in that hotel.");
ded('d_sedan', 'letter', 'sedan', "They're waiting for Russo", "Two men idling across from the Mirador, and a note telling me not to let Russo leave alone. They're not waiting for a bus.");
ded('d_sky', 'letter', 'eyes_down', 'She had the same warning', "'At 2:17, do not look at the sky.' The morning of the lights, Evelyn wouldn't look up. Somebody told her what they're telling me.");
ded('d_bluesuit', 'letter', 'blue_suit', 'A blue suit at the Mirador', "'The dead man in the blue suit is lying.' A man in a blue suit walked out of the Mirador this morning. Alive, as far as Sal could tell.");
const WRONG_SPECIAL = [];

// =================================================================== VOICES (off-screen speakers)
VOICES.rook = { color: C.WL, tag: '(telephone)', anchor: () => [2.15, 1.5, 1.4] };

// =================================================================== FRANK (self-look = hint)
function frankHint() {
  if (G.roomId === 'office' || G.roomId === 'landing') {
    if (!has('envelope') && !has('letter')) return "There's an envelope on my floor. That's new.";
    if (has('envelope')) return "Let's see what's in that envelope. It's in my pocket.";
    if (!flag('read_letter')) return "I should read that note.";
    if (flag('phone_ringing')) return "The phone. At this hour.";
    if (!flag('took_case')) return "Somebody knows my initials and a room number. I'd like to know who.";
    if (!hasClue('d_band') && hasClue('bank_band') && hasClue('herald_lights')) return "The date on that bank band. The date on Saturday's paper. I should put those side by side in my notebook.";
    if (!hasClue('wet_patches') || !hasClue('mopped_six')) return "Whoever left it had to stand on my landing. Landings talk, if you look at them.";
    return "The Mirador's across the street. Room 714.";
  }
  return hintFor(G.roomId);
}
let hintFor = () => "Something here doesn't add up. I just haven't added it yet.";
FRANK_HS = { id: 'frank', name: 'Frank Calder', look: "Frank Calder. Private investigator. Hat, coat, and a face that's been told no by better people.",
             use: () => [['say', 'frank', frankHint()]] };

// =================================================================== NEW GAME / INIT
function storyInit() {
  for (const id in ROOMS) if (ROOMS[id].init) ROOMS[id].init();
}
function newGame() {
  resetGame();
  G.mode = 'play';
  G.inv = ['licence', 'wallet'];
  enterRoom('office', 0.35, 3.75, 'SE');
  S.fade = 1;
  run([
    ['lb', 1],
    ['caption', 'NEW MERIDIAN, RAVENSHORE. 1957.\nFifteen years after a war nobody won.', 4],
    ['caption', 'Three nights after the lights over the harbour.', 3.2],
    ['sfx', 'door'],
    ['fade', 'in', 1.2],
    ['walk', 'frank', 1.35, 3.85, 'SE'],
    ['say', 'frank', "Tuesday. Ten to seven. Rain since before dawn."],
    ['say', 'frank', "I unlocked the street door myself. Nobody's been up those stairs but me."],
    ['clue', 'street_door'],
    ['face', 'frank', 'NW'], ['wait', 0.6],
    ['say', 'frank', "And yet."],
    ['lb', 0],
    ['goal', 'Find out who left the envelope, and why.']
  ]);
}
function debugStart(id) {
  resetGame();
  G.inv = ['licence', 'wallet'];
  const r = ROOMS[id];
  if (r.debugSetup) r.debugSetup();
  const s = r.start || [1, 1, 'SE'];
  enterRoom(id, s[0], s[1], s[2]);
}
