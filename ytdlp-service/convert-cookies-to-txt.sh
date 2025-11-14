#!/bin/bash

###############################################
# Convert cookies.json to cookies.txt (Netscape format)
# For yt-dlp usage
###############################################

INPUT_FILE="../cookies.json"
OUTPUT_FILE="cookies.txt"

echo "# Netscape HTTP Cookie File" > "$OUTPUT_FILE"
echo "# This is a generated file! Do not edit." >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Parse JSON and convert to Netscape format
# Format: domain flag path secure expiration name value
cat "$INPUT_FILE" | jq -r '.youtube[0]' | tr '; ' '\n' | while IFS='=' read -r name value; do
    [ -z "$name" ] && continue
    echo ".youtube.com	TRUE	/	TRUE	0	$name	$value" >> "$OUTPUT_FILE"
done

echo "✓ Converted $INPUT_FILE to $OUTPUT_FILE"
wc -l "$OUTPUT_FILE"
