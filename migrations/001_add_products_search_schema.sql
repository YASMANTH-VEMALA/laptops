-- Create the new "search-once, serve-forever" schema
-- This migration adds the products table (master catalogue) and search_cache (permanent query cache)

-- ============================================================
-- PRODUCTS TABLE — Master catalogue (forever)
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source            text NOT NULL,              -- e.g., 'google_shopping'
  source_product_id text,                       -- dedup key from SerpAPI
  title             text NOT NULL,
  brand             text,
  price             numeric,                    -- latest known price (INR)
  rating            numeric,                    -- 0-5
  reviews_count     integer DEFAULT 0,
  image_url         text,
  product_url       text,
  specs             jsonb DEFAULT '{}'::jsonb, -- {cpu, ram, storage, display, os}
  use_case_tags     text[] DEFAULT '{}',       -- ['gaming','coding',...]
  why_text          text,                       -- one-time generated blurb (cached FOREVER)
  first_seen_at     timestamptz DEFAULT now(),
  last_updated_at   timestamptz DEFAULT now(),

  UNIQUE (source, source_product_id)
);

CREATE INDEX IF NOT EXISTS idx_products_brand ON products (brand);
CREATE INDEX IF NOT EXISTS idx_products_price ON products (price);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN (use_case_tags);
CREATE INDEX IF NOT EXISTS idx_products_source_id ON products (source, source_product_id);

-- ============================================================
-- SEARCH_CACHE TABLE — Permanent query cache (forever)
-- ============================================================
CREATE TABLE IF NOT EXISTS search_cache (
  query_hash        text PRIMARY KEY,           -- sha1 of normalized query
  normalized_query  jsonb NOT NULL,             -- {budget_max, budget_band, use_case, brand, os}
  raw_query_text    text,
  result_product_ids uuid[] NOT NULL,          -- ordered, ranked by score
  fetched_at        timestamptz DEFAULT now(),
  hit_count         integer DEFAULT 0,

  UNIQUE (query_hash)
);

CREATE INDEX IF NOT EXISTS idx_search_cache_hash ON search_cache (query_hash);
CREATE INDEX IF NOT EXISTS idx_search_cache_tags ON search_cache USING GIN (result_product_ids);

-- ============================================================
-- SEARCH_LOG TABLE — Analytics + demand signal
-- ============================================================
CREATE TABLE IF NOT EXISTS search_log (
  id                bigserial PRIMARY KEY,
  raw_query         text,
  normalized_query  jsonb,
  query_hash        text,
  cache_hit         boolean,
  session_id        text,
  ip_address        text,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_log_hash ON search_log (query_hash);
CREATE INDEX IF NOT EXISTS idx_search_log_created ON search_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_log_session ON search_log (session_id);

-- ============================================================
-- RLS Policies for new tables
-- ============================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_log ENABLE ROW LEVEL SECURITY;

-- Products: public read, service-role write
CREATE POLICY "Public can read products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Service role full access to products"
  ON products FOR ALL
  USING (auth.role() = 'service_role');

-- Search cache: public read, service-role write
CREATE POLICY "Public can read search_cache"
  ON search_cache FOR SELECT
  USING (true);

CREATE POLICY "Service role full access to search_cache"
  ON search_cache FOR ALL
  USING (auth.role() = 'service_role');

-- Search log: service role only
CREATE POLICY "Service role only for search_log"
  ON search_log FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- RPC Function: Increment cache hit count
-- ============================================================
CREATE OR REPLACE FUNCTION increment_cache_hit_count(query_hash_arg text)
RETURNS void AS $$
BEGIN
  UPDATE search_cache
  SET hit_count = hit_count + 1
  WHERE query_hash = query_hash_arg;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
