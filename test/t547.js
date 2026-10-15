const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = path.join(ROOT, u === '/' ? 'index.html' : u); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' }); r.end(fs.readFileSync(f)); }).listen(8547);
const z = new Date(), hh = (m) => { const d = new Date(z.getTime() - m * 60000); return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0'); };
const LIST = { serverTime: '', live: [{ subdomain:'felun2027', name:'Big Game Felun 2027', organizer:'ŠRK Felun', location:'Mlini', from:'2026-10-13', to:'2026-10-15', days:3, currentDay:2, status:'live', teams:3, catches:3, vrsta:'open', year:2026, prijave:false, naStapu:1 }],
  upcoming: [], finished: [{ subdomain:'dplvr2026', name:'11. Državno prvenstvo', organizer:'HSŠRM', location:'Medulin', from:'2026-10-06', to:'2026-10-07', days:2, status:'finished', teams:2, catches:2, vrsta:'dp', year:2026, prijave:false, naStapu:0 }] };
const TEAMS = [ { teamId:'e1', compNumber:1, name:'CORTO', captain:'Gordon Svalina', club:'ŠRK Felun', clubCity:'Mlini', contactPhone:'+385991112222', anglers:[{ name:'Gordon Svalina', license:'LIC-77', licenseValid:true },{ name:'Ivan Kovač', license:'LIC-78', licenseValid:true }] },
  { teamId:'e2', compNumber:2, name:'BONACA', captain:'Ante Barić', anglers:[{ name:'Ante Barić' },{ name:'Luka Perić' },{ name:'Marin Vuković' }] },
  { teamId:'e3', compNumber:3, name:'TRITON', captain:null, anglers:[{ name:'Frane Rokov' }] } ];
const CATCHES = [ { kind:'catch', at:'2026-10-13T08:12:00Z', teamId:'e1', teamName:'CORTO', compNumber:1, day:1, time:'08:12', species:'Plavoperajna tuna', outcome:'boated', status:'scored', points:1820, weightKg:182, angler:'Ivan Kovač', gpsLat:42.62, gpsLon:18.15 },
  { kind:'catch', at:'2026-10-14T09:31:00Z', teamId:'e2', teamName:'BONACA', compNumber:2, day:2, time:hh(60), species:'Plavoperajna tuna', outcome:'released', status:'scored', points:700, weightKg:null, angler:'Ante Barić', gpsLat:null, gpsLon:null },
  { kind:'catch', at:'2026-10-14T10:00:00Z', teamId:'e3', teamName:'TRITON', compNumber:3, day:2, time:hh(30), species:'Iglan', outcome:'released', status:'pending', points:0, angler:'Frane Rokov' } ];
const LB = { tournament: { name:'Big Game Felun 2027', days:3, currentDay:2, dayDates:['2026-10-13','2026-10-14','2026-10-15'], rankingMode:'points', lockedDays:[1], lockedAt:{ 1:'2026-10-13T16:30:00Z' }, zone:[{lat:42.70,lon:18.0},{lat:42.70,lon:18.3},{lat:42.55,lon:18.3},{lat:42.55,lon:18.0}] },
  leaderboard: [ { teamId:'e1', compNumber:1, name:'CORTO', catches:1, points:1820 }, { teamId:'e2', compNumber:2, name:'BONACA', catches:1, points:700 }, { teamId:'e3', compNumber:3, name:'TRITON', catches:1, points:0 } ],
  hours:[{ day:1, start:'07:00', end:'16:00' },{ day:2, start:'07:00', end:'16:00' },{ day:3, start:'07:00', end:'15:00' }],
  teams: TEAMS, catches: CATCHES,
  feed: [ { kind:'hooked', resolved:false, teamId:'e1', teamName:'CORTO', compNumber:1, day:2, time:hh(4), angler:'Gordon Svalina' }, ...CATCHES.slice().reverse(), { kind:'hooked', resolved:true, teamId:'e2', teamName:'BONACA', compNumber:2, day:2, time:hh(62) } ],
  sponsors:[{ name:'Grad Dubrovnik' },{ name:'Garmin' }], stats:{ hooked:3, hookedSNaknadnima:4, totalCatches:3, biggest:{ weightKg:182, species:'Plavoperajna tuna', teamName:'CORTO' } },
  statsByDay:[{ day:1, totalCatches:1 },{ day:2, totalCatches:2 },{ day:3, totalCatches:0 }] };
const LBDP = { tournament:{ name:'11. Državno', days:2, currentDay:2, dayDates:['2026-10-06','2026-10-07'], rankingMode:'placement', lockedDays:[1,2] },
  leaderboard:[ { teamId:'d1', compNumber:1, name:'TRITON', catches:2, placementPoints:2, placeTotal:1, days:{ 1:{ rank:1, pb:1, bpv:10 }, 2:{ rank:1, pb:1, bpv:8 } } }, { teamId:'d2', compNumber:2, name:'CORTO', catches:0, placementPoints:4, placeTotal:2, days:{ 1:{ rank:2, pb:2, bpv:0 }, 2:{ rank:2, pb:2, bpv:0 } } } ],
  teams:[{ teamId:'d1', compNumber:1, name:'TRITON', anglers:[{name:'A B'},{name:'C D'},{name:'E F'},{name:'G H'}] },{ teamId:'d2', compNumber:2, name:'CORTO', anglers:[{name:'I J'}] }], catches:[], feed:[], sponsors:[], stats:{}, statsByDay:[] };
(async () => {
  const b = await chromium.launch(); const greske = []; const rez = [];
  const ok = (n, u, i='') => rez.push([u ? '✅' : '❌', n, u ? '' : i]);
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'hr-HR' });
  const pg = await c.newPage(); pg.on('pageerror', e => greske.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::/.test(m.text())) greske.push(m.text()); });
  let lbPoziva = 0;
  await pg.route('**/bgf-live-backend.vercel.app/**', r => { const u = r.request().url();
    if (u.includes('/api/public/tournaments')) return r.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(LIST) });
    if (u.includes('/felun2027/leaderboard')) { lbPoziva++; return r.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(LB) }); }
    if (u.includes('/dplvr2026/leaderboard')) return r.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(LBDP) });
    return r.fulfill({ status:401, contentType:'application/json', body:'{}' }); });
  await pg.goto('http://localhost:8547/'); await pg.waitForTimeout(2000);
  const app = async () => (await pg.innerText('#app')) || '';
  await pg.click('[data-t="felun2027"] >> nth=0'); await pg.waitForTimeout(800); let tx = await app();
  ok('turnir uživo → kartica Uživo: na štapu (1) s brojačem', tx.includes('NA ŠTAPU SADA (1)') && /CORTO #1/.test(tx) && /0[34]:\d\d/.test(tx), tx.slice(0, 500));
  ok('Uživo: poredak top (CORTO 1.820) i zadnje (BONACA, Pušteno)', /1\.820/.test(tx) && tx.includes('BONACA') && tx.includes('Pušteno') && tx.includes('Grad Dubrovnik'), tx.slice(0, 900));
  ok('Uživo: „čeka suca” za neodlučen ulov', tx.includes('čeka suca'));
  await pg.screenshot({ path:path.join(__dirname, 'slike', '547-uzivo.png'), fullPage:true });
  await pg.click('nav.dno [data-ttab="poredak"]'); await pg.waitForTimeout(300); tx = await app();
  ok('Poredak: Ukupno, Dan 1 🔒, Dan 2', tx.includes('Ukupno') && tx.includes('Dan 1 🔒') && tx.includes('Dan 2'), tx.slice(0, 300));
  await pg.click('[data-jpor="2"]'); await pg.waitForTimeout(200); tx = await app();
  ok('Poredak Dan 2: BONACA prva (700)', /^1\s*\n?\s*BONACA/m.test(tx.slice(tx.indexOf('Dan 2'))) || tx.indexOf('BONACA') < tx.indexOf('CORTO #1'), tx.slice(0, 400));
  await pg.click('nav.dno [data-ttab="ekipe"]'); await pg.waitForTimeout(300); tx = await app();
  ok('Ekipe: 3 ekipe, posada, kačenja', tx.includes('EKIPE (3)') && tx.includes('Luka Perić') && /CORTO[\s\S]*1 kačenja/.test(tx) && /TRITON[\s\S]*🎣 1 kačenja/.test(tx) && !/0 kačenja/.test(tx), tx.slice(0, 500));
  ok('nigdje telefon ni broj dozvole', !(await pg.content()).includes('+385991112222') && !(await pg.content()).includes('LIC-77'));
  await pg.click('[data-jek="e1"]'); await pg.waitForTimeout(300);
  const lst = await pg.innerText('.list');
  ok('list ekipe: CORTO, klub, kapetan, ulov 182 kg', lst.includes('CORTO') && lst.includes('ŠRK Felun') && lst.includes('kapetan') && lst.includes('182 kg'), lst.slice(0, 400));
  await pg.screenshot({ path:path.join(__dirname, 'slike', '547-ekipa.png') });
  await pg.mouse.click(195, 40); await pg.waitForTimeout(300); ok('list se zatvara dodirom iznad', !(await pg.$('.list.on')));
  await pg.click('nav.dno [data-ttab="ulovi"]'); await pg.waitForTimeout(300); tx = await app();
  ok('Tijek: DAN 2 i DAN 1, SLUŽBENO za dan 1', tx.includes('DAN 2') && tx.includes('DAN 1') && tx.includes('SLUŽBENO') && tx.indexOf('DAN 2') < tx.indexOf('DAN 1'), tx.slice(0, 500));
  await pg.click('[data-dan="1"]'); await pg.waitForTimeout(200); tx = await app();
  ok('Tijek Dan 1: samo CORTO 182 kg', tx.includes('182 kg') && !tx.includes('BONACA'), tx.slice(0, 400));
  await pg.screenshot({ path:path.join(__dirname, 'slike', '547-tijek.png'), fullPage:true });
  await pg.click('nav.dno [data-ttab="pregled"]'); await pg.waitForTimeout(300); tx = await app();
  ok('Pregled: 6 natjecatelja, 1 na štapu, vrste, najveća, satnica', /6\s*\n?\s*natjecatelja/.test(tx) && tx.includes('ULOVI PO VRSTAMA') && tx.includes('Najveća riba') && tx.includes('SATNICA') && tx.includes('Iglan'), tx.slice(0, 1200));
  await pg.evaluate(() => { S.jezik = 'en'; crtaj(); }); await pg.waitForTimeout(200);
  await pg.click('nav.dno [data-ttab="uzivo"]').catch(() => {}); await pg.waitForTimeout(200); tx = await app();
  ok('EN: ON THE LINE NOW (1), Released, awaiting judge', tx.includes('ON THE LINE NOW (1)') && tx.includes('Released') && tx.includes('awaiting judge'), tx.slice(0, 700));
  await pg.evaluate(() => { S.jezik = 'hr'; S.t = 'dplvr2026'; S.ttab = 'poredak'; S.v = 'turnir'; crtaj(); }); await pg.waitForTimeout(800); tx = await app();
  ok('Državno (plasmansko): TRITON 1. s 2 PB, napomena', tx.includes('TRITON') && tx.includes('Plasmansko bodovanje — manje je bolje.') && tx.indexOf('TRITON') < tx.indexOf('CORTO'), tx.slice(0, 500));
  const prije = lbPoziva; await pg.waitForTimeout(500);
  ok('nema petlje učitavanja', lbPoziva - prije <= 1, 'poziva ' + (lbPoziva - prije));
  // bez signala, ali zapamćeno
  await pg.unroute('**/bgf-live-backend.vercel.app/**'); await pg.route('**/bgf-live-backend.vercel.app/**', r => r.abort());
  await pg.reload(); await pg.waitForTimeout(1800);
  await pg.evaluate(() => { S.t = 'dplvr2026'; S.ttab = 'poredak'; S.v = 'turnir'; crtaj(); }); await pg.waitForTimeout(800); tx = await app();
  ok('bez signala: zadnji otvoreni turnir iz zapamćenog + traka', tx.includes('TRITON') && tx.includes('Bez signala'), tx.slice(0, 300));
  ok('bez JS grešaka', greske.length === 0, greske.join(' | ').slice(0, 400));
  for (const r of rez) console.log(r[0], r[1], r[2] ? '\n   → ' + r[2].replace(/\n/g, ' ') : '');
  console.log(rez.filter(r => r[0] === '✅').length + '/' + rez.length);
  await b.close(); srv.close();
})();
