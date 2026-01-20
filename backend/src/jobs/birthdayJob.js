const cron = require('node-cron');
const moment = require('moment-timezone');
const { User, Contact, MessageLog } = require('../models');
const { sendSMS, sendWhatsApp } = require('../utils/twilioService');
const { sendEmail, createBirthdayEmailHTML } = require('../utils/emailService');
const { createBirthdayMessage } = require('../utils/messageTemplates');
const config = require('../config');
const logger = require('../utils/logger');

class BirthdayJobService {
  constructor() {
    this.job = null;
  }

  // Start the birthday check cron job
  start() {
    logger.info(`Starting birthday check cron job with schedule: ${config.birthdayCheckCron}`);

    this.job = cron.schedule(config.birthdayCheckCron, async () => {
      logger.info('Running birthday check job...');
      await this.checkBirthdays();
    });

    logger.info('Birthday check cron job started');
  }

  // Stop the cron job
  stop() {
    if (this.job) {
      this.job.stop();
      logger.info('Birthday check cron job stopped');
    }
  }

  // Main birthday check function
  async checkBirthdays() {
    try {
      // Get all active users with auto-send enabled
      const users = await User.find({
        isActive: true,
        'settings.enableAutoSend': true,
      });

      logger.info(`Checking birthdays for ${users.length} users`);

      for (const user of users) {
        await this.processUserBirthdays(user);
      }

      logger.info('Birthday check completed');
    } catch (error) {
      logger.error('Error in birthday check job:', error);
    }
  }

  // Process birthdays for a single user
  async processUserBirthdays(user) {
    try {
      const userTimezone = user.timezone || config.defaultTimezone;
      const today = moment().tz(userTimezone);
      const currentMonth = today.month();
      const currentDay = today.date();
      const currentYear = today.year();

      // Find contacts with birthdays today
      const contacts = await Contact.find({
        user: user._id,
        isActive: true,
        'notificationSettings.enableNotification': true,
      });

      const birthdayContacts = contacts.filter((contact) => {
        const dob = moment(contact.dateOfBirth);
        return dob.month() === currentMonth && dob.date() === currentDay;
      });

      logger.info(`Found ${birthdayContacts.length} birthdays today for user ${user.email}`);

      for (const contact of birthdayContacts) {
        await this.sendBirthdayMessage(user, contact, currentYear);
      }
    } catch (error) {
      logger.error(`Error processing birthdays for user ${user._id}:`, error);
    }
  }

  // Send birthday message to a contact
  async sendBirthdayMessage(user, contact, year) {
    try {
      // Check for duplicate (already sent this year)
      const channel = this.determineChannel(user, contact);
      const existingLog = await MessageLog.findOne({
        contact: contact._id,
        birthdayYear: year,
        channel: channel,
        status: { $in: ['sent', 'delivered'] },
      });

      if (existingLog) {
        logger.info(`Birthday message already sent to ${contact.name} for ${year}`);
        return;
      }

      // Create the message
      const message = createBirthdayMessage(contact, user);
      const recipient = this.getRecipient(contact, channel);

      if (!recipient) {
        logger.warn(`No valid recipient for ${contact.name} via ${channel}`);
        return;
      }

      // Create message log entry
      const messageLog = await MessageLog.create({
        user: user._id,
        contact: contact._id,
        channel: channel,
        message: message,
        recipient: recipient,
        status: 'pending',
        birthdayYear: year,
      });

      // Send the message
      let result;
      try {
        switch (channel) {
          case 'sms':
            result = await sendSMS(recipient, message);
            break;
          case 'whatsapp':
            result = await sendWhatsApp(recipient, message);
            break;
          case 'email':
            const html = createBirthdayEmailHTML(contact.name, message, user.name);
            result = await sendEmail(recipient, `Happy Birthday, ${contact.name}! 🎂`, message, html);
            break;
        }

        // Update message log
        messageLog.status = 'sent';
        messageLog.externalId = result.messageId;
        messageLog.sentAt = new Date();
        await messageLog.save();

        logger.info(`Birthday message sent to ${contact.name} via ${channel}`);
      } catch (sendError) {
        messageLog.status = 'failed';
        messageLog.errorMessage = sendError.message;
        messageLog.retryCount += 1;
        await messageLog.save();

        logger.error(`Failed to send birthday message to ${contact.name}:`, sendError);
      }
    } catch (error) {
      logger.error(`Error sending birthday message to ${contact.name}:`, error);
    }
  }

  // Determine which channel to use
  determineChannel(user, contact) {
    const contactChannel = contact.notificationSettings?.sendingChannel;

    if (contactChannel && contactChannel !== 'user_default') {
      return contactChannel;
    }

    return user.settings?.preferredChannel || 'email';
  }

  // Get recipient address based on channel
  getRecipient(contact, channel) {
    switch (channel) {
      case 'sms':
      case 'whatsapp':
        return contact.phone;
      case 'email':
        return contact.email;
      default:
        return contact.email || contact.phone;
    }
  }

  // Manual trigger for testing
  async triggerManualCheck() {
    logger.info('Manual birthday check triggered');
    await this.checkBirthdays();
  }
}

module.exports = new BirthdayJobService();
