#!/bin/bash
# Update all laptop images from Rainforest API
# Usage: ./scripts/update-all-laptop-images.sh

set -e

# Check if dev server is running
if ! curl -s http://localhost:3000 > /dev/null; then
  echo "❌ Dev server not running! Start with: npm run dev"
  exit 1
fi

# Get admin key from .env.local
if [ ! -f .env.local ]; then
  echo "❌ .env.local not found"
  exit 1
fi

ADMIN_KEY=$(grep CACHE_ADMIN_KEY .env.local | cut -d= -f2)

if [ -z "$ADMIN_KEY" ]; then
  echo "❌ CACHE_ADMIN_KEY not found in .env.local"
  exit 1
fi

echo "🚀 Fetching images for all 28 laptops..."
echo "This will take ~2 minutes (28 laptops × 1.5s rate limit)"
echo ""

curl -X POST http://localhost:3000/api/admin/update-laptop-images \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  --progress-bar | jq .

echo ""
echo "✅ Done! Refresh http://localhost:3000/laptops to see images"
