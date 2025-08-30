import { Post, Comment, Notification, User } from "@/types";

// Storage keys
const STORAGE_KEYS = {
  POSTS: "socialconnect_posts",
  COMMENTS: "socialconnect_comments",
  NOTIFICATIONS: "socialconnect_notifications",
  USER_CREATED_POSTS: "socialconnect_user_posts",
  USER_DATA: "socialconnect_user_data",
  FOLLOWING: "socialconnect_following",
  FOLLOWERS: "socialconnect_followers",
  ALL_USERS: "socialconnect_all_users",
};

// Storage utilities
export const storage = {
  // Helper function to check if we're on the client side
  isClientSide: () => typeof window !== "undefined",

  // Posts
  savePosts: (posts: Post[]) => {
    if (!storage.isClientSide()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    } catch (error) {
      console.error("Failed to save posts to localStorage:", error);
    }
  },

  loadPosts: (): Post[] => {
    if (!storage.isClientSide()) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.POSTS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load posts from localStorage:", error);
    }
    return [];
  },

  // Comments
  saveComments: (comments: { [postId: number]: Comment[] }) => {
    if (!storage.isClientSide()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
    } catch (error) {
      console.error("Failed to save comments to localStorage:", error);
    }
  },

  loadComments: (): { [postId: number]: Comment[] } => {
    if (!storage.isClientSide()) return {};
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COMMENTS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load comments from localStorage:", error);
    }
    return {};
  },

  // Notifications
  saveNotifications: (notifications: Notification[]) => {
    if (!storage.isClientSide()) return;
    try {
      localStorage.setItem(
        STORAGE_KEYS.NOTIFICATIONS,
        JSON.stringify(notifications)
      );
    } catch (error) {
      console.error("Failed to save notifications to localStorage:", error);
    }
  },

  loadNotifications: (): Notification[] => {
    if (!storage.isClientSide()) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load notifications from localStorage:", error);
    }
    return [];
  },

  // User data
  saveUser: (user: User) => {
    if (!storage.isClientSide()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    } catch (error) {
      console.error("Failed to save user data to localStorage:", error);
    }
  },

  loadUser: (): User | null => {
    if (!storage.isClientSide()) return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load user data from localStorage:", error);
    }
    return null;
  },

  // User created posts (to track what the current user has created)
  saveUserCreatedPosts: (postIds: number[]) => {
    if (!storage.isClientSide()) return;
    try {
      localStorage.setItem(
        STORAGE_KEYS.USER_CREATED_POSTS,
        JSON.stringify(postIds)
      );
    } catch (error) {
      console.error("Failed to save user posts to localStorage:", error);
    }
  },

  loadUserCreatedPosts: (): number[] => {
    if (!storage.isClientSide()) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_CREATED_POSTS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load user posts from localStorage:", error);
    }
    return [];
  },

  // Clear all data (useful for logout)
  clearAll: () => {
    if (!storage.isClientSide()) return;
    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
  },

  // Check if we have stored data
  hasStoredData: () => {
    if (!storage.isClientSide()) return false;
    try {
      return !!localStorage.getItem(STORAGE_KEYS.POSTS);
    } catch {
      return false;
    }
  },

  // Following/Followers management
  saveFollowing: (userId: number, followingIds: number[]) => {
    if (!storage.isClientSide()) return;
    try {
      const allFollowing = storage.loadAllFollowing();
      allFollowing[userId] = followingIds;
      localStorage.setItem(
        STORAGE_KEYS.FOLLOWING,
        JSON.stringify(allFollowing)
      );
    } catch (error) {
      console.error("Failed to save following data to localStorage:", error);
    }
  },

  loadFollowing: (userId: number): number[] => {
    if (!storage.isClientSide()) return [];
    try {
      const allFollowing = storage.loadAllFollowing();
      return allFollowing[userId] || [];
    } catch (error) {
      console.error("Failed to load following data from localStorage:", error);
      return [];
    }
  },

  loadAllFollowing: (): { [userId: number]: number[] } => {
    if (!storage.isClientSide()) return {};
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FOLLOWING);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error(
        "Failed to load all following data from localStorage:",
        error
      );
    }
    return {};
  },

  // Follow/Unfollow actions
  followUser: (currentUserId: number, targetUserId: number): boolean => {
    if (!storage.isClientSide()) return false;
    try {
      // Add target user to current user's following list
      const currentFollowing = storage.loadFollowing(currentUserId);
      if (!currentFollowing.includes(targetUserId)) {
        const newFollowing = [...currentFollowing, targetUserId];
        storage.saveFollowing(currentUserId, newFollowing);
      }

      // Add current user to target user's followers list
      const targetFollowers = storage.loadFollowers(targetUserId);
      if (!targetFollowers.includes(currentUserId)) {
        const newFollowers = [...targetFollowers, currentUserId];
        storage.saveFollowers(targetUserId, newFollowers);
      }

      return true;
    } catch (error) {
      console.error("Failed to follow user:", error);
      return false;
    }
  },

  unfollowUser: (currentUserId: number, targetUserId: number): boolean => {
    if (!storage.isClientSide()) return false;
    try {
      // Remove target user from current user's following list
      const currentFollowing = storage.loadFollowing(currentUserId);
      const newFollowing = currentFollowing.filter((id) => id !== targetUserId);
      storage.saveFollowing(currentUserId, newFollowing);

      // Remove current user from target user's followers list
      const targetFollowers = storage.loadFollowers(targetUserId);
      const newFollowers = targetFollowers.filter((id) => id !== currentUserId);
      storage.saveFollowers(targetUserId, newFollowers);

      return true;
    } catch (error) {
      console.error("Failed to unfollow user:", error);
      return false;
    }
  },

  saveFollowers: (userId: number, followerIds: number[]) => {
    if (!storage.isClientSide()) return;
    try {
      const allFollowers = storage.loadAllFollowers();
      allFollowers[userId] = followerIds;
      localStorage.setItem(
        STORAGE_KEYS.FOLLOWERS,
        JSON.stringify(allFollowers)
      );
    } catch (error) {
      console.error("Failed to save followers data to localStorage:", error);
    }
  },

  loadFollowers: (userId: number): number[] => {
    if (!storage.isClientSide()) return [];
    try {
      const allFollowers = storage.loadAllFollowers();
      return allFollowers[userId] || [];
    } catch (error) {
      console.error("Failed to load followers data from localStorage:", error);
      return [];
    }
  },

  loadAllFollowers: (): { [userId: number]: number[] } => {
    if (!storage.isClientSide()) return {};
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FOLLOWERS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error(
        "Failed to load all followers data from localStorage:",
        error
      );
    }
    return {};
  },

  // All users management
  saveAllUsers: (users: User[]) => {
    if (!storage.isClientSide()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(users));
    } catch (error) {
      console.error("Failed to save all users to localStorage:", error);
    }
  },

  loadAllUsers: (): User[] => {
    if (!storage.isClientSide()) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ALL_USERS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load all users from localStorage:", error);
    }
    return [];
  },

  isFollowing: (currentUserId: number, targetUserId: number): boolean => {
    if (!storage.isClientSide()) return false;
    try {
      const following = storage.loadFollowing(currentUserId);
      return following.includes(targetUserId);
    } catch (error) {
      console.error("Failed to check following status:", error);
      return false;
    }
  },
};

