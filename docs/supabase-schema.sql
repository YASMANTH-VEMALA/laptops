-- ============================================================
-- LaptopAdvisor — Supabase Database Schema
-- Paste this entire file into Supabase SQL Editor and run it.
-- ============================================================

-- Enable pgvector for RAG on hardware knowledge PDF
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- LAPTOPS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS laptops (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  brand                 text NOT NULL,
  slug                  text UNIQUE NOT NULL,
  price_inr             int NOT NULL,
  price_usd             int,
  cpu_arch              text NOT NULL CHECK (cpu_arch IN ('x86', 'ARM')),
  cpu_brand             text NOT NULL CHECK (cpu_brand IN ('Intel', 'AMD', 'Apple')),
  cpu_series            text NOT NULL CHECK (cpu_series IN ('U', 'P', 'H', 'HX', 'M-series')),
  cpu_model             text NOT NULL DEFAULT '',
  gpu_type              text NOT NULL CHECK (gpu_type IN ('integrated', 'dedicated')),
  gpu_model             text NOT NULL DEFAULT '',
  gpu_tgp_watts         int NOT NULL DEFAULT 0,
  ram_gb                int NOT NULL,
  ram_type              text NOT NULL CHECK (ram_type IN ('LPDDR5X', 'LPDDR5', 'DDR5', 'DDR4')),
  storage_gb            int NOT NULL,
  storage_type          text NOT NULL CHECK (storage_type IN ('NVMe', 'SATA')),
  display_size          float NOT NULL,
  display_type          text NOT NULL CHECK (display_type IN ('IPS', 'OLED', 'Mini-LED', 'TN', 'AMOLED')),
  display_hz            int NOT NULL DEFAULT 60,
  display_nits          int NOT NULL DEFAULT 0,
  display_color_gamut   int,
  battery_wh            int NOT NULL DEFAULT 0,
  weight_kg             float NOT NULL DEFAULT 0,
  os_support            text NOT NULL DEFAULT 'Windows' CHECK (os_support IN ('Windows', 'macOS', 'Linux', 'any')),
  best_for              text[] NOT NULL DEFAULT '{}',
  pros                  text NOT NULL DEFAULT '',
  cons                  text NOT NULL DEFAULT '',
  affiliate_amazon_in   text NOT NULL DEFAULT '',
  affiliate_amazon_com  text,
  image_url             text,
  is_active             boolean NOT NULL DEFAULT true,
  last_updated          timestamptz NOT NULL DEFAULT now(),
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS laptops_price_inr_idx ON laptops (price_inr);
CREATE INDEX IF NOT EXISTS laptops_brand_idx ON laptops (brand);
CREATE INDEX IF NOT EXISTS laptops_is_active_idx ON laptops (is_active);
CREATE INDEX IF NOT EXISTS laptops_best_for_idx ON laptops USING GIN (best_for);

-- ============================================================
-- RECOMMENDATION CACHE (Layer 1 — full query cache, 24h TTL)
-- ============================================================
CREATE TABLE IF NOT EXISTS recommendation_cache (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash  text UNIQUE NOT NULL,
  result_json jsonb NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS recommendation_cache_hash_idx ON recommendation_cache (query_hash);
CREATE INDEX IF NOT EXISTS recommendation_cache_expires_idx ON recommendation_cache (expires_at);

-- ============================================================
-- LAPTOP EXPLANATIONS (Layer 2 — per-laptop per-use-case cache)
-- ============================================================
CREATE TABLE IF NOT EXISTS laptop_explanations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  laptop_id       uuid NOT NULL REFERENCES laptops(id) ON DELETE CASCADE,
  use_case        text NOT NULL,
  explanation     text NOT NULL,
  key_strengths   text[] NOT NULL DEFAULT '{}',
  one_weakness    text NOT NULL DEFAULT '',
  cached_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(laptop_id, use_case)
);

CREATE INDEX IF NOT EXISTS laptop_explanations_laptop_idx ON laptop_explanations (laptop_id);
CREATE INDEX IF NOT EXISTS laptop_explanations_use_case_idx ON laptop_explanations (use_case);

-- ============================================================
-- KNOWLEDGE CHUNKS (pgvector RAG — hardware masterclass PDF)
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content     text NOT NULL,
  embedding   vector(1536),
  section     text,
  chunk_index int,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx
  ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Semantic similarity search function
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  section text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    content,
    section,
    1 - (embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================================
-- BLOG POSTS (SEO content — generated by /gen-seo agent)
-- ============================================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                text UNIQUE NOT NULL,
  title               text NOT NULL,
  meta_description    text NOT NULL,
  content_html        text NOT NULL,
  target_keyword      text NOT NULL,
  featured_laptop_ids uuid[] DEFAULT '{}',
  published           boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blog_posts_slug_idx ON blog_posts (slug);
CREATE INDEX IF NOT EXISTS blog_posts_published_idx ON blog_posts (published);

-- ============================================================
-- ROW LEVEL SECURITY
-- Public read access for laptops, blog posts (anon key safe)
-- Write access only via service role (API routes, Monday agent)
-- ============================================================
ALTER TABLE laptops ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE laptop_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Laptops: public read, service-role write
CREATE POLICY "Public can read active laptops"
  ON laptops FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role full access to laptops"
  ON laptops FOR ALL
  USING (auth.role() = 'service_role');

-- Blog posts: public read published, service-role write
CREATE POLICY "Public can read published posts"
  ON blog_posts FOR SELECT
  USING (published = true);

CREATE POLICY "Service role full access to blog_posts"
  ON blog_posts FOR ALL
  USING (auth.role() = 'service_role');

-- Cache tables: service role only
CREATE POLICY "Service role only for recommendation_cache"
  ON recommendation_cache FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role only for laptop_explanations"
  ON laptop_explanations FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role only for knowledge_chunks"
  ON knowledge_chunks FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- AUTO-UPDATE last_updated on laptops
-- ============================================================
CREATE OR REPLACE FUNCTION update_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER laptops_update_last_updated
  BEFORE UPDATE ON laptops
  FOR EACH ROW EXECUTE FUNCTION update_last_updated();
