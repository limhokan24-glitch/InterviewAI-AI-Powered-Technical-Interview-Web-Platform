#!/bin/sh
set -e

# Only one container should apply the schema + seed (set RUN_MIGRATIONS=true on it).
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "[entrypoint] Applying database schema..."
  npx prisma db push --skip-generate
  echo "[entrypoint] Seeding database..."
  npm run db:seed || echo "[entrypoint] seed skipped/failed (continuing)"
fi

exec "$@"
