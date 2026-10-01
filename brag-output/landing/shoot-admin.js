// Captures the orders board and the tables grid from the local dev server for the landing,
// swapping local test data for fictitious customers (no real names/phones on the public site).
const { chromium } = require('../../node_modules/playwright-core');
const path = require('path');
const OUT = path.join(__dirname, '..', '..', 'public', 'landing');
(async () => {
  const BASE = 'http://localhost:3100';
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1200 }, deviceScaleFactor: 1.25 });
  await page.goto(BASE + '/admin/login', { waitUntil: 'networkidle', timeout: 120000 });
  await page.fill('input[type=email], input[name=email]', 'admin@quiosque.com');
  await page.fill('input[type=password]', 'quiosque');
  await Promise.all([page.waitForURL(u => !u.pathname.includes('/login'), { timeout: 120000 }), page.click('button[type=submit]')]);
  const scrub = () => page.evaluate(() => {
    for (const el of document.querySelectorAll('body *'))
      if (getComputedStyle(el).position === 'fixed' && /Usamos cookies/.test(el.textContent || '')) el.style.display = 'none';
    const NAMES = ['Mariana Alves', 'Rafael Souza', 'Camila Rocha', 'Bruno Martins', 'Renata Moura', 'Pedro Henrique', 'Larissa Gomes', 'Thiago Lima', 'Ana Beatriz', 'Diego Ferreira', 'Fernanda Reis', 'Lucas Pereira', 'Gabriela Nunes', 'Vinícius Costa'];
    const PHONES = ['(11) 9 8123-4410', '(11) 9 7654-2031', '(11) 9 9312-8876', '(11) 9 8045-1127', '(11) 9 7781-3390', '(11) 9 9120-6654'];
    const ADDR = ['Rua Augusta, 250 — Consolação', 'Av. Paulista, 1000 — Bela Vista', 'Rua Oscar Freire, 88 — Jardins', 'Rua Harmonia, 412 — Vila Madalena', 'Al. Santos, 745 — Cerqueira César'];
    const ITEMS = ['1x Classic Smash Cheeseburger', '2x Bacon BBQ Supreme', '1x Duplo Salada Especial · 1x Coca 350ml', '1x Gorgonzola & Onion', '2x Classic Smash · 1x Batata'];
    let n = 0, p = 0, a = 0, it = 0;
    const deepest = (test) => [...document.querySelectorAll('body *')].filter(e => test(e.textContent) && ![...e.children].some(c => test(c.textContent)));
    deepest(t => /elizete|rua treze/i.test(t) && /guaxupe|iguape/i.test(t)).forEach(e => e.textContent = ADDR[a++ % ADDR.length]);
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let t; while ((t = w.nextNode())) {
      const v = t.nodeValue.trim();
      if (/^luiz( felippe)?$/i.test(v)) t.nodeValue = NAMES[n++ % NAMES.length];
      else if (/^\(?\d{2}\)?\s?9?\s?\d{4}-?\d{4}$/.test(v.replace(/\s/g, '')) || /^\d{10,11}$/.test(v)) t.nodeValue = PHONES[p++ % PHONES.length];
      else if (/^1x (prato teste|teste prato)/i.test(v)) t.nodeValue = ITEMS[it++ % ITEMS.length];
      else if (/prato teste \(prato\)/i.test(v)) t.nodeValue = 'Classic Smash Cheeseburger';
      else if (/teste prato \(prato\)/i.test(v)) t.nodeValue = 'Bacon BBQ Supreme';
    }
  });
  await page.goto(BASE + '/admin', { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(2500);
  await scrub();
  await page.evaluate(() => {
    // capture only: hide billing banner + floating chat, spread sample orders across the empty columns
    for (const el of document.querySelectorAll('body *')) {
      if (/mensalidade vence/i.test(el.textContent || '') && el.offsetHeight < 80) el.style.display = 'none';
      if (getComputedStyle(el).position === 'fixed' && el.offsetWidth < 90) el.style.display = 'none';
    }
    const empties = [...document.querySelectorAll('p')].filter(p => p.textContent === 'Nenhum pedido').map(p => p.parentElement);
    const cards = [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === 'Iniciar preparo').map(b => b.closest('.rounded-2xl'));
    const plan = [['Marcar pronto', '#F59E0B', ['Gabriela Nunes', 'Juliana Dias']], ['Saiu para entrega', '#10B981', ['Pedro Henrique']], ['Marcar entregue', '#3B82F6', ['Thiago Lima']]];
    empties.forEach((box, i) => {
      const cfg = plan[i]; if (!cfg || !cards.length) return;
      const [label, color, names] = cfg;
      names.forEach((nm, j) => {
        const c = cards[(i + j + 1) % cards.length].cloneNode(true);
        c.style.borderLeftColor = color;
        for (const b of c.querySelectorAll('button')) if (b.textContent.trim() === 'Iniciar preparo') { b.textContent = label; b.style.background = color; }
        for (const d of [...c.querySelectorAll('div')]) if (/^⏳?\s*Pix aguardando/.test(d.textContent.trim()) && !d.querySelector('button')) d.remove();
        const nameEl = [...c.querySelectorAll('*')].find(e => e.children.length === 0 && /^[A-ZÁ][a-zé]+ [A-Z][a-z]/.test(e.textContent.trim()));
        if (nameEl) nameEl.textContent = nm;
        box.parentElement.insertBefore(c, box);
      });
      box.parentElement.dataset.count = names.length;
      box.remove();
    });
    const counts = [['EM PREPARO', '(2)'], ['PRONTO', '(1)'], ['SAIU P/ ENTREGA', '(1)']];
    for (const el of document.querySelectorAll('span, p, h2, h3, div')) {
      if (!/^\(\d+\)$/.test(el.textContent.trim()) || !el.parentElement) continue;
      const hit = counts.find(([k]) => el.parentElement.textContent.trim().toUpperCase().startsWith(k) && el.parentElement.textContent.length < 30);
      if (hit) el.textContent = hit[1];
    }
    const ids = ['#p7k2d', '#m3qa8', '#t9vx1', '#h4ne6'];
    document.querySelectorAll('[style*="border-left-color"]').forEach((c, k) => { const idEl = [...c.querySelectorAll('*')].find(e => e.children.length === 0 && /^#\w{5}$/.test(e.textContent.trim())); if (idEl) idEl.textContent = ids[k % ids.length]; });
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, 'painel-pedidos.png') });
  await browser.close();
})();
