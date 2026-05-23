#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "$0")" >/dev/null 2>&1 && pwd)"
source "${SCRIPT_DIR}/../postgresql/postgresql-common.sh"

BACKUP_DIR="$(postgresql_backup_dir)"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

if [[ ! -d "$BACKUP_DIR" ]]; then
  postgresql_fail "Backup directory not found: ${BACKUP_DIR}"
fi

postgresql_log "[retention] Backup directory: ${BACKUP_DIR}"
postgresql_log "[retention] Retention days: ${RETENTION_DAYS}"

deleted_count=0

while IFS= read -r -d '' expired_file; do
  postgresql_log "[retention] Removing expired backup: ${expired_file}"
  rm -f "$expired_file"
  deleted_count=$((deleted_count + 1))
done < <(find "$BACKUP_DIR" -type f -name '*.dump' -mtime +"$RETENTION_DAYS" -print0)

postgresql_log "[retention] Deleted files: ${deleted_count}"
