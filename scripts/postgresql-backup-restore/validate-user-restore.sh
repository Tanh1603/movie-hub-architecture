#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "$0")" >/dev/null 2>&1 && pwd)"

source "${SCRIPT_DIR}/postgresql-common.sh"

postgresql_require_command docker

CONTAINER_NAME="$(postgresql_resolve_value USER_POSTGRES_CONTAINER 'moviehub-postgres-user')"
DB_NAME="$(postgresql_resolve_value USER_POSTGRES_DB 'movie_hub_user')"
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

for table_name in roles permissions user_roles role_permissions staffs settings; do
  assert_table_exists "$table_name"
  assert_table_nonzero "$table_name"
done

orphan_user_roles="$(postgresql_psql_scalar "$CONTAINER_NAME" "$DB_NAME" "SELECT COUNT(*) FROM \"${DB_SCHEMA}\".\"user_roles\" ur LEFT JOIN \"${DB_SCHEMA}\".\"roles\" r ON r.id = ur.role_id WHERE r.id IS NULL;")"
postgresql_assert_zero "$orphan_user_roles" "User roles without roles"

orphan_role_permissions="$(postgresql_psql_scalar "$CONTAINER_NAME" "$DB_NAME" "SELECT COUNT(*) FROM \"${DB_SCHEMA}\".\"role_permissions\" rp LEFT JOIN \"${DB_SCHEMA}\".\"roles\" r ON r.id = rp.role_id LEFT JOIN \"${DB_SCHEMA}\".\"permissions\" p ON p.id = rp.permission_id WHERE r.id IS NULL OR p.id IS NULL;")"
postgresql_assert_zero "$orphan_role_permissions" "Role permissions without parent rows"

postgresql_log "[user-service] Restore validation passed"