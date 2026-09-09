#!/bin/sh
set -eu

run_migration() {
  service="$1"
  database_url="$2"

  if [ -z "$database_url" ]; then
    echo "Missing database URL for $service" >&2
    exit 1
  fi

  echo "Applying Prisma migrations for $service"
  (
    cd "/workspace/$service"
    DATABASE_URL="$database_url" npx prisma migrate deploy
  )
}

run_migration auth-service "${AUTH_DATABASE_URL:-}"
run_migration orders-service "${ORDERS_DATABASE_URL:-}"
run_migration payments-service "${PAYMENTS_DATABASE_URL:-}"
run_migration notification-service "${NOTIFICATION_DATABASE_URL:-}"
run_migration tickets-service "${TICKETS_DATABASE_URL:-}"
