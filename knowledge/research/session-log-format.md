---
tags: [dsh, sessions, jsonl, zstd, format]
updated: 2026-08-16
---

# DSH Session Log 格式（JSONL + Zstd）

來源：`@deepseek-ai/dsh-session-persistence-jsonl` README + lib 實作。

## 位置
`~/.dsh/sessions/<workspace-hash>/<session-id>/session.jsonl.zstd`
（workspace hash 例如 `--C-Users-cheun-OneDrive-Desktop--`）

## 格式
- 檔案 = **多個串聯嘅標準 zstd frames**（magic `0xFD2FB528` LE = 4247762216），每個 frame checksummed，append 式寫入
- 解壓後 = JSONL（每行一個 JSON record）
- **Node ≥22.2 內建 `node:zlib` 有 zstd**：`zstdDecompressSync`（one-shot，逐 frame 用）；`createZstdDecompress`（stream）
- Frame 掃描演算法（搵 frame 邊界）：讀 magic → frame header descriptor → 逐個 block header（3 bytes LE，bit0=last，bit1-2=type，bit3+=size）→ checksum 4 bytes

## Record types（解壓後）
| type | 內容 |
|---|---|
| `session` | id, createdAt, cwd, agentPreset |
| `permission/preset`, `sandbox/mode`, `approval/policy` | session 啟動設定 |
| `session/title` | 標題（fallback 或 LLM 生成） |
| `user/message` | `data.content[].text`、`data.source.kind`（user/plugin） |
| `assistant/message` | `data.message.content[]`：type reasoning / text / tool-call |
| `tool/call` | `name`, `arguments`（JSON string） |
| `tool/result` | 結果 |
| `turn/start`, `step/start`, `step/end`, `turn/end` | 回合/步驟邊界 |

## 用途
- 蒸餾：`user/message`（source.kind=user）+ `assistant/message`（text parts）→ 摘要入 knowledge/
- Session report：同 session-report skill（Claude Code 版）概念一樣，但佢食 `~/.claude/projects`，唔食 DSH 呢個格式
