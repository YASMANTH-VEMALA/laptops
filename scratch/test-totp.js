const { createHmac } = require('crypto');

function decodeBase32(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = base32.toUpperCase().replace(/=+$/, '');
  const length = clean.length;
  const buffer = new Uint8Array(Math.floor((length * 5) / 8));
  let bits = 0;
  let value = 0;
  let index = 0;

  for (let i = 0; i < length; i++) {
    const val = alphabet.indexOf(clean[i]);
    if (val === -1) {
      throw new Error('Invalid base32 character in secret key');
    }
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      buffer[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  return buffer;
}

function getTOTP(secret, timestamp) {
  const key = decodeBase32(secret);
  const counter = Math.floor(timestamp / 30);
  const buffer = Buffer.alloc(8);
  let tmp = counter;
  for (let j = 7; j >= 0; j--) {
    buffer[j] = tmp & 0xff;
    tmp = tmp >> 8;
  }
  const hmac = createHmac('sha1', key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const binary = hmac.readUInt32BE(offset) & 0x7fffffff;
  return (binary % 1000000).toString().padStart(6, '0');
}

const secret = 'JBSWY3DPEHPK3PXP';
const code1 = '619386'; // entered at 1782208646 (3:27:26 PM)
const code2 = '048086'; // entered at 1782208876 (3:31:16 PM)

function findTimeForCode(targetCode, centerTime) {
  const halfDay = 12 * 60 * 60;
  for (let offset = -halfDay; offset <= halfDay; offset += 30) {
    if (getTOTP(secret, centerTime + offset) === targetCode) {
      return offset / 60; // in minutes
    }
  }
  return null;
}

console.log('Drift for 619386:', findTimeForCode(code1, 1782208646), 'minutes');
console.log('Drift for 048086:', findTimeForCode(code2, 1782208876), 'minutes');
