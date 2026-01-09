# DOSWALLET Testing Script
# Script untuk testing backend dan frontend DOSWALLET

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DOSWALLET Testing Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to test HTTP endpoint
function Test-Endpoint {
    param(
        [string]$Url,
        [string]$ServiceName
    )
    
    Write-Host "Testing $ServiceName..." -NoNewline
    try {
        $response = Invoke-WebRequest -Uri $Url -Method POST -ContentType "application/json" -Body '{"query":"{ __typename }"}' -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host " [OK]" -ForegroundColor Green
            return $true
        } else {
            Write-Host " [FAILED - Status: $($response.StatusCode)]" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host " [FAILED - $($_.Exception.Message)]" -ForegroundColor Red
        return $false
    }
}

# Function to test port
function Test-Port {
    param(
        [int]$Port,
        [string]$ServiceName
    )
    
    Write-Host "Testing $ServiceName (Port $Port)..." -NoNewline
    $result = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($result) {
        Write-Host " [OK]" -ForegroundColor Green
        return $true
    } else {
        Write-Host " [FAILED - Port not accessible]" -ForegroundColor Red
        return $false
    }
}

# Test Backend Services
Write-Host "=== Backend Services Test ===" -ForegroundColor Yellow
Write-Host ""

$backendResults = @{
    "User Service" = Test-Endpoint "http://localhost:5001/graphql" "User Service GraphQL"
    "Wallet Service" = Test-Endpoint "http://localhost:5002/graphql" "Wallet Service GraphQL"
    "Transaction Service" = Test-Endpoint "http://localhost:5003/graphql" "Transaction Service GraphQL"
    "Notification Service" = Test-Endpoint "http://localhost:5004/graphql" "Notification Service GraphQL"
}

Write-Host ""
Write-Host "=== Frontend Test ===" -ForegroundColor Yellow
Write-Host ""

$frontendResults = @{
    "Frontend Web" = Test-Port 3000 "Frontend Web (Port 3000)"
}

Write-Host ""
Write-Host "=== Docker Containers Status ===" -ForegroundColor Yellow
Write-Host ""

try {
    $containers = docker ps --filter "name=doswallet" --format "table {{.Names}}\t{{.Status}}"
    Write-Host $containers
} catch {
    Write-Host "Docker command failed. Make sure Docker is running." -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
Write-Host ""

$allBackendPassed = $backendResults.Values -notcontains $false
$allFrontendPassed = $frontendResults.Values -notcontains $false

if ($allBackendPassed) {
    Write-Host "Backend Services: [PASS]" -ForegroundColor Green
} else {
    Write-Host "Backend Services: [FAIL]" -ForegroundColor Red
}

if ($allFrontendPassed) {
    Write-Host "Frontend: [PASS]" -ForegroundColor Green
} else {
    Write-Host "Frontend: [FAIL - Not running. Start with: cd frontend-web; npm run dev]" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== GraphQL Endpoints ===" -ForegroundColor Cyan
Write-Host "User Service: http://localhost:5001/graphql"
Write-Host "Wallet Service: http://localhost:5002/graphql"
Write-Host "Transaction Service: http://localhost:5003/graphql"
Write-Host "Notification Service: http://localhost:5004/graphql"
Write-Host "Frontend Web: http://localhost:3000"
Write-Host ""

if ($allBackendPassed -and $allFrontendPassed) {
    Write-Host "All tests passed! System is ready." -ForegroundColor Green
} elseif ($allBackendPassed) {
    Write-Host "Backend is ready. Start frontend to complete testing." -ForegroundColor Yellow
} else {
    Write-Host "Some services are not running. Check Docker containers." -ForegroundColor Red
}

Write-Host ""