// Default mock data for initial load
export const getDefaultMockUsers = (): User[] => [
  {
    id: 2,
    username: "socialconnect",
    email: "hello@socialconnect.com",
    first_name: "Social",
    last_name: "Connect",
    full_name: "Social Connect",
    bio: "Official SocialConnect account",
    avatar_url:
      "https://ui-avatars.com/api/?name=Social+Connect&background=3b82f6&color=fff",
    privacy_setting: "public" as const,
    followers_count: 0,
    following_count: 0,
    posts_count: 50,
    created_at: "2025-08-28T10:00:00Z",
    is_verified: true,
  },
  {
    id: 3,
    username: "coffeelov3r",
    email: "coffee@example.com",
    first_name: "Jane",
    last_name: "Smith",
    full_name: "Jane Smith",
    bio: "Coffee enthusiast & morning person",
    avatar_url:
      "https://ui-avatars.com/api/?name=Jane+Smith&background=10b981&color=fff",
    privacy_setting: "public" as const,
    followers_count: 0,
    following_count: 0,
    posts_count: 75,
    created_at: "2025-08-20T12:00:00Z",
    is_verified: false,
  },
  {
    id: 4,
    username: "bookworm92",
    email: "books@example.com",
    first_name: "Alex",
    last_name: "Johnson",
    full_name: "Alex Johnson",
    bio: "Avid reader & book reviewer",
    avatar_url:
      "https://ui-avatars.com/api/?name=Alex+Johnson&background=f59e0b&color=fff",
    privacy_setting: "public" as const,
    followers_count: 0,
    following_count: 0,
    posts_count: 120,
    created_at: "2025-08-15T09:00:00Z",
    is_verified: false,
  },
  {
    id: 5,
    username: "techie_dev",
    email: "dev@example.com",
    first_name: "Sam",
    last_name: "Wilson",
    full_name: "Sam Wilson",
    bio: "Full-stack developer & tech enthusiast",
    avatar_url:
      "https://ui-avatars.com/api/?name=Sam+Wilson&background=8b5cf6&color=fff",
    privacy_setting: "public" as const,
    followers_count: 0,
    following_count: 0,
    posts_count: 200,
    created_at: "2025-08-10T14:00:00Z",
    is_verified: true,
  },
  {
    id: 6,
    username: "artist_soul",
    email: "art@example.com",
    first_name: "Maya",
    last_name: "Patel",
    full_name: "Maya Patel",
    bio: "Digital artist & creative designer",
    avatar_url:
      "https://ui-avatars.com/api/?name=Maya+Patel&background=ec4899&color=fff",
    privacy_setting: "public" as const,
    followers_count: 0,
    following_count: 0,
    posts_count: 180,
    created_at: "2025-08-05T16:00:00Z",
    is_verified: false,
  },
  {
    id: 7,
    username: "fitness_guru",
    email: "fitness@example.com",
    first_name: "Mike",
    last_name: "Rodriguez",
    full_name: "Mike Rodriguez",
    bio: "Personal trainer & fitness enthusiast",
    avatar_url:
      "https://ui-avatars.com/api/?name=Mike+Rodriguez&background=059669&color=fff",
    privacy_setting: "public" as const,
    followers_count: 0,
    following_count: 0,
    posts_count: 95,
    created_at: "2025-07-28T11:00:00Z",
    is_verified: false,
  },
];

