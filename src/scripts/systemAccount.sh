#!/bin/bash

# Define the correct relative path to the Node.js project directory
BASE_DIR="$(dirname "$(realpath "$0")")/.."  # Moves one level up from the `scripts` directory

KNOWN_ACCOUNTS_FILE="$BASE_DIR/public/knownSystemAccounts.txt"

# Ensure the public directory exists
mkdir -p "$BASE_DIR/public"

# Extract system accounts (UID < 1000, except for known services)
awk -F':' '($3 < 1000 || $1 ~ /^(mysql|mongodb|ollama)$/) { print $1 }' /etc/passwd > "$KNOWN_ACCOUNTS_FILE"

echo "Known system accounts list updated at: $KNOWN_ACCOUNTS_FILE"
