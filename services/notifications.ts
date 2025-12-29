import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

let Notifications: any = null;
let Device: any = null;

// Try to load native modules (won't work in Expo Go)
try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
  
  // Configure how notifications appear when app is in foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (e) {
  console.log('Notifications not available (requires dev build)');
}

export async function registerForPushNotifications(customerId: string): Promise<string | null> {
  if (!Notifications || !Device) {
    console.log('Notifications not available');
    return null;
  }

  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Save token to customer document
    if (customerId && token) {
      await updateDoc(doc(db, 'customers', customerId), {
        pushToken: token,
      });
    }

    // Android needs a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Order Updates',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
    }

    return token;
  } catch (e) {
    console.log('Failed to register for notifications:', e);
    return null;
  }
}

// Send local notification
export async function sendLocalNotification(title: string, body: string) {
  if (!Notifications) {
    console.log('Notifications not available');
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
      },
      trigger: null,
    });
  } catch (e) {
    console.log('Failed to send notification:', e);
  }
}
