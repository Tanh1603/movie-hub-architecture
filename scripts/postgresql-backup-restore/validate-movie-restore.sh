#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "$0")" >/dev/null 2>&1 && pwd)"

source "${SCRIPT_DIR}/postgresql-common.sh"

postgresql_require_command docker

CONTAINER_NAME="$(postgresql_resolve_value MOVIE_POSTGRES_CONTAINER 'moviehub-postgres-movie')"
DB_NAME="$(postgresql_resolve_value MOVIE_POSTGRES_DB 'movie_hub_movie')"
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

for table_name in movies movie_releases genres movie_genres; do
  assert_table_exists "$table_name"
  assert_table_nonzero "$table_name"
done

orphan_movie_releases="$(postgresql_psql_scalar "$CONTAINER_NAME" "$DB_NAME" "SELECT COUNT(*) FROM \"${DB_SCHEMA}\".\"movie_releases\" mr LEFT JOIN \"${DB_SCHEMA}\".\"movies\" m ON m.id = mr.movie_id WHERE m.id IS NULL;")"
postgresql_assert_zero "$orphan_movie_releases" "Movie releases without movies"

orphan_movie_genres="$(postgresql_psql_scalar "$CONTAINER_NAME" "$DB_NAME" "SELECT COUNT(*) FROM \"${DB_SCHEMA}\".\"movie_genres\" mg LEFT JOIN \"${DB_SCHEMA}\".\"movies\" m ON m.id = mg.movie_id LEFT JOIN \"${DB_SCHEMA}\".\"genres\" g ON g.id = mg.genre_id WHERE m.id IS NULL OR g.id IS NULL;")"
postgresql_assert_zero "$orphan_movie_genres" "Movie genres without parent rows"

postgresql_log "[movie-service] Restore validation passed"