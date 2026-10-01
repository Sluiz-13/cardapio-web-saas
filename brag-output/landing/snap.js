// Full-page captures of the landing (desktop + mobile) for before/after comparison.
const { chromium } = require('../../node_modules/playwright-core');
const path = require('path');
const tag = process.argv[2] || 'shot';
(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  for (const [name, vp] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
    await page.goto('http://localhost:3100/', { waitUntil: 'networkidle', timeout: 180000 });
    await page.evaluate(() => { for (const el of document.querySelectorAll('body *')) if (getComputedStyle(el).position === 'fixed' && /cookies/i.test(el.textContent || '')) el.style.display = 'none'; });
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } window.scrollTo(0, 0); });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(__dirname, `${tag}-${name}.jpg`), fullPage: true, quality: 70, type: 'jpeg' });
    await page.close();
  }
  await browser.close();
})();
