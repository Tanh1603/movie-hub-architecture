#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "$0")" >/dev/null 2>&1 && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/../.." >/dev/null 2>&1 && pwd)"

source "${SCRIPT_DIR}/postgresql-common.sh"

postgresql_require_command docker

BACKUP_DIR="${BACKUP_DIR:-${PROJECT_ROOT}/backups/postgresql}"
CONTAINER_NAME="$(postgresql_resolve_value CINEMA_POSTGRES_CONTAINER 'moviehub-postgres-cinema')"
DB_NAME="$(postgresql_resolve_value CINEMA_POSTGRES_DB 'movie_hub_cinema')"
POSTGRESQL_USER="$(postgresql_resolve_value POSTGRESQL_USER 'postgres')"
TIMESTAMP="$(date +%Y%m%dT%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/cinema-service-${TIMESTAMP}.dump"

postgresql_validate_container_exists "$CONTAINER_NAME"

mkdir -p "$BACKUP_DIR"
trap 'rm -f "$BACKUP_FILE"' ERR

postgresql_log "[cinema-service] Starting backup"
postgresql_log "[cinema-service] Container: ${CONTAINER_NAME}"
postgresql_log "[cinema-service] Database: ${DB_NAME}"
postgresql_log "[cinema-service] Destination: ${BACKUP_FILE}"

docker exec -i "$CONTAINER_NAME" \
	pg_dump -Fc --no-owner --no-privileges -U "$POSTGRESQL_USER" -d "$DB_NAME" > "$BACKUP_FILE"

postgresql_log "[cinema-service] Backup completed"