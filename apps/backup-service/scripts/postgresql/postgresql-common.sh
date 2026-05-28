#!/usr/bin/env bash
set -euo pipefail

postgresql_log() {
  printf '%s\n' "$*"
}

postgresql_fail() {
  printf '%s\n' "$*" >&2
  exit 1
}

postgresql_require_command() {
  local command_name="$1"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    postgresql_fail "Required command not found: ${command_name}"
  fi
}

postgresql_resolve_value() {
  local env_name="$1"
  local fallback_value="$2"
  local resolved_value="${!env_name:-}"

  if [[ -z "$resolved_value" ]]; then
    resolved_value="$fallback_value"
  fi

  if [[ -z "$resolved_value" ]]; then
    postgresql_fail "No value available for ${env_name}."
  fi

  printf '%s\n' "$resolved_value"
}

postgresql_backup_root() {
  printf '%s\n' "${BACKUP_ROOT:-/data/backups}"
}

postgresql_restore_root() {
  printf '%s\n' "${RESTORE_ROOT:-/data/restores}"
}

postgresql_backup_dir() {
  printf '%s\n' "$(postgresql_backup_root)/postgresql"
}

postgresql_restore_dir() {
  printf '%s\n' "$(postgresql_restore_root)/postgresql"
}

postgresql_backup_file() {
  local backup_id="$1"
  printf '%s\n' "$(postgresql_backup_dir)/${backup_id}.dump"
}

postgresql_validate_file_exists() {
  local file_path="$1"

  if [[ ! -f "$file_path" ]]; then
    postgresql_fail "Missing file: ${file_path}"
  fi
}
