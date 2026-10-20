# Builds video-long.html from the short version's video.html: keeps hook/reveal/phones/outro/CTA,
# replaces the admin + cards scenes with an 8-feature tour on one monitor.
import os
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', '..', 'brag-output', 'work', 'video.html')
s = open(SRC, encoding='utf-8').read()

a = s.index('  <!-- S4 admin -->'); b = s.index('  <!-- S6 outro -->')
tour = '''  <!-- S4 tour: one monitor, eight features -->
  <div class="scene" id="s4">
    <div id="caps" class="abs" style="left:80px;top:300px;width:380px"></div>
    <div id="mon" class="abs" style="left:500px;top:40px;width:1372px;height:960px">
      <div style="position:absolute;left:0;top:0;width:1372px;height:870px;background:#0b0f19;border-radius:26px;padding:16px;box-shadow:0 50px 90px rgba(17,24,39,.28)">
        <div id="screen" style="position:relative;width:1340px;height:838px;overflow:hidden;border-radius:8px;background:#F7F8FA"></div>
      </div>
      <div style="position:absolute;left:631px;top:870px;width:110px;height:66px;background:linear-gradient(#cbd5e1,#e2e8f0)"></div>
      <div style="position:absolute;left:496px;top:932px;width:380px;height:20px;border-radius:12px;background:#cbd5e1;box-shadow:0 14px 30px rgba(17,24,39,.15)"></div>
    </div>
    <div id="toast" class="abs" style="left:1200px;top:16px;width:690px;height:124px;background:#fff;border-radius:30px;box-shadow:0 24px 60px rgba(17,24,39,.22);display:flex;align-items:center;padding:0 34px;gap:26px;opacity:0">
      <div style="width:22px;height:22px;border-radius:50%;background:#D35400"></div>
      <div>
        <div style="font-size:34px;font-weight:800;color:#0f172a">Novo pedido · #vdz6f</div>
        <div style="font-size:26px;font-weight:500;color:#64748b;margin-top:4px">2x Duplo Salada Especial · <span style="color:#15803d;font-weight:700">R$ 73,00</span></div>
      </div>
    </div>
  </div>

'''
s = s[:a] + tour + s[b:]
s = s.replace('<style>', '''<style>
  .chip{display:inline-block;font-size:22px;font-weight:800;letter-spacing:.14em;color:#D35400;background:#FBEAE0;padding:8px 16px;border-radius:999px;margin-bottom:26px}
  .cap{position:absolute;left:0;top:0;width:380px;opacity:0}
  .cap h2{font-weight:800;letter-spacing:-.035em;line-height:1.05;white-space:nowrap;color:#0f172a}
  .cap h2.orange{color:#D35400}
  .cap p{font-size:30px;font-weight:500;color:#64748b;line-height:1.3;margin-top:26px}
  .layer{position:absolute;left:0;top:0;width:1340px;height:838px;transform-origin:0 0;opacity:0}
  .layer img{width:1340px;height:838px;display:block}''', 1)

a = s.index('// S4 tap position'); b = s.index("$('icWa')")
setup = r'''// tour steps: screen, crop (x,y,f as fractions of the 16:10 screenshot), caption
const STEPS=[
  {img:'pedidos',  crop:[0.14,0,0.60],   chip:'Pedidos',      h:['Chega tudo','no painel.'],             p:'Sem WhatsApp espalhado.'},
  {img:'mesas',    crop:[0.237,0.155,0.66],  chip:'Mesas',        h:['Mesa livre,','mesa ocupada.'],         p:'Comanda por mesa + app do garçom.'},
  {img:'caixa',    crop:[0.315,0,0.50],  chip:'Caixa',        h:['Caixa conferido','do início ao fim.'], p:'Sangria e suprimento registrados na hora.'},
  {img:'zonas-entrega_edit', crop:[0.28,0.42,0.44], chip:'Zonas de entrega', h:['Desenhe sua','área de entrega.'], p:'Uma taxa pra cada área, direto no mapa.'},
  {img:'reservas', crop:[0.235,0.02,0.66],  chip:'Reservas',     h:['Reservas de mesa','organizadas.'],     p:'Por telefone ou WhatsApp, tudo num lugar.'},
  {img:'insumos',  crop:[0.335,0,0.46],  chip:'Estoque',      h:['Estoque baixo?','O painel avisa.'],    p:'Insumos com ficha técnica e CMV.'},
  {img:'clientes', crop:[0.315,0,0.50],   chip:'Fidelidade',   h:['Fidelidade','e cashback.'],            p:'Pontos e saldo de cada cliente.'},
  {img:'dashboard',crop:[0.27,0,0.60],  chip:'Dashboard',    h:['Seu faturamento','de relance.'],       p:'Últimos 14 dias e os mais vendidos.'},
];
const TOUR0=10.8; let acc=TOUR0;
STEPS.forEach((st,i)=>{st.s=acc; acc+= i===0?4.2:3.2; st.e=acc;});
const TOUR_END=acc; // 37.4
STEPS.forEach((st,i)=>{
  const L=document.createElement('div');L.className='layer';L.id='L'+i;
  L.innerHTML=`<img src="screens/${st.img}.png">`;
  if(i===0) L.innerHTML+=`<div class="tap" id="tapP" style="width:60px;height:60px;margin:-30px 0 0 -30px;border-width:4px"></div><svg id="cursor" width="38" height="38" viewBox="0 0 24 24" style="position:absolute;left:0;top:0;filter:drop-shadow(0 3px 4px rgba(0,0,0,.35))"><path d="M4 2l15 11.5-6.6.9 3.9 7.6-2.8 1.4-3.9-7.7L4 20z" fill="#fff" stroke="#0f172a" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
  $('screen').appendChild(L);
  const C=document.createElement('div');C.className='cap';C.id='C'+i;
  C.innerHTML=`<div class="chip">${String(i+1).padStart(2,'0')} · ${st.chip.toUpperCase()}</div><h2>${st.h[0]}</h2><h2 class="orange">${st.h[1]}</h2><p>${st.p}</p>`;
  $('caps').appendChild(C);
});
// fit both title lines of each caption to the 500px column with one shared size
window.fitCaps=()=>{STEPS.forEach((st,i)=>{const hs=$('C'+i).querySelectorAll('h2');let fs=84;
  const fits=()=>[...hs].every(h=>h.scrollWidth<=380);
  do{hs.forEach(h=>h.style.fontSize=fs+'px');fs-=2;}while(!fits()&&fs>40);});};
const SW=1340, SH=838;
const BTN=[0.1715*SW, 0.2744*SH]; $('tapP').style.left=BTN[0]+'px';$('tapP').style.top=BTN[1]+'px';
function view(el,x,y,f){el.style.transform=`translate(${-x*SW/f}px,${-y*SH/f}px) scale(${1/f})`;}
const TS=19.4; // outro/CTA keep their original timing, shifted by this much
'''
s = s[:a] + setup + s[b:]

