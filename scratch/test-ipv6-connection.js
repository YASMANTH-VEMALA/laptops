const { Client } = require('pg');

const client = new Client({
  host: '2406:da1a:6b0:f60c:40b2:2b76:1f1:c98d', // IPv6 address
  port: 5432, // Direct database port
  database: 'postgres',
  user: 'postgres',
  password: 'Yasmanth@1212',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('Connecting directly to database via IPv6...');
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
