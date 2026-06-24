const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabaseUrl = 'https://mvnbzcxgbltzkxodxicr.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12bmJ6Y3hnYmx0emt4b2R4aWNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzIyNjYyNywiZXhwIjoyMDcyODAyNjI3fQ.xtyROStQlpPwPH4KyvH7lvdDfCKbXjsie9yn_AmGlLE';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

async function run() {
  console.log('Querying laptops...');
  const { data: laptops, error: laptopsError } = await supabase
    .from('laptops')
    .select('id, name')
    .limit(3);

  if (laptopsError) {
    console.error('Laptops error:', laptopsError);
  } else {
    console.log('Laptops data:', laptops);
  }

  console.log('\nQuerying products...');
  const { data: cache, error: cacheError } = await supabase
    .from('products')
    .select('*')
    .limit(1);

  if (cacheError) {
    console.error('Products error:', cacheError);
  } else {
    console.log('Products data:', cache);
  }

  console.log('\nQuerying recommendation_cache for hash...');
  const { data: rec, error: recError } = await supabase
    .from('recommendation_cache')
    .select('*')
    .eq('query_hash', '7b6effd4a1174ccdb9f008026e361437d759a74a')
    .single();

  if (recError) {
    console.error('Recommendation Cache error:', recError);
  } else {
    console.log('Recommendation Cache data:', JSON.stringify(rec, null, 2));
  }
}

run();
