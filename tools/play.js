// usage: node play.js routeA|routeB   -- drives the whole act through window.__game and asserts the outcome
const { launch, pageUrl, shotPath } = require('./common');
const DRIVER = `window.__drv = (() => {
  const g = window.__game;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  async function idle(maxMs = 90000) {
    const t0 = performance.now();
    while (performance.now() - t0 < maxMs) {
      if (g.S.speech && g.S.speech.t > 1) g.S.speech.t = g.S.speech.dur;
      if (g.S.doc) g.S.doc = null;
      if (g.S.choice) return 'choice';
      if (g.G.mode === 'end') return 'end';
      const fr = g.ACT.frank;
      if (!g.scriptBusy() && !fr.path.length) { await sleep(80); if (!g.scriptBusy() && !g.S.choice && !fr.path.length) return 'idle'; }
      await sleep(10);
    }
    return 'timeout';
  }
  function hs(id) {
    const r = g.room, h = r.hotspots.find(h => h.id === id);
    if (h) { if (h.cond && !h.cond()) throw new Error('hotspot hidden: ' + id); return h; }
    if (r.people) for (const k in r.people) if (r.people[k].id === id || k === id) {
      if (g.actors.indexOf(g.ACT[r.people[k].actor]) < 0) throw new Error('person not present: ' + id);
      return r.people[k];
    }
    throw new Error('no hotspot ' + id + ' in ' + r.id);
  }
  async function ready(what) { const s = await idle(); if (s !== 'idle') throw new Error('not idle before ' + what + ': ' + s + (g.S.choice ? ' [' + g.S.choice.opts.map(o => o.t).join(' | ') + ']' : '')); }
  async function act(id, verb) { await ready(id); g.interact(hs(id), verb || 'use'); return idle(); }
  async function use(item, id) { await ready(item + '>' + id); if (!g.G.inv.includes(item)) throw new Error('no item ' + item); g.interact(hs(id), { item }); return idle(); }
  async function choose(sub) {
    if (!g.S.choice) { const s = await idle(); if (s !== 'choice') throw new Error('no choice for ' + sub + ' (' + s + ')'); }
    const i = g.S.choice.opts.findIndex(o => o.t.indexOf(sub) >= 0);
    if (i < 0) throw new Error('option not found: ' + sub + ' in [' + g.S.choice.opts.map(o => o.t).join(' | ') + ']');
    g.chooseOption(i); return idle();
  }
  async function item(a, b) { await ready(a); if (b) g.useItemOnItem(a, b); else g.run(g.ITEMS[a].use()); return idle(); }
  async function look(a) { await ready(a); g.run(g.lookItem(a)); return idle(); }
  async function link(a, b, expectOk) { await ready(a + '+' + b); const r = g.connect(a, b); if (expectOk !== false && !r.ok) throw new Error('connect failed ' + a + '+' + b + ': ' + r.text); return idle(); }
  async function until(fn, ms, what) { const t0 = performance.now(); while (!fn()) { if (performance.now() - t0 > (ms || 60000)) throw new Error('timed out waiting: ' + what); if (g.S.speech) g.S.speech.t = g.S.speech.dur; await sleep(20); } return idle(); }
  function expect(c, msg) { if (!c) throw new Error('expectation failed: ' + msg); return 'ok'; }
  const pause = ms => sleep(ms).then(() => 'paused');
  function pick(sub) { const i = g.S.choice.opts.findIndex(o => o.t.indexOf(sub) >= 0); if (i < 0) throw new Error('no option ' + sub); g.chooseOption(i); return 'picked'; }
  async function watch(fn, ms, what) { const t0 = performance.now(); while (!fn()) { if (performance.now() - t0 > (ms || 60000)) throw new Error('timed out waiting: ' + what); await sleep(20); } return 'seen'; }
  function state() { return g.room.id + ' | clues ' + g.G.clues.length + ' deds ' + g.G.deds.length + ' | ' + g.G.goal; }
  return { idle, act, use, choose, item, look, link, until, expect, state, hs, g, pause, pick, watch };
})(); 1`;
const COMMON_START = [
  "d.g.newGame(), 1", "d.idle()",
  "d.act('envelope')", "d.item('envelope')", "d.look('letter')", "d.look('cash')", "d.look('matchbook')",
  "d.until(() => d.g.G.flags.phone_ringing, 60000, 'phone')", "d.act('phone')"
];
const TO_714 = ["d.g.enterRoom('room714', 1.5, 3.5, 'NE'), 1", "d.idle()"];
const ROUTES = {
  shots: [
    "(d.g.newGame(), d.g.S.q.length = 0, d.g.S.cur = null, d.g.S.fade = 0, d.g.S.lb = 0, d.g.S.lbTo = 0, d.g.S.caption = null, 1)",
    "(d.g.G.inv.push('letter'), d.g.G.flags.saw_sedan = true, d.g.G.flags.let_in = true, d.g.G.flags.r714_seen = true, 1)", ...TO_714,
    "(d.g.run(ambushScene()), 1)", "d.pause(2500)", "d.idle()", "SHOT:v_ambush.png",
    "d.pick('Go on, then.')",
    "d.watch(() => d.g.room.id === 'lobby' && d.g.S.speech && d.g.S.speech.who === 'russo', 60000, 'lobby')", "d.pause(1200)", "SHOT:v_hurt.png",
    "d.idle()", "(d.g.G.flags.paid_cover = true, d.g.G.flags.backstage_ok = true, d.g.G.flags.teague_on_stage = true, d.g.run(driveToNickelMile()), 1)", "d.pause(2600)", "SHOT:v_drive.png",
    "d.idle()", "SHOT:v_nickel.png", "d.act('clubdoor')", "d.pause(800)", "d.idle()", "SHOT:v_club_teague.png",
    "(d.g.G.flags.mags_gone = true, d.g.G.clues.push('hooks'), d.g.enterRoom('backstage', 1.5, 1.3, 'NE'), 1)", "d.idle()", "(d.g.run(mirrorLift()), 1)",
    "d.until(() => d.g.S.doc, 20000, 'doc')", "SHOT:v_lipstick.png", "(d.g.S.doc = null, 1)", "d.idle()",
    "(d.g.interact(d.hs('stagedoor'), 'use'), 1)", "d.watch(() => d.g.S.caption === '12:00 A.M.' && d.g.S.capT > 40, 30000, 'midnight caption')", "SHOT:v_midnight.png", "d.idle()",
    "(d.g.G.flags.stagedoor_open = true, 1)", "d.item('letter', 'matchbook')", "d.pick('Burn it.')", "d.watch(() => d.g.G.flags.burn_t, 30000, 'burn')", "d.pause(900)", "SHOT:v_burn.png",
    "d.watch(() => d.g.G.flags.green_t, 60000, 'green')", "d.pause(1100)", "SHOT:v_green.png",
    "d.watch(() => d.g.G.mode === 'end', 60000, 'end')", "d.pause(4000)", "SHOT:v_end.png"
  ],
  routeA: COMMON_START.concat([
    "d.choose('[Empathy]')", "d.choose(\"I'll take the case.\")", "d.expect(d.g.G.flags.took_case, 'took case')",
    "d.act('basket')", "d.look('herald')", "d.use('letter', 'shoebox')",
    "d.act('door')", "d.act('patches', 'look')", "d.act('bucket', 'look')", "d.act('ladder', 'look')",
    "d.link('wet_patches', 'mopped_six')", "d.link('dry_envelope', 'street_door')", "d.link('d_inside', 'roof_hatch')",
    "d.link('bank_band', 'herald_lights')", "d.link('mirador_paper', 'case_714')",
    "d.act('stairs')", "d.expect(d.g.room.id === 'ferrier', 'ferrier')",
    "d.act('sedan', 'look')", "d.act('sal')", "d.choose(\"What's going on\")", "d.choose('You knew Evelyn')", "d.choose('[Bribe]')", "d.choose('See you')",
    "d.link('letter', 'sedan')", "d.link('letter', 'eyes_down')", "d.link('letter', 'blue_suit')",
    "d.act('mirador')", "d.expect(d.g.room.id === 'lobby', 'lobby')",
    "d.act('register', 'look')", "d.act('master', 'look')", "d.act('stationery', 'look')",
    "d.act('pell')", "d.choose('Anyone go up')", "d.choose('Tell me about your clocks')", "d.choose('Evelyn Hart')", "d.choose('Seven rooms')", "d.choose('[Bribe]')",
    "d.expect(d.g.G.clues.includes('block_booking'), 'block booking')",
    "d.act('lift')", "d.expect(d.g.room.id === 'corridor7', 'corridor')",
    "d.act('dialA', 'look')", "d.act('dialB', 'look')", "d.act('dialC', 'look')", "d.act('stairs', 'look')", "d.act('tray', 'look')",
    "d.link('dials_217', 'master_clock')", "d.link('desk_nobody', 'east_stairs')", "d.link('block_booking', 'blue_suit')",
    "d.act('mulroney')", "d.choose('[Truth]')", "d.expect(d.g.G.flags.let_in, 'let in')",
    "d.act('d714')", "d.expect(d.g.room.id === 'room714', '714')",
    "d.act('window', 'look')", "d.act('latch', 'look')", "d.act('mirror', 'look')", "d.act('locket', 'look')", "d.act('handbag', 'look')",
    "d.act('ashtray', 'look')", "d.act('glass', 'look')", "d.act('clock', 'look')", "d.act('trolley', 'look')", "d.act('body', 'look')", "d.act('door', 'look')",
    "d.link('cold_latch', 'frost_glass')", "d.link('locked_door', 'window_latched')", "d.link('ash_tray', 'her_brand')", "d.link('captain_gangster', 'd_sealed')",
    "d.act('russo')", "d.choose('Mickey Salvi?')", "d.choose('[Empathy]')", "d.choose(\"I'm done here.\")", "d.choose('[Warn]')",
    "d.expect(d.g.G.flags.ch2_done && d.g.G.flags.russo_safe && !d.g.G.flags.russo_hurt, 'russo safe')",
    "d.act('lift')", "d.act('pantry')", "d.link('receipt_tomorrow', 'carbon_book')",
    "d.act('lift')", "d.act('doors')", "d.expect(d.g.room.id === 'nickel', 'nickel')",
    "d.act('comet', 'look')", "d.act('gus')", "d.choose('Customer')", "d.act('clubdoor')", "d.expect(d.g.room.id === 'club', 'club')",
    "d.act('lou')", "d.choose('[Buy]')", "d.choose('Was Mickey')", "d.choose('When did Evelyn')", "d.choose('Anybody call')", "d.choose(\"That's all\")",
    "d.act('mickey')", "d.choose('[Observe]')", "d.choose('What did she want')", "d.choose(\"The captain's got\")", "d.choose('[Persuade]')",
    "d.expect(d.g.G.flags.backstage_ok, 'backstage ok')", "d.link('ash_tray', 'salvi_cigar')",
    "d.act('backdoor')", "d.expect(d.g.room.id === 'backstage', 'backstage')",
    "d.act('mags')", "d.choose('[Empathy]')", "d.act('vanity')", "d.act('mirror', 'look')", "d.act('mirror')",
    "d.expect(d.g.G.clues.includes('lipstick_message'), 'lipstick')",
    "d.act('teague')", "d.choose('You recorded her')", "d.choose(\"What's on it\")", "d.choose('[Promise]')", "d.expect(d.g.G.inv.includes('acetate'), 'acetate')",
    "d.use('acetate', 'phono')", "d.expect(d.g.G.clues.includes('acetate_pulse'), 'pulse')",
    "d.link('lipstick_message', 'herald_lights')", "d.link('lipstick_message', 'acetate_pulse')",
    "d.act('stagedoor')", "d.expect(d.g.room.id === 'alley' && d.g.G.flags.midnight, 'midnight')",
    "d.act('rung', 'look')", "d.link('rime_rung', 'cold_latch')",
    "(d.g.UI.note = true, d.g.UI.notePage = 1, 1)", "d.pause(400)", "SHOT:v_notebook.png", "(d.g.UI.notePage = 3, 1)", "d.pause(300)", "SHOT:v_notebook4.png", "(d.g.UI.note = false, 1)",
    "(d.g.S.doc = 'lipstick', 1)", "d.pause(300)", "SHOT:v_lipdoc.png", "(d.g.S.doc = null, 1)",
    "d.act('street')", "d.expect(d.g.room.id === 'alley', 'cannot leave before deciding')",
    "d.item('letter', 'matchbook')", "d.choose('Burn it.')",
    "d.until(() => d.g.G.mode === 'end', 60000, 'end screen')",
    "d.expect(d.g.G.flags.burned_letter && d.g.G.flags.got_acetate && !d.g.G.flags.russo_hurt, 'ending flags')",
    "'clues ' + d.g.G.clues.length + '/' + Object.keys(d.g.CLUES).length + ' deds ' + d.g.G.deds.length + '/' + d.g.DEDS.length"
  ]),
  routeB: COMMON_START.concat([
    "d.choose('[Silence]')", "d.choose('What does it pay?')", "d.choose(\"I'll take the case.\")",
    "d.act('door')", "d.act('stairs')", "d.act('mirador')", "d.act('lift')",
    "d.act('d714')", "d.choose('[Lie]')", "d.expect(d.g.G.flags.lied, 'lied')", "d.act('d714')",
    "d.act('latch', 'look')", "d.act('glass', 'look')", "d.act('clock', 'look')", "d.act('mirror', 'look')", "d.act('ashtray', 'look')",
    "d.until(() => d.g.G.flags.amb_warned, 20000, 'warning')",
    "d.act('door')", "d.expect(!d.g.S.choice || !d.g.S.choice.opts.some(o => o.t.indexOf('[Warn]') >= 0), 'no warn option without the sedan')",
    "d.choose('[Truth] Show her the note.')",
    "d.expect(d.g.G.flags.russo_hurt && d.g.G.flags.ch2_done, 'russo hurt because Frank lied')",
    "d.act('doors')", "d.expect(d.g.room.id === 'nickel', 'nickel')",
    "d.act('gus')", "d.choose(\"I'm a private detective.\")", "d.choose('Fine. Four dollars.')", "d.act('clubdoor')",
    "d.act('backdoor')", "d.expect(d.g.room.id === 'club', 'blocked by Bruno')",
    "d.act('wreath')", "d.act('bruno')", "d.expect(d.g.G.flags.backstage_ok, 'wreath route')",
    "d.act('backdoor')", "d.act('mirror')", "d.expect(!d.g.G.clues.includes('lipstick_message'), 'Mags guards the mirror')",
    "d.until(() => d.g.G.flags.mags_gone, 90000, 'Mags called away')",
    "d.act('mirror')", "d.act('mirror')", "d.expect(d.g.G.clues.includes('lipstick_message'), 'lipstick')",
    "d.act('teague')", "d.choose('You recorded her')", "d.choose('[Bribe]')", "d.expect(d.g.G.flags.teague_on_stage, 'teague on stage')",
    "d.act('acetate')", "d.expect(d.g.G.flags.stole_acetate, 'stole acetate')",
    "d.act('clubdoor')", "d.expect(d.g.actors.includes(d.g.ACT.teague), 'Teague on the stand')", "d.act('backdoor')",
    "d.act('stagedoor')", "d.use('letter', 'cans')", "d.choose('Keep it.')",
    "d.until(() => d.g.G.mode === 'end', 60000, 'end screen')",
    "d.expect(!d.g.G.flags.burned_letter && d.g.G.flags.kept_letter && d.g.G.flags.russo_hurt, 'ending flags B')",
    "'clues ' + d.g.G.clues.length + ' deds ' + d.g.G.deds.length"
  ])
};
(async () => {
  const route = process.argv[2] || 'routeA';
  const browser = await launch({ protocolTimeout: 600000 });
  const page = await browser.newPage();
  await page.setViewport({ width: 960, height: 540, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  await page.goto(pageUrl('hourglass_city.html', '?nosave=1&mute=1&turbo=' + (route === 'shots' ? 1 : 10)), { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(DRIVER);
  let n = 0, failed = false;
  for (const step of ROUTES[route]) {
    n++;
    if (step.startsWith('SHOT:')) { await page.screenshot({ path: shotPath(step.slice(5)) }); continue; }
    try {
      const r = await page.evaluate('(async () => { const d = window.__drv; const r = await (' + step + '); return [String(r), d.state()]; })()');
      if (process.env.VERBOSE || n % 10 === 0 || n === ROUTES[route].length) console.log(n, step, '->', r[0], '|', r[1]);
      if (errs.length) { console.log('ERRORS at step', n, step, errs.join('\n')); failed = true; break; }
      if (r[0] === 'timeout') { console.log('TIMEOUT at step', n, step, r[1]); failed = true; break; }
    } catch (e) {
      console.log('FAILED at step', n, step, '\n  ', e.message.split('\n')[0]);
      await page.screenshot({ path: shotPath('fail_' + route + '.png') });
      failed = true; break;
    }
  }
  if (!failed) { console.log('ROUTE', route, 'COMPLETE', n, 'steps'); await page.screenshot({ path: shotPath('end_' + route + '.png') }); }
  if (errs.length) console.log(errs.join('\n'));
  await browser.close();
})();
