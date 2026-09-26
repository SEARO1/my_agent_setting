# # Session Log

## 2026-08-22 — OpenViking + Obsidian 可視化 + Memory 遷移

### Web search 修復
- 實測 DSH 內置 web_search 工具正常運作（Exa backend，free tier），唔再需要 fallback
- 更新 AGENTS.md 規則 4（直接用內置 web_search；Bing/DDG 降做 fallback）＋同步 `~/.dsh/AGENTS.md`
- 更新 web-research-fallback skill 定位（改做 fallback-only）

### AGENTS.md 更新
- 新增規則 11：Knowledge 由 OpenViking 自動管理（唔再手動寫 knowledge 筆記；舊筆記留低做 reference）

### OpenViking 全面檢查
- health / tree / read / glob / grep / find（semantic search）/ list_watches 全部正常
- 確認 0.4.16 係 PyPI 最新版；server 冇 relations HTTP routes（openapi.json 101 條 route 檢查）
- 已裝 package 有 graph_view.py（MemoryGraph.build_graph）— 可以 library 方式直接用

### build_graph 關係圖
- 寫 Python script 用官方 library（MemoryFileUtils + LinkRenderer + _render_graph_html）讀 AGFS 磁碟生成 memory 關係圖
- 最初 nodes=5 edges=0 → 手動加 StoredLink relations → nodes=5 edges=8
- 官方 renderer 用 unpkg CDN（offline 失效）→ 下載 vis-network.min.js（652KB）inline 落 HTML 變完全 self-contained
- 藍白黑灰 tone（TYPE_COLORS override）+ lang="zh-HK" + Microsoft JhengHei 字型
- 3D 版：3d-force-graph（1.3MB inline）→ .graph-3d.html（34 nodes，自動旋轉、拖曳互動）

### Obsidian vault 整合
- 將 OpenViking user space（~/.openviking/data/viking/default/user/default）開做 Obsidian vault
- Memory 檔加 [[wikilinks]]（6 個檔）→ Obsidian 原生 graph view 支援
- graph.json 寫入 6 組 colorGroups（藍白黑灰 tone；preferences 藍/entities 淺藍/events 白灰/identity 白/soul 灰/peers 銀灰）
- app.json language = zh-HK
- 教訓：graph.json 要喺 Obsidian 完全關閉時先寫（開住會被覆蓋）；Obsidian UI set groups 最穩陣

### 舊 KB Memory 遷移
- 真正舊 KB 喺 OneDrive/Desktop/knowledge（25 個內容 md）；OpenViking 之前只 import 咗 12 個筆記
- memory/digests/ 13 個 session 蒸餾記憶 import 入 OpenViking resources（temp_upload token 係 one-shot → 逐個 file 攞 fresh token 上傳）
- Semantic search 實測 work（搵到舊 digest 內容）

### ⚠️ 教訓：OpenViking fs/mv 唔係 rename
- fs/mv API（from_uri/to_uri）實作係 copy + recursive rm — 用嚟改名搞到 entities/ + preferences/user 成個消失！
- 已由源頭重建 11 個檔（繁體名：會話記錄/倉庫/定價與訂閱費用建議；內容繁體）+ reindex（rebuilt 20, failed 0）+ links 修正 + graph rebuild
- 結論：以後改名要小心，唔好用 fs/mv 對 directory 操作；或者直接喺磁碟 rename 再 reindex

### Obsidian 簡體 → 繁體
- OpenViking 自動生成 entity 名（例如「会话记录」）係 server 端 VLM 用簡體 — 暫時無法 config；重建檔已用繁體

### dsh-dafeiyu（BigFish pet）fix
- settings.yaml pet 段：enabled: false → true、visible: false → true（fix 死顯示；位置 size/right/bottom 已固定）
- pet.json display.visible → true
- 原因：每次開 DSH 都唔見條魚（隱藏設定）

