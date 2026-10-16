const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = path.join(ROOT, u === '/' ? 'index.html' : u); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' }); r.end(fs.readFileSync(f)); }).listen(8559);
const d = new Date(), danas = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
(async () => {
  const b = await chromium.launch(); const greske = []; const rez = []; const ok = (n, u, i='') => rez.push([u ? '✅' : '❌', n, u ? '' : i]);
  const c = await b.newContext({ viewport:{ width:390, height:844 }, locale:'hr-HR' }); const pg = await c.newPage(); pg.setDefaultTimeout(6000);
  pg.on('pageerror', e => greske.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::/.test(m.text())) greske.push(m.text()); });
  const st = { poz:[], uredaj:[] };
  await pg.route('**/bgf-live-backend.vercel.app/**', r => { const u = r.request().url(), m = r.request().method(); const J = (x, s=200) => r.fulfill({ status:s, contentType:'application/json', body:JSON.stringify(x) });
    if (u.includes('/api/public/tournaments')) return J({ live:[], upcoming:[], finished:[] });
    if (u.includes('/api/ekipa/kod')) return J({ nacin:'ekipa', access_token:'tokE', refresh_token:'refE', expires_in:3600, tournamentId:'T1', teamId:'e0', ekipa:{ id:'e0', naziv:'TRITON', broj:1, turnir:'Kup' } });
    if (u.includes('/api/me/roles')) return J({ user:{ id:'UE', email:'ekipa-e0@ekipe.bgf.live', name:'Ekipa TRITON' }, person:null, roles:[{ role:'team', tournamentId:'T1', teamId:'e0' }], tournaments:[{ id:'T1', name:'Kup', subdomain:'kup', day_dates:[danas] }], teams:[{ id:'e0', name:'TRITON' }] });
    if (u.includes('/api/tournaments/T1/state')) return J({ tournament:{ id:'T1', name:'Kup', subdomain:'kup', start_date:danas, days:1, day_dates:[danas], forbidden_zones:[{ naziv:'Luka Mlini', lat:42.62, lon:18.15, radius_m:300 }] }, fishingHours:[{ day_number:1, start_time:'00:00:00', end_time:'23:59:00' }], dayLocks:[], teams:[{ id:'e0', name:'TRITON', comp_number:1, anglers:[{ id:'a0', name:'Frane Rokov' }] }], ruleSpecies:[{ id:'s1', name:'Plavoperajna tuna', can_release:true }], ruleNotes:{}, users:[], verifications:[], incidents:[], sponsors:[] });
    if (u.includes('/api/tournaments/T1/positions') && m === 'POST') { st.poz.push(JSON.parse(r.request().postData())); return J({ ok:true }); }
    if (u.includes('/api/me/uredaj')) { st.uredaj.push(JSON.parse(r.request().postData())); return J({ ok:true }); }
    return J({}); });
  /* Capacitor ljuska — oponašanje */
  await pg.addInitScript(() => { navigator.getBattery = () => Promise.resolve({ level: 0.42, addEventListener(){} }); });
  await pg.addInitScript(() => {
    window.__cap = { watchers:[], removed:[], listeners:{} };
    window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'android', Plugins: {
      BackgroundGeolocation: { addWatcher: (opt, cb) => { window.__cap.watchers.push({ opt, cb }); return Promise.resolve('w' + window.__cap.watchers.length); }, removeWatcher: ({ id }) => { window.__cap.removed.push(id); return Promise.resolve(); }, openSettings: () => Promise.resolve() },
      PushNotifications: { requestPermissions: () => Promise.resolve({ receive:'granted' }), register: () => { setTimeout(() => (window.__cap.listeners.registration || []).forEach(f => f({ value:'fcm-' + 'y'.repeat(40) })), 50); return Promise.resolve(); }, addListener: (n, f) => { (window.__cap.listeners[n] = window.__cap.listeners[n] || []).push(f); return Promise.resolve(); } },
      App: { addListener: (n, f) => { (window.__cap.listeners[n] = window.__cap.listeners[n] || []).push(f); }, exitApp: () => { window.__cap.izlaz = true; } } } };
  });
  await pg.goto('http://localhost:8559/'); await pg.waitForTimeout(1500);
  ok('APK: ljuska prepoznata (html.apk), web dio radi', await pg.evaluate(() => document.documentElement.classList.contains('apk') && !!window.NATIVE));
  await pg.evaluate(() => { LIST = { k:'tm-kod' }; crtaj(); }); await pg.waitForTimeout(200); await pg.fill('[data-ekod]', 'ABCDEF'); await pg.click('[data-ekodda]'); await pg.waitForTimeout(1500);
  ok('ulaz kodom → turnirski način (ekipa na moru)', await pg.evaluate(() => S.v === 'tm' && PRAVO.on));
  await pg.waitForTimeout(16000);
  const w = await pg.evaluate(() => window.__cap.watchers.map(x => x.opt));
  ok('pozadinski GPS pokrenut s nazivom ekipe u obavijesti', w.length === 1 && /TRITON/.test(w[0].backgroundTitle) && w[0].requestPermissions === true, JSON.stringify(w));
  await pg.evaluate(() => window.__cap.watchers[0].cb({ latitude:42.62, longitude:18.15, accuracy:8, speed:4.1, bearing:180 }, null));
  await pg.waitForTimeout(500);
  ok('pozicija iz pozadine → zadnja pozicija u aplikaciji i poslana sucu s baterijom 42 %', await pg.evaluate(() => PRAVO.zadnjaPoz && Math.abs(PRAVO.zadnjaPoz.lat - 42.62) < 1e-6) && st.poz.length === 1 && st.poz[0].positions[0].lat === 42.62 && st.poz[0].positions[0].batteryPct === 42, JSON.stringify([st.poz, await pg.evaluate(() => PRAVO.zadnjaPoz)]));
  const tostT = await pg.evaluate(() => document.body.innerText);
  ok('594: brod u zabranjenoj zoni → upozorenje „Zabranjena zona: Luka Mlini”', /Zabranjena zona: Luka Mlini/.test(tostT), tostT.slice(-300));
  await pg.waitForTimeout(6000);
  ok('uređaj prijavljen za obavijesti (FCM token → /api/me/uredaj)', st.uredaj.length >= 1 && st.uredaj[0].platform === 'android' && st.uredaj[0].token.startsWith('fcm-'), JSON.stringify(st.uredaj));
  await pg.evaluate(() => (window.__cap.listeners.pushNotificationReceived || []).forEach(f => f({ title:'Sudac', body:'Ulov priznat' }))); await pg.waitForTimeout(200);
  ok('primljena obavijest prikazana u aplikaciji', (await pg.innerText('#apkObavijest')).includes('Ulov priznat'));
  await pg.evaluate(() => { S.v = 'pretraga'; crtaj(); (window.__cap.listeners.backButton || []).forEach(f => f()); }); await pg.waitForTimeout(200);
  ok('gumb natrag: pretraga → početna; na početnoj izlaz iz aplikacije', await pg.evaluate(() => S.v === 'pocetna') && await pg.evaluate(() => { S.v = 'pocetna'; (window.__cap.listeners.backButton || []).forEach(f => f()); return window.__cap.izlaz === true; }));
  ok('bez JS grešaka', greske.length === 0, greske.join(' | ').slice(0, 400));
  for (const r of rez) console.log(r[0], r[1], r[2] ? '\n   → ' + r[2].replace(/\n/g, ' ').slice(0, 500) : '');
  console.log(rez.filter(r => r[0] === '✅').length + '/' + rez.length);
  await b.close(); srv.close();
})();
