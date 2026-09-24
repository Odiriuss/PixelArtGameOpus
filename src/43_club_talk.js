
// =================================================================== BLUE COMET: CONVERSATIONS
function openBackstage(how) {
  return [['flag', 'backstage_ok'], ['flag', 'backstage_' + how], ['walk', 'goon', 9.7, 6.75, 'SW'],
    ['goal', "Get backstage and look through Evelyn's dressing room."]];
}
function brunoBlock() {
  if (flag('backstage_ok')) return [['say', 'goon', "You been cleared. Go on."]];
  if (has('wreath')) return brunoWreath();
  return [['face', 'goon', 'frank'], ['say', 'goon', "Mr. Salvi says nobody goes back there tonight."], ['say', 'frank', "Did Mr. Salvi say why?"], ['say', 'goon', "No."]];
}
function brunoWreath() {
  if (flag('backstage_ok')) return [['say', 'goon', "You been cleared already."]];
  return [['face', 'goon', 'frank'], ['say', 'frank', "Flowers for Miss Hart's room. From the band."],
    ['say', 'goon', "..."], ['wait', 0.6], ['say', 'goon', "Mags'll want 'em. You go in with the flowers, you come out without 'em. Quick."]].concat(openBackstage('wreath'));
}
function wreathTake() {
  return [['pose', 'frank', 'reach', 0.6, true], ['flag', 'got_wreath'], ['give', 'wreath'],
    ['say', 'bartender', "Hey. Those are for the back. Mags is supposed to put 'em in her room."],
    ['say', 'frank', "I'm headed that way."], ['say', 'bartender', "...Sure you are. Tell Bruno the boys sent 'em."]];
}
// ------------------------------------------------------------------ Lou, behind the bar
function louTalk() {
  const menu = () => [['choice', [
    { t: "[Buy] A rye. (a dollar)", c: () => !flag('lou_rye'),
      d: [['flag', 'lou_rye'], ['sfx', 'coin'], ['pose', 'bartender', 'reach', 0.8, true], ['say', 'bartender', "Rye. On a night like this, a man should drink something brown."], ['fn', menu]] },
    { t: "Was Mickey here last night?",
      d: () => flag('lou_rye') ? [['say', 'bartender', "End of my bar till half past one, crying into a gin. Then his Lincoln wouldn't start."],
          ['say', 'bartender', "Somebody'd pulled the distributor cap. Mickey's still looking for who. He took the Nickel Mile car home at five to two, cussing the whole way."],
          ['clue', 'salvi_streetcar'], ['fn', menu]]
        : [['say', 'bartender', "I pour drinks, mister. I don't pour Mickey."], ['fn', menu]] },
    { t: "When did Evelyn leave?", once: 'lou_left',
      d: [['say', 'bartender', "Twenty past twelve. Out the back, through the alley. She always went out the alley."],
          ['say', 'bartender', "Said the front had too many eyes."], ['fn', menu]] },
    { t: "Anybody call for her?", c: () => flag('lou_rye') || flag('said_lou_left'),
      d: [['say', 'bartender', "Twice. A fella at twenty to twelve. She took it in the alcove, back turned, didn't say much."],
          ['say', 'bartender', "Then Chester Rook, from the Herald, ten to twelve. Left a message with me: he can't be part of it."],
          ['say', 'bartender', "She read it, and she went and got her coat."], ['flag', 'lou_calls'], ['fn', menu]] },
    { t: "The wreath at the end of the bar?", c: () => !flag('got_wreath'),
      d: [['say', 'bartender', "The boys chipped in. It's supposed to go back to her dressing room. Mags'll know what to do with it."],
          ['say', 'bartender', "I can't leave the bar. Nobody else'll touch it. Bad luck, carrying flowers for the dead."], ['fn', menu]] },
    { t: "That's all.", d: [['say', 'bartender', "Always is."]] }
  ]]];
  if (flag('lou_met')) return [['say', 'bartender', "What'll it be?"], ['fn', menu]];
  setFlag('lou_met');
  return [['say', 'bartender', "What'll it be?"], ['say', 'frank', "Answers, mostly."], ['say', 'bartender', "We're out. Try a drink."], ['fn', menu]];
}
// ------------------------------------------------------------------ Mickey Salvi, in his booth
function salviTalk() {
  const menu = () => [['choice', [
    { t: "Where were you at two this morning?",
      d: [['say', 'salvi', "Here till half past one. Then my car wouldn't start. Some comedian pulled the distributor cap."],
          ['say', 'salvi', "So I rode the streetcar home like a working man. Ask the conductor. He'll remember. I tipped him."], ['fn', menu]] },
    { t: "What did she want from you last night?", once: 'mick_want',
      d: [['say', 'salvi', "Not what you'd think. She wanted money. Not for her."],
          ['say', 'salvi', "She said she had something to sell. A name and a date. She needed somebody with money to be scared with her."],
          ['say', 'salvi', "I told her I don't buy what I can't lift. She called me a coward. She was right. She usually was."], ['fn', menu]] },
    { t: "The captain's got your name on this.", c: () => hasClue('captain_gangster') && !flag('backstage_ok'),
      d: [['say', 'salvi', "The captain's had my name on everything since the weather in '52."],
          ['say', 'salvi', "I didn't kill her, Calder. I'd have married her if she'd let me. She wouldn't."],
          ['choice', [
            { t: "[Persuade] Then let me see her dressing room. I'll find you somebody else to hang.",
              d: [['wait', 0.6], ['say', 'salvi', "..."], ['say', 'salvi', "Bruno. Let the man through."], ['fn', () => openBackstage('mickey')]] },
            { t: "[Pressure] You're the only man in this room with a reason.",
              d: [['say', 'salvi', "Everybody in this room's got a reason, Calder. Most of 'em are at the bar."], ['fn', menu]] }
          ]]] },
    { t: "[Observe] That's a good cigar.", once: 'mick_cigar',
      d: [['say', 'salvi', "Havana. I don't smoke anything rolled north of Key West. Never have."],
          ['say', 'salvi', "Cigarettes are for people waiting on something. I don't wait."], ['clue', 'salvi_cigar'], ['fn', menu]] },
    { t: "That's all, Mickey.", d: [['say', 'salvi', "Find who did it, Calder. Then tell me before you tell the cops."]] }
  ]]];
  if (flag('mick_met')) return [['say', 'salvi', "Calder."], ['fn', menu]];
  setFlag('mick_met');
  return [['say', 'salvi', "Frank Calder. The cop who quit before they could fire him. I heard you'd come. I hear everything in my club."],
    ['say', 'frank', "Then you heard about Evelyn before I did."], ['wait', 0.6],
    ['say', 'salvi', "Siddown or stand up, I don't care. Just don't stand there looking like the police."], ['fn', menu]];
}
