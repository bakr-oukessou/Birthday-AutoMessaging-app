import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  async registerForPushNotifications(): Promise<string | null> {
    let token: string | null = null;

    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
    
    await AsyncStorage.setItem('pushToken', token);

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('birthdays', {
        name: 'Birthday Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  }

  async scheduleBirthdayReminder(
    contactId: string,
    contactName: string,
    birthdayDate: Date,
    daysBeforeReminder: number = 1
  ): Promise<string | null> {
    const reminderDate = new Date(birthdayDate);
    reminderDate.setDate(reminderDate.getDate() - daysBeforeReminder);
    reminderDate.setHours(9, 0, 0, 0); // 9 AM reminder

    // Only schedule if the reminder is in the future
    if (reminderDate <= new Date()) {
      return null;
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎂 Birthday Reminder',
        body: `${contactName}'s birthday is ${daysBeforeReminder === 0 ? 'today' : `in ${daysBeforeReminder} day${daysBeforeReminder > 1 ? 's' : ''}`}!`,
        data: { contactId, type: 'birthday_reminder' },
        sound: true,
      },
      trigger: {
        date: reminderDate,
      },
    });

    // Store the notification ID for later cancellation
    await this.storeNotificationId(contactId, identifier);

    return identifier;
  }

  async cancelBirthdayReminder(contactId: string): Promise<void> {
    const storedNotifications = await this.getStoredNotifications();
    const notificationIds = storedNotifications[contactId] || [];

    for (const id of notificationIds) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }

    delete storedNotifications[contactId];
    await AsyncStorage.setItem('scheduledNotifications', JSON.stringify(storedNotifications));
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem('scheduledNotifications');
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  private async storeNotificationId(contactId: string, notificationId: string): Promise<void> {
    const storedNotifications = await this.getStoredNotifications();
    
    if (!storedNotifications[contactId]) {
      storedNotifications[contactId] = [];
    }
    
    storedNotifications[contactId].push(notificationId);
    await AsyncStorage.setItem('scheduledNotifications', JSON.stringify(storedNotifications));
  }

  private async getStoredNotifications(): Promise<Record<string, string[]>> {
    const stored = await AsyncStorage.getItem('scheduledNotifications');
    return stored ? JSON.parse(stored) : {};
  }

  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}

export const notificationService = new NotificationService();