export const getDefaultMockPosts = (): Post[] => [
  {
    id: 1,
    content:
      "Welcome to SocialConnect! This is your first post in the feed. Connect with friends and share your thoughts!",
    author: {
      id: 2,
      username: "socialconnect",
      email: "hello@socialconnect.com",
      first_name: "Social",
      last_name: "Connect",
      full_name: "Social Connect",
      bio: "Official SocialConnect account",
      avatar_url:
        "https://ui-avatars.com/api/?name=Social+Connect&background=3b82f6&color=fff",
      privacy_setting: "public" as const,
      followers_count: 1000,
      following_count: 100,
      posts_count: 50,
      created_at: "2025-08-28T10:00:00Z",
      is_verified: true,
    },
    created_at: "2025-08-29T08:00:00Z",
    updated_at: "2025-08-29T08:00:00Z",
    like_count: 25,
    comment_count: 5,
    is_liked_by_user: false,
    is_active: true,
    category: "announcement" as const,
  },
];

export const getDefaultMockNotifications = (): Notification[] => [
  {
    id: 1,
    sender: {
      id: 3,
      username: "coffeelov3r",
      email: "coffee@example.com",
      first_name: "Jane",
      last_name: "Smith",
      full_name: "Jane Smith",
      bio: "Coffee enthusiast & morning person",
      avatar_url:
        "https://ui-avatars.com/api/?name=Jane+Smith&background=10b981&color=fff",
      privacy_setting: "public" as const,
      followers_count: 150,
      following_count: 200,
      posts_count: 75,
      created_at: "2025-08-20T12:00:00Z",
      is_verified: false,
    },
    notification_type: "like" as const,
    post: 2,
    message: "Jane Smith liked your post",
    is_read: false,
    created_at: "2025-08-29T08:15:00Z",
  },
  {
    id: 2,
    sender: {
      id: 4,
      username: "bookworm92",
      email: "books@example.com",
      first_name: "Alex",
      last_name: "Johnson",
      full_name: "Alex Johnson",
      bio: "Avid reader & book reviewer",
      avatar_url:
        "https://ui-avatars.com/api/?name=Alex+Johnson&background=f59e0b&color=fff",
      privacy_setting: "public" as const,
      followers_count: 300,
      following_count: 250,
      posts_count: 120,
      created_at: "2025-08-15T09:00:00Z",
      is_verified: false,
    },
    notification_type: "follow" as const,
    message: "Alex Johnson started following you",
    is_read: false,
    created_at: "2025-08-29T07:45:00Z",
  },
  {
    id: 3,
    sender: {
      id: 5,
      username: "techie_dev",
      email: "dev@example.com",
      first_name: "Sam",
      last_name: "Wilson",
      full_name: "Sam Wilson",
      bio: "Full-stack developer & tech enthusiast",
      avatar_url:
        "https://ui-avatars.com/api/?name=Sam+Wilson&background=8b5cf6&color=fff",
      privacy_setting: "public" as const,
      followers_count: 450,
      following_count: 320,
      posts_count: 200,
      created_at: "2025-08-10T14:00:00Z",
      is_verified: true,
    },
    notification_type: "comment" as const,
    post: 1,
    message: "Sam Wilson commented on your post",
    is_read: true,
    created_at: "2025-08-29T06:30:00Z",
  },
];
