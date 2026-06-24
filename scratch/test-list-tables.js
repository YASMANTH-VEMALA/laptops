const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabaseUrl = 'https://mvnbzcxgbltzkxodxicr.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12bmJ6Y3hnYmx0emt4b2R4aWNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzIyNjYyNywiZXhwIjoyMDcyODAyNjI3fQ.xtyROStQlpPwPH4KyvH7lvdDfCKbXjsie9yn_AmGlLE';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

async function run() {
  console.log('Querying info schema tables...');
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');
  
  if (error) {
    console.error('Error fetching tables from info schema:', error);
  } else {
    console.log('Tables from info schema:', data);
  }
}

run();
