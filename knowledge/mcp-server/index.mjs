#!/usr/bin/env node
// Build the vector index for the knowledge base.
// Usage: node index.mjs [--force]
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { pipeline } from "@xenova/transformers";

const KB_ROOT = process.env.KB_ROOT || path.join(os.homedir(), "OneDrive", "Desktop", "knowledge");
const INDEX_FILE = process.env.KB_INDEX || path.join(path.dirname(fileURLToPath(import.meta.url)), "kb-index.json");
const QUERY_PREFIX = "为这个句子生成表示以用于检索相关文章：";

let embedder = null;
async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/bge-small-zh-v1.5", { quantized: true });
  }
  return embedder;
}

async function embed(texts) {
  const emb = await getEmbedder();
  const out = await emb(texts, { pooling: "mean", normalize: true });
  // out is a Tensor of shape [n, dim]; tolist() gives row arrays
  const arr = Array.isArray(out) ? out : [out];
  const rows = [];
  for (const t of arr) {
    if (t.dims && t.dims.length === 2) rows.push(...t.tolist());
    else rows.push(Array.from(t.data));
  }
  return rows;
}

function extractText(md) {
  let s = md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
  s = s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[>\-*+]\s+/gm, "")
    .replace(/[|]/g, " ")
    .replace(/\*\*([^*]*)\*\*/g, "$1")
    .replace(/\*([^*]*)\*/g, "$1");
  return s.replace(/\s+/g, " ").trim();
}

function chunkText(text, size = 400, overlap = 60) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + size, text.length);
    chunks.push(text.slice(i, end).trim());
    if (end === text.length) break;
    i = end - overlap;
  }
  return chunks.filter((c) => c.length > 20);
}

function collectMarkdown(dir) {
  const files = [];
  const walk = (d) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      if (ent.name === "node_modules" || ent.name === "mcp-server" || ent.name === "scripts" || ent.name === "digests" || ent.name.startsWith("_")) continue;
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name.endsWith(".md")) files.push(p);
    }
  };
  walk(dir);
  return files.sort();
}

async function main() {
  const force = process.argv.includes("--force");
  if (!force && fs.existsSync(INDEX_FILE)) {
    const st = JSON.parse(fs.readFileSync(INDEX_FILE, "utf8"));
    console.log("Index exists (" + st.chunks + " chunks, " + st.files + " files) — use --force to rebuild");
    return;
  }
  const files = collectMarkdown(KB_ROOT);
  console.log("Files: " + files.length);
  const docs = [];
  for (const f of files) {
    const raw = fs.readFileSync(f, "utf8");
    const text = extractText(raw);
    if (text.length < 30) continue;
    const rel = path.relative(KB_ROOT, f).replace(/\\/g, "/");
    const chunks = chunkText(text);
    for (let i = 0; i < chunks.length; i++) {
      docs.push({ file: rel, chunk: i, text: chunks[i] });
    }
  }
  console.log("Chunks: " + docs.length + " — embedding (first run downloads model ~30MB)...");
  const vectors = await embed(docs.map((d) => d.text));
  const index = {
    model: "Xenova/bge-small-zh-v1.5",
    dim: vectors[0].length,
    queryPrefix: QUERY_PREFIX,
    builtAt: new Date().toISOString(),
    files: files.length,
    chunks: docs.length,
    docs,
    vectors
  };
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index));
  console.log("Saved: " + INDEX_FILE + " (" + fs.statSync(INDEX_FILE).size + " bytes, dim=" + index.dim + ")");
}

main().catch((e) => { console.error("INDEX FAILED: " + e.message); process.exit(1); });
