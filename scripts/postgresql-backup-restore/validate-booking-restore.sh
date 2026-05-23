#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "$0")" >/dev/null 2>&1 && pwd)"

source "${SCRIPT_DIR}/postgresql-common.sh"

postgresql_require_command docker

CONTAINER_NAME="$(postgresql_resolve_value BOOKING_POSTGRES_CONTAINER 'moviehub-postgres-booking')"
DB_NAME="$(postgresql_resolve_value BOOKING_POSTGRES_DB 'movie_hub_booking')"
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

for table_name in Bookings Payments Tickets Refunds BookingConcessions LoyaltyAccounts LoyaltyTransactions; do
  assert_table_exists "$table_name"
  assert_table_nonzero "$table_name"
done

completed_without_payment="$(postgresql_psql_scalar "$CONTAINER_NAME" "$DB_NAME" "SELECT COUNT(*) FROM \"${DB_SCHEMA}\".\"Bookings\" b LEFT JOIN \"${DB_SCHEMA}\".\"Payments\" p ON p.booking_id = b.id WHERE b.payment_status = 'COMPLETED' AND p.id IS NULL;")"
postgresql_assert_zero "$completed_without_payment" "Completed bookings without payments"

orphan_tickets="$(postgresql_psql_scalar "$CONTAINER_NAME" "$DB_NAME" "SELECT COUNT(*) FROM \"${DB_SCHEMA}\".\"Tickets\" t LEFT JOIN \"${DB_SCHEMA}\".\"Bookings\" b ON b.id = t.booking_id WHERE b.id IS NULL;")"
postgresql_assert_zero "$orphan_tickets" "Tickets without bookings"

orphan_booking_concessions="$(postgresql_psql_scalar "$CONTAINER_NAME" "$DB_NAME" "SELECT COUNT(*) FROM \"${DB_SCHEMA}\".\"BookingConcessions\" bc LEFT JOIN \"${DB_SCHEMA}\".\"Bookings\" b ON b.id = bc.booking_id LEFT JOIN \"${DB_SCHEMA}\".\"Concessions\" c ON c.id = bc.concession_id WHERE b.id IS NULL OR c.id IS NULL;")"
postgresql_assert_zero "$orphan_booking_concessions" "Booking concessions without parent rows"

postgresql_log "[booking-service] Restore validation passed"