<#
.SYNOPSIS
  Stop all railway-ticket-booking services started by start-all-services.ps1.

.DESCRIPTION
  Kills the node processes spawned for each NestJS microservice and the
  Next.js client. RabbitMQ container is left running — use
  `docker compose -f infra/docker/docker-compose.dev.yml down` if you also
  want to stop it.

.PARAMETER StopRabbitMq
  Also stop the RabbitMQ dev container.
#>
[CmdletBinding()]
param(
  [switch]$StopRabbitMq
)

$ErrorActionPreference = 'Stop'

function Write-Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn2($msg){ Write-Host "    [!]  $msg" -ForegroundColor Yellow }

# ---------------------------------------------------------------------------
# 1. Kill node processes by matching their command line against each service
# ---------------------------------------------------------------------------
$servicePatterns = @(
  'auth-service',
  'users-service',
  'search-service',
  'tickets-service',
  'orders-service',
  'payments-service',
  'notification-service',
  'api-gateway',
  'next dev',
  'next-server'
)

Write-Step 'Stopping node processes for services and client'
$killed = 0
$procs = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'"
foreach ($proc in $procs) {
  $cmdLine = $proc.CommandLine
  if (-not $cmdLine) { continue }
  foreach ($pattern in $servicePatterns) {
    if ($cmdLine -like "*$pattern*") {
      Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
      $killed++
      break
    }
  }
}
Write-Ok "Stopped $killed node process(es)"

# ---------------------------------------------------------------------------
# 2. Optionally stop RabbitMQ
# ---------------------------------------------------------------------------
if ($StopRabbitMq) {
  Write-Step 'Stopping RabbitMQ dev container'
  $repoRoot = Split-Path -Parent $PSScriptRoot
  docker compose -f (Join-Path $repoRoot 'infra/docker/docker-compose.dev.yml') down
  Write-Ok 'RabbitMQ container stopped'
} else {
  Write-Warn2 'RabbitMQ container left running. Use -StopRabbitMq to stop it too.'
}

Write-Host ''
Write-Host 'Done.' -ForegroundColor Green
