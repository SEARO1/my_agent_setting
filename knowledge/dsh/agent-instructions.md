---
tags: [dsh, agent-instructions, AGENTS.md, memory]
updated: 2026-08-16
---

# DSH 嘅 AGENTS.md 指令系統

來源：`@deepseek-ai/dsh-agent-instructions` README。

## 機制
- **用戶全域**：`$DSH_HOME/AGENTS.md`（即 `~/.dsh/AGENTS.md`）— 每個 session 必定載入
- **專案**：由 cwd 向上行到 project root（最近嘅 `.git`），每層載入 `AGENTS.md` / `CLAUDE.md`
- **本地 overlay**：`AGENTS.local.md` / `CLAUDE.local.md`（同一目錄，base 之後載入）
- 巢狀發現：touch（read/write/edit）到更深目錄時會自動注入嗰層嘅指令
- 去重：同一目錄內內容相同嘅候選只渲染最早一個（trim 前後空白後比較）
- 預算：`maxBytes: 65536`（base bundle 設定）；過大檔案會被忽略（`maxSourceBytes` 預設 1 MiB）
- 刷新：冇 watcher — 改檔之後，下次成功嘅 read/write/edit、resume、或 pre-step 重組時先會見到

## 注入格式
一個 `<system-reminder>` 訊息，列出每個來源檔案同內容；巢狀發現用 "Additional instructions from: <path>"。

## 實戰
- `~/.dsh/AGENTS.md` = OpenClaw 嘅 USER.md/MEMORY.md 對應物（always-on context）
- 想永遠記住嘅嘢 → 寫入 `~/.dsh/AGENTS.md`（但要精簡，每個 session 都食 token）
- 詳細知識 → skills 或 knowledge/ 資料夾（on-demand，唔會長期佔 context）
