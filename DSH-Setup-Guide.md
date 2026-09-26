# DSH Complete Setup Guide（2026-08-16）

呢份文件完整記錄 cheun 部機嘅 DSH（DeepSeek Harness）設定，用嚟喺另一部機重現同一套環境。配合 dsh-setup-bundle.zip 使用。

---

## 1. 總覽：我哋起咗啲咩

```
┌─ L0: ~/.dsh/AGENTS.md         永久指令（每 session 自動載入）
├─ L1: Desktop/knowledge/        結構化知識庫（Markdown）
├─ L2: ~/.dsh/skills/            54 個 skills（3 個自訂 + 51 個生態）
├─ L3: Session FTS               SQLite FTS5 全文搜尋（UI 側邊欄）
└─ L3.5: MCP 向量 server         mcp__knowledge__kb_search（本地 bge-small-zh 語義搜尋）
```

全部本地、零額外 API key（用返 OpenCode Zen Go 一個 key 搞掂 chat + vision）。

---

## 2. 基礎安裝

- **要求**：Node.js ≥ 22.2（用咗 node:zlib zstd + node:sqlite，Node 24 實測 OK）
- **啟動**：`npx -y @deepseek-ai/dsh web`（首次自動初始化 web profile）
- **預設地址**：http://127.0.0.1:3080（`--port` 可改）
- **設定目錄**：`~/.dsh/`（即 `C:\Users\<user>\.dsh`）

## 3. API Key（最重要）

DSH 有兩條路：
1. **官方 DeepSeek**：`DEEPSEEK_API_KEY`（平台開戶充值）— 我哋**冇用**呢條
2. **OpenCode Zen Go**（我哋用緊）：`OPENCODE_GO_API_KEY`（opencode.ai 攞 key）

**Key 存放**：`~/.dsh/.credentials.yaml`：
```yaml
OPENCODE_GO_API_KEY: sk-xxxx（唔好 commit / 唔好放落 zip 入面俾人）
```

**注意**：OpenCode Zen Go **冇 embeddings endpoint**（404），所以向量搜尋要用本地模型（見 §8）。

## 4. settings.yaml（模型/provider 設定）

位置：`~/.dsh/settings.yaml`（web Models 頁面寫入，熱更新唔使 restart）

```yaml
locale:
  preference: en
agent-presets:
  default: code
llm-pi-ai:
  providers:
    opencode-go:
      models:
        - id: minimax-m3
        - id: qwen3.7-max
        - id: deepseek-v4-flash   # 主力
        - id: deepseek-v4-pro
        - id: glm-5.2
        - id: kimi-k3             # vision 用
      apiKeyEnv: OPENCODE_GO_API_KEY
agent-default-model:
  provider: opencode-go          # 默認文字 model（純文字）
  model: deepseek-v4-flash
  reasoningEffort: max
vision-router:
  providers:
    - provider: opencode-go
      model: kimi-k3             # 視覺路由：圖片用 Kimi K3 睇（UI 設定寫入）
# 注意：官方 llm-deepseek route 冇 override — 冇 DEEPSEEK_API_KEY 用唔到
# 貼圖時揀 model picker 嘅「opencode-go + Auto Vision」group（plugin 自動生成）
```

## 5. cordis.patch.yml（profile patch — 所有客製化喺度）

位置：`~/.dsh/profiles/web/cordis.patch.yml`

改咗 2 樣嘢：
1. **session-query-sqlite** → 開 FTS 全文搜尋（`openAt: first-search` + 持久 path）
2. **mcp-knowledge**（insert 新 row）→ MCP 向量 server

**vision-router 唔喺 patch**：plugin 用 `dsh plugin --profile web add dsh-vision-router` 安裝（bundle patch 自動 mount row），設定喺 `settings.yaml` 嘅 `vision-router:` section（UI：Settings → Plugins → Plugin config → 視覺路由）改，例如 `providers: [{ provider: opencode-go, model: kimi-k3 }]`（圖片用 Kimi K3 睇）。

**唔再做嘅嘢**：官方 `llm-deepseek` route 冇再 hack 去 OpenCode Zen；vision backend 亦唔再用 `httpProviders`（之前喺 patch 度 hardcode）。

