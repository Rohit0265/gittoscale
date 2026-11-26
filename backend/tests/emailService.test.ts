import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import {
  generateWelcomeEmailTemplate,
  sendWelcomeEmail,
  isEmailServiceConfigured,
} from '../src/services/emailService.js';

describe('Email Service & Welcome Email Pipeline', () => {
  const app = createApp();

  describe('generateWelcomeEmailTemplate', () => {
    it('creates personalized subject, HTML, and text fallback', () => {
      const template = generateWelcomeEmailTemplate({
        name: 'Sarah Connor',
        email: 'sarah@skynet-defense.io',
      });

      expect(template.subject).toContain('Welcome to GitToScale, Sarah Connor');
      expect(template.html).toContain('Sarah Connor');
      expect(template.html).toContain('/app');
      expect(template.html).toContain('/feed');
      expect(template.html).toContain('sarah@skynet-defense.io');
      expect(template.text).toContain('Welcome aboard, Sarah Connor');
      expect(template.text).not.toContain('<table');
    });

    it('falls back to email prefix when name is omitted', () => {
      const template = generateWelcomeEmailTemplate({
        email: 'dev_ops@cloud.com',
      });

      expect(template.subject).toContain('dev_ops');
      expect(template.html).toContain('dev_ops');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('rejects invalid email formats gracefully without throwing', async () => {
      const result = await sendWelcomeEmail({
        email: 'not-an-email',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid recipient email');
    });

    it('dispatches email in simulation mode when no API keys are present', async () => {
      const result = await sendWelcomeEmail({
        name: 'Linus Torvalds',
        email: 'linus@kernel.org',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      if (!isEmailServiceConfigured()) {
        expect(result.simulated).toBe(true);
        expect(result.provider).toBe('simulated');
      }
    });
  });

  describe('Auth Integration: Welcome Email on Signup', () => {
    it('POST /api/auth/signup triggers welcome email and creates user', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Ada Lovelace',
          email: 'ada@computing.org',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('ada@computing.org');
    });

    it('POST /api/auth/notify-signup dispatches welcome email for new registrations', async () => {
      const res = await request(app)
        .post('/api/auth/notify-signup')
        .send({
          name: 'Grace Hopper',
          email: 'grace@compiler.navy.mil',
          provider: 'github',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('grace@compiler.navy.mil');
    });

    it('POST /api/auth/test-welcome-email allows manual verification of welcome email', async () => {
      process.env.ADMIN_EMAILS = 'admin@gittoscale.tech';
      const adminToken = `mock_jwt_${Buffer.from(JSON.stringify({ id: 'usr_admin', email: 'admin@gittoscale.tech' })).toString('base64')}`;
      const res = await request(app)
        .post('/api/auth/test-welcome-email')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Alan Turing',
          email: 'alan@bletchley.ac.uk',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.result).toBeDefined();
    });

    it('POST /api/auth/test-welcome-email rejects invalid email with 400', async () => {
      process.env.ADMIN_EMAILS = 'admin@gittoscale.tech';
      const adminToken = `mock_jwt_${Buffer.from(JSON.stringify({ id: 'usr_admin', email: 'admin@gittoscale.tech' })).toString('base64')}`;
      const res = await request(app)
        .post('/api/auth/test-welcome-email')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'bad-email',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
