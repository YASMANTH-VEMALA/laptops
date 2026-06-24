const { Client } = require('pg');

const client = new Client({
  host: 'db.mvnbzcxgbltzkxodxicr.supabase.co',
  port: 6543, // Transaction pooler port for Supabase
  database: 'postgres',
  user: 'postgres',
  password: 'Yasmanth@1212', // Guessed from ADMIN_PASSWORD
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('Connecting to database...');
  try {
    await client.connect();
    console.log('Connected successfully!');
    
    console.log('Running migration...');
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
    
    await client.query(sql);
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Error executing query:', err);
  } finally {
    await client.end();
  }
}

run();
