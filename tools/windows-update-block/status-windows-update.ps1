# status-windows-update.ps1 - READ ONLY. Shows whether the Windows Update block is still in place.
$ErrorActionPreference = 'SilentlyContinue'
function Head($m) { Write-Host ''; Write-Host ('== ' + $m + ' ==') }
Head 'services'
foreach ($s in @('wuauserv','UsoSvc','WaaSMedicSvc','BITS','DoSvc')) {
  $v = (Get-ItemProperty -Path ('HKLM:\SYSTEM\CurrentControlSet\Services\' + $s) -Name Start).Start
  $svc = Get-Service -Name $s
  $verdict = 'ACTIVE'
  if ($v -eq 4) { $verdict = 'DISABLED' }
  Write-Host ('  ' + $s.PadRight(14) + ' Start=' + $v + '  ' + $svc.Status + '  ' + $svc.StartType + '   -> ' + $verdict)
}
Head 'group policy'
$au = Get-ItemProperty 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU'
$wu = Get-ItemProperty 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate'
Write-Host ('  NoAutoUpdate                  = ' + $au.NoAutoUpdate)
Write-Host ('  NoAutoRebootWithLoggedOnUsers = ' + $au.NoAutoRebootWithLoggedOnUsers)
Write-Host ('  TargetReleaseVersion          = ' + $wu.TargetReleaseVersion)
Write-Host ('  TargetReleaseVersionInfo      = ' + $wu.TargetReleaseVersionInfo)
Head 'pause settings'
$ux = Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings'
Write-Host ('  PauseUpdatesExpiryTime      = ' + $ux.PauseUpdatesExpiryTime)
Write-Host ('  PauseFeatureUpdatesEndTime  = ' + $ux.PauseFeatureUpdatesEndTime)
Write-Host ('  PauseQualityUpdatesEndTime  = ' + $ux.PauseQualityUpdatesEndTime)
Head 'update scheduled tasks'
$paths = @('\Microsoft\Windows\UpdateOrchestrator\','\Microsoft\Windows\WindowsUpdate\','\Microsoft\Windows\WaaSMedic\','\Microsoft\Windows\InstallService\')
$all = @(); foreach ($p in $paths) { $all += @(Get-ScheduledTask -TaskPath ($p + '*')) }
$enabled = @($all | Where-Object { $_.State -ne 'Disabled' })
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { Write-Host '  (NOT elevated - protected tasks hidden from a normal token; expect ~21 when run as admin)' }
Write-Host ('  visible=' + $all.Count + '  still enabled=' + $enabled.Count)
foreach ($t in $enabled) { Write-Host ('   ! ' + $t.TaskPath + $t.TaskName + ' [' + $t.State + ']') }
Head 'last installed updates'
Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 3 | ForEach-Object { Write-Host ('  ' + $_.HotFixID + '  ' + $_.InstalledOn) }
Write-Host ''
