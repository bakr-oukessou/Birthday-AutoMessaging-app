# Birthday Reminder App - Development Instructions

## Project Overview
Full-stack Birthday Reminder mobile application with React Native frontend and Node.js/Express backend.

## Project Structure
```
/backend          - Node.js/Express API server
/mobile           - React Native (Expo) mobile app
```

## Backend Stack
- Node.js with Express
- MongoDB with Mongoose
- JWT Authentication
- node-cron for scheduled jobs
- Twilio (SMS/WhatsApp) & SendGrid (Email)

## Frontend Stack
- React Native with Expo
- React Navigation
- AsyncStorage for local data
- Expo Notifications

## Development Commands

### Backend
```bash
cd backend
npm install
npm run dev
```

### Mobile
```bash
cd mobile
npm install
npx expo start
```

## Environment Variables
See `.env.example` files in each directory for required configuration.

## API Endpoints
- POST /api/auth/register - User registration
- POST /api/auth/login - User login
- GET /api/contacts - Get all contacts
- POST /api/contacts - Create contact
- PUT /api/contacts/:id - Update contact
- DELETE /api/contacts/:id - Delete contact
- GET /api/settings - Get user settings
- PUT /api/settings - Update settings
