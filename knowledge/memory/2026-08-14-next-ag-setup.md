---
tags: [memory, dsh, skills, vision, docker, setup]
updated: 2026-08-16
---

# next-ag setup（2026-08-14）

來源：session-7cf3a29d digest。當時部機由零開始重建 DSH 環境。

## 做咗啲咩
- **裝咗 27 個 skills** 入 `~/.dsh/skills/`（Superpowers 系列 + discord access/configure 等），即時入 catalog
- **重建 vision pipeline**（kimi-k3 / OpenCode Zen Go）：跟 `asuojun/claude-vision-skill` repo + `claude-vision-config-guide.md`，裝咗 `mcp-vision-proxy`（Visual Credential ID 系統，指令係「immediately call mcp__vision-proxy__analyze_local_image」）
- **將 DSH 起 Docker**（用戶想打包成 docker），用戶要求所有 setting 過晒、port 用 3081（原本 3080）— 呢部分有 SessionPersistenceCorruptionError（header cwd 驗證問題）歷史
- 用戶有 `next-agent-handoff.md`（Desktop）作為交接文件，記錄環境期望

## 記住
- 用戶部機：Windows，Desktop = workspace，DSH 行緊 3080（web）
- Vision 係 kimi-k3 via OpenCode Zen Go（`OPENCODE_GO_API_KEY`）
- 用戶要求 API key 只放 `~/.dsh/.credentials.yaml`（同 `~/.claude/scripts/.env`），唔好寫入其他檔
- 有 `claude-vision-skill` folder 喺 home（`C:\Users\cheun\claude-vision-skill`）
- 用戶試過 Docker 化，但最後用返 local（3080）
