#!/usr/bin/env bash
set -e

source ./core/deploy-docs.sh
build

RUST_BACKTRACE=full cargo run --target-dir /tmp --manifest-path=rust/Cargo.toml books -d /tmp/public/index/books.js
RUST_BACKTRACE=full cargo run --target-dir /tmp --manifest-path=rust/Cargo.toml lints -d /tmp/public/index/lints.js
RUST_BACKTRACE=full cargo run --target-dir /tmp --manifest-path=rust/Cargo.toml labels -d /tmp/public/index/labels.js
RUST_BACKTRACE=full cargo run --target-dir /tmp --manifest-path=rust/Cargo.toml caniuse -r /tmp/caniuse -d /tmp/public/index/caniuse.js

deploy