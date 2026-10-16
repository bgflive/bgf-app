const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = path.join(ROOT, u === '/' ? 'index.html' : u); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' }); r.end(fs.readFileSync(f)); }).listen(8556);
const d = new Date(); const iso = x => x.getFullYear() + '-' + String(x.getMonth()+1).padStart(2,'0') + '-' + String(x.getDate()).padStart(2,'0');
const za5 = new Date(d); za5.setDate(d.getDate() + 5); const za6 = new Date(d); za6.setDate(d.getDate() + 6);
(async () => {
  const b = await chromium.launch(); const greske = []; const rez = []; const ok = (n, u, i='') => rez.push([u ? '✅' : '❌', n, u ? '' : i]);
  const c = await b.newContext({ viewport:{ width:390, height:844 }, locale:'hr-HR' }); const pg = await c.newPage(); pg.setDefaultTimeout(6000);
  pg.on('pageerror', e => greske.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::/.test(m.text())) greske.push(m.text()); });
  const TEAMS = [ { id:'e1', name:'CORTO', comp_number:1, entry_status:'confirmed', fee_amount:300, paid_amount:300, captain:'Gordon Svalina', contact_phone:'+385991112222', anglers:[{ name:'Gordon Svalina', license_valid:true, license_number:'D-1' }] },
    { id:'e2', name:'BONACA', comp_number:2, entry_status:'confirmed', fee_amount:300, paid_amount:0, anglers:[{ name:'Ante Barić', license_valid:false }] },
    { id:'e3', name:'TRITON', comp_number:null, entry_status:'pending', fee_amount:0, paid_amount:0, anglers:[{ name:'Frane Rokov', license_valid:true }] },
    { id:'e4', name:'ODUSTALI', entry_status:'withdrawn', fee_amount:300, paid_amount:0, anglers:[] } ];
  const st = { put:[] };
  await pg.route('**/bgf-live-backend.vercel.app/**', r => { const u = r.request().url(), m = r.request().method(); const J = (x, s=200) => r.fulfill({ status:s, contentType:'application/json', body:JSON.stringify(x) });
    if (u.includes('/api/public/tournaments')) return J({ live:[], upcoming:[], finished:[] });
    if (u.includes('/api/me/roles')) return J({ user:{ id:'O1', email:'tonci@felun.hr', name:'Tonći' }, person:null, roles:[{ role:'organizer', tournamentId:'T1', teamId:null }], tournaments:[{ id:'T1', name:'Big Game Felun 2027' }] });
    if (u.includes('/api/me/profil')) return J({ osoba:null });
    if (u.includes('/api/tournaments/T1') && m === 'PUT' && !u.includes('/teams')) { st.postavke = JSON.parse(r.request().postData()); return J({ tournament:{ id:'T1' } }); }
    if (u.includes('/api/tournaments/T1/state')) return J({ tournament:{ id:'T1', board_settings:{ kompaktno:true }, checkin_required:true, late_hook_enabled:true, late_hook_window_min:60, late_hook_extension_min:60, name:'Big Game Felun 2027', organizer:'ŠRK Felun', start_date:iso(za5), days:2, day_dates:[iso(za5), iso(za6)] }, teams:[], users:[] });
    if (u.includes('/api/tournaments/T1/teams') && m === 'PUT') { const b2 = JSON.parse(r.request().postData()); st.put.push(b2); return J({ ok:true }); }
    if (u.includes('/api/tournaments/T1/teams')) return J({ teams:TEAMS });
    if (u.includes('/api/tournaments/T1/liste/')) { st.lista = u.split('/liste/')[1]; return r.fulfill({ status:200, headers:{ 'Content-Type':'text/csv', 'Content-Disposition':'attachment; filename="kup-ekipe.csv"' }, body:'\uFEFFBr.;Ekipa\r\n1;CORTO\r\n' }); }
    if (u.includes('/api/tournaments/T1/days/1/pomakni')) { st.pomak = JSON.parse(r.request().postData()); return J({ ok:true, poruka:'🗓 Dan 1 pomaknut' }); }
    if (u.includes('/api/tournaments/T1/draw')) { const b2 = JSON.parse(r.request().postData() || '{}'); st.draw = (st.draw || []).concat([b2]);
      if (!b2.allowUnpaid) return J({ needsConfirm:true, unpaidCount:1, unpaidNames:['BONACA'], totalCount:3, pendingNames:[] });
      TEAMS[0].comp_number = 2; TEAMS[1].comp_number = 1; return J({ result:[{ id:'e2', comp_number:1 },{ id:'e1', comp_number:2 }], includedUnpaid:1, pendingNames:['NEKA'] }); }
    if (u.includes('/api/tournaments/T1/srdele')) { const dan = new URL(u).searchParams.get('day'); st.srdDan = dan; return J({ ekipe:[{ teamId:'e1', name:'CORTO', compNumber:1, paketa:dan === '2' ? 3 : 2 },{ teamId:'e2', name:'BONACA', compNumber:2, paketa:0 },{ teamId:'e3', name:'TRITON', compNumber:null, paketa:1 }] }); }
    return J({}); });
  await pg.addInitScript(() => { localStorage.setItem('bgf-pravo', JSON.stringify({ access:'tokO', refresh:'refO', istek:Date.now() + 3600000, red:[], veze:{} })); });
  await pg.goto('http://localhost:8556/'); await pg.waitForTimeout(1800);
  const app = async () => (await pg.innerText('#app')) || '';
  ok('organizator bez osobe: nema poruke „nisi upisan ni u jednu ekipu”', !(await pg.innerText('body')).includes('nisi upisan ni u jednu ekipu'));
  await pg.click('nav.dno [data-v="profil"]'); await pg.waitForTimeout(500); let tx = await app();
  ok('Moj profil: MOJE ULOGE → Big Game Felun 2027 · Organizator', tx.includes('MOJE ULOGE') && tx.includes('Big Game Felun 2027') && tx.includes('Organizator'), tx.slice(0, 500));
  await pg.click('[data-orgotvori="T1"]'); await pg.waitForTimeout(700); tx = await app();
  ok('Pregled: 3 ekipe (bez odustalih), 1 čeka, 1 neplaćeno, 1 dozvola; počinje za 5 dana; pravi organizator', /3\s*\n?\s*prijavljenih ekipa/.test(tx) && tx.includes('BONACA · Neplaćeno 300 €') && tx.includes('dozvola nije važeća') && tx.includes('TRITON · čeka potvrdu') && tx.includes('počinje za 5 dana') && tx.includes('ŠRK FELUN') && !tx.includes('ODUSTALI'), tx.slice(0, 900));
  ok('srdele za prvi dan (prije turnira = dan 1): 3 paketa', st.srdDan === '1' && tx.includes('3 ukupno paketa'), st.srdDan + ' ' + tx.slice(-300));
  ok('donji izbornik: Pregled, Prijave, Ekipe, Srdele, Više (bez izmišljenih kartica)', (await pg.$$('nav.dno [data-ultab]')).length === 5);
  await pg.screenshot({ path:path.join(__dirname, 'slike', '556-pregled.png'), fullPage:true });
  await pg.click('nav.dno [data-ultab="ekipe"]'); await pg.waitForTimeout(300);
  await pg.click('[data-orgek="e2"]'); await pg.waitForTimeout(200); tx = await app();
  ok('Ekipe: BONACA otvorena — ribolovac s ⚠, gumb „Označi plaćeno · 300 €”', tx.includes('Ante Barić') && tx.includes('Označi plaćeno · 300 €'), tx.slice(0, 600));
  await pg.click('[data-orgplati="e2"]'); await pg.waitForTimeout(400); tx = await app();
  ok('uplata: PUT paidAmount 300 → BONACA Plaćeno', st.put[0]?.id === 'e2' && st.put[0].paidAmount === 300 && /BONACA[\s\S]*Plaćeno/.test(tx) && tx.includes('Poništi uplatu'), JSON.stringify(st.put));
  await pg.screenshot({ path:path.join(__dirname, 'slike', '556-ekipe.png'), fullPage:true });
  await pg.click('nav.dno [data-ultab="srdele"]'); await pg.waitForTimeout(300); await pg.click('[data-orgsrd="2"]'); await pg.waitForTimeout(500); tx = await app();
  ok('Srdele dan 2: 4 paketa, BONACA nije naručila, kopiranje', st.srdDan === '2' && /4\s*\n?\s*ukupno paketa/.test(tx) && tx.includes('nije naručila') && tx.includes('Kopiraj popis'), tx.slice(0, 500));
  await pg.click('nav.dno [data-ultab="liste"]'); await pg.waitForTimeout(200); tx = await app();
  ok('Više: poveznica na web admin', tx.includes('Otvori web admin') && !!(await pg.$('a[href="https://admin.bgf.live"]')));
  pg.on('dialog', dl => dl.accept());
  await pg.click('nav.dno [data-ultab="prijave"]'); await pg.waitForTimeout(300); tx = await app();
  ok('Prijave: TRITON čeka (Potvrdi/Odbij), ODUSTALI među odbijenima i odustalima', tx.includes('ČEKA POTVRDU (1)') && tx.includes('TRITON') && tx.includes('ODBIJENE I ODUSTALE (1)') && tx.includes('ODUSTALI'), tx.slice(0, 600));
  await pg.click('[data-orgstanje="e3:confirmed"]'); await pg.waitForTimeout(400); tx = await app();
  ok('Potvrdi → PUT entryStatus confirmed, TRITON među potvrđenima', st.put.some(p => p.id === 'e3' && p.entryStatus === 'confirmed') && tx.includes('ČEKA POTVRDU (0)') && tx.includes('POTVRĐENE (3)'), JSON.stringify(st.put) + tx.slice(0, 300));
  await pg.click('nav.dno [data-ultab="ekipe"]'); await pg.waitForTimeout(300);
  await pg.click('[data-orgzdrijeb]'); await pg.waitForTimeout(800); tx = await app();
  ok('Ždrijeb: pita za neplaćene, pa provodi s allowUnpaid; javlja prijavu na čekanju', (st.draw || []).length === 2 && st.draw[1].allowUnpaid === true && tx.includes('Ždrijeb proveden') && tx.includes('čeka potvrdu i nije u ždrijebu'), JSON.stringify(st.draw) + tx.slice(0, 400));
  await pg.click('nav.dno [data-ultab="pregled"]'); await pg.waitForTimeout(300);
  ok('590: Pregled → DANI s gumbom Pomakni', (await app()).includes('DANI') && !!(await pg.$('[data-orgpomak="1"]')));
  const odg = ['2099-01-01', 'bura'];
  pg.removeAllListeners('dialog'); pg.on('dialog', dl => { if (dl.type() === 'prompt') dl.accept(odg.shift()); else dl.accept(); });
  await pg.click('[data-orgpomak="1"]'); await pg.waitForTimeout(600);
  ok('590: pomak šalje datum, razlog i „ostali”', st.pomak && st.pomak.datum === '2099-01-01' && st.pomak.razlog === 'bura' && st.pomak.ostali === true, JSON.stringify(st.pomak));
  await pg.click('nav.dno [data-ultab="liste"]'); await pg.waitForTimeout(300);
  await pg.click('[data-orgposttip="odgoda"]'); await pg.fill('[data-orgpost="obavijest"]', 'Dan 2 odgođen zbog bure'); await pg.click('[data-orgpostk="ovjera"]'); await pg.fill('[data-orgpost="prozor"]', '30');
  await pg.click('[data-orgpostspremi]'); await pg.waitForTimeout(500);
  ok('591: Više → obavijest (odgoda), ovjera isključena, prozor 30; izgled boarda sačuvan', st.postavke && st.postavke.boardSettings.obavijestTip === 'odgoda' && /bure/.test(st.postavke.boardSettings.obavijest) && st.postavke.boardSettings.kompaktno === true && st.postavke.checkinRequired === false && st.postavke.lateHookWindowMin === 30 && (await app()).includes('Spremljeno'), JSON.stringify(st.postavke));
  await pg.click('nav.dno [data-ultab="liste"]'); await pg.waitForTimeout(300);
  const [dl] = await Promise.all([pg.waitForEvent('download', { timeout:5000 }).catch(() => null), pg.click('[data-orglista="ekipe"]')]);
  ok('592: Više → Liste za Excel: preuzimanje CSV-a', st.lista === 'ekipe' && dl && /big-game-felun-2027-ekipe\.csv|kup-ekipe\.csv/.test(dl.suggestedFilename()), JSON.stringify([st.lista, dl && dl.suggestedFilename()]));
  await pg.evaluate(() => { S.jezik = 'en'; UL.org = 'pregled'; crtaj(); }); await pg.waitForTimeout(200); tx = await app();
  ok('EN: teams entered / unpaid / TO DO', tx.includes('teams entered') && tx.includes('TO DO') && tx.includes('starts in 5 days'), tx.slice(0, 500));
  ok('bez JS grešaka', greske.length === 0, greske.join(' | ').slice(0, 400));
  for (const r of rez) console.log(r[0], r[1], r[2] ? '\n   → ' + r[2].replace(/\n/g, ' ').slice(0, 600) : '');
  console.log(rez.filter(r => r[0] === '✅').length + '/' + rez.length);
  await b.close(); srv.close();
})();
