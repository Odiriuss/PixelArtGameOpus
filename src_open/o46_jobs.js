// =================================================================== JOBS: WORK THAT COMES IN OVER THE PHONE
// The phone in the office (or any payphone) lists what is on offer and what is done; a job is taken there and
// mostly paid there, when Frank calls the client back with what they wanted. Each uses the city as it is: a desk,
// a safe, a man in a bar, a guarded yard. Pier 9 comes in once he has proved himself.
const JOBS = [
  { id: 'letter', title: 'THE ENVELOPE', client: 'A woman who won\'t give her name', pay: 30,
    brief: 'Take a sealed envelope to the editor\'s desk at the Herald. Don\'t read it.',
    accept: J => { const it = giveItem('letter'); it.job = J.id; const K = findK('THE EDITOR\'S DESK'); J.it = { F: K.F, x: K.x, y: K.y + 0.9, r: 1.2, kind: 'deliver', label: 'LEAVE THE ENVELOPE ON THE DESK', J }; INTER.push(J.it); },
    where: J => J.it, status: J => 'Take the envelope to the editor\'s desk at the Herald.' },
  { id: 'rourke', title: 'THE CUE BALL MARKER', client: 'Big Joe Tully, bookmaker', pay: 20,
    brief: 'Eddie Rourke owes Joe $80 and plays pool at the Cue Ball every afternoon and night. Collect. Keep a quarter.',
    accept: J => { J.B = BUILDINGS.find(b => b && b.name === 'CUE BALL BILLIARDS'); }, where: J => J.p && J.p.alive ? J.p : J.B && { x: (J.B.x0 + J.B.x1) / 2, y: (J.B.y0 + J.B.y1) / 2 },
    status: J => J.got ? 'Call Joe from a phone and wire him his $60.' : 'Find Eddie Rourke at the Cue Ball Billiards.', ready: J => !!J.got,
    finish: J => { if (INV.money < 60) { toast('You need $60 to wire Joe his share.'); return false; } giveMoney(-60); return true; } },
  { id: 'ferro', title: 'FERRO SKIPPED BAIL', client: 'Mo Stein, bail bonds', pay: 150,
    brief: 'Sal Ferro drinks at the Volta after eight. Put him down and call it in. $150 breathing, $75 if not.',
    accept: J => { J.B = BUILDINGS.find(b => b && b.name === 'THE VOLTA'); }, where: J => J.p && J.p.alive && !J.p.down ? J.p : J.B && { x: (J.B.x0 + J.B.x1) / 2, y: (J.B.y0 + J.B.y1) / 2 },
    status: J => J.p && (J.p.ko || !J.p.alive) ? 'Call Mo Stein from a phone.' : 'Sal Ferro drinks at the Volta after 20:00.', ready: J => J.p && (J.p.ko || !J.p.alive),
    finish: J => { if (!J.p.alive) { J.payNow = 75; toast('"Dead? That halves it, Calder."'); } return true; } },
  { id: 'room714', title: 'ROOM 714', client: 'A voice on the line', pay: 100,
    brief: 'A man left a suitcase in room 714 at the Hotel Mirador. Somebody may be waiting. Bring back the photograph.',
    accept: J => { giveItem('roomkey').job = J.id; const K = findK('A SUITCASE'); K.key = 'mirador714'; fillContainer(K); const ph = newItem('photo'); ph.job = J.id; gridAdd(K.grid, ph); J.K = K; },
    where: J => J.K, status: J => hasJobItem('photo', 'room714') ? 'Call in the photograph from a phone.' : 'Hotel Mirador, seventh floor, room 714. The key opens the suitcase.',
    ready: J => hasJobItem('photo', 'room714'), finish: J => takeJobItem('photo', 'room714') },
  { id: 'ledger', title: 'LUCKY\'S BOOKS', client: 'Russo at the Herald', pay: 200,
    brief: 'Lucky keeps his real books in the safe in his back room. The Herald would print them. Mind the card game.',
    accept: J => { const K = findK('LUCKY\'S SAFE'); fillContainer(K); const L = newItem('ledger'); L.job = J.id; gridAdd(K.grid, L); J.K = K; },
    where: J => J.K, status: J => hasJobItem('ledger', 'ledger') ? 'Call Russo from a phone.' : 'The safe in the back room at Lucky\'s.', ready: J => hasJobItem('ledger', 'ledger'), finish: J => takeJobItem('ledger', 'ledger') },
  { id: 'cell', title: 'THE PROFESSOR\'S CELL', client: 'Professor Haldane, the university', pay: 250,
    brief: 'The professor wants one of Crown Energy\'s fusion cells, from the rack in their depot. He does not want to know how.',
    accept: J => { J.K = findK('THE CELL RACK'); }, where: J => J.K, status: J => ammoCount('cell') ? 'Call the professor from a phone.' : 'The rack in the Crown Energy depot, behind the yard.',
    ready: J => ammoCount('cell') > 0, finish: J => takeAmmo('cell', 1) === 1 },
  { id: 'pier9', title: 'WHAT COMES IN AT 2:17', client: 'Evelyn', pay: 400, after: 2,
    brief: 'A dock pass for Pier 9, and the time on its back. She wants Asterion\'s manifest from the office over the warehouse. The pass gets you through the gate at night.',
    accept: J => { giveItem('dockpass').job = J.id; const K = findK('SHIPPING PAPERS'); fillContainer(K); const m = newItem('manifest'); m.job = J.id; gridAdd(K.grid, m); J.K = K; },
    where: J => J.K, status: J => hasJobItem('manifest', 'pier9') ? 'Call Evelyn from a phone.' : 'The office over the Pier 9 warehouse. The pass works at the gate.',
    ready: J => hasJobItem('manifest', 'pier9'), finish: J => takeJobItem('manifest', 'pier9') }
];
for (const J of JOBS) J.state = 'offer';
function findK(name) { return CONTAINERS.find(K => K.name === name); }
function hasJobItem(key, job) { return INV.bag.some(e => e.it.key === key && e.it.job === job); }
function takeJobItem(key, job) { const e = INV.bag.find(e => e.it.key === key && e.it.job === job); if (!e) return false; gridRemove(INV.grid, e.it); return true; }
function jobOn(id) { const J = JOBS.find(j => j.id === id); return J && J.state === 'active' ? J : null; }
function jobsDone() { return JOBS.filter(J => J.state === 'done').length; }
function payJob(J) {
  const v = J.payNow || J.pay; J.state = 'done'; giveMoney(v); STATS.jobs++; sfx('coin');
  toast(J.title + ' - DONE. ' + money(v) + '.');
  if (J.it) { const k = INTER.indexOf(J.it); if (k >= 0) INTER.splice(k, 1); J.it = null; }
  if (JOBS.find(j => j.after && j.state === 'offer' && jobsDone() === j.after)) toast('The phone is ringing at the office.');
  saveGame(true);
}
INTERACT.deliver = { act: it => { const J = it.J; if (!takeJobItem('letter', J.id)) { toast('You don\'t have the envelope.'); return; } payJob(J); } };
// ------------------------------------------------------------------ people the jobs put in the world
function jobsTick() {
  if (tick % 30 !== 17) return;
  const R = jobOn('rourke'), S = jobOn('ferro'), K = jobOn('room714');
  if (R && !R.p && FRANK.B === R.B && businessOpen(R.B)) {
    const s = FRANK.F.spots.find(s => s.role === 'seat') || FRANK.F.spots[0];
    R.p = makePerson('civ', 'civM4', s.x, s.y, { F: FRANK.F, hp: 70, hold: 'none' }); R.p.name = 'EDDIE ROURKE';
    R.p.ai = { mode: 'spot', hx: s.x, hy: s.y, face: dirOf(s.dir), sink: 0, t: 0, aware: 0 };
    R.it = { F: FRANK.F, x: s.x, y: s.y, r: 1.3, kind: 'rourke', label: 'TALK TO EDDIE ROURKE', J: R }; INTER.push(R.it);
  }
  if (R && R.p && R.it) { R.it.x = R.p.x; R.it.y = R.p.y; if (!R.p.alive || R.p.down || R.got) { const k = INTER.indexOf(R.it); if (k >= 0) INTER.splice(k, 1); R.it = null; } }
  if (R && R.p && !R.got && R.p.loot && !R.p.loot.jobCash) { R.p.loot.cash = (R.p.loot.cash || 0) + 80; R.p.loot.jobCash = true; }
  if (R && R.p && R.p.loot && R.p.loot.jobCash && R.p.loot.cash === 0) R.got = true;
  if (S && !S.p && FRANK.B === S.B && businessOpen(S.B) && (clockHour() >= 20 || clockHour() < 3)) {
    const s = FRANK.F.spots.find(s => s.role === 'bar') || FRANK.F.spots[0];
    S.p = spawnGoon(FRANK.F, s.x, s.y, { cast: 'goon2', gun: 'snub', dir: dirOf(s.dir), sink: 2, hp: 90 }); S.p.name = 'SAL FERRO'; S.p.persist = true; FRANK.F.people.push(S.p);
  }
  if (K && FRANK.F && FRANK.F.room714 && !K.guard) {
    const U = FRANK.F, g = U.spots.find(s => s.role === 'guard');
    K.guard = spawnGoon(U, g.x, g.y, { cast: 'goon', gun: 'm1911', dir: dirOf(g.dir), guarded: true, hostile: true, armed: true }); U.people.push(K.guard);
    K.guard.ai.hostile = true;
  }
}
INTERACT.rourke = { act: it => {
  const J = it.J, p = J.p; faceTo(p, FRANK.x - p.x, FRANK.y - p.y);
  if (PSTAT.charm >= 3 || (PLAYER.drawn && FRANK.gun.G.kind === 'gun') || hash(CLOCK.day, 7) < 0.5) { giveMoney(80); J.got = true; say('Eddie Rourke', 'All right, all right. Tell Joe he\'s a bloodsucker. Here.'); sfx('coin'); }
  else { say('Eddie Rourke', 'Joe can whistle for it.'); p.team = 'goons'; p.gun = makeGun('knife'); p.ai = guardAI(p, { hostile: true }); setAware(p, AW.ALERT); }
} };
// ------------------------------------------------------------------ the phone and the notebook
function openJobs(src) { UI.mode = 'jobs'; UI.src = src; UI.sel = 0; UI.scroll = 0; sfx(src === 'note' ? 'page' : 'tick'); }
function jobList() { return JOBS.filter(J => J.state !== 'offer' || !J.after || jobsDone() >= J.after).filter(J => UI.src !== 'note' || J.state !== 'offer'); }
function jobsUiTick() {
  if (pressed('Escape') || pressed('KeyJ') || pressed('KeyE')) { closeUI(); return; }
  const L = jobList();
  if (pressed('KeyW') || pressed('ArrowUp')) UI.sel = Math.max(0, UI.sel - 1);
  if (pressed('KeyS') || pressed('ArrowDown')) UI.sel = Math.min(L.length - 1, UI.sel + 1);
  if (INPUT.clicks > 0) { const i = Math.floor((INPUT.my - 22) / 12); if (INPUT.mx < 130 && i >= 0 && i < L.length) UI.sel = i; else if (INPUT.mx > 138 && INPUT.my > 150) jobAction(L[UI.sel]); }
  if (pressed('Enter') || pressed('Space')) jobAction(L[UI.sel]);
  INPUT.clicks = 0;
}
function jobAction(J) {
  if (!J || UI.src === 'note') return;
  if (J.state === 'offer') { J.state = 'active'; J.accept(J); toast('Taken: ' + J.title + '.'); sfx('page'); return; }
  if (J.state === 'active' && J.ready && J.ready(J)) { if (!J.finish || J.finish(J) !== false) payJob(J); }
}
function drawJobs() {
  remapRect(0, 0, W, H, DIM);
  panel(6, 6, W - 12, H - 12);
  drawTextOutlined(UI.src === 'note' ? 'THE NOTEBOOK' : UI.src === 'office' ? 'THE OFFICE PHONE' : 'A PAYPHONE', 12, 8, C.PALEY);
  const L = jobList(), m = money(INV.money); drawText(m, W - 14 - textWidth(m), 8, C.CREAM);
  if (!L.length) { drawText(UI.src === 'note' ? 'No work on. Try the office phone.' : 'Nothing today.', 12, 26, C.CRS); return; }
  // the list: a mark before each job taken (pale: on it, green: ready to call in, grey: done)
  L.forEach((J, i) => {
    const y = 22 + i * 12, sel = i === UI.sel, ready = J.state === 'active' && J.ready && J.ready(J);
    if (sel) fillRect(10, y - 1, 126, 12, C.ST0);
    if (J.state !== 'offer') fillRect(12, y + 2, 3, 3, J.state === 'done' ? C.ST1 : ready ? C.GRNL : C.PALEY);
    drawText(fitText(J.title, 116), 18, y, J.state === 'done' ? C.ST1 : sel ? C.PALEY : C.CREAM);
  });
  const J = L[Math.min(UI.sel, L.length - 1)]; if (!J) return;
  drawText(fitText(J.title, 166), 142, 22, C.PALEY); drawText(fitText(J.client, 166), 142, 33, C.ST2);
  wrapText(J.brief, 166).forEach((l, i) => drawText(l, 142, 46 + i * LINE_H, C.CRS));
  const st = J.state === 'done' ? 'DONE' : J.state === 'active' ? (J.ready && J.ready(J) ? 'READY' : 'ON IT') : '';
  drawText('PAYS ' + money(J.pay), 142, 112, C.GRNL); if (st) drawText(st, 308 - textWidth(st), 112, st === 'READY' ? C.GRNL : C.ST2);
  if (J.state === 'active') wrapText(J.status(J), 166).forEach((l, i) => drawText(l, 142, 124 + i * LINE_H, C.CREAM));
  const act = UI.src === 'note' ? '' : J.state === 'offer' ? 'ENTER: TAKE THE JOB' : J.state === 'active' && J.ready && J.ready(J) ? 'ENTER: CALL IT IN' : '';
  if (act) drawTextOutlined(act, 142, 154, (tick >> 4) & 1 ? C.PALEY : C.CREAM);
  drawText('W/S CHOOSE   ESC CLOSE', 12, 160, C.ST1);
  drawCursor();
}
