const https = require('https');

const options = {
  hostname: 'mvnbzcxgbltzkxodxicr.supabase.co',
  path: '/rest/v1/',
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12bmJ6Y3hnYmx0emt4b2R4aWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMjY2MjcsImV4cCI6MjA3MjgwMjYyN30._f7nTieAoLrnzfj1bq_HRNj2wpCAglMAla5ZRLXfaCE'
  }
};

https.get(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Body:', data.substring(0, 500));
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
