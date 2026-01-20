# Birthday Reminder Mobile App

React Native (Expo) mobile application for the Birthday Reminder.

## Quick Start

```bash
# Install dependencies
npm install

# Start Expo development server
npx expo start
```

## Running on Device

1. Install Expo Go on your phone
2. Scan the QR code from terminal
3. App will load on your device

## Available Scripts

- `npm start` / `npx expo start` - Start Expo dev server
- `npm run android` - Start on Android
- `npm run ios` - Start on iOS
- `npm run web` - Start web version

## Configuration

Update `app.json` to set your API URL:

```json
{
  "extra": {
    "apiUrl": "http://YOUR_IP:3000/api"
  }
}
```

**Note**: Use your machine's local IP (not localhost) for physical devices.

## Folder Structure

```
src/
├── context/        # React Context providers (Auth)
├── navigation/     # React Navigation setup
├── screens/        # App screens
│   ├── LoginScreen.tsx
│   ├── RegisterScreen.tsx
│   ├── HomeScreen.tsx
│   ├── CalendarScreen.tsx
│   ├── ContactsScreen.tsx
│   ├── AddContactScreen.tsx
│   └── SettingsScreen.tsx
└── services/       # API services
    ├── api.ts
    ├── authService.ts
    ├── contactService.ts
    └── notificationService.ts
```

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## Features

- 🔐 JWT Authentication
- 📱 Push Notifications
- 📅 Calendar View
- 👥 Contact Management
- ⚙️ Customizable Settings
- 🎨 Clean, Modern UI
