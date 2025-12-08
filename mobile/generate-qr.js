const qrcode = require('qrcode-terminal');
const os = require('os');

// Obter IP local
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const ip = getLocalIP();
const url = `exp://${ip}:8081`;

console.log('\n========================================');
console.log('  Expo Development Server');
console.log('========================================\n');
console.log(`Metro waiting on: exp://${ip}:8081\n`);
console.log('Scan this QR code with Expo Go app:\n');

qrcode.generate(url, { small: true }, (qr) => {
  console.log(qr);
  console.log('\n========================================');
  console.log(`\nOr enter this URL manually in Expo Go:`);
  console.log(`  ${url}`);
  console.log('\n========================================\n');
});
