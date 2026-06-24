const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabaseUrl = 'https://mvnbzcxgbltzkxodxicr.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12bmJ6Y3hnYmx0emt4b2R4aWNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzIyNjYyNywiZXhwIjoyMDcyODAyNjI3fQ.xtyROStQlpPwPH4KyvH7lvdDfCKbXjsie9yn_AmGlLE';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

async function run() {
  console.log('Testing Qualcomm insert...');
  const { data, error } = await supabase
    .from('laptops')
    .insert([{
      name: 'Test Qualcomm Check',
      brand: 'Test',
      slug: 'test-qualcomm-check-slug',
      price_inr: 50000,
      cpu_arch: 'ARM',
      cpu_brand: 'Qualcomm',
      cpu_series: 'X-series',
      gpu_type: 'integrated',
      ram_gb: 16,
      ram_type: 'LPDDR5X',
      storage_gb: 512,
      storage_type: 'NVMe',
      display_size: 13.3,
      display_type: 'IPS',
      pros: 'test',
      cons: 'test',
      affiliate_amazon_in: 'test'
    }])
    .select();

  if (error) {
    console.error('Insert error:', error.message || error);
  } else {
    console.log('Insert success! Deleting test row...');
    const { error: delError } = await supabase
      .from('laptops')
      .delete()
      .eq('id', data[0].id);
    if (delError) {
      console.error('Delete error:', delError);
    } else {
      console.log('Test row deleted successfully!');
    }
  }
}

run();
