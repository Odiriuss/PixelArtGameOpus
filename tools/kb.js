// keyboard-only smoke test + save/continue round trip, driven by real key events
const { launch, pageUrl, shotPath } = require('./common');
(async () => {
  const browser = await launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 960, height: 540, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  const URL = pageUrl('hourglass_city.html', '?mute=1&turbo=6');
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const ev = (s) => page.evaluate(s);
  const press = async (k, n) => { for (let i = 0; i < (n || 1); i++) { await page.keyboard.press(k); await sleep(60); } };
  const log = (...a) => console.log(...a);
  const skipAll = async (ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev('!!window.__game.S.speech')) await press('Space'); else if (!(await ev('window.__game.scriptBusy()'))) return; await sleep(80); } };
  await page.goto(URL, { waitUntil: 'load' });
  await ev('localStorage.clear()'); await page.reload({ waitUntil: 'load' }); await sleep(400);
  log('title items:', await ev('TITLE.items.map(i => i.t).join(",")'));
  await press('Enter');                                                   // New game
  await sleep(300); await skipAll(30000);
  log('after intro:', await ev('[window.__game.room.id, window.__game.G.goal]'));
  // Tab through focusable hotspots until the envelope is focused, then E
  let found = false;
  for (let i = 0; i < 12 && !found; i++) { await press('Tab'); const f = await ev('UI.focus ? UI.focus.id : null'); if (f === 'envelope') found = true; }
  if (!found) {                                                          // walk toward it with the keyboard, then try again
    await page.keyboard.down('d'); await sleep(300); await page.keyboard.up('d');
    for (let i = 0; i < 12 && !found; i++) { await press('Tab'); if (await ev('UI.focus ? UI.focus.id : null') === 'envelope') found = true; }
  }
  log('envelope focused:', found);
  await press('e'); await sleep(300); await skipAll(20000);
  log('inventory after E:', await ev('window.__game.G.inv.join(",")'));
  // open the envelope from the inventory with the keyboard
  await press('i'); const idx = await ev('window.__game.G.inv.indexOf("envelope")');
  await press('ArrowRight', idx); await press('e'); await sleep(300); await skipAll(20000);
  log('inventory after opening:', await ev('window.__game.G.inv.join(",")'));
  // walk with WASD
  const p0 = await ev('[window.__game.ACT.frank.x, window.__game.ACT.frank.y]');
  await page.keyboard.down('s'); await sleep(500); await page.keyboard.up('s');
  const p1 = await ev('[window.__game.ACT.frank.x, window.__game.ACT.frank.y]');
  log('moved with S:', p0.map(v => v.toFixed(2)), '->', p1.map(v => v.toFixed(2)));
  // notebook open/close, menu -> save
  await press('n'); log('notebook open:', await ev('UI.note')); await press('Escape'); log('notebook closed:', !(await ev('UI.note')));
  await press('Escape'); log('menu open:', await ev('UI.menu'));
  const saveIdx = await ev('MENU_ITEMS.findIndex(m => m.id === "save")');
  await press('ArrowDown', saveIdx); await press('Enter'); await sleep(200);
  log('saved:', !!(await ev('localStorage.getItem(SAVE_KEY)')), 'menu closed:', !(await ev('UI.menu')));
  const before = await ev('[window.__game.room.id, window.__game.G.inv.join(","), window.__game.G.clues.length, window.__game.G.goal]');
  // reload and continue from the title
  await page.reload({ waitUntil: 'load' }); await sleep(400);
  log('title items after save:', await ev('TITLE.items.map(i => i.t).join(",")'));
  await press('Enter'); await sleep(800);
  const after = await ev('[window.__game.room.id, window.__game.G.inv.join(","), window.__game.G.clues.length, window.__game.G.goal]');
  log('before:', JSON.stringify(before)); log('after: ', JSON.stringify(after));
  log(JSON.stringify(before) === JSON.stringify(after) ? 'SAVE/LOAD OK' : 'SAVE/LOAD MISMATCH');
  await page.screenshot({ path: shotPath('kb_continue.png') });
  await ev('localStorage.clear()');
  log(errs.length ? errs.join('\n') : 'no errors');
  await browser.close();
})();