### dsh-dafeiyu 減動態 fix（2026-08-22 續）
- activityLevel: lively → quiet（最靜）
- reducedMotion: true（減少動態效果）
- pet.enabled/visible → true（已喺上次 fix）
- 同步 settings.yaml 去 repo（agent-default-model 都更新咗做 opencode-go-vision）


## 2026-08-23 — 安裝 mattpocock/skills（全部 37 個）入 DSH

### 研究
- 睇咗 https://github.com/mattpocock/skills（Matt Pocock，Total TypeScript 作者）— agent skills 集，主打 real engineering
- 設計哲學：細、可改、可組合；user-invoked vs model-invoked 二分；CONTEXT.md shared language + ADR；grilling 流程
- 其他安裝法：Claude Code plugin（`claude plugins install mattpocock-skills`，官方 marketplace）或 `npx skills@latest add mattpocock/skills`

### 安裝（用戶指令：直接全部裝）
- Copy 全部 37 個 skill folders（engineering 18 + productivity 7 + misc 4 + in-progress 8）入 `~/.dsh/skills/`
- 零撞名；用 git openssl backend workaround clone（schannel SEC_E_NO_CREDENTIALS 問題）
- DSH 已 hot-reload：15 個 model-invoked skills 出現喺 catalog（tdd、code-review、grilling、research、prototype、diagnosing-bugs、codebase-design、domain-modeling、resolving-merge-conflicts、writing-for-agents、wizard、git-guardrails-claude-code、migrate-to-shoehorn、scaffold-exercises、setup-pre-commit）
- User-invoked skills（disable-model-invocation: true，如 grill-me、handoff、ask-matt、to-spec、to-tickets、triage、wayfinder、implement、teach、wait-what 等 22 個）按設計唔會俾 model 自動調用
- Sync 去 my_agent_setting mirror（skills/ +37 folders）
## 2026-09-10 — Repo 同步（settings.yaml + cordis.patch.yml + skill inventory）

### 同步內容（live `~/.dsh` → repo）
- `settings.yaml`：由 live 覆蓋（repo 版停留喺 2026-09-09）。差異：`agent-presets.default: standard → ptc`、`agent-default-model: deepseek-v4.1-flash-expires-on-0910 → deepseek-v4-flash`（provider 仍 deepseek-official）、新增 `ui-chat.transcriptView: normal`
- `cordis.patch.yml`：repo 版落後（只得 Exa 3 段）；改用 live `profiles/web/cordis.patch.yml` 內容
  - 新增 `attachment-local` 放寬圖片限制（maxImageDimension 4096）+ 12 個 `ui-skin-*: disabled` 段 + OpenViking 註解
  - ⚠️ live 檔硬編碼咗真 EXA key；repo 版 sanitize 做 `!!js process.env.EXA_API_KEY`，path 保持 portable（`process.env.USERPROFILE`）。查過 git history 冇 leak 過真 key
- `skills/`：548 個檔案 hash 全部一致，只有 `web-research-fallback/SKILL.md` 唔同 → **repo 版較新**（live 版仲係「web_search 冇 key、一律用 Bing fallback」舊版本，同 AGENTS.md 規則 4 矛盾，待同步返 live）
- `.agent-presets/code`、`repairs/*`：一致
- live 另有 `.agent-presets/anchored-standard`（8 檔）、`liangshen`（5 檔）未 mirror；`knowledge/` 已 gitignore（規則 11）

### Skill inventory（103 個）
- `~/.dsh/skills/`：103 個 skill folder、548 個檔案；80 個 model-invocable、23 個 user-only（`disable-model-invocation: true`）
- 來源 pack：mattpocock/skills 37、n8n 16、superpowers 系 14、Claude Code plugin 開發系 ~12、Supabase 系 5、DSH 自製 3（dsh-internals / memory-distill / web-research-fallback）、單件（diagram-design、agent-code-review、cardputer-buddy、m5-onboard 等）
## 2026-09-10 — Vision 修復：agent 直接睇圖（deepseek-flash 原生 multimodal）

