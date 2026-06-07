const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://mvnbzcxgbltzkxodxicr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12bmJ6Y3hnYmx0emt4b2R4aWNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzIyNjYyNywiZXhwIjoyMDcyODAyNjI3fQ.xtyROStQlpPwPH4KyvH7lvdDfCKbXjsie9yn_AmGlLE'
);

// Slugs to deactivate — old/inaccurate entries replaced by better CSV data
const toDeactivate = [
  // Acer Aspire Lite: old slug (Rs45,990) vs new accurate one (Rs54,990)
  'acer-aspire-lite-al15-41',
  // MacBook Air M4: old generic slug vs new precise model number
  'macbook-air-m4-13',
  // HP Envy x360 14 OLED: old generic vs new (fc0178TU with correct specs)
  'hp-envy-x360-14-oled',
  // HP Victus 15 RTX 5060: old entry Rs65,990 is wrong price (should be Rs1,32,990)
  'hp-victus-15-rtx5060',
  // Lenovo ThinkPad X1 Carbon Core Ultra: old entry Rs1,25,000 is wrong (should be Rs2,75,000)
  'lenovo-thinkpad-x1-carbon-core-ultra',
  // Acer Swift Go 14 AI: old generic entry vs new CSV entry
  'acer-swift-go-14-ai',
  // ASUS Vivobook S14 Core Ultra: CSV has the correct Ryzen AI 7 350 version
  'asus-vivobook-s14-core-ultra',
  // HP Envy x360 14 old generic entry
  'hp-envy-x360-14',
  // Lenovo Yoga Slim 7 old generic
  'lenovo-yoga-slim-7-core-ultra',
];

async function main() {
  console.log('Deactivating old/duplicate entries...\n');

  for (const slug of toDeactivate) {
    const { data, error } = await supabase
      .from('laptops')
      .update({ is_active: false })
      .eq('slug', slug)
      .select('name, slug');

    if (error) {
      console.log(`  skip  ${slug} — not found or error`);
    } else if (data.length === 0) {
      console.log(`  skip  ${slug} — not found`);
    } else {
      console.log(`  deactivated: ${data[0].name} (${slug})`);
    }
  }

  const { count } = await supabase
    .from('laptops')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  console.log(`\nActive laptops after cleanup: ${count}`);
}

main().catch(console.error);
