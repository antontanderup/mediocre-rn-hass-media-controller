#!/bin/bash
set -euo pipefail

# Only run in remote (web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo "Installing dependencies..."
yarn install

echo "Running expo prebuild..."
yarn expo prebuild --no-install

echo "Session setup complete."
