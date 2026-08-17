---
tags: [memory, n8n, opencode, integration, workflow]
updated: 2026-08-16
---

# n8n + OpenCode Go 整合（2026-08-15）

來源：session-cf173d97 digest。用戶喺 n8n 度想 call OpenCode Go（LLM）。

## 結論
- **n8n 冇 OpenCode/opencode-go 嘅官方或成熟 community node** — 要自己砌
- **MCP 條路唔通**：n8n 嘅 MCP Client node 係「消費」MCP server；opencode 自己係 MCP client — 方向錯
- **opencode serve 係 async**：`POST /session` 即刻回 session id，agent 背景行，結果要讀 SSE stream（`/session/<id>/events`），**唔可以一個 HTTP Request node 搞掂**
- MiniMax 係 sync OpenAI-style，可以直接 HTTP node — 兩者格式唔同

## 最終方案（用戶要嘅）
- **Node 1 — HTTP Request**：`POST http://127.0.0.1:10999/session`（本地 opencode serve）或 `https://opencode.ai/zen/go/v1`（hosted，OpenAI-style chat/completions）
- **Node 2 — Code node（SSE reader）**：`fetch(OC_URL + '/session/' + $json.id + '/events')`，等 `session.idle`，攞最終文字
- **n8n paste 陷阱**：n8n 唔收「得一個 node object」嘅 JSON — 要包成個 workflow 信封（`nodes` / `connections` / `pinData` / `meta`）先食得落

## 常見 bug（用戶踩過）
- HTTP node 同 SSE reader 打緊唔同 server（一個 hosted 一個 local）→ session id 對唔上
- Body 唔係 chat-completions 格式
- Bearer key 要正確放 header

## 相關筆記
- [[2026-08-15-dsh-history]] — 同一日嘅 DSH 研究
- [[index]] — memory 索引
