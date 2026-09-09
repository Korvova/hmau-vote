# ============================================================================
#  vote-veyon-bridge.ps1 — мостик «сайт голосования → Veyon»
#
#  Крутится на ПК с Veyon Master. Раз в секунду спрашивает сайт, идёт ли
#  голосование. Как только голосование СТАРТОВАЛО — через veyon-cli открывает
#  на всех ПК депутатов (hosts.txt) страницу кабинета делегата.
#
#  Настройки — в bridge.config.json рядом со скриптом.
#  Проверка без Veyon:  powershell -File vote-veyon-bridge.ps1 -DryRun
# ============================================================================
param(
  [switch]$DryRun,          # не звать veyon-cli, только писать в лог
  [switch]$Once             # один опрос и выход (для проверки связи с сайтом)
)

$ErrorActionPreference = 'Continue'
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$ConfigPath = Join-Path $Here 'bridge.config.json'
$HostsPath  = Join-Path $Here 'hosts.txt'
$LogPath    = Join-Path $Here 'bridge.log'

function Log([string]$msg) {
  $line = "{0:yyyy-MM-dd HH:mm:ss}  {1}" -f (Get-Date), $msg
  Write-Host $line
  try { Add-Content -Path $LogPath -Value $line -Encoding UTF8 } catch {}
}

# ---------- конфиг ----------
$cfg = @{
  site         = 'http://10.10.200.27:8090'
  page         = '/hmau-vote/user'
  veyonCli     = 'C:\Program Files\Veyon\veyon-cli.exe'
  pollSeconds  = 1
  openOnVoteEnd = $false    # открыть страницу ещё раз, когда голосование закончилось (обычно не нужно)
}
if (Test-Path $ConfigPath) {
  try {
    $j = Get-Content $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
    foreach ($p in $j.PSObject.Properties) { $cfg[$p.Name] = $p.Value }
  } catch { Log "Не смог прочитать bridge.config.json: $($_.Exception.Message) — работаю с настройками по умолчанию" }
}
$StateUrl = "$($cfg.site)/api/vote-state"
$PageUrl  = "$($cfg.site)$($cfg.page)"

function Get-Hosts {
  if (-not (Test-Path $HostsPath)) { return @() }
  Get-Content $HostsPath -Encoding UTF8 |
    ForEach-Object { ($_ -split '#')[0].Trim() } |
    Where-Object { $_ -ne '' }
}

# ---------- открыть страницу на всех ПК ----------
function Open-OnAll([string]$reason, $skipHosts) {
  $hosts = @(Get-Hosts)
  if ($hosts.Count -eq 0) { Log "hosts.txt пуст — некому открывать"; return }
  # ПК, где кабинет депутата и так на экране (сайт знает это по докладам вкладок), пропускаем —
  # иначе у депутата на каждом голосовании «перезагружается» страница
  $skip = @()
  if ($skipHosts) { $skip = @($skipHosts | ForEach-Object { "$_".Trim() } | Where-Object { $_ }) }
  if ($skip.Count -gt 0) {
    $before = $hosts.Count
    $hosts = @($hosts | Where-Object { $skip -notcontains $_ })
    Log "  пропускаю $($before - $hosts.Count) ПК — кабинет уже на экране"
  }
  if ($hosts.Count -eq 0) { Log "  открывать некому: кабинет на экране у всех"; return }
  Log "$reason -> открываю $PageUrl на $($hosts.Count) ПК"
  $sw = [Diagnostics.Stopwatch]::StartNew()
  $started = 0
  foreach ($h in $hosts) {
    # страница получает ?pc=<адрес ПК> и дальше сама докладывает сайту, что она на экране этого ПК
    $json = '{"websiteUrls":["' + $PageUrl + '?pc=' + $h + '"]}'
    $jsonArg = '"' + ($json -replace '"', '\"') + '"'     # экранирование кавычек для командной строки Windows
    # порядок аргументов veyon-cli 4.9: <адрес ПК> <функция> <JSON>
    $cliArgs = "feature start $h OpenWebsite $jsonArg"
    if ($DryRun) { Log "  [dry-run] veyon-cli $cliArgs"; continue }
    try {
      # каждый ПК — отдельный процесс, все стартуют сразу (Start-Process слишком медленный:
      # ~0.3 с на запуск, на 70 ПК это 20 с — страница приходила после конца голосования)
      $psi = New-Object System.Diagnostics.ProcessStartInfo
      $psi.FileName = $cfg.veyonCli
      $psi.Arguments = $cliArgs
      $psi.UseShellExecute = $false
      $psi.CreateNoWindow = $true
      [System.Diagnostics.Process]::Start($psi) | Out-Null
      $started++
    } catch {
      Log "  ОШИБКА запуска veyon-cli для $h : $($_.Exception.Message)"
    }
  }
  if (-not $DryRun) { Log "  отправлено $started команд за $($sw.ElapsedMilliseconds) мс" }
}

# ---------- главный цикл ----------
Log "=== старт. сайт=$($cfg.site) страница=$PageUrl veyon-cli=$($cfg.veyonCli) dry-run=$DryRun"
if (-not $DryRun -and -not (Test-Path $cfg.veyonCli)) { Log "ВНИМАНИЕ: veyon-cli не найден по пути $($cfg.veyonCli) — поправь bridge.config.json" }

$lastVoteId = $null      # id голосования, на которое уже среагировали
$wasVoting  = $false
$siteDown   = $false

while ($true) {
  try {
    $s = Invoke-RestMethod -Uri $StateUrl -TimeoutSec 3 -Method Get
    if ($siteDown) { Log "сайт снова доступен"; $siteDown = $false }

    if ($s.voting -and $s.voteResultId -ne $lastVoteId) {
      $lastVoteId = $s.voteResultId
      Open-OnAll "ГОЛОСОВАНИЕ #$($s.voteResultId): «$($s.question)» (заседание: $($s.meetingName))" $s.visibleHosts
    }
    if ($wasVoting -and -not $s.voting) {
      Log "голосование завершено"
      if ($cfg.openOnVoteEnd) { Open-OnAll "итоги" }
    }
    $wasVoting = [bool]$s.voting
  } catch {
    if (-not $siteDown) { Log "сайт недоступен: $($_.Exception.Message)"; $siteDown = $true }
  }
  if ($Once) { break }
  Start-Sleep -Seconds ([int]$cfg.pollSeconds)
}
