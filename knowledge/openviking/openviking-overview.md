---
tags: [openviking, context-database, rag, memory, installation]
updated: 2026-08-22
---

# OpenViking 研究 + 遷移記錄（2026-08-22）

## 係咩
OpenViking 係火山引擎/ByteDance 出品嘅 open-source agent context database（AGPLv3）。
核心概念：用 viking 協定嘅虛擬 filesystem（URI 形式 "viking" + "://" + 路徑）統一管理 agent 嘅 memory/resources/skills，
取代「黑盒 vector store」。每個 entry 自動生成 L0 (abstract ~100 tokens) / L1 (overview ~2k) / L2 (全文)，
按需載入慳 token。Directory recursive retrieval + 可觀察 trajectory。

Repo: https://github.com/volcengine/OpenViking（local clone: Desktop/Github/OpenViking）

## 安裝（本機，2026-08-22）
- Python 3.13.14 + pip install openviking（0.4.16）+ openviking[local-embed]（llama-cpp-python CPU wheel）
- Config: ~/.openviking/ov.conf
  - Embedding: local bge-small-zh-v1.5-f16（同舊 KB 用緊嘅 transformers.js model 一樣，純 CPU 唔掂 GPU）
  - VLM: 3-credential failover（見下）
- ~/.openviking/ovcli.conf = JSON {"url": "http://127.0.0.1:1933"}（注意：新版要 JSON！YAML 會 parse 失敗，踩咗坑）
- 啟動: ~/.openviking/start-ov.bat（set 3 個 API key env + 開 server）
- Server 預設 port 1933

## VLM multi-credential failover（重點）
vlm.credentials array，index 0 最高優先，失敗自動 fallback：
1. opencode-go (opencode.ai/zen/go/v1) → deepseek-v4-flash（DSH 主用，最平）
2. deepseek 官方 (api.deepseek.com/v1) → deepseek-chat
3. POE (api.poe.com/v1) → DeepSeek-V4-Flash

- 401/403/429/5xx → 自動 fallback 下一個；400 / content-safety → fail-fast 唔 fallback
- 10 分鐘（failback_timeout_seconds）後試跳返高優先級
- 坑：ov.conf 用 ${VAR} 展開 env，但一定要 server process 環境有嗰個 env var 先展開到。冇 env 就傳空 key → 401。所以要用 start-ov.bat 開 server。
- POE API key 唔係普通 OpenAI-compatible，直接俾 OpenViking 用會 401。

## 實測結果
- ov add-resource 成個 knowledge/ 資料夾（12 個 md）→ 48 chunks，全部 MarkdownParser 成功
- ov find 語義檢索 work：query「檔案優先 向量 RAG 分層」→ patterns.md score 0.60 排第一
- L0/L1 由 VLM 生成（resource_summarize stage，~4-5k tokens per doc）
- Failover 實測：改壞 opencode-go key → log 顯示 "Credential opencode-go failed with auth, trying next credential" → 成功 fallback deepseek

## 遷移決定（2026-08-22）
用戶決定由舊 KB（Desktop/knowledge/ + mcp-server 向量 search）遷移去 OpenViking。
- 舊 KB 內容已全數 import 入 OpenViking resources/knowledge/knowledge/
- 舊 mcp-knowledge MCP server 已喺 cordis.patch.yml disable（檔案保留冇 delete）
- 之後用 mcp__openviking__* tools 同 openviking-memory skill
- 清理咗測試用資源（kbtest/ovtest 等）

## 同舊 KB 對比（參考）
| 維度 | 舊 KB | OpenViking |
|---|---|---|
| 載入 | 手動 grep/read/kb_search | 自動 recall 注入 + MCP tools |
| 分層 | 手動整理 | 自動 L0/L1/L2 |
| 記憶寫入 | 手動 distill | 自動 session capture + memory extraction |
| 檢索 | bge-small-zh 本地 cosine | 同款 embedding + directory recursive + trajectory |
| 基建 | 自建 MCP server | 完整 server + Studio + ov CLI |

## 相關
- memory-and-rag — DSH 6 個記憶機制
- 2026-08-16-dsh-rag-build — 舊 KB 建造過程
- patterns — RAG 通用模式