**⚠️ Patch 語法（三個形式，好重要）**：
```yaml
# 1. Override 現有 row（row 一定要存在，例如 base bundle 有）
- id: vision-router
  config: { ... }

# 2. 停用
- id: some-row
  disabled: true

# 3. 建立新 row（新增嘅一定要用呢個！）
- insert:
    - id: mcp-knowledge
      name: '@deepseek-ai/dsh-mcp-client'
      config: { ... }
```

**教訓**：新 row 用 `- id:` override 形式會靜雞雞冇咗（無 error 無 log）。

完整內容見 bundle 內 `cordis.patch.yml`。

## 6. AGENTS.md（用戶全域指令）

位置：`~/.dsh/AGENTS.md`（每個 session 自動載入，maxBytes 65536）

內容包括：溝通偏好（廣東話/casual/TL;DR）、工作規則（改檔前確認、唔刪嘢、大動作開 todo、**唔用內置 web_search**）、技術環境備忘。完整內容見 bundle。

## 7. Skills（54 個）

位置：`~/.dsh/skills/<name>/SKILL.md`（watcher 自動發現，即時入 catalog）

- **自訂 3 個**：
  - `dsh-internals` — DSH 內部機制地圖（cordis、套件、AGENTS.md、session log 格式）
  - `web-research-fallback` — 上網 fallback（pwsh+Bing，因為內置 web_search 冇 key）
  - `memory-distill` — session 蒸餾流程（舊對話 → knowledge/memory/）
- **生態 51 個**：superpowers 系列（brainstorming、writing-plans、systematic-debugging...）+ 其他（diagram-design、skill-creator、session-report、receipts...）
- 仲有 3 個 flat .md skills（implement-auth、manage-sessions、secure-routes）

格式：frontmatter `name`（kebab-case）+ `description`（必填，觸發條件）+ 可選 `whenToUse`。

## 8. MCP 向量 server（L3.5）

位置：`Desktop/knowledge/mcp-server/`

- `server.mjs` — MCP server（3 個 tools）
- `index.mjs` — index builder
- `kb-index.json` — 向量索引（12 files / 41 chunks / dim 512）
- Embedding：**本地** `Xenova/bge-small-zh-v1.5`（transformers.js ONNX，~30MB，零 API key）

Tools（模型直接 call）：
- `mcp__knowledge__kb_search(query, k?)` — 語義搜尋
- `mcp__knowledge__kb_reindex` — 重建索引（加咗知識之後行）
- `mcp__knowledge__kb_status` — 索引狀態

**新裝置 setup**：`cd knowledge/mcp-server && npm install`（裝 @modelcontextprotocol/sdk + @xenova/transformers）。第一次 reindex 會自動 download 模型（~30MB）。

## 9. Session FTS（L3）

- Patch：`session-query-sqlite` row → `openAt: first-search` + `path: <user>/.dsh/storages/session-fts.sqlite`
- 效果：Web UI 側邊欄搜尋框（放大鏡 icon）可以搜對話**內容**（唔止標題）
- Index 喺第一次搜尋時建立；live session 完結先 sync
- 直接查：開 SQLite 睇 `persisted_docs` FTS5 table

## 10. 知識庫 + 蒸餾

- `Desktop/knowledge/` — 7 篇主題文章 + memory/ 蒸餾筆記 + scripts/
- `distill-sessions.mjs` — 解壓 session logs（node:zlib 內建 zstd）→ digests
- 流程：`node knowledge/scripts/distill-sessions.mjs` → 讀 digests → 寫 memory 筆記 → update index.md

## 11. 另一部機 setup 步驟（快速版）

1. 裝 Node 24
2. 解壓 `dsh-setup-bundle.zip` 去 `%USERPROFILE%/`
3. `npx -y @deepseek-ai/dsh web`（首次啟動，生成 `~/.dsh`）
4. 喺 web Models 頁面填 OpenCode Zen Go key（或者直接寫 `~/.dsh/.credentials.yaml`）
5. Copy bundle 入面嘅：
   - `AGENTS.md` → `~/.dsh/AGENTS.md`
   - `settings.yaml` → `~/.dsh/settings.yaml`
   - `skills/*` → `~/.dsh/skills/`
   - `cordis.patch.yml` → `~/.dsh/profiles/web/cordis.patch.yml`（**記住改入面啲路徑**）
   - `knowledge/` → 你揀嘅位置（預設 `Desktop/knowledge`；唔同位置要改 mcp-knowledge 個 cwd/args 同 KB_ROOT）
