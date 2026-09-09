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

  Write-Host "[$service] prisma migrate deploy"

  if ($DryRun) {
    continue
  }

  Push-Location $servicePath
  try {
    npx prisma migrate deploy
    if ($LASTEXITCODE -ne 0) {
      throw "Prisma migration failed for $service"
    }
  }
  finally {
    Pop-Location
  }
}
