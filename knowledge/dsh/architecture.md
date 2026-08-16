---
tags: [dsh, architecture, cordis, config]
updated: 2026-08-16
---

# DSH 架構速覽

來源：直接讀 `~/.dsh/profiles/node_modules/@deepseek-ai/*` 套件 README + `cordis.patch.yml`。

## 佈局
- `DSH_HOME` = `~/.dsh`（即 `C:\Users\cheun\.dsh`）
  - `settings.yaml` — 用戶設定：模型 provider、agent-default-model、presets（熱更新）
  - `.credentials.yaml` — 憑證（例如 `OPENCODE_GO_API_KEY`）
  - `skills/` — skills（`<name>/SKILL.md` 或 flat `<name>.md`）
  - `sessions/` — session transcripts（`<workspace-hash>/<session-id>/session.jsonl.zstd`）
  - `.agent-presets/` — agent preset 定義
  - `profiles/` — 真實 runtime：`profiles/node_modules/@deepseek-ai/*` 係全部 DSH 套件；`profiles/web/` 係 web profile（`cordis.yml` + `cordis.patch.yml`）
  - `storages/` — workspace.json 等
- 模型 provider：`OPENCODE_GO_API_KEY`（OpenCode Zen Go），經 `llm-deepseek` + `vision-router` 行 `deepseek-v4-flash`（text）同 `kimi-k3`（vision）

## Cordis 組合式架構
- DSH 用 Cordis 插件系統：`dsh-base` 定義核心 rows（每個 row = 一個插件 instance + config）
- Profile = 多個 bundle 疊加（`@deepseek-ai/dsh-base` + `dsh-web-app` + `dsh-dafeiyu` + `dsh-vision-router`）
- 用戶 patch 層：`~/.dsh/profiles/web/cordis.patch.yml` — **patch 會成個替換 row 嘅 config，唔係 merge**（最後寫入者贏）
- **⚠️ Patch 語法三種形式**（loader 只認呢三種）：
  1. `- id: X` + `config:` — **override 現有 row**（row 一定要已存在，例如 base bundle 有）
  2. `- id: X` + `disabled: true` — 停用現有 row
  3. `- insert: [ { id, name, config } ]` — **建立新 row**（例如 MCP server entry！唔用 insert 形式會靜雞雞冇咗）
- `settings.yaml` 可以 override adapter config，唔使 restart

## 安全模型
- Permission presets：`read-only` / `workspace-write` / `danger-full-access`
- Approval policy：`danger-full-access` → `never`（現時設定）
- Sandbox：Windows 行 `pwsh-sandbox`（read-only mode 下行 ConstrainedLanguage）