const moment = require('moment-timezone');
const { User, Contact, MessageLog } = require('../models');
const birthdayJobService = require('../jobs/birthdayJob');
const { sendSMS, sendWhatsApp } = require('../utils/twilioService');
const { sendEmail } = require('../utils/emailService');
const {
  isBirthdayOn,
  getCelebratedMonthDay,
  getNextBirthday,
  getTurningAge,
  getDaysUntilNextBirthday,
} = require('../utils/dateUtils');
const logger = require('../utils/logger');

// "Today" as a plain local Date built from the user's timezone, so that
// date-only birthday math matches what the user sees on their calendar
const todayInTimezone = (timezone) => {
  const now = moment.tz(timezone || 'UTC');
  return new Date(now.year(), now.month(), now.date());
};

exports.createContact = async (req, res, next) => {
  try {
    const contactData = {
      ...req.body,
      user: req.userId,
    };

    const contact = await Contact.create(contactData);

    // If contact's birthday is today, send message immediately (if enabled)
    try {
      const user = await User.findById(req.userId);
      const today = moment.tz(user?.timezone || 'UTC');

      const isBirthdayToday = isBirthdayOn(
        contact.dateOfBirth,
        today.year(),
        today.month(),
        today.date()
      );
      const canSend =
        user?.settings?.enableAutoSend &&
        contact.notificationSettings?.enableNotification;

      if (isBirthdayToday && canSend) {
        await birthdayJobService.sendBirthdayMessage(user, contact, today.year());
      }
    } catch (sendError) {
      logger.error('Failed to send immediate birthday message:', sendError);
    }

    logger.info(`Contact created: ${contact.name} for user ${req.userId}`);

    res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      data: {
        contact,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getContacts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      relationship,
      sortBy = 'name',
      sortOrder = 'asc',
      upcomingDays,
    } = req.query;

    const query = { user: req.userId, isActive: true };

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by relationship
    if (relationship) {
      query.relationship = relationship;
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let contacts;
    let total;

    if (upcomingDays) {
      // Filter by days until next birthday before paginating, otherwise
      // matching contacts on later pages would be silently dropped
      const days = parseInt(upcomingDays);
      const today = todayInTimezone(req.user?.timezone);

      const allContacts = await Contact.find(query).sort(sortOptions);
      const matching = allContacts.filter((contact) => {
        const daysUntil = getDaysUntilNextBirthday(contact.dateOfBirth, today);
        return daysUntil >= 0 && daysUntil <= days;
      });

      total = matching.length;
      contacts = matching.slice(skip, skip + limitNum);
    } else {
      contacts = await Contact.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum);
      total = await Contact.countDocuments(query);
    }

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    const currentYear = new Date().getFullYear();
    const lastMessageLog = await MessageLog.findOne({
      contact: contact._id,
      birthdayYear: currentYear,
      status: { $in: ['sent', 'delivered'] },
    })
      .sort({ sentAt: -1, updatedAt: -1 })
      .lean();

    const contactData = contact.toObject();
    contactData.birthdayMessageSent = Boolean(lastMessageLog);
    contactData.lastBirthdayMessage = lastMessageLog
      ? {
          status: lastMessageLog.status,
          sentAt: lastMessageLog.sentAt,
          channel: lastMessageLog.channel,
        }
      : null;

    res.json({
      success: true,
      data: {
        contact: contactData,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.sendContactMessage = async (req, res, next) => {
  try {
    const { message, channel } = req.body;

    const contact = await Contact.findOne({
      _id: req.params.id,
      user: req.userId,
      isActive: true,
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    // Resolve channel: explicit > contact setting > user preference
    let resolvedChannel = channel;
    if (!resolvedChannel) {
      const contactChannel = contact.notificationSettings?.sendingChannel;
      resolvedChannel =
        contactChannel && contactChannel !== 'user_default'
          ? contactChannel
          : req.user?.settings?.preferredChannel || 'email';
    }

    const recipient = resolvedChannel === 'email' ? contact.email : contact.phone;
    if (!recipient) {
      return res.status(400).json({
        success: false,
        message: `Contact does not have ${resolvedChannel === 'email' ? 'an email address' : 'a phone number'}`,
      });
    }

    let result;
    switch (resolvedChannel) {
      case 'sms':
        result = await sendSMS(recipient, message);
        break;
      case 'whatsapp':
        result = await sendWhatsApp(recipient, message);
        break;
      case 'email':
        result = await sendEmail(recipient, `A message from ${req.user?.name || 'a friend'}`, message);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid channel',
        });
    }

    logger.info(`Manual message sent to ${contact.name} via ${resolvedChannel}`);

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        to: recipient,
        channel: resolvedChannel,
        messageId: result.messageId,
        status: result.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateContact = async (req, res, next) => {
  try {
    const allowedUpdates = [
      'name',
      'dateOfBirth',
      'phone',
      'email',
      'customMessage',
      'notificationSettings',
      'tags',
      'notes',
      'relationship',
    ];

    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    logger.info(`Contact updated: ${contact.name}`);

    res.json({
      success: true,
      message: 'Contact updated successfully',
      data: {
        contact,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteContact = async (req, res, next) => {
  try {
    // Soft delete
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { isActive: false },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    logger.info(`Contact deleted: ${contact.name}`);

    res.json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.getUpcomingBirthdays = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const daysLimit = parseInt(days);

    const contacts = await Contact.find({
      user: req.userId,
      isActive: true,
    });

    const today = todayInTimezone(req.user?.timezone);

    const upcomingBirthdays = contacts
      .map((contact) => ({
        contact,
        daysUntil: getDaysUntilNextBirthday(contact.dateOfBirth, today),
        nextBirthday: getNextBirthday(contact.dateOfBirth, today),
        turningAge: getTurningAge(contact.dateOfBirth, today),
      }))
      .filter((item) => item.daysUntil >= 0 && item.daysUntil <= daysLimit)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    res.json({
      success: true,
      data: {
        upcomingBirthdays,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getTodaysBirthdays = async (req, res, next) => {
  try {
    const now = moment.tz(req.user?.timezone || 'UTC');

    const contacts = await Contact.find({
      user: req.userId,
      isActive: true,
    });

    const todaysBirthdays = contacts.filter((contact) =>
      isBirthdayOn(contact.dateOfBirth, now.year(), now.month(), now.date())
    );

    res.json({
      success: true,
      data: {
        birthdays: todaysBirthdays,
        count: todaysBirthdays.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getBirthdayCalendar = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const queryYear = parseInt(year) || new Date().getFullYear();
    const queryMonth = month !== undefined ? parseInt(month) : null;

    const contacts = await Contact.find({
      user: req.userId,
      isActive: true,
    });

    const calendarData = contacts.reduce((acc, contact) => {
      const { month: birthMonth, day: birthDay } = getCelebratedMonthDay(
        contact.dateOfBirth,
        queryYear
      );

      if (queryMonth !== null && birthMonth !== queryMonth) {
        return acc;
      }

      const dateKey = `${queryYear}-${String(birthMonth + 1).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }

      acc[dateKey].push({
        id: contact._id,
        name: contact.name,
        turningAge: queryYear - new Date(contact.dateOfBirth).getUTCFullYear(),
      });

      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        calendar: calendarData,
        year: queryYear,
        month: queryMonth,
      },
    });
  } catch (error) {
    next(error);
  }
};
