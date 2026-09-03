# Установка мостика на ПК с Veyon Master: копирует файлы в %LOCALAPPDATA%\vote-veyon-bridge
# и добавляет ярлык в автозагрузку текущего пользователя (без прав администратора).
$ErrorActionPreference = 'Stop'
$src = Split-Path -Parent $MyInvocation.MyCommand.Path
$dst = Join-Path $env:LOCALAPPDATA 'vote-veyon-bridge'
New-Item -ItemType Directory -Force -Path $dst | Out-Null
foreach ($f in 'vote-veyon-bridge.ps1', 'bridge.config.json', 'hosts.txt') {
  $to = Join-Path $dst $f
  # hosts.txt и конфиг при повторной установке не затираем
  if (($f -ne 'vote-veyon-bridge.ps1') -and (Test-Path $to)) { continue }
  Copy-Item (Join-Path $src $f) $to -Force
}

$startup = [Environment]::GetFolderPath('Startup')
$lnk = Join-Path $startup 'Vote Veyon Bridge.lnk'
$ws = New-Object -ComObject WScript.Shell
$s = $ws.CreateShortcut($lnk)
$s.TargetPath = 'powershell.exe'
$s.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$dst\vote-veyon-bridge.ps1`""
$s.WorkingDirectory = $dst
$s.WindowStyle = 7
$s.Description = 'Открывает кабинет делегата на ПК депутатов при старте голосования'
$s.Save()

# остановить старый экземпляр (если был) и запустить новый
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" |
  Where-Object { $_.CommandLine -like '*vote-veyon-bridge.ps1*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$dst\vote-veyon-bridge.ps1`"" -WorkingDirectory $dst -WindowStyle Hidden

Write-Host "Установлено в $dst"
Write-Host "Автозагрузка: $lnk"
Write-Host "Лог: $dst\bridge.log"
