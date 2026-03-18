#!/usr/bin/env bash
# Import SQL file into remote database over SSH.
# Usage: npm run db:import [input-file]

set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/ssh-tunnel.sh

IN="${1:-scripts/data/db-dump.sql}"
if [ ! -f "$IN" ]; then
  echo "File not found: $IN"
  echo "Run 'npm run db:export' first, or specify a valid SQL file."
  exit 1
fi

SIZE=$(du -h "$IN" | cut -f1)
echo "Importing $IN ($SIZE) into $DB_NAME via SSH ($SSH_USER@$SSH_HOST:$SSH_PORT)..."

ssh "${SSH_OPTS[@]}" "$SSH_USER@$SSH_HOST" \
  "mysql --user=$DB_USER --password=$DB_PASS $DB_NAME" \
  < "$IN"

echo "Import complete."
