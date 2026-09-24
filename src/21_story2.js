
// =================================================================== STORY II: THE MIRADOR (Ch02) AND THE BLUE COMET (Ch03)
// ---- the Mirador
clue('master_clock', 'Master clock running', "The Mirador's master regulator behind the front desk drives every clock in the building over two wires. Running, right on time. Pell says it hasn't lost a second since 1931.");
clue('dials_217', 'Every dial on seven: 2:17', "All three slave dials on the seventh floor stopped at 2:17. A slave dial can't stop unless the master stops.");
clue('blank_register', 'Seventh floor left blank', "The register shows seven rooms on the seventh floor taken since the 12th. Room numbers, no names.");
clue('block_booking', 'A federal block-booking', "Pell: the whole seventh floor was block-booked by the government from the 12th. Management told him not to write it down.");
clue('desk_nobody', 'Nobody passed the desk', "Pell was on the front desk all night. He swears nobody went upstairs after midnight.");
clue('east_stairs', 'The east stairs', "The seventh floor's east fire stairs come down by the kitchens, not the lobby. Nobody at the front desk would see who used them.");
clue('carbon_book', 'Carbon book: 7-0411', "The room-service carbon book in the seventh-floor pantry. The last docket written is 7-0411. The next blank in the pad is 7-0412.");
clue('shot_heart', 'Shot through the heart', "Evelyn Hart, shot once through the heart. No gun in the room.");
clue('captain_gangster', "Captain says 'gangster'", "Russo's captain named Mickey Salvi before the medical examiner got his hat off. Evelyn sang at Salvi's club.");
clue('locked_door', 'Locked from the inside', "Key in the lock on the inside and the chain on. Mulroney had to cut the chain to get in.");
clue('window_latched', 'Sealed room', "Window latched. Seventh floor, north face, no ledge, no fire escape. Transom painted shut. Connecting door bolted on both sides.");
clue('cold_latch', 'Frost on the window latch', "A grey-white bloom around the window latch. Not scorched. Cold. Frost, in June.");
clue('frost_glass', 'Frost on her water glass', "The glass of water by the bed has a skin of frost on the surface. The room is warm.");
clue('mirror_spiral', 'Mirror cracked in a spiral', "The mirror on the dresser is cracked in a spiral, as if something twisted it. Shifted in its frame, not shattered.");
clue('locket_empty', 'The locket is empty', "Evelyn's locket, open on the dresser. The photograph wasn't torn out. Somebody lifted it out carefully.");
clue('ash_tray', 'Pall Royale ash', "Ash and two stubs in the ashtray by the armchair. Pall Royale.");
clue('her_brand', 'She smoked Lucky Sevens', "Evelyn's handbag: a half pack of Lucky Sevens, a Blue Comet set list, a streetcar token.");
clue('receipt_tomorrow', 'A receipt dated tomorrow', "A room-service receipt on the tray: docket 7-0412, stamped JUN 19 1957. Today is the 18th. Written in block capitals.");
clue('clock_217', 'Bedside clock: 2:17', "The travel clock by the bed stopped at 2:17. It's a wind-up, and it's fully wound.");
// ---- the Blue Comet
clue('salvi_cigar', 'Mickey smokes Havanas', "Mickey Salvi smokes Havanas and nothing else, and he tells you so. He wouldn't be seen dead with a Pall Royale.");
clue('salvi_streetcar', 'Mickey took the streetcar', "Lou: Mickey's Lincoln wouldn't start last night. Somebody pulled the distributor cap. He took the Nickel Mile streetcar home at five to two.");
clue('no_lipstick', 'No lipstick on her vanity', "Evelyn's dressing table at the Blue Comet: powder, pins, cold cream, a hat pin. No lipstick. A singer always has lipstick.");
clue('hooks', 'Mirror on two hooks', "Her dressing-room mirror hangs on two brass hooks, not screws. It was made to come off.");
clue('lipstick_message', 'Behind the mirror', "In lipstick, in her hand: 'If I am dead, the song is the map. The sky opened at 2:17. Ask Sloane what came through.'");
clue('mags_sky', 'Afraid of the sky', "Mags: since Saturday Evelyn wouldn't go up on the roof for a smoke. She kept the blinds down and said the sky had a hole in it.");
clue('acetate', "Evelyn's last rehearsal", "Roy Teague cut Evelyn's last rehearsal on the band-room lathe five days ago. One acetate disc.");
clue('acetate_pulse', 'A pulse under the song', "On the acetate, under the music, a tick that isn't in time with anything. A flaw in the disc, or something else.");
clue('rime_rung', 'Frost on the fire escape', "The bottom rung of the fire escape behind the Blue Comet is furred with frost. In June.");

