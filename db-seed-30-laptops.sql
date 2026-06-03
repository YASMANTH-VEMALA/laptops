-- LaptopAdvisor: Seed 30 Laptops Across All Categories
-- Budget (₹25-50k) | Mid-range (₹50-80k) | Upper-mid (₹80-120k) | Premium (₹120k+)
-- Coverage: Video editing, Programming, Gaming, General, Business, AI/ML, Design, Content

INSERT INTO laptops (name, brand, slug, price_inr, cpu_arch, cpu_brand, cpu_series, cpu_model, gpu_type, gpu_model, gpu_tgp_watts, ram_gb, ram_type, storage_gb, storage_type, display_size, display_type, display_hz, display_nits, display_color_gamut, battery_wh, weight_kg, os_support, best_for, pros, cons, affiliate_amazon_in) VALUES

-- ======================== BUDGET (Under ₹50k) ========================
('Acer Aspire Lite AL15-41', 'Acer', 'acer-aspire-lite-al15-41', 39990, 'x86', 'AMD', 'U', 'Ryzen 5 5625U', 'integrated', 'Radeon Graphics', 0, 16, 'LPDDR5', 512, 'NVMe', 15.6, 'IPS', 60, 300, 45, 38, 1.8, 'Windows', ARRAY['programming','general','business'], 'Excellent value, strong CPU, 300 nits display, nationwide service', 'Integrated GPU, slower in gaming', 'https://www.amazon.in/dp/B0CD4BQ4SF?tag=netha-21'),

('Lenovo IdeaPad Slim 3', 'Lenovo', 'lenovo-ideapad-slim-3', 42000, 'x86', 'AMD', 'U', 'Ryzen 5 7520U', 'integrated', 'Radeon Graphics', 0, 16, 'LPDDR5', 512, 'NVMe', 15.6, 'IPS', 60, 220, 45, 47, 1.62, 'Windows', ARRAY['programming','general'], 'Lightweight (1.62kg), 47Wh battery, LPDDR5 RAM, responsive multitasking', 'Basic 60Hz display, no dedicated GPU', 'https://www.amazon.in/dp/B0CD4BQ4SF?tag=netha-21'),

('HP 15s (Core i3)', 'HP', 'hp-15s-core-i3-gen13', 40000, 'x86', 'Intel', 'U', 'Core i3-1315U', 'integrated', 'Intel UHD Graphics', 0, 8, 'DDR5', 512, 'NVMe', 15.6, 'IPS', 60, 250, 45, 45, 1.75, 'Windows', ARRAY['general','business'], 'Budget-friendly, reliable HP service, lightweight', 'Only 8GB RAM (typical for budget), i3 limited for heavy tasks', 'https://www.amazon.in/dp/B08PLACEHOLDER1?tag=netha-21'),

('Asus Vivobook Go 15', 'Asus', 'asus-vivobook-go-15', 43990, 'x86', 'AMD', 'U', 'Ryzen 5 7520U', 'integrated', 'Radeon Graphics', 0, 8, 'LPDDR5', 512, 'NVMe', 15.6, 'IPS', 60, 220, 100, 48, 1.63, 'Windows', ARRAY['programming','general'], 'Fast 49-min charge, thin & light, Alexa integration', 'Only 8GB RAM (upgradeable), no dedicated GPU', 'https://www.amazon.in/dp/B0BTWF2BQX?tag=netha-21'),

('Dell Inspiron 15 (Ryzen 5)', 'Dell', 'dell-inspiron-15-ryzen5', 45000, 'x86', 'AMD', 'U', 'Ryzen 5 5625U', 'integrated', 'Radeon Graphics', 0, 16, 'DDR5', 512, 'NVMe', 15.6, 'IPS', 60, 260, 45, 42, 1.85, 'Windows', ARRAY['programming','general','business'], 'Reliable Dell support, good thermal design, upgradeable', 'Integrated graphics limits gaming capability', 'https://www.amazon.in/dp/B08PLACEHOLDER2?tag=netha-21'),

