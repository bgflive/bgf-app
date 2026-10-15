const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]) === '/' ? 'index.html' : decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.js') ? 'application/javascript' : 'application/octet-stream' }); r.end(fs.readFileSync(f)); }).listen(8546);
const PUNO = { serverTime: new Date().toISOString(),
  live: [{ subdomain:'felun2027', name:'Big Game Felun 2027', organizer:'ŠRK Felun', location:'Mlini', from:'2026-10-13', to:'2026-10-15', days:3, currentDay:2, status:'live', teams:24, catches:7, released:5, boated:2, vrsta:'open', rankingMode:'points', year:2026, prijave:false, naStapu:3 }],
  upcoming: [{ subdomain:'orebic2027', name:'Big Game Orebić 2027', organizer:'ŠRD Orebić', location:'Orebić', from:'2027-05-14', to:'2027-05-16', days:3, currentDay:null, status:'upcoming', teams:5, catches:0, vrsta:'open', year:2027, prijave:true, naStapu:0 },
             { subdomain:'dplvr2027', name:'12. Državno prvenstvo', organizer:'HSŠRM', location:'Komiža', from:'2027-10-01', to:'2027-10-05', days:5, status:'upcoming', teams:0, catches:0, vrsta:'dp', year:2027, prijave:false, naStapu:0 }],
  finished: [{ subdomain:'tunistra2026', name:'Tunistra 2026', organizer:'4Tuna', location:'Poreč', from:'2026-09-11', to:'2026-09-13', days:3, status:'finished', teams:35, catches:79, vrsta:'open', year:2026, prijave:false, naStapu:0 }] };
