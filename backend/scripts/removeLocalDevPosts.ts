import { getSql } from '../src/services/neon.js';

async function main() {
  const db = getSql();
  console.log('Querying posts in public.feed_posts...');

  const posts = await db`
    SELECT p.id, p.user_id, p.content, pr.full_name, pr.username, p.created_at
    FROM public.feed_posts p
    LEFT JOIN public.profiles pr ON pr.id = p.user_id
    ORDER BY p.created_at DESC;
  `;

  console.log(`Found ${posts.length} posts:`);
  for (const post of posts) {
    console.log(`- [${post.id}] user_id=${post.user_id}, author="${post.full_name}" (@${post.username}), content="${(post.content || '').slice(0, 50)}"`);
  }

  // Delete posts where user_id = 'usr_dev_default' or full_name = 'Local Developer' or 'GitToScale Developer'
  const deleted = await db`
    DELETE FROM public.feed_posts
    WHERE user_id = 'usr_dev_default'
       OR user_id IN (
         SELECT id FROM public.profiles WHERE full_name IN ('Local Developer', 'GitToScale Developer')
       )
    RETURNING id, user_id, content;
  `;

  console.log(`Deleted ${deleted.length} posts belonging to Local Developer.`);

  const remaining = await db`
    SELECT count(*)::int as count FROM public.feed_posts;
  `;
  console.log(`Remaining posts in feed: ${remaining[0].count}`);
}

main().catch(console.error);
