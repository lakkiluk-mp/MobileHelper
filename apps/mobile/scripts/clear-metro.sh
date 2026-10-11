#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
rm -rf node_modules/.cache .expo/cache
tmp="${TMPDIR:-/tmp}"
rm -rf "$tmp"/metro-* "$tmp"/haste-map-* "$tmp"/react-native-packager-cache-*
if lsof -nP -iTCP:8081 -sTCP:LISTEN >/dev/null 2>&1; then
  lsof -t -nP -iTCP:8081 -sTCP:LISTEN | xargs kill >/dev/null 2>&1 || true
fi