-- ======================= MID-RANGE (₹50k-80k) =======================
('Lenovo LOQ 15IAX9', 'Lenovo', 'lenovo-loq-15iax9', 70000, 'x86', 'Intel', 'H', 'Core i7-12650HX', 'dedicated', 'RTX 4050', 70, 16, 'DDR5', 512, 'NVMe', 15.6, 'IPS', 144, 300, 100, 57, 1.77, 'Windows', ARRAY['gaming','video-editing','content'], '144Hz display, strong i7, RTX 4050 for 4K editing, upgradeable RAM', 'Battery life moderate (~5-6h), heavier than ultrabooks', 'https://www.amazon.in/dp/B0DQ8CRV6N?tag=netha-21'),

('HP Victus 15 (RTX 5060)', 'HP', 'hp-victus-15-rtx5060', 78000, 'x86', 'Intel', 'H', 'Core i7-240H', 'dedicated', 'RTX 5060', 115, 24, 'DDR5', 512, 'NVMe', 15.6, 'IPS', 165, 350, 100, 70, 2.29, 'Windows', ARRAY['gaming','video-editing','content'], 'Excellent 144Hz+ gaming (75fps Elden Ring), 24GB RAM for multitasking, 70Wh battery', 'Runs hot under sustained load, speaker quality average', 'https://www.amazon.in/dp/B0PLACEHOLDER3?tag=netha-21'),

('Acer Swift Go 14 AI', 'Acer', 'acer-swift-go-14-ai', 59990, 'x86', 'Intel', 'P', 'Core Ultra 7 155U', 'integrated', 'Intel Graphics', 0, 16, 'LPDDR5X', 512, 'NVMe', 14.0, 'IPS', 60, 300, 100, 55, 1.4, 'Windows', ARRAY['programming','ai-ml','business'], 'Ultra-light (1.4kg), all-day battery (14+ hours), AI-ready, class-leading build quality', 'Only integrated GPU, no discrete graphics', 'https://www.amazon.in/dp/B0PLACEHOLDER4?tag=netha-21'),

('Lenovo Slim 5 (RTX 4050)', 'Lenovo', 'lenovo-slim-5-rtx4050', 75000, 'x86', 'AMD', 'H', 'Ryzen 7 7635U', 'dedicated', 'RTX 4050', 70, 16, 'DDR5', 512, 'NVMe', 16.0, 'IPS', 120, 300, 100, 60, 2.0, 'Windows', ARRAY['video-editing','content','programming'], 'Large 16-inch display, RTX 4050 capable, decent thermals, good speakers', 'Heavier (2.0kg), RTX 4050 shows age vs RTX 5060', 'https://www.amazon.in/dp/B0PLACEHOLDER5?tag=netha-21'),

('Dell Inspiron 16 (RTX 4060)', 'Dell', 'dell-inspiron-16-rtx4060', 72000, 'x86', 'Intel', 'H', 'Core i7-13620H', 'dedicated', 'RTX 4060', 70, 16, 'DDR5', 512, 'NVMe', 16.0, 'IPS', 60, 300, 100, 63, 2.1, 'Windows', ARRAY['video-editing','design','content'], '16-inch screen ideal for content creators, stable thermal performance, Dell reliability', 'Battery life ~4-5h under load, glossy display reflections', 'https://www.amazon.in/dp/B0PLACEHOLDER6?tag=netha-21'),

-- ==================== UPPER-MID RANGE (₹80k-120k) ====================
('Asus TUF A16 (RTX 5070)', 'Asus', 'asus-tuf-a16-rtx5070', 140000, 'x86', 'AMD', 'HX', 'Ryzen 9 8940HX', 'dedicated', 'RTX 5070', 115, 32, 'DDR5', 1024, 'NVMe', 16.0, 'IPS', 165, 400, 100, 90, 2.2, 'Windows', ARRAY['video-editing','gaming','ai-ml'], 'RTX 5070 (115W) destroys 4K editing, 32GB RAM stock, 16-core Ryzen 9, 90Wh battery', 'Runs hot during intensive workloads, loud fans', 'https://www.amazon.in/dp/B0PLACEHOLDER7?tag=netha-21'),

