/**
 * SSO service for setting cookies and handling redirects
 */

/**
 * Set refresh token cookie for SSO
 * This works when qbit-ops is deployed on ops.qbit42.ai subdomain
 * Cookie with domain .qbit42.ai will be accessible from both ops.qbit42.ai and chat.qbit42.ai
 * 
 * Production setup:
 * - qbit-ops runs on ops.qbit42.ai
 * - qbit-chat runs on chat.qbit42.ai
 * - Cookie domain .qbit42.ai allows sharing between subdomains
 * 
 * @param {Object} res - Express response object
 * @param {string} refreshToken - The refresh token
 * @param {Date} expires - Expiration date
 */
const setRefreshTokenCookie = (res, refreshToken, expires) => {
  const cookieDomain = process.env.COOKIE_DOMAIN || '.qbit42.ai';
  const isProduction = process.env.NODE_ENV === 'production';

  // Cookie settings for subdomain SSO (ops.qbit42.ai -> chat.qbit42.ai):
  // - domain: .qbit42.ai allows cookie to be shared across subdomains
  // - sameSite: 'lax' allows navigation from ops to chat subdomain
  // - secure: true in production (requires HTTPS for cookie to be set)
  // - httpOnly: true prevents JavaScript access (XSS protection)
  // - path: '/' makes cookie available for entire domain
  const cookieOptions = {
    domain: cookieDomain, // .qbit42.ai works for all *.qbit42.ai subdomains
    expires: expires,
    httpOnly: true,
    secure: isProduction, // true in production (HTTPS required)
    sameSite: 'lax', // Allows cross-subdomain navigation (ops -> chat)
    path: '/',
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);
};

/**
 * Generate redirect URL to main service
 * @returns {string} The redirect URL
 */
const getRedirectUrl = () => {
  const chatUrl = process.env.QBIT_CHAT_URL || 'https://chat.qbit42.ai';
  return chatUrl;
};

module.exports = {
  setRefreshTokenCookie,
  getRedirectUrl,
};
