import { URL } from 'node:url';

/**
 * List of officially recognized, trusted LLM and AI service domains.
 */
const TRUSTED_LLM_HOSTS = new Set([
  'api.openai.com',
  'api.groq.com',
  'api.inceptionlabs.ai',
  'generativelanguage.googleapis.com',
  'api.anthropic.com',
  'api.mistral.ai',
  'api.together.xyz',
  'api.cohere.ai',
]);

/**
 * Checks whether an IPv4 address belongs to a private, loopback, or link-local range.
 */
function isPrivateOrReservedIp(ip: string): boolean {
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return false;
  }

  // 127.0.0.0/8 (Loopback)
  if (parts[0] === 127) return true;
  // 10.0.0.0/8 (Private RFC1918)
  if (parts[0] === 10) return true;
  // 172.16.0.0/12 (Private RFC1918)
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  // 192.168.0.0/16 (Private RFC1918)
  if (parts[0] === 192 && parts[1] === 168) return true;
  // 169.254.0.0/16 (Link-local / Cloud metadata: AWS, GCP, Azure, Fly)
  if (parts[0] === 169 && parts[1] === 254) return true;
  // 0.0.0.0/8 (Current network)
  if (parts[0] === 0) return true;

  return false;
}

/**
 * Validates whether an LLM base URL is safe from SSRF attacks.
 * Rejects private IPs, loopback hosts, link-local metadata endpoints, and non-HTTP protocols.
 */
export function validateSafeLlmBaseUrl(urlInput?: string): { safe: boolean; url?: string; error?: string } {
  if (!urlInput || typeof urlInput !== 'string') {
    return { safe: true };
  }

  const trimmed = urlInput.trim();
  if (!trimmed) {
    return { safe: true };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { safe: false, error: 'Invalid URL format for LLM endpoint.' };
  }

  const isTestOrDev = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';

  // Enforce HTTPS in production
  if (parsed.protocol !== 'https:' && (!isTestOrDev || parsed.protocol !== 'http:')) {
    return { safe: false, error: 'LLM endpoint must use HTTPS protocol.' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost and standard loopback identifiers
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '0.0.0.0') {
    if (!isTestOrDev) {
      return { safe: false, error: 'Localhost and loopback addresses are blocked for LLM endpoints in production.' };
    }
  }

  // Block AWS/GCP/Azure/Fly metadata and private subnets
  if (isPrivateOrReservedIp(hostname)) {
    return { safe: false, error: 'Private and link-local IP addresses (including cloud metadata) are strictly blocked.' };
  }

  // Check against trusted hostnames or custom allowed hosts from environment
  const customAllowed = (process.env.ALLOWED_LLM_HOSTS || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);

  const isTrusted =
    TRUSTED_LLM_HOSTS.has(hostname) ||
    customAllowed.includes(hostname) ||
    customAllowed.some((allowed) => hostname.endsWith(`.${allowed}`));

  if (!isTrusted && !isTestOrDev) {
    // If not in standard whitelist and not dev/test, require domain to be a valid public FQDN with dot
    if (!hostname.includes('.') || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
      return { safe: false, error: `Host "${hostname}" is not permitted for LLM proxying.` };
    }
  }

  return { safe: true, url: trimmed };
}
