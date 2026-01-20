const express = require('express');
const authRoutes = require('./authRoutes');
const contactRoutes = require('./contactRoutes');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/contacts', contactRoutes);

module.exports = router;
