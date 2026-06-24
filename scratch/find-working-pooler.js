const dns = require('dns');
const net = require('net');

const regions = [
  'ap-south-1', 'ap-south-2', 'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-central-2',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
  'ca-central-1', 'sa-east-1', 'me-central-1', 'af-south-1'
];

const poolers = ['aws-0', 'aws-1'];

function checkPort(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2000);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('error', () => {
      resolve(false);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.connect(port, host);
  });
}

async function run() {
  console.log('Scanning pooler hosts...');
  for (const prefix of poolers) {
    for (const region of regions) {
      const host = `${prefix}-${region}.pooler.supabase.com`;
      try {
        const address = await new Promise((resolve) => {
          dns.lookup(host, (err, addr) => resolve(addr));
        });
        
        if (address) {
          console.log(`Resolved: ${host} -> ${address}`);
          const open6543 = await checkPort(host, 6543);
          const open5432 = await checkPort(host, 5432);
          if (open6543 || open5432) {
            console.log(`  PORT STATUS: 6543=${open6543}, 5432=${open5432}`);
          }
        }
      } catch (e) {}
    }
  }
  console.log('Scan finished.');
}

run();
