
// =================================================================== FRANK'S HINTS (click Frank to hear what he's thinking)
// Office and landing hints live in frankHint(); everything after that is here, first match wins.
const HINTS = [
  // Ferrier Street
  [() => G.roomId === 'ferrier' && !flag('saw_sedan'), "Something across the street doesn't belong on Ferrier at this hour. A car with its engine running, for one."],
  [() => G.roomId === 'ferrier' && !flag('sal_met'), "Sal's on his corner. Sal sees everything on this street and charges for about half of it."],
  [() => G.roomId === 'ferrier', "The Mirador. Room 714. Through the revolving door."],
  // the Mirador, before the ambush
  [() => !flag('ch2_done') && !flag('let_in') && G.roomId !== 'corridor7', "Seventh floor. The lift's in the lobby."],
  [() => !flag('ch2_done') && !flag('let_in'), "Mulroney's on the door. He'll fetch Russo if I give him a reason."],
  [() => !flag('ch2_done') && G.roomId === 'room714' && !hasClue('cold_latch'), "Look at the window. Not through it. At it."],
  [() => !flag('ch2_done') && G.roomId === 'room714' && r714Count() < 7, "Five minutes. Every object in this room is lying about something. Look at them all."],
  [() => !flag('ch2_done') && G.roomId === 'room714', "Russo won't wait much longer. The note said something about Russo."],
  [() => !flag('ch2_done') && hasClue('receipt_tomorrow') && !hasClue('carbon_book'), "Room service keeps carbons. The pantry on seven would have the book."],
  [() => !flag('ch2_done') && hasClue('dials_217') && !hasClue('master_clock'), "Slave clocks answer to a master. The master's somewhere downstairs."],
  [() => !flag('ch2_done') && G.roomId === 'lobby' && !hasClue('blank_register'), "Hotels write everything down. Except when they don't."],
  [() => !flag('ch2_done'), "Room 714. Russo's giving me five minutes, and I've used some of them."],
  // after the ambush, still at the Mirador
  [() => ['lobby', 'corridor7', 'room714'].indexOf(G.roomId) >= 0 && hasClue('receipt_tomorrow') && !hasClue('carbon_book'), "The pantry on seven. The carbon book. That receipt has a number on it."],
  [() => ['lobby', 'corridor7', 'room714'].indexOf(G.roomId) >= 0 && hasClue('dials_217') && !hasClue('master_clock'), "The master clock behind the front desk. I'd like to know if it stopped too."],
  [() => ['lobby', 'corridor7', 'room714'].indexOf(G.roomId) >= 0, "The Blue Comet opens at nine. The street doors are in the lobby."],
  // the Nickel Mile and the club
  [() => G.roomId === 'nickel' && !flag('paid_cover'), "The doorman wants two dollars and a reason. I've got the two dollars."],
  [() => !flag('backstage_ok') && G.roomId === 'nickel', "Inside. Whatever she left, she left it in there."],
  [() => !flag('backstage_ok') && !has('wreath') && !flag('got_wreath'), "Bruno's on the back door. Either Mickey tells him to move, or somebody gives me a reason to carry something back there. Those flowers on the bar, say."],
  [() => !flag('backstage_ok') && has('wreath'), "Flowers for the dressing room. Bruno might hold a door for a man carrying lilies."],
  [() => !flag('backstage_ok'), "Bruno's on the back door. Mickey Salvi's the one who tells Bruno things."],
  [() => !hasClue('lipstick_message') && G.roomId !== 'backstage', "Her dressing room's backstage."],
  [() => !hasClue('lipstick_message') && !flag('mags_ok') && !flag('mags_gone'), "Mags won't let me near the table. Talk to her like a person, or wait for somebody to call her away."],
  [() => !hasClue('lipstick_message'), "The mirror. Something about how it hangs."],
  [() => !flag('got_acetate') && hasClue('acetate') && !flag('teague_on_stage'), "Teague doesn't want a promise from a stranger. He wants one from somebody she trusted. Or he wants to be on the stand when I'm not looking."],
  [() => !flag('got_acetate') && hasClue('acetate'), "Teague's on the stand. The lathe's unattended."],
  [() => !flag('got_acetate') && !hasClue('acetate'), "'The song is the map.' Somebody in the band room would know about a song."],
  [() => has('acetate') && !flag('heard_acetate'), "There's a phonograph in the band room."],
  [() => !flag('midnight'), "It's nearly midnight. The stage door opens on the alley she always used."],
  [() => !flag('letter_decided'), "'Burn this after midnight.' I've got a matchbook and a letter. Or I've got a pocket."]
];
hintFor = () => { for (const h of HINTS) if (h[0]()) return h[1]; return "Something here doesn't add up. I just haven't added it yet."; };
