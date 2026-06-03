# Skill: SEO Writer

Use this skill when generating SEO-optimized content for laptop pages, blog posts, and meta tags.

## Target Audience
Non-technical buyers: students, first-time buyers, professionals upgrading laptops.
They know brand names (Dell, HP, Apple) but don't understand specs.
Write at a Grade 8–10 reading level. Explain every technical term used.

## Page Types and SEO Targets

### Individual Laptop Pages (/laptops/[slug])
Target: "[Laptop Name] review", "[Laptop Name] price India", "[Laptop Name] specs"
- H1: "[Full Laptop Name] — Review & Price in India ([Year])"
- Meta: "[Laptop Name]: ₹[price] on Amazon India. [One key strength]. [One ideal use case]. Full specs + review."
- Word count: 600–1000 words

### Comparison Pages (/compare/[slug-vs-slug])
Target: "[Laptop A] vs [Laptop B]", "[Laptop A] vs [Laptop B] for [use case]"
- H1: "[Laptop A] vs [Laptop B]: Which is Better for [Use Case]? ([Year])"
- Meta: "Comparing [A] vs [B] for [use case] in India. Price, specs, real-world performance. Clear winner revealed."
- Word count: 800–1200 words

### Blog / Buying Guides (/blog/[slug])
Target: "best laptops for [use case] under ₹[budget] [year]"
- H1: "Best Laptops for [Use Case] Under ₹[Budget] in India ([Year])"
- Meta: "Top [N] laptops for [use case] under ₹[budget] — tested and ranked. Buying guide with real specs explained simply."
- Word count: 1000–1500 words

## Writing Rules

### Explain Specs in Plain Language (ALWAYS pair spec with meaning)
BAD: "16GB LPDDR5X RAM and RTX 4060 GPU"
GOOD: "16GB of fast RAM (enough to run 30+ browser tabs, Photoshop, and Spotify at once) plus an RTX 4060 graphics card — fast enough to edit 4K video without lag"

### Structure Every Article
1. Opening: Who this guide is for + the recommendation upfront
2. Quick Picks: Table of top 3 with buy links
3. Detailed Reviews: One section per laptop (H2 = laptop name)
4. Spec Explanation: "What these specs mean for you"
5. FAQ: 3–5 questions real buyers ask
6. Bottom Line: Clear recommendation by user type

### Internal Linking
- Every laptop name mentioned → link to `/laptops/[slug]`
- Every comparison mentioned → link to `/compare/[slug-vs-slug]`
- Every guide referenced → link to `/blog/[slug]`

### Affiliate CTAs
- Every laptop section must end with: `[Buy [Laptop Name] on Amazon →](https://www.amazon.in/dp/[ASIN]?tag=netha-21)`
- CTA placement: after pros/cons section, and at bottom of article
- Legal: Include "We earn a commission on qualifying purchases. Prices as of [date]."

## Meta Description Formula
"[Benefit statement]. [Key spec in plain language]. [Price range]. [Call to action]."
Max 155 characters.

Example: "Best laptops for video editing under ₹80,000 — ranked by real rendering speed. Includes RTX 4060 options with expert buying advice."

## Structured Data (JSON-LD for blog posts)
Always include Article schema with:
- datePublished, dateModified, author, headline, description
For individual laptop pages: Product schema with offers (price, availability)

## Keywords to Target (High Intent — India)
- "best laptop for [use case] under [budget] in India [year]"
- "[laptop name] price in India"
- "[laptop name] review India"
- "[laptop A] vs [laptop B]"
- "laptop buying guide India [year]"
- "which laptop to buy [use case] India"
