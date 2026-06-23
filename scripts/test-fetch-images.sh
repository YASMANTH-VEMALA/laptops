#!/bin/bash
# Test the /api/admin/fetch-images endpoint
# Usage: ./scripts/test-fetch-images.sh

set -e

# Check if dev server is running
if ! curl -s http://localhost:3000 > /dev/null; then
  echo "❌ Dev server not running! Start with: npm run dev"
  exit 1
fi

# Check if CACHE_ADMIN_KEY is set
if [ -z "$CACHE_ADMIN_KEY" ]; then
  echo "❌ CACHE_ADMIN_KEY not set!"
  echo ""
  echo "To set it:"
  echo "  1. Check .env.local for CACHE_ADMIN_KEY value"
  echo "  2. Run: export CACHE_ADMIN_KEY=<value>"
  exit 1
fi

echo "🚀 Fetching images for all laptops..."
echo "This will take ~45 seconds (28 laptops × 1.5s rate limit)"
echo ""

curl -X POST http://localhost:3000/api/admin/fetch-images \
  -H "x-admin-key: $CACHE_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  --progress-bar | jq .

echo ""
echo "✅ Done! Visit http://localhost:3000/laptops to see images"
