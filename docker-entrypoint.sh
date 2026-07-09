#!/bin/sh
set -e

echo "▸ Waiting for database…"
if [ -n "$DATABASE_URL" ]; then
  # crude wait-for-postgres using pg_isready against the compose host `db`
  until pg_isready -h "${DB_HOST:-db}" -p "${DB_PORT:-5432}" >/dev/null 2>&1; do
    echo "  …database not ready yet, retrying"
    sleep 2
  done
fi

echo "▸ Applying database schema (prisma db push)…"
npx prisma db push --skip-generate

if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "▸ Seeding demo data…"
  npm run db:seed || echo "  (seed skipped or already applied)"
fi

echo "▸ Starting app: $*"
exec "$@"
