
// =================================================================== GAME STATE
const G = {
  mode: 'title',          // title | play | end
  flags: {}, inv: [], clues: [], deds: [], sel: null,
  roomId: null, goal: '', chapter: 1, newNotes: 0
};
function flag(k) { return !!G.flags[k]; }
function setFlag(k, v) { G.flags[k] = v === undefined ? true : v; }
function has(item) { return G.inv.indexOf(item) >= 0; }
function hasClue(id) { return G.clues.indexOf(id) >= 0 || G.deds.indexOf(id) >= 0; }

// =================================================================== ITEMS / CLUES / DEDUCTIONS (registries filled by story)
const ITEMS = {};       // id -> {name, icon, key, look(), use(), on: {id: fn}}
const CLUES = {};       // id -> {title, text}
const DEDS = [];        // {id, a, b, title, text, then()}
function giveItem(id) { if (!has(id)) { G.inv.push(id); uiFlash('inv'); sfx('pick'); } }
function takeItem(id) { const i = G.inv.indexOf(id); if (i >= 0) G.inv.splice(i, 1); if (G.sel === id) G.sel = null; }
function addClue(id) {
  if (G.clues.indexOf(id) >= 0) return false;
  if (!CLUES[id]) throw new Error('unknown clue ' + id);
  G.clues.push(id); G.newNotes++; uiFlash('note'); sfx('note');
  return true;
}
function addDed(id) {
  if (G.deds.indexOf(id) >= 0) return false;
  G.deds.push(id); G.newNotes++; uiFlash('note'); sfx('deduce');
  return true;
}
function dedById(id) { for (const d of DEDS) if (d.id === id) return d; return null; }
function entryTitle(id) { const c = CLUES[id]; if (c) return c.title; const d = dedById(id); return d ? d.title : id; }
function entryText(id) { const c = CLUES[id]; if (c) return c.text; const d = dedById(id); return d ? d.text : ''; }
// try to connect two notebook entries -> {ok, text, id}
const WRONG_PAIR = ["No. One doesn't explain the other.", "Those two don't talk to each other.", "I'd be making it up.",
                    "That's a coincidence, not a connection.", "Nothing there a jury would sit still for."];
let wrongIdx = 0;
function connect(a, b) {
  for (const d of DEDS) {
    if ((d.a === a && d.b === b) || (d.a === b && d.b === a)) {
      if (G.deds.indexOf(d.id) >= 0) return { ok: false, text: 'Already worked that one out: ' + d.title + '.' };
      if (d.need && !d.need()) return { ok: false, text: d.needText || "Not yet. Something's missing." };
      addDed(d.id);
      if (d.then) run(d.then() || []);
      return { ok: true, text: d.text, id: d.id };
    }
  }
  if (typeof WRONG_SPECIAL === 'object') for (const w of WRONG_SPECIAL) if ((w.a === a && w.b === b) || (w.a === b && w.b === a)) return { ok: false, text: w.text };
  return { ok: false, text: WRONG_PAIR[(wrongIdx++) % WRONG_PAIR.length] };
}

