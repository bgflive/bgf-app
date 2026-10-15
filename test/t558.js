const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = path.join(ROOT, u === '/' ? 'index.html' : u); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' }); r.end(fs.readFileSync(f)); }).listen(8558);
const LIST = { live:[], upcoming:[{ id:'T7', subdomain:'felun2027', name:'Big Game Felun 2027', organizer:'ŠRK Felun', location:'Mlini', from:'2027-05-22', to:'2027-05-24', days:3, status:'upcoming', teams:5, catches:0, vrsta:'open', year:2027, prijave:true, naStapu:0 }], finished:[] };
(async () => {
  const b = await chromium.launch(); const greske = []; const rez = []; const ok = (n, u, i='') => rez.push([u ? '✅' : '❌', n, u ? '' : i]);
  async function scena(prijavljen){
    const c = await b.newContext({ viewport:{ width:390, height:844 }, locale:'hr-HR' }); const pg = await c.newPage(); pg.setDefaultTimeout(6000);
    pg.on('pageerror', e => greske.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::/.test(m.text())) greske.push(m.text()); });
    const st = { moje:[], post:null, put:[] };
    await pg.route('**/bgf-live-backend.vercel.app/**', r => { const u = r.request().url(), m = r.request().method(); const J = (x, s=200) => r.fulfill({ status:s, contentType:'application/json', body:JSON.stringify(x) });
      if (u.includes('/api/public/tournaments')) return J(LIST);
      if (u.includes('/api/public/trazi')) return J({ osobe:[{ bgf:10078, ime:'Pero Perić' }], ekipe:[], turniri:[] });
      if (u.includes('/felun2027/leaderboard')) return J({ tournament:{ name:'Big Game Felun 2027', days:3, dayDates:['2027-05-22','2027-05-23','2027-05-24'], rankingMode:'points' }, leaderboard:[], teams:[], catches:[], feed:[], stats:{}, statsByDay:[], hours:[] });
      if (u.includes('/api/me/roles')) return J({ user:{ id:'U77', email:'frane@gmail.com', name:'Frane' }, person:{ first_name:'Frane', last_name:'Rokov', bgf:'BGF-10077' }, roles:[], tournaments:[], teams:[] });
      if (u.includes('/api/me/profil')) return J({ osoba:{ bgf:10077, ime:'Frane', prezime:'Rokov', drzava:'HR', jezik:'hr', privola:{} }, klub:null, dozvole:[], vazeca:null, zahtjevi:[] });
      if (u.includes('/api/me/prijave')) return J({ prijave:st.moje });
      if (u.includes('/api/tournaments/T7/prijava') && m === 'POST') { st.post = JSON.parse(r.request().postData());
        st.moje = [{ id:'np1', turnir:{ id:'T7', naziv:'Big Game Felun 2027', subdomain:'felun2027' }, naziv:st.post.naziv, brod:st.post.brod, registracija:st.post.registracija, telefon:st.post.telefon, stanje:'pending', broj:null, kotizacija:300, placeno:0,
          posada:st.post.clanovi.map((c, i) => ({ id:'a' + i, ime:c.bgf === 10077 ? 'Frane Rokov' : c.bgf === 10078 ? 'Pero Perić' : c.ime, uloga:c.uloga, racun:!!c.bgf, bgf:c.bgf || null, dozvola:false })), upravitelj:true, mozeMijenjati:true, od:'2027-05-22' }];
        return J({ prijava:st.moje[0] }, 201); }
      if (u.includes('/api/tournaments/T7/prijava/np1') && m === 'PUT') { const b2 = JSON.parse(r.request().postData()); st.put.push(b2);
        if (b2.odustani) { st.moje[0].stanje = 'withdrawn'; return J({ ok:true }); }
        st.moje[0].posada = b2.clanovi.map((c, i) => ({ id:'b' + i, ime:c.bgf === 10077 ? 'Frane Rokov' : c.ime, uloga:c.uloga, racun:!!c.bgf, bgf:c.bgf || null })); st.moje[0].brod = b2.brod; return J({ prijava:st.moje[0] }); }
      return J({}); });
    if (prijavljen) await pg.addInitScript(() => { localStorage.setItem('bgf-pravo', JSON.stringify({ access:'tokP', refresh:'refP', istek:Date.now() + 3600000, red:[], veze:{} })); });
    await pg.goto('http://localhost:8558/'); await pg.waitForTimeout(1800);
    return { pg, c, st };
  }
  const app = async (pg) => (await pg.innerText('#app')) || '';
  let { pg, c, st } = await scena(false);
  await pg.click('[data-t="felun2027"] >> nth=0'); await pg.waitForTimeout(500); await pg.click('[data-pe]'); await pg.waitForTimeout(300); let tx = await app(pg);
  ok('bez prijave: traži račun natjecatelja (Prijavi se / Registriraj se), bez izmišljenog obrasca', tx.includes('treba račun natjecatelja') && !!(await pg.$('[data-reg]')) && !tx.includes('Ivan Kovač'), tx.slice(0, 300));
  await c.close();
  ({ pg, c, st } = await scena(true));
  await pg.click('[data-t="felun2027"] >> nth=0'); await pg.waitForTimeout(500); await pg.click('[data-pe]'); await pg.waitForTimeout(600); tx = await app(pg);
  ok('obrazac: ja sam kapetan (BGF-10077), posada 1/8, propozicije', tx.includes('Frane Rokov') && tx.includes('BGF-10077') && tx.includes('POSADA (1/8)') && tx.includes('propozicije turnira'), tx.slice(0, 500));
  await pg.fill('[data-pz="naziv"]', 'GALEB'); await pg.fill('[data-pz="brod"]', 'Cranchi 36');
  await pg.fill('[data-pzq]', 'pero'); await pg.waitForTimeout(600); tx = await app(pg);
  ok('traženje člana: Pero Perić BGF-10078 + „Dodaj bez računa”', tx.includes('Pero Perić') && tx.includes('BGF-10078') && tx.includes('Dodaj bez računa'), tx.slice(0, 600));
  await pg.click('[data-pzdodaj="10078"]'); await pg.waitForTimeout(200);
  await pg.fill('[data-pzq]', 'Mate Matić'); await pg.waitForTimeout(600); await pg.click('[data-pzdodajime]'); await pg.waitForTimeout(200); tx = await app(pg);
  ok('posada 3/8: Pero s računom, Mate bez računa', tx.includes('POSADA (3/8)') && tx.includes('Mate Matić') && (tx.match(/bez računa/g) || []).length >= 1, tx.slice(0, 600));
  await pg.check('[data-pzmal="2"]'); await pg.waitForTimeout(200); await pg.fill('[data-pzskrb="2"]', 'Mate Matić stariji'); await pg.waitForTimeout(100);
  ok('567: član označen kao maloljetan dobiva polje za skrbnika', !!(await pg.$('[data-pzskrb="2"]')) && await pg.evaluate(() => document.querySelector('[data-pzskrb="2"]').value === 'Mate Matić stariji'));
  await pg.click('[data-pzposalji]'); await pg.waitForTimeout(200); tx = await app(pg);
  ok('bez propozicija ne šalje', !st.post && tx.includes('propozicije'));
  await pg.check('[data-pz="propozicije"]'); await pg.click('[data-pzposalji]'); await pg.waitForTimeout(700); tx = await app(pg);
  ok('POST: naziv, brod, 3 člana (bgf/ime, uloge) → kartica „čeka potvrdu organizatora”, kotizacija 300 € nije plaćeno', st.post?.naziv === 'GALEB' && st.post.brod === 'Cranchi 36' && st.post.clanovi.length === 3 && st.post.clanovi[0].bgf === 10077 && st.post.clanovi[0].uloga === 'captain' && st.post.clanovi[1].bgf === 10078 && st.post.clanovi[2].ime === 'Mate Matić' && st.post.clanovi[2].maloljetan === true && st.post.clanovi[2].skrbnik === 'Mate Matić stariji' && tx.includes('čeka potvrdu organizatora') && tx.includes('300 €'), JSON.stringify(st.post) + tx.slice(0, 300));
  await pg.screenshot({ path:path.join(__dirname, 'slike', '558-kartica.png'), fullPage:true });
  await pg.click('nav.dno [data-v="profil"]'); await pg.waitForTimeout(500); tx = await app(pg);
  ok('Moj profil: MOJE PRIJAVE → GALEB · Big Game Felun 2027 · čeka', tx.includes('MOJE PRIJAVE') && tx.includes('GALEB · Big Game Felun 2027'), tx.slice(0, 400));
  ok('575: profil ima digitalnu karticu i pravila privatnosti', tx.includes('Digitalna kartica') && tx.includes('Pravila privatnosti'));
  await pg.click('[data-kartica]'); await pg.waitForTimeout(600); { const l = await pg.innerText('.list');
  ok('575: kartica s imenom i BGF brojem (QR se učitava s cdnjs)', l.includes('Frane Rokov') && l.includes('BGF-10077'), l.slice(0, 200)); }
  await pg.mouse.click(195, 40); await pg.waitForTimeout(300);
  await pg.click('[data-pzotvori="felun2027"]'); await pg.waitForTimeout(400);
  await pg.click('[data-pzuredi]'); await pg.waitForTimeout(300); tx = await app(pg);
  ok('Uredi: obrazac s posadom 3/8 i BGF brojevima', tx.includes('POSADA (3/8)') && tx.includes('BGF-10078') && tx.includes('Spremi izmjene'), tx.slice(0, 500));
  await pg.click('[data-pzmakni="2"]'); await pg.waitForTimeout(200); await pg.click('[data-pzposalji]'); await pg.waitForTimeout(700); tx = await app(pg);
  ok('PUT: 2 člana, Pero zadržao BGF', st.put[0]?.clanovi.length === 2 && st.put[0].clanovi[1].bgf === 10078 && tx.includes('čeka potvrdu'), JSON.stringify(st.put));
  pg.on('dialog', dl => dl.accept());
  await pg.click('[data-pzodustani]'); await pg.waitForTimeout(600); tx = await app(pg);
  ok('Odustani → PUT odustani → povučena', st.put[1]?.odustani === true && tx.includes('povučena'), tx.slice(0, 300));
  await pg.evaluate(() => { S.jezik = 'en'; crtaj(); }); await pg.waitForTimeout(200); tx = await app(pg);
  ok('EN: Team entry / withdrawn / CREW', tx.includes('Team entry') && tx.includes('withdrawn') && tx.includes('CREW'), tx.slice(0, 300));
  await c.close();
  ok('bez JS grešaka', greske.length === 0, greske.join(' | ').slice(0, 400));
  for (const r of rez) console.log(r[0], r[1], r[2] ? '\n   → ' + r[2].replace(/\n/g, ' ').slice(0, 600) : '');
  console.log(rez.filter(r => r[0] === '✅').length + '/' + rez.length);
  await b.close(); srv.close();
})();
