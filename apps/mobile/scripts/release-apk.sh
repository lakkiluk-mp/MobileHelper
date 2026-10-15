#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
HOST="${RELEASE_SSH_HOST:-polotno-stage}"
CONTAINER_FILTER="${RELEASE_CONTAINER:-compose-navigate-auxiliary-interface-16r2ca-web}"
VERSION=$(node -p "require('./app.json').expo.version")
sh scripts/build-apk.sh
printf '{"version":"%s"}\n' "$VERSION" > dist/etalon.json
scp dist/etalon.apk "$HOST:/tmp/etalon.apk"
scp dist/etalon.json "$HOST:/tmp/etalon.json"
ssh "$HOST" "set -e
  id=\$(docker ps -qf name=$CONTAINER_FILTER | head -1)
  [ -n \"\$id\" ] || { echo 'web container not found'; exit 1; }
  docker cp /tmp/etalon.apk \$id:/data/apk/etalon.apk.tmp
  docker exec \$id mv /data/apk/etalon.apk.tmp /data/apk/etalon.apk
  docker cp /tmp/etalon.json \$id:/data/apk/etalon.json.tmp
  docker exec \$id mv /data/apk/etalon.json.tmp /data/apk/etalon.json
  rm /tmp/etalon.apk /tmp/etalon.json"
echo "https://etalon.offerist-ai.ru/download/apk ($VERSION)"
