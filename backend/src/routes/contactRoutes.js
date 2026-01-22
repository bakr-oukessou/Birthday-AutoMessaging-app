const express = require('express');
const { body, param, query } = require('express-validator');
const { contactController } = require('../controllers');
const { auth, validate } = require('../middleware');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Validation rules
const createContactValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('phone')
    .optional()
    .matches(/^\+?[\d\s-]{10,}$/)
    .withMessage('Invalid phone number'),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('customMessage').optional().isLength({ max: 500 }),
  body('relationship')
    .optional()
    .isIn(['family', 'friend', 'colleague', 'other']),
  body('notificationSettings.enableNotification').optional().isBoolean(),
  body('notificationSettings.sendingChannel')
    .optional()
    .isIn(['sms', 'whatsapp', 'email', 'user_default']),
  body('notificationSettings.sendingTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('notificationSettings.reminderDaysBefore')
    .optional()
    .isInt({ min: 0, max: 30 }),
];

const updateContactValidation = [
  param('id').isMongoId().withMessage('Invalid contact ID'),
  ...createContactValidation.map((validation) => validation.optional()),
];

const sendMessageValidation = [
  param('id').isMongoId().withMessage('Invalid contact ID'),
  body('message').trim().notEmpty().isLength({ max: 500 }).withMessage('Message is required'),
];

const getContactsValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('relationship').optional().isIn(['family', 'friend', 'colleague', 'other']),
  query('sortBy').optional().isIn(['name', 'dateOfBirth', 'createdAt']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('upcomingDays').optional().isInt({ min: 1, max: 365 }),
];

// Routes
router.get('/', getContactsValidation, validate, contactController.getContacts);
router.get('/upcoming', contactController.getUpcomingBirthdays);
router.get('/today', contactController.getTodaysBirthdays);
router.get('/calendar', contactController.getBirthdayCalendar);
router.get('/:id', param('id').isMongoId(), validate, contactController.getContact);
router.post('/:id/message', sendMessageValidation, validate, contactController.sendContactMessage);
router.post('/', createContactValidation, validate, contactController.createContact);
router.put('/:id', updateContactValidation, validate, contactController.updateContact);
router.delete('/:id', param('id').isMongoId(), validate, contactController.deleteContact);

module.exports = router;
