// shared by the puppeteer test runners: the browser, the game pages and the screenshot folder
const fs = require('fs'), path = require('path'), { pathToFileURL } = require('url');
const puppeteer = require('puppeteer-core');
const ROOT = path.join(__dirname, '..');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
function launch(opts) {
  return puppeteer.launch(Object.assign({ executablePath: CHROME, headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'] }, opts));
}
function pageUrl(file, query) { return pathToFileURL(path.join(ROOT, file)).href + (query || ''); }
function shotPath(name) { const dir = path.join(ROOT, 'shots'); fs.mkdirSync(dir, { recursive: true }); return path.join(dir, name); }
module.exports = { ROOT, launch, pageUrl, shotPath };
