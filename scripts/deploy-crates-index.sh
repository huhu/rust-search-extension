#!/usr/bin/env bash
set -e

CRATES_INDEX_PATH="/tmp/crates-index.js"
BRANCH="gh-pages"

build() {
  echo "Starting building crates-index..."
  cd rust
  cargo run ${CRATES_INDEX_PATH}
  cd ..
  echo "{\"version\": $(date +%s)}" > /tmp/version.json
}

upload() {
  echo "Starting uploading crates-index..."
  git checkout ${BRANCH}
  git pull --rebase

  if [[ ! -d "crates" ]]
  then
    mkdir crates
  fi
  cp "${CRATES_INDEX_PATH}" /tmp/version.json crates/

  git config user.name "GitHub Actions"
  git config user.email "github-actions-bot@users.noreply.github.com"
  git add crates/
  git commit -m "Upload latest crates index"
  git push origin $BRANCH

  echo "Upload complete"
}

build
upload