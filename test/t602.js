const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = path.join(ROOT, u === '/' ? 'index.html' : u); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(fs.readFileSync(f)); }).listen(8602);
const LIST = { live:[], upcoming:[{ id:'sgf2026', subdomain:'sgf2026', name:'SQUID GAME FELUN 2026', organizer:'ŠRK FELUN', location:'MLINI', from:'2026-10-17', to:'2026-10-17', days:1, status:'upcoming', vrsta:'pilot', year:2026 }],
  finished:[{ id:'felun2026', subdomain:'felun2026', name:'BIG GAME FELUN 2026', organizer:'ŠRK FELUN', location:'MLINI', from:'2026-09-24', to:'2026-09-27', days:3, status:'finished', teams:14, catches:4, vrsta:'open', year:2026 },
   { id:'dplvr2026', subdomain:'dplvr2026', name:'11. DRŽAVNO PRVENSTVO 2026', organizer:'Hrvatski savez', location:'MEDULIN', from:'2026-10-06', to:'2026-10-10', days:3, status:'finished', teams:6, catches:5, vrsta:'dp', year:2026 }] };
const LB = { tournament:{ name:'BIG GAME FELUN 2026', days:3, currentDay:3, dayDates:['2026-09-24','2026-09-25','2026-09-27'], rankingMode:'points', lockedDays:[1,2,3], zone:[{lat:42.65,lon:18.0},{lat:42.65,lon:18.3},{lat:42.45,lon:18.3}], forbiddenZones:[{ tip:'krug', naziv:'Luka Cavtat', lat:42.58, lon:18.22, radius_m:500 }] },
  rules:[{ name:'Plavoperajna tuna', minMeasure:'115cm / 40kg', canRelease:true, releasePts:240, canBoat:true, boatMode:'tier', boatPts:0, tiers:[{ minKg:40, maxKg:99.99, ptsPerKg:7 },{ minKg:100, maxKg:null, ptsPerKg:8 }] },{ name:'Lampuga', minMeasure:'5kg', canRelease:false, releasePts:0, canBoat:true, boatMode:'perkg', boatPts:9 }],
  leaderboard:[{ teamId:'e1', compNumber:1, name:'PONTA', catches:2, points:900 }], teams:[{ teamId:'e1', compNumber:1, name:'PONTA', anglers:[] }], hours:[{ day:1, start:'09:00', end:'17:30' }],
  catches:[{ teamId:'e1', teamName:'PONTA', compNumber:1, day:1, time:'10:05', species:'Plavoperajna tuna', outcome:'released', points:240, gpsLat:42.6, gpsLon:18.1 },{ teamId:'e1', teamName:'PONTA', compNumber:1, day:2, time:'11:20', species:'Lampuga', outcome:'lost', points:0, gpsLat:42.55, gpsLon:18.2 }], feed:[], stats:{}, statsByDay:[] };
