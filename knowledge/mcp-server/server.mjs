#!/usr/bin/env node
// DSH Knowledge Base MCP server — semantic search over knowledge/ via local embeddings.
// Tools: kb_search, kb_reindex, kb_status
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { pipeline } from "@xenova/transformers";

const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
const INDEX_FILE = process.env.KB_INDEX || path.join(SERVER_DIR, "kb-index.json");
const KB_ROOT = process.env.KB_ROOT || path.join(os.homedir(), "OneDrive", "Desktop", "knowledge");
const QUERY_PREFIX = "为这个句子生成表示以用于检索相关文章：";

let embedder = null;
async function getEmbedder() {
  if (!embedder) embedder = await pipeline("feature-extraction", "Xenova/bge-small-zh-v1.5", { quantized: true });
  return embedder;
}

let index = null;
function loadIndex() {
  if (!fs.existsSync(INDEX_FILE)) return null;
  try { return JSON.parse(fs.readFileSync(INDEX_FILE, "utf8")); } catch { return null; }
}
function saveIndex(idx) { fs.writeFileSync(INDEX_FILE, JSON.stringify(idx)); }

async function embedOne(text) {
  const emb = await getEmbedder();
  const out = await emb([text], { pooling: "mean", normalize: true });
  const t = Array.isArray(out) ? out[0] : out;
  if (t.dims && t.dims.length === 2) return t.tolist()[0];
  return Array.from(t.data);
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
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

async function buildIndex() {
  const files = collectMarkdown(KB_ROOT);
  const docs = [];
  for (const f of files) {
    const raw = fs.readFileSync(f, "utf8");
    const text = extractText(raw);
    if (text.length < 30) continue;
    const rel = path.relative(KB_ROOT, f).replace(/\\/g, "/");
    const chunks = chunkText(text);
    for (let i = 0; i < chunks.length; i++) docs.push({ file: rel, chunk: i, text: chunks[i] });
  }
  const emb = await getEmbedder();
  const vectors = [];
  const BATCH = 32;
  for (let i = 0; i < docs.length; i += BATCH) {
    const batch = docs.slice(i, i + BATCH).map((d) => d.text);
    const out = await emb(batch, { pooling: "mean", normalize: true });
    const arr = Array.isArray(out) ? out : [out];
    for (const t of arr) {
      if (t.dims && t.dims.length === 2) vectors.push(...t.tolist());
      else vectors.push(Array.from(t.data));
    }
    process.stderr.write(".");
  }
  process.stderr.write("\n");
  const idx = {
    model: "Xenova/bge-small-zh-v1.5",
    dim: vectors[0] ? vectors[0].length : 0,
    queryPrefix: QUERY_PREFIX,
    builtAt: new Date().toISOString(),
    files: files.length,
    chunks: docs.length,
    docs,
    vectors
  };
  saveIndex(idx);
  index = idx;
  return idx;
}

const server = new McpServer({ name: "dsh-knowledge", version: "0.1.0" });

server.tool(
  "kb_search",
  "Semantic search over the DSH knowledge base (knowledge/). Returns top matching chunks with file paths and scores. Use when the user asks something that may be covered by past research notes, DSH internals, OpenClaw notes, or RAG patterns.",
  { query: z.string().describe("Search query, natural language, Chinese or English"), k: z.number().int().min(1).max(20).optional().describe("Result count (default 5)") },
  async ({ query, k = 5 }) => {
    if (!index) index = loadIndex();
    if (!index) return { content: [{ type: "text", text: "No index found. Run kb_reindex first." }] };
    const qv = await embedOne(index.queryPrefix + query);
    const scored = index.docs.map((d, i) => ({ ...d, score: cosine(qv, index.vectors[i]) }));
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, k).filter((d) => d.score > 0.25);
    if (top.length === 0) return { content: [{ type: "text", text: "No results above threshold." }] };
    const lines = top.map((d) => `[${d.score.toFixed(3)}] ${d.file}#chunk${d.chunk}\n${d.text.slice(0, 300)}`);
    return { content: [{ type: "text", text: lines.join("\n\n") }] };
  }
);

server.tool(
  "kb_reindex",
  "Rebuild the knowledge base vector index (re-embeds all markdown files under knowledge/). Run after adding or editing knowledge files.",
  {},
  async () => {
    const idx = await buildIndex();
    return { content: [{ type: "text", text: "Rebuilt: " + idx.files + " files, " + idx.chunks + " chunks, dim " + idx.dim }] };
  }
);

server.tool(
  "kb_status",
  "Show knowledge base index status: model, file/chunk counts, index age, and whether an index exists.",
  {},
  async () => {
    if (!index) index = loadIndex();
    if (!index) return { content: [{ type: "text", text: "No index. Run kb_reindex." }] };
    return { content: [{ type: "text", text: "Model: " + index.model + "\nFiles: " + index.files + "\nChunks: " + index.chunks + "\nDim: " + index.dim + "\nBuilt: " + index.builtAt }] };
  }
);

index = loadIndex();
const transport = new StdioServerTransport();
await server.connect(transport);
