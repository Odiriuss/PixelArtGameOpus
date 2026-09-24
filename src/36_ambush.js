
// =================================================================== CH02 CLIMAX: "Do not let Russo leave the hotel alone."
function ambushScene() {
  if (flag('ambush')) return [];
  setFlag('ambush');
  const choices = () => [['choice', [
    { t: "[Warn] There's a black sedan across Ferrier. Two men, engine running.", c: () => flag('saw_sedan'),
      d: [['say', 'russo', "...Since when?"], ['say', 'frank', "Since seven. Wipers off in the rain. The passenger's been on the same page of the Herald for an hour."],
          ['wait', 0.6], ['say', 'russo', "Mud on the plate?"], ['say', 'frank', "Mud on the plate."],
          ['say', 'russo', "...All right. You walk me down. And you stand where I can see you."], ['fn', russoSafe]] },
    { t: "[Truth] Show her the note again.", c: () => has('letter') && flag('letter_shown'),
      d: () => russoTrusts() },
    { t: "[Truth] Show her the note.", c: () => has('letter') && !flag('letter_shown'),
      d: () => russoTrusts() },
    { t: "[Pressure] I'm coming down with you. Argue with me on the stairs.", once: 'amb_press', c: () => !flag('said_amb_press'),
      d: () => flag('russo_soft') ? [['say', 'russo', "...You never did know when to go home."], ['say', 'russo', "Fine. The stairs, not the lift. I need the walk."], ['fn', russoSafe]]
        : [['say', 'russo', "You're staying right here, Frank. That's not a request."], ['fn', choices]] },
    { t: "Go on, then.", d: [['fn', russoHurt]] }
  ]]];
  return [
    ['face', 'russo', 'frank'],
    ['say', 'russo', "That's it. I'm going down to the lobby to phone the captain."],
    ['walk', 'russo', 1.1, 3.6], ['face', 'russo', 'frank'],
    ['say', 'russo', "Alone, Calder. I don't need a chaperone to find a telephone."],
    ['say', 'frank', "'Do not let Russo leave the hotel alone.'"],
    ['fn', choices]
  ];
}
function russoTrusts() {
  if (flag('lied')) return [['say', 'russo', "An hour ago you were 'in the neighbourhood.' Now you've got a letter from a ghost with your initials on it?"],
    ['say', 'russo', "Save it for Rook, Frank. He buys stories."], ['fn', russoHurt]];
  const first = !flag('letter_shown');
  setFlag('letter_shown');
  return (first ? [['pose', 'frank', 'reach', 0.8, true], ['say', 'russo', "'Do not let Russo leave the hotel alone.'"], ['wait', 0.5], ['say', 'russo', "Who wrote this?"], ['say', 'frank', "Somebody who signs my initials."]]
    : [['say', 'russo', "I read it the first time."], ['wait', 0.5]])
    .concat([['say', 'russo', "...It knew about 714 before we did."], ['say', 'russo', "Fine. You're walking me down."], ['fn', russoSafe]]);
}
// she goes with Frank: the sedan leaves without her
function russoSafe() {
  return [
    ['flag', 'russo_safe'], ['fade', 'out', 0.6],
    ['room', 'lobby', 1.4, 3.7, 'SW'], ['place', 'russo', 1.25, 4.45, 'NW'], ['flag', 'russo_in_lobby'],
    ['fade', 'in', 0.6],
    ['say', 'russo', "Operator, get me Central. Homicide."], ['wait', 1.0],
    ['sfx', 'screech'], ['wait', 1.2],
    ['face', 'russo', 'frank'], ['say', 'russo', "What was that?"],
    ['say', 'frank', "A black sedan, remembering it had somewhere else to be."],
    ['say', 'russo', "Friends of yours?"], ['say', 'frank', "Friends of somebody's. They waited two hours for you to come out alone."],
    ['wait', 0.8],
    ['say', 'russo', "Somebody writes you a letter. Somebody's watching my back through you. I don't like either of those, Frank."],
    ['say', 'russo', "Go home. And if you find out who wrote that note, I want to hear it before Rook does."],
    ['walk', 'russo', 3.7, 6.7], ['remove', 'russo'], ['sfx', 'door'], ['flag', 'russo_in_lobby', false],
    ['fn', ch2End]
  ];
}
// she goes alone
function russoHurt() {
  return [
    ['say', 'russo', "Don't touch anything, Frank."],
    ['walk', 'russo', 0.75, 4.0, 'NW'], ['sfx', 'door'], ['remove', 'russo'],
    ['wait', 2.2],
    ['say', 'frank', "The note said don't let her. I let her."], ['wait', 2.5],
    ['sfx', 'shot'], ['wait', 0.25], ['sfx', 'shot'], ['wait', 0.6], ['sfx', 'screech'],
    ['say', 'frank', "That came from the street."],
    ['flag', 'russo_hurt'], ['fade', 'out', 0.4],
    ['room', 'lobby', 3.7, 6.2, 'NE'], ['place', 'russo', 7.3, 4.95, 'SE', { sink: 7 }], ['flag', 'russo_in_lobby'],
    ['fade', 'in', 0.4],
    ['walk', 'frank', 6.6, 5.9], ['face', 'frank', 'russo'], ['face', 'russo', 'frank'], ['pose', 'russo', 'reach', 30],
    ['say', 'russo', "Shoulder. Through and through. I'll live. Don't say it."],
    ['say', 'russo', "Black sedan. Came up the kerb as I stepped out. Mud on the plate."],
    ['say', 'frank', "I know."], ['wait', 0.6], ['say', 'russo', "...You know?"],
    ['say', 'frank', "I'll tell you how I know when I know how I know."],
    ['say', 'clerk', "The ambulance is here, Detective."],
    ['fade', 'out', 0.6], ['remove', 'russo'], ['flag', 'russo_in_lobby', false], ['wait', 0.8], ['fade', 'in', 0.6],
    ['say', 'frank', "Five warnings in that note. I've used up one of them getting her shot."],
    ['fn', ch2End]
  ];
}
function ch2End() {
  return [
    ['flag', 'ch2_done'],
    ['say', 'frank', "Two matches gone from a Blue Comet matchbook. Evelyn's club. Mickey Salvi's club."],
    ['say', 'frank', "The seventh floor can wait for me. The Nickel Mile opens at nine."],
    ['goal', "Finish up at the Mirador if you want, then head out the street doors. Tonight: the Blue Comet."],
    ['save']
  ];
}
