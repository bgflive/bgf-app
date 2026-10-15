const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = path.join(ROOT, u === '/' ? 'index.html' : u); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' }); r.end(fs.readFileSync(f)); }).listen(8552);
const d = new Date(), danas = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
(async () => {
  const b = await chromium.launch(); const greske = []; const rez = []; const ok = (n, u, i='') => rez.push([u ? '✅' : '❌', n, u ? '' : i]);
  async function scena(prijavljen){
    const c = await b.newContext({ viewport:{ width:390, height:844 }, locale:'hr-HR' }); const pg = await c.newPage(); pg.setDefaultTimeout(6000);
    pg.on('pageerror', e => greske.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::/.test(m.text())) greske.push(m.text()); });
    const st = { tijela:[], auth:[] };
    await pg.route('**/bgf-live-backend.vercel.app/**', r => { const u = r.request().url(), m = r.request().method(); const J = (x, s=200) => r.fulfill({ status:s, contentType:'application/json', body:JSON.stringify(x) });
      if (u.includes('/api/public/tournaments')) return J({ live:[], upcoming:[], finished:[] });
      if (u.includes('/api/ekipa/kod')) { const b2 = JSON.parse(r.request().postData()); st.tijela.push(b2); st.auth.push(r.request().headers()['authorization'] || null);
        if (b2.kod !== 'ABCDEF') return J({ error:'Kod ne postoji. Provjeri ga s kapetanom ili organizatorom.' }, 404);
        return prijavljen ? J({ nacin:'povezan', tournamentId:'T1', teamId:'e0', ekipa:{ id:'e0', naziv:'TRITON', broj:1, turnir:'Kup' } })
                          : J({ nacin:'ekipa', access_token:'tokE', refresh_token:'refE', expires_in:3600, tournamentId:'T1', teamId:'e0', ekipa:{ id:'e0', naziv:'TRITON', broj:1, turnir:'Kup' } }); }
      if (u.includes('/api/me/roles')) return J({ user:{ id:'UE', email: prijavljen ? 'frane@gmail.com' : 'ekipa-e0@ekipe.bgf.live', name: prijavljen ? 'Frane' : 'Ekipa TRITON' }, person: prijavljen ? { first_name:'Frane', last_name:'Rokov', bgf:'BGF-10077' } : null,
        roles: (prijavljen && st.tijela.length === 0) ? [] : [{ role:'team', tournamentId:'T1', teamId:'e0' }], tournaments:[{ id:'T1', name:'Kup', subdomain:'kup', day_dates:[danas] }], teams:[{ id:'e0', name:'TRITON' }] });
      if (u.includes('/api/tournaments/T1/state')) return J({ tournament:{ id:'T1', name:'Kup', subdomain:'kup', start_date:danas, days:1, day_dates:[danas] }, fishingHours:[{ day_number:1, start_time:'00:00:00', end_time:'23:59:00' }], dayLocks:[],
        teams:[{ id:'e0', name:'TRITON', comp_number:1, anglers:[{ id:'a0', name:'Frane Rokov' }] }], ruleSpecies:[{ id:'s1', name:'Plavoperajna tuna', can_release:true, can_boat:false }], ruleNotes:{}, users:[], verifications:[], incidents:[], sponsors:[] });
      if (u.includes('/api/me/profil')) return J({ osoba:{ bgf:10077, ime:'Frane', prezime:'Rokov', drzava:'HR', jezik:'hr', privola:{} }, klub:null, dozvole:[], vazeca:null, zahtjevi:[] });
      return J({}); });
    if (prijavljen) await pg.addInitScript(() => { localStorage.setItem('bgf-pravo', JSON.stringify({ access:'tokP', refresh:'refP', istek:Date.now() + 3600000, red:[], veze:{} })); });
    await pg.goto('http://localhost:8552/'); await pg.waitForTimeout(1800);
    return { pg, c, st };
  }
  let { pg, c, st } = await scena(false);
  await pg.click('nav.dno [data-v="profil"]'); await pg.waitForTimeout(200); await pg.click('[data-tmlist="kod"]'); await pg.waitForTimeout(300);
  let lst = await pg.innerText('.list');
  ok('list „Ekipni kod”: polje, bez izmišljenih imena posade', lst.includes('Kod daje kapetan') && !lst.includes('Gordon Svalina') && !!(await pg.$('[data-ekod]')), lst.slice(0, 300));
  await pg.fill('[data-ekod]', 'abc'); await pg.click('[data-ekodda]'); await pg.waitForTimeout(200); lst = await pg.innerText('.list');
  ok('prekratak kod → poruka, bez slanja', lst.includes('6 znakova') && st.tijela.length === 0);
  await pg.fill('[data-ekod]', 'zzz-zzz'); await pg.click('[data-ekodda]'); await pg.waitForTimeout(400); lst = await pg.innerText('.list');
  ok('nepostojeći kod → poruka sa servera', lst.includes('Kod ne postoji'), lst.slice(0, 300));
  await pg.fill('[data-ekod]', 'abc-def'); await pg.keyboard.press('Enter'); await pg.waitForTimeout(1500);
  ok('ispravan kod bez prijave: šalje ABCDEF bez prijave → turnirski način ekipe TRITON', st.tijela.slice(-1)[0].kod === 'ABCDEF' && st.auth.slice(-1)[0] === null && await pg.evaluate(() => S.v === 'tm' && PRAVO.on && PRAVO.ekipa && PRAVO.ekipa.name === 'TRITON'), JSON.stringify(await pg.evaluate(() => [S.v, PRAVO.on, PRAVO.ekipa && PRAVO.ekipa.name])));
  await pg.screenshot({ path:path.join(__dirname, 'slike', '552-tm.png') });
  await pg.evaluate(() => { S.v = 'profil'; LIST = null; crtaj(); }); await pg.waitForTimeout(300);
  let tx = await pg.innerText('#app');
  ok('profil na mobitelu ekipe: „Mobitel ekipe”, ne „Dovrši registraciju”', tx.includes('Mobitel ekipe') && !tx.includes('Dovrši registraciju') && tx.includes('Odjava'), tx.slice(0, 300));
  await c.close();
  ({ pg, c, st } = await scena(true));
  await pg.evaluate(() => { LIST = { k:'tm-kod' }; crtaj(); }); await pg.waitForTimeout(200);
  await pg.fill('[data-ekod]', 'ABCDEF'); await pg.click('[data-ekodda]'); await pg.waitForTimeout(1500);
  ok('prijavljen natjecatelj: kod se šalje s prijavom → povezan, uloge osvježene → turnirski način', st.auth.slice(-1)[0] === 'Bearer tokP' && await pg.evaluate(() => S.v === 'tm' && PRAVO.on), JSON.stringify(await pg.evaluate(() => [S.v, PRAVO.on])) + ' ' + JSON.stringify(st.auth));
  await c.close();
  ok('bez JS grešaka', greske.length === 0, greske.join(' | ').slice(0, 400));
  for (const r of rez) console.log(r[0], r[1], r[2] ? '\n   → ' + r[2].replace(/\n/g, ' ').slice(0, 500) : '');
  console.log(rez.filter(r => r[0] === '✅').length + '/' + rez.length);
  await b.close(); srv.close();
})();
