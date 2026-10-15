/* 568 · pokreće sve Playwright testove aplikacije; pada ako ijedan nije „N/N” */
const { spawnSync } = require('child_process'), fs = require('fs'), path = require('path');
fs.mkdirSync(path.join(__dirname, 'slike'), { recursive: true });
let pao = 0;
for (const f of fs.readdirSync(__dirname).filter((x) => /^t\d+\.js$/.test(x)).sort()) {
  const r = spawnSync(process.execPath, [path.join(__dirname, f)], { encoding: 'utf8', timeout: 240000 });
  const out = (r.stdout || '') + (r.stderr || ''); const zadnji = out.trim().split('\n').pop() || '';
  const m = zadnji.match(/^(\d+)\/(\d+)$/); const ok = m && m[1] === m[2];
  console.log((ok ? '✅' : '❌') + ' ' + f + ' ' + zadnji);
  if (!ok) { pao++; console.log(out.split('\n').filter((l) => l.includes('❌') || l.includes('→') || l.includes('Error')).slice(0, 12).join('\n')); }
}
console.log(pao ? `\n${pao} datoteka s greškama` : '\nSvi testovi aplikacije prošli.');
process.exit(pao ? 1 : 0);
