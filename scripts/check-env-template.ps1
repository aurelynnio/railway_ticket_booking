param()

$ErrorActionPreference = "Stop"

$services = @(
  "auth-service",
  "users-service",
  "orders-service",
  "payments-service",
  "notification-service",
  "search-service",
  "tickets-service",
  "api-gateway",
  "client"
)

foreach ($svc in $services) {
  $envPath = Join-Path $svc ".env"
  $examplePath = Join-Path $svc ".env.example"

  if (!(Test-Path $examplePath)) {
    continue
  }

  $envKeys = @()
  if (Test-Path $envPath) {
    $envKeys = Get-Content $envPath |
      Where-Object { $_ -match '^[A-Z0-9_]+=' } |
      ForEach-Object { ($_ -split '=', 2)[0] }
  }

  $exampleKeys = Get-Content $examplePath |
    Where-Object { $_ -match '^[A-Z0-9_]+=' } |
    ForEach-Object { ($_ -split '=', 2)[0] }

  $missingInEnv = $exampleKeys | Where-Object { $_ -notin $envKeys }
  $extraInEnv = $envKeys | Where-Object { $_ -notin $exampleKeys }

  Write-Output "[$svc]"
  Write-Output ("missing_in_env: " + ($missingInEnv -join ", "))
  Write-Output ("extra_in_env: " + ($extraInEnv -join ", "))
  Write-Output ""
}
