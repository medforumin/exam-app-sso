import { WP_SITE_URL, ENABLE_WP_REST_SYNC } from '../config';
import { isNativePlatform } from '../platform/native';
import { auth } from '../context/AppContext';

/**
 * Helper function to safely launch external URLs on Native Android or Web
 * @param {string} url 
 */
function launchExternalUrl(url) {
  console.log('[WP SSO] Launching external browser URL:', url);
  if (isNativePlatform()) {
    window.open(url, '_system');
  } else {
    window.open(url, '_blank');
  }
}

/**
 * Backup Token-Based REST API User Sync Handler
 * 
 * Attempts to sync the current Firebase User to WordPress with the Subscriber role
 * using a cryptographically verified Firebase ID Token.
 */
export async function syncUserToWordPressREST(user, forceSync = false) {
  if (!ENABLE_WP_REST_SYNC || !user || !user.uid) {
    return { skipped: true, reason: 'Feature disabled or invalid user' };
  }

  const cacheKey = `wp_synced_${user.uid}`;
  const isAlreadySynced = localStorage.getItem(cacheKey) === 'true';

  if (isAlreadySynced && !forceSync) {
    return { skipped: true, reason: 'Already synced in local session' };
  }

  try {
    const idToken = await user.getIdToken(/* forceRefresh */ false);
    if (!idToken) {
      console.warn('[WPSync] Failed to obtain Firebase ID token.');
      return { success: false, error: 'No ID Token' };
    }

    const endpoint = `${WP_SITE_URL}/wp-json/pyq/v1/sync-user`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || ''
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('[WPSync] WordPress subscriber account confirmed/created:', data);
      localStorage.setItem(cacheKey, 'true');
      return { success: true, data };
    } else {
      console.warn('[WPSync] WordPress sync response error:', data);
      return { success: false, error: data.message || 'REST API Error' };
    }
  } catch (error) {
    console.error('[WPSync] Failed to sync user to WordPress (Network/Server):', error);
    return { success: false, error: error.message };
  }
}

let isSSOInProgress = false;
let ssoLoadingListeners = [];

export function subscribeSSOLoading(listener) {
  ssoLoadingListeners.push(listener);
  return () => {
    ssoLoadingListeners = ssoLoadingListeners.filter(l => l !== listener);
  };
}

function setSSOLoadingState(loading) {
  ssoLoadingListeners.forEach(l => l(loading));
}

/**
 * Single Sign-On (SSO) Auto-Login Link Generator & Launcher
 * 
 * Intercepts user requests to open dnbpedia.in links and generates a short-lived
 * single-use token (valid 180s) so Android app users opening Chrome/Firefox
 * arrive fully logged into WordPress automatically.
 * 
 * @param {string} targetPath - Relative path or full URL on dnbpedia.in (e.g. '/pyq/memberships')
 */
export async function openWordPressWithAutoLogin(targetPath = '/') {
  if (isSSOInProgress) {
    console.log('[WP SSO] SSO generation already in progress, ignoring duplicate click.');
    return;
  }

  const currentUser = auth?.currentUser;

  let cleanPath = targetPath;
  try {
    if (targetPath.startsWith('http://') || targetPath.startsWith('https://')) {
      const urlObj = new URL(targetPath);
      cleanPath = urlObj.pathname + urlObj.search;
    }
  } catch {
    // Ignore invalid URL format and use targetPath as is
  }

  const fullFallbackUrl = `${WP_SITE_URL}${cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath}`;

  console.log('[WP SSO] currentUser object:', currentUser ? currentUser.email : 'No user logged in (Guest)');

  if (!currentUser) {
    console.log('[WP SSO] User is guest or auth state not ready. Opening direct URL:', fullFallbackUrl);
    launchExternalUrl(fullFallbackUrl);
    return;
  }

  isSSOInProgress = true;
  setSSOLoadingState(true);

  try {
    console.log('[WP SSO] Fetching fresh ID Token for', currentUser.email);
    const idToken = await currentUser.getIdToken(/* forceRefresh */ false);
    if (!idToken) {
      throw new Error('No Firebase ID Token available for SSO');
    }

    const endpoint = `${WP_SITE_URL}/wp-json/pyq/v1/get-login-url`;
    console.log('[WP SSO] Fetching 1-time login URL from:', endpoint);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        redirect_path: cleanPath,
        displayName: currentUser.displayName || ''
      })
    });

    const responseText = await response.text();
    console.log(`[WP SSO] Server response status ${response.status}:`, responseText);

    let data = null;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.warn('[WP SSO] Non-JSON response from server, opening fallback URL');
      launchExternalUrl(fullFallbackUrl);
      return;
    }

    if (response.ok && data.login_url) {
      console.log('[WP SSO] Successfully generated 1-time login URL:', data.login_url);
      launchExternalUrl(data.login_url);
    } else {
      console.warn('[WP SSO] Server returned error or fallback:', data);
      launchExternalUrl(fullFallbackUrl);
    }
  } catch (error) {
    console.error('[WP SSO] Error generating single-use SSO link:', error);
    launchExternalUrl(fullFallbackUrl);
  } finally {
    isSSOInProgress = false;
    setSSOLoadingState(false);
  }
}
