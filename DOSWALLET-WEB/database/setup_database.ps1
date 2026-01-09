# DosWallet Database Setup Script
# PowerShell script untuk setup database MySQL

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DosWallet Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Cek apakah MySQL terinstall
$mysqlPaths = @(
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe",
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\wamp64\bin\mysql\mysql8.0.xx\bin\mysql.exe",
    "C:\wamp\bin\mysql\mysql8.0.xx\bin\mysql.exe"
)

$mysqlExe = $null
foreach ($path in $mysqlPaths) {
    if (Test-Path $path) {
        $mysqlExe = $path
        Write-Host "✓ MySQL ditemukan di: $path" -ForegroundColor Green
        break
    }
}

if (-not $mysqlExe) {
    Write-Host ""
    Write-Host "❌ MySQL tidak ditemukan!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Pilih salah satu opsi:" -ForegroundColor Yellow
    Write-Host "1. Install MySQL Server: https://dev.mysql.com/downloads/mysql/" -ForegroundColor White
    Write-Host "2. Install XAMPP (include MySQL): https://www.apachefriends.org/" -ForegroundColor White
    Write-Host "3. Install WAMP (include MySQL): https://www.wampserver.com/" -ForegroundColor White
    Write-Host ""
    Write-Host "Atau gunakan MySQL Workbench untuk menjalankan SQL script secara manual." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "Masukkan informasi database MySQL:" -ForegroundColor Yellow
Write-Host ""

# Input database credentials
$dbUser = Read-Host "MySQL Username (default: root)"
if ([string]::IsNullOrWhiteSpace($dbUser)) {
    $dbUser = "root"
}

$dbPassword = Read-Host "MySQL Password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

$dbName = Read-Host "Database Name (default: doswallet)"
if ([string]::IsNullOrWhiteSpace($dbName)) {
    $dbName = "doswallet"
}

Write-Host ""
Write-Host "Membuat database dan tabel..." -ForegroundColor Yellow

# Baca SQL file
$sqlFile = Join-Path $PSScriptRoot "schema.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ File schema.sql tidak ditemukan!" -ForegroundColor Red
    exit 1
}

$sqlContent = Get-Content $sqlFile -Raw

# Replace database name in SQL
$sqlContent = $sqlContent -replace "doswallet", $dbName

# Create temp SQL file
$tempSqlFile = Join-Path $env:TEMP "doswallet_setup.sql"
$sqlContent | Out-File -FilePath $tempSqlFile -Encoding UTF8

# Execute MySQL command
try {
    $mysqlArgs = @(
        "-u", $dbUser,
        "-p$dbPasswordPlain",
        "-e", "source $tempSqlFile"
    )
    
    & $mysqlExe $mysqlArgs 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database berhasil dibuat!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Database: $dbName" -ForegroundColor Cyan
        Write-Host "Tables: users, wallets, transactions, notifications" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Error saat membuat database" -ForegroundColor Red
        Write-Host "Coba jalankan manual dengan MySQL Workbench atau command line" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternatif: Buka MySQL Workbench dan jalankan file schema.sql secara manual" -ForegroundColor Yellow
}

# Cleanup
if (Test-Path $tempSqlFile) {
    Remove-Item $tempSqlFile -Force
}

Write-Host ""
Write-Host "Setup selesai!" -ForegroundColor Green
Write-Host ""

