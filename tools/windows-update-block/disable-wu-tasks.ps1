#Requires -RunAsAdministrator
# disable-wu-tasks.ps1 (run ELEVATED) - second pass: take ownership of the protected
# UpdateOrchestrator / WaaSMedic task files + TaskCache keys, then disable those tasks.
$ErrorActionPreference = 'Continue'
$root = 'C:\Users\cheun\.dsh\tools\windows-update-block'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
Start-Transcript -Path (Join-Path $root ('tasks-run-' + $stamp + '.log')) -Force | Out-Null
function Say($m) { Write-Host $m }
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
Say ('=== DSH pass 2: protected update tasks :: elevated=' + $isAdmin + ' ===')
if (-not $isAdmin) { Stop-Transcript | Out-Null; exit 2 }

$taskPaths = @('\Microsoft\Windows\UpdateOrchestrator\','\Microsoft\Windows\WindowsUpdate\','\Microsoft\Windows\WaaSMedic\')

function Grant-RegTree([string]$subPath) {
  try {
    $k1 = [Microsoft.Win32.Registry]::LocalMachine.OpenSubKey($subPath, [Microsoft.Win32.RegistryKeyPermissionCheck]::ReadWriteSubTree, [System.Security.AccessControl.RegistryRights]::TakeOwnership)
    if ($k1) {
      $acl = $k1.GetAccessControl([System.Security.AccessControl.AccessControlSections]::None)
      $acl.SetOwner([System.Security.Principal.NTAccount]'BUILTIN\Administrators')
      $k1.SetAccessControl($acl)
      $k1.Close()
    }
  } catch { Say ('  owner FAIL ' + $subPath + ' :: ' + $_.Exception.Message) }
  try {
    $k2 = [Microsoft.Win32.Registry]::LocalMachine.OpenSubKey($subPath, [Microsoft.Win32.RegistryKeyPermissionCheck]::ReadWriteSubTree, [System.Security.AccessControl.RegistryRights]::ChangePermissions)
    if ($k2) {
      $acl2 = $k2.GetAccessControl()
      $acl2.SetAccessRule((New-Object System.Security.AccessControl.RegistryAccessRule('BUILTIN\Administrators','FullControl','Allow')))
      $k2.SetAccessControl($acl2)
      $k2.Close()
    }
  } catch { Say ('  perms FAIL ' + $subPath + ' :: ' + $_.Exception.Message) }
  try {
    $kk = [Microsoft.Win32.Registry]::LocalMachine.OpenSubKey($subPath)
    foreach ($n in $kk.GetSubKeyNames()) { Grant-RegTree ($subPath + '\' + $n) }
    $kk.Close()
  } catch { Say ('  enum FAIL ' + $subPath + ' :: ' + $_.Exception.Message) }
}

Say ''
Say '--- A. take ownership of task files ---'
$taskDirs = @(
  (Join-Path $env:windir 'System32\Tasks\Microsoft\Windows\UpdateOrchestrator'),
  (Join-Path $env:windir 'System32\Tasks\Microsoft\Windows\WaaSMedic'),
  (Join-Path $env:windir 'System32\Tasks\Microsoft\Windows\WindowsUpdate')
)
foreach ($d in $taskDirs) {
  if (Test-Path $d) {
    $o1 = & takeown.exe /f $d /r /d Y 2>&1
    Say ('  takeown ' + $d + ' -> ' + (($o1 | Out-String).Trim() -replace '\s+', ' ').Substring(0, [Math]::Min(160, (($o1 | Out-String).Trim() -replace '\s+', ' ').Length)))
    $o2 = & icacls.exe $d /grant '*S-1-5-32-544:(F)' /t /c /q 2>&1
    Say ('  icacls ok, lines=' + @($o2).Count)
  } else { Say ('  missing dir: ' + $d) }
}

Say ''
Say '--- B. take ownership of TaskCache registry trees ---'
foreach ($t in @('UpdateOrchestrator','WaaSMedic','WindowsUpdate','InstallService')) {
  $p = 'SOFTWARE\Microsoft\Windows NT\CurrentVersion\Schedule\TaskCache\Tree\Microsoft\Windows\' + $t
  Say ('  processing ' + $p)
  Grant-RegTree $p
}

Say ''
Say '--- C. disable remaining tasks ---'
Start-Sleep -Seconds 2
$targets = @()
foreach ($p in $taskPaths) { $targets += @(Get-ScheduledTask -TaskPath ($p + '*') -ErrorAction SilentlyContinue) }
$fixed = 0; $failed = 0
foreach ($t in $targets) {
  $full = $t.TaskPath + $t.TaskName
  if ([string]$t.State -eq 'Disabled') { continue }
  try {
    Disable-ScheduledTask -TaskPath $t.TaskPath -TaskName $t.TaskName -ErrorAction Stop | Out-Null
    $fixed++; Say ('  disabled: ' + $full)
  } catch {
    $o = & schtasks.exe /Change /TN $full /Disable 2>&1
    if (($o | Out-String) -match 'SUCCESS') { $fixed++; Say ('  disabled (schtasks): ' + $full) }
    else { $failed++; Say ('  STILL FAILING: ' + $full + ' :: ' + (($o | Out-String).Trim() -replace '\s+', ' ')) }
  }
}
Say ('  newly disabled=' + $fixed + ' still failing=' + $failed)

Say ''
Say '--- D. final state ---'
foreach ($p in $taskPaths) {
  $ts = @(Get-ScheduledTask -TaskPath ($p + '*') -ErrorAction SilentlyContinue)
  foreach ($t in $ts) { Say ('  [' + $t.State + '] ' + $t.TaskPath + $t.TaskName) }
}
Stop-Transcript | Out-Null
exit 0
