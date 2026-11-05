import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isR2Configured, getR2Config, uploadToR2 } from '../src/services/r2Service.js';

describe('Cloudflare R2 Object Storage Service', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_BUCKET_NAME;
    delete process.env.R2_PUBLIC_URL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('detects unconfigured R2 environment variables', () => {
    expect(isR2Configured()).toBe(false);
    expect(getR2Config()).toBeNull();
  });

  it('detects properly configured R2 environment variables', () => {
    process.env.R2_ACCOUNT_ID = 'test_acc_123';
    process.env.R2_ACCESS_KEY_ID = 'test_key_456';
    process.env.R2_SECRET_ACCESS_KEY = 'test_secret_789';
    process.env.R2_BUCKET_NAME = 'gitoscale-media';
    process.env.R2_PUBLIC_URL = 'https://pub-abc.r2.dev';

    expect(isR2Configured()).toBe(true);
    const config = getR2Config();
    expect(config).not.toBeNull();
    expect(config?.accountId).toBe('test_acc_123');
    expect(config?.bucketName).toBe('gitoscale-media');
    expect(config?.publicUrl).toBe('https://pub-abc.r2.dev');
  });

  it('gracefully returns null without throwing when R2 is unconfigured', async () => {
    const dummyBuffer = Buffer.from('fake image content');
    const result = await uploadToR2(dummyBuffer, 'feed/test.png', 'image/png');
    expect(result).toBeNull();
  });
});