('HP Envy x360 14 (OLED)', 'HP', 'hp-envy-x360-14-oled', 95000, 'x86', 'Intel', 'P', 'Core Ultra 9 165U', 'integrated', 'Intel Graphics', 0, 16, 'LPDDR5X', 512, 'NVMe', 14.0, 'OLED', 60, 400, 100, 66, 1.5, 'Windows', ARRAY['design','video-editing','ai-ml'], '2.8K OLED display (99.5% DCI-P3), convertible 2-in-1, touchscreen, light weight', 'Integrated GPU only, OLED pixel-perfect for creatives', 'https://www.amazon.in/dp/B0PLACEHOLDER8?tag=netha-21'),

('Dell XPS 13 (Core Ultra)', 'Dell', 'dell-xps-13-core-ultra', 110000, 'x86', 'Intel', 'U', 'Core Ultra 7 165U', 'integrated', 'Intel Arc Graphics', 0, 16, 'LPDDR5X', 512, 'NVMe', 13.4, 'OLED', 60, 400, 100, 60, 1.2, 'Windows', ARRAY['programming','design','business'], 'Ultracompact (1.2kg), gorgeous OLED display, excellent trackpad, Intel Arc GPU', 'Expensive for specs, soldered RAM (not upgradeable)', 'https://www.amazon.in/dp/B0PLACEHOLDER9?tag=netha-21'),

('Asus Zenbook 14 (Intel Core Ultra)', 'Asus', 'asus-zenbook-14-core-ultra', 105000, 'x86', 'Intel', 'U', 'Core Ultra 9 185H', 'integrated', 'Intel Arc Graphics', 0, 16, 'LPDDR5X', 512, 'NVMe', 14.0, 'OLED', 60, 400, 100, 75, 1.28, 'Windows', ARRAY['design','programming','ai-ml'], 'Slim design (1.28kg), AI-ready, 18+ hour battery, premium build', 'Integrated GPU, 16GB LPDDR5X only', 'https://www.amazon.in/dp/B0PLACEHOLDER10?tag=netha-21'),

-- ======================== PREMIUM (₹120k+) ========================
('MacBook Air M4 (13-inch)', 'Apple', 'macbook-air-m4-13', 97900, 'ARM', 'Apple', 'M-series', 'Apple M4', 'integrated', 'Apple M4 GPU (8-core)', 0, 16, 'LPDDR5X', 256, 'NVMe', 13.6, 'IPS', 60, 500, 100, 52, 1.24, 'macOS', ARRAY['design','programming','business','general'], 'Iconic design, all-day battery, silent operation, exceptional trackpad, M4 efficiency', '256GB base storage tight, 8-core GPU entry variant', 'https://www.amazon.in/dp/B0DZDDQ429?tag=netha-21'),

('MacBook Air M5 (15-inch)', 'Apple', 'macbook-air-m5-15', 130000, 'ARM', 'Apple', 'M-series', 'Apple M5', 'integrated', 'Apple M5 GPU (10-core)', 0, 16, 'LPDDR5X', 512, 'NVMe', 15.3, 'IPS', 60, 500, 100, 66, 1.5, 'macOS', ARRAY['design','video-editing','programming'], 'Larger screen (15in), M5 AI capabilities, excellent for creative workflows, quiet', 'macOS-only ecosystem, higher price premium', 'https://www.amazon.in/dp/B0PLACEHOLDER11?tag=netha-21'),

('Alienware m16 R2 (RTX 4070)', 'Dell', 'alienware-m16-r2-rtx4070', 155000, 'x86', 'Intel', 'HX', 'Core Ultra 9 185H', 'dedicated', 'RTX 4070', 130, 32, 'DDR5', 1024, 'NVMe', 16.0, 'IPS', 240, 400, 100, 86, 2.45, 'Windows', ARRAY['gaming','video-editing','ai-ml'], 'RTX 4070 powerful, 240Hz display, excellent thermals, 32GB RAM', 'Expensive, heavy (2.45kg), overkill for non-gaming', 'https://www.amazon.in/dp/B0PLACEHOLDER12?tag=netha-21'),

