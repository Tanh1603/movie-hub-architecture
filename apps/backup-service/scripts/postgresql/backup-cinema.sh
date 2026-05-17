#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "$0")" >/dev/null 2>&1 && pwd)"
source "${SCRIPT_DIR}/postgresql-common.sh"

postgresql_require_command pg_dump

BACKUP_DIR="$(postgresql_backup_dir)"
DATABASE_URL="$(postgresql_resolve_value CINEMA_SERVICE_DATABASE_URL "${DATABASE_URL:-}")"
BACKUP_ID="${BACKUP_ID:-cinema-service-$(date +%Y%m%dT%H%M%S)}"
BACKUP_FILE="$(postgresql_backup_file "$BACKUP_ID")"

mkdir -p "$BACKUP_DIR"
trap 'rm -f "$BACKUP_FILE"' ERR

postgresql_log "[cinema-service] Starting backup"
postgresql_log "[cinema-service] Destination: ${BACKUP_FILE}"

# Strip query parameters from DATABASE_URL (pg_dump doesn't understand them)
DB_URL_CLEAN="${DATABASE_URL%%\?*}"
pg_dump "$DB_URL_CLEAN" -Fc --no-owner --no-privileges > "$BACKUP_FILE"

postgresql_log "[cinema-service] Backup completed"
