#!/bin/sh
set -e
echo "Waiting for PostgreSQL to be ready..."

until PGPASSWORD="$POSTGRES_PASSWORD" psql -h postgres -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1" > /dev/null 2>&1; do
  echo "PostgreSQL is not ready yet. Retrying..."
  sleep 2
done

echo "PostgreSQL is ready. Starting the application..."
exec node app.js