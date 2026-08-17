---
tags: [openclaw, memory, rag, reference]
updated: 2026-08-16
---

# OpenClaw 嘅 Memory/RAG 架構（參考筆記）

來源：`docs.openclaw.ai`（concepts/memory、memory-builtin、memory-search、plugins/memory-lancedb、plugins/memory-wiki、reference/memory-config）。

## 核心哲學
- **檔案優先**："The model only remembers what gets saved to disk; there is no hidden state."
- 記憶 = Markdown 檔案：`USER.md`（偏好/個人資料）、`MEMORY.md`（長期事實/決定，session 開頭載入）、`memory/YYYY-MM-DD.md`（每日筆記，index 但唔自動入 prompt）、`DREAMS.md`（背景 consolidation 總結）

## memory-core（內置引擎 = 真 RAG）
- 每 agent 一個 SQLite DB；chunk 400 tokens / 80 overlap
- **Hybrid search**：vector（語義）+ FTS5 BM25（關鍵字）→ weighted merge → recency decay（30 日半衰期，每日筆記）→ importance → MMR diversity
- CJK trigram tokenization；sqlite-vec 加速
- Embedding providers：OpenAI（預設）、Gemini（多模態）、Voyage、Mistral、Bedrock、DeepInfra、**Ollama**、LM Studio、**本地 llama.cpp GGUF**、openai-compatible
- `memory.search.extraPaths`：index 外部 Markdown 資料夾（最典型知識庫用法）
- `rememberAcrossConversations`：跨 session recall 自己嘅私人對話

## memory-lancedb 插件
- LanceDB 向量庫；`autoRecall`（turn 前自動 recall）+ `autoCapture`（回覆後自動記低）
- 工具：`memory_recall` / `memory_store` / `memory_forget`；CLI：`openclaw ltm search/list/stats`
- 支援 Ollama 本地 embedding；per-agent ownership

## memory-wiki 插件
- 將記憶 compile 成 Obsidian 相容嘅 wiki vault：entities/、concepts/、syntheses/、sources/、reports/
- **Structured claims + evidence**（唔係死筆記）：claims 有 id/status/confidence/evidence[]，可以追蹤、評分、contested
- 工具：`wiki_search` / `wiki_get` / `wiki_apply` / `wiki_lint`；dashboard 報告矛盾/低信心/過期頁
- Bridge mode：由 active memory plugin 匯入 artifacts

## 對 DSH 嘅啟示
- DSH 嘅 `~/.dsh/AGENTS.md` ≈ OpenClaw `USER.md`+`MEMORY.md`
- DSH 嘅 skills ≈ progressive disclosure（OpenClaw 都有 skills 系統）
- 向量 RAG（memory-lancedb 級）喺 DSH = MCP server 或者 self-host 方案，係 optional 升級
- 蒸餾概念（dreaming sweep：daily notes → MEMORY.md）→ 我哋 L4 嘅 session 蒸餾就係同一思路

## 相關筆記
- [[patterns]] — RAG 通用模式
- [[memory-and-rag]] — DSH 嘅 6 個機制
