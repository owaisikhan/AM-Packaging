#!/usr/bin/env bash
# Applies every migration to a throwaway local Postgres database and runs the
# rule tests as an admin and a worker. Needs a local Postgres you can reach as
# the postgres user. Never point this at the live Supabase project.
set -euo pipefail
cd "$(dirname "$0")/.."
DB=${DB:-am_rules_test}
su postgres -c "dropdb --if-exists $DB; createdb $DB"
cat tests/00_supabase_stub.sql migrations/*.sql | su postgres -c "psql -v ON_ERROR_STOP=1 -q -d $DB"
su postgres -c "psql -q -d $DB" < tests/rules_test.sql
