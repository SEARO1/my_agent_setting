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