(async () => { const b = await chromium.launch(); const c = await b.newContext({ viewport:{ width:390, height:844 }, locale:'hr-HR', acceptDownloads:true }); const pg = await c.newPage(); const g = []; pg.on('pageerror', e => g.push(e.message)); const rez = []; const ok = (n, u, i='') => rez.push([u ? '✅' : '❌', n, u ? '' : i]);
  await pg.route('**/unpkg.com/**', r => r.request().url().endsWith('.js') ? r.fulfill({ status:200, contentType:'application/javascript', body:"window.__lf=[];function o(t,a,x){var q={t:t,a:a,x:x,addTo:function(){window.__lf.push(q);return q},bindTooltip:function(){return q},bindPopup:function(){return q},openPopup:function(){window.__otv=q},getLatLng:function(){return {lat:a[0],lng:a[1]}}};return q}window.L={map:function(){var m={setView:function(c,z){window.__view=[c,z];return m},fitBounds:function(b){window.__fit=b;return m},on:function(){return m},invalidateSize:function(){},getZoom:function(){return 9},getCenter:function(){return {lat:0,lng:0}}};return m},tileLayer:function(u){return {addTo:function(){window.__lf.push({t:'tile',u:u})}}},control:{layers:function(){return {addTo:function(){}}}},polygon:function(a,x){return o('polygon',a,x)},circle:function(a,x){return o('circle',a,x)},circleMarker:function(a,x){return o('marker',a,x)}};" }) : r.fulfill({ status:200, contentType:'text/css', body:'' })); await pg.route('**/arcgisonline.com/**', r => r.abort());
  await pg.route('**/bgf-live-backend.vercel.app/**', r => { const u = r.request().url(); const J = x => r.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(x) });
    if (u.includes('/api/public/tournaments')) return J(LIST); if (u.includes('/felun2026/leaderboard')) return J(LB); if (u.includes('/dplvr2026/leaderboard')) return J(Object.assign({}, LB, { tournament:Object.assign({}, LB.tournament, { rankingMode:'placement' }) })); return J({}, 401); });
  await pg.goto('http://localhost:8602/'); await pg.waitForTimeout(1500);
  const home = await pg.innerText('#app');
  ok('početna: SQUID GAME samo jednom (sljedeći, ne i u Uskoro)', (home.match(/SQUID GAME FELUN 2026/g) || []).length === 1, (home.match(/SQUID GAME FELUN 2026/g) || []).length + '×');
  await pg.evaluate(() => { S.v = 'turnir'; S.t = 'felun2026'; S.ttab = 'pregled'; crtaj(); }); await pg.waitForTimeout(1500);
  let tx = await pg.innerText('#app');
  ok('prijave: „zatvorene · turnir završen”', tx.includes('zatvorene · turnir završen'));
  ok('organizator dodirljiv (profil kluba)', !!(await pg.$('[data-jklub="ŠRK FELUN"]')));
  await pg.click('[data-pov="prop"]'); await pg.waitForTimeout(500); let l = await pg.innerText('.list');
  ok('propozicije: tuna po razredima bod/kg, lampuga 9 bod/kg, bez „cm cm” i „na brodu 0”', /40–99,99 kg 7 bod\/kg/.test(l) && /100\+ kg 8 bod\/kg/.test(l) && /na brodu 9 bod\/kg/.test(l) && !/cm cm/.test(l) && !/puštena 0/.test(l), l.slice(0, 400));
  await pg.mouse.click(195, 40); await pg.waitForTimeout(300);
  await pg.click('nav.dno [data-ttab="karta"]'); await pg.waitForTimeout(800); tx = await pg.innerText('#app');
  ok('karta: legenda s „Otpalo”, popis ulova (2), GPX gumb', tx.includes('Otpalo') && /ULOVI NA KARTI \(2\)/.test(tx) && !!(await pg.$('[data-gpx]')), tx.slice(0, 400));
  await pg.waitForTimeout(400);
  const lf = await pg.evaluate(() => ({ tiles:(window.__lf || []).filter(x => x.t === 'tile').map(x => x.u), poly:(window.__lf || []).filter(x => x.t === 'polygon').length, krug:(window.__lf || []).filter(x => x.t === 'circle').length, tocke:(window.__lf || []).filter(x => x.t === 'marker').map(x => x.x.fillColor) }));
  ok('karta (glumljeni Leaflet): reljef mora (Esri Ocean), zona, zabranjeni krug, 2 točke (plava puštena, crvena otpalo)', lf.tiles.some(u => /World_Ocean_Base/.test(u)) && lf.poly === 1 && lf.krug === 1 && lf.tocke.join() === '#2f8fe6,#ef4444', JSON.stringify(lf));
  await pg.click('[data-kfok="1"]'); await pg.waitForTimeout(200);
  ok('dodir ulova u popisu → karta na točki i otvoren opis', await pg.evaluate(() => !!window.__otv && window.__view && window.__view[0].lat === 42.55));
  const [dl] = await Promise.all([pg.waitForEvent('download', { timeout:4000 }).catch(() => null), pg.click('[data-gpx]')]);
  let gpxOk = false; if (dl) { const pth = await dl.path(); const t = fs.readFileSync(pth, 'utf8'); gpxOk = dl.suggestedFilename() === 'big-game-felun-2026.gpx' && (t.match(/<wpt /g) || []).length === 3 && /<trk><name>Ribolovna zona/.test(t); }
  ok('GPX turnira: 2 ulova + zabranjena zona + zona', gpxOk, dl ? dl.suggestedFilename() : 'nema preuzimanja');
  await pg.evaluate(() => { S.t = 'dplvr2026'; S.ttab = 'pregled'; LIST = { k:'bod', i:'dplvr2026' }; crtaj(); }); await pg.waitForTimeout(500); l = await pg.innerText('.list');
  ok('Državno: točno objašnjenje (1. = 1 PB, najmanji zbroj pobjeđuje), bez izmišljenog „Zaključano · Tonći”', l.includes('1 plasmanski bod') && l.includes('najmanji zbroj PB') && !l.includes('Tonći'), l.slice(0, 300));
  ok('bez JS grešaka', g.length === 0, g.join('|'));
  for (const r of rez) console.log(r[0], r[1], r[2] ? '\n   → ' + r[2].replace(/\n/g, ' ').slice(0, 400) : ''); console.log(rez.filter(r => r[0] === '✅').length + '/' + rez.length);
  await b.close(); srv.close(); })();
