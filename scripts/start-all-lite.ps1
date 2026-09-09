<#
.SYNOPSIS
  Start all services in PRODUCTION mode (no watch) to minimize CPU/RAM lag.

.DESCRIPTION
  Builds each NestJS service once (if not already built), then runs the compiled
  output (node dist/main.js) in hidden background windows instead of
  `nest start --watch`. This removes the TypeScript watch compiler, which is the
  main source of lag. The Next.js client is built once and served with `next start`.

  Use this when you want to demo / test end-to-end without editing backend source.
  For active backend development, keep using start-all-services.ps1 (watch mode).

.PARAMETER SkipRabbitMq
  Skip the RabbitMQ container check/start (use when it's already running).

.PARAMETER Rebuild
  Force a fresh build of all services and the client, even if dist/.next exist.

.EXAMPLE
  .\scripts\start-all-lite.ps1
#>
[CmdletBinding()]
param(
  [switch]$SkipRabbitMq,
  [switch]$Rebuild
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$services = @(
  'auth-service',
  'tickets-service',
  'orders-service',
  'payments-service',
  'notification-service',
  'api-gateway'
)

$logDir = Join-Path $repoRoot '.codex/run-logs'
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }

function Write-Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn2($msg){ Write-Host "    [!]  $msg" -ForegroundColor Yellow }

# ---------------------------------------------------------------------------
# 1. RabbitMQ (only local infra we need via Docker)
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
# 2. Build once, then run each service with node dist/main.js (no watch)
# ---------------------------------------------------------------------------
foreach ($svc in $services) {
  $svcPath = Join-Path $repoRoot $svc
  if (-not (Test-Path (Join-Path $svcPath 'package.json'))) {
    Write-Warn2 "package.json missing in $svcPath - skipped"
    continue
  }
  if (-not (Test-Path (Join-Path $svcPath 'node_modules'))) {
    Write-Warn2 "node_modules missing in $svc - run 'npm install' first, skipped"
    continue
  }

  $distMain = Join-Path $svcPath 'dist\main.js'
  if ($Rebuild -or -not (Test-Path $distMain)) {
    Write-Step "Building $svc (production)"
    Push-Location $svcPath
    try {
      npm run build
      if ($LASTEXITCODE -ne 0) { throw "build failed for $svc" }
    } finally {
      Pop-Location
    }
    Write-Ok "$svc built"
  } else {
    Write-Ok "$svc already built (use -Rebuild to force)"
  }

  # Stale .tsbuildinfo files can break tsgo emission; drop them before build.
  # Rebuilt services are handled above; this is harmless for cached ones too.
  Get-ChildItem -Path $svcPath -Filter '*.tsbuildinfo' -File -ErrorAction SilentlyContinue |
    ForEach-Object { Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue }

  $stdoutLog = Join-Path $logDir "$svc-prod.out.log"
  $stderrLog = Join-Path $logDir "$svc-prod.err.log"
  # Pass the full path so stop-all-services.ps1 (which matches service names in
  # the command line) can find and kill these processes.
  Start-Process node -ArgumentList (Join-Path $svcPath 'dist\main.js') `
    -WorkingDirectory $svcPath `
    -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog `
    -WindowStyle Hidden | Out-Null
  Write-Ok "$svc running (node dist/main.js) - logs: $stdoutLog"
}

# ---------------------------------------------------------------------------
# 3. Build + serve the Next.js client (no dev-watch)
# ---------------------------------------------------------------------------
$clientPath = Join-Path $repoRoot 'client'
if (-not (Test-Path (Join-Path $clientPath 'node_modules'))) {
  Write-Warn2 "client/node_modules missing - run 'npm install' first, skipped"
} else {
  # Ensure .env exists so NEXT_PUBLIC_API_URL is set at build time.
  if (-not (Test-Path (Join-Path $clientPath '.env'))) {
    if (Test-Path (Join-Path $clientPath '.env.example')) {
      Copy-Item (Join-Path $clientPath '.env.example') (Join-Path $clientPath '.env')
      Write-Ok "Created client/.env from .env.example"
    } else {
      Write-Warn2 "client/.env missing and no .env.example found - client may not reach the API"
    }
  }

  $nextDir = Join-Path $clientPath '.next'
  if ($Rebuild -or -not (Test-Path (Join-Path $nextDir 'BUILD_ID'))) {
    Write-Step "Building client (next build)"
    Push-Location $clientPath
    try {
      npm run build
      if ($LASTEXITCODE -ne 0) { throw "client build failed" }
    } finally {
      Pop-Location
    }
    Write-Ok "client built"
  } else {
    Write-Ok "client already built (use -Rebuild to force)"
  }

  $stdoutLog = Join-Path $logDir 'client-prod.out.log'
  $stderrLog = Join-Path $logDir 'client-prod.err.log'
  Start-Process npm.cmd -ArgumentList 'run start' -WorkingDirectory $clientPath `
    -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog `
    -WindowStyle Hidden | Out-Null
  Write-Ok "client running (next start) - logs: $stdoutLog"
}

Write-Host ''
Write-Host 'All services started (production mode, no watch).' -ForegroundColor Green
Write-Host '  api-gateway: http://localhost:8080' -ForegroundColor Gray
Write-Host '  client:      http://localhost:3000' -ForegroundColor Gray
Write-Host '  RabbitMQ UI: http://localhost:15672 (guest/guest)' -ForegroundColor Gray
Write-Host ''
Write-Host 'Logs: .codex/run-logs/*.log' -ForegroundColor Gray
Write-Host 'Stop:  .\scripts\stop-all-services.ps1' -ForegroundColor Gray