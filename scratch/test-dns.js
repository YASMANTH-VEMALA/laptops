const dns = require('dns');

const hosts = [
  'mvnbzcxgbltzkxodxicr.supabase.co',
  'db.mvnbzcxgbltzkxodxicr.supabase.co',
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-us-east-2.pooler.supabase.com',
  'aws-0-ap-south-1.pooler.supabase.com'
];

for (const host of hosts) {
  dns.lookup(host, (err, address, family) => {
    if (err) {
      console.log(`Failed to resolve ${host}:`, err.message);
    } else {
      console.log(`Resolved ${host} -> ${address}`);
    }
  });
}
