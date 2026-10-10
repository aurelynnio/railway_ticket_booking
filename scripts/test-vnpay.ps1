# =============================================================================
# VNPay Payment Flow - Automated Test Script
# Test: auth, ownership check, VNPay create/return/IPN verification
# =============================================================================
param(
    [string]$BASE = ""
)
if (-not $BASE) {
    if ($env:API_URL) {
        $BASE = $env:API_URL
    } else {
        $gwEnv = Join-Path (Split-Path -Parent $PSScriptRoot) "api-gateway\.env"
        if (Test-Path $gwEnv) {
            $portLine = Get-Content $gwEnv | Where-Object { $_ -match '^PORT=' } | Select-Object -First 1
            if ($portLine -match '^PORT=["'']?(\d+)["'']?') {
                $BASE = "http://localhost:$($Matches[1])"
            }
        }
        if (-not $BASE) { $BASE = "http://localhost:8080" }
    }
}
$PASS = 0
$FAIL = 0
$RESULTS = @()

function Test-Case($name, $condition, $detail = "") {
    if ($condition) {
        $script:PASS++
        $script:RESULTS += "[PASS] $name $detail"
        Write-Host "[PASS] $name $detail" -ForegroundColor Green
    } else {
        $script:FAIL++
        $script:RESULTS += "[FAIL] $name $detail"
        Write-Host "[FAIL] $name $detail" -ForegroundColor Red
    }
}

