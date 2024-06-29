#!/usr/bin/env bash
set -e

export RUST_BACKTRACE=full
source ./core/deploy-docs.sh
build

# Create dir in advance
mkdir -p /tmp/public/index
RUST_BACKTRACE=full cargo run --target-dir /tmp --manifest-path=rust/Cargo.toml advisory -d /tmp/public/advisory

deploy