### 問題
- 用戶貼圖，agent 完全睇唔到：`vision_describe` 回 `vision tools are disabled in the Vision Router settings`（live settings 係 `vision-router.tool: false`）
- 開返 tool 之後仍然全 fail：內建免費視覺鏈（OVH 匿名端點 5 個 model）全數 `429 rate limit`

### 根因（查官方文檔後確認）
- DeepSeek 官方 `deepseek-flash`（= agent 默認 model）**本身支援圖像理解**；但 `settings.yaml` 手動列咗 `llm-deepseek.models` 又冇聲明 `inputModalities` → DSH 一律當純文本，貼圖送出前已被拒（DSH 文檔明講：手動輸入嘅 model 自己聲明之前一律按純文本對待）
- `freeCloudFirst: true` + OVH 免費端點（每 IP / model / 分鐘 2 次）長期 429，會食晒 45s vision task budget → 付費 backend 永遠輪唔到，症狀係「所有 backend unavailable」

### 改動（`~/.dsh/settings.yaml`）
- `vision-router.tool: false → true`
- `llm-deepseek.models` 嘅 `deepseek-flash` 加 `inputModalities: [text, image]`；刪走已下線嘅 `deepseek-v4-flash-vision-exp`（官方：舊名會 route 去最新 Flash）
- `vision-router.freeCloudFirst: false`；`providers` 改成 `deepseek-official/deepseek-flash`（fallback `deepseek-v4-pro`）→ `vision-http/ovh` 兜底
- 改動前備份：`~/.dsh/_trash/settings-before-vision-enable-20260910.yaml`

### 驗證（實測，唔係「應該得」）
- 生成已知內容測試圖 → 直接打 `api.deepseek.com`（394 tokens ≈ 0.001 元）→ 回 `PINEAPPLE-42` ✅
- `read_image` 同一張圖 → agent 真係讀到圖入面嘅字 ✅
- 用戶貼 DSH Web GUI 截圖 → agent 讀到 token 數字 / session 名等細節 ✅

### 同步
- `settings.yaml` → repo（同 live hash 一致）；`DSH-Setup-Guide.md` 新增 §15 + §11 步驟 7 加註




## 2026-09-11 — 修復 pi-ai session header（opencode-go 400 MissingSessionID）

### 症狀
- vision-router 睇圖完全失敗：第一個 provider `opencode-go/qwen3.7-plus` 回 400 `MissingSessionID`（"Request is missing x-opencode-session"），fallback 落 plugin 內建免費 OVH chain 又全部 429 rate limit。
- 查實：live install 嘅 `dsh-llm-pi-ai/lib/index.js` **未 patch**（`function requestHeaders(headers)` 原裝 signature）。即係 repo 2026-09-09 嗰個 repair 一直未 apply 落部機。

### 直接 probe opencode Go gateway（實測，2026-09-11）
URL `https://opencode.ai/zen/go/v1/chat/completions`，model `qwen3.7-plus`，除咗 session header 之外其他一樣：

| request header | 結果 |
|---|---|
| （無 session header） | 400 MissingSessionID |
| `x-deepseek-harness-session-id: test-xxxxxxxx` | **200 OK** |
| `x-opencode-session: test-xxxxxxxx` | 200 OK |
| `x-session-affinity: test-xxxxxxxx` | 400 MissingSessionID |

→ opencode Go 只係要「有 session header 做 routing」，DSH 自己個 `x-deepseek-harness-session-id` 一樣收貨。
→ pi-ai 內建嘅 session affinity header 只有 `x-session-id`（openrouter）/ `session_id` / `x-client-request-id` / `x-session-affinity`（`compat.sendSessionAffinityHeaders`），冇 opencode 用嘅名，所以一定要靠 patch 補。