(async () => {
  const b = await chromium.launch(); const greske = []; const rez = [];
  const ok = (n, u, i='') => rez.push([u ? '✅' : '❌', n, u ? '' : i]);
  async function otvori(odg, jezik) {
    const c = await b.newContext({ viewport: { width: 390, height: 844 }, locale: jezik === 'en' ? 'en-GB' : 'hr-HR' });
    const pg = await c.newPage(); pg.on('pageerror', e => greske.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_|net::/.test(m.text())) greske.push(m.text()); });
    await pg.route('**/bgf-live-backend.vercel.app/**', r => { const u = r.request().url(); if (u.includes('/api/public/tournaments')) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(odg) }); return r.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"x"}' }); });
    await pg.goto('http://localhost:8546/'); await pg.waitForTimeout(2200);
    return { pg, c };
  }
  let { pg, c } = await otvori(PUNO, 'hr');
  const app = async () => (await pg.innerText('#app')) || '';
  let tx = await app();
  ok('početna: pravi turnir uživo', tx.includes('Big Game Felun 2027') && tx.includes('UŽIVO SADA (1)'), tx.slice(0, 300));
  ok('početna: danas — 3 na štapu · 7 ulova', /Danas: Big Game Felun 2027 Dan 2 · 3 na štapu · 7 ulova/.test(tx), tx.slice(0, 300));
  ok('početna: uskoro + prijave otvorene + oznaka USKORO', tx.includes('Big Game Orebić 2027') && tx.includes('PRIJAVE OTVORENE') && tx.includes('USKORO'));
  ok('početna: nema izmišljenih (CORTO borba, Silba, Rogoznica, prikaz prekidača)', !tx.includes('CORTO · borba') && !tx.includes('Silba 2026') && !tx.includes('u sezoni') && !tx.includes('LAMPARA'), ['CORTO · borba','Silba 2026','u sezoni','LAMPARA'].filter(w => tx.includes(w)).join(',') + ' @ ' + tx.slice(tx.indexOf('u sezoni') - 200, tx.indexOf('u sezoni') + 50));
  ok('kartica: bez retka „Prijave:”; uskoro → Otvori turnir', !tx.includes('Prijave:') && (tx.match(/Otvori turnir/g) || []).length === 2 && (tx.match(/Rezultati/g) || []).length === 2, 'Otvori=' + (tx.match(/Otvori turnir/g) || []).length + ' Rez=' + (tx.match(/Rezultati/g) || []).length);
  await pg.screenshot({ path: path.join(__dirname, 'slike', '546-pocetna.png'), fullPage: true });
  await pg.click('nav.dno [data-v="turniri"]'); await pg.waitForTimeout(400); tx = await app();
  ok('Turniri: godine iz podataka (2027, 2026), prvi 2027', tx.includes('2027') && tx.includes('2026') && !tx.includes('…2011') && tx.includes('Orebić') && !tx.includes('Tunistra'), tx.slice(0, 400));
  await pg.click('[data-god="2026"]'); await pg.waitForTimeout(300); tx = await app();
  ok('Turniri 2026: Felun + Tunistra', tx.includes('Tunistra 2026') && tx.includes('Big Game Felun 2027'));
  await pg.screenshot({ path: path.join(__dirname, 'slike', '546-turniri.png'), fullPage: true });
  await pg.click('[data-t="tunistra2026"]'); await pg.waitForTimeout(400); tx = await app();
  ok('turnir (završen): pravi podaci, bez izmišljenih vrsta i grafova', tx.includes('Tunistra 2026') && tx.includes('Poreč') && tx.includes('4Tuna') && !tx.includes('ULOVI PO VRSTAMA') && tx.includes('tunistra2026.bgf.live'), tx.slice(0, 500));
  await pg.click('[data-ttab="poredak"]'); await pg.waitForTimeout(300); tx = await app();
  ok('turnir → Poredak: privremeno board (bez izmišljenog poretka)', tx.includes('Board turnira') && !tx.includes('BONACA'), tx.slice(0, 300));
  await pg.screenshot({ path: path.join(__dirname, 'slike', '546-turnir.png'), fullPage: true });
  await c.close();
  // EN + prazno
  ({ pg, c } = await otvori({ serverTime: '', live: [], upcoming: [], finished: [] }, 'en'));
  await pg.evaluate(() => { S.jezik = 'en'; crtaj(); }); await pg.waitForTimeout(300); tx = await app();
  ok('prazno (EN): nema izmišljenih, prazna stanja prevedena', !tx.includes('Felun') && tx.includes('No tournaments announced yet.') && tx.includes('No finished tournaments yet.') && /season has not been announced/.test(tx), tx.slice(0, 500));
  await pg.screenshot({ path: path.join(__dirname, 'slike', '546-prazno-en.png'), fullPage: true });
  await c.close();
  ({ pg, c } = await otvori(PUNO, 'en'));
  await pg.evaluate(() => { S.jezik = 'en'; crtaj(); }); await pg.waitForTimeout(300); tx = await app();
  ok('EN: LIVE NOW (1), Today: … on the rod, COMING SOON', tx.includes('LIVE NOW (1)') && /Today: Big Game Felun 2027 Day 2 · 3 on the line · 7 catches/.test(tx) && tx.includes('COMING SOON'), tx.slice(0, 400));
  await c.close();
  // bez mreže, ali zapamćeno
  ({ pg, c } = await otvori(PUNO, 'hr'));
  await pg.unroute('**/bgf-live-backend.vercel.app/**'); await pg.route('**/bgf-live-backend.vercel.app/**', r => r.abort());
  await pg.reload(); await pg.waitForTimeout(2000); tx = await app();
  ok('bez signala: početna iz zapamćenog', tx.includes('Big Game Felun 2027'));
  await c.close();
  ok('bez JS grešaka', greske.length === 0, greske.join(' | ').slice(0, 400));
  for (const r of rez) console.log(r[0], r[1], r[2] ? '\n   → ' + r[2] : '');
  console.log(rez.filter(r => r[0] === '✅').length + '/' + rez.length);
  await b.close(); srv.close();
})();
