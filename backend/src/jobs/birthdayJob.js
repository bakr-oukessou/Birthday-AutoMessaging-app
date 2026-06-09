const cron = require('node-cron');
const moment = require('moment-timezone');
const { User, Contact, MessageLog } = require('../models');
const { sendSMS, sendWhatsApp } = require('../utils/twilioService');
const { sendEmail, createBirthdayEmailHTML } = require('../utils/emailService');
const { createBirthdayMessage } = require('../utils/messageTemplates');
const { isBirthdayOn } = require('../utils/dateUtils');
const config = require('../config');
const logger = require('../utils/logger');

const MAX_SEND_ATTEMPTS = 3;

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

      const birthdayContacts = contacts.filter((contact) =>
        isBirthdayOn(contact.dateOfBirth, currentYear, currentMonth, currentDay)
      );

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
      const channel = this.determineChannel(user, contact);

      // Skip if already sent this year, or retried too many times
      const existingLog = await MessageLog.findOne({
        contact: contact._id,
        birthdayYear: year,
        channel: channel,
      });

      if (existingLog && ['sent', 'delivered'].includes(existingLog.status)) {
        logger.info(`Birthday message already sent to ${contact.name} for ${year}`);
        return;
      }

      if (existingLog && existingLog.retryCount >= MAX_SEND_ATTEMPTS) {
        logger.warn(`Max send attempts reached for ${contact.name} (${year}), skipping`);
        return;
      }

      // Create the message
      const message = createBirthdayMessage(contact, user);
      const recipient = this.getRecipient(contact, channel);

      if (!recipient) {
        logger.warn(`No valid recipient for ${contact.name} via ${channel}`);
        return;
      }

      // Upsert the log so failed attempts can be retried without hitting
      // the unique (contact, birthdayYear, channel) index
      const messageLog = await MessageLog.findOneAndUpdate(
        { contact: contact._id, birthdayYear: year, channel: channel },
        {
          $set: {
            user: user._id,
            message: message,
            recipient: recipient,
            status: 'pending',
          },
          $setOnInsert: { retryCount: 0 },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      // Send the message
      try {
        let result;
        switch (channel) {
          case 'sms':
            result = await sendSMS(recipient, message);
            break;
          case 'whatsapp':
            result = await sendWhatsApp(recipient, message);
            break;
          case 'email': {
            const html = createBirthdayEmailHTML(contact.name, message, user.name);
            result = await sendEmail(recipient, `Happy Birthday, ${contact.name}! 🎂`, message, html);
            break;
          }
          default:
            throw new Error(`Unsupported channel: ${channel}`);
        }

        // Update message log
        messageLog.status = 'sent';
        messageLog.externalId = result.messageId;
        messageLog.sentAt = new Date();
        messageLog.errorMessage = undefined;
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
