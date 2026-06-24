const { Client } = require('pg');

const regions = [
  'ap-south-1', 'ap-south-2', 'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-central-2',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
  'ca-central-1', 'sa-east-1', 'me-central-1', 'af-south-1'
];

const poolers = ['aws-0', 'aws-1'];

const sql = `
  CREATE TABLE IF NOT EXISTS admin_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    created_at timestamptz DEFAULT now()
  );

  INSERT INTO admin_users (email)
  VALUES ('yasmanthvemala007@gmail.com')
  ON CONFLICT (email) DO NOTHING;
`;

async function tryRegion(prefix, region) {
  const host = `${prefix}-${region}.pooler.supabase.com`;
  console.log(`Trying ${host}...`);
  
  const client = new Client({
    host: host,
    port: 6543, // Transaction pooler port
    database: 'postgres',
    user: 'postgres.mvnbzcxgbltzkxodxicr',
    password: 'Yasmanth@1212',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 3000
  });

  try {
    await client.connect();
    console.log(`Connected successfully to ${host}!`);
    console.log('Executing query...');
    await client.query(sql);
    console.log('Table admin_users created/seeded successfully!');
    await client.end();
    return true;
  } catch (err) {
    if (err.message.includes('tenant/user') && err.message.includes('not found')) {
      // Just a routing error, ignore verbose logging
    } else {
      console.log(`Failed for ${host}:`, err.message);
    }
    try {
      await client.end();
    } catch (e) {}
    return false;
  }
}

async function run() {
  for (const prefix of poolers) {
    for (const region of regions) {
      const success = await tryRegion(prefix, region);
      if (success) {
        console.log('Migration completed successfully!');
        process.exit(0);
      }
    }
  }
  console.log('All combinations failed.');
  process.exit(1);
}

run();
