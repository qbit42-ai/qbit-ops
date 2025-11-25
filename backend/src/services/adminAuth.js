const jwt = require('jsonwebtoken');
const getAdminModel = require('../models/Admin');

/**
 * Admin login service
 */
const loginAdmin = async (email, password) => {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  // Get Admin model from ops connection
  const Admin = await getAdminModel();

  // Find admin by email
  const admin = await Admin.findOne({ email: email.toLowerCase() });

  if (!admin) {
    throw new Error('Invalid credentials');
  }

  // Compare password
  const isPasswordValid = await admin.comparePassword(password);

  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  // Update last login
  admin.lastLogin = new Date();
  await admin.save();

  // Generate JWT token
  if (!process.env.ADMIN_JWT_SECRET) {
    throw new Error('ADMIN_JWT_SECRET is not configured');
  }

  const token = jwt.sign(
    {
      id: admin._id,
      email: admin.email,
      role: admin.role,
    },
    process.env.ADMIN_JWT_SECRET,
    { expiresIn: '24h' }
  );

  return {
    token,
    admin: {
      id: admin._id,
      email: admin.email,
      role: admin.role,
      lastLogin: admin.lastLogin,
    },
  };
};

/**
 * Get admin by ID
 */
const getAdminById = async (adminId) => {
  const Admin = await getAdminModel();
  const admin = await Admin.findById(adminId).select('-password');
  return admin;
};

module.exports = {
  loginAdmin,
  getAdminById,
};