ded('d_217', 'dials_217', 'master_clock', 'Not the wires', "The master is running and the slave dials can't stop without it. Every dial on seven stopped at 2:17 anyway. Whatever stopped them wasn't in the wiring.");
ded('d_cold', 'cold_latch', 'frost_glass', 'Cold at the window', "Frost on the latch and frost on the water, in a warm room in June. Something very cold was in that room, by the window.");
ded('d_sealed', 'locked_door', 'window_latched', 'Nobody walked out of 714', "Key inside, chain on, window latched, transom painted over, connecting door bolted. Whoever shot her didn't leave by any door.");
ded('d_stranger', 'ash_tray', 'her_brand', 'A stranger in the chair', "Pall Royale ash in the room of a woman who smoked Lucky Sevens. Somebody sat in that armchair long enough to smoke two.");
ded('d_tomorrow', 'receipt_tomorrow', 'carbon_book', 'A docket from tomorrow', "The receipt in 714 is docket 7-0412, the next blank in the pad, dated tomorrow. Nobody has written it yet. Somebody is going to.");
ded('d_stairs', 'desk_nobody', 'east_stairs', "Nobody needed the desk", "Pell's telling the truth. Nobody passed his desk because nobody needed to. The east stairs come up by the kitchens.");
ded('d_federal', 'block_booking', 'blue_suit', 'Government on seven', "The government had the whole seventh floor. A man in a blue suit walked out at half past six without his hat. The note says the dead man in the blue suit is lying. There isn't a dead man in a blue suit. Not yet.");
ded('d_notmob', 'captain_gangster', 'd_sealed', "Not a gangster's murder", "Mickey Salvi's boys don't lock a door from the inside and leave the money on the dresser. The captain has a name. He doesn't have a way in.");
ded('d_notmickey', 'ash_tray', 'salvi_cigar', "Not Mickey in the chair", "The smoker in the armchair smoked Pall Royale. Mickey Salvi smokes Havanas and nothing else. Whoever sat with Evelyn, it wasn't Mickey.");
ded('d_skyopened', 'lipstick_message', 'herald_lights', 'The sky opened at 2:17', "The lights over the harbour came at 2:17 on Saturday. Evelyn died at 2:17 this morning. She wrote that the sky opened. She didn't mean it as poetry.");
ded('d_map', 'lipstick_message', 'acetate_pulse', 'The song is the map', "There's a pulse under her song that isn't music. 'The song is the map.' I can't read it yet. I know who I'd ask, if I knew who Sloane was.");
ded('d_rime', 'rime_rung', 'cold_latch', 'The cold, twice', "Frost on the latch in 714. Frost on the fire escape behind her club. Two places Evelyn was, and something cold was in both.");
WRONG_SPECIAL.push(
  { a: 'captain_gangster', b: 'matchbook', text: "A Blue Comet matchbook makes Mickey Salvi a man who owns a nightclub. The captain would call it a confession." },
  { a: 'mirror_spiral', b: 'hooks', text: "Two mirrors, two rooms. One was hung to come down. The other was twisted. Not the same hand." },
  { a: 'receipt_tomorrow', b: 'letter', text: "Block capitals on the receipt, a pen hand on the note. Different hands. I think." }
);

// ---- items
item('wreath', {
  name: 'Wreath', icon: ['...gGGGGg.....', '..gGrGGrGg....', '.gGG....GGg...', '.gG......Gg...', '.gr......rg...', '.gG......Gg...',
    '.gGG....GGg...', '..gGrGGrGg....', '...gGGGGg.....', '....cccc......', '...c....c.....', '..............'],
  look: "Lilies and a ribbon. 'FOR EVELYN - THE BOYS IN THE BAND.' Lilies. Everyone sends lilies." });
item('acetate', {
  name: 'Acetate disc', icon: ['....oooooo....', '..oooiiiooo...', '.ooiooooooio..', '.oiooooooooio.', 'ooiooorrooooio', 'oioooorrooooio',
    '.oiooooooooio.', '.ooiooooooio..', '..oooiiiooo...', '....oooooo....', '..............', '..............'],
  look: () => [['say', 'frank', "Evelyn's last rehearsal. One side, no label, just 'E.H. 6/13' in grease pencil."]].concat(flag('heard_acetate') ? [] : [['say', 'frank', "I'd need a turntable to hear it."]]) });
// midnight in the alley: the letter meets the matchbook
ITEMS.letter.on = { matchbook: () => midnightChoice() };
DOCS.lipstick = { w: 200, paper: C.S3, ink: C.CRIM, text: ['If I am dead,', 'the song is the map.', '', 'The sky opened at 2:17.', '', 'Ask Sloane', 'what came through.'] };

// ---- the drive to the Nickel Mile (end of the day at the Mirador)
function driveToNickelMile() {
  return [
    ['fade', 'out', 0.8], ['lb', 1],
    ['caption', flag('russo_hurt') ? "Russo went to St. Brendan's in the back of an ambulance.\nThe captain said 'gangster' four more times." : "Russo went back to the station and wrote it up her way.\nThe captain said 'gangster' four more times.", 4.2],
    ['caption', "The day went the way days go in New Meridian.\nIt rained. Nobody looked at the sky.", 3.6],
    ['caption', 'THE NICKEL MILE\n9:40 P.M.', 3],
    ['room', 'nickel', 2.6, 5.9, 'NE'], ['fade', 'in', 1.0], ['lb', 0],
    ['say', 'frank', "A matchbook with two matches gone. The Blue Comet. Evelyn's club, and Mickey Salvi's."],
    ['goal', "Get into the Blue Comet and find out what Evelyn left behind."], ['save']
  ];
}
