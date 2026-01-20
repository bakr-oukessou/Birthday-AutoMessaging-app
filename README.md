# Birthday Reminder App

A full-stack mobile application for managing birthday reminders with automated message sending capabilities.

## 🎂 Features

- **User Authentication**: Secure JWT-based registration and login
- **Contact Management**: Add, edit, and delete contacts with birthday information
- **Automated Messages**: Send birthday wishes via SMS, WhatsApp, or Email
- **Calendar View**: Visual calendar showing all upcoming birthdays
- **Push Notifications**: Get notified about upcoming birthdays
- **Customizable Templates**: Create personalized birthday message templates
- **Multi-Channel Support**: Choose preferred communication channel per contact
- **Timezone Support**: Correctly handle birthdays across different timezones

## 📁 Project Structure

```
birthday-reminder/
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── jobs/           # Background jobs (cron)
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   └── server.js       # Entry point
│   ├── .env.example        # Environment variables template
│   └── package.json
│
├── mobile/                  # React Native (Expo) app
│   ├── src/
│   │   ├── context/        # React Context providers
│   │   ├── navigation/     # Navigation configuration
│   │   ├── screens/        # App screens
│   │   └── services/       # API services
│   ├── App.tsx             # Entry point
│   ├── app.json            # Expo configuration
│   └── package.json
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Expo CLI (`npm install -g expo-cli`)
- Twilio account (for SMS/WhatsApp)
- SendGrid account (for Email)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure your `.env` file with your credentials:
   ```env
   MONGODB_URI=mongodb://localhost:27017/birthday-reminder
   JWT_SECRET=your-secret-key
   TWILIO_ACCOUNT_SID=your-twilio-sid
   TWILIO_AUTH_TOKEN=your-twilio-token
   SENDGRID_API_KEY=your-sendgrid-key
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

### Mobile App Setup

1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update API URL in `app.json`:
   ```json
   {
     "extra": {
       "apiUrl": "http://YOUR_LOCAL_IP:3000/api"
     }
   }
   ```

4. Start the Expo development server:
   ```bash
   npx expo start
   ```

5. Scan the QR code with Expo Go app (iOS/Android)

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/profile` | Get user profile |
| PUT | `/api/auth/profile` | Update profile |
| GET | `/api/auth/settings` | Get user settings |
| PUT | `/api/auth/settings` | Update settings |
| PUT | `/api/auth/password` | Change password |

### Contacts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contacts` | Get all contacts |
| GET | `/api/contacts/:id` | Get single contact |
| POST | `/api/contacts` | Create contact |
| PUT | `/api/contacts/:id` | Update contact |
| DELETE | `/api/contacts/:id` | Delete contact |
| GET | `/api/contacts/upcoming` | Get upcoming birthdays |
| GET | `/api/contacts/today` | Get today's birthdays |
| GET | `/api/contacts/calendar` | Get calendar data |

## 🗄️ Database Schema

### User Model
```javascript
{
  email: String,
  password: String (hashed),
  name: String,
  timezone: String,
  settings: {
    defaultSendingTime: String,
    enableAutoSend: Boolean,
    preferredChannel: 'sms' | 'whatsapp' | 'email',
    defaultTemplate: String
  }
}
```

### Contact Model
```javascript
{
  user: ObjectId,
  name: String,
  dateOfBirth: Date,
  phone: String,
  email: String,
  customMessage: String,
  notificationSettings: {
    enableNotification: Boolean,
    sendingChannel: String,
    sendingTime: String,
    reminderDaysBefore: Number
  },
  relationship: 'family' | 'friend' | 'colleague' | 'other'
}
```

### MessageLog Model
```javascript
{
  user: ObjectId,
  contact: ObjectId,
  channel: 'sms' | 'whatsapp' | 'email',
  message: String,
  recipient: String,
  status: 'pending' | 'sent' | 'delivered' | 'failed',
  birthdayYear: Number
}
```

## ⏰ Birthday Check Cron Job

The backend runs a daily cron job (default: 8:00 AM) that:

1. Fetches all active users with auto-send enabled
2. Finds contacts with birthdays today (respecting timezones)
3. Checks for duplicate messages (prevents re-sending)
4. Sends messages via configured channel (SMS/WhatsApp/Email)
5. Logs all message attempts in MessageLog

Configure the schedule in `.env`:
```env
BIRTHDAY_CHECK_CRON=0 8 * * *
```

## 📱 Mobile App Screens

1. **Login/Register**: User authentication
2. **Home**: Today's birthdays + upcoming (30 days)
3. **Calendar**: Month view with birthday markers
4. **Contacts**: Searchable contact list with filters
5. **Add Contact**: Form with birthday, contact info, settings
6. **Settings**: Notification preferences, templates, account

## 🔒 Security Features

- JWT-based authentication with secure token handling
- Password hashing with bcrypt (12 rounds)
- Rate limiting on API endpoints
- Input validation with express-validator
- Helmet.js for HTTP security headers
- CORS configuration
- Environment variable protection

## 🌍 Timezone Handling

- Users set their timezone in settings
- Birthday checks use user's local timezone
- Contacts' birthdays are compared against user's current date
- Moment-timezone for reliable timezone conversions

## 📝 Message Templates

Built-in templates:
- **Simple**: "Happy Birthday, {name}! 🎂"
- **Heartfelt**: Longer, emotional message
- **Professional**: Formal business tone
- **Funny**: Light-hearted with humor
- **Family**: Warm, loving message
- **Friend**: Casual, friendly tone

Custom templates support placeholders:
- `{name}` - Contact's name
- `{age}` - Age they're turning
- `{sender}` - Your name

## 🚀 Deployment Recommendations

### Backend (Node.js)
- **Platform**: Railway, Render, Heroku, or AWS
- **Database**: MongoDB Atlas (free tier available)
- **Environment**: Set all production env variables
- **SSL**: Required for production
- **Process Manager**: PM2 for Node.js

### Mobile App
- **iOS**: Expo EAS Build → App Store
- **Android**: Expo EAS Build → Play Store
- **Updates**: Expo OTA updates for quick fixes

### Environment Checklist
- [ ] Strong JWT_SECRET (32+ characters)
- [ ] MongoDB Atlas connection string
- [ ] Twilio credentials (production numbers)
- [ ] SendGrid API key (verified sender)
- [ ] CORS origin set correctly
- [ ] Rate limiting configured

## 📄 License

MIT License - feel free to use for personal or commercial projects.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
