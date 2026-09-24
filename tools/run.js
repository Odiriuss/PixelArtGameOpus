// usage: node run.js steps.json   -- steps: [{url}, {wait:ms}, {eval:"js"}, {shot:"name.png"}, {click:[x,y,btn]}, {key:"e"}]
const { launch, pageUrl, shotPath } = require('./common');
const fs = require('fs'), path = require('path');
(async () => {
  const steps = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const browser = await launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 960, height: 540, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning' || m.type() === 'log') errs.push(m.type() + ': ' + m.text()); });
  for (const s of steps) {
    if (s.url) await page.goto(pageUrl('hourglass_city.html', s.url), { waitUntil: 'load' });
    if (s.url_abs) await page.goto(s.url_abs, { waitUntil: 'load' });
    if (s.wait) await new Promise(r => setTimeout(r, s.wait));
    if (s.evalFile) s.eval = fs.readFileSync(path.resolve(path.dirname(process.argv[2]), s.evalFile), 'utf8');
    if (s.eval) { const r = await page.evaluate(s.eval); if (r !== undefined) console.log('eval:', JSON.stringify(r)); }
    if (s.click) { const [x, y, b] = s.click; await page.mouse.move(x * 3, y * 3); await page.mouse.down({ button: b || 'left' }); await page.mouse.up({ button: b || 'left' }); }
    if (s.move) { await page.mouse.move(s.move[0] * 3, s.move[1] * 3); }
    if (s.key) { await page.keyboard.press(s.key); }
    if (s.shot) await page.screenshot({ path: shotPath(s.shot) });
  }
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await browser.close();
})();
