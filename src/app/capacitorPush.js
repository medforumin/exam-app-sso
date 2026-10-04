import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Toast } from '@capacitor/toast';

/**
 * Initialize Capacitor push + local notifications.
 * @param {(screen: string) => void} setCurrentScreen - callback to navigate when user taps notification.
 */
export async function initPushNotifications(setCurrentScreen) {
  if (Capacitor.getPlatform() === 'web') return;

  try {
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }
    if (permStatus.receive !== 'granted') return;

    await LocalNotifications.requestPermissions();

    await LocalNotifications.createChannel({
      id: 'foreground_notifications',
      name: 'App Alerts',
      importance: 5,
      visibility: 1,
      vibration: true,
    });

    await PushNotifications.register();

    PushNotifications.addListener('registration', (token) => {
      console.log('Push Token:', token.value);
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error: ', error);
    });

    PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      console.log('Push received in foreground:', notification);
      await Toast.show({
        text: notification.title + ': ' + notification.body,
        duration: 'long',
        position: 'top'
      });

      await LocalNotifications.schedule({
        notifications: [{
          title: notification.title || 'New Message',
          body: notification.body || 'Open app to view',
          id: new Date().getTime(),
          schedule: { at: new Date(Date.now() + 100) },
          channelId: 'foreground_notifications',
          actionTypeId: '',
          extra: {
            originalData: notification.data
          }
        }]
      });
    });

    PushNotifications.addListener('pushNotificationActionPerformed', () => {
      console.log('Background Push Tapped');
      setCurrentScreen('app');
    });

    LocalNotifications.addListener('localNotificationActionPerformed', () => {
      console.log('Foreground Local Notification Tapped');
      setCurrentScreen('app');
    });
  } catch (error) {
    console.error('Push Init Error:', error);
  }
}

export function cleanupPushNotifications() {
  if (Capacitor.getPlatform() === 'web') return;
  PushNotifications.removeAllListeners();
  LocalNotifications.removeAllListeners();
}
