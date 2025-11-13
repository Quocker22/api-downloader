#!/bin/bash

###############################################
# Convert cookies.txt to cookies.json for Cobalt
# Usage: ./convert-cookies.sh cookies.txt
###############################################

set -e

INPUT_FILE="${1:-cookies.txt}"
OUTPUT_FILE="cookies.json"

if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: File $INPUT_FILE not found!"
    echo "Usage: $0 <cookies.txt>"
    exit 1
fi

echo "Converting $INPUT_FILE to $OUTPUT_FILE..."

# Filter only youtube.com cookies and convert to JSON format
echo "[" > "$OUTPUT_FILE"

first=true
while IFS=$'\t' read -r domain flag path secure expiration name value; do
    # Skip comments and empty lines
    [[ "$domain" =~ ^#.*$ ]] && continue
    [[ -z "$domain" ]] && continue

    # Only keep youtube.com cookies
    if [[ "$domain" == *"youtube.com"* ]]; then
        if [ "$first" = false ]; then
            echo "," >> "$OUTPUT_FILE"
        fi
        first=false

        cat >> "$OUTPUT_FILE" << EOF
  {
    "domain": "$domain",
    "path": "$path",
    "secure": $([ "$secure" = "TRUE" ] && echo "true" || echo "false"),
    "expiry": $expiration,
    "name": "$name",
    "value": "$value"
  }
EOF
    fi
done < "$INPUT_FILE"

echo "" >> "$OUTPUT_FILE"
echo "]" >> "$OUTPUT_FILE"

echo "✓ Converted successfully to $OUTPUT_FILE"
echo ""
echo "Next steps:"
echo "1. scp cookies.json root@103.75.187.172:/root/api-downloader/"
echo "2. ssh root@103.75.187.172"
echo "3. cd /root/api-downloader"
echo "4. ./deploy.sh"
