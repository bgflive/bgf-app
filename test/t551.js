const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = path.join(ROOT, u === '/' ? 'index.html' : u); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' }); r.end(fs.readFileSync(f)); }).listen(8551);
(async () => {
  const b = await chromium.launch(); const greske = []; const rez = []; const ok = (n, u, i='') => rez.push([u ? '✅' : '❌', n, u ? '' : i]);
  const c = await b.newContext({ viewport:{ width:390, height:844 }, locale:'hr-HR' });
  const pg = await c.newPage(); pg.setDefaultTimeout(6000);
  pg.on('pageerror', e => greske.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::/.test(m.text())) greske.push(m.text()); });
  const S = { profil:null, poslano:[], tijela:{} };
  await pg.route('**/bgf-live-backend.vercel.app/**', async r => { const u = r.request().url(), m = r.request().method(); const body = r.request().postData();
    const J = (x, st = 200) => r.fulfill({ status:st, contentType:'application/json', body:JSON.stringify(x) });
    if (u.includes('/api/public/tournaments')) return J({ live:[], upcoming:[], finished:[] });
    if (u.endsWith('/api/auth/kod') && m === 'POST') { S.poslano.push(JSON.parse(body).email); return J({ ok:true }); }
    if (u.includes('/api/auth/kod/provjeri')) { const b2 = JSON.parse(body); if (b2.kod !== '123456') return J({ error:'Kod nije ispravan ili je istekao.' }, 401);
      return J({ user:{ id:'U1', email:b2.email }, access_token:'tok', refresh_token:'ref', expires_in:3600, imaOsobu:!!S.profil, bgf:S.profil ? 10050 : null }); }
    if (u.includes('/api/me/roles')) return J({ user:{ name:'' }, person:S.profil ? { first_name:'Josip', last_name:'Jurić', bgf:'BGF-10051' } : null, roles:[], tournaments:[], teams:[] });
    if (u.includes('/api/me/kandidati')) return J({ kandidati:[{ bgf:10050, ime:'Josip Jurić', nastupa:3, zadnji:{ godina:2019, turnir:'Kup Feluna 2019' } }] });
    if (u.includes('/api/public/klubovi')) return J({ klubovi:[{ id:'cl1', naziv:'ŠRK Felun', mjesto:'Mlini' },{ id:'cl2', naziv:'ŠRD Galeb', mjesto:'Silba' }] });
    if (u.includes('/api/me/prijave')) return J({ prijave:[] });
    if (u.includes('/api/me/racun') && m === 'DELETE') { S.obrisano = JSON.parse(body); return J({ ok:true }); }
    if (u.includes('/api/me/profil')) {
      if (m === 'POST') { const b2 = JSON.parse(body); S.tijela.post = b2;
        S.profil = { osoba:{ bgf:10051, ime:b2.ime, prezime:b2.prezime, nadimak:b2.nadimak || null, datumRodjenja:b2.datumRodjenja || null, mjesto:b2.mjesto || null, drzava:b2.drzava, jezik:'hr', privola:{ verzija:b2.privola } },
          klub:b2.klub ? { sezona:2026, id:b2.klub.id || null, naziv:b2.klub.id === 'cl2' ? 'ŠRD Galeb' : (b2.klub.ostalo || 'ŠRK Felun') } : null,
          dozvole:b2.dozvola ? [{ id:'d1', kind:b2.dozvola.vrsta, number:b2.dozvola.broj, valid_from:b2.dozvola.od, valid_to:b2.dozvola.do }] : [], vazeca:b2.dozvola ? { kind:b2.dozvola.vrsta, number:b2.dozvola.broj, valid_from:b2.dozvola.od, valid_to:b2.dozvola.do } : null,
          zahtjevi:b2.preuzmi ? [{ id:'z1', bgf:b2.preuzmi, ime:'Josip Jurić', stanje:'ceka' }] : [] };
        return J(S.profil, 201); }
      if (m === 'PATCH') { const b2 = JSON.parse(body); S.tijela.patch = b2;
        if (b2.nadimak !== undefined) Object.assign(S.profil.osoba, { nadimak:b2.nadimak, mjesto:b2.mjesto, drzava:b2.drzava, datumRodjenja:b2.datumRodjenja || null });
        if (b2.dozvola) S.profil.dozvole.push({ id:'d2', kind:b2.dozvola.vrsta, number:b2.dozvola.broj, valid_from:b2.dozvola.od, valid_to:b2.dozvola.do });
        if (b2.dozvolaObrisi) S.profil.dozvole = S.profil.dozvole.filter(x => x.id !== b2.dozvolaObrisi);
        return J(S.profil); }
      return J(S.profil || { osoba:null }); }
    return J({}, 401); });
  await pg.goto('http://localhost:8551/'); await pg.waitForTimeout(1500);
  const app = async () => (await pg.innerText('#app')) || '';
  await pg.click('nav.dno [data-v="profil"]'); await pg.waitForTimeout(200);
  await pg.click('[data-reg]'); await pg.waitForTimeout(200); let tx = await app();
  ok('registracija korak 1: e-pošta, bez lozinke i bez izmišljenih podataka', tx.includes('kod od 6 znamenki') && !tx.includes('ivan.kovac@primjer.hr') && !tx.includes('Ponovi lozinku') && !(await pg.$('#app input[type=password]')), tx.slice(0, 300));
  await pg.fill('[data-r="email"]', 'Josip.Juric@Gmail.com'); await pg.click('[data-rdalje]'); await pg.waitForTimeout(400); tx = await app();
  ok('kod poslan (mala slova), korak Kod', S.poslano[0] === 'josip.juric@gmail.com' && tx.includes('Kod je poslan na') && tx.includes('josip.juric@gmail.com'), tx.slice(0, 300));
  await pg.fill('[data-r="kod"]', '111111'); await pg.click('[data-rdalje]'); await pg.waitForTimeout(400); tx = await app();
  ok('kriv kod → poruka', tx.includes('Kod nije ispravan'), tx.slice(0, 400));
  await pg.fill('[data-r="kod"]', '123456'); await pg.click('[data-rdalje]'); await pg.waitForTimeout(700); tx = await app();
  ok('dobar kod → Podaci (bez poruke „nisi upisan ni u jednu ekipu”)', tx.includes('Prihvaćam uvjete') && !(await pg.innerText('body')).includes('nisi upisan ni u jednu ekipu'), tx.slice(0, 300));
  await pg.fill('[data-r="ime"]', 'Josip'); await pg.fill('[data-r="prezime"]', 'Jurić'); await pg.fill('[data-r="mjesto"]', 'Cavtat'); await pg.fill('[data-r="datumRodjenja"]', '1971-05-05');
  await pg.click('[data-rdalje]'); await pg.waitForTimeout(300); tx = await app();
  ok('bez privole ne ide dalje', tx.includes('treba prihvatiti uvjete'), tx.slice(-300));
  await pg.check('[data-r="privola"]'); await pg.click('[data-rdalje]'); await pg.waitForTimeout(400); tx = await app();
  ok('Jesi li ovo ti?: kandidat iz arhive s nastupima', tx.includes('Josip Jurić · BGF-10050') && tx.includes('Kup Feluna 2019') && tx.includes('Ništa od ovoga'), tx.slice(0, 500));
  await pg.check('[data-rkand="10050"]'); await pg.click('[data-rdalje]'); await pg.waitForTimeout(400); tx = await app();
  ok('Klub: popis iz registra', (await pg.$$('select[data-r="klubId"] option')).length === 3, tx.slice(0, 300));
  await pg.selectOption('select[data-r="klubId"]', 'cl2'); await pg.click('[data-rdalje]'); await pg.waitForTimeout(300); tx = await app();
  ok('Dozvola: godišnja s datumima tekuće godine', tx.includes('Godišnja') && (await pg.inputValue('[data-r="dzOd"]')).endsWith('-01-01') && (await pg.inputValue('[data-r="dzDo"]')).endsWith('-12-31'), tx.slice(0, 300));
  await pg.fill('[data-r="dzBroj"]', 'D-551'); await pg.click('[data-rdalje]'); await pg.waitForTimeout(500); tx = await app();
  const pb = S.tijela.post || {};
  ok('Završi: šalje sve (privola, preuzmi, klub, dozvola) → TVOJ BROJ BGF-10051 + zahtjev čeka', pb.privola === '2026-10' && pb.preuzmi === 10050 && pb.klub?.id === 'cl2' && pb.dozvola?.broj === 'D-551' && pb.mjesto === 'Cavtat' && tx.includes('BGF-10051') && tx.includes('čeka potvrdu') && tx.includes('BGF-10050'), JSON.stringify(pb) + ' | ' + tx.slice(0, 300));
  await pg.screenshot({ path:path.join(__dirname, 'slike', '551-gotovo.png') });
  await pg.click('[data-rprofil]'); await pg.waitForTimeout(400); tx = await app();
  ok('Moj profil: BGF, klub, važeća dozvola, zahtjev, javni profil, odjava', tx.includes('BGF-10051 · ŠRD Galeb') && tx.includes('važeća do') && tx.includes('čeka potvrdu Mastera') && tx.includes('D-551') && tx.includes('Javni profil') && tx.includes('Odjava'), tx.slice(0, 700));
  await pg.screenshot({ path:path.join(__dirname, 'slike', '551-profil.png'), fullPage:true });
  await pg.click('[data-ruredi="1"]'); await pg.waitForTimeout(200); await pg.fill('[data-r="pNadimak"]', 'Jole'); await pg.click('[data-rspremi]'); await pg.waitForTimeout(400); tx = await app();
  ok('uredi podatke (nadimak) → PATCH bez imena', S.tijela.patch?.nadimak === 'Jole' && !('ime' in S.tijela.patch) && tx.includes('Jole'), JSON.stringify(S.tijela.patch));
  await pg.click('[data-rnovadz="1"]'); await pg.waitForTimeout(200); await pg.click('[data-rvrsta="7day"]'); await pg.fill('[data-r="dzBroj"]', 'D-7'); await pg.click('[data-rdzspremi]'); await pg.waitForTimeout(400); tx = await app();
  ok('dodaj 7-dnevnu dozvolu', S.tijela.patch?.dozvola?.vrsta === '7day' && tx.includes('D-7') && tx.includes('7-dnevna'), JSON.stringify(S.tijela.patch));
  await pg.evaluate(() => { S.jezik = 'en'; crtaj(); }); await pg.waitForTimeout(200); tx = await app();
  ok('EN profil: My profile / LICENCES / awaiting Master / Sign out', tx.includes('LICENCES') && tx.includes('awaiting Master confirmation') && tx.includes('Sign out'), tx.slice(0, 500));
  await pg.evaluate(() => { S.jezik = 'hr'; crtaj(); });
  await pg.click('[data-rodjava]'); await pg.waitForTimeout(300);
  ok('odjava → početna, profil gostujući', await pg.evaluate(() => S.v === 'pocetna' && !PRAVO.imaSesiju()));
  // ponovna prijava kodom (postoji profil)
  await pg.click('nav.dno [data-v="profil"]'); await pg.waitForTimeout(200); await pg.click('[data-prijava]'); await pg.waitForTimeout(300);
  ok('prijava lozinkom ima „Pošalji mi kod na e-poštu”', await pg.isVisible('#ppKod'));
  await pg.fill('#ppEmail', 'josip.juric@gmail.com'); await pg.click('#ppKod'); await pg.waitForTimeout(200);
  await pg.click('[data-rdalje]'); await pg.waitForTimeout(300); await pg.fill('[data-r="kod"]', '123456'); await pg.click('[data-rdalje]'); await pg.waitForTimeout(800); tx = await app();
  ok('prijava kodom s postojećim profilom → ravno u Moj profil', await pg.evaluate(() => S.v === 'profil') && tx.includes('BGF-10051'), tx.slice(0, 300));
  await pg.click('[data-robrisi="1"]'); await pg.waitForTimeout(200); tx = await app();
  ok('Obriši račun: objašnjenje (što ostaje) i polje za potvrdu', tx.includes('ostaju u javnim rezultatima') && !!(await pg.$('[data-r="brisiPotvrda"]')), tx.slice(-500));
  await pg.fill('[data-r="brisiPotvrda"]', 'da'); await pg.click('[data-rbrisida]'); await pg.waitForTimeout(200);
  ok('kriva potvrda → ne briše', !S.obrisano && (await app()).includes('Za potvrdu upiši OBRIŠI'));
  await pg.fill('[data-r="brisiPotvrda"]', 'obriši'); await pg.click('[data-rbrisida]'); await pg.waitForTimeout(500); tx = await app();
  ok('OBRIŠI → DELETE /api/me/racun, odjava, poruka „Račun je obrisan.”', S.obrisano?.potvrda === 'OBRIŠI' && tx.includes('Račun je obrisan.') && await pg.evaluate(() => !PRAVO.imaSesiju()), tx.slice(0, 300));
  await pg.evaluate(() => { S.v = 'profil'; crtaj(); }); await pg.waitForTimeout(300);
  ok('574: tema u profilu, klik mijenja i pamti', !!(await pg.$('[data-tema]')) && await pg.evaluate(async () => { document.querySelector('[data-tema]').click(); await new Promise(r => setTimeout(r, 200)); return localStorage.getItem('bgf-tema') === 'svijetla'; }));
  ok('574: lijevak u traci vodi na Turniri', !!(await pg.$('button.filtar[data-v="turniri"]')));
  ok('bez JS grešaka', greske.length === 0, greske.join(' | ').slice(0, 400));
  for (const r of rez) console.log(r[0], r[1], r[2] ? '\n   → ' + r[2].replace(/\n/g, ' ').slice(0, 500) : '');
  console.log(rez.filter(r => r[0] === '✅').length + '/' + rez.length);
  await b.close(); srv.close();
})();
