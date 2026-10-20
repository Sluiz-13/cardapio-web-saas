// Logs in as the local demo tenant (see seed-demo.ts) and screenshots each admin route at desktop size.
// usage: node shoot-tour.js caixa dashboard ...   (route names under /admin)
const { chromium } = require('../../node_modules/playwright-core');
const path = require('path'), fs = require('fs');
const CRED = Object.fromEntries(fs.readFileSync(path.join(__dirname, 'demo-credentials.txt'), 'utf8').trim().split(/\r?\n/).map(l => l.split('=')));
(async () => {
  const BASE = 'http://localhost:3100';
  const routes = process.argv.slice(2);
  const out = path.join(__dirname, 'tour'); fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1200 }, deviceScaleFactor: 1.25 });
  await page.goto(BASE + '/admin/login', { waitUntil: 'networkidle', timeout: 120000 });
  await page.fill('input[type=email], input[name=email]', CRED.email);
  await page.fill('input[type=password]', CRED.password);
  await Promise.all([page.waitForURL(u => !u.pathname.includes('/login'), { timeout: 120000 }), page.click('button[type=submit]')]);
  for (const r of routes) {
    const [route, action] = r.split('#');
    await page.goto(BASE + '/admin/' + (route === 'pedidos' ? '' : route), { waitUntil: 'networkidle', timeout: 180000 });
    await page.waitForTimeout(2000);
    if (action === 'edit') { await page.getByText('Editar', { exact: true }).first().click(); await page.waitForLoadState('networkidle'); await page.waitForTimeout(3500); }
    await page.evaluate(() => {
      for (const el of document.querySelectorAll('body *'))
        if (getComputedStyle(el).position === 'fixed' && /Usamos cookies/.test(el.textContent || '')) el.style.display = 'none';
    });
    await page.screenshot({ path: path.join(out, r.replace(/[\/#]/g, '_') + '.png') });
    console.log('ok', r, page.url());
  }
  await browser.close();
})();
