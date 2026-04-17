#!/usr/bin/env bash
# SIL-681 — Plan B static fallback snapshot orchestrator.
#
# Runs `prisma generate` (ensures Prisma Client matches the checked-out
# schema), starts `next dev` on a free port, waits for readiness, runs
# the crawler, then shuts the dev server down.
#
# Uses `next dev` rather than `next build`/`next start` so the snapshot
# survives schema drift (e.g. tables awaiting `prisma db push`): with
# dev mode, only the pages we actually crawl are compiled, and a single
# failing route doesn't abort the whole run.
#
# Usage:
#   bash scripts/build-static-snapshot.sh
# or
#   npm run snapshot
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PORT="${SNAPSHOT_PORT:-3930}"
BASE_URL="http://localhost:${PORT}"
LOG="$ROOT/out-static-build.log"

if [ "${SNAPSHOT_SKIP_PRISMA_GENERATE:-0}" != "1" ]; then
  echo "[snapshot] prisma generate..."
  npx prisma generate
fi

echo "[snapshot] starting next dev on :${PORT}..."
mkdir -p "$(dirname "$LOG")"
: > "$LOG"
PORT="$PORT" npx next dev -p "$PORT" > "$LOG" 2>&1 &
SERVER_PID=$!

cleanup() {
  if kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "[snapshot] stopping next dev (pid ${SERVER_PID})"
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "[snapshot] waiting for server to become ready..."
for i in $(seq 1 120); do
  if curl -sf -o /dev/null "${BASE_URL}/robots.txt"; then
    echo "[snapshot] server ready after ${i}s"
    break
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "[snapshot] next dev exited unexpectedly. Log tail:"
    tail -n 40 "$LOG"
    exit 1
  fi
  sleep 1
done

if ! curl -sf -o /dev/null "${BASE_URL}/robots.txt"; then
  echo "[snapshot] server did not become ready within 120s"
  tail -n 40 "$LOG"
  exit 1
fi

echo "[snapshot] crawling..."
SNAPSHOT_BASE_URL="$BASE_URL" npx tsx scripts/build-static-snapshot.ts

echo "[snapshot] done. Output in out-static/"
