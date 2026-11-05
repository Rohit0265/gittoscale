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

  it('allows video uploads exceeding 1 MB when duration is under 2 minutes', async () => {
    // 1.2 MB buffer with valid MP4 header and duration under 2 min (e.g. 30 seconds)
    const validVideoBuffer = Buffer.alloc(1.2 * 1024 * 1024);
    validVideoBuffer.write('ftypisom', 4, 'ascii');
    validVideoBuffer.write('mvhd', 20, 'ascii');
    validVideoBuffer.writeUInt8(0, 24); // version 0
    validVideoBuffer.writeUInt32BE(1000, 36); // timescale
    validVideoBuffer.writeUInt32BE(30000, 40); // 30 seconds duration
    const base64Data = `data:video/mp4;base64,${validVideoBuffer.toString('base64')}`;

    const res = await request(app)
      .post('/api/feed/upload')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ base64Data });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.mediaType).toBe('video');
    expect(res.body.duration).toBe(30);
  });

  it('rejects videos exceeding the 2-minute (120 seconds) maximum duration restriction', async () => {
    // MP4 buffer with duration > 120s (e.g., 180 seconds / 3 minutes)
    const longVideoBuffer = Buffer.alloc(200);
    longVideoBuffer.write('ftypisom', 4, 'ascii');
    longVideoBuffer.write('mvhd', 20, 'ascii');
    longVideoBuffer.writeUInt8(0, 24); // version 0
    longVideoBuffer.writeUInt32BE(1000, 36); // timescale
    longVideoBuffer.writeUInt32BE(180000, 40); // 180 seconds duration
    const base64Data = `data:video/mp4;base64,${longVideoBuffer.toString('base64')}`;

    const res = await request(app)
      .post('/api/feed/upload')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ base64Data });

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

  it('accepts valid image uploads with correct magic bytes under limit', async () => {
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    const base64Data = `data:image/png;base64,${pngHeader.toString('base64')}`;

    const res = await request(app)
      .post('/api/feed/upload')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ base64Data });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.mediaType).toBe('image');
    expect(res.body.url).toMatch(/^\/uploads\/feed\//);
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

  it('enforces YouTube-style 3-tier nested comment limit (depth 0, 1, 2)', async () => {
    // 1. Create a post
    const postRes = await request(app)
      .post('/api/feed/posts')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ content: 'Post for comment thread depth test' });
    const postId = postRes.body.data.id;

    // 2. Add root comment (tier 1 / depth 0)
    const rootRes = await request(app)
      .post(`/api/feed/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ content: 'Root comment level 0' });
    expect(rootRes.status).toBe(201);
    expect(rootRes.body.data.depth).toBe(0);
    const rootCommentId = rootRes.body.data.id;

    // 3. Reply to root comment (tier 2 / depth 1)
    const reply1Res = await request(app)
      .post(`/api/feed/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ content: 'First reply level 1', parentId: rootCommentId });
    expect(reply1Res.status).toBe(201);
    expect(reply1Res.body.data.depth).toBe(1);
    expect(reply1Res.body.data.parent_id).toBe(rootCommentId);
    const reply1Id = reply1Res.body.data.id;

    // 4. Reply to level 1 (tier 3 / depth 2)
    const reply2Res = await request(app)
      .post(`/api/feed/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ content: 'Sub-reply level 2', parentId: reply1Id });
    expect(reply2Res.status).toBe(201);
    expect(reply2Res.body.data.depth).toBe(2);
    const reply2Id = reply2Res.body.data.id;

    // 5. Reply to level 2 -> MUST BE CAPPED AT DEPTH 2 (YouTube conversation limit)
    const reply3Res = await request(app)
      .post(`/api/feed/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ content: '@Alice Sub-reply level 3 capped at depth 2', parentId: reply2Id });
    expect(reply3Res.status).toBe(201);
    expect(reply3Res.body.data.depth).toBe(2);

    // 6. Verify retrieved comments include parent_id and depth
    const listRes = await request(app).get(`/api/feed/posts/${postId}/comments`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(4);
    const depths = listRes.body.data.map((c: any) => c.depth);
    expect(depths).toEqual([0, 1, 2, 2]);
  });

  it('supports retrieving user liked posts via /api/feed/profile/:id/likes', async () => {
    // 1. Create a post
    const postRes = await request(app)
      .post('/api/feed/posts')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ content: 'Post to test liked posts endpoint' });
    const postId = postRes.body.data.id;

    // 2. User 2 likes the post
    await request(app)
      .post(`/api/feed/posts/${postId}/like`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send();

    // 3. User 2 retrieves their liked posts
    const likedRes = await request(app)
      .get('/api/feed/profile/usr_feed_test_2/likes')
      .set('Authorization', `Bearer ${user2Token}`);

    expect(likedRes.status).toBe(200);
    expect(likedRes.body.success).toBe(true);
    expect(Array.isArray(likedRes.body.data)).toBe(true);
    expect(likedRes.body.data.some((p: any) => p.id === postId)).toBe(true);
  });

  it('strictly ensures any video is prioritized at index 0 for first showing in multi-media posts', async () => {
    const mediaItems = [
      { url: 'https://cdn.example.com/image1.webp', type: 'image' },
      { url: 'https://cdn.example.com/video1.mp4', type: 'video' },
      { url: 'https://cdn.example.com/image2.webp', type: 'image' },
      { url: 'https://cdn.example.com/image3.webp', type: 'image' },
      { url: 'https://cdn.example.com/image4.webp', type: 'image' },
      { url: 'https://cdn.example.com/image5.webp', type: 'image' },
    ];

    const postRes = await request(app)
      .post('/api/feed/posts')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        content: 'Post with multiple media items and video',
        mediaItems,
      });

    expect(postRes.status).toBe(201);
    expect(postRes.body.success).toBe(true);
    const post = postRes.body.data;

    // Verify video was sorted to position 0 (first showing)
    expect(post.media_type).toBe('video');
    expect(post.media_url).toBe('https://cdn.example.com/video1.mp4');
    expect(Array.isArray(post.media_items)).toBe(true);
    expect(post.media_items.length).toBe(6);
    expect(post.media_items[0].type).toBe('video');
    expect(post.media_items[0].url).toBe('https://cdn.example.com/video1.mp4');
  });
});
