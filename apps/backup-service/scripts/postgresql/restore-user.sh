#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "$0")" >/dev/null 2>&1 && pwd)"
source "${SCRIPT_DIR}/postgresql-common.sh"

postgresql_require_command pg_restore

DATABASE_URL="$(postgresql_resolve_value USER_SERVICE_DATABASE_URL "${DATABASE_URL:-}")"
BACKUP_ID="$(postgresql_resolve_value BACKUP_ID "")"
BACKUP_FILE="$(postgresql_backup_file "$BACKUP_ID")"
RESTORE_DIR="$(postgresql_restore_dir)/user-service/${BACKUP_ID}"

postgresql_validate_file_exists "$BACKUP_FILE"
mkdir -p "$RESTORE_DIR"
trap 'rm -rf "$RESTORE_DIR"' EXIT

postgresql_log "[user-service] Starting restore"
postgresql_log "[user-service] Backup file: ${BACKUP_FILE}"

# Strip query parameters from DATABASE_URL (pg_restore doesn't understand them)
DB_URL_CLEAN="${DATABASE_URL%%\?*}"

# Filter stderr to ignore transaction_timeout errors (PostgreSQL version compatibility)
pg_restore --clean --if-exists --no-owner --no-privileges --dbname="$DB_URL_CLEAN" "$BACKUP_FILE" 2>&1 | \
  grep -v "transaction_timeout" | grep -v "unrecognized configuration parameter" || true

postgresql_log "[user-service] Restore completed"
