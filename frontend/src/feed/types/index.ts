export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  r2Key?: string | null;
}

export interface FeedAuthor {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string | null;
  is_following?: boolean;
}

export interface FeedPost {
  id: string;
  user_id: string;
  content: string;
  media_url?: string | null;
  media_type?: 'image' | 'video' | null;
  media_metadata?: any | null;
  media_items?: MediaItem[];
  created_at: string;
  updated_at: string;
  author: FeedAuthor;
  like_count: number;
  comment_count: number;
  views_count?: number;
  has_liked?: boolean;
  has_disliked?: boolean;
  has_bookmarked?: boolean;
}

export interface FeedComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id?: string | null;
  depth?: number;
  created_at: string;
  updated_at: string;
  author: FeedAuthor;
}

export interface UserProfileFeed {
  id: string;
  full_name: string;
  username: string;
  email: string;
  avatar_url?: string | null;
  banner_url?: string | null;
  bio?: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_following?: boolean;
  is_owner?: boolean;
  is_admin?: boolean;
  role?: string;
  is_suspended?: boolean;
  warning_count?: number;
  warnings?: Array<{ id: string; reason: string; created_at: string; issued_by?: string }>;
  suspended_at?: string | null;
  suspension_reason?: string | null;
}

