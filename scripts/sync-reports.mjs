// Sync Merritt Market Reports from the OneDrive folder into the hub site.
//
// - Each SUBFOLDER of the source folder becomes a COLUMN (region) on the reports page.
// - Any loose .html files at the top level go under a "General" column.
// - Report cards are generated from filenames like "Name M-YYYY.html" (e.g. "Columbia Office 6-2026.html").
// - Copies the HTML into repo/reports/<region>/, regenerates reports/index.html, then commits + pushes.
//
// Run:  node scripts/sync-reports.mjs           (copies, commits, and pushes -> Netlify redeploys)
//       node scripts/sync-reports.mjs --no-push (copies + commits only; used for setup)

import { readdirSync, statSync, mkdirSync, rmSync, copyFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { execSync } from 'node:child_process';

const SRC = 'C:/Users/dmyers/OneDrive - MERRITT COMPANIES/01 Market Research Docs/Claude Work/Market Reports Merritt vs Market';
const REPO = 'C:/Users/dmyers/repos/merritt-hub';
const OUT = join(REPO, 'reports');
const NO_PUSH = process.argv.includes('--no-push');

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

function listHtml(dir) {
  try { return readdirSync(dir).filter(f => extname(f).toLowerCase() === '.html'); } catch { return []; }
}
function listDirs(dir) {
  try { return readdirSync(dir).filter(f => { try { return statSync(join(dir, f)).isDirectory(); } catch { return false; } }); } catch { return []; }
}
function parseReport(file) {
  const base = file.replace(/\.html$/i, '');
  const m = base.match(/^(.*?)\s+(\d{1,2})-(\d{4})$/);
  if (m) {
    const mo = parseInt(m[2], 10), yr = parseInt(m[3], 10);
    return { title: m[1].trim(), date: `${MONTHS[mo-1] || 'Month '+mo} ${yr}`, sort: yr * 100 + mo };
  }
  return { title: base, date: '', sort: 0 };
}

// ---- Gather columns ----
const columns = [];
const topHtml = listHtml(SRC);
if (topHtml.length) {
  columns.push({ name: 'General', slug: 'general', reports: topHtml.map(f => ({ ...parseReport(f), file: f, src: join(SRC, f) })) });
}
for (const d of listDirs(SRC).sort()) {
  const html = listHtml(join(SRC, d));
  if (html.length) {
    columns.push({ name: d, slug: slug(d), reports: html.map(f => ({ ...parseReport(f), file: f, src: join(SRC, d, f) })) });
  }
}
// newest report first within each column
for (const col of columns) col.reports.sort((a, b) => b.sort - a.sort || a.title.localeCompare(b.title));

const total = columns.reduce((n, c) => n + c.reports.length, 0);

// ---- Rebuild repo/reports/ ----
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const col of columns) {
  const dir = join(OUT, col.slug);
  mkdirSync(dir, { recursive: true });
  for (const r of col.reports) {
    copyFileSync(r.src, join(dir, r.file));
    r.href = `${col.slug}/${encodeURIComponent(r.file)}`;
  }
}

// ---- Generate index.html ----
const colsHtml = columns.map(col => `
        <div class="rcol">
          <p class="rcol-head">${esc(col.name)}</p>` +
          col.reports.map(r => `
          <a class="file" href="${r.href}">
            <span class="ic">RPT</span>
            <span class="body"><span class="name">${esc(r.title)}</span><p class="meta">Merritt vs. Market${r.date ? ' &nbsp;&bull;&nbsp; ' + esc(r.date) : ''}</p></span>
            <span class="go">&rarr;</span>
          </a>`).join('') + `
        </div>`).join('');

