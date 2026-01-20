const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('./logger');

let transporter = null;

// Initialize email transporter
const initEmail = () => {
  if (config.sendgrid.apiKey) {
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: config.sendgrid.apiKey,
      },
    });
    logger.info('Email transporter initialized with SendGrid');
  } else {
    logger.warn('SendGrid API key not configured');
  }
};

// Send email
const sendEmail = async (to, subject, message, html = null) => {
  if (!transporter) {
    throw new Error('Email transporter not initialized');
  }

  try {
    const mailOptions = {
      from: config.sendgrid.fromEmail,
      to: to,
      subject: subject,
      text: message,
    };

    if (html) {
      mailOptions.html = html;
    }

    const result = await transporter.sendMail(mailOptions);

    logger.info(`Email sent to ${to}, MessageId: ${result.messageId}`);
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error);
    throw error;
  }
};

// Create birthday email HTML template
const createBirthdayEmailHTML = (recipientName, message, senderName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Happy Birthday!</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="color: white; margin: 0;">🎂 Happy Birthday! 🎉</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; color: #333;">Dear ${recipientName},</p>
        <p style="font-size: 16px; color: #555; line-height: 1.6;">${message}</p>
        <p style="font-size: 14px; color: #777; margin-top: 30px;">Best wishes,<br>${senderName}</p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>Sent via Birthday Reminder App</p>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  initEmail,
  sendEmail,
  createBirthdayEmailHTML,
};
