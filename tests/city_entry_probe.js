(async function () {
  const g = window.__game, sleep = ms => new Promise(r => setTimeout(r, ms));
  const cases = [
    ['ferrier', 'lobby', {}, []], ['lobby', 'corridor7', {}, []], ['corridor7', 'room714', { let_in: true }, []],
    ['nickel', 'club', { paid_cover: true }, []], ['club', 'backstage', { backstage_ok: true }, []],
    ['backstage', 'alley', {}, ['lipstick_message']], ['nickel', 'alley', {}, []]
  ];
  const out = [];
  for (const [from, to, flags, clues] of cases) {
    g.newGame(); g.S.q.length = 0; g.S.cur = null; g.S.caption = null; g.S.speech = null;
    Object.assign(g.G.flags, flags); clues.forEach(c => g.G.clues.push(c));
    const r = g.ROOMS[from]; g.enterRoom(from, r.start[0], r.start[1], r.start[2]);
    g.S.q.length = 0; g.S.cur = null; g.S.speech = null; g.S.fade = 0; g.S.lb = g.S.lbTo = 0;
    const h = g.room.hotspots.find(h => h.exit && h.exit.room === to);
    if (!h) { out.push(from + '>' + to + ': no exit hotspot'); continue; }
    g.interact(h, 'use');
    const t0 = performance.now(); let rec = null;
    while (performance.now() - t0 < 20000) {
      const c = g.S.cur;
      if (g.room.id === to && c && ['fade', 'room', 'sfx'].indexOf(c[0]) < 0) { rec = c[0] + ' @fade=' + g.S.fade.toFixed(2); break; }
      if (g.room.id === to && !g.scriptBusy()) { rec = 'no entrance script'; break; }
      await sleep(5);
    }
    out.push(from + '>' + to + ': ' + (rec || 'timeout in ' + g.room.id));
  }
  return out;
})()
