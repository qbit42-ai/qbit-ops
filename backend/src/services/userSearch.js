const getUserModel = require('../models/User');
const getOrganisationModel = require('../models/Organisation');

/**
 * Search users with optional organisation filter
 * @param {Object} options - Search options
 * @param {string} options.search - Search term (email or username)
 * @param {string} options.organisationId - Optional organisation ID to filter by
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 20)
 * @returns {Promise<{users: Array, total: number, page: number, limit: number}>}
 */
const searchUsers = async ({ search, organisationId, page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  let query = {};

  // Get models from qbit-chat connection
  const User = await getUserModel();
  const Organisation = await getOrganisationModel();

  // If searching by organisation, first get member user IDs
  if (organisationId) {
    const organisation = await Organisation.findOne({ organisationId }).lean();

    if (!organisation) {
      return { users: [], total: 0, page, limit };
    }

    const memberUserIds = organisation.members.map((member) => member.userId);
    query._id = { $in: memberUserIds };
  }

  // Add search filter for email or username
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    query.$or = [
      { email: searchRegex },
      { username: searchRegex },
      { name: searchRegex },
    ];
  }

  // Execute query with pagination
  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password -__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);

  // Get organisation memberships for each user
  const usersWithOrgs = await Promise.all(
    users.map(async (user) => {
      const organisations = await Organisation.find({
        'members.userId': user._id,
      })
        .select('organisationId name members.$')
        .lean();

      const orgMemberships = organisations.map((org) => {
        const member = org.members.find(
          (m) => m.userId.toString() === user._id.toString()
        );
        return {
          organisationId: org.organisationId,
          name: org.name,
          roleId: member?.roleId,
          status: member?.status,
        };
      });

      return {
        ...user,
        organisations: orgMemberships,
      };
    })
  );

  return {
    users: usersWithOrgs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get user by ID with organisation memberships
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>}
 */
const getUserById = async (userId) => {
  // Get models from qbit-chat connection
  const User = await getUserModel();
  const Organisation = await getOrganisationModel();

  const user = await User.findById(userId).select('-password -__v').lean();

  if (!user) {
    return null;
  }

  // Get organisation memberships
  const organisations = await Organisation.find({
    'members.userId': user._id,
  })
    .select('organisationId name members.$')
    .lean();

  const orgMemberships = organisations.map((org) => {
    const member = org.members.find(
      (m) => m.userId.toString() === user._id.toString()
    );
    return {
      organisationId: org.organisationId,
      name: org.name,
      roleId: member?.roleId,
      status: member?.status,
      joinedAt: member?.joinedAt,
    };
  });

  return {
    ...user,
    organisations: orgMemberships,
  };
};

module.exports = {
  searchUsers,
  getUserById,
};