-- ============================================================
-- CLEAR ALL DATA FROM SUPABASE
-- WARNING: This deletes ALL data. Run only if you're sure!
-- ============================================================

-- Delete in order (respecting foreign key constraints)

DELETE FROM laptop_explanations;
DELETE FROM recommendation_cache;
DELETE FROM knowledge_chunks;
DELETE FROM laptops;
DELETE FROM blog_posts;

-- Verify deletion
SELECT COUNT(*) as laptop_count FROM laptops;
SELECT COUNT(*) as explanation_count FROM laptop_explanations;
SELECT COUNT(*) as cache_count FROM recommendation_cache;

-- Expected output: All counts should be 0
