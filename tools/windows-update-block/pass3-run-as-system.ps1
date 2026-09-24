#Requires -RunAsAdministrator
# pass 3: register a temporary SYSTEM task that runs the inner script, then remove it.
$ErrorActionPreference = 'Continue'
$root = 'C:\Users\cheun\.dsh\tools\windows-update-block'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
Start-Transcript -Path (Join-Path $root ('pass3-outer-' + $stamp + '.log')) -Force | Out-Null
function Say($m) { Write-Host $m }
Say ('=== pass3 outer :: elevated=' + ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator) + ' ===')

$helper = 'DSH_WU_Helper'
$helperPath = '\DSH\'
$inner = Join-Path $root 'disable-wu-tasks-system.ps1'
$exe = (Get-Command pwsh).Source

Unregister-ScheduledTask -TaskName $helper -TaskPath $helperPath -Confirm:$false -ErrorAction SilentlyContinue

$action = New-ScheduledTaskAction -Execute $exe -Argument ('-NoProfile -ExecutionPolicy Bypass -File "' + $inner + '"')
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 10)
$task = New-ScheduledTask -Action $action -Principal $principal -Settings $settings
Register-ScheduledTask -TaskName $helper -TaskPath $helperPath -InputObject $task -Force | Out-Null
Say ('  registered helper task ' + $helperPath + $helper + ' (runs as SYSTEM)')

Start-ScheduledTask -TaskName $helper -TaskPath $helperPath
Say '  helper started, waiting...'
$deadline = (Get-Date).AddSeconds(150)
do {
  Start-Sleep -Milliseconds 1000
  $st = (Get-ScheduledTask -TaskName $helper -TaskPath $helperPath -ErrorAction SilentlyContinue).State
} while ($st -eq 'Running' -and (Get-Date) -lt $deadline)
$info = Get-ScheduledTaskInfo -TaskName $helper -TaskPath $helperPath -ErrorAction SilentlyContinue
Say ('  helper state=' + $st + ' lastResult=' + $info.LastTaskResult)

$log = Get-ChildItem $root -Filter 'system-pass-*.log' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime | Select-Object -Last 1
if ($log) { Say ('--- inner log: ' + $log.Name + ' ---'); Say (Get-Content $log.FullName -Raw) } else { Say '  no inner log found' }

Unregister-ScheduledTask -TaskName $helper -TaskPath $helperPath -Confirm:$false -ErrorAction SilentlyContinue
Say '  helper task removed'
Stop-Transcript | Out-Null
exit 0