// =================================================================== SCRIPT RUNNER
const S = {
  q: [], cur: null, t: 0,
  speech: null,          // {who, lines, t, dur, x, y, color}
  choice: null,          // {opts, hover}
  doc: null,             // document id being shown
  fade: 0, fadeFrom: 0, fadeTo: 0, fadeDur: 0, fadeT: 0,
  lb: 0, lbTo: 0,        // letterbox 0..1
  caption: null, capT: 0, capDur: 0
};
function run(cmds) { for (const c of cmds) S.q.push(c); }
function runNow(cmds) { for (let i = cmds.length - 1; i >= 0; i--) S.q.unshift(cmds[i]); }
function scriptBusy() { return !!(S.cur || S.q.length); }
function speechDur(text) { return Math.round(FPS * Math.max(1.6, 1.0 + text.length * 0.052)); }
function whoColor(who) {
  if (who === 'narr') return C.PALEY;
  if (typeof who === 'object') return who.color;
  const a = ACT[who]; if (a) return a.color;
  if (VOICES[who]) return VOICES[who].color;
  return C.CREAM;
}
const VOICES = {};      // off-screen voices: id -> {color, x, y, z (world anchor), name}
function startCmd(c) {
  const op = c[0];
  S.t = 0;
  switch (op) {
    case 'say': {
      const who = c[1], text = c[2];
      const lines = wrapText(text, who === 'narr' ? 280 : 170);
      S.speech = { who, lines, t: 0, dur: c[3] ? Math.round(c[3] * FPS) : speechDur(text) };
      const a = ACT[who]; if (a && room && actors.indexOf(a) >= 0) a.talking = S.speech.dur;
      sfx('blip', who);
      return false;
    }
    case 'walk': {
      const a = ACT[c[1]];
      if (!a || actors.indexOf(a) < 0) return true;
      c._done = false;
      walkTo(a, c[2], c[3], () => { c._done = true; if (c[4] !== undefined) a.dir = typeof c[4] === 'string' ? DIRS[c[4]] : c[4]; });
      return false;
    }
    case 'walkNB': { const a = ACT[c[1]]; if (a && actors.indexOf(a) >= 0) walkTo(a, c[2], c[3], c[4] !== undefined ? () => { a.dir = DIRS[c[4]]; } : null); return true; }
    case 'face': {
      const a = ACT[c[1]]; if (!a) return true;
      const t = c[2];
      if (typeof t === 'string' && DIRS[t] !== undefined) a.dir = DIRS[t];
      else if (typeof t === 'string' && ACT[t]) faceToward(a, ACT[t].x, ACT[t].y);
      else if (Array.isArray(t)) faceToward(a, t[0], t[1]);
      return true;
    }
    case 'pose': { const a = ACT[c[1]]; if (a) { a.pose = c[2]; a.poseT = Math.round((c[3] || 1) * FPS); a.idleT = 0; } return c[4] ? false : true; }
    case 'wait': return false;
    case 'fade': {
      S.fadeFrom = S.fade; S.fadeTo = c[1] === 'out' ? 1 : 0; S.fadeDur = Math.max(1, Math.round((c[2] || 0.4) * FPS)); S.fadeT = 0;
      return false;
    }
    case 'room': enterRoom(c[1], c[2], c[3], c[4]); return true;
    case 'fn': { const r = c[1](); if (Array.isArray(r) && r.length) runNow(r); return true; }
    case 'choice': {
      const opts = (typeof c[1] === 'function' ? c[1]() : c[1]).filter(o => !o.c || o.c());
      S.choice = { opts, hover: -1 };
      return false;
    }
    case 'give': giveItem(c[1]); return true;
    case 'take': takeItem(c[1]); return true;
    case 'clue': addClue(c[1]); return true;
    case 'ded': addDed(c[1]); return true;
    case 'flag': setFlag(c[1], c[2]); return true;
    case 'goal': G.goal = c[1]; uiFlash('goal'); return true;
    case 'sfx': sfx(c[1]); return true;
    case 'caption': S.caption = c[1]; S.capT = 0; S.capDur = Math.round((c[2] || 3) * FPS); return c[3] === 'nb';   // blocks unless 'nb'
    case 'doc': S.doc = c[1]; return false;
    case 'lb': S.lbTo = c[1]; return true;
    case 'cam': {
      if (c[1] === 'follow') { cam.fixed = false; cam.follow = ACT[c[2] || 'frank']; return true; }
      cam.fixed = true; const t = camTargetFor(c[1], c[2]); cam.tx = t[0]; cam.ty = t[1]; return true;
    }
    case 'place': {
      const a = ACT[c[1]]; a.x = c[2]; a.y = c[3]; if (c[4]) a.dir = DIRS[c[4]]; a.path = []; a.anim = 'idle'; a.sink = (c[5] && c[5].sink) || 0; a.z = (c[5] && c[5].z) || 0;
      if (actors.indexOf(a) < 0) { actors.push(a); renumberActors(); }
      return true;
    }
    case 'remove': { const a = ACT[c[1]]; const i = actors.indexOf(a); if (i >= 0) { actors.splice(i, 1); renumberActors(); } return true; }
    case 'save': saveGame(); return true;
    case 'end': G.mode = 'end'; endScreenStart(); return true;
    default: throw new Error('bad script op ' + op);
  }
}
function updateCmd(c) {
  const op = c[0];
  S.t++;
  switch (op) {
    case 'say': S.speech.t++; if (S.speech.t >= S.speech.dur) { S.speech = null; return true; } return false;
    case 'walk': return c._done;
    case 'pose': { const a = ACT[c[1]]; return !a || !a.pose; }
    case 'wait': return S.t >= Math.round(c[1] * FPS);
    case 'fade': S.fadeT++; S.fade = lerp(S.fadeFrom, S.fadeTo, S.fadeT / S.fadeDur); if (S.fadeT >= S.fadeDur) { S.fade = S.fadeTo; return true; } return false;
    case 'choice': return !S.choice;
    case 'caption': return S.t >= S.capDur;
    case 'doc': return !S.doc;
  }
  return true;
}
function updateScript() {
  for (let guard = 0; guard < 64; guard++) {
    if (!S.cur) {
      if (!S.q.length) return;
      S.cur = S.q.shift();
      if (startCmd(S.cur)) { S.cur = null; continue; }
      return;
    }
    if (updateCmd(S.cur)) { S.cur = null; continue; }
    return;
  }
}
function skipSpeech() {
  if (S.speech && S.speech.t > 6) { S.speech.t = S.speech.dur; return true; }
  return false;
}
function chooseOption(i) {
  const ch = S.choice; if (!ch || i < 0 || i >= ch.opts.length) return;
  const o = ch.opts[i];
  S.choice = null;
  if (o.once) setFlag('said_' + o.once);
  const cmds = [];
  const line = o.say !== undefined ? o.say : o.t.replace(/^\[[^\]]*\]\s*/, '');
  if (line) cmds.push(['say', 'frank', line]);
  const d = typeof o.d === 'function' ? o.d() : o.d;
  if (d) for (const x of d) cmds.push(x);
  runNow(cmds);
}

