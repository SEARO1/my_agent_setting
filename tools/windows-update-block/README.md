# Windows Update 封鎖（DSH tools）

為 `WIN-EJQIKKKLDAS` / Windows 11 Pro build 26200 (25H2) 而設，2026-09-24 建立。

## 狀態：已套用（徹底停用）

| 層 | 內容 |
| --- | --- |
| Group policy | `HKLM\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU` → `NoAutoUpdate=1`、`NoAutoRebootWithLoggedOnUsers=1`；`WindowsUpdate` → `TargetReleaseVersion=1`、`TargetReleaseVersionInfo=25H2` |
| Services | `wuauserv` / `UsoSvc` / `WaaSMedicSvc` → `Start=4`（Disabled，已停止）|
| 排程工作 | UpdateOrchestrator / WindowsUpdate / WaaSMedic / InstallService 共 21 個全部 Disabled |
| Pause | `Pause*Time` 設到 2027-09-24（多一層保險）|

## 檔案

- `disable-windows-update.ps1` — pass 1：policy + services + 非受保護工作 + pause（要 elevated）
- `disable-wu-tasks.ps1` — pass 2：對受保護工作檔 take ownership（要 elevated，部分會 access denied，屬預期）
- `pass3-run-as-system.ps1` + `disable-wu-tasks-system.ps1` — pass 3：用臨時 SYSTEM 排程工作停埋剩低嘅 protected tasks，跑完自動刪返個 helper task
- `restore-windows-update.ps1` — **一鍵還原**（要 elevated）
- `status-windows-update.ps1` — 唯讀檢查，唔改任何嘢
- `backup-original-state.json` — 改之前嘅原狀（services Start 值、21 個工作嘅狀態、pause 值）
- `*-run-*.log` — 每次執行嘅 transcript

## 點還原

```powershell
# elevated pwsh
pwsh -NoProfile -ExecutionPolicy Bypass -File C:\Users\cheun\.dsh\tools\windows-update-block\restore-windows-update.ps1
```

還原會：policy key 整走、三個 service Start 還原（3/2/3）、工作重新 Enable、pause 清走、start 返 wuauserv/UsoSvc。

## 已知副作用（唔想嘅話跑 restore）

- 冇 security patch 直到還原 — 想手動更新就入 Settings → Windows Update 撳 Check for updates（policy 只係停「自動」，冇停手動）。
- `WaaSMedicSvc` registry key 同 `System32\Tasks\Microsoft\Windows\{UpdateOrchestrator,WaaSMedic,WindowsUpdate}` 嘅 owner 已改成 Administrators/cheun（restore 唔會還原 owner，屬無害）。
- Windows 大版本升級（例如 26H1）會被 `TargetReleaseVersion=25H2` 擋住。
