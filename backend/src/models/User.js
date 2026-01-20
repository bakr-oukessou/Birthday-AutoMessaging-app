const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    settings: {
      defaultSendingTime: {
        type: String,
        default: '08:00',
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'],
      },
      enableAutoSend: {
        type: Boolean,
        default: true,
      },
      preferredChannel: {
        type: String,
        enum: ['sms', 'whatsapp', 'email'],
        default: 'email',
      },
      defaultTemplate: {
        type: String,
        default: 'Happy Birthday, {name}! 🎂 Wishing you a wonderful day filled with joy and happiness!',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data from JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