6. `cd knowledge/mcp-server && npm install`
7. 裝 vision-router plugin：`dsh plugin --profile web add dsh-vision-router`（像素級視覺工具：crop / pixel diff / ground / OCR）。**純睇圖唔靠佢** —— 見 §15：`deepseek-flash` 喺 `settings.yaml` 聲明咗 `inputModalities: [text, image]` 就識睇圖
8. Restart DSH，verify：
   - Skills 喺 catalog 見到
   - 側邊欄放大鏡搜尋到內容（FTS）
   - `mcp__knowledge__kb_status` 用到（MCP）

## 12. 唔好做嘅嘢（教訓）

- 唔好用 DSH 內置 `web_search`（要 DEEPSEEK_API_KEY，我哋冇）
- 新 MCP row 一定要用 `insert:`
- `new URL().pathname` 喺 Windows 會變 `/C:/...` — 用 `fileURLToPath`
- transformers.js batch embedding 返回 [n, dim] tensor — 要用 `.tolist()` 拆行，唔好 `Array.from(data)`
- OpenCode Zen Go 冇 /embeddings — 本地模型先得

---

# 13. OpenViking 記憶系統（2026-08-22 起，取代舊 MCP 向量 server）

詳細研究記錄：knowledge/openviking/openviking-overview.md。

## 13.1 安裝（新裝置）

1. Python 3.10+（實測 3.13）：pip install openviking + openviking[local-embed]
2. Config ~/.openviking/ov.conf
3. ~/.openviking/ovcli.conf = JSON 格式！{"url":"http://127.0.0.1:1933"}（新版要 JSON，YAML 會 parse 失敗）
4. 開 server：~/.openviking/start-ov.bat（set 3 條 key env）
5. 驗證：openviking-server doctor

## 13.2 ov.conf 模板（3-provider VLM failover）

~/.openviking/ov.conf 用 credentials array，index 0 最高優先：
1. opencode-go → https://opencode.ai/zen/go/v1 → deepseek-v4-flash
2. deepseek 官方 → https://api.deepseek.com/v1 → deepseek-chat
3. POE → https://api.poe.com/v1 → DeepSeek-V4-Flash

**重點坍**：ov.conf 用 env var 展開，但只有 server process 環境有單個 env var 先展開到。一定要用 start-ov.bat（set 齊 3 條 key）開 server，否則變空 → 401。
Failover 行為：401/403/429/5xx 自動 fallback 下一個 credential；400/content-safety fail-fast。約 10 分鐘後試跳返高優先級。

## 13.3 start-ov.bat + 開機自動啟動

- ~/.openviking/start-ov.bat：set OPENCODE_GO_API_KEY / DEEPSEEK_API_KEY / POE_API_KEY → 開 openviking-server
- ~/.openviking/start-ov-hidden.vbs：隱藏視窗 launcher
- Task Scheduler「OpenViking Server」：At logon，Run As 自己 user（唔使 admin）

建立 task（PowerShell）：
schtasks /create /tn "OpenViking Server" /tr "wscript.exe C:\Users\<you>\.openviking\start-ov-hidden.vbs" /sc onlogon /rl limited /f

## 13.4 DSH 接入

1. 裝 plugin（web profile）：dsh plugin --profile web add @openviking/dsh-memory-plugin
2. 重啟 DSH → 新 session 有 mcp__openviking__* tools + openviking-memory skill + 自動 recall 注入
3. cordis.patch.yml：舊 mcp-knowledge 已 disabled（遷移去 OpenViking）

## 13.5 知識庫遷移

- 舊 Desktop/knowledge/ 內容全數 import 入 OpenViking（resources/knowledge 樹下）
- 舊 KB + mcp-server 保留（哲 delete），只在 cordis.patch.yml disable 哲
- 新知識寫入：用 OpenViking MCP tools（remember / add_resource），或照舊寫 knowledge/ 再 import

