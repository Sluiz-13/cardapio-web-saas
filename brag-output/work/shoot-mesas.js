// Logs into the local dev server with the project's seed admin and captures the Mesas grid at desktop size.
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
  await page.goto(BASE + '/admin/mesas', { waitUntil: 'networkidle', timeout: 120000 });
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
  await page.evaluate(() => {
    // capture only: fill the grid with clones of the real table card, varying label and Livre/Ocupada
    const grid = document.querySelector('.grid.grid-cols-2');
    const proto = grid.firstElementChild;
    const TABLES = [['Mesa 1', 1], ['Mesa 2', 0], ['Mesa 3', 1], ['Mesa 4', 1], ['Mesa 5', 0], ['Mesa 6', 0], ['Varanda 1', 1], ['Varanda 2', 0], ['Balcão', 1]];
    grid.innerHTML = '';
    for (const [label, occ] of TABLES) {
      const c = proto.cloneNode(true);
      c.querySelector('p').textContent = label;
      if (!occ) {
        const box = c.querySelector('.rounded-xl'); box.classList.remove('bg-brand-light', 'text-brand'); box.classList.add('bg-emerald-50', 'text-emerald-600');
        const dot = c.querySelector('p + div svg'); dot.classList.remove('text-brand'); dot.classList.add('text-emerald-500');
        const sp = c.querySelector('p + div span'); sp.classList.remove('text-brand'); sp.classList.add('text-emerald-600'); sp.textContent = 'Livre';
      }
      grid.appendChild(c);
    }
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(__dirname, 'admin-mesas.png') });
  console.log('url', page.url());
  await browser.close();
})();
