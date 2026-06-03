# /gen-seo

Generate a batch of 5 SEO-optimized blog posts using current laptop database data.

## Steps
1. Query Supabase for all active laptops (is_active = true)
2. Identify gaps: which buying-guide topics aren't yet covered in the blog
3. Generate 5 articles targeting high-intent search queries:
   - "Best laptops for [use_case] under ₹[budget] in [year]"
   - "Why [laptop_A] beats [laptop_B] for [use_case]"
   - "What specs actually matter for [use_case] — explained simply"
4. For each article:
   - Target keyword in H1, first paragraph, and meta description
   - Include at least 3 specific laptop recommendations with affiliate links
   - Add structured data hints (product mentions with prices)
   - Write in plain language — no jargon without explanation
   - Min 800 words, max 1500 words
5. Save each article as a JSON row ready to INSERT into `blog_posts` table

## SEO Rules (from .claude/skills/seo-writer/SKILL.md)
- H1 must contain the exact target keyword
- Meta description: 150–160 chars, include keyword, include a benefit
- Use H2s for each laptop recommendation section
- Internal links: link to `/laptops/[slug]` for each mentioned laptop
- Every recommendation must have an affiliate button pointing to `?tag=netha-21`