// =================================================================== INTERACTION
// hotspot fields: id, name, at [x,y] approach, face, look (string|fn->cmds), use (fn->cmds), talk (fn),
//                 items {itemId: fn}, cond fn, exit {room,x,y,dir}, kind ('exit'|'person'|'thing'), noWalk
function hsVisible(hs) { return !hs.cond || hs.cond(); }
function lookCmds(hs) {
  const l = typeof hs.look === 'function' ? hs.look() : hs.look;
  if (Array.isArray(l)) return l;
  return [['say', 'frank', l || "Nothing special."]];
}
function hsFacePoint(hs) { return hs.pos || hs.at; }
// a free spot about 0.9 m from an actor, on the side nearest Frank
function approachFor(a) {
  const fr = ACT.frank, gr = room.grid;
  let best = null, bd = 1e9;
  for (let k = 0; k < 16; k++) {
    const ang = k / 16 * TAU, x = a.x + Math.cos(ang) * 0.9, y = a.y + Math.sin(ang) * 0.9;
    if (!walkable(gr, x, y)) continue;
    const d = Math.hypot(x - fr.x, y - fr.y) + (y < a.y && x < a.y ? 0.3 : 0);
    if (d < bd) { bd = d; best = [x, y]; }
  }
  return best || nearestWalkable(gr, a.x + 0.9, a.y + 0.9);
}
function interact(hs, verb) {
  if (scriptBusy()) return;
  const fr = ACT.frank;
  const cmds = [];
  let at = hs.at, fp = hsFacePoint(hs);
  if (hs.actor) { const a = ACT[hs.actor]; fp = [a.x, a.y]; if (!at) at = approachFor(a); }
  if (verb === 'look') {
    if (fp) cmds.push(['face', 'frank', fp]);
    for (const c of lookCmds(hs)) cmds.push(c);
    run(cmds); return;
  }
  if (at && !hs.noWalk) cmds.push(['walk', 'frank', at[0], at[1]]);
  if (hs.actor) { cmds.push(['face', 'frank', hs.actor]); if (!hs.noTurn) cmds.push(['face', hs.actor, 'frank']); }
  else if (hs.face) cmds.push(['face', 'frank', hs.face]);
  else if (fp) cmds.push(['face', 'frank', fp]);
  let body = null;
  if (typeof verb === 'object' && verb.item) {
    const it = verb.item;
    if (hs.items && hs.items[it]) body = hs.items[it]();
    else if (hs.items && hs.items['*']) body = hs.items['*'](it);
    else body = [['say', 'frank', genericNo(it, hs)]];
    G.sel = null;
  } else if (hs.talk) body = hs.talk();
  else if (hs.exit) {
    const e = hs.exit;
    if (e.cond && !e.cond()) body = e.no ? e.no() : [['say', 'frank', "Not yet."]];
    else body = exitCmds(e);
  } else if (hs.use) body = hs.use();
  else body = lookCmds(hs);
  for (const c of body || []) cmds.push(c);
  run(cmds);
}
function exitCmds(e) {
  const out = [];
  if (e.sfx) out.push(['sfx', e.sfx]);
  out.push(['fade', 'out', 0.35], ['room', e.room, e.x, e.y, e.dir], ['fade', 'in', 0.35]);
  return out;
}
const GENERIC_NO = ["That won't do anything.", "No.", "I don't see how.", "That's not how that works."];
let genIdx = 0;
function genericNo(it, hs) {
  if (hs.kind === 'person') return "I'd rather not wave that around for no reason.";
  return GENERIC_NO[(genIdx++) % GENERIC_NO.length];
}

