<#
run_all_migrations.ps1
REVISED FIXED VERSION (Safe Quoting)
#>

$container = "doswallet-mysql"
$mysql_root_pw = "doswallet123"

# 1. LIST FILE INIT (Membuat DB, User, dan TABEL/SCHEMA)
$initFiles = @(
    "database/init/01_create_databases_and_users.sql",
    "database/init/02_schema_user.sql",
    "database/init/03_schema_wallet.sql",
    "database/init/04_schema_transaction.sql",
    "database/init/05_schema_notification.sql"
)

# 2. LIST FILE MIGRATION (Isi Data)
$migrationFiles = @(
    "database/migration/migrate_users.sql",
    "database/migration/migrate_wallets.sql",
    "database/migration/migrate_transactions.sql",
    "database/migration/migrate_notifications.sql"
)

function Exec-MySQLFile($path) {
    Write-Host "-> Executing: $path"
    if (-not (Test-Path $path)) {
        Write-Error "File not found: $path"
        return $false
    }

    # Menggunakan format quoting asli yang terbukti jalan di mesin Anda
    # Kita pipe konten file ke docker command
    Get-Content $path -Raw | docker exec -i $container sh -c "mysql -u root -p'$mysql_root_pw'"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Execution failed for $path (exit code $LASTEXITCODE)"
        return $false
    }
    return $true
}

# Ensure container is running
$running = docker ps -q -f "name=$container"
if (-not $running) {
    Write-Error "Container '$container' is not running. Start docker-compose first."
    exit 10
}

# Connectivity check
# KEMBALI KE FORMAT ASLI (Double quotes di luar, single di dalam) karena ini yang jalan di PC Anda
docker exec -i $container sh -c "mysql -u root -p'$mysql_root_pw' -e 'SELECT 1;'" > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Cannot connect to MySQL as root inside container. Check password/health."
    exit 11
}

# RUN INIT & SCHEMA (01 sampai 05)
Write-Host "`n--- STEP 1: Applying Init & Schemas ---"
foreach ($init in $initFiles) {
    if (-not (Exec-MySQLFile $init)) { exit 12 }
}

# Verify database exists
# MENGGUNAKAN TEKNIK LEBIH SIMPEL: Coba "USE" database. Jika gagal berarti DB tidak ada.
# Ini menghindari penggunaan tanda kutip yang rumit.
docker exec -i $container sh -c "mysql -u root -p'$mysql_root_pw' -e 'USE doswallet_user_db;'" > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Expected database 'doswallet_user_db' not found. Check init SQL."
    exit 13
}

# RUN MIGRATIONS
Write-Host "`n--- STEP 2: Running Data Migrations ---"
foreach ($m in $migrationFiles) {
    if (-not (Exec-MySQLFile $m)) { exit 20 }
}

# Verification
Write-Host "`n--- STEP 3: Verification (Row Counts) ---"
$queries = @(
    "SELECT 'users' AS table_name, (SELECT COUNT(*) FROM doswallet.users) AS source_rows, (SELECT COUNT(*) FROM doswallet_user_db.users) AS target_rows;",
    "SELECT 'wallets' AS table_name, (SELECT COUNT(*) FROM doswallet.wallets) AS source_rows, (SELECT COUNT(*) FROM doswallet_wallet_db.wallets) AS target_rows;",
    "SELECT 'transactions' AS table_name, (SELECT COUNT(*) FROM doswallet.transactions) AS source_rows, (SELECT COUNT(*) FROM doswallet_transaction_db.transactions) AS target_rows;",
    "SELECT 'notifications' AS table_name, (SELECT COUNT(*) FROM doswallet.notifications) AS source_rows, (SELECT COUNT(*) FROM doswallet_notification_db.notifications) AS target_rows;"
)

foreach ($q in $queries) {
    # Kita gunakan Write-Host dulu agar query terlihat jika ada error
    # Menggunakan format quoting yang aman: mengirim query lewat pipe (echo "query" | mysql)
    # Ini jauh lebih aman untuk string kompleks di PowerShell
    docker exec -i $container sh -c "echo ""$q"" | mysql -u root -p'$mysql_root_pw'"
}

Write-Host "`nDone. Migration Success!"; exit 0