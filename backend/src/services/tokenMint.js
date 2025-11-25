const getUserModel = require('../models/User');
const { createSession, generateRefreshToken } = require('../models/Session');
const signPayload = require('../utils/signPayload');

const { SESSION_EXPIRY } = process.env ?? {};
const expires = SESSION_EXPIRY ? parseInt(SESSION_EXPIRY, 10) : 1000 * 60 * 15; // 15 min default

/**
 * Mint JWT token for user emulation
 * @param {string} userId - The ID of the target user
 * @param {Object} admin - The admin user who is minting the token
 * @param {number} expiresIn - Optional custom expiration time in seconds
 * @returns {Promise<{token: string, refreshToken: string, user: Object, session: Object}>}
 */
const mintToken = async (userId, admin, expiresIn = null) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  if (!admin || !admin._id || !admin.email) {
    throw new Error('Admin information is required');
  }

  const User = await getUserModel();
  const user = await User.findOne({ _id: userId }).lean();

  if (!user) {
    throw new Error('User not found');
  }

  // Calculate expiration
  const tokenExpirationTime = expiresIn ? expiresIn : expires / 1000; // Convert ms to seconds

  // Generate JWT token with admin tracking
  const tokenPayload = {
    id: user._id,
    username: user.username || '',
    provider: user.provider || 'local',
    email: user.email,
    mintedBy: {
      adminId: admin._id.toString(),
      adminEmail: admin.email,
      timestamp: new Date().toISOString(),
    },
  };

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  const token = await signPayload({
    payload: tokenPayload,
    secret: process.env.JWT_SECRET,
    expirationTime: tokenExpirationTime,
  });

  // Create session and generate refresh token
  const { session, refreshToken } = await createSession(userId);

  return {
    token,
    refreshToken,
    user: {
      _id: user._id,
      email: user.email,
      username: user.username,
      name: user.name,
      provider: user.provider,
    },
    session: {
      _id: session._id,
      expiration: session.expiration,
    },
  };
};

module.exports = {
  mintToken,
};
