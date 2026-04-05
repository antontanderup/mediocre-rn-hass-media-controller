#!/usr/bin/env bash
# Checks if the app version has changed since the last successful build on main
# Exits with 0 if changed, 1 if not changed (so job can be skipped)

set -euo pipefail

# Get current version from package.json
CUR_VERSION=$(node -p "require('./package.json').version")

echo "Current version: $CUR_VERSION"

# Fetch the last successful commit on main (excluding current commit)
git fetch origin main --depth=2
LAST_MAIN=$(git rev-parse origin/main)

# Get version from package.json at last main commit
PREV_VERSION=$(git show "$LAST_MAIN:package.json" | node -p "JSON.parse(require('fs').readFileSync(0)).version")

echo "Previous version on main: $PREV_VERSION"

if [[ "$CUR_VERSION" == "$PREV_VERSION" ]]; then
  echo "Version unchanged. Skipping build."
  exit 1
else
  echo "Version changed. Proceeding with build."
  exit 0
fi
