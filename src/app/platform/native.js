import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Toast } from '@capacitor/toast';
import { App as CapApp } from '@capacitor/app';

export const isNativePlatform = () => Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform();

// Web UI Dialog & Alert Event Bus
const globalAlertEvents = new EventTarget();

export const customAlert = (message) => {
  globalAlertEvents.dispatchEvent(new CustomEvent('show-alert', { detail: { message } }));
};

export const customConfirm = (message, onConfirm) => {
  globalAlertEvents.dispatchEvent(new CustomEvent('show-confirm', { detail: { message, onConfirm } }));
};

export const subscribeGlobalAlerts = (onAlert, onConfirm) => {
  const handleAlert = (e) => onAlert(e.detail);
  const handleConfirm = (e) => onConfirm(e.detail);

  globalAlertEvents.addEventListener('show-alert', handleAlert);
  globalAlertEvents.addEventListener('show-confirm', handleConfirm);

  return () => {
    globalAlertEvents.removeEventListener('show-alert', handleAlert);
    globalAlertEvents.removeEventListener('show-confirm', handleConfirm);
  };
};

export async function showToast(text) {
  if (isNativePlatform()) {
    try {
      await Toast.show({ text, duration: 'short' });
      return;
    } catch (e) {
      console.warn("Capacitor Toast failed:", e);
    }
  }
  customAlert(text);
}

let backButtonHandler = null;
let isBackButtonListenerRegistered = false;

export function registerBackButtonHandler(onBack) {
  backButtonHandler = onBack;

  if (!isBackButtonListenerRegistered) {
    if (isNativePlatform()) {
      isBackButtonListenerRegistered = true;
      try {
        CapApp.addListener('backButton', (state) => {
          if (typeof backButtonHandler === 'function') {
            backButtonHandler(state);
          }
        });
      } catch (e) {
        console.warn("Capacitor backButton listener failed:", e);
      }
    }
  }

  return () => {
    // Keep persistent listener active for native app lifecycle
  };
}

export function exitNativeApp() {
  if (isNativePlatform()) {
    try {
      CapApp.exitApp();
    } catch (e) {
      console.warn("CapApp.exitApp failed:", e);
    }
  }
}

export async function initNativePushNotifications() {
  if (!isNativePlatform()) return;
  try {
    const permStatus = await PushNotifications.requestPermissions();
    if (permStatus.receive === 'granted') {
      await PushNotifications.register();
    }
  } catch (e) {
    console.warn("Push Notification registration failed:", e);
  }
}

export function registerAppStateHandler(onStateChange) {
  if (!isNativePlatform()) return () => {};
  try {
    const listener = CapApp.addListener('appStateChange', (state) => {
      onStateChange(state);
    });
    return () => {
      listener.then(h => h.remove()).catch(() => {});
    };
  } catch (e) {
    return () => {};
  }
}

