const mongoose = require('mongoose');

const messageLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ['sms', 'whatsapp', 'email'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    recipient: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed'],
      default: 'pending',
    },
    externalId: {
      type: String,
    },
    errorMessage: {
      type: String,
    },
    sentAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    birthdayYear: {
      type: Number,
      required: true,
    },
    scheduledFor: {
      type: Date,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for duplicate prevention
messageLogSchema.index(
  { contact: 1, birthdayYear: 1, channel: 1 },
  { unique: true }
);

// Index for querying pending messages
messageLogSchema.index({ status: 1, scheduledFor: 1 });

module.exports = mongoose.model('MessageLog', messageLogSchema);
