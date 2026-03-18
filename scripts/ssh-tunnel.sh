#!/usr/bin/env bash
# SSH helper for remote MySQL operations on Český hosting.
#
# NOTE: TCP forwarding (SSH tunnel) is disabled by the hosting provider.
# Instead, use mysqldump/mysqlimport over SSH:
#   npm run db:export   — dumps DB to scripts/data/db-dump.sql
#   npm run db:import   — imports scripts/data/db-dump.sql into DB
#
# SSH key auth is configured at ~/.ssh/id_ed25519_hrajucz

set -euo pipefail

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

SSH_HOST="${SSH_HOST:?Set SSH_HOST in .env}"
SSH_USER="${SSH_USER:?Set SSH_USER in .env}"
SSH_PORT="${SSH_PORT:-2741}"
SSH_KEY="$HOME/.ssh/id_ed25519_hrajucz"

SSH_OPTS=(-o StrictHostKeyChecking=no -p "$SSH_PORT")
if [ -f "$SSH_KEY" ]; then
  SSH_OPTS+=(-i "$SSH_KEY")
fi

# Parse DATABASE_URL for DB credentials
DB_URL="${DATABASE_URL:?Set DATABASE_URL in .env}"
DB_USER=$(echo "$DB_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
DB_PASS=$(echo "$DB_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
DB_NAME=$(echo "$DB_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')

export SSH_HOST SSH_USER SSH_PORT SSH_KEY DB_USER DB_PASS DB_NAME
export -a
