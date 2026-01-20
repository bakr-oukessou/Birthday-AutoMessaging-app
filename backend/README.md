# Birthday Reminder API

Node.js/Express backend for the Birthday Reminder application.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure your .env file with credentials

# Start development server
npm run dev
```

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## API Documentation

See the main project README for full API documentation.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3000) | No |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | For SMS/WhatsApp |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | For SMS/WhatsApp |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | For SMS |
| `TWILIO_WHATSAPP_NUMBER` | Twilio WhatsApp number | For WhatsApp |
| `SENDGRID_API_KEY` | SendGrid API key | For Email |
| `SENDGRID_FROM_EMAIL` | Sender email address | For Email |
| `BIRTHDAY_CHECK_CRON` | Cron schedule (default: `0 8 * * *`) | No |

## Folder Structure

```
src/
├── config/         # Configuration and database connection
├── controllers/    # Route handlers
├── jobs/           # Background jobs (birthday checker)
├── middleware/     # Express middleware (auth, validation, etc.)
├── models/         # Mongoose schemas
├── routes/         # API routes
├── utils/          # Helper functions and services
└── server.js       # Application entry point
```
