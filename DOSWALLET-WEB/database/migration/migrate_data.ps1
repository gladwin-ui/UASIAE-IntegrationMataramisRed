# migrate_data.ps1
# Run this from repository root on a machine with docker running.
# It executes migration SQL files inside the running MySQL container (doswallet-mysql).

$mysql_root_pw = "doswallet123"
$container = "doswallet-mysql"

# List of migration files in the order to run
$files = @(
  "database/migration/migrate_users.sql",
  "database/migration/migrate_wallets.sql",
  "database/migration/migrate_transactions.sql",
  "database/migration/migrate_notifications.sql"
)

# Ensure per-service databases and users exist (run init script if present)
$initScript = "database/init/01_create_databases_and_users.sql"
if (Test-Path $initScript) {
    Write-Host "Applying init script: $initScript"
    Get-Content $initScript -Raw | docker exec -i $container sh -c "mysql -u root -p'$mysql_root_pw'"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to execute init script $initScript (exit code $LASTEXITCODE)"
        exit 2
    }
    # Verify one of the databases exists
    $checkOutput = docker exec -i $container sh -c "mysql -u root -p'$mysql_root_pw' -e \"SHOW DATABASES LIKE 'doswallet_user_db';\""
    if ($LASTEXITCODE -ne 0 -or $checkOutput -notmatch 'doswallet_user_db') {
        Write-Error "Expected database 'doswallet_user_db' not found after running init script. Inspect container logs and init SQL."
        exit 2
    }
} else {
    Write-Warning "Init script $initScript not found, skipping creation step."
}

foreach ($f in $files) {
    Write-Host "Executing $f ..."

    # Check connectivity first
    # Use sh -c wrapper for reliable quoting and stdin behavior
    docker exec -i $container sh -c "mysql -u root -p'$mysql_root_pw' -e 'SELECT 1;'" > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Cannot connect to MySQL as root inside container '$container'. Ensure MYSQL_ROOT_PASSWORD is correct and container is healthy. Run: docker exec -it $container mysql -u root -p<password> -e \"SELECT User,Host FROM mysql.user;\" to debug."
        exit 2
    }

    # Use sh -c wrapper so piping from PowerShell goes into the client correctly
    Get-Content $f -Raw | docker exec -i $container sh -c "mysql -u root -p'$mysql_root_pw'"

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed executing $f (exit code $LASTEXITCODE)"
        exit 1
    }
}


Write-Host "Migration complete. Verify with the checks listed in database/SETUP_INSTRUCTIONS.md"