---

# 14. Exa Web Search（2026-08-22 起，DSH 預設 web_search provider）

## 14.1 背景

DSH 嘅 web_search 用「web capability seam」（ctx.web）：`dsh-tool-web` 提供 `web_search`/`web_fetch` tools，實際搜尋由註冊嘅 provider 做。預設得 `dsh-web-search-deepseek`（每次 = 一次完整 DeepSeek model call，貴）。Exa 係專用 SERP API（free tier $20 開戶 + $10/月），一次 search ~$0.007，平好多。

## 14.2 裝（新裝置）

⚠️ 一定要 pin 0.1.1-rc.2！npm latest 標籤指住 0.0.1-rc.1（壞版，import 未 publish 嘅 @deepseek-ai/dsh-environment）

```bash
dsh plugin --profile web add @deepseek-ai/dsh-web-search-exa@0.1.1-rc.2
```

## 14.3 加 API key

註冊 https://exa.ai（free tier），攞 API key，放入 ~/.dsh/.credentials.yaml：

```yaml
EXA_API_KEY: 你嘅 key
```

## 14.4 Patch（cordis.patch.yml）

```yaml
- insert:
    - id: web-search-exa
      name: '@deepseek-ai/dsh-web-search-exa'
      config:
        apiKey: !!js process.env.EXA_API_KEY   # 或者寫真 key
        searchType: auto
- id: web
  config:
    searchProvider: exa   # 因為 deepseek + exa 兩個 provider 都在，唔 pin 會 WEB_PROVIDER_AMBIGUOUS
```

## 14.5 驗證

1. `dsh --profile web --dump-config` 見到 web-search-exa row + searchProvider: exa
2. 重啟 DSH
3. 新 session 叫 web_search → 應該返 Exa sources
4. Provider 直接測試（modules 層面）：import { ExaSearchProvider } from "@deepseek-ai/dsh-web-search-exa" → new ExaSearchProvider({ apiKey, searchType: "auto" }) → await p.search({ query, maxResults })

## 14.6 坑

- npm latest = 0.0.1-rc.1 壞版：import @deepseek-ai/dsh-environment（未 publish）→ ERR_MODULE_NOT_FOUND。一定要 pin @0.1.1-rc.2（改用 dsh-launch-environment）。
- 兩個 provider 同時註冊但冇 pin → WEB_PROVIDER_AMBIGUOUS。
- DeepSeek search provider 留作 fallback（web-search-deepseek row 唔使刪）。

---

# 15. Vision：agent 直接睇圖（2026-09-10）

> **結論先講**：唔使靠 vision-router 嘅免費視覺鏈 —— DeepSeek 官方 `deepseek-flash`（即 agent 默認 model）**本身就支援圖像理解**。之前睇唔到圖，純粹係 `~/.dsh/settings.yaml` 冇幫佢聲明圖片能力：DSH 對「手動輸入嘅 model」一律當純文本，貼圖會喺送出前被拒，並點名該 model。

## 15.1 官方依據

