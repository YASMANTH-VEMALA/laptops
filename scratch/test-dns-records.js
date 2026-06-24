const dns = require('dns');

dns.resolveAny('mvnbzcxgbltzkxodxicr.supabase.co', (err, records) => {
  if (err) {
    console.error('Error resolving:', err.message);
  } else {
    console.log('Records for mvnbzcxgbltzkxodxicr.supabase.co:', records);
  }
});
