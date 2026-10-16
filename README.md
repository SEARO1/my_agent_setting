# my_agent_setting — DSH 精簡鏡像

呢個 repo 鏡像 cheun 部機 **DSH desktop app** 嘅客製化設定，用嚟換機 / 還原 / 備份。

**2026-10-16 大清潔**：repo 淨低四樣 —— `skills/`、`mcp/`、`AGENTS.md`、desktop plugin 設定。
之前跟 npm package（`npx @deepseek-ai/dsh web`）嗰套 web profile 設定已經唔再 mirror，因為而家日常都用 DSH desktop app。
清走嘅嘢全部喺本機 `_trash/cleanup-2026-10-16/`（冇真刪）；已 track 過嘅仲可以喺 git history 拎返，大清潔前最後 commit：`043d1cc`。

## 內容

| 路徑 | 用途 | 還原去邊 |
|---|---|---|
| `AGENTS.md` | 用戶全域指令（每個 session 開頭自動載入） | `~/.dsh/AGENTS.md` |
| `skills/` | skills（125 個目錄，2026-10-16 對過同 live `~/.dsh/skills/` 一致） | `~/.dsh/skills/` |
| `mcp/agent-cross-session-mcp/` | cross-session MCP server 源碼（2026-10-16 對過 hash，同 live 一致） | `~/.dsh/repos/agent_cross-session_mcp/` |
| `profiles/desktop/cordis.patch.yml` | **desktop profile patch** — 裝邊啲 plugin、Exa search、AWS MCP、cross-session MCP、subagent model 清單、UI / permission 設定 | `~/.dsh/profiles/desktop/cordis.patch.yml` |
| `profiles/desktop/package.json` | **desktop profile plugin 清單**（版本 pin，即換機要裝返嘅嘢） | `~/.dsh/profiles/desktop/package.json` |

### Desktop profile 而家裝咗嘅 plugin

`dshmarket`（market，`allowRestart: false`）、`dsh-drop-caret`、`@argszero/cordis-plugin-content-exists-risk`、
`@wxg-prc-cpg/browser-skill-dsh-plugin`、`@openviking/dsh-memory-plugin`（記憶）、`@deepseek-ai/dsh-web-search-exa`（Exa，free tier）、
`@tt-a1i/archify-dsh`、`@deepseek-ai/dsh-experimental-auto-review`。

## 換機還原步驟

1. 裝 DSH desktop app，開一次，等佢生成 `%USERPROFILE%\.dsh\`
2. Skills：`xcopy /E /I /Y skills %USERPROFILE%\.dsh\skills`
3. 全域指令：`copy /Y AGENTS.md %USERPROFILE%\.dsh\AGENTS.md`
4. Desktop profile 設定：
   ```
   copy /Y profiles\desktop\cordis.patch.yml %USERPROFILE%\.dsh\profiles\desktop\cordis.patch.yml
   copy /Y profiles\desktop\package.json    %USERPROFILE%\.dsh\profiles\desktop\package.json
   ```
5. Cross-session MCP server：`xcopy /E /I /Y mcp\agent-cross-session-mcp %USERPROFILE%\.dsh\repos\agent_cross-session_mcp`
   （`cordis.patch.yml` 個 `mcp-cross-session` row 就係指呢個 path，搬去第二度要改 path）
6. 裝返 plugin — **desktop profile 唔可以用 CLI 改**（`dsh --profile desktop` 會被拒：`profile desktop is managed exclusively by the Electron application`）。
   開 desktop app → Plugin Market 逐個裝返 `package.json` 列嘅 plugin，或者喺 `%USERPROFILE%\.dsh\profiles\desktop` 直接 `pnpm install`。
7. **重啟 app**（composition 係啟動期建立，唔重啟唔生效）。
8. patch 用到嘅外部嘢：
   - Exa：`EXA_API_KEY` 放 `~/.dsh/.env`（`cordis.patch.yml` 用 `!!js process.env.EXA_API_KEY`）
   - AWS MCP：`~/.local/bin/mcp-proxy-for-aws.exe` + `~/.aws` credentials
   - OpenViking 記憶：OV server（port 1933）+ 憑證，唔喺呢個 repo

## 驗證

- 側邊欄見到 skills 清單
- 新 session 有 `mcp__crosssession__*`、`mcp__openviking__*`、`mcp__aws__*` tools
- `web_search` 用得（provider = exa）

## 注意

- **唔好** commit 真 API key（`.credentials.yaml` / `.env` 已 gitignore）
- 更新咗 skill、改咗 `AGENTS.md`、加減／升級咗 plugin（連 `cordis.patch.yml` config）→ 順手 sync 返落呢個 repo（AGENTS.md 規則 8）
