---
tags: [rag, agent, patterns, anthropic]
updated: 2026-08-16
---

# Agent RAG 通用模式

## 核心認知（Anthropic: Effective context engineering, 2025-09-29）
- Context 係有限資源；有 **context rot**（token 越多，recall 越差）
- 重點係「每次 curation 最 relevant 嘅 token」，唔係塞晒入去
- 方法譜系：prompt → context engineering（系統 prompt、工具、MCP、外部資料、message history 都要管）

## 分層做法（由淺入深）
1. **檔案優先**：有結構嘅 Markdown 知識庫 + grep/glob/read — 人類可讀、可版本控制、零基建
2. **Always-on 指令檔**：AGENTS.md / CLAUDE.md / MEMORY.md — 細、精煉、每次載入
3. **Skills / progressive disclosure**：frontmatter description 觸發，按需載入 — token 效率最高
4. **向量 RAG**：embedding + vector DB（Chroma/Qdrant/pgvector/LanceDB）— 自然語言語義檢索
5. **Graph RAG**：知識圖譜（Microsoft GraphRAG）— 全局性問題、多跳關係
6. **Agent memory frameworks**：Mem0 / Letta (MemGPT) — 自動記憶管理

## 常見坑
- 向量 index 同 embedding model 綁死 — 換 model 要全部 re-embed
- Raw transcript 唔好當知識庫（噪音多；OpenClaw 刻意唔自動注入 daily notes）
- RAG 幫 recall 唔幫「懂」— 需要定期 distillation（OpenClaw dreaming sweep 概念）
- 過大 context 反而 hurt performance（context rot）

## 相關筆記
- [[memory-and-rag]] — DSH 點落地呢啲模式
- [[memory-rag]] — OpenClaw 嘅實作對照
