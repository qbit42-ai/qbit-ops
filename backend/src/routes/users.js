const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../middleware/auth');
const { searchUsers, getUserById } = require('../services/userSearch');

/**
 * GET /api/admin/users
 * List/search users with optional organisation filter
 * Query params: search, organisationId, page, limit
 */
router.get('/', requireAdminAuth, async (req, res) => {
  try {
    const { search, organisationId, page, limit } = req.query;

    const result = await searchUsers({
      search,
      organisationId,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[users list] Error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/admin/users/:id
 * Get user details
 */
router.get('/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('[user detail] Error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
