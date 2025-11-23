const crypto = require('crypto');

function generateSecret() {
  return crypto.randomBytes(32).toString('hex');
}

console.log('Generated JWT Secrets:');
console.log('====================');
console.log('JWT_SECRET=' + generateSecret());
console.log('LOGGER_JWT_SECRET=' + generateSecret());
console.log('REFRESH_TOKEN_SECRET=' + generateSecret());
console.log('EMAIL_VERIFICATION_SECRET=' + generateSecret());