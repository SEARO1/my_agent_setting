---
tags: [dsh, memory, rag, mcp, sessions]
updated: 2026-08-16
---

# DSH 嘅 6 個「記憶／檢索」機制

## 1. AGENTS.md 指令鏈（已啟用）
見 `dsh/agent-instructions.md`。`~/.dsh/AGENTS.md` 已建立（2026-08-16）。

## 2. Skills（已啟用）
- `~/.dsh/skills/<name>/SKILL.md` + 專案 `.dsh/skills` / `.agents/skills`
- Frontmatter：`name`（kebab-case）、`description`（必填，觸發條件）、可選 `whenToUse`、`disable-model-invocation`、`user-invocable`
- 模型按 description 決定幾時 load → progressive disclosure
- 新 skill 放 `~/.dsh/skills/<name>/SKILL.md`，watcher 會自動發現

## 3. MCP client（有支援，未配置 server）
- 套件：`@deepseek-ai/dsh-mcp-client`（stdio + streamable-http）
- 喺 `cordis.patch.yml` 加 row：`serverName` + `transport` + `command`/`url` 等
- 工具命名：`mcp__<serverName>__<rawName>`
- HMR：改 entry 會自動 disconnect + reconnect（唔使重啟）

## 4. Session 全文搜尋（存在但關閉）
- `@deepseek-ai/dsh-session-query-sqlite`：FTS5 索引 session transcripts
- base bundle 設定：`path: ':memory:'`、`openAt: never`（關）
- 要開：patch `cordis.patch.yml` 改 `openAt: first-search` + 持久 `path`
- 注意：呢個係 service（Web UI sidebar 搜尋用），唔係模型工具

## 5. Web search（有工具，provider 未配置）
- `dsh-web-search-deepseek` 用 `DEEPSEEK_API_KEY` — 用戶冇放 key → **唔好用**
- 替代：pwsh + Bing HTML fallback（見 web-research-fallback skill）

## 6. 檔案系統（永遠可用）
- read/write/edit/glob/grep 就係最簡單嘅 RAG
- `knowledge/` 資料夾（Desktop）就係我哋嘅知識庫

## 相關筆記
- [[patterns]] — RAG 分層做法
- [[memory-rag]] — OpenClaw 對照
- [[session-log-format]] — session 資料格式
- [[2026-08-16-dsh-rag-build]] — 呢套機制點建造
