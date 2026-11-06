export const OAUTH_CHANNEL_NAME = 'gts_oauth_channel';
export const OAUTH_STORAGE_KEY = 'gts_oauth_event';

export interface OAuthBroadcastMessage {
  type: 'GTS_OAUTH_SUCCESS' | 'GTS_OAUTH_ERROR' | 'GTS_OAUTH_DONE';
  session?: any;
  user?: any;
  error?: string;
  timestamp?: number;
}

/**
 * Checks whether the current window was opened as an OAuth popup.
 * Uses window.name (which is retained across cross-origin redirects),
 * window.opener, URL query parameters, and sessionStorage flags.
 */
export function isOAuthPopup(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. window.name is explicitly preserved by browsers across cross-origin redirects
  const winName = (window.name || '').toLowerCase();
  if (winName.includes('oauth') || winName.endsWith('_oauth')) {
    return true;
  }

  // 2. window.opener exists and is not self
  if (window.opener && window.opener !== window) {
    return true;
  }

  // 3. Explicit query parameter passed during redirect
  try {
    const search = new URLSearchParams(window.location.search);
    if (search.get('popup') === 'true') {
      return true;
    }
  } catch {}

  // 4. SessionStorage flag set by the opener
  try {
    if (sessionStorage.getItem('gts_oauth_popup_flag') === 'true') {
      return true;
    }
  } catch {}

  return false;
}

/**
 * Broadcasts an OAuth outcome (success or error) to the main opener window
 * using 3 independent channels so it works even if window.opener is severed by COOP.
 */
export function broadcastOAuthMessage(message: OAuthBroadcastMessage): void {
  const payload: OAuthBroadcastMessage = {
    ...message,
    timestamp: Date.now(),
  };

  // 1. window.opener.postMessage (if opener is still available)
  if (typeof window !== 'undefined' && window.opener && window.opener !== window) {
    try {
      window.opener.postMessage(payload, window.location.origin);
    } catch {
      try {
        window.opener.postMessage(payload, '*');
      } catch {}
    }
  }

  // 2. BroadcastChannel (modern inter-window communication on same origin)
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel(OAUTH_CHANNEL_NAME);
      channel.postMessage(payload);
      channel.close();
    } catch (e) {
      console.warn('[OAuth] BroadcastChannel send warning:', e);
    }
  }

  // 3. localStorage storage event (100% universal across all browsers on same origin)
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(OAUTH_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('[OAuth] localStorage send warning:', e);
    }
  }
}

/**
 * Subscribes to OAuth outcome messages across all 3 channels.
 * Returns an unsubscribe cleanup function.
 */
export function listenOAuthMessage(callback: (msg: OAuthBroadcastMessage) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  let bc: BroadcastChannel | null = null;
  if ('BroadcastChannel' in window) {
    try {
      bc = new BroadcastChannel(OAUTH_CHANNEL_NAME);
      bc.onmessage = (ev) => {
        if (ev.data && (ev.data.type === 'GTS_OAUTH_SUCCESS' || ev.data.type === 'GTS_OAUTH_ERROR' || ev.data.type === 'GTS_OAUTH_DONE')) {
          callback(ev.data);
        }
      };
    } catch {}
  }

  const onWindowMessage = (ev: MessageEvent) => {
    if (ev.origin && ev.origin !== window.location.origin && ev.origin !== 'null') {
      return;
    }
    if (ev.data && (ev.data.type === 'GTS_OAUTH_SUCCESS' || ev.data.type === 'GTS_OAUTH_ERROR' || ev.data.type === 'GTS_OAUTH_DONE')) {
      callback(ev.data);
    }
  };
  window.addEventListener('message', onWindowMessage);

  const onStorage = (e: StorageEvent) => {
    if (e.key === OAUTH_STORAGE_KEY && e.newValue) {
      try {
        const data = JSON.parse(e.newValue);
        if (data && (data.type === 'GTS_OAUTH_SUCCESS' || data.type === 'GTS_OAUTH_ERROR' || data.type === 'GTS_OAUTH_DONE')) {
          callback(data);
          try {
            localStorage.removeItem(OAUTH_STORAGE_KEY);
          } catch {}
        }
      } catch {}
    }
  };
  window.addEventListener('storage', onStorage);

  return () => {
    if (bc) {
      try {
        bc.close();
      } catch {}
    }
    window.removeEventListener('message', onWindowMessage);
    window.removeEventListener('storage', onStorage);
  };
}
