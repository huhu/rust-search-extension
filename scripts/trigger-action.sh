#!/usr/bin/env bash
set -e

trigger() {
    event_type=$1
    echo "Triggering action of ${event_type}..."
    curl -H "Accept: application/vnd.github.everest-preview+json" \
        -H "Authorization: token ${ACCESS_TOKEN}" \
        --request POST \
        --data "{\"event_type\": \"${event_type}\"}" \
        https://api.github.com/repos/folyd/rust-search-extension/dispatches
}

trigger deploy-docs