### 做咗嘅嘢
- `node repairs/apply-session-header.mjs <path>`（兩個 copy：`~/.dsh/profiles/node_modules/@deepseek-ai/dsh-llm-pi-ai/lib/index.js` 同 nested 一份，其實同 `C:\Users\cheun\AppData\Roaming\npm\node_modules\@deepseek-ai\dsh\...` 係同一條 hardlink）
- `node repairs/verify-session-header.mjs <path>` → PASS（per-session header、無 session id 時唔會亂作、case-insensitive collision、custom header 保留、call site 正確）
- 未 patch 版本 backup 咗去 `_trash/pi-ai-session-header-20260909/index.js`

### 注意
- **DSH 要重啟先生效**（adapter module 開機已經 import 咗入 memory）。
- vision-router 係行 `ctx.llm.stream()` → 同一個 pi-ai adapter，所以呢個 patch 同時修好 opencode-go 嘅 chat 同 vision。

## 2026-09-15 — Exa key 洩漏處理 + 完成卡住咗嘅 merge

### Exa API key 洩漏（public repo）
- 發現 `SEARO1/my_agent_setting`（**public**）嘅 `origin/main:cordis.patch.yml` 有真 Exa key 明文（commit `4173d34` 引入），raw URL 實測直接讀得到
- 部機另有 3 份 copy：Windows User env `EXA_API_KEY`、`~/.dsh/.credentials.yaml`、`~/.dsh/.env`；repo working tree 都有一份（merge 帶入）
- 用戶喺 dashboard.exa.ai 開新 key 並撤銷舊 key；用 `~/.dsh/rotate-exa-key.ps1` 更新（SecureString 輸入，唔會入 session transcript）
- 實測：舊 key → HTTP 401（已撤銷）、新 key → HTTP 200。舊 key 已死，public history 嗰份唔再構成風險
- ⚠️ 要重啟 DSH 先用到 web_search（running process 仍揸住舊 env，實測回 Invalid API key）

### Merge 收尾（local 8 vs origin/main 7 commits，兩邊都做咗 cross-session MCP）
- `settings.yaml`：取 ours（同 live `~/.dsh/settings.yaml` 完全一致）
- `cordis.patch.yml`：以 live 版為準重建（portable `process.env.USERPROFILE`、`!!js process.env.EXA_API_KEY`）
  - 丟棄 remote 版嘅硬編碼 `C:\Users\cheun\...` 路徑、明文 Exa key、指向 `OneDrive\Desktop\agent_cross-session_mcp`
  - 丟棄 remote 版 12 個 `ui-skin-*: disabled`（live 冇裝 dsh-skin，呢部機用唔著）
  - AWS MCP block 唔 mirror（machine-local；live 有註解 + user decision 2026-09-15），只留低指向 live 嘅註解
- 保留 remote 帶入嘅 `mcp/agent-cross-session-mcp/`（server + lib + test + install script）同 `skills/cross-session/`
- 未 push（用戶自己 push）

## 2026-09-26 — 移除 vision-router（靠 native 視覺）

### 決定
- 用戶拍板唔要 vision-router：「而家都有眼睛了」—— DeepSeek `deepseek-flash` 本身支援圖像理解，唔想再靠 plugin 嘅視覺鏈

### 改咗嘅嘢（repo）
- `settings.yaml`：刪走成個 `vision-router:` block（onboardingSeen / tool / freeCloudFirst / providers chain）
- `README.md`：`settings.yaml` 用途、web profile 內容、裝 plugin 步驟都唔再提 vision-router；補一段 2026-09-26 後續說明（兩個 profile 都唔用）
- `DSH-Setup-Guide.md`：§15 標題改成「2026-09-26 起唔用 vision-router」；§15.2 只留 `llm-deepseek` 嘅 `inputModalities: [text, image]`（呢個先係「眼睛」）；舊 vision-router 設定 / backend chain / 坑 全部降格做 history，新增 §15.7「想裝返」步驟
- `profiles/desktop/cordis.patch.yml`：本身已經冇 mount vision-router（同日早啲已經清空 desktop plugins）

