#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "$0")" >/dev/null 2>&1 && pwd)"

source "${SCRIPT_DIR}/postgresql-common.sh"

postgresql_require_command docker

CONTAINER_NAME="$(postgresql_resolve_value CINEMA_POSTGRES_CONTAINER 'moviehub-postgres-cinema')"
DB_NAME="$(postgresql_resolve_value CINEMA_POSTGRES_DB 'movie_hub_cinema')"
DB_SCHEMA="${DB_SCHEMA:-public}"

postgresql_validate_container_exists "$CONTAINER_NAME"

schema_count="$(postgresql_psql_scalar "$CONTAINER_NAME" "$DB_NAME" "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = '${DB_SCHEMA}';")"
postgresql_assert_equals "1" "$schema_count" "Schema ${DB_SCHEMA}"

assert_table_exists() {
  local table_name="$1"
  local exists

  exists="$(postgresql_psql_scalar "$CONTAINER_NAME" "$DB_NAME" "SELECT to_regclass(format('%I.%I', '${DB_SCHEMA}', '${table_name}')) IS NOT NULL;")"

  postgresql_assert_equals "t" "$exists" "Table ${DB_SCHEMA}.${table_name} exists"
}

assert_table_nonzero() {
  local table_name="$1"
  local count

  count="$(postgresql_psql_scalar "$CONTAINER_NAME" "$DB_NAME" "SELECT COUNT(*) FROM \"${DB_SCHEMA}\".\"${table_name}\";")"

  postgresql_assert_nonzero "$count" "Row count for ${DB_SCHEMA}.${table_name}"
}

for table_name in Cinemas Halls Seats Showtimes SeatReservations; do
  assert_table_exists "$table_name"
  assert_table_nonzero "$table_name"
done

orphan_halls="$(postgresql_psql_scalar "$CONTAINER_NAME" "$DB_NAME" "SELECT COUNT(*) FROM \"${DB_SCHEMA}\".\"Halls\" h LEFT JOIN \"${DB_SCHEMA}\".\"Cinemas\" c ON c.id = h.cinema_id WHERE c.id IS NULL;")"
postgresql_assert_zero "$orphan_halls" "Halls without cinemas"

orphan_seats="$(postgresql_psql_scalar "$CONTAINER_NAME" "$DB_NAME" "SELECT COUNT(*) FROM \"${DB_SCHEMA}\".\"Seats\" s LEFT JOIN \"${DB_SCHEMA}\".\"Halls\" h ON h.id = s.hall_id WHERE h.id IS NULL;")"
postgresql_assert_zero "$orphan_seats" "Seats without halls"

orphan_showtimes="$(postgresql_psql_scalar "$CONTAINER_NAME" "$DB_NAME" "SELECT COUNT(*) FROM \"${DB_SCHEMA}\".\"Showtimes\" st LEFT JOIN \"${DB_SCHEMA}\".\"Cinemas\" c ON c.id = st.cinema_id LEFT JOIN \"${DB_SCHEMA}\".\"Halls\" h ON h.id = st.hall_id WHERE c.id IS NULL OR h.id IS NULL;")"
postgresql_assert_zero "$orphan_showtimes" "Showtimes without cinema or hall parents"

orphan_reservations="$(postgresql_psql_scalar "$CONTAINER_NAME" "$DB_NAME" "SELECT COUNT(*) FROM \"${DB_SCHEMA}\".\"SeatReservations\" sr LEFT JOIN \"${DB_SCHEMA}\".\"Showtimes\" st ON st.id = sr.showtime_id LEFT JOIN \"${DB_SCHEMA}\".\"Seats\" s ON s.id = sr.seat_id WHERE st.id IS NULL OR s.id IS NULL;")"
postgresql_assert_zero "$orphan_reservations" "Seat reservations without parents"

postgresql_log "[cinema-service] Restore validation passed"