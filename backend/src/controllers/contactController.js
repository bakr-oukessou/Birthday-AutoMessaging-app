const { Contact } = require('../models');
const logger = require('../utils/logger');

exports.createContact = async (req, res, next) => {
  try {
    const contactData = {
      ...req.body,
      user: req.userId,
    };

    const contact = await Contact.create(contactData);

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

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let contacts = await Contact.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Filter by upcoming birthdays
    if (upcomingDays) {
      const days = parseInt(upcomingDays);
      const today = new Date();
      
      contacts = contacts.filter((contact) => {
        const nextBirthday = contact.nextBirthday;
        const diffTime = nextBirthday - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= days;
      });
    }

    const total = await Contact.countDocuments(query);

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
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

    res.json({
      success: true,
      data: {
        contact,
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingBirthdays = contacts
      .map((contact) => {
        const nextBirthday = contact.nextBirthday;
        const diffTime = nextBirthday - today;
        const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          contact,
          daysUntil,
          nextBirthday,
          turningAge: contact.age + 1,
        };
      })
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
    const today = new Date();
    const month = today.getMonth();
    const day = today.getDate();

    const contacts = await Contact.find({
      user: req.userId,
      isActive: true,
    });

    const todaysBirthdays = contacts.filter((contact) => {
      const dob = new Date(contact.dateOfBirth);
      return dob.getMonth() === month && dob.getDate() === day;
    });

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
      const dob = new Date(contact.dateOfBirth);
      const birthMonth = dob.getMonth();
      const birthDay = dob.getDate();

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
        turningAge: queryYear - dob.getFullYear(),
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
