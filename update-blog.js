const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const contentHtml = `<h2>Why Students Need the Right Laptop</h2>
<p>A student laptop needs to handle <strong>note-taking, online classes, coding assignments, video calls, and Netflix breaks</strong> — without dying by lunchtime or draining your budget.</p>
<p>Under ₹60,000, you won't get gaming power, but you absolutely can get:</p>
<ul>
  <li><strong>16GB RAM</strong> for smooth multitasking</li>
  <li><strong>Fast SSD</strong> for instant app launches</li>
  <li><strong>8+ hour battery</strong> for full lecture days</li>
  <li><strong>1.5-1.8 kg weight</strong> for easy backpack carrying</li>
  <li><strong>Reliable warranty</strong> and local service centers</li>
</ul>

<h2>Top 3 Picks for Students Under ₹60,000</h2>

<h3>1. Dell Inspiron 15 (Ryzen 5) — Best All-Around Value</h3>
<p><strong>Price:</strong> ₹53,015</p>
<p>The Dell Inspiron 15 is our top pick for most students. Here's why:</p>
<ul>
  <li><strong>16GB RAM</strong> — rare under ₹60k, handles 20+ browser tabs + VS Code without lag</li>
  <li><strong>120Hz display</strong> — scrolling and video watching feel silky smooth</li>
  <li><strong>Ryzen 5 processor</strong> — snappy for all college tasks and light coding</li>
  <li><strong>500GB SSD</strong> — fast boot and app launches (watch it load your operating system in 15 seconds)</li>
  <li><strong>Reliable Dell warranty</strong> — service centers across India</li>
</ul>
<p><strong>Real-world performance:</strong> Runs Microsoft Office, Google Workspace, VS Code, Canva, and video editing software smoothly. Battery lasts 7-8 hours with mixed usage.</p>
<p><strong>Trade-offs:</strong> No dedicated graphics card (fine for students), weighs 1.82kg (still portable).</p>

<h3>2. ASUS Vivobook Go 15 — Lightest & Most Affordable</h3>
<p><strong>Price:</strong> ₹50,990</p>
<p>If you're moving between lectures all day and want the lightest option:</p>
<ul>
  <li><strong>Only 1.63kg</strong> — the lightest in this list, slips into any backpack</li>
  <li><strong>Fast charging</strong> — 49 minutes for 50% charge, great for between classes</li>
  <li><strong>AMD Ryzen 5</strong> — handles all college work smoothly</li>
  <li><strong>Lowest price</strong> — best budget-conscious pick</li>
  <li><strong>IPS display</strong> — good colors for any type of work</li>
</ul>
<p><strong>Real-world performance:</strong> Lightweight champion. Great for note-taking, coding, and browsing. Battery lasts around 7 hours.</p>
<p><strong>Trade-offs:</strong> Only 8GB RAM (still adequate, but less headroom for heavy multitasking), no dedicated graphics.</p>

<h3>3. Lenovo IdeaPad Slim 3 — Best Battery Life</h3>
<p><strong>Price:</strong> ₹52,000</p>
<p>For students with back-to-back classes and no charging access:</p>
<ul>
  <li><strong>Best battery life</strong> — 7+ hours of real usage (most in this price range)</li>
  <li><strong>Intel Core i5</strong> — snappy performance for everyday tasks</li>
  <li><strong>Lightweight</strong> — 1.65kg, easy to carry</li>
  <li><strong>Matte display</strong> — great for reading documents during long study sessions</li>
</ul>
<p><strong>Real-world performance:</strong> Rock-solid reliability. Perfect for students who study for 4-5 hours straight without charging.</p>
<p><strong>Trade-offs:</strong> Only 8GB RAM, no dedicated graphics.</p>

<h2>Quick Comparison</h2>
<p><strong>Dell Inspiron 15:</strong> Best specs (16GB RAM, 120Hz), most value<br/>
<strong>ASUS Vivobook:</strong> Lightest (1.63kg), cheapest<br/>
<strong>Lenovo IdeaPad:</strong> Best battery (7+ hours), most reliable</p>

<h2>What's NOT Important Under ₹60,000</h2>
<p><strong>Dedicated graphics card:</strong> Students don't need RTX 4050 or RTX 3050. You're doing assignments, not gaming. Integrated graphics handles everything.</p>
<p><strong>Ultra-slim design:</strong> 1.8kg is already light. Don't pay ₹15k extra for 0.2kg less weight.</p>
<p><strong>Brand prestige:</strong> Dell, Lenovo, HP, ASUS — all have good warranty. Pick the specs, not the logo.</p>

<h2>How to Buy Smart</h2>
<ul>
  <li><strong>Check Amazon prices weekly</strong> — these laptops often drop ₹2,000-5,000 during sales</li>
  <li><strong>Verify warranty</strong> — ensure it covers your city (most brands have nationwide service)</li>
  <li><strong>Budget for basics:</strong> Office Suite (₹0-5,000), antivirus (free options exist), bag (₹1,500)</li>
  <li><strong>Avoid:</strong> Expensive extended warranties (usually not worth it), random brand gaming laptops (poor support)</li>
</ul>

<h2>The Verdict</h2>
<p><strong>For 80% of students:</strong> Dell Inspiron 15 (Ryzen 5) — that extra 8GB RAM is worth it.</p>
<p><strong>If you travel constantly:</strong> ASUS Vivobook Go 15 — lightest, cheapest, reliable.</p>
<p><strong>If you study 8+ hours straight:</strong> Lenovo IdeaPad Slim 3 — battery endurance matters.</p>

<h2>Final Notes</h2>
<ul>
  <li>All three will handle your entire college career. Don't overthink it.</li>
  <li>Upgrade RAM or SSD after purchase if needed (cheaper than buying new).</li>
  <li>These prices are valid as of June 2026. Check current Amazon rates before buying.</li>
  <li>As Amazon Associates, we earn commission on purchases. This doesn't change your price.</li>
</ul>`;

(async () => {
  const { data, error } = await supabase
    .from('blog_posts')
    .update({
      content_html: contentHtml,
      featured_laptop_ids: [
        '2d1590ec-2ef0-4a00-a4d6-85e5e9c15c8a',
        '3373ec22-a3fe-4b6d-b56a-8e8b4f2f6e2c',
        'c6aa41d5-603b-4ab1-af8b-822eccccf6cd'
      ]
    })
    .eq('slug', 'best-laptop-for-students-under-60k-india-2026');

  if (error) console.error('❌ Error:', error);
  else console.log('✅ Blog post updated!');
})();