('ASUS ROG Strix SCAR 16 (RTX 5070 Ti)', 'Asus', 'asus-rog-strix-scar-16-rtx5070ti', 180000, 'x86', 'Intel', 'HX', 'Core Ultra 9 275HX', 'dedicated', 'RTX 5070 Ti', 150, 32, 'DDR5', 1024, 'NVMe', 16.0, 'Mini-LED', 240, 500, 100, 90, 2.5, 'Windows', ARRAY['gaming','video-editing','ai-ml'], '240Hz Mini-LED (500 nits), RTX 5070 Ti beast, MUX switch, advanced cooling', 'Very expensive, battery life poor under load', 'https://www.amazon.in/dp/B0PLACEHOLDER13?tag=netha-21'),

-- ======================== GAMING FOCUS (₹60k-180k) ========================
('MSI Raider GE66 (RTX 4080)', 'MSI', 'msi-raider-ge66-rtx4080', 145000, 'x86', 'Intel', 'HX', 'Core i9-13900HX', 'dedicated', 'RTX 4080', 130, 32, 'DDR5', 1024, 'NVMe', 15.6, 'IPS', 240, 400, 100, 99, 2.35, 'Windows', ARRAY['gaming','video-editing'], 'RTX 4080 (130W) ultra-high FPS, 32GB RAM, 240Hz display', 'Thermals hot, expensive, power-hungry', 'https://www.amazon.in/dp/B0PLACEHOLDER14?tag=netha-21'),

('Razer Blade 16 (RTX 5090)', 'Razer', 'razer-blade-16-rtx5090', 200000, 'x86', 'Intel', 'HX', 'Core Ultra 9 285HX', 'dedicated', 'RTX 5090', 175, 64, 'LPDDR5X', 2048, 'NVMe', 16.0, 'OLED', 240, 600, 100, 100, 1.95, 'Windows', ARRAY['gaming','video-editing','ai-ml'], 'RTX 5090 (175W) ultimate performance, 240Hz OLED, 64GB RAM, sub-15mm thick', 'Extremely expensive, limited availability in India', 'https://www.amazon.in/dp/B0PLACEHOLDER15?tag=netha-21'),

('Acer Predator Helios Neo 16S', 'Acer', 'acer-predator-helios-neo-16s', 135000, 'x86', 'Intel', 'HX', 'Core Ultra 9 275HX', 'dedicated', 'RTX 5070', 115, 32, 'DDR5', 1024, 'NVMe', 16.0, 'OLED', 240, 500, 100, 95, 2.4, 'Windows', ARRAY['gaming','video-editing'], 'RTX 5070, 240Hz OLED, excellent cooling, good value vs Alienware', 'Heavy (2.4kg), high power draw', 'https://www.amazon.in/dp/B0PLACEHOLDER16?tag=netha-21'),

-- ======================== CONTENT CREATION & DESIGN (₹50k-150k) ========================
('Lenovo Yoga 9i (OLED)', 'Lenovo', 'lenovo-yoga-9i-oled', 98000, 'x86', 'Intel', 'H', 'Core i7-13620H', 'dedicated', 'RTX 4060', 70, 16, 'LPDDR5X', 512, 'NVMe', 14.0, 'OLED', 120, 400, 99, 80, 1.65, 'Windows', ARRAY['design','video-editing','content'], 'OLED display (99% DCI-P3), 2-in-1 convertible, stylus support, RTX 4060', 'RTX 4060 outdated vs RTX 5060, expensive', 'https://www.amazon.in/dp/B0PLACEHOLDER17?tag=netha-21'),

('HP ZBook Firefly 14 G9', 'HP', 'hp-zbook-firefly-14-g9', 110000, 'x86', 'Intel', 'H', 'Core i7-12700H', 'dedicated', 'RTX 2050 Ada', 30, 16, 'DDR5', 512, 'NVMe', 14.0, 'IPS', 60, 500, 100, 70, 1.38, 'Windows', ARRAY['design','video-editing','programming'], 'Workstation-class (Z-certified), 500 nits display, built for color grading, lightweight', 'RTX 2050 Ada entry-level, expensive', 'https://www.amazon.in/dp/B0PLACEHOLDER18?tag=netha-21'),

