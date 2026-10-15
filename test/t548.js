const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = path.join(ROOT, u === '/' ? 'index.html' : u); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' }); r.end(fs.readFileSync(f)); }).listen(8548);
const LIST = { live: [], upcoming: [], finished: [{ subdomain:'felun2026', name:'Big Game Felun 2026', organizer:'ŠRK Felun', location:'Mlini', from:'2026-05-22', to:'2026-05-24', days:3, status:'finished', teams:2, catches:3, vrsta:'open', year:2026, prijave:false, naStapu:0 }] };
const TRAZI = { osobe:[{ bgf:10001, ime:'Ivan Kovač' }], ekipe:[{ ime:'CORTO', kljuc:'corto', nastupa:2, zadnja:2026 }], turniri:[{ subdomain:'felun2026', name:'Big Game Felun 2026', godina:2026 }] };
const OSOBA = { osoba:{ bgf:10001, ime:'Ivan Kovač', nadimak:null, klub:'ŠRK Felun', klubovi:[{ sezona:2026, klub:'ŠRK Felun' },{ sezona:2024, klub:'ŠRD Galeb' }] }, brojke:{ turnira:2, ulova:1, kapetan:1, pobjeda:1 },
  nastupi:[{ godina:2026, turnir:'Big Game Felun 2026', subdomain:'felun2026', ekipa:'CORTO 1', uloga:'kapetan', izvor:'turnir' },{ godina:2015, turnir:'Tunistra 2015', ekipa:'Corto', uloga:'kapetan', mjesto:1, izvor:'arhiva' }],
  ulovi:[{ turnir:'Big Game Felun 2026', subdomain:'felun2026', godina:2026, dan:1, vrsta:'Plavoperajna tuna', ishod:'boated', kg:151, bodovi:10 }] };
const EKIPA = { ime:'CORTO', kljuc:'corto', brojke:{ nastupa:2, ulova:1, pobjeda:1 }, nastupi:[
  { godina:2026, turnir:'Big Game Felun 2026', subdomain:'felun2026', prijava:'CORTO 1', mjesto:null, ulova:1, clanovi:[{ ime:'Ivan Kovač', bgf:10001, uloga:'kapetan' },{ ime:'Ante Barić', bgf:null, uloga:'posada' }] },
  { godina:2015, turnir:'Tunistra 2015', subdomain:null, prijava:'Corto', mjesto:1, ulova:null, clanovi:[{ ime:'Ivan Kovac', bgf:10001, uloga:'kapetan' },{ ime:'Pero Perić', bgf:null, uloga:null }] } ] };
const LB = { tournament:{ name:'Big Game Felun 2026', days:3, currentDay:3, dayDates:['2026-05-22','2026-05-23','2026-05-24'], rankingMode:'points', lockedDays:[1,2,3] },
  leaderboard:[{ teamId:'e1', compNumber:1, name:'CORTO 1', catches:1, points:10 }], teams:[{ teamId:'e1', compNumber:1, name:'CORTO 1', captain:'Ivan Kovač', anglers:[{ name:'Ivan Kovač' }] }], catches:[], feed:[], stats:{}, statsByDay:[] };
