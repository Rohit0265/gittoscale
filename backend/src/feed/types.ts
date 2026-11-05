export interface FeedPost {
  id: string;
  user_id: string;
  content: string;
  media_url?: string | null;
  media_type?: 'image' | 'video' | null;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    full_name: string;
    username: string;
    avatar_url?: string | null;
  };
  like_count: number;
  comment_count: number;
  has_liked?: boolean;
}

export interface FeedComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    full_name: string;
    username: string;
    avatar_url?: string | null;
  };
}

export interface UserProfileFeed {
  id: string;
  full_name: string;
  username: string;
  email: string;
  avatar_url?: string | null;
  bio?: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_following?: boolean;
  is_owner?: boolean;
}

