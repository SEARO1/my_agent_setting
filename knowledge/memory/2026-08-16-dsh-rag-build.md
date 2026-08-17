---
tags: [memory, dsh, rag, knowledge-base]
updated: 2026-08-16
---

# DSH RAG 知識庫建造（2026-08-16）

今日同用戶由零開始幫 DSH 起 RAG 系統（四層計劃）。

## 做咗啲咩
- **L0**：`~/.dsh/AGENTS.md` 建立（用戶全域指令：廣東話、casual、TL;DR、改檔前確認、唔刪嘢、唔用內置 web_search、大動作開 todo）— 即時生效（system-reminder 注入證明）
- **L1**：`knowledge/` 知識庫（Desktop）：README + dsh/（architecture、agent-instructions、memory-and-rag）+ openclaw/memory-rag + rag/patterns + research/session-log-format
- **L2**：兩個 skills：`dsh-internals`（DSH 機制地圖）、`web-research-fallback`（pwsh+Bing 上網）— 即時入 catalog
- **L4**：`knowledge/scripts/distill-sessions.mjs`（解 zstd session logs → digests）+ `memory-distill` skill — 13 個 session 全部 distill 完成

## 重要技術發現
- DSH session log = 串聯 zstd frames（magic 0xFD2FB528）+ JSONL；Node `node:zlib` 內建 zstd
- Record types：user/message（source.kind=user 先係真人）、assistant/message（text parts）、tool/call...
- Session title 由 LLM 生成（session-title-first-prompt-llm，deepseek-v4-flash）

## L3 完成（2026-08-16 驗證）
- Patch：`~/.dsh/profiles/web/cordis.patch.yml` 加 `session-query-sqlite` row（path: `C:\Users\cheun\.dsh\storages\session-fts.sqlite`、openAt: first-search）
- 重啟 gateway 後生效；FTS index 喺第一次搜尋時建立（`~/.dsh/storages/session-fts.sqlite`）
- **驗證**：直接 query SQLite FTS5（`persisted_docs` virtual table）— `n8n` 5 hits、`openclaw` 1 hit、`RAG` 1 hit；UI 側邊欄搜尋框（放大鏡 icon）打出內容 snippet
- 注意：index 覆蓋 10/13 sessions；今日 live session 完結後先 sync；`openAt: first-search` 延遲開 SQLite 至第一次搜尋

## L3.5 MCP 向量 server（2026-08-16 完成）
- 位置：`knowledge/mcp-server/`（`server.mjs` = MCP server，`index.mjs` = index builder，`kb-index.json` = 向量索引）
- Embedding：本地 `Xenova/bge-small-zh-v1.5`（transformers.js ONNX，512 dims，~30MB，唔使 API key）— OpenCode Zen Go 冇 embeddings endpoint（404）所以先揀本地
- Tools：`kb_search`（語義搜尋）、`kb_reindex`（重建索引）、`kb_status`
- DSH 接入：`cordis.patch.yml` 用 `insert:` 形式加 `mcp-knowledge` row（serverName: knowledge）→ 模型見到 `mcp__knowledge__*` tools
  - 教訓：新增 row 一定要用 insert 形式，用 - id: override 形式會冇咗（第一個 bug）
  - 驗證（第二次 restart 後）：server.mjs spawn 成功 + kb_status/kb_search 直接 call 到，語義搜尋正常
- 驗證：中文/英文 query 都正常（「AGENTS.md 點樣自動載入」→ dsh/agent-instructions.md）
- 加咗 knowledge 檔之後要 `kb_reindex` 先搜到新內容

## 相關筆記
- [[memory-and-rag]] — 6 個記憶機制總覽
- [[session-log-format]] — session 資料係蒸餾來源
- [[index]] — memory 索引