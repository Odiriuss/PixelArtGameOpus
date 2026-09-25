// usage: node tl.js steps.json -- like run.js, but a failed step is reported (with the page errors) instead of aborting;
// the exit code is 1 if any step failed, an "until" timed out, the page logged an error or the page crashed.
// A step's "page" (or the first step's) picks the game page; the default is the test level.
const { launch, pageUrl, shotPath } = require('./common');
const fs = require('fs'), path = require('path');
(async () => {
  const steps = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const browser = await launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 960, height: 540, deviceScaleFactor: 1 });
  const errs = []; let fails = 0;
  let PAGE = (steps.find(s => s.page) || {}).page || 'hourglass_testlevel.html';
  page.on('pageerror', e => { errs.push('pageerror: ' + e.message); console.log('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')); });
  page.on('error', e => { errs.push('crash: ' + e.message); console.log('PAGE CRASHED: ' + e.message); });   // the renderer died
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); if (m.type() === 'log') console.log('log: ' + m.text()); });
  for (const s of steps) {
    const t0 = Date.now();
    try {
      if (s.page) PAGE = s.page;
      if (s.url) await page.goto(pageUrl(PAGE, s.url), { waitUntil: 'load' });
      if (s.wait) await new Promise(r => setTimeout(r, s.wait));
      if (s.eval) { const r = await page.evaluate(s.eval); if (r !== undefined) console.log((s.label || 'eval') + ':', typeof r === 'string' ? r : JSON.stringify(r)); }
      if (s.click) { const [x, y, b] = s.click; await page.mouse.move(x * 3, y * 3); await page.mouse.down({ button: b || 'left' }); await page.mouse.up({ button: b || 'left' }); }
      if (s.move) await page.mouse.move(s.move[0] * 3, s.move[1] * 3);
      if (s.key) await page.keyboard.press(s.key);
      if (s.down) await page.keyboard.down(s.down);
      if (s.up) await page.keyboard.up(s.up);
      if (s.shot) await page.screenshot({ path: shotPath(s.shot) });
      if (s.until) {                                   // poll a condition: {until: "js expr", ms, every, log: "js expr"}
        const t0 = Date.now(); let ok = false, n = 0;
        while (Date.now() - t0 < (s.ms || 60000)) {
          ok = await page.evaluate(s.until); if (ok) break;
          if (s.log && ++n % (s.every || 10) === 0) console.log('  ~', await page.evaluate(s.log));
          await new Promise(r => setTimeout(r, 200));
        }
        if (!ok) fails++;
        console.log((s.label || 'until') + ': ' + (ok ? 'OK' : 'TIMEOUT') + ' after ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
        if (s.log) console.log('  =', await page.evaluate(s.log));
      }
    } catch (e) { fails++; console.log('STEP FAILED after ' + ((Date.now() - t0) / 1000).toFixed(1) + 's: ' + JSON.stringify(s).slice(0, 120) + '\n  ' + e.message.split('\n')[0]); }
  }
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no errors');
  if (fails) console.log(fails + ' STEP(S) FAILED');
  await browser.close();
  process.exit(fails || errs.length ? 1 : 0);
})();