### 保留 / 代價
- 睇圖：native（貼圖 / `read_image`）繼續 work，唔靠 plugin
- 冇咗：`vision_crop` / `vision_ground` / `vision_pixel_diff` / `vision_ocr` 呢啲像素級工具
- live 都拆埋（18:12）：`~/.dsh/profiles/web/package.json` 移走 dsh-vision-router，plugin 目錄搬去 `~/.dsh/_trash/web-vision-router-20260926-181244/`，backup 喺 `~/.dsh/backups/web-vision-router-removal-20260926-181244/`
- **要 restart DSH 先生效**（今個 session 仲有 vision_* tools，因為 plugin 已經 load 咗入 memory）

### 順手發現（唔係今次改動造成）
- live `~/.dsh/settings.yaml` 今日 17:50 被 desktop app import，縮到淨返 3 條 key（locale / ui-theme / ui-conversation）：
  opencode-go / POE providers、`llm-deepseek` 嘅 deepseek-flash 圖片聲明（即「眼睛」）**全部唔喺 live 了**
  → 完整版只剩 repo `settings.yaml`；`~/.dsh/settings.yaml.imported` 只有 6 條 UI namespace
  → 用戶決定暫時唔還原 live settings.yaml（自己想睇清楚先）

## 2026-09-26（晚）—— 第二次同步：repo ← live（desktop profile 為準）

### 起點
- 用戶：「check 下而家 deepseek harness 同呢個 repo 差啲咩，差咩就加咩」，並提醒**而家係 desktop app 版，唔係 web 版**
- 逐個目錄 hash-diff（live `~/.dsh` ↔ repo），分類：真差異 / 只係 CRLF-LF / 刻意 sanitize / runtime state

### 補咗落 repo（live 有 → repo 冇）
- `.agent-presets/anchored-standard/`（8）+ `liangshen/`（5）
- `profiles/desktop/cordis.patch.yml`：補 `ui-settings-general` + `agent-default-model`（deepseek-official / deepseek-flash / max）
- `profiles/desktop/{cordis.yml,pnpm-workspace.yaml,pnpm-lock.yaml}`、`profiles/web/{cordis.yml,pnpm-workspace.yaml}`
- `profiles/desktop/backup-before-mcp-restore-20260926-165849/`（3 檔）
- `backups/` 5 份細快照（跳過 104 MB `dsh-cli/` 同 `.credentials.yaml`）
- `settings.yaml.imported`（repo 嘅 `settings.yaml` 冇郁 —— 佢係還原 template）

### 冇加（避免 drift / 冇用）
- `profiles/web/cordis.patch.yml`：同 repo 根 `cordis.patch.yml` 內容一樣（只差 Exa key），唔整兩份
- 16 個只喺 repo 嘅 skill 冇刪（用戶規則：唔好刪嘢）
- runtime state：sessions / storages / .pnpm-store / node_modules / _trash 大檔 / .dsh-vision-router artifacts

### 對照中嘅真差異（live 側，未改，等用戶話事）
1. **live web patch 個 Exa key 已死** —— 實測舊 key HTTP 401、credentials 新 key HTTP 200 → `dsh web` 而家 Exa search 壞
2. **cross-session MCP live 版唔識 session.v4** —— repo 版有 `resolveSessionLogFile()`（`668b38d`），live `~/Desktop/agent_cross-session_mcp` 仲係 09-12 舊版
3. **16 個 skill 唔喺 live** —— `aws-*` / `learning-*` / `pretty-mermaid`（merge 帶入）
4. （known）live `settings.yaml` 已經被 desktop app import 到淨返 3 條 key，完整版只剩 repo

### 其他觀察
- `AGENTS.md`、`skills/memory-distill/SKILL.md`、`profiles/web/package.json` 嘅 hash 差異全部係 CRLF/LF 或尾行 `\n`，內容一致
- 同一個 workspace 有另外 2 個 session（`a5a94bd2` / `d6636351`，最後寫入 18:15），寫檔前後都要留意撞車

