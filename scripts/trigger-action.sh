#!/usr/bin/env bash
set -e

trigger() {
    event_type=$1
    client_payload=$2
    data="{\"event_type\": \"${event_type}\", \"client_payload\": ${client_payload:-"{}"}}"
    echo ${data}
    echo "Triggering action of ${event_type}..."
    curl -H "Accept: application/vnd.github.everest-preview+json" \
        -H "Authorization: token ${ACCESS_TOKEN}" \
        --request POST \
        --data "${data}" \
        https://api.github.com/repos/huhu/rust-search-extension/dispatches
    echo "Trigger action of ${event_type} success!"
}

main() {
    if [[ -z "${ACCESS_TOKEN}" ]]
    then
        echo "Notice: ACCESS_TOKEN environment is required!"
        exit 0
    fi

    event_types=(0 deploy-docs build-crates-index build-binary build-index)
    echo "Please select trigger type:"
    echo "1) ${event_types[1]}"
    echo "2) ${event_types[2]}"
    echo "3) ${event_types[3]}"
    echo "4) ${event_types[4]}"

    read event_index
    case "${event_index}" in
        1|2|4)
            trigger ${event_types[event_index]}
        ;;
        3)
            bins=(0 crates-index)
            echo "Please select crate binary name:"
            echo "1) ${bins[1]}"
            read bin_index
            trigger ${event_types[event_index]} "{\"bin\": \"${bins[bin_index]}\"}"
        ;;
        *) echo "Invalid options\n";;
    esac
}

main