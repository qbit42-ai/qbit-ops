const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectOpsDb } = require('../config/database');

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'is invalid'],
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
    },
    role: {
      type: String,
      default: 'admin',
      enum: ['admin', 'super_admin'],
    },
    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Hash password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Cache the model instance
let AdminModel = null;

/**
 * Get Admin model using ops database connection
 * This ensures the connection is ready before using the model
 */
async function getAdminModel() {
  if (!AdminModel) {
    const opsConnection = await connectOpsDb();
    AdminModel = opsConnection.model('Admin', adminSchema);
  }
  return AdminModel;
}

module.exports = getAdminModel;