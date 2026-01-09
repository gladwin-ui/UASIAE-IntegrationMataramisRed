#!/usr/bin/env bash
# run_all_migrations.sh
# Bash helper (for Linux/macOS) that runs init + migrations and prints verification counts.

CONTAINER=doswallet-mysql
MYSQL_ROOT_PW=doswallet123

# Files
INIT_SCRIPT="database/init/01_create_databases_and_users.sql"
MIGS=(
  "database/migration/migrate_users.sql"
  "database/migration/migrate_wallets.sql"
  "database/migration/migrate_transactions.sql"
  "database/migration/migrate_notifications.sql"
)

# Check container
if [ -z "$(docker ps -q -f name=$CONTAINER)" ]; then
  echo "Container $CONTAINER not running. Start docker-compose first." >&2
  exit 1
fi

# connectivity
if ! docker exec -i $CONTAINER sh -c "mysql -u root -p'$MYSQL_ROOT_PW' -e 'SELECT 1;'" >/dev/null 2>&1; then
  echo "Cannot connect to MySQL inside $CONTAINER" >&2
  exit 2
fi

# Run init
if [ -f "$INIT_SCRIPT" ]; then
  echo "Applying init: $INIT_SCRIPT"
  docker exec -i $CONTAINER sh -c "mysql -u root -p'$MYSQL_ROOT_PW'" < "$INIT_SCRIPT"
else
  echo "Init script not found, skipping"
fi

# Run migrations
for m in "${MIGS[@]}"; do
  echo "Executing $m"
  docker exec -i $CONTAINER sh -c "mysql -u root -p'$MYSQL_ROOT_PW'" < "$m" || { echo "Failed $m" >&2; exit 3; }
done

# Verification
echo "\n--- Verification ---"
docker exec -i $CONTAINER sh -c "mysql -u root -p'$MYSQL_ROOT_PW' -e \"SELECT 'users', (SELECT COUNT(*) FROM doswallet.users), (SELECT COUNT(*) FROM doswallet_user_db.users);\""
# Add others similarly

echo "Done."
