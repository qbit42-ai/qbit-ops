const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../middleware/auth');
const { auditTokenMint } = require('../middleware/auditLog');
const { mintToken } = require('../services/tokenMint');
const { setRefreshTokenCookie, getRedirectUrl } = require('../services/ssoService');

/**
 * POST /api/admin/tokens/mint
 * Mint JWT token for user emulation
 */
router.post('/mint', requireAdminAuth, auditTokenMint, async (req, res) => {
  try {
    const { userId, expiresIn } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const result = await mintToken(userId, req.admin, expiresIn);

    res.json({
      success: true,
      token: result.token,
      refreshToken: result.refreshToken,
      user: result.user,
      redirectUrl: getRedirectUrl(),
      mintedBy: {
        adminId: req.admin._id,
        adminEmail: req.admin.email,
      },
    });
  } catch (error) {
    console.error('[token mint] Error:', error);
    res.status(400).json({ error: error.message || 'Failed to mint token' });
  }
});

/**
 * POST /api/admin/tokens/emulate
 * Emulate user (mint token + set cookie + return redirect URL)
 */
router.post('/emulate', requireAdminAuth, auditTokenMint, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const result = await mintToken(userId, req.admin);

    // Set refresh token cookie
    setRefreshTokenCookie(res, result.refreshToken, result.session.expiration);

    // Get redirect URL
    const redirectUrl = getRedirectUrl();

    res.json({
      success: true,
      redirectUrl: redirectUrl,
      message: 'Token minted successfully. Opening chat in new tab...',
    });
  } catch (error) {
    console.error('[token emulate] Error:', error);
    res.status(400).json({ error: error.message || 'Failed to emulate user' });
  }
});

module.exports = router;
