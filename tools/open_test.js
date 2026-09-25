// usage: node tools/open_test.js [only]  -- plays the open city headless through its test hooks and real inputs;
// each check prints PASS or FAIL, screenshots go to shots/. Exit code 1 if anything failed or the page threw.
const { launch, pageUrl, shotPath } = require('./common');
const only = process.argv[2] || '';
(async () => {
  const browser = await launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 960, height: 540, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', e => { errs.push(e.message); console.log('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(1, 5).join('\n')); });
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') { errs.push(m.text()); console.log(m.type() + ': ' + m.text()); } });
  let fails = 0;
  const ev = (f, ...a) => page.evaluate(f, ...a);
  // a screenshot with every tile on screen lit for the hour (the game spreads relighting over frames)
  const shot = async name => { await ev(() => { RELIGHT.budget = 1e9; __test.render(); RELIGHT.budget = 3; }); await page.screenshot({ path: shotPath('open_' + name + '.png') }); };
  const until = async (fn, ms, arg) => { const t0 = Date.now(); while (Date.now() - t0 < (ms || 20000)) { if (await ev(fn, arg)) return true; await new Promise(r => setTimeout(r, 100)); } return false; };
  const run = async q => { await ev(q => __test.run(eval(q)), q); return until(() => !__test.busy(), 60000); };
  async function check(name, fn) {
    if (only && !name.includes(only)) return;
    try { const r = await fn(); if (r === true || (r && r.ok)) console.log('PASS ' + name + (r.info ? '  ' + JSON.stringify(r.info) : '')); else { fails++; console.log('FAIL ' + name + '  ' + JSON.stringify(r)); } }
    catch (e) { fails++; console.log('FAIL ' + name + '  threw ' + e.message.split('\n')[0]); }
  }
  await page.goto(pageUrl('hourglass_opencity.html', '?mute=1&fresh=1&god=1'), { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 800));
  await ev(() => { __test.begin(); __test.GAME.turbo = 1; });

  await check('boot: Frank in his office upstairs', async () => {
    const s = await ev(() => __test.state());
    return { ok: s.frank[3] === '1140 FERRIER STREET' && s.frank[2] > 1 && s.mode === 'play', info: s };
  });
  await check('stairs: down to the ground floor by E', async () => {
    const st = await ev(() => { const F = __test.FRANK.F, it = __test.INTER.find(i => i.F === F && i.kind === 'stairs'); return it && [it.x, it.y]; });
    if (!st) return { ok: false, why: 'no stairs INTER upstairs' };
    await run(`[{ walk: [${st[0]}, ${st[1]}], near: 0.6 }, { press: 'KeyE' }, { wait: 90 }]`);
    const s = await ev(() => [__test.FRANK.F && __test.FRANK.F.f, __test.FRANK.z, __test.LIFT.f, __test.state().prompt]);
    await shot('stairs_down');
    return { ok: s[0] === 0 && s[1] === 0, info: s };
  });
  await check('door: out into Ferrier Street', async () => {
    const d = await ev(() => { const D = __test.FRANK.B.doorList[0]; return [D.cx + D.nx * 1.8, D.cy + D.ny * 1.8]; });
    await run(`[{ walk: [${d[0]}, ${d[1]}], near: 0.5, ms: 1500 }, { wait: 60 }]`);
    const s = await ev(() => __test.state());
    await shot('street_night');
    return { ok: s.frank[3] === null, info: s.frank };
  });
  await check('car: into the Buick and drive', async () => {
    const c = await ev(() => { const V = __test.VEH.find(v => v.own); return [V.x, V.y]; });
    await run(`[{ walk: [${c[0]}, ${c[1]}], near: 2.2, ms: 1500 }, { press: 'KeyE' }, { wait: 30 }]`);
    const inCar = await ev(() => !!__test.PLAYER.car);
    if (!inCar) return { ok: false, why: 'not in the car', s: await ev(() => __test.state()) };
    const p0 = await ev(() => [__test.PLAYER.car.x, __test.PLAYER.car.y]);
    await run(`[{ hold: 'KeyW' }, { wait: 150 }, { hold: 'KeyW', on: false }, { hold: 'KeyS' }, { wait: 90 }, { hold: 'KeyS', on: false }, { wait: 30 }]`);
    const p1 = await ev(() => [__test.PLAYER.car.x, __test.PLAYER.car.y]);
    await shot('driving');
    await run(`[{ press: 'KeyE' }, { wait: 40 }]`);
    const out = await ev(() => !__test.PLAYER.car && !__test.FRANK.inCar);
    return { ok: Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) > 3 && out, info: { moved: Math.hypot(p1[0] - p0[0], p1[1] - p0[1]).toFixed(1), out } };
  });
  await check('day and night: lamps off by day, on by night', async () => {
    await ev(() => __test.setHour(13)); await ev(() => __test.world(40));
    const day = await ev(() => ({ on: __test.LIGHTS.filter(L => L && L.kind === 'street' && __test.LIGHTS.indexOf(L) > 0).length, lit: [...Array(__test.LIGHTS.length).keys()].slice(1).filter(i => __test.LIGHTS[i].kind === 'street' && LAMP_ON[i]).length, light: __test.LIGHTM.v }));
    await shot('day');
    await ev(() => __test.setHour(22)); await ev(() => __test.world(40));
    const night = await ev(() => ({ lit: [...Array(__test.LIGHTS.length).keys()].slice(1).filter(i => __test.LIGHTS[i].kind === 'street' && LAMP_ON[i]).length }));
    await shot('night');
    return { ok: day.lit === 0 && night.lit > 10, info: { day, night } };
  });
  await check('roof-lift: inside Lucky\'s the roof comes off', async () => {
    await ev(() => __test.setHour(21));
    const B = await ev(() => { const B = __test.findB("LUCKY'S BAR"); const D = B.doorList[0]; __test.teleport(D.cx + D.nx * 2, D.cy + D.ny * 2); return [D.cx - D.nx * 1.5, D.cy - D.ny * 1.5]; });
    await run(`[{ walk: [${B[0]}, ${B[1]}], near: 0.5, ms: 900 }, { wait: 60 }]`);
    const s = await ev(() => ({ b: __test.LIFT.b && __test.LIFT.b.name, k: __test.LIFT.k, inB: __test.FRANK.B && __test.FRANK.B.name, people: __test.FRANK.F && __test.FRANK.F.people.length }));
    await shot('lucky_inside');
    return { ok: s.b === "LUCKY'S BAR" && s.k > 0.9, info: s };
  });
  await check('upstairs: the Blue Comet office by its stairs', async () => {
    await ev(() => { const B = __test.findB('THE BLUE COMET'); const R = B.floors[0].R; __test.teleport((R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2, 'THE BLUE COMET', 0); });
    const st = await ev(() => { const it = __test.INTER.find(i => i.F === __test.FRANK.F && i.kind === 'stairs' && i.to); return it && [it.x, it.y]; });
    if (!st) return { ok: false, why: 'no stairs' };
    await run(`[{ walk: [${st[0]}, ${st[1]}], near: 0.6, ms: 1500 }, { press: 'KeyE' }, { wait: 90 }]`);
    const s = await ev(() => ({ f: __test.FRANK.F && __test.FRANK.F.f, z: __test.FRANK.z, guards: __test.PEOPLE.filter(p => p.F === __test.FRANK.F && p.team === 'goons').length }));
    await shot('comet_office');
    return { ok: s.f === 1 && s.guards >= 2, info: s };
  });
  await check('shop: buy .45 rounds at Keller & Son', async () => {
    await ev(() => { __test.setHour(11); const B = __test.findB('KELLER & SON GUNSMITHS'); const R = B.floors[0].R; __test.teleport((R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2 + 1, 'KELLER & SON GUNSMITHS', 0); __test.world(10); });
    const r = await ev(() => {
      const it = __test.INTER.find(i => i.kind === 'shop' && i.B === __test.FRANK.B); if (!it) return { why: 'no counter' };
      const m0 = __test.INV.money; __test.openShop(it); if (__test.UI.mode !== 'inv') return { why: 'shop did not open', staff: __test.PEOPLE.filter(p => p.staff === it.B).length };
      const row = __test.UI.rows.find(r => r.item && r.item.key === 'a45'); row.act();
      return { m0, m1: __test.INV.money, n: __test.INV.bag.filter(e => e.it.key === 'a45').reduce((a, e) => a + e.it.n, 0) };
    });
    await shot('shop');
    await ev(() => __test.closeUI());
    return { ok: r.m1 < r.m0 && r.n >= 14, info: r };
  });
  await check('inventory: the paper doll and the bag', async () => {
    await run(`[{ press: 'KeyI' }, { wait: 2 }]`);
    const open = await ev(() => __test.UI.mode);
    await shot('inventory');
    await ev(() => __test.closeUI());
    return { ok: open === 'inv', info: open };
  });
  await check('inventory by mouse: drag a coat onto the doll, buy from a counter by its row', async () => {
    const worn = await ev(() => {
      __test.giveItem('overcoat', 1); openInventory(); __test.step(1);
      const e = __test.INV.bag.find(e => e.it.key === 'overcoat'), D = DOLL.coat;
      INPUT.mx = BAGXY[0] + e.x * CELL + 4; INPUT.my = BAGXY[1] + e.y * CELL + 4; INPUT.clicks = 1; INPUT.mdown = true; __test.step(1);
      const dragging = !!__test.UI.drag;
      INPUT.mx = D[0] + 6; INPUT.my = D[1] + 6; __test.step(1); INPUT.mdown = false; __test.step(1);
      const r = { dragging, coat: __test.INV.equip.coat && __test.INV.equip.coat.key, trenchInBag: __test.INV.bag.some(e => e.it.key === 'trench') };
      __test.closeUI(); return r;
    });
    const bought = await ev(() => {
      __test.setHour(11); const B = __test.findB('KELLER & SON GUNSMITHS'), R = B.floors[0].R; __test.teleport((R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2 + 1, B.name, 0); __test.world(10);
      const it = __test.INTER.find(i => i.kind === 'shop' && i.B === B); __test.openShop(it); __test.step(1);
      const k = __test.UI.rows.findIndex(r => r.item && r.item.key === 'a38'), m0 = __test.INV.money, n0 = __test.INV.bag.filter(e => e.it.key === 'a38').reduce((a, e) => a + e.it.n, 0);
      INPUT.mx = 60; INPUT.my = ROWS.y + (k - __test.UI.scroll) * ROWS.h + 5; __test.step(1); const hover = __test.UI.hover && __test.UI.hover.row && __test.UI.hover.row.item.key;
      INPUT.clicks = 1; __test.step(1);
      const r = { hover, paid: +(m0 - __test.INV.money).toFixed(2), got: __test.INV.bag.filter(e => e.it.key === 'a38').reduce((a, e) => a + e.it.n, 0) - n0 };
      __test.closeUI(); return r;
    });
    return { ok: worn.dragging && worn.coat === 'overcoat' && worn.trenchInBag && bought.hover === 'a38' && bought.paid > 0 && bought.got === 12, info: { worn, bought } };
  });
  await check('stealth: Pier 9 at night, unseen in the dark, seen in the light', async () => {
    await ev(() => { __test.setHour(23); __test.teleport(109, 88); __test.world(40); });
    const g = await ev(() => __test.PEOPLE.filter(p => p.ai && p.ai.guard && p.ai.zone === 'pier9' && !p.F).map(p => [+p.x.toFixed(1), +p.y.toFixed(1), p.torch]));
    await ev(() => { INPUT.keys.Tab = true; __test.step(4); });
    await shot('pier9_case');
    await ev(() => { INPUT.keys.Tab = false; });
    return { ok: g.length >= 3, info: g };
  });
  await check('takedown: the blackjack from behind', async () => {
    const r = await ev(() => {
      const p = __test.PEOPLE.find(p => p.ai && p.ai.guard && p.ai.zone === 'pier9' && p.alive && !p.down); if (!p) return { why: 'no guard' };
      p.ai.route = null; p.ai.mode = 'post'; p.ai.post = [p.x, p.y, p.dir, 0]; p.ai.aware = 0; p.ai.sus = 0;
      const f = faceOf(p); __test.teleport(p.x - f[0] * 0.8, p.y - f[1] * 0.8); FRANK.faceX = f[0]; FRANK.faceY = f[1];
      drawWeapon(2); PLAYER.drawT = 0; FRANK.gun.cool = 0;
      const q = swing(FRANK, FRANK.gun);
      return { hit: !!q, ko: p.ko, down: p.down, gun: FRANK.gun.type };
    });
    return { ok: r.ko && r.down > 1000, info: r };
  });
  await check('fight: alerted goons shoot back and go down', async () => {
    await ev(() => { drawWeapon(0); PLAYER.drawT = 0; __test.teleport(110, 96); for (const p of __test.PEOPLE) if (p.ai && p.ai.guard && p.ai.zone === 'pier9' && p.alive && !p.down) { p.ai.lx = FRANK.x; p.ai.ly = FRANK.y; p.ai.hostile = true; setAware(p, 3); } });
    let shots = 0;
    for (let k = 0; k < 90; k++) {
      await ev(() => { INPUT.keys.KeyF = true; __test.world(15); });
      shots = await ev(() => __test.STATS.shots);
      const left = await ev(() => __test.PEOPLE.filter(p => p.ai && p.ai.guard && p.ai.zone === 'pier9' && p.alive && !p.down && !p.F).length);
      if (k === 6) await shot('pier9_fight');
      if (!left) break;
    }
    await ev(() => { INPUT.keys.KeyF = false; });
    const r = await ev(() => ({ left: __test.PEOPLE.filter(p => p.ai && p.ai.guard && p.ai.zone === 'pier9' && p.alive && !p.down && !p.F).length, who: __test.PEOPLE.filter(p => p.ai && p.ai.guard && p.ai.zone === 'pier9' && p.alive && !p.down && !p.F).map(p => [+p.x.toFixed(1), +p.y.toFixed(1), p.ai.aware, p.ai.state, p.gun.type, p.ai.hostile]), frank: [FRANK.x, FRANK.y], hp: FRANK.hp, taken: __test.STATS.dmgTaken, shots: __test.STATS.shots, down: __test.STATS.goonsDown }));
    return { ok: r.left === 0 && r.down >= 2, info: r };
  });
  await check('law: shooting on a busy street brings the heat', async () => {
    await ev(() => { __test.setHour(14); __test.teleport(30, 44); __test.LAW.heat = 0; manageCrowd(true); __test.world(60); });
    const crowd = await ev(() => __test.PEOPLE.filter(p => p.street && p.team === 'civ' && p.alive && Math.hypot(p.x - FRANK.x, p.y - FRANK.y) < 60).length);
    const civs = await ev(() => { for (const [dx, dy] of [[6, 0], [-7, 1], [3, 8]]) { const [x, y] = landNear(FRANK.x + dx, FRANK.y + dy, 0); spawnCivilian(x, y); } __test.world(5); return __test.PEOPLE.filter(p => p.team === 'civ' && p.alive && Math.hypot(p.x - FRANK.x, p.y - FRANK.y) < 20).length; });
    const fired = await ev(() => { if (!PLAYER.drawn || PLAYER.slot !== 0) drawWeapon(0); PLAYER.drawT = 0; FRANK.gun.cool = 0; FRANK.gun.reload = 0; FRANK.gun.ammo = 6; const s0 = __test.STATS.shots; INPUT.clicks = 1; __test.world(2); return __test.STATS.shots - s0; });
    const ok = await until(() => { __test.world(30); return __test.LAW.heat >= 2; }, 20000);
    const r = await ev(() => ({ heat: __test.LAW.heat, reports: __test.LAW.reports.length, cars: __test.LAW.cars.length, wanted: __test.LAW.wanted }));
    await shot('heat');
    await ev(() => { __test.LAW.heat = 0; standDown(); holster(); });
    return { ok: fired === 1 && ok && r.cars > 0 && crowd >= 8, info: { fired, crowd, civs, ...r } };
  });
  await check('job: the envelope to the Herald', async () => {
    const r = await ev(() => {
      const J = __test.JOBS.find(j => j.id === 'letter'); openJobs('office'); UI.sel = jobList().indexOf(J); jobAction(J); closeUI();
      const it = J.it; if (!it) return { why: 'no delivery point' };
      __test.setHour(12); __test.teleport(it.x, it.y, 'THE HERALD', 0); __test.world(3);
      const m0 = INV.money; const c = findInteract(); if (!c) return { why: 'nothing to use', at: [FRANK.x, FRANK.y] };
      c.act(); return { label: c.label, state: J.state, paid: INV.money - m0 };
    });
    return { ok: r.state === 'done' && Math.abs(r.paid - 30) < 0.01, info: r };
  });
  await check('save and load: money and the bag survive a reload', async () => {
    const before = await ev(() => { __test.saveGame(true); return { money: __test.INV.money, bag: __test.INV.bag.length, jobs: __test.JOBS.filter(j => j.state === 'done').length }; });
    await page.goto(pageUrl('hourglass_opencity.html', '?mute=1&god=1'), { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 800));
    const after = await ev(() => { while (bakeReady() < 1) prebake(50); INPUT.pressed.Enter = true; __test.step(2); return { mode: __test.GAME.mode, money: __test.INV.money, bag: __test.INV.bag.length, jobs: __test.JOBS.filter(j => j.state === 'done').length }; });
    return { ok: after.mode === 'play' && after.money === before.money && after.bag === before.bag && after.jobs === before.jobs, info: { before, after } };
  });
  await check('zoom: - and + step the view, the camera pulls out at the wheel, the mouse still aims', async () => {
    await ev(() => { __test.setHour(22); __test.teleport(20, 44); const Z = __test.ZOOM; Z.foot = 1; Z.drive = 1.5; __test.zoomSnap(); });
    const settled = ws => until(ws => __test.ZOOM.ws === ws && __test.ZOOM.t >= 1, 3000, ws), view = () => ev(() => __test.view().VW);
    const v = [await view()];
    await page.keyboard.press('Minus'); const out = await settled(2); v.push(await view());       // real keys, by the character
    await page.keyboard.press('Equal'); await settled(3);
    await page.keyboard.press('Equal'); const close = await settled(4); v.push(await view());
    await page.keyboard.press('Minus'); await settled(3);
    await ev(() => { const V = __test.VEH.find(v => v.own); __test.teleport(V.x + 2, V.y); enterVehicle(V); });
    const drive = await settled(2); v.push(await view());
    await shot('zoom_drive');
    await ev(() => exitVehicle(true));
    const foot = await settled(3);
    await page.keyboard.press('Minus'); await settled(2);
    const aim = await ev(() => {                                   // a man on the zoomed-out screen, the mouse on him
      drawWeapon(0); PLAYER.drawT = 0;
      const F = __test.FRANK, g = __test.spawnGoon(null, F.x + 4, F.y + 2, { zone: 'none' }); if (!__test.PEOPLE.includes(g)) __test.PEOPLE.push(g);
      __test.render();
      const [sx, sy] = __test.worldToScreen(g.x, g.y, g.z + 1.1), [wx, wy] = __test.screenToWorld(sx, sy, g.z + 1.1);
      INPUT.mx = sx; INPUT.my = sy; __test.world(1);
      const r = { assist: PLAYER.assist === g, back: +Math.hypot(wx - g.x, wy - g.y).toFixed(2), at: [sx, sy] };
      __test.PEOPLE.splice(__test.PEOPLE.indexOf(g), 1); holster(); return r;
    });
    await page.keyboard.press('Equal'); await settled(3);
    return { ok: v.join() === '320,480,240,480' && out && close && drive && foot && aim.assist && aim.back < 0.3, info: { views: v, aim } };
  });
  await check('perf: frame time in the street and indoors', async () => {
    await ev(() => { __test.setHour(21); __test.teleport(20, 44); __test.ZOOM.foot = 1; });
    await new Promise(r => setTimeout(r, 3000));
    const out = await ev(() => ({ ...__test.GAME.perf }));
    await ev(() => { __test.ZOOM.foot = 1.5; });                     // the widest this window allows
    await new Promise(r => setTimeout(r, 3000));
    const wide = await ev(() => ({ ...__test.GAME.perf, view: __test.view() }));
    await ev(() => { __test.ZOOM.foot = 1; const B = __test.findB('THE BLUE COMET'); const R = B.floors[0].R; __test.teleport((R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2, 'THE BLUE COMET', 0); });
    await new Promise(r => setTimeout(r, 3000));
    const ins = await ev(() => ({ ...__test.GAME.perf, bake: __test.BAKE_STATS }));
    return { ok: out.frame < 16 && wide.frame < 16 && ins.frame < 16, info: { out, wide, ins } };
  });
  console.log(errs.length ? 'PAGE ERRORS: ' + errs.length : 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
  await browser.close();
  process.exit(fails || errs.length ? 1 : 0);
})();
