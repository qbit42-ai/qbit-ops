const mongoose = require('mongoose');
const { connectDb } = require('../config/database');

const MemberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    roleId: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now },
    usedAt: { type: Date, default: null },
    email: { type: String, lowercase: true, match: [/\S+@\S+\.\S+/, 'is invalid'], required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
    activatedAt: { type: Date },
    deactivatedAt: { type: Date },
  },
  { _id: false }
);

const organisationSchema = new mongoose.Schema(
  {
    organisationId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    members: [MemberSchema],
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'is invalid'],
    },
    status: {
      type: String,
      enum: ['pending_verification', 'active', 'suspended', 'pending_deletion', 'deleted'],
      default: 'active',
      index: true,
    },
    subscriptionStatus: {
      type: String,
      enum: ['trial', 'active', 'past_due', 'canceled', 'unpaid'],
      default: 'trial',
      index: true,
    },
    subscriptionTier: {
      type: String,
      enum: ['professional', 'business', 'enterprise'],
      required: true,
      index: true,
    },
    trialEndsAt: { type: Date },
    purchasedSeats: { type: Number, default: 0 },
    activeSeats: { type: Number, default: 0 },
    maxSeats: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Index for faster member lookups
organisationSchema.index({ 'members.userId': 1 });

// Cache the model instance
let OrganisationModel = null;

/**
 * Get Organisation model using qbit-chat database connection
 */
async function getOrganisationModel() {
  if (!OrganisationModel) {
    const chatConnection = await connectDb();
    OrganisationModel = chatConnection.model('Organisation', organisationSchema);
  }
  return OrganisationModel;
}

module.exports = getOrganisationModel;