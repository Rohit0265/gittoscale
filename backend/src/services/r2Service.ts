import crypto from 'crypto';
import https from 'https';

/**
 * Cloudflare R2 Object Storage Service
 *
 * Implements direct S3-compatible SigV4 uploading to Cloudflare R2 with zero external dependencies.
 * If R2 credentials are not configured, methods gracefully return null so the caller can fall back
 * to local disk storage without interrupting application workflows.
 */

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl?: string;
  region?: string;
}

/**
 * Reads Cloudflare R2 configuration from environment variables.
 */
export function getR2Config(): R2Config | null {
  const accountId = (process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_R2_ACCOUNT_ID)?.trim();
  const accessKeyId = (process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID)?.trim();
  const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY)?.trim();
  const bucketName = (process.env.R2_BUCKET_NAME || process.env.CLOUDFLARE_R2_BUCKET_NAME)?.trim();
  const publicUrl = (process.env.R2_PUBLIC_URL || process.env.CLOUDFLARE_R2_PUBLIC_URL)?.trim();
  const region = (process.env.R2_REGION || 'auto').trim();

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return null;
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicUrl,
    region,
  };
}

/**
 * Checks if Cloudflare R2 credentials are fully configured.
 */
export function isR2Configured(): boolean {
  return getR2Config() !== null;
}

/**
 * Computes an AWS SigV4 HMAC-SHA256 signature key.
 */
function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Buffer {
  const kDate = crypto.createHmac('sha256', 'AWS4' + key).update(dateStamp, 'utf8').digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(regionName, 'utf8').digest();
  const kService = crypto.createHmac('sha256', kRegion).update(serviceName, 'utf8').digest();
  return crypto.createHmac('sha256', kService).update('aws4_request', 'utf8').digest();
}

function sha256Hex(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Uploads a file buffer directly to Cloudflare R2 via AWS SigV4 S3 PUT.
 *
 * @param buffer - File content buffer
 * @param key - Target storage path (e.g. "feed/abc12345.png")
 * @param contentType - MIME type (e.g. "image/png", "video/mp4")
 * @returns Public URL of uploaded object, or null if unconfigured/failed.
 */
export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string | null> {
  const config = getR2Config();
  if (!config) {
    console.log('[Cloudflare R2] Not configured. Falling back to local storage.');
    return null;
  }

  const cleanKey = key.replace(/^\/+/, '');
  const host = `${config.accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${config.bucketName}/${cleanKey.split('/').map(encodeURIComponent).join('/')}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const contentSha256 = sha256Hex(buffer);
  const region = config.region || 'auto';

  const canonicalHeaders =
    `content-length:${buffer.length}\n` +
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${contentSha256}\n` +
    `x-amz-date:${amzDate}\n`;

  const signedHeaders = 'content-length;content-type;host;x-amz-content-sha256;x-amz-date';

  const canonicalRequest = [
    'PUT',
    canonicalUri,
    '', // query string
    canonicalHeaders,
    signedHeaders,
    contentSha256,
  ].join('\n');

  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const signingKey = getSignatureKey(config.secretAccessKey, dateStamp, region, 's3');
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign, 'utf8').digest('hex');
  const authorizationHeader = `${algorithm} Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return new Promise((resolve) => {
    const options: https.RequestOptions = {
      hostname: host,
      port: 443,
      path: canonicalUri,
      method: 'PUT',
      family: 4, // Force IPv4 for reliable connection
      timeout: 15000,
      headers: {
        'Host': host,
        'Content-Type': contentType,
        'Content-Length': buffer.length,
        'x-amz-date': amzDate,
        'x-amz-content-sha256': contentSha256,
        'Authorization': authorizationHeader,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          // Construct public URL
          const publicBase = config.publicUrl?.replace(/\/+$/, '');
          const finalUrl = publicBase
            ? `${publicBase}/${cleanKey}`
            : `https://${host}/${config.bucketName}/${cleanKey}`;

          console.log(`[Cloudflare R2] Successfully uploaded ${cleanKey} (${buffer.length} bytes) -> ${finalUrl}`);
          resolve(finalUrl);
        } else {
          console.error(`[Cloudflare R2] Upload failed with status ${res.statusCode}: ${body}`);
          resolve(null);
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      console.error('[Cloudflare R2] Upload request timed out after 15000ms.');
      resolve(null);
    });

    req.on('error', (err) => {
      console.error('[Cloudflare R2] Request error during upload:', err.message);
      resolve(null);
    });

    req.write(buffer);
    req.end();
  });
}
