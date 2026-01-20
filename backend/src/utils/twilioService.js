const config = require('../config');
const logger = require('./logger');

let twilioClient = null;

// Initialize Twilio client
const initTwilio = () => {
  if (config.twilio.accountSid && config.twilio.authToken) {
    const twilio = require('twilio');
    twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
    logger.info('Twilio client initialized');
  } else {
    logger.warn('Twilio credentials not configured');
  }
};

// Send SMS
const sendSMS = async (to, message) => {
  if (!twilioClient) {
    throw new Error('Twilio client not initialized');
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: config.twilio.phoneNumber,
      to: to,
    });

    logger.info(`SMS sent to ${to}, SID: ${result.sid}`);
    return {
      success: true,
      messageId: result.sid,
      status: result.status,
    };
  } catch (error) {
    logger.error(`Failed to send SMS to ${to}:`, error);
    throw error;
  }
};

// Send WhatsApp message
const sendWhatsApp = async (to, message) => {
  if (!twilioClient) {
    throw new Error('Twilio client not initialized');
  }

  try {
    // Format phone number for WhatsApp
    const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    const result = await twilioClient.messages.create({
      body: message,
      from: config.twilio.whatsappNumber,
      to: whatsappTo,
    });

    logger.info(`WhatsApp message sent to ${to}, SID: ${result.sid}`);
    return {
      success: true,
      messageId: result.sid,
      status: result.status,
    };
  } catch (error) {
    logger.error(`Failed to send WhatsApp to ${to}:`, error);
    throw error;
  }
};

module.exports = {
  initTwilio,
  sendSMS,
  sendWhatsApp,
};
