import { isNativePlatform, showToast } from '../platform/native';

export const DEFAULT_UPI_CONFIG = {
  upiId: 'medforum@ybl',
  payeeName: 'MEERA',
  currency: 'INR'
};

/**
 * Builds a standardized generic UPI Payment URL (upi://pay?pa=...&pn=...&am=...&tn=...&cu=INR)
 */
export function buildUpiUrl(params = {}) {
  const pa = params.pa || DEFAULT_UPI_CONFIG.upiId;
  const pn = params.pn || DEFAULT_UPI_CONFIG.payeeName;
  const am = params.am !== undefined ? String(params.am) : '0';
  const tn = params.tn || 'Gold Membership Payment';
  const cu = params.cu || DEFAULT_UPI_CONFIG.currency;

  let url = `upi://pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(pn)}&am=${encodeURIComponent(am)}&tn=${encodeURIComponent(tn)}&cu=${encodeURIComponent(cu)}`;
  if (params.tr) {
    url += `&tr=${encodeURIComponent(params.tr)}`;
  }
  return url;
}

/**
 * Known UPI package map for Android Package Intent resolution
 */
export const UPI_APP_PACKAGES = {
  gpay: {
    name: 'Google Pay',
    package: 'com.google.android.apps.nbu.paisa.user',
    color: 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50',
    accentColor: '#4285F4',
    badge: 'GPay'
  },
  phonepe: {
    name: 'PhonePe',
    package: 'com.phonepe.app',
    color: 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-800',
    accentColor: '#5f259f',
    badge: 'PhonePe'
  },
  paytm: {
    name: 'Paytm',
    package: 'net.one97.paytm',
    color: 'bg-sky-50 text-sky-900 border-sky-200 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-800',
    accentColor: '#00baf2',
    badge: 'Paytm'
  },
  bhim: {
    name: 'BHIM UPI',
    package: 'in.org.npci.upiapp',
    color: 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800',
    accentColor: '#ff7800',
    badge: 'BHIM'
  }
};

/**
 * Builds an app-specific Android Intent URI (intent://pay?...#Intent;scheme=upi;package=...;end)
 */
export function buildAppSpecificIntentUrl(appName, params = {}) {
  const pa = params.pa || DEFAULT_UPI_CONFIG.upiId;
  const pn = params.pn || DEFAULT_UPI_CONFIG.payeeName;
  const am = params.am !== undefined ? String(params.am) : '0';
  const tn = params.tn || 'Gold Membership Payment';
  const cu = params.cu || DEFAULT_UPI_CONFIG.currency;

  const query = `pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(pn)}&am=${encodeURIComponent(am)}&tn=${encodeURIComponent(tn)}&cu=${encodeURIComponent(cu)}`;

  const targetApp = UPI_APP_PACKAGES[appName];
  if (targetApp && targetApp.package) {
    // Android Intent format for specific package targeting
    return `intent://pay?${query}#Intent;scheme=upi;package=${targetApp.package};end`;
  }

  // Standard upi://pay URI
  return `upi://pay?${query}`;
}

/**
 * Launches UPI Payment Intent on Android Native / Mobile Web
 */
export function launchUpiIntent(params = {}, appName = 'generic') {
  const isMobile = isNativePlatform() || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (!isMobile) {
    showToast('Please scan the QR code or use a mobile device to pay via UPI app.');
    return false;
  }

  let targetUrl = '';
  if (appName !== 'generic' && UPI_APP_PACKAGES[appName]) {
    targetUrl = buildAppSpecificIntentUrl(appName, params);
  } else {
    targetUrl = buildUpiUrl(params);
  }

  try {
    // Navigate to UPI URL - Android Intent chooser or target app handles URL
    window.location.href = targetUrl;
    showToast(`Opening ${appName !== 'generic' && UPI_APP_PACKAGES[appName] ? UPI_APP_PACKAGES[appName].name : 'UPI App'}...`);
    return true;
  } catch (err) {
    console.error('Failed to trigger UPI Intent:', err);
    // Fallback to standard generic upi:// link
    try {
      const fallbackUrl = buildUpiUrl(params);
      window.location.href = fallbackUrl;
      showToast('Opening default UPI payment app...');
      return true;
    } catch (fallbackErr) {
      showToast('Could not open payment app automatically. Please copy the UPI ID.');
      return false;
    }
  }
}

/**
 * Generates dynamic QR code image URL for UPI payment link
 */
export function getUpiQrCodeUrl(upiUrl, size = 300) {
  if (!upiUrl) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(upiUrl)}`;
}

/**
 * Copy Payee UPI ID to Clipboard
 */
export async function copyUpiIdToClipboard(upiId = DEFAULT_UPI_CONFIG.upiId) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(upiId);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = upiId;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    showToast(`UPI ID "${upiId}" copied to clipboard!`);
    return true;
  } catch (err) {
    console.error('Failed to copy UPI ID:', err);
    showToast(`UPI ID: ${upiId}`);
    return false;
  }
}
