#!/bin/sh

# Set the correct timezone for Loki queries
export TZ=Asia/Ho_Chi_Minh

# Get today's date
DATE=$(date +"%Y-%m-%d")

# Define the start and end of the day in RFC3339 format
START=$(date +"%Y-%m-%dT00:00:00+07:00")
END=$(date +"%Y-%m-%dT23:59:59+07:00")

export LOKI_ADDR="http://loki:3100"

echo "Starting export for $DATE from $START to $END..."

# Use logcli to query all production logs for the current day
# -q means quiet (no progress bar), --limit sets a high cap
/usr/local/bin/logcli query '{env="production"}' --from="$START" --to="$END" --limit=100000 --quiet > /exports/moviehub_logs_$DATE.txt

echo "Export completed: /exports/moviehub_logs_$DATE.txt"
