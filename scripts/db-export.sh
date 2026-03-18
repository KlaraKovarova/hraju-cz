#!/usr/bin/env bash
# Export database via mysqldump over SSH.
# Usage: npm run db:export [output-file]

set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/ssh-tunnel.sh

OUT="${1:-scripts/data/db-dump.sql}"
mkdir -p "$(dirname "$OUT")"

echo "Exporting $DB_NAME via SSH ($SSH_USER@$SSH_HOST:$SSH_PORT)..."

ssh "${SSH_OPTS[@]}" "$SSH_USER@$SSH_HOST" \
  "mysqldump --user=$DB_USER --password=$DB_PASS $DB_NAME" \
  > "$OUT"

SIZE=$(du -h "$OUT" | cut -f1)
echo "Exported to: $OUT ($SIZE)"
