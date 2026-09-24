#Requires -RunAsAdministrator
# restore-windows-update.ps1  (run ELEVATED) - undo everything disable-windows-update.ps1 did
$ErrorActionPreference = 'Continue'
$root = 'C:\Users\cheun\.dsh\tools\windows-update-block'
$snapFile = Join-Path $root 'backup-original-state.json'
function Say($m) { Write-Host $m }
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { Write-Host 'NOT ELEVATED - aborting'; exit 2 }
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
Start-Transcript -Path (Join-Path $root ('restore-run-' + $stamp + '.log')) -Force | Out-Null
Say ('=== DSH restore Windows Update :: ' + $stamp + ' ===')

$svcDefaults = @{ wuauserv = 3; UsoSvc = 2; WaaSMedicSvc = 3 }
$snap = $null
if (Test-Path $snapFile) { $snap = Get-Content $snapFile -Raw | ConvertFrom-Json; Say ('snapshot loaded: ' + $snapFile) }
else { Say 'no snapshot found - using built-in defaults (wuauserv=3/UsoSvc=2/WaaSMedicSvc=3)' }

Say '--- services ---'
foreach ($s in @('wuauserv','UsoSvc','WaaSMedicSvc')) {
  $target = $svcDefaults[$s]
  if ($snap) {
    $v = $snap.services.$s
    if ($null -ne $v) { $target = [int]$v }
  }
  try {
    Set-ItemProperty -Path ('HKLM:\SYSTEM\CurrentControlSet\Services\' + $s) -Name Start -Value $target -Type DWord -ErrorAction Stop
    Say ('  ' + $s + ' Start -> ' + $target)
  } catch { Say ('  ' + $s + ' FAILED -> ' + $_.Exception.Message) }
}
& sc.exe config wuauserv start= demand | Out-Null
& sc.exe config UsoSvc start= auto | Out-Null
& sc.exe config WaaSMedicSvc start= demand | Out-Null
Say '  sc config applied'

Say '--- policies ---'
if (Test-Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate') {
  Remove-Item -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate' -Recurse -Force -ErrorAction SilentlyContinue
  Say '  removed HKLM\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate'
} else { Say '  no policy key to remove' }

Say '--- scheduled tasks ---'
$enabled = 0
if ($snap) {
  foreach ($p in $snap.tasks.PSObject.Properties) {
    if ([string]$p.Value -eq 'Disabled') { continue }
    $full = $p.Name
    $idx = $full.LastIndexOf('\')
    $tp = $full.Substring(0, $idx + 1)
    $tn = $full.Substring($idx + 1)
    try { Enable-ScheduledTask -TaskPath $tp -TaskName $tn -ErrorAction Stop | Out-Null; $enabled++; Say ('  enabled ' + $full) }
    catch { & schtasks.exe /Change /TN $full /Enable | Out-Null; Say ('  enable attempted: ' + $full) }
  }
}
Say ('  re-enabled ' + $enabled + ' tasks')

Say '--- pause settings ---'
$uxKey = 'HKLM:\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings'
foreach ($n in @('PauseUpdatesStartTime','PauseUpdatesExpiryTime','PauseFeatureUpdatesStartTime','PauseFeatureUpdatesEndTime','PauseQualityUpdatesStartTime','PauseQualityUpdatesEndTime')) {
  $old = $null
  if ($snap) { $old = $snap.pause.$n }
  try {
    if ($null -ne $old) { Set-ItemProperty -Path $uxKey -Name $n -Value ([string]$old) -Type String; Say ('  restored ' + $n) }
    else { Remove-ItemProperty -Path $uxKey -Name $n -ErrorAction SilentlyContinue; Say ('  cleared ' + $n) }
  } catch { Say ('  ' + $n + ' -> ' + $_.Exception.Message) }
}

Say '--- start services ---'
foreach ($s in @('wuauserv','UsoSvc')) {
  try { Start-Service -Name $s -ErrorAction Stop; Say ('  started ' + $s) } catch { Say ('  start ' + $s + ' -> ' + $_.Exception.Message) }
}
Say '--- verify ---'
foreach ($s in @('wuauserv','UsoSvc','WaaSMedicSvc')) {
  $v = (Get-ItemProperty -Path ('HKLM:\SYSTEM\CurrentControlSet\Services\' + $s) -Name Start -ErrorAction SilentlyContinue).Start
  Say ('  ' + $s + ' Start=' + $v + ' ' + (Get-Service $s -ErrorAction SilentlyContinue).Status)
}
Say '=== Windows Update restored. Reboot recommended. ==='
Stop-Transcript | Out-Null
exit 0
