import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context';
import { AppNavigator } from './src/navigation';
import { notificationService } from './src/services';

export default function App() {
  useEffect(() => {
    // Register for push notifications
    notificationService.registerForPushNotifications();

    // Set up notification listeners
    const notificationListener = notificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    const responseListener = notificationService.addNotificationResponseListener(
      (response) => {
        console.log('Notification response:', response);
        // Handle notification tap - navigate to contact details
        const data = response.notification.request.content.data;
        if (data?.contactId) {
          // Navigation would be handled here
        }
      }
    );

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
