const dns = require('dns');

dns.resolve6('db.mvnbzcxgbltzkxodxicr.supabase.co', (err, addresses) => {
  if (err) {
    console.error('AAAA resolution failed:', err.message);
  } else {
    console.log('AAAA records:', addresses);
  }
});
