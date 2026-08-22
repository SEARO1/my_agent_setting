# dsh-setup-bundle — 另一部機 DSH 一鍵設定包

呢個 bundle 包含 cheun 部機 DSH 嘅完整客製化設定。以下係喺**新裝置**重現嘅步驟。

## 內容

| 檔 | 用途 | 放邊 |
|---|---|---|
| `AGENTS.md` | 用戶全域指令（每個 session 自動載入） | `~/.dsh/AGENTS.md` |
| `settings.yaml` | 模型/provider 設定 | `~/.dsh/settings.yaml` |
| `cordis.patch.yml` | Profile patch（FTS/OpenViking） | `~/.dsh/profiles/web/cordis.patch.yml` |
| `credentials.template.yaml` | API key 模板（OPENCODE+POE+DEEPSEEK+EXA） | `~/.dsh/.credentials.yaml` |
| `ov.conf.template` | OpenViking server 設定模板 | `~/.openviking/ov.conf` |
| `start-ov.bat.template` / `start-ov-hidden.vbs.template` | OpenViking 啟動 + 隱藏 launcher 模板 | `~/.openviking/` |
| `skills/` | 65 個 skills | `~/.dsh/skills/` |
| `knowledge/` | 知識庫（已遷移 OpenViking，保留備份） | `<USERPROFILE>/dsh-kb/knowledge/` |
| `DSH-Setup-Guide.md` | 完整說明文件 | 自己睇 |

## 記憶/知識庫：OpenViking（2026-08-22 起）

**記憶/知識庫已遷移去 OpenViking**（取代舊 mcp-knowledge 向量 server）：
- OpenViking server：port 1933，local embedding（bge-small-zh，CPU，唔掂 GPU）
- VLM failover：opencode-go → deepseek 官方 → POE（3 條 key 都喺 credentials.template）
- DSH plugin：`@openviking/dsh-memory-plugin`（自動 recall + capture）
- 開機自動啟動：Task Scheduler「OpenViking Server」（登入時行 start-ov-hidden.vbs → start-ov.bat）
- 完整安裝/設定見 `DSH-Setup-Guide.md` §13-14 + `knowledge/openviking/openviking-overview.md`
- **Web search**：`@deepseek-ai/dsh-web-search-exa`（pin 0.1.1-rc.2）+ `searchProvider: exa`（free tier，DSH-Setup-Guide §14）

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
   copy /Y credentials.template.yaml %USERPROFILE%\.dsh\.credentials.yaml
   xcopy /E /I /Y skills %USERPROFILE%\.dsh\skills
   ```

5. **填 API key**：編輯 `%USERPROFILE%\.dsh\.credentials.yaml`，將 `sk-YOUR_KEY_HERE` 換成你嘅 OpenCode Zen Go key。

6. **裝 MCP server 依賴**：
   ```
   cd %USERPROFILE%\dsh-kb\knowledge\mcp-server
   npm install
   ```

7. **裝 vision-router plugin**（圖片識圖用，config 已喺 settings.yaml）：
   ```
   dsh plugin --profile web add dsh-vision-router
   ```

8. **啟動 DSH**：`npx -y @deepseek-ai/dsh web`

9. **Verify**：
   - 側邊欄見到 53 個 skills
   - 側邊欄放大鏡搜尋打到內容（FTS）
   - 新 session 問 agent「kb_status」確認 MCP 連到

## 注意
- **唔好**將真嘅 API key 放落 zip / commit
- FTS index 同 kb-index.json 會喺第一次使用時自動重建（kb-index.json 已包埋，可以即用；如果 embed 模型未 cache 會自動 download ~30MB）
- 詳細原理睇 `DSH-Setup-Guide.md`
