# dsh-setup-bundle — 另一部機 DSH 一鍵設定包

呢個 bundle 包含 cheun 部機 DSH 嘅完整客製化設定。以下係喺**新裝置**重現嘅步驟。

## 內容

| 檔 | 用途 | 放邊 |
|---|---|---|
| `AGENTS.md` | 用戶全域指令（每個 session 自動載入） | `~/.dsh/AGENTS.md` |
| `settings.yaml` | 模型/provider 設定 | `~/.dsh/settings.yaml` |
| `cordis.patch.yml` | Profile patch（FTS/MCP） | `~/.dsh/profiles/web/cordis.patch.yml` |
| `credentials.template.yaml` | API key 模板（填你嘅 key） | `~/.dsh/.credentials.yaml` |
| `skills/` | 53 個 skills | `~/.dsh/skills/` |
| `knowledge/` | 知識庫 + MCP server + scripts | `<USERPROFILE>/dsh-kb/knowledge/` |
| `DSH-Setup-Guide.md` | 完整說明文件 | 自己睇 |

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