| 來源 | 重點 |
|---|---|
| [DeepSeek 圖像理解](https://api-docs.deepseek.com/zh-cn/guides/vision) | `deepseek-flash` 支援圖片輸入（base64 data URL / 公開 URL / Files API）；舊名 `deepseek-v4-flash-vision-exp` 仍可調用但**已下線**，會 route 去最新 Flash |
| [DeepSeek 模型 & 價格](https://api-docs.deepseek.com/zh-cn/quick_start/pricing) | `deepseek-flash` ＝ V4.1-Flash，**圖像理解：支持**；`deepseek-v4-pro` **唔支持**（且 2026-09-14 後 V4 Pro 請求會 route 去 V4.1 Flash） |
| [DSH 配置模型](https://deepseek-harness.github.io/deepseek-harness/guide/providers) | 「手動輸入的模型在自己聲明之前一律按純文本對待」→ 要喺 `settings.yaml` 幫該 model 加圖片輸入聲明 |

## 15.2 settings.yaml 要改嘅三處

```yaml
# (1) 官方 DeepSeek route：deepseek-flash 聲明食圖（llm-deepseek 用 inputModalities）
llm-deepseek:
  models:
    - id: deepseek-flash
      name: DeepSeek-V4.1-Flash
      inputModalities:
        - text
        - image        # ← 呢行就係「眼睛」；冇佢 = 貼圖即被拒

# (2) 開返 vision_* 工具集（crop / ground / pixel diff / OCR …）
vision-router:
  onboardingSeen: true
  tool: true           # false = 所有 vision_* 工具直接 throw「vision tools are disabled」
  freeCloudFirst: false  # true = 免責 OVH 免費鏈行先，長期 429 會食晒 45s budget

# (3) 視覺 backend 鏈：官方 Flash 行先，OVH 免費做兜底
  providers:
    - provider: deepseek-official
      model: deepseek-flash
      fallbacks:
        - deepseek-v4-pro
    - provider: vision-http
      model: ovh/Qwen3.5-397B-A17B
      fallbacks: []
```

## 15.3 新機步驟

1. Copy `settings.yaml`（上面三處已包含）；`.credentials.yaml` 要有 `DEEPSEEK_API_KEY`
2. （可選）`dsh plugin --profile web add dsh-vision-router` —— 只係為咗 `vision_crop` / `vision_pixel_diff` / `vision_ground` 呢啲像素級工具；**純睇圖唔需要**
3. 熱更新即可，唔使 restart（settings 改完下一個 request 生效）
4. 驗證：開新 session 直接貼圖

## 15.4 點驗證（我哋實測過）

- **Agent 側**：叫 agent `read_image` 一張已知內容嘅圖，讀得到入面嘅字就代表通
- **API 側 smoke test**（唔經 DSH，最快知 key + model 得唔得）：

```powershell
$key = (Select-String -Path "$env:USERPROFILE\.dsh\.credentials.yaml" -Pattern '^\s*DEEPSEEK_API_KEY:\s*(\S+)').Matches[0].Groups[1].Value
$b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\path\to\image.png'))
$body = @{ model='deepseek-flash'; max_tokens=512; messages=@(@{ role='user'; content=@(
  @{type='text'; text='圖中嘅字係咩？'}, @{type='image_url'; image_url=@{ url="data:image/png;base64,$b64" }}
)}) } | ConvertTo-Json -Depth 12
(Invoke-RestMethod -Uri 'https://api.deepseek.com/chat/completions' -Method Post `
  -Headers @{ Authorization="Bearer $key" } -ContentType 'application/json' -Body $body).choices[0].message.content
```

## 15.5 成本（窮鬼參考）

- 圖片當 token 計：一張 600×400 細圖 ≈ **235 prompt tokens**
- `deepseek-flash` 輸入：空閒 **1 元 / 百萬 tokens**（高峰 2 元）；輸出：空閒 4 元（高峰 8 元）
- 高峰時段 = 北京時間**週一至五 09:00–12:00、14:00–18:00**，其餘半價
- 換算：**一千張細圖 ≈ 幾毫子**

## 15.6 坑（重要）

- `vision-router.tool: false` 唔會報錯，只會令每個 `vision_*` call throw `VISION_TOOLS_DISABLED`
- 內建免費視覺鏈 OVH 匿名端點 = **每 IP、每 model、每分鐘 2 次**，實測長期 `429`；配合 `freeCloudFirst: true` 會先撞 5 個免費 model 全部 429，食晒 45 秒 task budget，令付費 backend 永遠輪唔到 → 症狀係「所有 backend 都 unavailable」，但要怪嘅係**排隊次序**，唔係 config 壞
- Backend 一旦全 fail，**同一輪（turn）內**再 call vision_* 會即刻回 cached failure，唔會出網絡 —— 要新一輪先重試
- 想 100% 免費替代：智譜 `glm-4.6v-flash`（永久免費，plugin 有現成 preset `presets/zhipu.yaml`，要自己開 bigmodel.cn key）；OpenRouter `:free`（50 req/日，名單會輪換）
- 本機冇裝 tesseract → `vision_ocr` 冇本地 fallback，一律走網絡

---

*Generated 2026-08-16 by DSH agent（2026-08-22 更新：§13 OpenViking + §14 Exa；2026-09-10 更新：§15 Vision 睇圖）. 配合 dsh-setup-bundle.zip 使用.*
