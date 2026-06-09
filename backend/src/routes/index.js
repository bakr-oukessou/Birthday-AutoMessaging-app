const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./authRoutes');
const contactRoutes = require('./contactRoutes');
const { auth } = require('../middleware');
const { getAllTemplates } = require('../utils/messageTemplates');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(dbConnected ? 200 : 503).json({
    success: dbConnected,
    message: dbConnected ? 'API is running' : 'Database unavailable',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Built-in message templates
router.get('/templates', auth, (req, res) => {
  res.json({
    success: true,
    data: {
      templates: getAllTemplates(),
    },
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/contacts', contactRoutes);

module.exports = router;
