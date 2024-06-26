#!/bin/bash
# render html with minijinja

set -e

rm -rf ../extension/manage/*.html

for file in ./*.html; do
    filename=$(basename -- "$file")
    name="${filename%.*}"

    if [ "$filename" == "base.html" ]; then
        continue
    fi

    minijinja-cli ${filename} -o ../extension/manage/${name}.html

    # Check if the command was successful
    if [ $? -ne 0 ]; then
        echo "Error: Failed to process $file."
        exit 1
    fi
done

echo "All files processed successfully."
