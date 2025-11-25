const mongoose = require('mongoose');
const signPayload = require('../utils/signPayload');
const { hashToken } = require('../utils/crypto');
const { connectDb } = require('../config/database');

const sessionSchema = new mongoose.Schema({
  refreshTokenHash: {
    type: String,
    required: true,
  },
  expiration: {
    type: Date,
    required: true,
    expires: 0,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

const { REFRESH_TOKEN_EXPIRY } = process.env ?? {};
const expires = REFRESH_TOKEN_EXPIRY ? parseInt(REFRESH_TOKEN_EXPIRY, 10) : 1000 * 60 * 60 * 24 * 7; // 7 days default

/**
 * Error class for Session-related errors
 */
class SessionError extends Error {
  constructor(message, code = 'SESSION_ERROR') {
    super(message);
    this.name = 'SessionError';
    this.code = code;
  }
}

// Cache the model instance
let SessionModel = null;

/**
 * Get Session model using qbit-chat database connection
 */
async function getSessionModel() {
  if (!SessionModel) {
    const chatConnection = await connectDb();
    SessionModel = chatConnection.model('Session', sessionSchema);
  }
  return SessionModel;
}

/**
 * Creates a new session for a user
 * @param {string} userId - The ID of the user
 * @param {Object} options - Additional options for session creation
 * @param {Date} options.expiration - Custom expiration date
 * @returns {Promise<{session: Session, refreshToken: string}>}
 * @throws {SessionError}
 */
const createSession = async (userId, options = {}) => {
  if (!userId) {
    throw new SessionError('User ID is required', 'INVALID_USER_ID');
  }

  try {
    const Session = await getSessionModel();
    const session = new Session({
      user: userId,
      expiration: options.expiration || new Date(Date.now() + expires),
    });
    const refreshToken = await generateRefreshToken(session);
    return { session, refreshToken };
  } catch (error) {
    console.error('[createSession] Error creating session:', error);
    throw new SessionError('Failed to create session', 'CREATE_SESSION_FAILED');
  }
};

/**
 * Generates a refresh token for a session
 * @param {Session} session - The session to generate a token for
 * @returns {Promise<string>}
 * @throws {SessionError}
 */
const generateRefreshToken = async (session) => {
  if (!session || !session.user) {
    throw new SessionError('Invalid session object', 'INVALID_SESSION');
  }

  try {
    const expiresIn = session.expiration ? session.expiration.getTime() : Date.now() + expires;

    if (!session.expiration) {
      session.expiration = new Date(expiresIn);
    }

    const refreshToken = await signPayload({
      payload: {
        id: session.user,
        sessionId: session._id,
      },
      secret: process.env.JWT_REFRESH_SECRET,
      expirationTime: Math.floor((expiresIn - Date.now()) / 1000),
    });

    session.refreshTokenHash = await hashToken(refreshToken);
    await session.save();

    return refreshToken;
  } catch (error) {
    console.error('[generateRefreshToken] Error generating refresh token:', error);
    throw new SessionError('Failed to generate refresh token', 'GENERATE_TOKEN_FAILED');
  }
};

module.exports = {
  getSessionModel,
  createSession,
  generateRefreshToken,
  SessionError,
};