#!/bin/sh
set -eu

echo "[docker-entrypoint] Waiting for PostgreSQL at ${DB_HOST:-postgres}:${DB_PORT:-5432}..."
until nc -z "${DB_HOST:-postgres}" "${DB_PORT:-5432}"; do
  sleep 1
done

echo "[docker-entrypoint] Generating Prisma clients (main + lab)..."
npx prisma generate --schema=prisma/schema.prisma
npx prisma generate --schema=prisma/lab/schema.prisma

echo "[docker-entrypoint] Applying main database migrations (bloodbank)..."
npx prisma migrate deploy --schema=prisma/schema.prisma

echo "[docker-entrypoint] Applying lab database migrations (bloodbank_lab)..."
npx prisma migrate deploy --schema=prisma/lab/schema.prisma

if [ "${SEED_DB:-false}" = "true" ]; then
  echo "[docker-entrypoint] SEED_DB=true -> running seed script..."
  npm run prisma:seed || echo "[docker-entrypoint] Seed failed (continuing)."
fi

echo "[docker-entrypoint] Starting Blood Bank Hub backend..."
exec npm run start
