# Simple Database Setup - Untuk XAMPP/WAMP
# Script ini lebih sederhana untuk user yang pakai XAMPP/WAMP

Write-Host "DosWallet - Simple Database Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Cek XAMPP
$xamppPath = "C:\xampp\mysql\bin\mysql.exe"
$wampPath = "C:\wamp64\bin\mysql\mysql*\bin\mysql.exe"

$mysqlExe = $null

if (Test-Path $xamppPath) {
    $mysqlExe = $xamppPath
    Write-Host "✓ XAMPP MySQL ditemukan" -ForegroundColor Green
} elseif (Get-ChildItem "C:\wamp64\bin\mysql" -ErrorAction SilentlyContinue) {
    $wampMysql = Get-ChildItem "C:\wamp64\bin\mysql\mysql*\bin\mysql.exe" | Select-Object -First 1
    if ($wampMysql) {
        $mysqlExe = $wampMysql.FullName
        Write-Host "✓ WAMP MySQL ditemukan" -ForegroundColor Green
    }
}

if (-not $mysqlExe) {
    Write-Host "❌ XAMPP atau WAMP tidak ditemukan!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Silakan install XAMPP: https://www.apachefriends.org/" -ForegroundColor Yellow
    Write-Host "Atau gunakan MySQL Workbench untuk setup manual" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Setup database doswallet..." -ForegroundColor Yellow
Write-Host ""

# Baca SQL file
$sqlFile = Join-Path $PSScriptRoot "schema.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ File schema.sql tidak ditemukan!" -ForegroundColor Red
    exit 1
}

# Untuk XAMPP/WAMP biasanya password kosong
$password = Read-Host "MySQL Password (tekan Enter jika kosong)" -AsSecureString
$passwordPlain = ""
if ($password.Length -gt 0) {
    $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
    )
}

# Execute SQL
$sqlContent = Get-Content $sqlFile -Raw

try {
    if ([string]::IsNullOrWhiteSpace($passwordPlain)) {
        & $mysqlExe -u root -e $sqlContent
    } else {
        & $mysqlExe -u root -p$passwordPlain -e $sqlContent
    }
    
    Write-Host ""
    Write-Host "✓ Database berhasil dibuat!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Database: doswallet" -ForegroundColor Cyan
    Write-Host "Tables: users, wallets, transactions, notifications" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Selanjutnya:" -ForegroundColor Yellow
    Write-Host "1. Edit .env di setiap backend service" -ForegroundColor White
    Write-Host "2. Jalankan backend services" -ForegroundColor White
    Write-Host "3. Buka aplikasi Android" -ForegroundColor White
} catch {
    Write-Host ""
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternatif: Gunakan MySQL Workbench atau phpMyAdmin" -ForegroundColor Yellow
}

