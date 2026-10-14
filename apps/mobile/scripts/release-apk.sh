#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
HOST="${RELEASE_SSH_HOST:-polotno-stage}"
CONTAINER_FILTER="${RELEASE_CONTAINER:-compose-navigate-auxiliary-interface-16r2ca-web}"
sh scripts/build-apk.sh
scp dist/etalon.apk "$HOST:/tmp/etalon.apk"
ssh "$HOST" "set -e
  id=\$(docker ps -qf name=$CONTAINER_FILTER | head -1)
  [ -n \"\$id\" ] || { echo 'web container not found'; exit 1; }
  docker cp /tmp/etalon.apk \$id:/data/apk/etalon.apk.tmp
  docker exec \$id mv /data/apk/etalon.apk.tmp /data/apk/etalon.apk
  rm /tmp/etalon.apk"
echo "https://etalon.offerist-ai.ru/download/apk"
