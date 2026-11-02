import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.info(
    '[GitToScale] Supabase credentials not set in environment. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env to enable live authentication and PostgreSQL persistence.'
  );
}

const CHUNK_SIZE = 2800;

export function getSharedCookieDomain(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const host = window.location.hostname.toLowerCase();
  if (host.includes('gittoscale.tech')) {
    return '.gittoscale.tech';
  }
  return undefined;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp('(?:^|;\\s*)' + encodeURIComponent(name).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '=([^;]*)')
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, domain?: string, days = 365): void {
  if (typeof document === 'undefined') return;
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${days * 86400}; SameSite=Lax`;
  if (domain) {
    cookie += `; domain=${domain}`;
  }
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    cookie += '; Secure';
  }
  document.cookie = cookie;
}

function deleteCookie(name: string, domain?: string): void {
  if (typeof document === 'undefined') return;
  let cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; SameSite=Lax`;
  if (domain) {
    cookie += `; domain=${domain}`;
  }
  document.cookie = cookie;
}

function setChunkedCookie(name: string, value: string, domain?: string, days = 365): void {
  if (typeof document === 'undefined') return;
  clearChunkedCookie(name, domain);

  if (value.length <= CHUNK_SIZE) {
    setCookie(name, value, domain, days);
    return;
  }

  const totalChunks = Math.ceil(value.length / CHUNK_SIZE);
  setCookie(`${name}_count`, String(totalChunks), domain, days);
  for (let i = 0; i < totalChunks; i++) {
    const chunk = value.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    setCookie(`${name}_${i}`, chunk, domain, days);
  }
}

function getChunkedCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const countStr = getCookie(`${name}_count`);
  if (countStr) {
    const count = parseInt(countStr, 10);
    if (!isNaN(count) && count > 0) {
      let full = '';
      for (let i = 0; i < count; i++) {
        const chunk = getCookie(`${name}_${i}`);
        if (chunk === null) return null;
        full += chunk;
      }
      return full;
    }
  }
  return getCookie(name);
}

function clearChunkedCookie(name: string, domain?: string): void {
  deleteCookie(name, domain);
  const countStr = getCookie(`${name}_count`);
  if (countStr) {
    const count = parseInt(countStr, 10);
    if (!isNaN(count) && count > 0) {
      for (let i = 0; i < count; i++) {
        deleteCookie(`${name}_${i}`, domain);
      }
    }
  }
  deleteCookie(`${name}_count`, domain);
}

/**
 * Cross-domain storage adapter that mirrors tokens to both localStorage
 * and shared cookies across subdomains (e.g. .gittoscale.tech).
 */
export const crossDomainStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const localVal = window.localStorage.getItem(key);
      if (localVal) return localVal;
    } catch {}

    try {
      const cookieVal = getChunkedCookie(key);
      if (cookieVal) {
        try {
          window.localStorage.setItem(key, cookieVal);
        } catch {}
        return cookieVal;
      }
    } catch {}

    return null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch {}

    try {
      const domain = getSharedCookieDomain();
      setChunkedCookie(key, value, domain);
    } catch {}
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch {}

    try {
      const domain = getSharedCookieDomain();
      clearChunkedCookie(key, domain);
    } catch {}
  },
};

// Supabase client configured with cross-subdomain storage
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: crossDomainStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
