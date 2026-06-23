
export interface RankedProduct {
  product_id: string
  score: number
  rating: number | null
  reviews_count: number
  price: number | null
}

/**
 * Normalize a value to 0-1 range within a dataset
 */
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5
  return Math.max(0, Math.min(1, (value - min) / (max - min)))
}

/**
 * Score products using:
 * - 45% rating (higher is better)
 * - 30% review count (more reviews = more trustworthy, log scale)
 * - 25% value (how far under budget, capped)
 *
 * Tie-breaker: higher reviews_count
 */
export function rankProducts(
  products: Array<{
    id: string
    price: number | null
    rating: number | null
    reviews_count: number
  }>,
  budget_max: number | null
): RankedProduct[] {
  if (products.length === 0) return []

  // Extract numeric fields
  const ratings = products
    .map((p) => p.rating)
    .filter((r): r is number => r !== null)
  const reviewCounts = products.map((p) => p.reviews_count)

  const ratingMin = Math.min(...ratings, 0)
  const ratingMax = Math.max(...ratings, 5)
  const reviewMax = Math.max(...reviewCounts, 1)

  // Score each product
  const scored = products.map((p) => {
    const ratingScore = p.rating !== null ? normalize(p.rating, ratingMin, ratingMax) : 0.5
    const reviewScore = Math.log1p(p.reviews_count) / Math.log1p(reviewMax)
    const valueScore =
      p.price && budget_max
        ? Math.min(1, Math.max(0, (budget_max - p.price) / budget_max * 0.5 + 0.5))
        : 0.5

    const score = 0.45 * ratingScore + 0.3 * reviewScore + 0.25 * valueScore

    return {
      product_id: p.id,
      score,
      rating: p.rating,
      reviews_count: p.reviews_count,
      price: p.price,
    }
  })

  // Sort by score (descending), then by reviews_count (descending)
  scored.sort((a, b) => {
    if (Math.abs(a.score - b.score) > 0.001) {
      return b.score - a.score
    }
    return b.reviews_count - a.reviews_count
  })

  return scored
}

/**
 * Rank and return top N products
 */
export function rankAndSlice(
  products: Array<{
    id: string
    price: number | null
    rating: number | null
    reviews_count: number
  }>,
  budget_max: number | null,
  limit: number = 5
): string[] {
  const ranked = rankProducts(products, budget_max)
  return ranked.slice(0, limit).map((p) => p.product_id)
}
