---
tags: [memory, dsh, system-prompt, vision, macbook]
updated: 2026-08-16
---

# DSH 研究雜項（2026-08-15）

## dsh-system-prompt 喺邊度 config（session-cdfc92bd）
- `dsh-system-prompt` 係插件（`@deepseek-ai/dsh-system-prompt`，row id `system-prompt`），每個 round 組裝 system prompt
- 冇獨立 config 檔：靠 Cordis patch 層疊加，**後寫 layer 贏，成個 config 換走（唔係 merge）**
- Bundle 內置默認唔好改（npm install 會冇咗）；要改就喺 profile 嘅 `cordis.patch.yml`

## dsh-vision skill 冇 config（session-02d85a87）
- 用戶遇到 `llm-deepseek: no API key for provider route "deepseek-official"` — 即係 `DEEPSEEK_API_KEY` 未配置
- 同 web_search 一樣問題：**呢部機冇 DEEPSEEK_API_KEY**，得 `OPENCODE_GO_API_KEY`
- 結論：任何用 `deepseek-official` route 嘅嘢都要經 vision-router 或者改 provider（`settings.yaml` 嘅 `llm-deepseek` section 已 patch 去 opencode zen go）

## diagram-design skill 安裝（session-74fc740a）
- 用戶安裝咗 `cathrynlavery/diagram-design`（18.9k stars，Claude Code/Codex/Pi 用嘅圖表 skill）入 DSH
- 狀態：`~/.dsh/repos/diagram-design`（git clone），catalog 有 `diagram-design` entry
- 教訓：pwsh 沙箱 TLS 被擋（HTTPS SSL 失敗），**Node/run_code 環境可以正常連網** — 上網抓嘢用 Node 環境或者 curl，唔好用 pwsh Invoke-WebRequest 行 HTTPS（除非 set TLS）

## MacBook 安裝教學（session-ca71f867）
- 用戶寫咗 `MacBook-DeepSeek-Harness-安裝教學.md`（Desktop，360 行，13 章節）俾非 programmer 朋友用
- 關鍵資料：`npx -y @deepseek-ai/dsh web` 啟動、預設 `http://127.0.0.1:3080`、`--port` 可改、API key 喺網頁 Models 頁填（寫入 `~/.dsh/.credentials.yaml` 即時生效）
- npm 最新版：`0.1.0-rc.6`，repo：`deepseek-ai/deepseek-harness`
