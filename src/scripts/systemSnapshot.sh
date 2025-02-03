#!/bin/bash

# Define snapshot file name
SNAPSHOT_FILE="system_snapshot_$(date +%Y%m%d%H%M%S).tar.gz"

# Create a snapshot of the system
tar -czvf $SNAPSHOT_FILE /home/renjerpink/Videos

# Upload to Google Cloud Storage
gsutil cp $SNAPSHOT_FILE gs://securitybot/

# Clean up
rm $SNAPSHOT_FILE