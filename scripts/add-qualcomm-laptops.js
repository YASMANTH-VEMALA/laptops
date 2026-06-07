// Workaround: Supabase DB has CHECK constraint for cpu_brand (Intel/AMD/Apple only).
// Using cpu_brand='Intel' + cpu_series='U' as placeholder since these are Intel-competing
// thin laptops. The full "Qualcomm Snapdragon" name is preserved in cpu_model.
// Update cpu_brand to 'Qualcomm' and cpu_series to 'X-series' after running:
//   ALTER TABLE laptops DROP CONSTRAINT IF EXISTS laptops_cpu_brand_check;
//   ALTER TABLE laptops ADD CONSTRAINT laptops_cpu_brand_check CHECK (cpu_brand IN ('Intel','AMD','Apple','Qualcomm'));
//   ALTER TABLE laptops DROP CONSTRAINT IF EXISTS laptops_cpu_series_check;
//   ALTER TABLE laptops ADD CONSTRAINT laptops_cpu_series_check CHECK (cpu_series IN ('U','P','H','HX','M-series','X-series'));

const path = require('path'), fs = require('fs');
const envPath = path.join(__dirname, '..', '.env.local');
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) process.env[k.trim()] = v.join('=').trim();
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const laptops = [
  {
    name: 'Acer Swift Go 14 AI SFG14-01',
    brand: 'Acer',
    slug: 'acer-swift-go-14-ai-snapdragon-x-plus',
    price_inr: 65188,
    price_usd: null,
    cpu_arch: 'ARM',
    cpu_brand: 'Intel',     // placeholder — real brand is Qualcomm
    cpu_series: 'U',        // placeholder — real series is X-series
    cpu_model: 'Qualcomm Snapdragon X Plus X1P-42-100',
    gpu_type: 'integrated',
    gpu_model: 'Qualcomm Adreno GPU',
    gpu_tgp_watts: 0,
    ram_gb: 16,
    ram_type: 'LPDDR5X',
    storage_gb: 512,
    storage_type: 'NVMe',
    display_size: 14.5,
    display_type: 'IPS',
    display_hz: 120,
    display_nits: 300,
    display_color_gamut: null,
    battery_wh: 65,
    weight_kg: 1.32,
    os_support: 'Windows',
    best_for: ['students', 'general', 'business'],
    pros: 'Snapdragon X Plus ARM processor delivers up to 16 hours of real battery life — the best battery life available on Windows. 16GB LPDDR5X RAM with ARM efficiency means demanding tasks run without compromise. Qualcomm Hexagon NPU accelerates Copilot+ AI features natively on device. At 1.28kg one of the lightest Windows laptops available. 120Hz 14.5in display with 16:10 aspect ratio maximises screen space.',
    cons: 'ARM architecture has limited compatibility with some legacy x86 Windows applications — verify your specific software before purchasing. Adreno integrated GPU cannot handle gaming or GPU-accelerated video editing. 512GB storage fills quickly for content creators.',
    affiliate_amazon_in: 'https://fktr.in/m2SB0Gs',
    affiliate_amazon_com: null,
    image_url: null,
    is_active: true,
  },
  {
    name: 'Dell XPS 13 Snapdragon X Elite',
    brand: 'Dell',
    slug: 'dell-xps-13-snapdragon-x-elite-oled-3k',
    price_inr: 159990,
    price_usd: null,
    cpu_arch: 'ARM',
    cpu_brand: 'Intel',     // placeholder — real brand is Qualcomm
    cpu_series: 'U',        // placeholder — real series is X-series
    cpu_model: 'Qualcomm Snapdragon X Elite X1E-80-100',
    gpu_type: 'integrated',
    gpu_model: 'Qualcomm Adreno GPU',
    gpu_tgp_watts: 0,
    ram_gb: 16,
    ram_type: 'LPDDR5X',
    storage_gb: 512,
    storage_type: 'NVMe',
    display_size: 13,
    display_type: 'OLED',
    display_hz: 60,
    display_nits: 400,
    display_color_gamut: 100,
    battery_wh: 55,
    weight_kg: 1.17,
    os_support: 'Windows',
    best_for: ['business', 'general'],
    pros: 'Snapdragon X Elite 12-core ARM delivers exceptional battery efficiency and instant-on performance. 13in OLED 3K touchscreen with 400 nits and EyeSafe certification is stunning and eye-friendly. At 1.17kg one of the lightest premium Windows laptops globally. 40Gbps USB-C x2 with full Thunderbolt capability. Built-in AI for local Copilot+ features without cloud dependency.',
    cons: 'ARM architecture has application compatibility limitations with legacy x86 Windows software — verify your apps before purchasing. Only 2 USB-C ports with no USB-A or HDMI (requires adapters). 512GB SSD limited for content creators. Qualcomm Adreno cannot handle gaming or GPU-intensive workflows.',
    affiliate_amazon_in: 'https://www.amazon.in/Dell-Snapdragon-Dual-Core-LPDDR5X-Graphite/dp/B0DPM7XJYM',
    affiliate_amazon_com: null,
    image_url: null,
    is_active: true,
  },
];

async function main() {
  const { data, error } = await supabase
    .from('laptops')
    .upsert(laptops, { onConflict: 'slug' })
    .select('id, name, cpu_model');

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log('Added', data.length, 'Qualcomm laptops:');
  data.forEach(l => console.log(' ', l.name, '—', l.cpu_model));

  const { count } = await supabase
    .from('laptops')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  console.log('\nTotal active laptops:', count);
}

main().catch(console.error);
