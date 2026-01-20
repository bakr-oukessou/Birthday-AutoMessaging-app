const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s-]{10,}$/, 'Please provide a valid phone number'],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    customMessage: {
      type: String,
      maxlength: [500, 'Custom message cannot exceed 500 characters'],
    },
    notificationSettings: {
      enableNotification: {
        type: Boolean,
        default: true,
      },
      sendingChannel: {
        type: String,
        enum: ['sms', 'whatsapp', 'email', 'user_default'],
        default: 'user_default',
      },
      sendingTime: {
        type: String,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'],
      },
      reminderDaysBefore: {
        type: Number,
        default: 1,
        min: 0,
        max: 30,
      },
    },
    tags: [{
      type: String,
      trim: true,
    }],
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    relationship: {
      type: String,
      enum: ['family', 'friend', 'colleague', 'other'],
      default: 'friend',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient birthday queries
contactSchema.index({ user: 1, isActive: 1 });
contactSchema.index({ dateOfBirth: 1 });

// Virtual for calculating next birthday
contactSchema.virtual('nextBirthday').get(function () {
  const today = new Date();
  const dob = new Date(this.dateOfBirth);
  
  let nextBirthday = new Date(
    today.getFullYear(),
    dob.getMonth(),
    dob.getDate()
  );
  
  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }
  
  return nextBirthday;
});

// Virtual for calculating age
contactSchema.virtual('age').get(function () {
  const today = new Date();
  const dob = new Date(this.dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
});

// Enable virtuals in JSON
contactSchema.set('toJSON', { virtuals: true });
contactSchema.set('toObject', { virtuals: true });

// Validation: at least one contact method required
contactSchema.pre('validate', function (next) {
  if (!this.phone && !this.email) {
    this.invalidate('phone', 'At least one contact method (phone or email) is required');
  }
  next();
});

module.exports = mongoose.model('Contact', contactSchema);
