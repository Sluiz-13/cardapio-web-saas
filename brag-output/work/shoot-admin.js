// Logs into the local dev server with the project's seed admin and captures the orders board at desktop size.
const { chromium } = require('../../node_modules/playwright-core');
const path = require('path');
(async () => {
  const BASE = 'http://localhost:3100';
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1200 }, deviceScaleFactor: 1.25 });
  await page.goto(BASE + '/admin/login', { waitUntil: 'networkidle', timeout: 120000 });
  await page.fill('input[type=email], input[name=email]', 'admin@quiosque.com');
  await page.fill('input[type=password]', 'quiosque');
  await Promise.all([page.waitForURL(u => !u.pathname.includes('/login'), { timeout: 120000 }), page.click('button[type=submit]')]);
  await page.goto(BASE + '/admin', { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(2500);
  await page.evaluate(() => {
    // hide cookie banner (capture only) and swap local test data for illustrative display text
    for (const el of document.querySelectorAll('body *'))
      if (getComputedStyle(el).position === 'fixed' && /Usamos cookies/.test(el.textContent || '')) el.style.display = 'none';
    const deepest = (a, b) => [...document.querySelectorAll('body *')].filter(e => e.textContent.includes(a) && e.textContent.includes(b) && ![...e.children].some(c => c.textContent.includes(a) && c.textContent.includes(b)));
    deepest('elizete', 'guaxupe').forEach(e => e.textContent = 'Avenida Paulista, 1000 — Bela Vista, São Paulo');
    deepest('rua treze', 'iguape').forEach(e => e.textContent = 'Rua Augusta, 250 — Consolação, São Paulo');
    const map = [[/^luiz$/i, 'Luiz Felippe'], [/^Luiz$/, 'Luiz Felippe'], [/prato teste \(prato\)/, 'Classic Smash Cheeseburger'], [/teste prato \(prato\)/, 'Bacon BBQ Supreme'],
      [/^rua elizete.*$/i, 'Avenida Paulista, 1000'], [/vale verde, guaxupe/i, '— Bela Vista, São Paulo'], [/^rua treze.*$/i, 'Rua Augusta, 250'], [/alameda, iguape/i, '— Consolação, São Paulo'], [/^35999603944$/, '(35) 9 9960-3944']];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let t; while ((t = w.nextNode())) { const v = t.nodeValue.trim(); for (const [re, r] of map) if (re.test(v)) { t.nodeValue = t.nodeValue.replace(v, v.replace(re, r)); break; } }
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(__dirname, 'admin-desktop.png') });
  console.log('url', page.url());
  await browser.close();
})();
