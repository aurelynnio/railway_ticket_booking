[CmdletBinding()]
param(
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$services = @(
  'auth-service',
  'tickets-service',
  'orders-service',
  'payments-service',
  'notification-service'
)

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

foreach ($service in $services) {
  $servicePath = Join-Path $repositoryRoot $service

  if (-not (Test-Path -LiteralPath $servicePath -PathType Container)) {
    throw "Missing service directory: $servicePath"
  }

  Write-Host "[$service] drizzle-kit migrate"

  if ($DryRun) {
    continue
  }

  Push-Location $servicePath
  try {
    npx drizzle-kit migrate
    if ($LASTEXITCODE -ne 0) {
      throw "Drizzle migration failed for $service"
    }
  }
  finally {
    Pop-Location
  }
}
