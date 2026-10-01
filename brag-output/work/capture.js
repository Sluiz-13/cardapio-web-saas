// usage: node capture.js stills 1.5 4.5 ...   |  node capture.js all
const { chromium } = require('../../node_modules/playwright-core');
const path = require('path'), fs = require('fs');
(async () => {
  const [mode, ...rest] = process.argv.slice(2);
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('file://' + path.resolve(__dirname, 'video.html'));
  await page.evaluate(() => window.ready);
  await page.waitForTimeout(500);
  const FPS = 30, DUR = 26.3;
  const times = mode === 'all' ? Array.from({ length: Math.round(FPS * DUR) }, (_, i) => i / FPS) : rest.map(Number);
  const dir = path.join(__dirname, mode === 'all' ? 'frames' : 'stills');
  fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < times.length; i++) {
    await page.evaluate(t => window.render(t), times[i]);
    const name = mode === 'all' ? `f${String(i).padStart(4, '0')}.jpg` : `t${times[i].toFixed(2)}.jpg`;
    await page.screenshot({ path: path.join(dir, name), type: 'jpeg', quality: 93 });
  }
  await browser.close();
  console.log('done', times.length);
})();
