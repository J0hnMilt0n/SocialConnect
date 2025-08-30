export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  bio: string;
  avatar_url?: string;
  website?: string;
  location?: string;
  privacy_setting: "public" | "private" | "followers_only";
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: string;
  is_verified: boolean;
}

export interface Post {
  id: number;
  content: string;
  author: User;
  image_url?: string;
  category: "general" | "announcement" | "question";
  like_count: number;
  comment_count: number;
  is_active: boolean;
  is_liked_by_user: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  content: string;
  author: User;
  post: number;
  created_at: string;
  is_active: boolean;
}

export interface Follow {
  id: number;
  follower: User;
  following: User;
  created_at: string;
}

export interface Notification {
  id: number;
  actor?: User; // User who performed the action
  sender?: User; // Keep for backward compatibility
  notification_type: "follow" | "like" | "comment" | "mention";
  post?: number;
  target_object_id?: number; // ID of the related object
  content_type?: string; // Type of the related object (post, comment, etc.)
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
}

export interface LoginData {
  username_or_email: string;
  password: string;
}

export interface CreatePostData {
  content: string;
  image_url?: string;
  category?: "general" | "announcement" | "question";
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
