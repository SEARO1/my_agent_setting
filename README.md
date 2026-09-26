# dsh-setup-bundle — 另一部機 DSH 一鍵設定包

呢個 bundle 包含 cheun 部機 DSH 嘅完整客製化設定。以下係喺**新裝置**重現嘅步驟。

## 內容

| 檔 | 用途 | 放邊 |
|---|---|---|
| `AGENTS.md` | 用戶全域指令（每個 session 自動載入） | `~/.dsh/AGENTS.md` |
| `settings.yaml` | Runtime 設定（model 預設 / 肥魚 / pet / UI） | `~/.dsh/settings.yaml` |
| `cordis.patch.yml` | **web** profile patch（FTS / crosssession MCP / Exa / skins）。live 同呢份只差 Exa key：repo 用 `!!js process.env.EXA_API_KEY`，live 仲揸住**已撤銷**嘅明文 key（見下面「未同步」） | `~/.dsh/profiles/web/cordis.patch.yml` |
| `profiles/desktop/cordis.patch.yml` | **desktop** profile patch（2026-09-26 起清空：唔 mount 任何 plugin） | `~/.dsh/profiles/desktop/cordis.patch.yml` |
| `profiles/desktop/package.json` | **desktop** profile bundle + dependency 清單（空 profile） | `~/.dsh/profiles/desktop/package.json` |
| `profiles/web/package.json` | **web** profile bundle + dependency 清單（2026-09-26 起冇 vision-router） | `~/.dsh/profiles/web/package.json` |
| `credentials.template.yaml` | API key 模板（OPENCODE+POE+DEEPSEEK+EXA） | `~/.dsh/.credentials.yaml` |
| `ov.conf.template` | OpenViking server 設定模板 | `~/.openviking/ov.conf` |
| `start-ov.bat.template` / `start-ov-hidden.vbs.template` | OpenViking 啟動 + 隱藏 launcher 模板 | `~/.openviking/` |
| `skills/` | skills（live 機 2026-09-26 有 104 個 dir；repo 有 120 個 —— 多出嗰 16 個只喺 repo，見下面「未同步」） | `~/.dsh/skills/` |
| `knowledge/` | 知識庫（已遷移 OpenViking，保留備份）。⚠️ live 而家實際喺 `~/Desktop/knowledge`（`dsh-kb` 唔存在），而且被 `.gitignore` 咗 | `<USERPROFILE>/dsh-kb/knowledge/` |
| `mcp/agent-cross-session-mcp/` | cross-session MCP server 源碼 | `~/Desktop/agent_cross-session_mcp/` |
| `DSH-Setup-Guide.md` | 完整說明文件 | 自己睇 |
| `profiles/desktop/cordis.yml` / `pnpm-workspace.yaml` / `pnpm-lock.yaml` | desktop profile 骨架（`cordis.patch.yml` 以外嘅 profile 檔） | `~/.dsh/profiles/desktop/` |
| `profiles/desktop/backup-before-mcp-restore-20260926-165849/` | desktop app 自己留低嘅 patch 快照（仲有 `llm-pi-ai` / `llm-deepseek` row 嗰個版本） | 參考用 |
| `profiles/web/cordis.yml` / `pnpm-workspace.yaml` | web profile 骨架 | `~/.dsh/profiles/web/` |
| `.agent-presets/` | agent preset：`code` / `anchored-standard` / `liangshen` | `~/.dsh/.agent-presets/` |
| `settings.yaml.imported` | desktop app import 完 `settings.yaml` 之後留低嘅 6 條 UI namespace 快照 | `~/.dsh/settings.yaml.imported` |
| `backups/` | 關鍵改動前嘅 config 快照（desktop plugins 清空、vision-router 移除、pre-0.1.5-rc.2） | 參考用 |

## ⚠️ 兩個 profile：web vs desktop（2026-09-26 補）

DSH 有兩個 profile，**唔同 entry point 用唔同嘅**，唔好只改一邊：

| Profile | 邊個 entry point 用 | 內容 |
|---|---|---|
| `web` | `dsh web` / CLI（`npx -y @deepseek-ai/dsh web`） | base + web-app + market + dafeiyu + openviking（**vision-router 已移除 2026-09-26**） |
| `desktop` | **DSH Electron 桌面 app**（`DSH_PROFILE=desktop`） | 同上（2026-09-26 前只有 base + web-app） |

2026-09-26 發現桌面 app 跑嘅 `desktop` profile 係空殼（`package.json` dependencies 空、patch 冇任何 MCP row），
所以 `mcp__crosssession__*`、`mcp__openviking__*`、Exa search 全部唔見。
當日一度計劃「把 web profile 嗰套搬過去」，但**同日下晝用戶決定反方向走**：desktop 索性清空，唔 mount 任何 plugin。

