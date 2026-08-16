#!/usr/bin/env node
// DSH session distiller: decompress ~/.dsh/sessions/*/*/session.jsonl.zstd
// and emit compact per-session digests (user asks + assistant text replies + tools).
// Usage: node distill-sessions.mjs [--out <dir>] [--since-days N]
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { zstdDecompressSync } from "node:zlib";

const SESSIONS_ROOT = path.join(os.homedir(), ".dsh", "sessions");
const OUT_DEFAULT = path.join(os.homedir(), "OneDrive", "Desktop", "knowledge", "memory", "digests");

function scanFrames(buffer) {
  const frames = [];
  let offset = 0;
  while (offset < buffer.length) {
    const start = offset;
    if (buffer.length - offset < 4) return { frames };
    if (buffer.readUInt32LE(offset) !== 4247762216) return { frames };
    offset += 4;
    const descriptor = buffer.readUInt8(offset); offset += 1;
    const csFlag = descriptor >>> 6;
    const single = (descriptor & 32) !== 0;
    const checksum = (descriptor & 4) !== 0;
    const dict = descriptor & 3;
    const dictBytes = dict === 3 ? 4 : dict;
    const csBytes = csFlag === 0 ? (single ? 1 : 0) : 1 << csFlag;
    offset += (single ? 0 : 1) + dictBytes + csBytes;
    let ok = false;
    for (;;) {
      if (buffer.length - offset < 3) return { frames };
      const bh = buffer.readUIntLE(offset, 3);
      offset += 3;
      const last = (bh & 1) !== 0;
      const type = (bh >>> 1) & 3;
      const size = bh >>> 3;
      if (type === 3) return { frames };
      offset += type === 1 ? 1 : size;
      if (last) { ok = true; break; }
    }
    if (!ok) return { frames };
    if (checksum) offset += 4;
    frames.push({ start, end: offset });
  }
  return { frames };
}

function decodeSession(file) {
  const buf = fs.readFileSync(file);
  const { frames } = scanFrames(buf);
  if (frames.length === 0) throw new Error("no complete frames");
  let out = Buffer.alloc(0);
  for (const f of frames) out = Buffer.concat([out, zstdDecompressSync(buf.subarray(f.start, f.end))]);
  return out.toString("utf8").split(/\r?\n/).filter(Boolean);
}

function isInjectedContext(text) {
  if (!text) return true;
  if (text.startsWith("Current runtime context")) return true;
  if (text.includes("<system-reminder>") || text.includes("<available_skills>")) return true;
  if (text.startsWith("The approval policy changed")) return true;
  return false;
}

function truncate(s, n = 500) {
  s = (s || "").replace(/\s+/g, " ").trim();
  return s.length > n ? s.slice(0, n) + " …" : s;
}

function distillOne(file, outDir) {
  const lines = decodeSession(file);
  const meta = { id: null, title: null, createdAt: null, cwd: null };
  const userQs = [];
  const replies = [];
  const tools = new Map();
  let turns = 0;
  for (const line of lines) {
    let o; try { o = JSON.parse(line); } catch { continue; }
    if (o.type === "session") { meta.id = o.id; meta.createdAt = new Date(o.createdAt); meta.cwd = o.cwd; }
    else if (o.type === "session/title" && !meta.title) meta.title = o.data?.title;
    else if (o.type === "user/message") {
      const d = o.data || {};
      if (d.source?.kind !== "user") continue;
      const text = (d.content || []).map(c => c.type === "text" ? c.text : "").join(" ");
      if (isInjectedContext(text)) continue;
      userQs.push(text);
    } else if (o.type === "assistant/message") {
      const parts = (o.data?.message?.content || []).filter(c => c.type === "text");
      for (const p of parts) replies.push(p.text);
    } else if (o.type === "tool/call") {
      const name = o.data?.name || "?";
      tools.set(name, (tools.get(name) || 0) + 1);
    } else if (o.type === "turn/start") {
      turns++;
    }
  }
  const date = meta.createdAt ? meta.createdAt.toISOString().slice(0, 10) : "unknown";
  const md = [
    "---",
    "tags: [memory, session-digest]",
    "session: " + (meta.id || "unknown"),
    "title: " + (meta.title || "untitled"),
    "date: " + date,
    "---",
    "",
    "# " + (meta.title || meta.id || "Session"),
    "",
    "- 日期: " + (meta.createdAt ? meta.createdAt.toISOString() : "?") + (meta.cwd ? "　cwd: " + meta.cwd : ""),
    "- 用戶問題: " + userQs.length + " ｜ 回覆節錄: " + replies.length + " ｜ turns: " + turns,
    "- 工具: " + (tools.size ? [...tools.entries()].map(([k, v]) => k + "×" + v).join(", ") : "(none)"),
    "",
    "## 用戶問題",
    ...(userQs.length ? userQs.map((q, i) => (i + 1) + ". " + truncate(q, 400)) : ["(冇)"]),
    "",
    "## 回覆節錄",
    ...(replies.length ? replies.slice(0, 12).map((r, i) => (i + 1) + ". " + truncate(r, 300)) : ["(冇)"]),
    ""
  ].join("\n");
  const outFile = path.join(outDir, date + "-" + (meta.id || "unknown") + ".md");
  fs.writeFileSync(outFile, md, "utf8");
  return { id: meta.id, title: meta.title, date, userQs: userQs.length, outFile };
}

const args = process.argv.slice(2);
const outDir = args.includes("--out") ? args[args.indexOf("--out") + 1] : OUT_DEFAULT;
fs.mkdirSync(outDir, { recursive: true });
const results = [];
for (const ws of fs.readdirSync(SESSIONS_ROOT, { withFileTypes: true })) {
  if (!ws.isDirectory()) continue;
  const wsPath = path.join(SESSIONS_ROOT, ws.name);
  for (const sess of fs.readdirSync(wsPath, { withFileTypes: true })) {
    if (!sess.isDirectory()) continue;
    const file = path.join(wsPath, sess.name, "session.jsonl.zstd");
    if (!fs.existsSync(file)) continue;
    try {
      results.push(distillOne(file, outDir));
    } catch (e) {
      console.error("SKIP " + sess.name + ": " + e.message);
    }
  }
}
console.log("DISTILLED " + results.length + " sessions → " + outDir);
for (const r of results) console.log("  " + r.date + " | " + (r.title || "untitled") + " | " + r.userQs + " questions | " + r.outFile);
