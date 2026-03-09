#!/usr/bin/env bash

# This script and Dockerfile is used to build and serve the plugin archive via a
# simple HTTP server, so that builds can be tested before an official release is
# made. It uses BusyBox's httpd, which is a lightweight web server.
#
# Usage: ./tests/docker/build.sh registry.homelab.ricoberger.dev:5555/ricoberger-kubernetes-app:latest

set -o errexit
set -o pipefail
set -o nounset

npm run build
mage -v buildAll
cp -r dist ricoberger-kubernetes-app
zip -qr ricoberger-kubernetes-app.zip ricoberger-kubernetes-app
rm -rf ricoberger-kubernetes-app

docker buildx build \
  --platform=linux/arm64,linux/amd64 \
  -f ./tests/docker/Dockerfile \
  -t $1 \
  --output=type=registry,registry.insecure=true \
  --push \
  .
