#!/usr/bin/env bash
set -e

export RUST_BACKTRACE=full
source ./core/deploy-docs.sh

# `now` is the static site Cloudflare Pages publishes. Pages clones that
# branch and runs submodule update. Gitlinks for `core` and
# `docs/themes/juice` have no .gitmodules entry, so the clone dies with
# "No url found for submodule path" and production stays on the previous
# deploy.
#
# This job checks out master with those submodules populated. Once `now` no
# longer tracks them, `git checkout now` cannot remove the worktrees
# ("unable to rmdir: Directory not empty") and a later `git add .` records
# them as gitlinks again. Remove the worktrees before switching branches.
deploy() {
  echo "Starting deploying..."
  git config --global url."https://".insteadOf git://
  git config --global url."https://github.com/".insteadOf git@github.com:

  git submodule deinit -f --all || true
  rm -rf core docs/themes/juice
  git checkout "${BRANCH}"
  git rm -rf --cached --ignore-unmatch -- core docs/themes/juice
  rm -rf core docs/themes/juice
  cp -vr /tmp/public/* .
  git config user.name "GitHub Actions"
  git config user.email "github-actions-bot@users.noreply.github.com"
  git add .
  if git ls-files -s | awk '$1 == "160000" { found = 1 } END { exit !found }'; then
    echo "Refusing to publish ${BRANCH} with submodule gitlinks:" >&2
    git ls-files -s | awk '$1 == "160000"' >&2
    exit 1
  fi
  git commit -m "Deploy new version docs"
  git push --force "https://${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git" "${BRANCH}"

  echo "Deploy complete"
}

build

# Create dir in advance
mkdir -p /tmp/public/index
RUST_BACKTRACE=full cargo run --target-dir /tmp --manifest-path=rust/Cargo.toml advisory -d /tmp/public/advisory
RUST_BACKTRACE=full cargo run --target-dir /tmp --manifest-path=rust/Cargo.toml books -d /tmp/public/index/books.js
RUST_BACKTRACE=full cargo run --target-dir /tmp --manifest-path=rust/Cargo.toml lints -d /tmp/public/index/lints.js
RUST_BACKTRACE=full cargo run --target-dir /tmp --manifest-path=rust/Cargo.toml labels -d /tmp/public/index/labels.js
RUST_BACKTRACE=full cargo run --target-dir /tmp --manifest-path=rust/Cargo.toml rustc -d /tmp/public/index/rustc.js
RUST_BACKTRACE=full cargo run --target-dir /tmp --manifest-path=rust/Cargo.toml targets -d /tmp/public/index/targets.js
RUST_BACKTRACE=full cargo run --target-dir /tmp --manifest-path=rust/Cargo.toml caniuse -r /tmp/caniuse -d /tmp/public/index/caniuse.js
RUST_BACKTRACE=full cargo run --target-dir /tmp --manifest-path=rust/Cargo.toml rfcs -r /tmp/rfcs -d /tmp/public/index/rfcs.js
# Copy commands.js
cp extension/index/commands.js /tmp/public/index/commands.js

deploy