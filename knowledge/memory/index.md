---
tags: [memory, index]
updated: 2026-08-16
---

# Memory Index（蒸餾記憶索引）

由 session 蒸餾出嚟嘅長期記憶。每條記錄對應一個 session digest（喺 `digests/`），寫成自包含筆記。

| 日期 | 主題 | 筆記 |
|---|---|---|
| 2026-08-14 | next-ag setup：裝 27 skills、vision pipeline、Docker、port 改動 | [[2026-08-14-next-ag-setup]] |
| 2026-08-15 | n8n + OpenCode Go 整合（HTTP node + SSE reader） | [[2026-08-15-n8n-opencode]] |
| 2026-08-15 | DSH 研究雜項：system-prompt config、vision skill、MacBook 安裝教學 | [[2026-08-15-dsh-history]] |
| 2026-08-16 | DSH RAG 知識庫建造（今日） | [[2026-08-16-dsh-rag-build]] |

## Session Digests（中間產物，可重建）
- [[2026-08-14-session-7cf3a29d-743a-4c24-aba6-a414d80b86bc]]
- [[2026-08-15-session-02d85a87-970c-4e80-a924-e610b1350c99]]
- [[2026-08-15-session-38f8fe8a-434d-4f38-9931-45ff9ca9327a]]
- [[2026-08-15-session-47906d76-d3ec-495a-bd3c-c58f05cbc3a0]]
- [[2026-08-15-session-8e8cfb2f-9251-4644-bb72-3264acbd4c1b]]
- [[2026-08-15-session-ba8b657e-fb53-43cc-b493-bbc260cee8e8]]
- [[2026-08-15-session-ca71f867-5afc-4d93-afb6-0f722516b34f]]
- [[2026-08-15-session-cdfc92bd-848c-4464-996a-ed841293ac50]]
- [[2026-08-15-session-cf173d97-a1ec-4e5d-b548-ecc343196ff1]]
- [[2026-08-15-session-fea64715-6c5a-4dc3-aaec-717f63bdbdee]]
- [[2026-08-16-session-18322fdb-8547-49ef-a5ae-401acb6de203]]
- [[2026-08-16-session-74fc740a-7eb8-491a-b789-6b7bc243da6a]]
- [[2026-08-16-session-c96c62bf-ff7b-4b86-8918-1ac6504c39af]]

## 做法
- 新 session 有價值內容 → 跑 `distill-sessions.mjs` → 寫筆記 → 呢度加一行
- Digests 係中間產物，可隨時重建
