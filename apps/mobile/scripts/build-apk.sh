#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
export NODE_ENV=production
export EXPO_NO_GIT_STATUS=1
expo prebuild --platform android --no-install
cd android
./gradlew :app:assembleRelease -x lint -x test --configure-on-demand
mkdir -p ../dist
cp app/build/outputs/apk/release/app-release.apk ../dist/etalon.apk
cd ..
echo "$(pwd)/dist/etalon.apk"