a = s.index('  // S4 10.8-14.4'); b = s.index('  // S6 18-21.5')
rend = r'''  // S4 tour 10.8-37.4
  const s4=$('s4'); s4.style.opacity=(t>=10.8&&t<TOUR_END+.1)?(1-p(t,TOUR_END-.3,TOUR_END)):0;
  {const k=eo(p(t,10.85,11.45)); set($('mon'),k,mix(220,0,k),0);}
  STEPS.forEach((st,i)=>{
    const L=$('L'+i);
    L.style.opacity=(i===0?1:p(t,st.s-.02,st.s+.16))*(i===STEPS.length-1?1:1-p(t,st.e-.2,st.e-.04));
    const [x,y,f]=st.crop, cx=x+f/2, cy=y+f/2, f0=Math.min(1,f*1.18);
    const k=eio(p(t,st.s-.1,st.s+1.3)), drift=mix(1,.965,p(t,st.s+1.3,st.e+.3));
    const ff=mix(f0,f,k)*drift;
    const xx=clamp(cx-ff/2,0,1-ff), yy=clamp(mix(clamp(cy-f0/2,0,1-f0),y,k)+(f-ff)/2,0,1-ff);
    view(L,xx,yy,ff);
    const C=$('C'+i), kin=eo(p(t,st.s+.05,st.s+.5)), kout=i===STEPS.length-1?0:p(t,st.e-.28,st.e-.05);
    C.style.opacity=kin*(1-kout); C.style.transform=`translateY(${mix(40,0,kin)-30*kout}px)`;
  });
  {const k=eback(p(t,11.75,12.25)); set($('toast'),clamp(k*1.5)*(1-p(t,14.2,14.5)),0,mix(-150,0,k)-60*p(t,14.2,14.5));}
  tap($('tapP'),t,12.85);
  {const k=eio(p(t,12.0,12.75)); const x=mix(900,BTN[0]-4,k), y=mix(600,BTN[1]-4,k);
   $('cursor').style.transform=`translate(${x}px,${y}px) scale(${(t>12.8&&t<12.95)?.85:1})`; $('cursor').style.opacity=p(t,11.6,11.9)*(1-p(t,13.6,13.9));}

'''
s = s[:a] + rend + s[b:]
a = s.index('  // S6 18-21.5'); b = s.index('};\nwindow.ready')
seg = s[a:b].replace('(T,', '(t-TS,').replace('T>=18?', 't-TS>=18?').replace('T>=21.3?', 't-TS>=21.3?')
s = s[:a] + seg + s[b:]
# background: cream during tour, dark again for outro (old 17.85 -> shifted)
s = s.replace("window.render=function(t){\n  const T=mapT(t);", "window.render=function(t){\n  const T=t>=TOUR_END-.3?t-TS:Math.min(t,17);")
s = s.replace("window.ready=(async()=>{await document.fonts.ready;", "window.ready=(async()=>{await document.fonts.ready;fitCaps();")
for leftover in ('mapT', "$('s5')", 'CARDS'):
    assert leftover not in s, leftover
open(os.path.join(HERE, 'video-long.html'), 'w', encoding='utf-8').write(s)
print('ok', len(s))
