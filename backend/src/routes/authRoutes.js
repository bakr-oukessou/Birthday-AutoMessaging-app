const express = require('express');
const { body } = require('express-validator');
const { authController } = require('../controllers');
const { auth, validate, authLimiter } = require('../middleware');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('timezone').optional().isString(),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

const updateProfileValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('timezone').optional().isString(),
];

const updateSettingsValidation = [
  body('defaultSendingTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format (HH:MM)'),
  body('enableAutoSend').optional().isBoolean(),
  body('preferredChannel')
    .optional()
    .isIn(['sms', 'whatsapp', 'email'])
    .withMessage('Invalid channel'),
  body('defaultTemplate').optional().isString().isLength({ max: 500 }),
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
];

// Public routes
router.post('/register', authLimiter, registerValidation, validate, authController.register);
router.post('/login', authLimiter, loginValidation, validate, authController.login);

// Protected routes
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, updateProfileValidation, validate, authController.updateProfile);
router.get('/settings', auth, authController.getSettings);
router.put('/settings', auth, updateSettingsValidation, validate, authController.updateSettings);
router.put('/password', auth, changePasswordValidation, validate, authController.changePassword);

module.exports = router;
