const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../middleware/auth');
const getOrganisationModel = require('../models/Organisation');

/**
 * GET /api/admin/organisations
 * List all organisations with pagination and search
 * Query params: search, page, limit
 */
router.get('/', requireAdminAuth, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    // Get Organisation model from qbit-chat connection
    const Organisation = await getOrganisationModel();

    let query = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { organisationId: searchRegex },
      ];
    }

    const [organisations, total] = await Promise.all([
      Organisation.find(query)
        .select('-members -__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      Organisation.countDocuments(query),
    ]);

    res.json({
      success: true,
      organisations,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (error) {
    console.error('[organisations list] Error:', error);
    res.status(500).json({ error: 'Failed to fetch organisations' });
  }
});

/**
 * GET /api/admin/organisations/:id
 * Get organisation details
 */
router.get('/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get Organisation model from qbit-chat connection
    const Organisation = await getOrganisationModel();

    // Try to find by organisationId first, then by _id
    const organisation = await Organisation.findOne({
      $or: [{ organisationId: id }, { _id: id }],
    }).lean();

    if (!organisation) {
      return res.status(404).json({ error: 'Organisation not found' });
    }

    res.json({
      success: true,
      organisation,
    });
  } catch (error) {
    console.error('[organisation detail] Error:', error);
    res.status(500).json({ error: 'Failed to fetch organisation' });
  }
});

/**
 * GET /api/admin/organisations/:id/members
 * Get all members of an organisation
 */
router.get('/:id/members', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get Organisation model from qbit-chat connection
    const Organisation = await getOrganisationModel();

    const organisation = await Organisation.findOne({
      $or: [{ organisationId: id }, { _id: id }],
    })
      .populate('members.userId', 'email username name avatar')
      .lean();

    if (!organisation) {
      return res.status(404).json({ error: 'Organisation not found' });
    }

    const members = organisation.members.map((member) => ({
      userId: member.userId,
      email: member.email,
      roleId: member.roleId,
      status: member.status,
      joinedAt: member.joinedAt,
      usedAt: member.usedAt,
      activatedAt: member.activatedAt,
      deactivatedAt: member.deactivatedAt,
    }));

    res.json({
      success: true,
      organisationId: organisation.organisationId,
      organisationName: organisation.name,
      members,
      total: members.length,
    });
  } catch (error) {
    console.error('[organisation members] Error:', error);
    res.status(500).json({ error: 'Failed to fetch organisation members' });
  }
});

module.exports = router;