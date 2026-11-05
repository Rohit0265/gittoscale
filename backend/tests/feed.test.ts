import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Social Feed API Endpoints & Security', () => {
  const app = createApp();

  const user1Token = `mock_jwt_${Buffer.from(
    JSON.stringify({ id: 'usr_feed_test_1', email: 'alice@gittoscale.tech', name: 'Alice Architect' })
  ).toString('base64')}`;

  const user2Token = `mock_jwt_${Buffer.from(
    JSON.stringify({ id: 'usr_feed_test_2', email: 'bob@gittoscale.tech', name: 'Bob Builder' })
  ).toString('base64')}`;

  it('allows public visitors to read feed posts without auth', async () => {
    const res = await request(app).get('/api/feed/posts');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('rejects post creation without authorization header', async () => {
    const res = await request(app)
      .post('/api/feed/posts')
      .send({ content: 'Unauthenticated post attempt' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('enforces server-side video duration limit (max 2 minutes / 120 seconds)', async () => {
    // Generate valid mp4-like header with client-reported duration of 150 seconds (2.5 mins)
    const validMp4Header = Buffer.alloc(1024);
    validMp4Header.write('ftyp', 4, 'ascii');
    const base64Data = `data:video/mp4;base64,${validMp4Header.toString('base64')}`;

    const res = await request(app)
      .post('/api/feed/upload')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ base64Data, duration: 150 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('VIDEO_TOO_LONG');
    expect(res.body.message).toContain('2 minutes');
  });

  it('rejects invalid or fake media files through binary magic byte validation', async () => {
    const fakeBuffer = Buffer.from('this is just a text file with no image header');
    const base64Data = `data:image/png;base64,${fakeBuffer.toString('base64')}`;

    const res = await request(app)
      .post('/api/feed/upload')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ base64Data });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('UNSUPPORTED_MEDIA_TYPE');
  });

  it('compresses image upload to WebP with dimensions and metadata', async () => {
    // Create a 10x10 valid PNG image buffer using sharp
    const sharp = (await import('sharp')).default;
    const testPngBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 99, g: 102, b: 241, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const base64Data = `data:image/png;base64,${testPngBuffer.toString('base64')}`;

    const res = await request(app)
      .post('/api/feed/upload')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ base64Data });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.mediaType).toBe('image');
    expect(res.body.mediaMetadata).toBeDefined();
    expect(res.body.mediaMetadata.mimeType).toBe('image/webp');
    expect(res.body.mediaMetadata.width).toBe(100);
    expect(res.body.mediaMetadata.height).toBe(100);
  });

  it('supports full lifecycle: create post, like, comment, and strictly enforces IDOR permissions', async () => {
    // 1. User 1 creates post
    const postRes = await request(app)
      .post('/api/feed/posts')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ content: 'Designing an event-driven Kafka architecture for high throughput!' });

    expect(postRes.status).toBe(201);
    expect(postRes.body.success).toBe(true);
    const createdPost = postRes.body.data;
    expect(createdPost.content).toContain('Kafka architecture');
    const postId = createdPost.id;

    // 2. User 2 likes post
    const likeRes = await request(app)
      .post(`/api/feed/posts/${postId}/like`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send();

    expect(likeRes.status).toBe(200);
    expect(likeRes.body.success).toBe(true);
    expect(likeRes.body.liked).toBe(true);
    expect(likeRes.body.likeCount).toBe(1);

    // 3. User 2 adds a comment
    const commentRes = await request(app)
      .post(`/api/feed/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ content: 'Great architecture design! Have you considered consumer group rebalancing?' });

    expect(commentRes.status).toBe(201);
    expect(commentRes.body.success).toBe(true);
    expect(commentRes.body.data.content).toContain('rebalancing');

    // 4. IDOR Protection: User 2 tries to edit User 1's post -> MUST BE 403 FORBIDDEN
    const unauthorizedEditRes = await request(app)
      .put(`/api/feed/posts/${postId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ content: 'Malicious modification by attacker' });

    expect(unauthorizedEditRes.status).toBe(403);
    expect(unauthorizedEditRes.body.error).toBe('FORBIDDEN');

    // 5. IDOR Protection: User 2 tries to delete User 1's post -> MUST BE 403 FORBIDDEN
    const unauthorizedDeleteRes = await request(app)
      .delete(`/api/feed/posts/${postId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(unauthorizedDeleteRes.status).toBe(403);
    expect(unauthorizedDeleteRes.body.error).toBe('FORBIDDEN');

    // 6. Owner User 1 edits their own post -> 200 OK
    const ownerEditRes = await request(app)
      .put(`/api/feed/posts/${postId}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ content: 'Updated: Kafka + Redis streaming architecture.' });

    expect(ownerEditRes.status).toBe(200);
    expect(ownerEditRes.body.data.content).toBe('Updated: Kafka + Redis streaming architecture.');

    // 7. Owner User 1 deletes their own post -> 200 OK
    const ownerDeleteRes = await request(app)
      .delete(`/api/feed/posts/${postId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(ownerDeleteRes.status).toBe(200);
    expect(ownerDeleteRes.body.success).toBe(true);
  });
});