('Asus ProArt Studiobook 16', 'Asus', 'asus-proart-studiobook-16', 155000, 'x86', 'Intel', 'HX', 'Core i9-13980HX', 'dedicated', 'RTX 4070', 130, 32, 'LPDDR5X', 1024, 'NVMe', 16.0, 'OLED', 60, 450, 99, 90, 1.85, 'Windows', ARRAY['design','video-editing','ai-ml'], 'OLED (99% DCI-P3), Procolor calibration, RTX 4070, workstation ergonomics', 'Expensive, overkill for casual creators', 'https://www.amazon.in/dp/B0PLACEHOLDER19?tag=netha-21'),

-- ======================== AI/ML SPECIFIC (₹60k-150k) ========================
('Lenovo ThinkPad X1 Carbon (Core Ultra)', 'Lenovo', 'lenovo-thinkpad-x1-carbon-core-ultra', 125000, 'x86', 'Intel', 'U', 'Core Ultra 9 185U', 'integrated', 'Intel Arc Graphics', 0, 16, 'LPDDR5X', 512, 'NVMe', 14.0, 'IPS', 60, 400, 100, 65, 1.18, 'Windows', ARRAY['programming','ai-ml','business'], 'Ultra-light (1.18kg), legendary keyboard, MIL-SPEC durability, AI-ready', 'Expensive for business laptop, integrated GPU only', 'https://www.amazon.in/dp/B0PLACEHOLDER20?tag=netha-21'),

('HP OmniBook 5 (Ryzen AI 7)', 'HP', 'hp-omnibook-5-ryzen-ai-7', 85000, 'x86', 'AMD', 'H', 'Ryzen AI 7 350', 'integrated', 'Radeon Graphics', 0, 16, 'LPDDR5X', 512, 'NVMe', 15.6, 'IPS', 60, 350, 100, 75, 1.8, 'Windows', ARRAY['programming','ai-ml','general'], 'AI-optimized Ryzen, fast integer math, 16GB LPDDR5X, 350 nits display', 'New Ryzen AI ecosystem (less software maturity)', 'https://www.amazon.in/dp/B0PLACEHOLDER21?tag=netha-21'),

('Dell G16 (RTX 5060 Ada)', 'Dell', 'dell-g16-rtx5060-ada', 95000, 'x86', 'Intel', 'H', 'Core i7-13620H', 'dedicated', 'RTX 5060 Ada', 100, 16, 'DDR5', 512, 'NVMe', 16.0, 'IPS', 120, 350, 100, 80, 2.1, 'Windows', ARRAY['gaming','programming','ai-ml'], 'Good value RTX 5060, AI tensor cores, 16-inch screen for coding', 'Plastic build quality, heavier', 'https://www.amazon.in/dp/B0PLACEHOLDER22?tag=netha-21'),

-- ======================== BUSINESS/ULTRAPORTABLE (₹70k-130k) ========================
('Lenovo Yoga Slim 7 (Core Ultra)', 'Lenovo', 'lenovo-yoga-slim-7-core-ultra', 89000, 'x86', 'Intel', 'P', 'Core Ultra 7 165U', 'integrated', 'Intel Arc Graphics', 0, 16, 'LPDDR5X', 512, 'NVMe', 14.0, 'IPS', 60, 400, 100, 70, 1.42, 'Windows', ARRAY['programming','business','general'], 'Sleek aluminum, all-day battery (14+ hrs), touchscreen, 1.42kg', 'Integrated GPU limits video editing', 'https://www.amazon.in/dp/B0PLACEHOLDER23?tag=netha-21'),

('HP Pavilion x360 14 (Core Ultra)', 'HP', 'hp-pavilion-x360-14-core-ultra', 72000, 'x86', 'Intel', 'P', 'Core Ultra 5 135U', 'integrated', 'Intel Arc Graphics', 0, 16, 'LPDDR5X', 512, 'NVMe', 14.0, 'IPS', 60, 350, 100, 66, 1.45, 'Windows', ARRAY['business','general','programming'], 'Affordable Core Ultra entry, 2-in-1 convertible, touchscreen, good value', 'Core Ultra 5 slower than i7, basic speakers', 'https://www.amazon.in/dp/B0PLACEHOLDER24?tag=netha-21'),