const emptyMsg = total ? '' : `<p class="lead">No reports yet. Add HTML files (in region subfolders) to the source folder and run the sync.</p>`;

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Merritt Market Reports</title>
<style>
  :root { --navy:#002f6c; --green:#64a70b; --slate:#4d5858; --cool-gray:#d9d8d6; --cream:#faf9f6; --card:#fff; --ink:#1c2124; --radius:3px;
    --shadow:0 1px 3px rgba(0,0,0,.10),0 6px 18px rgba(0,47,108,.06);
    --sans:"Avenir Next LT Pro","Avenir Next",Helvetica,Arial,sans-serif; --head:"Tungsten","Avenir Next LT Pro",Helvetica,Arial,sans-serif; }
  * { box-sizing:border-box; } html,body { margin:0; padding:0; }
  body { font-family:var(--sans); color:var(--ink); background:var(--cream); -webkit-font-smoothing:antialiased; line-height:1.5; }
  header { background:var(--navy); color:#fff; padding:34px 24px 30px; border-bottom:4px solid var(--green); }
  .header-inner { max-width:1280px; margin:0 auto; }
  .back { display:inline-flex; align-items:center; gap:7px; font-size:12px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:#cdd6e4; text-decoration:none; margin-bottom:14px; }
  .back:hover { color:var(--green); }
  .brand-rider { font-size:12px; letter-spacing:.22em; text-transform:uppercase; color:var(--green); font-weight:600; margin:0 0 10px; }
  h1 { font-family:var(--head); font-weight:600; font-size:clamp(30px,5vw,44px); line-height:1.02; letter-spacing:.01em; text-transform:uppercase; margin:0; }
  main { max-width:1280px; margin:0 auto; padding:36px 24px 64px; }
  .lead { font-size:14px; color:var(--slate); margin:0 0 22px; }
  .rgrid { display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:14px; align-items:start; }
  .rcol { background:var(--card); border:1px solid var(--cool-gray); border-top:3px solid var(--navy); border-radius:var(--radius); padding:14px 12px 10px; box-shadow:var(--shadow); }
  .rcol-head { font-size:12px; font-weight:700; letter-spacing:.13em; text-transform:uppercase; color:var(--slate); margin:2px 6px 10px; }
  .file { display:flex; align-items:center; gap:13px; padding:11px 8px; border-radius:var(--radius); text-decoration:none; color:inherit; transition:background .12s ease; }
  .file + .file { border-top:1px solid #eef0ec; }
  .file:hover { background:#eef2f8; }
  .file .ic { flex:none; width:38px; height:38px; border-radius:var(--radius); display:grid; place-items:center; background:var(--navy); color:#fff; font-size:10px; font-weight:700; }
  .file .body { min-width:0; flex:1; }
  .file .name { font-size:14.5px; font-weight:600; color:var(--navy); margin:0; line-height:1.25; }
  .file .meta { font-size:12px; color:var(--slate); margin:0; }
  .file .go { flex:none; color:var(--green); font-size:15px; font-weight:700; }
</style>
</head>
<body>
  <header>
    <div class="header-inner">
      <a class="back" href="../">&larr; Leasing Tools</a>
      <p class="brand-rider">Merritt Properties &nbsp;&bull;&nbsp; Market Data</p>
      <h1>Merritt Market Reports</h1>
    </div>
  </header>
  <main>
    ${emptyMsg}
    <div class="rgrid">${colsHtml}
    </div>
  </main>
</body>
</html>
`;
writeFileSync(join(OUT, 'index.html'), page);

// ---- Commit + push ----
const changed = execSync('git status --porcelain reports', { cwd: REPO }).toString().trim();
console.log(`Synced ${total} report(s) across ${columns.length} column(s).`);
if (!changed) { console.log('No changes to publish.'); process.exit(0); }
execSync('git add reports', { cwd: REPO, stdio: 'inherit' });
execSync('git -c user.name="Dalton Myers" -c user.email="dmyers@merrittproperties.com" commit -m "Sync market reports"', { cwd: REPO, stdio: 'inherit' });
if (NO_PUSH) { console.log('Committed (push skipped).'); process.exit(0); }
console.log('Pushing to GitHub (a sign-in window may appear)...');
execSync('git push origin main', { cwd: REPO, stdio: 'inherit' });
console.log('Published. Netlify will redeploy in about a minute.');
