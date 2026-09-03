@echo off
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process -Filter \"Name='powershell.exe'\" | Where-Object { $_.CommandLine -like '*vote-veyon-bridge.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }; Remove-Item -Force (Join-Path ([Environment]::GetFolderPath('Startup')) 'Vote Veyon Bridge.lnk') -ErrorAction SilentlyContinue; Remove-Item -Recurse -Force (Join-Path $env:LOCALAPPDATA 'vote-veyon-bridge') -ErrorAction SilentlyContinue; Write-Host 'Удалено'"
pause
