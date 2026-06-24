const https = require('https');

const options = {
  hostname: 'mvnbzcxgbltzkxodxicr.supabase.co',
  path: '/rest/v1/',
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12bmJ6Y3hnYmx0emt4b2R4aWNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzIyNjYyNywiZXhwIjoyMDcyODAyNjI3fQ.xtyROStQlpPwPH4KyvH7lvdDfCKbXjsie9yn_AmGlLE'
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const swagger = JSON.parse(data);
      console.log('Available tables/paths in REST API:');
      console.log(Object.keys(swagger.paths || {}));
    } catch (e) {
      console.error('Error parsing JSON:', e.message);
      console.log('Response was:', data.substring(0, 1000));
    }
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