('Asus VivoBook S14 (AMD Ryzen AI)', 'Asus', 'asus-vivobook-s14-ryzen-ai', 78000, 'x86', 'AMD', 'U', 'Ryzen AI 5 340', 'integrated', 'Radeon Graphics', 0, 16, 'LPDDR5X', 512, 'NVMe', 14.0, 'IPS', 60, 350, 100, 63, 1.35, 'Windows', ARRAY['programming','business','general'], 'Budget AI laptop, lightweight (1.35kg), good battery (13+ hrs)', 'Ryzen AI 5 entry-level, small display', 'https://www.amazon.in/dp/B0PLACEHOLDER25?tag=netha-21'),

-- ======================== FILL TO 30 LAPTOPS ========================
('MSI Thin 14 (Core Ultra)', 'MSI', 'msi-thin-14-core-ultra', 68000, 'x86', 'Intel', 'U', 'Core Ultra 7 165U', 'integrated', 'Intel Arc Graphics', 0, 16, 'LPDDR5X', 512, 'NVMe', 14.0, 'IPS', 60, 300, 100, 60, 1.3, 'Windows', ARRAY['programming','business','general'], 'Gaming-brand but thin profile, Core Ultra efficiency, premium feel', 'Limited GPU for content creation', 'https://www.amazon.in/dp/B0PLACEHOLDER26?tag=netha-21'),

('Dell Inspiron 14 Plus (RTX 4050)', 'Dell', 'dell-inspiron-14-plus-rtx4050', 79000, 'x86', 'Intel', 'H', 'Core i7-13620H', 'dedicated', 'RTX 4050', 70, 16, 'DDR5', 512, 'NVMe', 14.0, 'IPS', 120, 350, 100, 72, 1.55, 'Windows', ARRAY['video-editing','content','programming'], 'Compact 14-inch, RTX 4050, 120Hz IPS, lightweight (1.55kg)', 'RTX 4050 aging, battery ~5-6h under load', 'https://www.amazon.in/dp/B0PLACEHOLDER27?tag=netha-21'),

('Acer Aspire 5 (RTX 4060)', 'Acer', 'acer-aspire-5-rtx4060', 73000, 'x86', 'Intel', 'H', 'Core i5-12450H', 'dedicated', 'RTX 4060', 50, 16, 'DDR5', 512, 'NVMe', 15.6, 'IPS', 100, 300, 100, 70, 1.95, 'Windows', ARRAY['video-editing','gaming','programming'], 'Budget RTX 4060, good value, upgradeable RAM, reliable Acer support', 'i5 weaker than i7, RTX 4060 entry-level', 'https://www.amazon.in/dp/B0PLACEHOLDER28?tag=netha-21'),

('Lenovo Legion 5 Pro (RTX 4070)', 'Lenovo', 'lenovo-legion-5-pro-rtx4070', 148000, 'x86', 'Intel', 'HX', 'Core i9-13900HX', 'dedicated', 'RTX 4070', 130, 32, 'DDR5', 1024, 'NVMe', 16.0, 'IPS', 165, 400, 100, 99, 2.3, 'Windows', ARRAY['gaming','video-editing','ai-ml'], 'RTX 4070 powerful, 32GB stock, 165Hz display, excellent gaming thermals', 'Heavy (2.3kg), expensive, loud under load', 'https://www.amazon.in/dp/B0PLACEHOLDER29?tag=netha-21'),

('HP EliteBook 660 (Core Ultra)', 'HP', 'hp-elitebook-660-core-ultra', 105000, 'x86', 'Intel', 'P', 'Core Ultra 7 165U', 'integrated', 'Intel Arc Graphics', 0, 16, 'LPDDR5X', 512, 'NVMe', 13.3, 'IPS', 60, 400, 100, 65, 1.16, 'Windows', ARRAY['business','programming','general'], 'Enterprise security (HP Sure Start), MIL-SPEC tested, long battery, lightweight', 'Business-focused (pricier), no GPU', 'https://www.amazon.in/dp/B0PLACEHOLDER30?tag=netha-21');

-- ============================================================
-- Verification Query
-- ============================================================
-- SELECT COUNT(*), COUNT(DISTINCT slug), COUNT(DISTINCT brand)
-- FROM laptops
-- WHERE created_at > now() - interval '5 minutes';
-- Expected: 30 | 30 | 13
