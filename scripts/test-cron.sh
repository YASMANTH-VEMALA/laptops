#!/bin/bash
# Test the cron ingestion endpoint locally
# Usage: CRON_SECRET=test ./scripts/test-cron.sh

set -e

CRON_SECRET=${CRON_SECRET:-test-secret}
BASE_URL=${BASE_URL:-http://localhost:3000}

echo "Testing cron ingestion endpoint..."
echo "URL: $BASE_URL/api/cron/ingest-batch"
echo "Secret: $CRON_SECRET"
echo ""

curl -X GET "$BASE_URL/api/cron/ingest-batch" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Accept: application/json" \
  --progress-bar | jq .

echo ""
echo "✓ Cron test completed"
