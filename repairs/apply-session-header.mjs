import fs from 'node:fs';
import path from 'node:path';
const target = fs.realpathSync(process.argv[2]);
const original = fs.readFileSync(target, 'utf8');
const before = 'function requestHeaders(headers) {\n\tconst attribution = attributionHeaders();';
const after = 'function requestHeaders(headers, sessionId) {\n\tconst attribution = {\n\t\t...attributionHeaders(),\n\t\t...(sessionId === undefined ? {} : { "x-deepseek-harness-session-id": String(sessionId) })\n\t};';
if (original.includes(after)) { console.log('Already patched'); process.exit(0); }
if (!original.includes(before) || !original.includes('requestHeaders(profile.headers)')) throw new Error('Unsupported adapter version; refusing to patch');
const backup = path.resolve('_trash/pi-ai-session-header-20260909');
fs.mkdirSync(backup, {recursive:true});
if (!fs.existsSync(path.join(backup,'index.js'))) fs.writeFileSync(path.join(backup,'index.js'),original);
fs.writeFileSync(target, original.replace(before, after).replace('requestHeaders(profile.headers)', 'requestHeaders(profile.headers, options.sessionId)'));
console.log('Patched pi-ai session attribution');
