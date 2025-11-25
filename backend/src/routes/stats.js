const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../middleware/auth');
const getUserModel = require('../models/User');
const getOrganisationModel = require('../models/Organisation');

/**
 * GET /api/admin/stats
 * Get customer statistics (placeholder for future)
 */
router.get('/', requireAdminAuth, async (req, res) => {
  try {
    // Get models from qbit-chat connection
    const User = await getUserModel();
    const Organisation = await getOrganisationModel();

    // Get basic statistics
    const [totalUsers, totalOrganisations, activeOrganisations] = await Promise.all([
      User.countDocuments(),
      Organisation.countDocuments(),
      Organisation.countDocuments({ status: 'active' }),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalOrganisations,
        activeOrganisations,
      },
    });
  } catch (error) {
    console.error('[stats] Error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;