(async () => {
  const b = await chromium.launch(); const greske = []; const rez = [];
  const ok = (n, u, i='') => rez.push([u ? '✅' : '❌', n, u ? '' : i]);
  const c = await b.newContext({ viewport:{ width:390, height:844 }, locale:'hr-HR' });
  const pg = await c.newPage(); pg.setDefaultTimeout(5000); pg.on('pageerror', e => greske.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::/.test(m.text())) greske.push(m.text()); });
  const pozivi = [];
  await pg.route('**/bgf-live-backend.vercel.app/**', r => { const u = r.request().url(); pozivi.push(u);
    const J = x => r.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(x) });
    if (u.includes('/api/public/tournaments')) return J(LIST);
    if (u.includes('/api/public/trazi')) return J(new URL(u).searchParams.get('q').length >= 2 ? TRAZI : { osobe:[], ekipe:[], turniri:[] });
    if (u.includes('/api/public/osoba/10001')) return J(OSOBA);
    if (u.includes('/api/public/osoba/')) return r.fulfill({ status:404, contentType:'application/json', body:'{"error":"x"}' });
    if (u.includes('/api/public/ekipa')) return J(EKIPA);
    if (u.includes('/felun2026/leaderboard')) return J(LB);
    return r.fulfill({ status:401, contentType:'application/json', body:'{}' }); });
  await pg.goto('http://localhost:8548/'); await pg.waitForTimeout(1800);
  const app = async () => (await pg.innerText('#app')) || '';
  await pg.click('[data-trazi]'); await pg.waitForTimeout(300);
  ok('dodir na traku: ekran Pretraga, fokus ostaje u polju', await pg.evaluate(() => S.v === 'pretraga' && document.activeElement && document.activeElement.hasAttribute('data-trazi')));
  await pg.keyboard.type('kovac', { delay:40 }); await pg.waitForTimeout(700);
  let tx = await app();
  ok('rezultati: natjecatelj, ekipa, turnir; fokus i tekst u polju ostaju', tx.includes('Ivan Kovač') && tx.includes('BGF-10001') && tx.includes('CORTO') && tx.includes('2 nastupa') && tx.includes('Big Game Felun 2026')
    && await pg.evaluate(() => document.activeElement.hasAttribute('data-trazi') && document.activeElement.value === 'kovac'), tx.slice(0, 400));
  ok('tipkanje šalje jedan upit (odgoda 300 ms)', pozivi.filter(u => u.includes('/trazi')).length <= 2, pozivi.filter(u => u.includes('/trazi')).length + ' upita');
  await pg.screenshot({ path:path.join(__dirname, 'slike', '548-pretraga.png') });
  await pg.click('[data-josb="10001"]'); await pg.waitForTimeout(500); tx = await app();
  ok('natjecatelj: ime, BGF, klub, brojke, nastupi (arhiva 1.), osobni ulov, klub kroz sezone', tx.includes('Ivan Kovač') && tx.includes('BGF-10001 · ŠRK Felun') && tx.includes('NASTUPI') && tx.includes('Tunistra 2015') && /1\.\s*$/m.test(tx) && tx.includes('151 kg') && tx.includes('KLUB KROZ SEZONE') && tx.includes('ŠRD Galeb'), tx.slice(0, 900));
  await pg.screenshot({ path:path.join(__dirname, 'slike', '548-osoba.png'), fullPage:true });
  ok('profil: Corto/CORTO jedna ekipa; godina ispod naziva, desno samo mjesto', (await pg.$$('[data-jekg]')).length === 1 && tx.includes('2026. · CORTO 1') && !/2026\.\s*\n\s*\n?.*Tunistra/.test(tx), String((await pg.$$('[data-jekg]')).length));
  await pg.click('[data-jekg="CORTO"]'); await pg.waitForTimeout(500); tx = await app();
  ok('ekipa kroz godine: prvi nastup 2015, 2 nastupa, članovi (Ante Barić bez profila)', tx.includes('CORTO') && tx.includes('prvi nastup 2015.') && tx.includes('OVA EKIPA KROZ GODINE') && tx.includes('Ante Barić') && tx.includes('Pero Perić'), tx.slice(0, 700));
  await pg.screenshot({ path:path.join(__dirname, 'slike', '548-ekipa.png'), fullPage:true });
  await pg.click('[data-josb="10001"] >> nth=0'); await pg.waitForTimeout(300);
  ok('član ekipe → profil', (await app()).includes('NASTUPI'));
  await pg.click('[data-jnatrag]'); await pg.waitForTimeout(200); ok('natrag → ekipa', await pg.evaluate(() => S.v === 'ekipa'));
  await pg.click('[data-jnatrag]'); await pg.waitForTimeout(200); ok('natrag → natjecatelj', await pg.evaluate(() => S.v === 'osoba'));
  await pg.click('[data-jnatrag]'); await pg.waitForTimeout(200); ok('natrag → pretraga s rezultatima', await pg.evaluate(() => S.v === 'pretraga') && (await app()).includes('BGF-10001'));
  // iz turnira: list ekipe → ekipa kroz godine
  await pg.evaluate(() => { S.t = 'felun2026'; S.ttab = 'ekipe'; S.v = 'turnir'; crtaj(); }); await pg.waitForTimeout(700);
  await pg.click('[data-jek="e1"]'); await pg.waitForTimeout(300);
  ok('list ekipe na turniru ima „Ekipa kroz godine →”', (await pg.innerText('.list')).includes('Ekipa kroz godine'));
  await pg.click('.list [data-jekg]'); await pg.waitForTimeout(500);
  ok('… i otvara ekipu kroz godine (list zatvoren)', await pg.evaluate(() => S.v === 'ekipa' && !LIST) && (await app()).includes('OVA EKIPA KROZ GODINE'));
  await pg.evaluate(() => { S.osBgf = 99999; S.v = 'osoba'; crtaj(); }); await pg.waitForTimeout(500);
  ok('nepostojeći BGF: poruka', (await app()).includes('Natjecatelj nije pronađen.'));
  await pg.evaluate(() => { S.jezik = 'en'; S.osBgf = 10001; S.v = 'osoba'; crtaj(); }); await pg.waitForTimeout(300); tx = await app();
  ok('EN: APPEARANCES, PERSONAL CATCHES, Boated, captain', tx.includes('APPEARANCES') && tx.includes('PERSONAL CATCHES') && tx.includes('Boated') && /captain/.test(tx) && tx.includes('Bluefin'), tx.slice(0, 700));
  ok('bez JS grešaka', greske.length === 0, greske.join(' | ').slice(0, 400));
  for (const r of rez) console.log(r[0], r[1], r[2] ? '\n   → ' + r[2].replace(/\n/g, ' ') : '');
  console.log(rez.filter(r => r[0] === '✅').length + '/' + rez.length);
  await b.close(); srv.close();
})();
