const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mvnbzcxgbltzkxodxicr.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12bmJ6Y3hnYmx0emt4b2R4aWNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzIyNjYyNywiZXhwIjoyMDcyODAyNjI3fQ.xtyROStQlpPwPH4KyvH7lvdDfCKbXjsie9yn_AmGlLE';

async function run() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    });
    const spec = await res.json();
    console.log('Paths available:');
    console.log(Object.keys(spec.paths));
  } catch (err) {
    console.error('Error fetching OpenAPI spec:', err);
  }
}

run();
