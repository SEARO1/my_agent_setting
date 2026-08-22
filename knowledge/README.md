---
tags: [index, knowledge-base]
updated: 2026-08-16
---

# Knowledge Base（我哋嘅 RAG 知識庫）

> ⚠️ **已遷移去 OpenViking（2026-08-22）** — 呢個資料夾保留作備份/參考，內容已全數 import 入 OpenViking（resources/knowledge/knowledge/）。
> 之後新增/查詢用 OpenViking（mcp__openviking__* tools + openviking-memory skill），呢度唔再係 primary。
> 詳情見 [[openviking-overview]]。

## 規約
- 一篇嘢一個 .md 檔，主題要單一
- 檔頭用 frontmatter：`tags`（檢索關鍵詞）、`updated`（更新日期）
- 檔名用 kebab-case，放喺對應主題資料夾
- 寫俾「未來嘅我」睇：假設冇前文，要自包含
- 內容要準確，引述來源 URL；唔好估，寧願寫「未確認」

## 結構
| 資料夾 | 內容 |
|---|---|
| `dsh/` | DSH（DeepSeek Harness）內部機制研究 |
| `openclaw/` | OpenClaw memory/RAG 架構筆記 |
| `rag/` | Agent RAG 通用模式 |
| `research/` | 研究過程嘅技術發現（例如 session log 格式） |
| `memory/` | 由 session 蒸餾出嚟嘅長期記憶（index.md 做目錄） |
| `mcp-server/` | MCP 向量搜尋 server（kb_search/kb_reindex/kb_status，本地 embedding） |

## 📚 筆記索引（Obsidian graph view 用）

### 🔬 DSH 機制
- [[agent-instructions]] — AGENTS.md 指令鏈
- [[architecture]] — DSH 架構速覽
- [[memory-and-rag]] — DSH 6 個記憶／檢索機制

### 🦾 OpenClaw / RAG
- [[memory-rag]] — OpenClaw memory/RAG 架構
- [[patterns]] — Agent RAG 通用模式（分層做法）

### 🔎 研究
- [[session-log-format]] — DSH session log 格式（JSONL + zstd）

### 🧠 蒸餾記憶
- [[index]] — Memory 索引（4 篇蒸餾筆記 + 13 個 session digests）

## 常用操作
- 搵嘢：`grep` 用 tags / 關鍵詞，`glob` 睇檔案結構
- 加新知識：寫新檔，喺呢個 README 加一行
- 定期 review：確保無過期／矛盾內容