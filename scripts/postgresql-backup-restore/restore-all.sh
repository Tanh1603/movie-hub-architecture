#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "$0")" >/dev/null 2>&1 && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/../.." >/dev/null 2>&1 && pwd)"

source "${SCRIPT_DIR}/postgresql-common.sh"

postgresql_require_command docker

BACKUP_DIR="${BACKUP_DIR:-${PROJECT_ROOT}/backups/postgresql}"
POSTGRESQL_USER="$(postgresql_resolve_value POSTGRESQL_USER 'postgres')"

booking_container="$(postgresql_resolve_value BOOKING_POSTGRES_CONTAINER 'moviehub-postgres-booking')"
cinema_container="$(postgresql_resolve_value CINEMA_POSTGRES_CONTAINER 'moviehub-postgres-cinema')"
movie_container="$(postgresql_resolve_value MOVIE_POSTGRES_CONTAINER 'moviehub-postgres-movie')"
user_container="$(postgresql_resolve_value USER_POSTGRES_CONTAINER 'moviehub-postgres-user')"

booking_db="$(postgresql_resolve_value BOOKING_POSTGRES_DB 'movie_hub_booking')"
cinema_db="$(postgresql_resolve_value CINEMA_POSTGRES_DB 'movie_hub_cinema')"
movie_db="$(postgresql_resolve_value MOVIE_POSTGRES_DB 'movie_hub_movie')"
user_db="$(postgresql_resolve_value USER_POSTGRES_DB 'movie_hub_user')"

booking_dump="${BOOKING_DUMP:-$(postgresql_latest_dump "$BACKUP_DIR" "booking-service")}"
cinema_dump="${CINEMA_DUMP:-$(postgresql_latest_dump "$BACKUP_DIR" "cinema-service")}"
movie_dump="${MOVIE_DUMP:-$(postgresql_latest_dump "$BACKUP_DIR" "movie-service")}"
user_dump="${USER_DUMP:-$(postgresql_latest_dump "$BACKUP_DIR" "user-service")}"

restore_one() {
  local service_name="$1"
  local dump_file="$2"
  local container_name="$3"
  local db_name="$4"
  local tmp_dump="/tmp/${service_name}-restore-$$.dump"

  postgresql_validate_dump_exists "$dump_file"
  postgresql_validate_container_exists "$container_name"

  postgresql_log "[${service_name}] Copy dump to container: ${container_name}"
  docker cp "$dump_file" "${container_name}:${tmp_dump}"

  postgresql_log "[${service_name}] Restoring database: ${db_name}"
  if ! postgresql_docker exec -i "$container_name" \
    pg_restore \
      --verbose \
      --exit-on-error \
      --clean \
      --if-exists \
      --no-owner \
      --no-privileges \
      --single-transaction \
      -U "$POSTGRESQL_USER" \
      -d "$db_name" \
      "$tmp_dump"; then
    postgresql_docker exec -i "$container_name" rm -f "$tmp_dump" >/dev/null 2>&1 || true
    postgresql_fail "[${service_name}] Restore failed"
  fi

  postgresql_docker exec -i "$container_name" rm -f "$tmp_dump" >/dev/null 2>&1 || true
  postgresql_log "[${service_name}] Restore completed"
}

postgresql_log "[restore-all] Starting ordered restore"
postgresql_log "[restore-all] Order: booking -> cinema -> movie -> user"

restore_one "booking-service" "$booking_dump" "$booking_container" "$booking_db"
restore_one "cinema-service" "$cinema_dump" "$cinema_container" "$cinema_db"
restore_one "movie-service" "$movie_dump" "$movie_container" "$movie_db"
restore_one "user-service" "$user_dump" "$user_container" "$user_db"

postgresql_log "[restore-all] All restores completed"