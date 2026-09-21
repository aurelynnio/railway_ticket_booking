<#
.SYNOPSIS
  Check real-time CPU and RAM consumption of all Railway Ticket Booking services and Docker containers.

.EXAMPLE
  .\scripts\check-resources.ps1
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Continue'
$repoRoot = Split-Path -Parent $PSScriptRoot

Write-Host "==================================================================" -ForegroundColor DarkCyan
Write-Host "   VIETRAIL RESOURCE CONSUMPTION MONITOR                          " -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor DarkCyan

# 1. Node.js Processes
Write-Host "`n[1] Application Node.js Processes:" -ForegroundColor Cyan

$servicePatterns = @(
  'auth-service',
  'tickets-service',
  'orders-service',
  'payments-service',
  'notification-service',
  'api-gateway',
  'client'
)

$appMetrics = @()
$totalAppMemMb = 0

$procs = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'"
$portMap = @{}
Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
  if ($_.LocalPort -eq 8081) { $portMap[$_.OwningProcess] = 'api-gateway' }
  if ($_.LocalPort -eq 3000) { $portMap[$_.OwningProcess] = 'client' }
}

foreach ($proc in $procs) {
  $cmd = $proc.CommandLine
  if (-not $cmd) { continue }

  $matchedSvc = $null
  foreach ($svc in $servicePatterns) {
    if ($cmd -like "*$svc*") {
      $matchedSvc = $svc
      break
    }
  }

  if (-not $matchedSvc -and $portMap.ContainsKey($proc.ProcessId)) {
    $matchedSvc = $portMap[$proc.ProcessId]
  }

  if ($matchedSvc) {
    try {
      $p = Get-Process -Id $proc.ProcessId -ErrorAction Stop
      $memMb = [Math]::Round($p.WorkingSet64 / 1MB, 1)
      $totalAppMemMb += $memMb

      $appMetrics += [PSCustomObject]@{
        Service   = $matchedSvc
        PID       = $proc.ProcessId
        RAM_MB    = "$memMb MB"
        Threads   = $p.Threads.Count
        StartTime = $p.StartTime.ToString("HH:mm:ss")
      }
    } catch {}
  }
}

if ($appMetrics.Count -eq 0) {
  Write-Host "    No application services are currently running." -ForegroundColor Yellow
} else {
  $appMetrics | Format-Table -AutoSize
  Write-Host "    Total Application Memory: $totalAppMemMb MB" -ForegroundColor Green
}

# 2. Docker Containers
Write-Host "`n[2] Docker Infrastructure Containers:" -ForegroundColor Cyan

$dockerCheck = docker ps 2>$null
if (-not $dockerCheck) {
  Write-Host "    Docker is not running or not responsive." -ForegroundColor Yellow
} else {
  $containerStats = docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}" 2>$null
  if ($containerStats) {
    $containerStats | Out-String | Write-Host
  } else {
    Write-Host "    No active Docker containers found." -ForegroundColor Yellow
  }
}

Write-Host "------------------------------------------------------------------" -ForegroundColor DarkCyan
Write-Host " Status: Ready. Use .\scripts\stop-all-services.ps1 to stop all." -ForegroundColor Gray
Write-Host "------------------------------------------------------------------" -ForegroundColor DarkCyan

