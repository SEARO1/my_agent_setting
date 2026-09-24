#Requires -RunAsAdministrator
# disable-windows-update.ps1  (run ELEVATED)
# Blocks Windows Update auto-update and records the original state for restore.
$ErrorActionPreference = 'Continue'
$root = 'C:\Users\cheun\.dsh\tools\windows-update-block'
New-Item -ItemType Directory -Path $root -Force | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
Start-Transcript -Path (Join-Path $root ('disable-run-' + $stamp + '.log')) -Force | Out-Null
function Say($m) { Write-Host $m }

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
Say ('=== DSH disable Windows Update :: ' + $stamp + ' :: elevated=' + $isAdmin + ' ===')
if (-not $isAdmin) { Say 'NOT ELEVATED - aborting'; Stop-Transcript | Out-Null; exit 2 }

$svcNames  = @('wuauserv','UsoSvc','WaaSMedicSvc')
$taskPaths = @('\Microsoft\Windows\UpdateOrchestrator\','\Microsoft\Windows\WindowsUpdate\','\Microsoft\Windows\InstallService\','\Microsoft\Windows\WaaSMedic\')
$wuPol     = 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate'
$auPol     = $wuPol + '\AU'
$uxKey     = 'HKLM:\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings'
$pauseNames = @('PauseUpdatesStartTime','PauseUpdatesExpiryTime','PauseFeatureUpdatesStartTime','PauseFeatureUpdatesEndTime','PauseQualityUpdatesStartTime','PauseQualityUpdatesEndTime')

Say ''
Say '--- 1/6 snapshot original state ---'
$snap = [ordered]@{ timestamp = $stamp; policiesExisted = (Test-Path $wuPol); services = @{}; tasks = @{}; pause = @{} }
foreach ($s in $svcNames) {
  $v = (Get-ItemProperty -Path ('HKLM:\SYSTEM\CurrentControlSet\Services\' + $s) -Name Start -ErrorAction SilentlyContinue).Start
  $snap.services[$s] = $v
  Say ('  service ' + $s + ' Start=' + $v)
}
$existingPause = Get-ItemProperty -Path $uxKey -ErrorAction SilentlyContinue
foreach ($p in $pauseNames) {
  $pv = $null
  if ($existingPause) { $pv = $existingPause.$p }
  $snap.pause[$p] = $pv
}
$tasks = @()
foreach ($p in $taskPaths) { $tasks += @(Get-ScheduledTask -TaskPath ($p + '*') -ErrorAction SilentlyContinue) }
Say ('  update-related scheduled tasks found: ' + $tasks.Count)
foreach ($t in $tasks) { Say ('    ' + $t.TaskPath + $t.TaskName + ' [' + $t.State + ']') }
$snap | ConvertTo-Json -Depth 6 | Set-Content -Path (Join-Path $root 'backup-original-state.json') -Encoding UTF8
Say ('  snapshot written -> ' + (Join-Path $root 'backup-original-state.json'))

Say ''
Say '--- 2/6 group policy ---'
New-Item -Path $auPol -Force | Out-Null
Set-ItemProperty -Path $auPol -Name 'NoAutoUpdate' -Value 1 -Type DWord
Set-ItemProperty -Path $auPol -Name 'NoAutoRebootWithLoggedOnUsers' -Value 1 -Type DWord
$dv = (Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion' -Name DisplayVersion -ErrorAction SilentlyContinue).DisplayVersion
if ($dv) {
  Set-ItemProperty -Path $wuPol -Name 'TargetReleaseVersion' -Value 1 -Type DWord
  Set-ItemProperty -Path $wuPol -Name 'TargetReleaseVersionInfo' -Value $dv -Type String
  Say ('  pinned feature version to ' + $dv)
} else { Say '  DisplayVersion not found, skipped version pin' }
Say '  NoAutoUpdate=1, NoAutoRebootWithLoggedOnUsers=1'

Say ''
Say '--- 3/6 stop + disable services ---'
foreach ($s in $svcNames) {
  try { Stop-Service -Name $s -Force -ErrorAction Stop; Say ('  stopped ' + $s) }
  catch { Say ('  stop ' + $s + ' skipped: ' + $_.Exception.Message) }
}
foreach ($s in $svcNames) {
  $o = & sc.exe config $s start= disabled 2>&1
  Say ('  sc config ' + $s + ' -> ' + (($o | Out-String).Trim() -replace '\s+', ' '))
}

Say ''
Say '--- 4/6 registry Start=4 fallback (WaaSMedicSvc is protected) ---'
$medicKey = 'SYSTEM\CurrentControlSet\Services\WaaSMedicSvc'
try {
  $kOwn = [Microsoft.Win32.Registry]::LocalMachine.OpenSubKey($medicKey, [Microsoft.Win32.RegistryKeyPermissionCheck]::ReadWriteSubTree, [System.Security.AccessControl.RegistryRights]::TakeOwnership)
  $acl = $kOwn.GetAccessControl([System.Security.AccessControl.AccessControlSections]::None)
  $acl.SetOwner([System.Security.Principal.NTAccount]'BUILTIN\Administrators')
  $kOwn.SetAccessControl($acl)
  $kOwn.Close()
  $kPerm = [Microsoft.Win32.Registry]::LocalMachine.OpenSubKey($medicKey, [Microsoft.Win32.RegistryKeyPermissionCheck]::ReadWriteSubTree, [System.Security.AccessControl.RegistryRights]::ChangePermissions)
  $acl2 = $kPerm.GetAccessControl()
  $acl2.SetAccessRule((New-Object System.Security.AccessControl.RegistryAccessRule('BUILTIN\Administrators','FullControl','Allow')))
  $kPerm.SetAccessControl($acl2)
  $kPerm.Close()
  Say '  took ownership of WaaSMedicSvc key'
} catch { Say ('  ACL takeover: ' + $_.Exception.Message) }
foreach ($s in $svcNames) {
  try {
    Set-ItemProperty -Path ('HKLM:\SYSTEM\CurrentControlSet\Services\' + $s) -Name Start -Value 4 -Type DWord -ErrorAction Stop
    Say ('  registry: ' + $s + ' Start=4 (disabled)')
  } catch { Say ('  registry: ' + $s + ' FAILED -> ' + $_.Exception.Message) }
}

Say ''
Say '--- 5/6 disable scheduled tasks ---'
foreach ($t in $tasks) {
  $full = $t.TaskPath + $t.TaskName
  $snap.tasks[$full] = [string]$t.State
  if ([string]$t.State -eq 'Disabled') { Say ('  already disabled: ' + $full); continue }
  try {
    Disable-ScheduledTask -TaskPath $t.TaskPath -TaskName $t.TaskName -ErrorAction Stop | Out-Null
    Say ('  disabled: ' + $full)
  } catch {
    $o = & schtasks.exe /Change /TN $full /Disable 2>&1
    Say ('  ' + $full + ' :: Disable-ScheduledTask failed -> schtasks says: ' + (($o | Out-String).Trim() -replace '\s+', ' '))
  }
}
$snap | ConvertTo-Json -Depth 6 | Set-Content -Path (Join-Path $root 'backup-original-state.json') -Encoding UTF8

Say ''
Say '--- 6/6 pause updates 365 days (extra layer) ---'
if (-not (Test-Path $uxKey)) { New-Item -Path $uxKey -Force | Out-Null }
$now = (Get-Date).ToUniversalTime()
$fmt = 'yyyy-MM-ddTHH:mm:ssZ'
Set-ItemProperty -Path $uxKey -Name 'PauseUpdatesStartTime'        -Value $now.ToString($fmt) -Type String
Set-ItemProperty -Path $uxKey -Name 'PauseUpdatesExpiryTime'       -Value $now.AddDays(365).ToString($fmt) -Type String
Set-ItemProperty -Path $uxKey -Name 'PauseFeatureUpdatesStartTime' -Value $now.ToString($fmt) -Type String
Set-ItemProperty -Path $uxKey -Name 'PauseFeatureUpdatesEndTime'   -Value $now.AddDays(365).ToString($fmt) -Type String
Set-ItemProperty -Path $uxKey -Name 'PauseQualityUpdatesStartTime' -Value $now.ToString($fmt) -Type String
Set-ItemProperty -Path $uxKey -Name 'PauseQualityUpdatesEndTime'   -Value $now.AddDays(365).ToString($fmt) -Type String
Say ('  paused until ' + $now.AddDays(365).ToString($fmt))

Say ''
Say '=== verify ==='
foreach ($s in $svcNames) {
  $v = (Get-ItemProperty -Path ('HKLM:\SYSTEM\CurrentControlSet\Services\' + $s) -Name Start -ErrorAction SilentlyContinue).Start
  $svc = Get-Service -Name $s -ErrorAction SilentlyContinue
  Say ('  ' + $s + ' Start=' + $v + ' status=' + $svc.Status + ' startType=' + $svc.StartType)
}
Say ('  NoAutoUpdate = ' + (Get-ItemProperty -Path $auPol -Name 'NoAutoUpdate' -ErrorAction SilentlyContinue).NoAutoUpdate)
Say ('  TargetReleaseVersionInfo = ' + (Get-ItemProperty -Path $wuPol -Name 'TargetReleaseVersionInfo' -ErrorAction SilentlyContinue).TargetReleaseVersionInfo)
$stillOn = @(Get-ScheduledTask -TaskPath '\Microsoft\Windows\UpdateOrchestrator\*' -ErrorAction SilentlyContinue | Where-Object { $_.State -ne 'Disabled' })
Say ('  UpdateOrchestrator tasks still enabled: ' + $stillOn.Count)
Say '=== done ==='
Stop-Transcript | Out-Null
exit 0
