#!/usr/bin/env node
/**
 * coverage-audit.mjs - measure a repo's docs against its source tree.
 *
 * Answers four questions with numbers instead of impressions:
 *   1. Which documentation-relevant source units have no mention in any CURRENT doc page?
 *   2. Which numbers the index page states about the tree are stale?
 *   3. Which route declarations are absent from the endpoint reference?
 *   4. Which docs pages are not reachable from the index page?
 *
 * Usage:  node coverage-audit.mjs [--root <dir>] [--json]
 *
 * Defaults target the STT_Sum_Tag_Trend layout (server/ + client/src + docs/).
 * For another repo, edit AREAS / HIST_DIRS / INDEX_PAGE below.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const BT = String.fromCharCode(96); // backtick, so this file survives being embedded in a template literal
const args = process.argv.slice(2);
const ROOT = args.includes('--root') ? args[args.indexOf('--root') + 1] : '.';
const AS_JSON = args.includes('--json');

// ── repo shape (edit these for a different project) ───────────────────────────
const AREAS = [
  ['server/services', 'server/services'],
  ['server/routes', 'server/routes'],
  ['server/utils', 'server/utils'],
  ['server/middleware', 'server/middleware'],
  ['server/config', 'server/config'],
  ['server/llm', 'server/llm'],
  ['server/pabx', 'server/pabx'],
  ['server/stt', 'server/stt'],
  ['server/probes', 'server/probes'],
  ['server/scripts', 'server/scripts'],
  ['client/src/api', 'client/src/api'],
  ['client/src/utils', 'client/src/utils'],
  ['client/src/hooks', 'client/src/hooks'],
  ['client/src/context', 'client/src/context'],
  ['client/src/components', 'client/src/components'],
  ['client/src/pages', 'client/src/pages'],
];
// Dated history: a hit here is NOT documentation coverage.
const HIST_DIRS = ['docs/progress/', 'docs/reviews/', 'docs/specs/', 'docs/superpowers/', 'docs/pending/'];
const INDEX_PAGE = 'docs/README.md';
const SKIP_NAMES = new Set(['node_modules', '__tests__', '__mocks__', 'dist', 'migrations', 'test-support', 'test-utils']);

// ── helpers ──────────────────────────────────────────────────────────────────
const at = (p) => join(ROOT, p);
const exists = (p) => existsSync(at(p));
const rd = (d) => { try { return readdirSync(at(d), { withFileTypes: true }); } catch { return []; } };
const txt = (p) => readFileSync(at(p), 'utf8');

function countFiles(dir) {
  let n = 0;
  const walk = (d) => {
    for (const e of rd(d)) {
      if (SKIP_NAMES.has(e.name)) continue;
      const p = d + '/' + e.name;
      if (e.isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\./.test(e.name)) n++;
    }
  };
  walk(dir);
  return n;
}

const units = [];
for (const [dir, prefix] of AREAS) {
  for (const e of rd(dir)) {
    const id = prefix + '/' + e.name;
    if (e.isDirectory()) units.push({ id: id + '/', kind: prefix, files: countFiles(dir + '/' + e.name) });
    else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\./.test(e.name) && e.name !== 'index.ts') {
      units.push({ id, kind: prefix, files: 1 });
    }
  }
}

const docPages = [];
const walkMd = (d) => {
  for (const e of rd(d)) {
    const p = d + '/' + e.name;
    if (e.isDirectory()) walkMd(p);
    else if (e.name.endsWith('.md')) docPages.push(p);
  }
};
if (exists('docs')) walkMd('docs');
const currentPages = docPages.filter((p) => !HIST_DIRS.some((h) => p.startsWith(h)));
const corpus = currentPages.map(txt).join('\n') + '\n' + (exists(INDEX_PAGE) ? txt(INDEX_PAGE) : '');

// A unit is covered when any of its spellings appears in a current page.
// Probe BOTH the bare name and the full path: the index links the path, prose names the module.
function isCovered(u) {
  const base = u.id.replace(/\/$/, '');            // server/services/foo.ts  (or .../foo/ for a folder)
  const noExt = base.replace(/\.(ts|tsx)$/, '');    // server/services/foo
  const name = noExt.split('/').pop();             // foo
  const baseName = base.split('/').pop();          // foo.ts
  // Probes, loosest last. The basename WITH its extension is what prose and tables use
  // (`jev-reply-probe-b-check.ts`, `scripts/backfillTagKeys.ts`); the full path is what the index links.
  return [
    noExt + '/', noExt + '.ts', noExt + '.tsx',
    '/' + name + '/', name + '.md',
    BT + name + BT, BT + baseName + BT,
    baseName,
  ].some((p) => corpus.includes(p));
}
const gaps = units.filter((u) => !isCovered(u));

// ── facts the index page usually gets wrong ─────────────────────────────────
const facts = { docPages: docPages.length, currentDocPages: currentPages.length };
facts.docDirs = new Set(docPages.map((p) => p.split('/')[1])).size;
if (exists('server/prisma/schema.prisma')) {
  const s = txt('server/prisma/schema.prisma');
  facts.prismaModels = (s.match(/^model \w+ \{/gm) || []).length;
  facts.prismaEnums = (s.match(/^enum \w+ \{/gm) || []).length;
  facts.tenantOwnedModels = s.split(/^model /m).slice(1).filter((b) => /\n\s+tenantId\s/.test(b)).length;
}

// route declarations vs the endpoint reference
const walkTs = (d, out = []) => {
  for (const e of rd(d)) {
    if (SKIP_NAMES.has(e.name)) continue;
    const p = d + '/' + e.name;
    if (e.isDirectory()) walkTs(p, out);
    else if (/\.ts$/.test(e.name) && !/\.test\./.test(e.name)) out.push(p);
  }
  return out;
};
const routeRe = new RegExp('router\\.(get|post|put|patch|delete)\\(\\s*[\'"' + BT + ']([^\'"' + BT + ']+)[\'"' + BT + ']', 'g');
const routeDefs = [];
for (const f of walkTs('server/routes')) {
  for (const m of txt(f).matchAll(routeRe)) routeDefs.push({ verb: m[1].toUpperCase(), path: m[2], file: f });
}
facts.routeDeclarations = routeDefs.length;
const endpointDoc = exists('docs/api/endpoints.md') ? txt('docs/api/endpoints.md') : '';
facts.routesMissingFromEndpointDoc = endpointDoc
  ? routeDefs.filter((r) => !endpointDoc.includes(r.path)).map((r) => r.verb + ' ' + r.path + '  (' + r.file + ')')
  : [];

// env keys vs their reference page
if (exists('server/.env.example')) {
  const keys = [...txt('server/.env.example').matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map((m) => m[1]);
  facts.envKeys = keys.length;
  const envDoc = 'docs/reference/environment-variables.md';
  facts.envKeysMissingFromDoc = exists(envDoc) ? keys.filter((k) => !txt(envDoc).includes(k)) : ['(no reference page)'];
}

// docs pages nobody links from the index
facts.pagesNotInIndex = exists(INDEX_PAGE)
  ? currentPages.filter((p) => p !== INDEX_PAGE && !txt(INDEX_PAGE).includes(p.replace(/^docs\//, '')))
  : [];

if (AS_JSON) {
  console.log(JSON.stringify({ facts, gaps }, null, 2));
} else {
  console.log('FACTS');
  for (const [k, v] of Object.entries(facts)) {
    if (Array.isArray(v)) {
      console.log('  ' + k + ': ' + v.length);
      for (const x of v.slice(0, 40)) console.log('    - ' + x);
    } else console.log('  ' + k + ': ' + v);
  }
  console.log('\nUNITS WITH NO CURRENT-DOC MENTION: ' + gaps.length + ' of ' + units.length);
  for (const g of gaps) console.log('  ' + g.id + '  [' + g.files + ' files]');
}
