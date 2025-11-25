require('dotenv').config();
const crypto = require('node:crypto');
const { webcrypto } = crypto;

/**
 * Hashes a token using SHA-256
 * @param {string} str - The string to hash
 * @returns {Promise<string>} The hex-encoded hash
 */
async function hashToken(str) {
  const data = new TextEncoder().encode(str);
  const hashBuffer = await webcrypto.subtle.digest('SHA-256', data);
  return Buffer.from(hashBuffer).toString('hex');
}

module.exports = {
  hashToken,
};