- 清空前 backup：`~/.dsh/backups/desktop-profile-plugins-20260926-1755/`
- plugin 目錄搬去：`~/.dsh/_trash/desktop-plugins-20260926-1755/`
- 要還原舊狀態就照上面個 backup 抄返，再 restart

⚠️ 結果：**desktop app 而家係乾淨 DSH（冇 MCP / Exa / OpenViking / 肥魚 / vision-router）**。呢個係刻意，唔係壞。

改動後要**重啟 DSH app** 先生效（composition 係啟動期建立）。

**注意**：`dsh --profile desktop` 會被拒絕（`profile "desktop" is managed exclusively by the Electron application`），
所以 desktop profile 唔可以用 CLI 驗證，只可以 dump web profile 做對照。

**2026-09-26 後續（唔用 vision-router）**：兩個 profile 之後都清走咗 vision-router plugin —
desktop 因為佢個 client 半邊等 `settingsScope` service（packaged desktop frontend 冇 publish），一個 pending entry 就打斷成個 boot；
web 因為 model 本身已經有「眼睛」（見 `DSH-Setup-Guide.md` §15）。
換句話講：**睇圖靠 native 視覺（貼圖 / `read_image`）**，冇咗嘅只有像素級工具（crop / ground / pixel diff / OCR）。

## 記憶/知識庫：OpenViking（2026-08-22 起）

**記憶/知識庫已遷移去 OpenViking**（取代舊 mcp-knowledge 向量 server）：
- OpenViking server：port 1933，local embedding（bge-small-zh，CPU，唔掂 GPU）
- VLM failover：opencode-go → deepseek 官方 → POE（3 條 key 都喺 credentials.template）
- DSH plugin：`@openviking/dsh-memory-plugin`（自動 recall + capture）
- 開機自動啟動：Task Scheduler「OpenViking Server」（登入時行 start-ov-hidden.vbs → start-ov.bat）
- 完整安裝/設定見 `DSH-Setup-Guide.md` §13-14 + `knowledge/openviking/openviking-overview.md`
- **Web search**：`@deepseek-ai/dsh-web-search-exa`（pin 0.1.1-rc.2）+ `searchProvider: exa`（free tier，DSH-Setup-Guide §14）

## 🔁 2026-09-26（晚）第二次同步：repo ← live

用戶要求「check 下而家嘅 DSH 同 repo 差咩，差咩就加咩」。逐個目錄做 hash-diff 之後補齊：

**今次加咗（live 有 → repo 冇）**
- `.agent-presets/anchored-standard/`（8 檔）、`.agent-presets/liangshen/`（5 檔）
- `profiles/desktop/cordis.patch.yml` 補返最後 2 個 row：`ui-settings-general`（welcomeNoticeVersion）、`agent-default-model`（`deepseek-official` / `deepseek-flash` / effort max）
- `profiles/desktop/cordis.yml`、`pnpm-workspace.yaml`、`pnpm-lock.yaml`；`profiles/web/cordis.yml`、`pnpm-workspace.yaml`
- `profiles/desktop/backup-before-mcp-restore-20260926-165849/`（3 檔）
- `backups/`：desktop-profile-plugins-20260926-1755、my_agent_setting-mirror-desktop-before-sync-20260926-1805、web-vision-router-removal-20260926-181244、workspace-before-kevin-restore-20260917.json、pre-0.1.5-rc.2-20260912 嘅鬆散檔（跳過 104 MB 嘅 `dsh-cli/`）
- `settings.yaml.imported`（210 B）——**冇**覆蓋 repo 嘅 `settings.yaml`，佢係還原 template
- 冇另外加 `profiles/web/cordis.patch.yml`：repo 根目錄 `cordis.patch.yml` 已經係同一份，唔想兩邊 drift

**刻意唔 mirror**：`sessions/`、`storages/`、`.pnpm-store/`、`profiles/*/node_modules/`、`_trash/desktop-plugins-20260926-1755/`（209 MB）、`_trash/web-vision-router-20260926-181244/`（2.75 MB）、`.dsh-vision-router/artifacts/`（cache）、`pet.json` / `dsh-dafeiyu/layout.json` / `llm-deepseek/files-v3.json`（runtime state）

