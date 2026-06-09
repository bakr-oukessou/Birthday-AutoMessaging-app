require('dotenv').config();

// Fail fast on insecure production configuration
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set to a strong value (32+ characters) in production');
  }
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI must be set in production');
  }
}

module.exports = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,

  // MongoDB
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/birthday-reminder',

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Twilio
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER,
  },

  // SendGrid
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL,
  },

  // Timezone
  defaultTimezone: process.env.DEFAULT_TIMEZONE || 'UTC',

  // Cron
  birthdayCheckCron: process.env.BIRTHDAY_CHECK_CRON || '0 8 * * *',
};
