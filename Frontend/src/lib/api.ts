import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://socialconnect.pythonanywhere.com/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(
        `🔑 API Request to ${config.url} with token:`,
        token.substring(0, 20) + "..."
      );
    } else {
      console.log(`❌ API Request to ${config.url} without token`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 errors, not network errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${API_BASE_URL}/auth/token/refresh/`,
            {
              refresh: refreshToken,
            }
          );

          const { access } = response.data;
          localStorage.setItem("access_token", access);

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError: unknown) {
          // Only clear tokens if refresh specifically failed (not network error)
          if (
            refreshError &&
            typeof refreshError === "object" &&
            "response" in refreshError
          ) {
            const axiosError = refreshError as {
              response?: { status?: number };
            };
            if (axiosError.response?.status === 401) {
              localStorage.removeItem("access_token");
              localStorage.removeItem("refresh_token");
            }
          }
        }
      } else {
        // No refresh token, only clear if it's a real auth error
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
  }) => api.post("/auth/register/", data),

  login: (data: { username_or_email: string; password: string }) =>
    api.post("/auth/login/", data),

  logout: (refresh_token: string) =>
    api.post("/auth/logout/", { refresh_token }),

  getCurrentUser: () => api.get("/users/me/"),

  updateProfile: (data: any) => api.put("/users/me/update/", data),
};

// Auth Service - simplified wrapper for easier use
export const authService = {
  async login(username: string, password: string) {
    try {
      console.log("🔄 Attempting login for:", username);
      const response = await authAPI.login({
        username_or_email: username,
        password,
      });

      // Extract tokens from the correct structure
      const { user, tokens } = response.data;
      const { access, refresh } = tokens;

      console.log("✅ Login successful, storing tokens...");
      console.log("Access token:", access?.substring(0, 20) + "...");
      console.log("Refresh token:", refresh?.substring(0, 20) + "...");
      console.log("User:", user);

      // Store tokens
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);

      // Verify tokens were stored
      const storedAccess = localStorage.getItem("access_token");
      const storedRefresh = localStorage.getItem("refresh_token");
      console.log("✅ Tokens stored successfully:", {
        access: !!storedAccess,
        refresh: !!storedRefresh,
      });

      return { user, access, refresh };
    } catch (error) {
      console.error("❌ Login failed:", error);
      throw error;
    }
  },

  async logout() {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always remove tokens
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  },

  async getCurrentUser() {
    try {
      console.log("🔄 Getting current user...");
      const response = await authAPI.getCurrentUser();
      console.log("✅ Current user retrieved:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Failed to get current user:", error);
      throw error;
    }
  },

  async register(userData: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
  }) {
    const response = await authAPI.register(userData);
    return response.data;
  },

  isAuthenticated() {
    return !!localStorage.getItem("access_token");
  },

  getToken() {
    return localStorage.getItem("access_token");
  },

  // Check if user has valid tokens without making API call
  hasValidTokens() {
    const accessToken = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");
    return !!(accessToken && refreshToken);
  },

  // Clear all authentication data
  clearAuth() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },
};

// Posts API
export const postsAPI = {
  create: (data: { content: string; image_data?: string; category?: string }) =>
    api.post("/posts/", data), // create_post endpoint

  getFeed: (page = 1) => api.get("/posts/feed/"), // user_feed endpoint

  getAllPosts: () => api.get("/posts/list/"), // list_posts endpoint

  getAdminPosts: () => api.get("/posts/admin/"), // admin_post_list endpoint

  getPost: (id: number) => api.get(`/posts/${id}/`), // post_detail endpoint

  updatePost: (id: number, data: { content: string; category?: string }) =>
    api.put(`/posts/${id}/update/`, data), // update_post endpoint

  deletePost: (id: number) => api.delete(`/posts/${id}/delete/`), // delete_post endpoint

  likePost: (id: number) => api.post(`/posts/${id}/like/`), // like_post endpoint

  unlikePost: (id: number) => api.delete(`/posts/${id}/unlike/`), // unlike_post endpoint

  getLikeStatus: (id: number) => api.get(`/posts/${id}/like-status/`), // post_like_status endpoint

  getComments: (id: number) => api.get(`/posts/${id}/comments/`), // post_comments endpoint

  addComment: (id: number, data: { content: string }) =>
    api.post(`/posts/${id}/comments/`, data),

  getAllComments: () => api.get("/admin/comments/"), // Get all comments for admin

  deleteComment: (commentId: number) =>
    api.delete(`/admin/comments/${commentId}/delete/`), // Delete comment for admin
};

// Users API
export const usersAPI = {
  getProfile: (id: number) => api.get(`/users/${id}/`),

  updateProfile: (data: Record<string, unknown>) =>
    api.put(`/users/me/update/`, data), // Update current user profile

  uploadAvatar: (avatarData: File | string) => {
    if (avatarData instanceof File) {
      // File upload
      const formData = new FormData();
      formData.append("avatar", avatarData);
      return api.post("/users/me/avatar/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } else {
      // Base64 data
      return api.post("/users/me/avatar/", {
        avatar_data: avatarData,
      });
    }
  },

  search: (query: string) =>
    api.get(`/users/?search=${encodeURIComponent(query)}`),

  getAllUsers: () => api.get("/users/"),

  follow: (id: number) => api.post(`/users/${id}/follow/`),

  unfollow: (id: number) => api.delete(`/users/${id}/unfollow/`),

  getFollowers: (id: number) => api.get(`/users/${id}/followers/`),

  getFollowing: (id: number) => api.get(`/users/${id}/following/`),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: () => api.get("/notifications/"),

  markAsRead: (id: number) => api.post(`/notifications/${id}/read/`),

  markAllAsRead: () => api.post("/notifications/mark-all-read/"),

  getUnreadCount: () => api.get("/notifications/unread-count/"),

  // Admin-specific function to attempt to get all system notifications
  getAllSystemNotifications: async () => {
    try {
      // Try the admin endpoint first (if it exists)
      return await api.get("/admin/notifications/");
    } catch (adminError) {
      console.log(
        "Admin endpoint not available, trying alternative approach..."
      );

      // Fallback: Get regular notifications (limited to current user)
      // In a real implementation, this would need a proper backend endpoint
      const response = await api.get("/notifications/");

      // Add metadata to indicate this is limited data
      if (response.data) {
        response.data._isLimitedData = true;
        response.data._note =
          "Limited to current user notifications. Need admin endpoint for full system view.";
      }

      return response;
    }
  },

  // Admin-only function to send global notifications to all users
  sendGlobalNotification: async (
    message: string,
    notificationType: string = "announcement"
  ) => {
    return await api.post("/notifications/admin/send-global/", {
      message,
      notification_type: notificationType,
    });
  },

  // Admin-only function to mark any notification as read
  adminMarkAsRead: async (id: number) => {
    return await api.post(`/notifications/admin/${id}/read/`);
  },
};

// Upload API
export const uploadAPI = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return api.post("/upload/image/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return api.post("/upload/avatar/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export { api };
export default api;
