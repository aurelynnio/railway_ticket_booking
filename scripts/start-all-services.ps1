<#
.SYNOPSIS
  Start all railway-ticket-booking services manually (no Docker for app services).

.DESCRIPTION
  - Ensures RabbitMQ is up via infra/docker/docker-compose.dev.yml (the only
    infrastructure we still need Docker for; Postgres/Mongo/Redis are cloud-hosted).
  - Opens each NestJS microservice and the Next.js client in its own PowerShell
    window running the watch-mode dev script.

.PARAMETER SkipRabbitMq
  Skip the RabbitMQ container check/start (use when it's already running and
  you don't want this script to touch Docker).

.EXAMPLE
  .\scripts\start-all-services.ps1
#>
[CmdletBinding()]
param(
  [switch]$SkipRabbitMq
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$services = @(
  'auth-service',
  'users-service',
  'search-service',
  'tickets-service',
  'orders-service',
  'payments-service',
  'notification-service',
  'api-gateway'
)

function Write-Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn2($msg){ Write-Host "    [!]  $msg" -ForegroundColor Yellow }

# ---------------------------------------------------------------------------
# 1. RabbitMQ (still via Docker — it's the only local infra we need)
# ---------------------------------------------------------------------------
if (-not $SkipRabbitMq) {
  Write-Step 'Checking RabbitMQ container'
  $running = docker ps --filter "name=railway-ticket-rabbitmq-dev" --format '{{.Names}}' 2>$null
  if ($running -match 'railway-ticket-rabbitmq-dev') {
    Write-Ok "RabbitMQ already running"
  } else {
    Write-Step 'Starting RabbitMQ via docker-compose.dev.yml'
    docker compose -f infra/docker/docker-compose.dev.yml up -d
    if ($LASTEXITCODE -ne 0) { throw "docker compose failed for RabbitMQ" }
    Write-Ok "RabbitMQ started"
  }
}

# ---------------------------------------------------------------------------
# 2. Launch each service in its own PowerShell window
# ---------------------------------------------------------------------------
foreach ($svc in $services) {
  Write-Step "Launching $svc"
  $svcPath = Join-Path $repoRoot $svc
  if (-not (Test-Path (Join-Path $svcPath 'package.json'))) {
    Write-Warn2 "package.json missing in $svcPath — skipped"
    continue
  }
  if (-not (Test-Path (Join-Path $svcPath 'node_modules'))) {
    Write-Warn2 "node_modules missing in $svc — run 'npm install' first, skipped"
    continue
  }

  # Stale .tsbuildinfo files make tsc --watch skip emission after nest-cli
  # deletes dist/ (deleteOutDir: true), so the service crashes with
  # "Cannot find module 'dist/main'". Drop them before every launch.
  Get-ChildItem -Path $svcPath -Filter '*.tsbuildinfo' -File -ErrorAction SilentlyContinue |
    ForEach-Object { Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue }

  $logDir = Join-Path $repoRoot '.codex/run-logs'
  if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }

  Start-Process powershell -ArgumentList @(
    '-NoExit',
    "-Command", "Set-Location '$svcPath'; Write-Host '=== $svc (dev) ===' -ForegroundColor Cyan; npm run start:dev"
  ) -WindowStyle Normal | Out-Null
  Write-Ok "$svc launched in new window"
}

# ---------------------------------------------------------------------------
# 3. Launch the Next.js client
# ---------------------------------------------------------------------------
Write-Step 'Launching client (Next.js dev)'
$clientPath = Join-Path $repoRoot 'client'
if (-not (Test-Path (Join-Path $clientPath 'node_modules'))) {
  Write-Warn2 "client/node_modules missing — run 'npm install' first, skipped"
} else {
  Start-Process powershell -ArgumentList @(
    '-NoExit',
    "-Command", "Set-Location '$clientPath'; Write-Host '=== client (next dev) ===' -ForegroundColor Cyan; npm run dev"
  ) -WindowStyle Normal | Out-Null
  Write-Ok "client launched in new window"
}

Write-Host ''
Write-Host 'All services launched.' -ForegroundColor Green
Write-Host '  api-gateway: http://localhost:8080' -ForegroundColor Gray
Write-Host '  client:      http://localhost:3000' -ForegroundColor Gray
Write-Host '  RabbitMQ UI: http://localhost:15672 (guest/guest)' -ForegroundColor Gray
Write-Host ''
Write-Host 'Stop them with: .\scripts\stop-all-services.ps1' -ForegroundColor Gray
