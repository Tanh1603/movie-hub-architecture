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

postgresql_docker() {
  # Git Bash on Windows can rewrite container paths (for example /tmp/...) into host paths.
  # Disable argument conversion so Docker receives container paths unchanged.
  MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*' docker "$@"
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

postgresql_assert_equals() {
  local expected="$1"
  local actual="$2"
  local label="$3"

  if [[ "$actual" != "$expected" ]]; then
    postgresql_fail "${label} expected ${expected} but found ${actual}"
  fi
}

postgresql_assert_nonzero() {
  local value="$1"
  local label="$2"

  if [[ ! "$value" =~ ^[0-9]+$ ]]; then
    postgresql_fail "${label} returned a non-numeric value: ${value}"
  fi

  if (( value <= 0 )); then
    postgresql_fail "${label} expected > 0 but found ${value}"
  fi
}

postgresql_assert_zero() {
  local value="$1"
  local label="$2"

  if [[ ! "$value" =~ ^[0-9]+$ ]]; then
    postgresql_fail "${label} returned a non-numeric value: ${value}"
  fi

  if (( value != 0 )); then
    postgresql_fail "${label} expected 0 but found ${value}"
  fi
}

postgresql_latest_dump() {
  local backup_dir="$1"
  local prefix="$2"
  local -a dump_files=()

  shopt -s nullglob
  dump_files=("${backup_dir}/${prefix}-"*.dump)
  shopt -u nullglob

  if (( ${#dump_files[@]} == 0 )); then
    postgresql_fail "No dump files found for ${prefix} in ${backup_dir}."
  fi

  local latest_dump="${dump_files[0]}"
  local candidate

  for candidate in "${dump_files[@]}"; do
    if [[ "$candidate" -nt "$latest_dump" ]]; then
      latest_dump="$candidate"
    fi
  done

  printf '%s\n' "$latest_dump"
}

postgresql_validate_dump_exists() {
  local dump_file="$1"

  if [[ ! -f "$dump_file" ]]; then
    postgresql_fail "Missing dump file: ${dump_file}"
  fi
}

postgresql_validate_container_exists() {
  local container_name="$1"

  if ! postgresql_docker container inspect "$container_name" >/dev/null 2>&1; then
    postgresql_fail "Container not found: ${container_name}"
  fi
}

postgresql_psql_scalar() {
  local container_name="$1"
  local db_name="$2"
  local sql="$3"
  local pg_user="${POSTGRESQL_USER:-postgres}"

  postgresql_docker exec -i "$container_name" \
    psql -U "$pg_user" -d "$db_name" -X -v ON_ERROR_STOP=1 -Atq -c "$sql" | tr -d '[:space:]'
}