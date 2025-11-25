const mongoose = require('mongoose');
const { connectDb } = require('../config/database');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    username: {
      type: String,
      lowercase: true,
      default: '',
    },
    email: {
      type: String,
      required: [true, "can't be blank"],
      lowercase: true,
      unique: true,
      match: [/\S+@\S+\.\S+/, 'is invalid'],
      index: true,
    },
    emailVerified: {
      type: Boolean,
      required: true,
      default: false,
    },
    password: {
      type: String,
      trim: true,
      minlength: 8,
      maxlength: 128,
    },
    avatar: {
      type: String,
      required: false,
    },
    provider: {
      type: String,
      required: true,
      default: 'local',
    },
    role: {
      type: String,
      default: 'USER',
    },
  },
  { timestamps: true }
);

// Cache the model instance
let UserModel = null;

/**
 * Get User model using qbit-chat database connection
 * This ensures the connection is ready before using the model
 */
async function getUserModel() {
  if (!UserModel) {
    const chatConnection = await connectDb();
    UserModel = chatConnection.model('User', userSchema);
  }
  return UserModel;
}

module.exports = getUserModel;