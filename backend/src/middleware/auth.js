const jwt = require('jsonwebtoken');
const getAdminModel = require('../models/Admin');

/**
 * Middleware to verify admin JWT token
 */
const requireAdminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!process.env.ADMIN_JWT_SECRET) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

    // Get admin user from ops database
    const Admin = await getAdminModel();
    const admin = await Admin.findById(decoded.id).select('-password');

    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
    console.error('[requireAdminAuth] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { requireAdminAuth };
