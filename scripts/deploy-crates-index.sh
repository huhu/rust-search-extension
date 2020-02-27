#!/usr/bin/env bash
set -e

CRATES_INDEX_PATH="/tmp/index.js"
CRATES_DATABASE_PATH="/data/db-dump.tar.gz"
BRANCH="now"

build() {
  echo "Starting building crates-index..."
  cd rust
  RUST_BACKTRACE=full cargo run --release --bin crates-index ${CRATES_DATABASE_PATH} ${CRATES_INDEX_PATH}
  echo "{\"version\": $(date +%s)}" > /tmp/version.json
  cd ..
}

upload() {
  echo "Starting uploading crates-index..."
  git config --global url."https://".insteadOf git://
  git config --global url."https://github.com/".insteadOf git@github.com:

  git checkout ${BRANCH}
  if [[ ! -d "crates" ]]
  then
    mkdir crates
  fi
  cp -vr "${CRATES_INDEX_PATH}" /tmp/version.json crates/

  git config user.name "GitHub Actions"
  git config user.email "github-actions-bot@users.noreply.github.com"
  git add crates/
  git commit --amend -m "Upload latest crates index"
  git push --force "https://${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git" ${BRANCH}

  echo "Upload complete"
}

build
upload