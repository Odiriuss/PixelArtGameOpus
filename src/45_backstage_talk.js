
// =================================================================== BACKSTAGE: MAGS, TEAGUE, THE MIRROR, THE ACETATE
// Mags stands between Frank and the vanity until she trusts him or gets called away. Returns null when not in the way.
function magsGuard() {
  if (flag('mags_ok') || flag('mags_gone')) return null;
  return [['face', 'mags', 'frank'], ['say', 'mags', "Hands off. Those are her things."]];
}
function magsWreath() {
  return [['take', 'wreath'], ['pose', 'mags', 'reach', 1.0], ['say', 'mags', "...Lilies. She hated lilies. Said they smelled like somebody's aunt."],
    ['say', 'mags', "Thank the boys for me."], ['flag', 'mags_wreath']];
}
function magsLeaves() {
  return [['say', 'stagehand', "Mags! Wardrobe! The chorus can't find their zippers!"],
    ['face', 'mags', 'frank'], ['say', 'mags', "That's my cue. Touch nothing, you hear me? Nothing."],
    ['walk', 'mags', 0.7, 3.6], ['sfx', 'door'], ['remove', 'mags'], ['flag', 'mags_gone']];
}
function magsTalk() {
  const menu = () => [['choice', [
    { t: "[Empathy] You were close to her.", c: () => !flag('mags_ok'),
      d: [['say', 'mags', "I sewed every dress she ever sang in. I let out the blue one twice and took it in three times."], ['wait', 0.6],
          ['say', 'mags', "She was scared, mister. Since Saturday. Wouldn't go up on the roof for her smoke anymore. Kept the blinds down."],
          ['say', 'mags', "She said the sky had a hole in it."], ['clue', 'mags_sky'],
          ['say', 'mags', "...Go on. Look. Just be gentle with her things."], ['flag', 'mags_ok'], ['walk', 'mags', 3.1, 2.9, 'NW']] },
    { t: "[Pressure] I'm working for the Herald. I need to see her things.", c: () => !flag('mags_ok') && !flag('said_mags_press'), once: 'mags_press',
      d: [['say', 'mags', "The Herald. The Herald can buy a paper like everybody else."], ['fn', menu]] },
    { t: "What was she afraid of?", c: () => !hasClue('mags_sky'),
      d: [['say', 'mags', "Ask the sky. She did. Every night since Saturday, from behind the blinds."], ['fn', menu]] },
    { t: "The flowers are from the band.", c: () => has('wreath'), d: () => magsWreath().concat([['fn', menu]]) },
    { t: "I'll wait.", d: [['say', 'mags', "Wait all night, mister. I've got nowhere to be but here."]] }
  ]]];
  if (flag('mags_ok')) return [['say', 'mags', "Find him. Whoever it was. Find him."]];
  return [['fn', menu]];
}
function mirrorLift() {
  if (!hasClue('hooks')) return [['say', 'frank', "It doesn't sit flat on the wall."], ['say', 'frank', "Two brass hooks, not screws. It was made to come down."], ['clue', 'hooks']];
  if (hasClue('lipstick_message')) return [['say', 'frank', "Her words are still on the back of it. I've got them by heart now."]];
  return [['pose', 'frank', 'reach', 1.0, true], ['sfx', 'clunk'],
    ['say', 'frank', "It lifts off the hooks. Heavy. And on the back of the glass, in lipstick..."],
    ['doc', 'lipstick'], ['clue', 'lipstick_message'], ['flag', 'lip_t', tick],
    ['say', 'frank', "That's where her lipstick went."], ['wait', 0.5],
    ['say', 'frank', "'If I am dead.' She knew it was coming. Or she knew somebody who knew."],
    ['say', 'frank', "Sloane. I don't know a Sloane."], ['sfx', 'clunk'],
    ['fn', nightGoal]];
}
// ------------------------------------------------------------------ Roy Teague and the acetate
function teagueTalk() {
  if (!flag('teague_met')) { setFlag('teague_met'); setFlag('tg_t', tick); }
  const menu = () => [['choice', [
    { t: "You recorded her?", c: () => !hasClue('acetate'),
      d: [['say', 'teague', "Her last rehearsal. Five days ago, on that lathe. One disc."],
          ['say', 'teague', "And I don't hand it to anybody who's going to log it and lose it in a police locker. She'd haunt me."], ['clue', 'acetate'], ['fn', menu]] },
    { t: "What's on it?", c: () => hasClue('acetate'), once: 'tg_what',
      d: [['say', 'teague', "Her and a piano. And a tick under it I can't get out. Cut it three times, new blanks, new stylus. It's on every one."],
          ['say', 'teague', "The lathe's fine. I checked the lathe."], ['fn', menu]] },
    { t: "[Promise] It stays with me. It never goes in a police locker.", c: () => hasClue('acetate') && !flag('got_acetate'),
      d: () => hasClue('lipstick_message')
        ? [['say', 'teague', "..."], ['say', 'teague', "She left you something. Behind the glass. I can see it on you."],
           ['say', 'teague', "Take it. Play it all the way through. If you find out what that tick is, you come back and tell me."],
           ['pose', 'teague', 'reach', 0.8, true], ['flag', 'got_acetate'], ['flag', 'acetate_given'], ['give', 'acetate'], ['fn', nightGoal]]
        : [['say', 'teague', "Everybody promises. Come back when you know what you're promising."], ['fn', menu]] },
    { t: "[Bribe] Twenty dollars for the disc.", c: () => hasClue('acetate') && has('cash') && !flag('got_acetate'),
      d: [['say', 'teague', "You think I'd sell her? For twenty dollars?"], ['say', 'teague', "I'm on in two minutes anyway. Don't touch my lathe."], ['fn', teagueToStage]] },
    { t: "That's all.", d: [] }
  ]]];
  return [['say', 'teague', flag('teague_hi') ? "Still here?" : "You're the private. Mickey said. Or Bruno said. Somebody always says."], ['flag', 'teague_hi'], ['fn', menu]];
}
function teagueToStage() {
  return [['walk', 'teague', 4.3, 3.1], ['walk', 'teague', 0.7, 3.6], ['sfx', 'door'], ['remove', 'teague'], ['flag', 'teague_on_stage']];
}
function teagueCalled() {
  return [['say', 'stagehand', "Teague! You're on! Second set!"], ['say', 'teague', "Coming."], ['face', 'teague', 'frank'],
    ['say', 'teague', "Don't touch my lathe."]].concat(teagueToStage());
}
function acetateTake() {
  if (!flag('teague_on_stage')) return [['face', 'teague', 'frank'], ['say', 'teague', "Hands off the lathe, mister."]];
  return [['pose', 'frank', 'reach', 0.7, true], ['flag', 'got_acetate'], ['flag', 'stole_acetate'], ['give', 'acetate'],
    ['say', 'frank', "He's on the stand for twenty minutes. I'll have to live with this for longer than that."], ['fn', nightGoal]];
}
function playAcetate() {
  return [['say', 'frank', "Let's hear her."], ['pose', 'frank', 'reach', 0.8, true], ['sfx', 'crackle'],
    ['fn', () => { playSong(true); return []; }], ['wait', 3.5],
    ['say', 'frank', "Her voice, and a piano, and rain on a window somewhere behind them."], ['wait', 2.5],
    ['say', 'frank', "And under it... a tick. Not on the beat. Not on any beat."], ['wait', 3.0],
    ['say', 'frank', "It keeps its own time. Like it's counting something."],
    ['fn', () => { playSong(false); return []; }], ['clue', 'acetate_pulse'], ['flag', 'heard_acetate'], ['fn', nightGoal]];
}
// the goal line for the rest of the night, from what Frank has so far
function nightGoal() {
  let g;
  if (!hasClue('lipstick_message')) g = "Find what Evelyn left behind in her dressing room.";
  else if (!flag('got_acetate')) g = "'The song is the map.' Find her song. Then it's midnight, and the alley.";
  else if (!flag('heard_acetate')) g = "Play the acetate on something. Then it's midnight, and the alley.";
  else g = "It's nearly midnight. The stage door opens onto the alley.";
  return G.goal === g ? [] : [['goal', g]];
}
