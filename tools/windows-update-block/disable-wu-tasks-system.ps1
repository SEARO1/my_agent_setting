# runs as SYSTEM (via helper scheduled task)
$root = 'C:\Users\cheun\.dsh\tools\windows-update-block'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
Start-Transcript -Path (Join-Path $root ('system-pass-' + $stamp + '.log')) -Force | Out-Null
function Say($m) { Write-Host $m }
Say ('=== DSH pass 3 (SYSTEM) :: ' + $stamp + ' :: identity=' + [Security.Principal.WindowsIdentity]::GetCurrent().Name + ' ===')

$taskPaths = @('\Microsoft\Windows\UpdateOrchestrator\','\Microsoft\Windows\WindowsUpdate\','\Microsoft\Windows\WaaSMedic\','\Microsoft\Windows\InstallService\')

Say '--- task security descriptors (diagnostic) ---'
foreach ($tn in @('Schedule Scan','Report policies')) {
  $p = 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Schedule\TaskCache\Tree\Microsoft\Windows\UpdateOrchestrator\' + $tn
  $sd = (Get-ItemProperty -Path $p -Name SD -ErrorAction SilentlyContinue).SD
  if ($sd) {
    try { $sddl = (New-Object System.Security.AccessControl.RawSecurityDescriptor($sd, 0)).GetSddlForm('All'); Say ('  ' + $tn + ' SD = ' + $sddl) }
    catch { Say ('  ' + $tn + ' SD decode failed: ' + $_.Exception.Message) }
  } else { Say ('  ' + $tn + ' SD not readable') }
}

Say '--- disabling tasks ---'
$targets = @()
foreach ($p in $taskPaths) { $targets += @(Get-ScheduledTask -TaskPath ($p + '*') -ErrorAction SilentlyContinue) }
$ok = 0; $skip = 0; $fail = 0
foreach ($t in $targets) {
  $full = $t.TaskPath + $t.TaskName
  if ([string]$t.State -eq 'Disabled') { $skip++; continue }
  try {
    Disable-ScheduledTask -TaskPath $t.TaskPath -TaskName $t.TaskName -ErrorAction Stop | Out-Null
    $ok++; Say ('  disabled: ' + $full)
  } catch {
    $o = & schtasks.exe /Change /TN $full /Disable 2>&1
    if (($o | Out-String) -match 'SUCCESS') { $ok++; Say ('  disabled (schtasks): ' + $full) }
    else { $fail++; Say ('  FAILED: ' + $full + ' :: ' + (($o | Out-String).Trim() -replace '\s+', ' ')) }
  }
}
Say ('  disabled_now=' + $ok + ' already_disabled=' + $skip + ' failed=' + $fail)

Say '--- final state ---'
foreach ($p in $taskPaths) {
  foreach ($t in @(Get-ScheduledTask -TaskPath ($p + '*') -ErrorAction SilentlyContinue)) {
    Say ('  [' + $t.State + '] ' + $t.TaskPath + $t.TaskName)
  }
}
Stop-Transcript | Out-Null
exit 0
