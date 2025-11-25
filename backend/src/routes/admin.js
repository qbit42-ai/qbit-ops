const express = require('express');
const router = express.Router();
const { loginAdmin, getAdminById } = require('../services/adminAuth');
const { requireAdminAuth } = require('../middleware/auth');

/**
 * POST /api/admin/auth/login
 * Admin login
 */
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await loginAdmin(email, password);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[admin login] Error:', error);
    res.status(401).json({ error: error.message || 'Invalid credentials' });
  }
});

/**
 * GET /api/admin/auth/me
 * Get current admin user
 */
router.get('/auth/me', requireAdminAuth, async (req, res) => {
  try {
    const admin = await getAdminById(req.admin._id);

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json({
      success: true,
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    console.error('[admin me] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/auth/logout
 * Admin logout (client-side token removal)
 */
router.post('/auth/logout', requireAdminAuth, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
