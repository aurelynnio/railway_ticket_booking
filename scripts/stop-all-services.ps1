<#
.SYNOPSIS
  Stop all railway-ticket-booking services and optionally the lightweight Docker infrastructure.

.PARAMETER StopInfra
  Also stop the lightweight Docker infrastructure containers (Postgres, RabbitMQ, Redis).

.PARAMETER StopRabbitMq
  Alias for StopInfra (backward compatibility).

.EXAMPLE
  .\scripts\stop-all-services.ps1
  .\scripts\stop-all-services.ps1 -StopInfra
#>
[CmdletBinding()]
param(
  [switch]$StopInfra,
  [switch]$StopRabbitMq
)

$ErrorActionPreference = 'Continue'

function Write-Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn2($msg){ Write-Host "    [!]  $msg" -ForegroundColor Yellow }

$servicePatterns = @(
  'auth-service',
  'tickets-service',
  'orders-service',
  'payments-service',
  'notification-service',
  'api-gateway',
  'client',
  'next dev',
  'next-server'
)

Write-Step 'Stopping node processes for Railway Ticket Booking services'
$killed = 0
$portPids = @()
Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
  if ($_.LocalPort -eq 8081 -or $_.LocalPort -eq 3000) { $portPids += $_.OwningProcess }
}

$procs = Get-CimInstance Win32_Process -Filter "Name = 'node.exe' or Name = 'cmd.exe'"
foreach ($proc in $procs) {
  $cmdLine = $proc.CommandLine
  if (-not $cmdLine) { continue }
  $shouldStop = $false

  foreach ($pattern in $servicePatterns) {
    if ($cmdLine -like "*railway_ticket_booking*$pattern*" -or $cmdLine -like "*$pattern*dist\main.js*") {
      $shouldStop = $true
      break
    }
  }

  if (-not $shouldStop -and ($portPids -contains $proc.ProcessId)) {
    $shouldStop = $true
  }

  if ($shouldStop) {
    Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
    $killed++
  }
}
Write-Ok "Stopped $killed active process(es)"

# 2. Optionally stop Docker infrastructure
if ($StopInfra -or $StopRabbitMq) {
  Write-Step 'Stopping Docker lightweight infrastructure (Postgres, RabbitMQ, Redis)'
  $repoRoot = Split-Path -Parent $PSScriptRoot
  $composePath = Join-Path $repoRoot 'infra/docker/docker-compose.dev.yml'
  if (Test-Path $composePath) {
    docker compose -f $composePath down 2>$null
    Write-Ok 'Docker infrastructure stopped'
  }
} else {
  Write-Warn2 'Docker containers left running. Use -StopInfra to stop them too.'
}

Write-Host "`nDone. System resources have been freed." -ForegroundColor Green