function Invoke-Api($method, $path, $body = $null, $session = $null) {
    $headers = @{ "Content-Type" = "application/json" }
    try {
        $params = @{
            Uri         = "$BASE$path"
            Method      = $method
            Headers     = $headers
            TimeoutSec  = 15
            ErrorAction = "Stop"
        }
        if ($body) { $params.Body = ($body | ConvertTo-Json -Depth 5) }
        if ($session) { $params.WebSession = $session }
        $resp = Invoke-WebRequest @params -UseBasicParsing
        return @{ status = $resp.StatusCode; body = ($resp.Content | ConvertFrom-Json); session = $resp }
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        $errBody = $_.ErrorDetails.Message
        return @{ status = $status; body = $errBody; error = $_.Exception.Message }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " VNPay Payment Flow - Automated Tests" -ForegroundColor Cyan
Write-Host " Target: $BASE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# =============================================================================
# 1. HEALTH CHECK (api-gateway + payments-service qua VNPay IPN endpoint)
# =============================================================================
Write-Host ">>> 1. Health Check" -ForegroundColor Yellow
$health = Invoke-Api "GET" "/payments/vnpay/ipn?vnp_TxnRef=healthcheck&vnp_SecureHash=invalid"
Test-Case "API Gateway + Payments service health" ($health.status -eq 200) "status=$($health.status)"

# =============================================================================
# 2. REGISTER 2 USERS (User A + User B)
# =============================================================================
Write-Host "`n>>> 2. Register Users" -ForegroundColor Yellow
$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$userA = @{ email = "testa_$ts@test.com"; password = "Password123"; username = "userA_$ts" }
$userB = @{ email = "testb_$ts@test.com"; password = "Password123"; username = "userB_$ts" }

$regA = Invoke-Api "POST" "/auth/register" $userA
Test-Case "Register User A" ($regA.status -eq 200 -or $regA.status -eq 201) "status=$($regA.status)"

$regB = Invoke-Api "POST" "/auth/register" $userB
Test-Case "Register User B" ($regB.status -eq 200 -or $regB.status -eq 201) "status=$($regB.status)"

# =============================================================================
# 3. LOGIN BOTH USERS (cookie-based)
# =============================================================================
Write-Host "`n>>> 3. Login Users (cookie-based)" -ForegroundColor Yellow
$sessionA = $null
try {
    $loginBodyA = @{ email = $userA.email; password = $userA.password } | ConvertTo-Json
    $loginA = Invoke-WebRequest -Uri "$BASE/auth/login" -Method POST -Body $loginBodyA -ContentType "application/json" -UseBasicParsing -SessionVariable sessionA -TimeoutSec 15
} catch {
    Write-Host "ERROR: Login User A failed at $BASE/auth/login" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure the API gateway is running at $BASE, then retry." -ForegroundColor Red
    exit 1
}
$hasTokenA = $sessionA.Cookies.GetCookies("$BASE/auth/login") | Where-Object { $_.Name -eq "accessToken" }
Test-Case "Login User A (cookie)" ($null -ne $hasTokenA) "hasAccessToken=$($null -ne $hasTokenA)"

$sessionB = $null
try {
    $loginBodyB = @{ email = $userB.email; password = $userB.password } | ConvertTo-Json
    $loginB = Invoke-WebRequest -Uri "$BASE/auth/login" -Method POST -Body $loginBodyB -ContentType "application/json" -UseBasicParsing -SessionVariable sessionB -TimeoutSec 15
} catch {
    Write-Host "ERROR: Login User B failed at $BASE/auth/login" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure the API gateway is running at $BASE, then retry." -ForegroundColor Red
    exit 1
}
$hasTokenB = $sessionB.Cookies.GetCookies("$BASE/auth/login") | Where-Object { $_.Name -eq "accessToken" }
Test-Case "Login User B (cookie)" ($null -ne $hasTokenB) "hasAccessToken=$($null -ne $hasTokenB)"

# =============================================================================
# 4. VNPay CREATE PAYMENT - No Auth (should 401)
# =============================================================================
Write-Host "`n>>> 4. VNPay Create - No Auth (expect 401)" -ForegroundColor Yellow
$noAuth = Invoke-Api "POST" "/payments/vnpay/create" @{ orderId = "00000000-0000-0000-0000-000000000000"; orderInfo = "test" }
Test-Case "Create payment without token -> 401" ($noAuth.status -eq 401) "status=$($noAuth.status)"

# =============================================================================
# 5. VNPay CREATE PAYMENT - With User A token (non-existent UUID order, expect 403)
# =============================================================================
Write-Host "`n>>> 5. VNPay Create - User A (fake order -> 403 not found)" -ForegroundColor Yellow
$createA = Invoke-Api "POST" "/payments/vnpay/create" @{ orderId = "00000000-0000-0000-0000-000000000000"; orderInfo = "Test payment" } $sessionA
Test-Case "Create payment with fake order -> 403" ($createA.status -eq 403) "status=$($createA.status)"

# =============================================================================
# 6. VNPay RETURN URL - Invalid signature
# =============================================================================
Write-Host "`n>>> 6. VNPay Return URL - Invalid signature" -ForegroundColor Yellow
# Dùng .NET HttpWebRequest để bắt chính xác status 302 (Invoke-WebRequest throw exception không catch được khi chạy qua -File)
try {
    $req = [System.Net.HttpWebRequest]::Create("$BASE/payments/vnpay/return?vnp_TxnRef=fake&vnp_SecureHash=invalid")
    $req.AllowAutoRedirect = $false
    $req.Method = "GET"
    $req.Timeout = 10000
    $resp = $req.GetResponse()
    $returnStatus = [int]$resp.StatusCode
    $resp.Close()
} catch [System.Net.WebException] {
    if ($_.Exception.Response) {
        $returnStatus = [int]$_.Exception.Response.StatusCode
    } else {
        $returnStatus = 0
    }
} catch {
    $returnStatus = 0
}
Test-Case "Return URL with bad signature -> redirect 302" ($returnStatus -eq 302 -or $returnStatus -eq 303) "status=$returnStatus"

# =============================================================================
# 7. VNPay IPN - Invalid checksum
# =============================================================================
Write-Host "`n>>> 7. VNPay IPN - Invalid checksum (expect RspCode=97)" -ForegroundColor Yellow
$ipnBad = Invoke-Api "GET" "/payments/vnpay/ipn?vnp_TxnRef=fake&vnp_SecureHash=invalid"
$ipnBody = $ipnBad.body
if ($ipnBody -is [string]) { 
    try { $ipnBody = $ipnBody | ConvertFrom-Json } catch { $ipnBody = @{ RspCode = "parse_error" } }
}
Test-Case "IPN bad checksum -> RspCode=97" ($ipnBody.RspCode -eq "97") "RspCode=$($ipnBody.RspCode)"

# =============================================================================
# 8. TẠO ORDER THẬT CHO USER A (QUA /orders/checkout) + OWNERSHIP CHECK
# =============================================================================
Write-Host "`n>>> 8. Create real order for User A + Ownership check" -ForegroundColor Yellow
$ticketsResp = Invoke-Api "GET" "/tickets?limit=20"
$selectedTicket = $null
$selectedItem = $null
if ($ticketsResp.status -eq 200 -and $ticketsResp.body.data) {
    foreach ($t in $ticketsResp.body.data) {
        if ($t.status -eq 1 -and $t.ticketItems) {
            foreach ($item in $t.ticketItems) {
                $avail = if ($null -ne $item.stockAvailable) { [int]$item.stockAvailable } elseif ($item.availableSeatLabels) { $item.availableSeatLabels.Count } else { 0 }
                if ($avail -gt 0) {
                    $selectedTicket = $t
                    $selectedItem = $item
                    break
                }
            }
        }
        if ($selectedTicket) { break }
    }
}

$orderAId = $null
if ($selectedTicket -and $selectedItem) {
    $seatList = @()
    if ($selectedItem.availableSeatLabels -and $selectedItem.availableSeatLabels.Count -gt 0) {
        $seatList = @($selectedItem.availableSeatLabels[0])
    }
    $unitPrice = if ($selectedItem.priceFlash -and [int]$selectedItem.priceFlash -gt 0) { [int]$selectedItem.priceFlash } elseif ($selectedItem.priceOriginal) { [int]$selectedItem.priceOriginal } else { 100000 }
    $orderPayload = @{
        ticketItemId  = $selectedItem.id
        ticketId      = $selectedTicket.id
        ticketTitle   = $(if ($selectedTicket.title) { $selectedTicket.title } else { "Test Ticket HN-SGN" })
        trainNumber   = $selectedTicket.trainNumber
        quantity      = 1
        unitPrice     = $unitPrice
        paymentMethod = "VNPAY"
        passengers    = @(@{ fullName = "User A"; passengerType = "ADULT" })
    }
    if ($seatList.Count -gt 0) {
        $orderPayload.seatLabels = $seatList
    }
    $createOrder = Invoke-Api "POST" "/orders/checkout" $orderPayload $sessionA
    if ($createOrder.status -eq 200 -or $createOrder.status -eq 201) {
        $orderAId = if ($createOrder.body.order) { $createOrder.body.order.id } else { $createOrder.body.id }
    }
    Test-Case "Create order for User A" ($null -ne $orderAId) "orderId=$orderAId status=$($createOrder.status)"
} else {
    Test-Case "Create order for User A (no available published ticket found)" $false "Run seed-complete.mjs first"
}

if ($orderAId) {
    # User A truy cập order của mình -> 200
    $accessA = Invoke-Api "GET" "/orders/$orderAId" $null $sessionA
    Test-Case "User A access own order -> 200" ($accessA.status -eq 200) "status=$($accessA.status)"

    # User B cố truy cập order của User A -> 403
    $accessB = Invoke-Api "GET" "/orders/$orderAId" $null $sessionB
    Test-Case "User B access User A's order -> 403" ($accessB.status -eq 403) "status=$($accessB.status)"
} else {
    Test-Case "Ownership check" $false "skipped due to missing order"
}

# =============================================================================
# 9. VNPay CREATE PAYMENT - User B tries to pay User A's order (expect 403)
# =============================================================================
Write-Host "`n>>> 9. VNPay Create - User B pays User A's order (expect 403)" -ForegroundColor Yellow
if ($orderAId) {
    $payB = Invoke-Api "POST" "/payments/vnpay/create" @{ orderId = $orderAId; orderInfo = "Hijack attempt" } $sessionB
    Test-Case "User B pays User A's order -> 403" ($payB.status -eq 403) "status=$($payB.status)"

    # Bonus: User A tạo payment cho order của mình -> 201
    $payA = Invoke-Api "POST" "/payments/vnpay/create" @{ orderId = $orderAId; orderInfo = "My order payment" } $sessionA
    $hasUrl = $null -ne $payA.body -and $payA.body.paymentUrl -match '^https://sandbox\.vnpayment\.vn/paymentv2/vpcpay\.html\?'
    Test-Case "User A pays own order -> 201 with valid sandbox URL" (($payA.status -eq 200 -or $payA.status -eq 201) -and $hasUrl) "status=$($payA.status)"

    # Clean up test order so reserved seat/stock is released
    $null = Invoke-Api "POST" "/orders/$orderAId/cancel" @{ reason = "VNPay automated test cleanup" } $sessionA
} else {
    Test-Case "User B pays User A's order" $false "skipped due to missing order"
}

# =============================================================================
# SUMMARY
# =============================================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " SUMMARY: $PASS passed, $FAIL failed" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

if ($FAIL -gt 0) {
    Write-Host "Failed tests:" -ForegroundColor Red
    $RESULTS | Where-Object { $_ -like "[FAIL]*" } | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    exit 1
}