**⚠️ 仲有 gap，但 gap 喺 live 側（未郁，等用戶話事）**
1. **live web profile 揸住已撤銷嘅 Exa key** —— `~/.dsh/profiles/web/cordis.patch.yml` 個 `apiKey` 係舊 key，實測 `api.exa.ai` 回 **HTTP 401**；`.credentials.yaml` 嗰條新 key 實測 200。即係 `dsh web`（CLI）而家 Exa search 係壞嘅。修法：抄 repo 根 `cordis.patch.yml`（`!!js process.env.EXA_API_KEY`）過去。
2. **cross-session MCP server：live 版本落後** —— repo `mcp/agent-cross-session-mcp/` 有 `resolveSessionLogFile()`（自動揀 `session.v<N>.jsonl.zstd`，commit `668b38d` 2026-09-23 加），但 live 裝緊嘅 `~/Desktop/agent_cross-session_mcp/lib/session-logs.mjs` 仲係 2026-09-12 版、**唔識 v4**。live 已經有 session 寫 v4 → 嗰啲 session 對 cross-session MCP 隱形。
3. **16 個 skill 只喺 repo、live 冇**（`origin/main` merge 帶入，commit `f5988d9` / `eee8fdf`）：`aws-auth` `aws-billing-and-cost-management` `aws-compute` `aws-database` `aws-iam` `aws-networking` `aws-security` `aws-storage` `creating-production-vpc-multi-az` `launching-ec2-instance-with-best-practices` `learning-cheatsheet` `learning-compare` `learning-explain` `learning-practice` `learning-roadmap` `pretty-mermaid`。想 copy 返落 `~/.dsh/skills/` 就講聲。

⚠️ 以上 1–3 全部要郁 live（`~/.dsh/` 或 `~/Desktop/`），所以**未做**，等用戶確認。

## 安裝步驟

1. **裝 Node.js 24**（https://nodejs.org）

2. **啟動一次 DSH 生成設定目錄**：
   ```
   npx -y @deepseek-ai/dsh web
   ```
   見到 http://127.0.0.1:3080 之後 Ctrl+C 停咗佢。

3. **放 knowledge 去固定位置**（patch 預設 `C:\Users\<你>\dsh-kb\knowledge`）：
   ```
   mkdir %USERPROFILE%\dsh-kb
   xcopy /E /I knowledge %USERPROFILE%\dsh-kb\knowledge
   ```
   （如果你想用第二個位置，要改 `cordis.patch.yml` 入面 mcp-knowledge 個 args/cwd/KB_ROOT）

4. **Copy config**：
   ```
   copy /Y AGENTS.md %USERPROFILE%\.dsh\AGENTS.md
   copy /Y settings.yaml %USERPROFILE%\.dsh\settings.yaml
   copy /Y cordis.patch.yml %USERPROFILE%\.dsh\profiles\web\cordis.patch.yml
   copy /Y profiles\web\package.json %USERPROFILE%\.dsh\profiles\web\package.json
   copy /Y profiles\desktop\cordis.patch.yml %USERPROFILE%\.dsh\profiles\desktop\cordis.patch.yml
   copy /Y profiles\desktop\package.json %USERPROFILE%\.dsh\profiles\desktop\package.json
   copy /Y credentials.template.yaml %USERPROFILE%\.dsh\.credentials.yaml
   xcopy /E /I /Y skills %USERPROFILE%\.dsh\skills
   ```

5. **填 API key**：編輯 `%USERPROFILE%\.dsh\.credentials.yaml`，將 `sk-YOUR_KEY_HERE` 換成你嘅 OpenCode Zen Go key。

6. **裝 MCP server 依賴**：
   ```
   cd %USERPROFILE%\dsh-kb\knowledge\mcp-server
   npm install
   ```

7. **裝 plugins**（肥魚 / Exa / OpenViking；**唔裝 vision-router**，2026-09-26 起）：
   ```
   dsh plugin --profile web add dsh-dafeiyu @openviking/dsh-memory-plugin @deepseek-ai/dsh-web-search-exa
   ```
   （或者 `cd %USERPROFILE%\.dsh\profiles\web && pnpm install`，dependencies 已經喺 `profiles/web/package.json`）
   - `desktop` profile 係空 profile（唔 mount plugin），**唔好**將 web 嗰套 copy 過去
   - 睇圖靠 native 視覺，唔靠 plugin —— 見 `DSH-Setup-Guide.md` §15

8. **啟動 DSH**：`npx -y @deepseek-ai/dsh web`

9. **Verify**：
   - 側邊欄見到 skills 清單（104 個目錄）
   - 側邊欄放大鏡搜尋打到內容（FTS）
   - 新 session 有 `mcp__crosssession__*` 同 `mcp__openviking__*` tools

## 注意
- **唔好**將真嘅 API key 放落 zip / commit
- FTS index 同 kb-index.json 會喺第一次使用時自動重建（kb-index.json 已包埋，可以即用；如果 embed 模型未 cache 會自動 download ~30MB）
- 詳細原理睇 `DSH-Setup-Guide.md`