// =================================================================== ROOM ENTRY
function enterRoom(id, x, y, dir) {
  const r = ROOMS[id];
  if (!r) throw new Error('no room ' + id);
  if (room && room.onLeave) room.onLeave();
  room = r; G.roomId = id;
  buildRoomBuffer(r);
  actors.length = 0;
  const fr = ACT.frank;
  fr.x = x; fr.y = y; fr.dir = DIRS[dir] !== undefined ? DIRS[dir] : (dir || 0); fr.path = []; fr.anim = 'idle';
  actors.push(fr);
  if (r.cast) for (const c of r.cast()) {
    const a = ACT[c[0]]; a.x = c[1]; a.y = c[2]; a.dir = DIRS[c[3]] || 0; a.path = []; a.anim = 'idle'; a.pose = c[4] || null; a.poseT = c[4] ? 1e9 : 0;
    a.sink = (c[5] && c[5].sink) || 0; a.z = (c[5] && c[5].z) || 0;
    actors.push(a);
  }
  renumberActors();
  cam.follow = fr; cam.fixed = false; updateCamera(true);
  if (r.onEnter) { const cmds = r.onEnter(); if (cmds && cmds.length) queueEntrance(cmds); }
  if (!r.visited) r.visited = true;
  setFlag('visited_' + id);
}
// a scripted room change is always followed by its own fade-in: the room's entrance lines wait until it can be seen
function queueEntrance(cmds) {
  const i = S.q.findIndex(c => c[0] === 'fade' && c[1] === 'in');
  if (i < 0) runNow(cmds); else S.q.splice(i + 1, 0, ...cmds);
}
// actor hotspot ids: Frank 199, everyone else 200 + slot (redone whenever the list changes)
function renumberActors() { for (let i = 0; i < actors.length; i++) actors[i].hot = actors[i] === ACT.frank ? 199 : 200 + i; }
// hotspot object under a hot id in the current room
function hotspotById(hid) {
  if (hid === 0) return null;
  if (hid === 199) return FRANK_HS;
  if (hid >= 200) { const a = actors[hid - 200]; return a ? (room.people && room.people[a.id]) || null : null; }
  const hs = room.hotspots[hid - 1];
  return hs && hsVisible(hs) ? hs : null;
}
let FRANK_HS = null;     // defined by the story (Frank's self-look = hint)
