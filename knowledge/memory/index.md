---
tags: [memory, index]
updated: 2026-08-16
---

# Memory Index（蒸餾記憶索引）

由 session 蒸餾出嚟嘅長期記憶。每條記錄對應一個 session digest（喺 `digests/`），寫成自包含筆記。

| 日期 | 主題 | 筆記 |
|---|---|---|
| 2026-08-14 | next-ag setup：裝 27 skills、vision pipeline、Docker、port 改動 | `2026-08-14-next-ag-setup.md` |
| 2026-08-15 | n8n + OpenCode Go 整合（HTTP node + SSE reader） | `2026-08-15-n8n-opencode.md` |
| 2026-08-15 | DSH 研究雜項：system-prompt config、vision skill、MacBook 安裝教學 | `2026-08-15-dsh-history.md` |
| 2026-08-16 | DSH RAG 知識庫建造（今日） | `2026-08-16-dsh-rag-build.md` |

## 做法
- 新 session 有價值內容 → 跑 `distill-sessions.mjs` → 寫筆記 → 呢度加一行
- Digests 係中間產物，可隨時重建
