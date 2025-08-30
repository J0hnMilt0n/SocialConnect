"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { authService, postsAPI, usersAPI, notificationsAPI } from "@/lib/api";
import { User, Post, Comment, Notification } from "@/types";
import {
  storage,
  getDefaultMockPosts,
  getDefaultMockNotifications,
  getDefaultMockUsers,
} from "@/lib/storage";

export default function Home() {
  console.log("🚀 PAGE COMPONENT LOADED - NEW VERSION!");
  const [user, setUser] = useState<User | null>(null);
  const lastProcessedUserIdRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [currentView, setCurrentView] = useState<
    | "dashboard"
    | "feed"
    | "create"
    | "social"
    | "profile"
    | "notifications"
    | "followers"
    | "following"
  >("dashboard");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [comments, setComments] = useState<{ [postId: number]: Comment[] }>({});
  const [newComment, setNewComment] = useState<{ [postId: number]: string }>(
    {}
  );
  const [searchUsers, setSearchUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Image upload states
  const [postImageUrl, setPostImageUrl] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);

  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileEditData, setProfileEditData] = useState({
    first_name: "",
    last_name: "",
    bio: "",
    website: "",
    location: "",
  });
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null
  );
  const [editingUser, setEditingUser] = useState({
    full_name: "",
    bio: "",
    location: "",
    website: "",
    privacy_setting: "public" as "public" | "private" | "followers_only",
  });

  // View Profile state
  const [isViewingProfile, setIsViewingProfile] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [viewingUserPosts, setViewingUserPosts] = useState<Post[]>([]);

  // Followers/Following state
  const [following, setFollowing] = useState<number[]>([]);
  const [followers, setFollowers] = useState<number[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Dialog state
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    type: "" as "error" | "confirm" | "info",
    title: "",
    message: "",
    onConfirm: null as (() => void) | null,
    onCancel: null as (() => void) | null,
  });

  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
    first_name: "",
    last_name: "",
  });

  // Dialog helper functions
  const showErrorDialog = (title: string, message: string) => {
    setDialogState({
      isOpen: true,
      type: "error",
      title,
      message,
      onConfirm: () => setDialogState((prev) => ({ ...prev, isOpen: false })),
      onCancel: null,
    });
  };

  const showConfirmDialog = (
    title: string,
    message: string,
    onConfirm: () => void
  ) => {
    setDialogState({
      isOpen: true,
      type: "confirm",
      title,
      message,
      onConfirm: () => {
        setDialogState((prev) => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      onCancel: () => setDialogState((prev) => ({ ...prev, isOpen: false })),
    });
  };

  const showInfoDialog = (title: string, message: string) => {
    setDialogState({
      isOpen: true,
      type: "info",
      title,
      message,
      onConfirm: () => setDialogState((prev) => ({ ...prev, isOpen: false })),
      onCancel: null,
    });
  };

  // Function to load comments for all posts
  const loadAllCommentsForPosts = async (posts: any[]) => {
    console.log("🔄 Loading comments for all posts...");

    // Check if user is authenticated
    const token = localStorage.getItem("access_token");
    console.log(
      "🔑 Auth token check:",
      token ? "Token exists" : "No token found"
    );
    if (!token) {
      console.log("❌ No auth token available for loading comments");
      return;
    }

    try {
      const commentsMap: { [postId: number]: any[] } = {};

      // Load comments for each post
      const commentPromises = posts.map(async (post) => {
        try {
          console.log(`🔄 Loading comments for post ${post.id}...`);
          const response = await postsAPI.getComments(post.id);
          if (response.data) {
            commentsMap[post.id] = response.data;
            console.log(
              `✅ Loaded ${response.data.length} comments for post ${post.id}`
            );
          }
        } catch (error) {
          console.warn(
            `⚠️ Failed to load comments for post ${post.id}:`,
            error
          );
          commentsMap[post.id] = [];
        }
      });

      await Promise.all(commentPromises);

      // Update comments state
      setComments((prevComments) => {
        console.log("📊 Previous comments state:", prevComments);
        console.log("📊 New comments map:", commentsMap);
        return { ...prevComments, ...commentsMap };
      });
      storage.saveComments(commentsMap);

      console.log(
        `✅ Loaded comments for ${Object.keys(commentsMap).length} posts`
      );
      console.log("📊 Comments state updated:", commentsMap);
    } catch (error) {
      console.error("🔴 Error loading comments for posts:", error);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Debug useEffect to track comments state changes
  useEffect(() => {
    console.log("📊 Comments state changed:", comments);
    console.log("📊 Total posts with comments:", Object.keys(comments).length);
    Object.entries(comments).forEach(([postId, postComments]) => {
      if (Array.isArray(postComments)) {
        console.log(`📊 Post ${postId}: ${postComments.length} comments`);
      } else {
        console.log(
          `📊 Post ${postId}: ${
            (postComments as any)?.length || 0
          } comments (${typeof postComments})`
        );
      }
    });
  }, [comments]);

  // Load comments after posts are loaded
  useEffect(() => {
    if (posts.length > 0 && user) {
      console.log("🔄 Posts loaded, loading comments for each post...");
      posts.forEach(async (post) => {
        if (!comments[post.id]) {
          try {
            console.log(`🔄 Loading comments for post ${post.id}...`);
            const response = await postsAPI.getComments(post.id);
            console.log(`📋 Raw API response for post ${post.id}:`, response);
            console.log(`📋 Response data for post ${post.id}:`, response.data);

            // Handle Django REST framework pagination response
            const commentsData = response.data.results || response.data || [];
            setComments((prev) => ({
              ...prev,
              [post.id]: commentsData,
            }));
            console.log(
              `✅ Loaded ${commentsData.length} comments for post ${post.id}`
            );
          } catch (error) {
            console.warn(
              `⚠️ Failed to load comments for post ${post.id}:`,
              error
            );
          }
        }
      });
    }
  }, [posts, user]);

  // Load initial data from backend on client side
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Always try to fetch fresh data from backend first
        const [usersResponse, postsResponse, notificationsResponse] =
          await Promise.allSettled([
            usersAPI.getAllUsers(),
            postsAPI.getFeed(1),
            notificationsAPI.getNotifications(),
          ]);

        // Handle users
        if (usersResponse.status === "fulfilled") {
          const backendUsers =
            usersResponse.value.data.results || usersResponse.value.data || [];
          if (backendUsers.length > 0) {
            setAllUsers(backendUsers);
            storage.saveAllUsers(backendUsers);
            console.log("✅ Loaded users from backend:", backendUsers.length);
          } else {
            throw new Error("No users received from backend");
          }
        } else {
          throw new Error("Failed to fetch users from backend");
        }

        // Handle posts
        if (postsResponse.status === "fulfilled") {
          const backendPosts =
            postsResponse.value.data.results || postsResponse.value.data || [];
          if (backendPosts.length > 0) {
            setPosts(backendPosts);
            storage.savePosts(backendPosts);
            console.log("✅ Loaded posts from backend:", backendPosts.length);
            console.log(
              "📋 Post IDs:",
              backendPosts.map((p: any) => p.id)
            );
          } else {
            console.log("⚠️ No posts received from backend, using defaults");
            const defaultPosts = getDefaultMockPosts();
            setPosts(defaultPosts);
            storage.savePosts(defaultPosts);
          }
        } else {
          throw new Error("Failed to fetch posts from backend");
        }

        // Handle notifications
        if (notificationsResponse.status === "fulfilled") {
          const backendNotifications =
            notificationsResponse.value.data.results ||
            notificationsResponse.value.data ||
            [];
          if (backendNotifications.length > 0) {
            setNotifications(backendNotifications);
            storage.saveNotifications(backendNotifications);
            console.log(
              "✅ Loaded notifications from backend:",
              backendNotifications.length
            );
          } else {
            console.log(
              "⚠️ No notifications received from backend, using defaults"
            );
            const defaultNotifications = getDefaultMockNotifications();
            setNotifications(defaultNotifications);
            storage.saveNotifications(defaultNotifications);
          }
        } else {
          throw new Error("Failed to fetch notifications from backend");
        }

        // Clear any network errors since backend is working
        setErrors((prev) => ({ ...prev, network: "" }));
      } catch (error) {
        console.warn(
          "🔴 Backend not available, falling back to local/mock data:",
          error
        );

        // Show backend status warning
        setErrors((prev) => ({
          ...prev,
          network:
            "⚠️ Backend server not available - using offline mode with mock data",
        }));

        // Load from localStorage or use defaults
        const storedPosts = storage.loadPosts();
        const storedComments = storage.loadComments();
        const storedNotifications = storage.loadNotifications();
        const storedAllUsers = storage.loadAllUsers();

        // Set posts - filter out any invalid posts
        if (storedPosts.length > 0) {
          const validPosts = storedPosts.filter((post) => post && post.id);
          setPosts(validPosts);
          // Save the filtered posts back to storage
          if (validPosts.length !== storedPosts.length) {
            storage.savePosts(validPosts);
          }
        } else {
          const defaultPosts = getDefaultMockPosts();
          setPosts(defaultPosts);
          storage.savePosts(defaultPosts);
        }

        // Set comments
        if (Object.keys(storedComments).length > 0) {
          setComments(storedComments);
        }

        // Set notifications
        if (storedNotifications.length > 0) {
          setNotifications(storedNotifications);
        } else {
          const defaultNotifications = getDefaultMockNotifications();
          setNotifications(defaultNotifications);
          storage.saveNotifications(defaultNotifications);
        }

        // Set users
        if (storedAllUsers.length > 0) {
          setAllUsers(storedAllUsers);
        } else {
          const defaultUsers = getDefaultMockUsers();
          setAllUsers(defaultUsers);
          storage.saveAllUsers(defaultUsers);
        }
      }
    };

    loadInitialData();
  }, []);

  // Save posts to localStorage whenever posts change
  useEffect(() => {
    if (posts.length > 0) {
      storage.savePosts(posts);
    }
  }, [posts]);

  // Save comments to localStorage whenever comments change
  useEffect(() => {
    if (Object.keys(comments).length > 0) {
      storage.saveComments(comments);
    }
  }, [comments]);

  // Save notifications to localStorage whenever notifications change
  useEffect(() => {
    if (notifications.length > 0) {
      storage.saveNotifications(notifications);
    }
  }, [notifications]);

  // Update user's post count only when the actual number of posts changes (not just post data)
  // TEMPORARILY DISABLED TO TEST INFINITE LOOP
  /*
  useEffect(() => {
    if (user && posts.length > 0) {
      const userPostCount = posts.filter((post) => post.author.id === user.id).length;
      if (user.posts_count !== userPostCount) {
        console.log(`📊 Updating user post count from ${user.posts_count} to ${userPostCount}`);
        setUser(prevUser => {
          if (!prevUser) return prevUser;
          const updatedUser = {
            ...prevUser,
            posts_count: userPostCount,
          };
          storage.saveUser(updatedUser);
          return updatedUser;
        });
      }
    }
  }, [posts.length, user?.id]); // Only depend on posts.length and user.id to avoid infinite loops
  */

  // Helper function to format comment date safely
  const formatCommentDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Just now";
      }
      return date.toLocaleDateString();
    } catch (error) {
      return "Just now";
    }
  };

  // Helper function to count user's posts
  const getUserPostCount = (userId: number) => {
    return posts.filter((post) => post.author.id === userId).length;
  };

  // Helper function to get actual comment count for a post
  const getPostCommentCount = (postId: number) => {
    const count = comments[postId]?.length || 0;
    if (count > 0) {
      console.log(`📊 Post ${postId} has ${count} comments`);
    }
    return count;
  };

  // Helper function to update post authors with current user data
  const syncPostAuthorsWithUser = (
    postsToSync: Post[],
    currentUser: User | null
  ) => {
    if (!currentUser) return postsToSync;

    return postsToSync.map((post) => {
      if (post.author.id === currentUser.id) {
        return {
          ...post,
          author: {
            ...currentUser,
            posts_count: getUserPostCount(currentUser.id),
          },
        };
      }
      return post;
    });
  };

  const checkAuthStatus = async () => {
    try {
      // First check if we have valid tokens
      if (!authService.hasValidTokens()) {
        // Try to load user from storage as fallback
        const storedUser = storage.loadUser();
        if (storedUser) {
          setUser(storedUser);
        }
        setIsLoading(false);
        return;
      }

      // Try to get current user to validate the token
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);

      // Only load additional data after successful authentication
      try {
        await loadNotifications();
        await loadFeed();
      } catch (dataError) {
        // If loading additional data fails, don't clear authentication
        console.log(
          "Failed to load additional data, but user is authenticated"
        );
      }
    } catch (error: any) {
      console.log("Authentication check failed:", error);

      // Check if it's a network error vs auth error
      if (error.code === "NETWORK_ERROR" || !error.response) {
        // Network error - keep user logged in but show offline state
        console.log("Network error detected, keeping user logged in");
        setErrors({
          ...errors,
          network: "You appear to be offline. Some features may not work.",
        });
      } else if (error.response?.status === 401) {
        // Actual authentication error - log out user
        console.log("Authentication failed, logging out user");
        authService.clearAuth();
        setUser(null);
      } else {
        // Other error - keep user logged in
        console.log("Unknown error, keeping user logged in");
      }
    } finally {
      setIsLoading(false);
    }
  };
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const response = await authService.login(
        credentials.username,
        credentials.password
      );
      setUser(response.user);
      setShowLogin(false);
      setCredentials({ username: "", password: "" });
    } catch (error: any) {
      console.error("Login failed:", error);
      setLoginError(
        error.response?.data?.detail ||
          error.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    // Basic validation
    if (registerData.password !== registerData.password_confirm) {
      setRegisterError("Passwords do not match.");
      return;
    }

    if (registerData.password.length < 8) {
      setRegisterError("Password must be at least 8 characters long.");
      return;
    }

    try {
      await authService.register(registerData);
      // After successful registration, auto-login
      const response = await authService.login(
        registerData.username,
        registerData.password
      );
      setUser(response.user);
      setShowRegister(false);
      setRegisterData({
        username: "",
        email: "",
        password: "",
        password_confirm: "",
        first_name: "",
        last_name: "",
      });
    } catch (error: any) {
      console.error("Registration failed:", error);
      setRegisterError(
        error.response?.data?.detail ||
          error.response?.data?.message ||
          error.response?.data?.username?.[0] ||
          error.response?.data?.email?.[0] ||
          "Registration failed. Please try again."
      );
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setCurrentView("dashboard");
      setPosts([]);
      setNotifications([]);
      setComments({});
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if logout API call fails, clear local state
      authService.clearAuth();
      setUser(null);
      setCurrentView("dashboard");
    }
  };

  const loadFeed = async () => {
    const callId = Math.random().toString(36).substring(7);
    console.log(`🔄 loadFeed() called [${callId}]`);
    setLoading({ ...loading, feed: true });
    setErrors({ ...errors, feed: "" });
    try {
      // Always try to fetch from backend first
      console.log(`🔄 Loading feed from backend... [${callId}]`);
      const response = await postsAPI.getAllPosts();
      const backendPosts = response.data.results || response.data || [];

      if (backendPosts.length > 0) {
        console.log(
          `✅ Loaded feed from backend: ${backendPosts.length} posts [${callId}]`
        );
        console.log("📋 Posts data:", backendPosts);
        setPosts(backendPosts);
        storage.savePosts(backendPosts);
        setErrors((prev) => ({ ...prev, network: "" })); // Clear network errors
      } else {
        console.log("⚠️ Backend returned empty feed, using stored/mock data");
        // Fallback to stored data if backend returns empty
        const storedPosts = storage.loadPosts();
        if (storedPosts.length > 0) {
          setPosts(storedPosts);
        } else {
          const mockPosts = getDefaultMockPosts();
          setPosts(mockPosts);
          storage.savePosts(mockPosts);
        }
      }
    } catch (error: any) {
      console.error("🔴 Failed to load feed from backend:", error);
      setErrors({
        ...errors,
        feed: "",
        network:
          "⚠️ Backend server not available - showing cached/offline data",
      });

      // Fallback to stored data
      const storedPosts = storage.loadPosts();
      if (storedPosts.length > 0) {
        console.log("📱 Using cached posts:", storedPosts.length);
        setPosts(storedPosts);
      } else {
        console.log("📋 Using mock posts");
        const mockPosts = getDefaultMockPosts();
        setPosts(mockPosts);
        storage.savePosts(mockPosts);
      }
    } finally {
      setLoading({ ...loading, feed: false });
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setLoading({ ...loading, createPost: true });
    setErrors({ ...errors, createPost: "", network: "" });

    try {
      console.log("🔄 Creating post via backend...");
      console.log("Post content:", newPostContent);
      console.log("Image URL type:", typeof postImageUrl);
      console.log(
        "Image URL value:",
        postImageUrl ? postImageUrl.substring(0, 100) + "..." : "empty"
      );
      console.log("Is data URL?:", postImageUrl?.startsWith("data:"));
      console.log("Is HTTP URL?:", postImageUrl?.startsWith("http"));

      // Check if user is authenticated
      const token = localStorage.getItem("access_token");
      console.log("Auth token present:", !!token);

      if (!token) {
        setErrors((prev) => ({
          ...prev,
          createPost: "❌ Not authenticated. Please log in.",
        }));
        return;
      }

      // Try to create post via backend API first
      const postData: {
        content: string;
        category: "general";
        image_data?: string;
      } = {
        content: newPostContent,
        category: "general" as const,
      };

      // Add image data if available
      if (postImageUrl && postImageUrl.trim()) {
        postData.image_data = postImageUrl;
      }

      console.log("📤 Sending post data to backend:", postData);

      const response = await postsAPI.create(postData);
      console.log("📦 Full backend response:", response);
      console.log("📦 Response status:", response.status);
      console.log("📦 Response headers:", response.headers);

      const newPost = response.data;
      console.log("📦 Response data:", newPost);
      console.log("📦 Response data type:", typeof newPost);
      console.log("📦 Response data keys:", Object.keys(newPost || {}));

      console.log("✅ Post created successfully via backend:", newPost);

      // Validate post structure before adding to array
      if (
        !newPost ||
        typeof newPost !== "object" ||
        Object.keys(newPost).length === 0
      ) {
        console.error("❌ Invalid post response from backend:", newPost);
        console.error(
          "Response type:",
          typeof newPost,
          "Keys:",
          Object.keys(newPost || {})
        );
        setErrors((prev) => ({
          ...prev,
          createPost:
            "Post may have been created but response is empty. Please refresh to see your post.",
        }));
        // Don't return - still clear the form
      } else if (!newPost.id && newPost.id !== 0) {
        console.error("❌ Post response missing ID:", newPost);
        setErrors((prev) => ({
          ...prev,
          createPost:
            "Post created but missing ID in response. Please refresh to see your post.",
        }));
        // Don't return - still clear the form
      } else {
        // Add to beginning of posts array only if we have valid data
        setPosts((prevPosts) => {
          const updatedPosts = [newPost, ...prevPosts];
          storage.savePosts(updatedPosts);
          return updatedPosts;
        });
      }

      // Clear form and redirect regardless of validation issues
      setNewPostContent("");
      setPostImageUrl("");
      setShowImagePreview(false);
      setCurrentView("feed");
    } catch (error: any) {
      console.error("🔴 Backend create post failed:", error);
      console.error("Error response data:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error config URL:", error.config?.url);
      console.error(
        "Full error object:",
        JSON.stringify(error.response?.data, null, 2)
      );

      // Handle different error types
      if (error.response?.status === 401) {
        setErrors((prev) => ({
          ...prev,
          createPost: "❌ Authentication failed. Please log in again.",
        }));
      } else if (error.response?.status === 400) {
        // Extract detailed validation errors
        const errorData = error.response.data;
        let errorMsg = "Invalid post data";

        if (errorData.detail) {
          errorMsg = errorData.detail;
        } else if (errorData.content) {
          errorMsg = Array.isArray(errorData.content)
            ? errorData.content[0]
            : errorData.content;
        } else if (errorData.non_field_errors) {
          errorMsg = Array.isArray(errorData.non_field_errors)
            ? errorData.non_field_errors[0]
            : errorData.non_field_errors;
        } else if (typeof errorData === "string") {
          errorMsg = errorData;
        } else {
          // If we have an object with field-specific errors, try to extract them
          const fieldErrors = Object.keys(errorData)
            .map((field) => {
              const fieldError = Array.isArray(errorData[field])
                ? errorData[field][0]
                : errorData[field];
              return `${field}: ${fieldError}`;
            })
            .join(", ");
          if (fieldErrors) {
            errorMsg = fieldErrors;
          }
        }

        console.error("Parsed error message:", errorMsg);
        setErrors((prev) => ({
          ...prev,
          createPost: `❌ ${errorMsg}`,
        }));
      } else {
        // For network errors or backend unavailable, create post locally
        console.warn("🔴 Backend create post failed, creating locally:", error);

        if (!user) {
          setErrors((prev) => ({
            ...prev,
            createPost: "❌ Authentication required to create posts",
          }));
          return;
        }

        // Create a local post object
        const localPost = {
          id: Date.now(), // Use timestamp as temporary ID
          content: newPostContent,
          author: user,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          like_count: 0,
          comment_count: 0,
          is_liked_by_user: false,
          is_active: true,
          category: "general" as const,
          image_url: postImageUrl || undefined,
        };

        // Add to posts array
        setPosts((prevPosts) => {
          const updatedPosts = [localPost, ...prevPosts];
          storage.savePosts(updatedPosts);
          return updatedPosts;
        });

        // Clear form and redirect
        setNewPostContent("");
        setPostImageUrl("");
        setShowImagePreview(false);
        setCurrentView("feed");

        // Show warning that backend is not available
        setErrors((prev) => ({
          ...prev,
          network: "⚠️ Backend server not available - post saved locally only",
        }));
      }
    } finally {
      setLoading({ ...loading, createPost: false });
    }
  };

  // Image upload function
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setErrors({
        ...errors,
        imageUpload: "Please select a valid image file.",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({
        ...errors,
        imageUpload: "Image size must be less than 5MB.",
      });
      return;
    }

    setIsUploadingImage(true);
    setErrors({ ...errors, imageUpload: "" });

    try {
      // Convert image to base64 data URL for persistence
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setPostImageUrl(dataUrl);
        setShowImagePreview(true);
        setIsUploadingImage(false);
      };
      reader.onerror = () => {
        setErrors({
          ...errors,
          imageUpload: "Failed to process image. Please try again.",
        });
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to upload image:", error);
      setErrors({
        ...errors,
        imageUpload: "Failed to upload image. Please try again.",
      });
      setIsUploadingImage(false);
    }
  };

  const handleProfilePictureUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showErrorDialog("File Too Large", "File size should be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        showErrorDialog("Invalid File Type", "Please select an image file");
        return;
      }

      setLoading({ ...loading, profilePic: true });
      setErrors({ ...errors, profilePic: "" });

      try {
        console.log("🔄 Processing profile picture...");

        // Convert file to base64 for local storage
        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataUrl = e.target?.result as string;

          // Store locally first for immediate UI feedback
          if (user) {
            const updatedUser = {
              ...user,
              avatar_url: dataUrl,
            };
            setUser(updatedUser);
            storage.saveUser(updatedUser);
          }
          setProfilePictureFile(file);

          // Try to upload to backend using the dedicated avatar endpoint
          try {
            console.log("🔄 Uploading avatar to backend...");

            // Try file upload first (best quality)
            let response;
            try {
              response = await usersAPI.uploadAvatar(file);
              console.log(
                "✅ Avatar uploaded as file to backend:",
                response.data
              );
            } catch (fileError) {
              console.warn("File upload failed, trying base64:", fileError);
              // Fallback to base64 upload
              response = await usersAPI.uploadAvatar(dataUrl);
              console.log(
                "✅ Avatar uploaded as base64 to backend:",
                response.data
              );
            }

            // Update user with backend response
            if (user && response.data.user) {
              const updatedUser = {
                ...user,
                ...response.data.user,
                avatar_url: dataUrl, // Keep high-quality local version
              };
              setUser(updatedUser);
              storage.saveUser(updatedUser);
            }

            setErrors((prev) => ({ ...prev, network: "", profilePic: "" }));
            console.log("✅ Avatar upload completed successfully");
          } catch (error) {
            console.warn("Backend avatar upload failed:", error);
            setErrors((prev) => ({
              ...prev,
              network: "ℹ️ Avatar saved locally - backend sync failed",
              profilePic: "",
            }));
          } finally {
            setLoading({ ...loading, profilePic: false });
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Error processing file:", error);
        setErrors((prev) => ({
          ...prev,
          profilePic: "Failed to process image file",
        }));
        setLoading({ ...loading, profilePic: false });
      }
    }
  };

  const handleUpdateProfile = (event: React.FormEvent) => {
    event.preventDefault();
    if (user) {
      const updatedUser = {
        ...user,
        ...editingUser,
      };
      setUser(updatedUser);
      storage.saveUser(updatedUser);
      setIsEditingProfile(false);
      setProfilePictureFile(null);
    }
  };

  const initializeEditingUser = () => {
    if (user) {
      setEditingUser({
        full_name: user.full_name || "",
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
        privacy_setting:
          user.privacy_setting === "followers_only"
            ? "public"
            : user.privacy_setting,
      });
    }
  };

  useEffect(() => {
    if (isEditingProfile && user) {
      initializeEditingUser();
    }
  }, [isEditingProfile, user?.id]); // Only depend on user ID, not entire user object

  // Load followers/following when user first loads
  useEffect(() => {
    if (user?.id && !lastProcessedUserIdRef.current) {
      lastProcessedUserIdRef.current = user.id;

      const userFollowing = storage.loadFollowing(user.id);
      const userFollowers = storage.loadFollowers(user.id);
      setFollowing(userFollowing);
      setFollowers(userFollowers);

      // Update counts if they don't match storage (one-time sync)
      const storedFollowersCount = userFollowers.length;
      const storedFollowingCount = userFollowing.length;

      if (
        user.followers_count !== storedFollowersCount ||
        user.following_count !== storedFollowingCount
      ) {
        const updatedUser = {
          ...user,
          followers_count: storedFollowersCount,
          following_count: storedFollowingCount,
        };
        setUser(updatedUser);
        storage.saveUser(updatedUser);
      }
    } else if (!user?.id) {
      // Reset when user logs out
      lastProcessedUserIdRef.current = null;
    }
  }, [user?.id]); // Safe to use user?.id since we guard against repeated processing

  // Initialize all users if empty
  useEffect(() => {
    if (allUsers.length === 0) {
      const defaultUsers = getDefaultMockUsers();
      setAllUsers(defaultUsers);
      storage.saveAllUsers(defaultUsers);
    }
  }, []);

  // Remove image function
  const handleRemoveImage = () => {
    setPostImageUrl("");
    setShowImagePreview(false);
  };

  // Profile picture upload
  // Profile editing functions
  const handleEditProfile = () => {
    if (user) {
      setProfileEditData({
        first_name: user.first_name,
        last_name: user.last_name,
        bio: user.bio || "",
        website: user.website || "",
        location: user.location || "",
      });
      setEditingUser({
        full_name: user.full_name || "",
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
        privacy_setting: (user.privacy_setting || "public") as
          | "public"
          | "private"
          | "followers_only",
      });
      setIsEditingProfile(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setLoading({ ...loading, profileEdit: true });
    setErrors({ ...errors, profileEdit: "" });

    try {
      console.log("🔄 Updating profile via backend...");

      // Prepare the update data
      const updateData = {
        first_name: profileEditData.first_name,
        last_name: profileEditData.last_name,
        bio: profileEditData.bio,
        website: profileEditData.website,
        location: profileEditData.location,
        privacy_setting: editingUser.privacy_setting,
      };

      // Make API call to update profile
      const response = await usersAPI.updateProfile(updateData);
      console.log(
        "✅ Profile updated successfully via backend:",
        response.data
      );

      // Update local user state with response data
      const updatedUser = {
        ...user,
        ...response.data,
        full_name: `${updateData.first_name} ${updateData.last_name}`,
      };

      setUser(updatedUser);
      storage.saveUser(updatedUser);
      setIsEditingProfile(false);

      // Clear any previous network errors since backend is working
      setErrors((prev) => ({ ...prev, network: "" }));
    } catch (error: any) {
      console.warn(
        "🔴 Backend profile update failed, updating locally:",
        error
      );

      // Show warning that backend is not available
      setErrors((prev) => ({
        ...prev,
        network: "⚠️ Backend server not available - changes are local only",
        profileEdit: "Failed to save to server, but changes were saved locally",
      }));

      // Still update locally for better UX
      const updatedUser = {
        ...user,
        first_name: profileEditData.first_name,
        last_name: profileEditData.last_name,
        full_name: `${profileEditData.first_name} ${profileEditData.last_name}`,
        bio: profileEditData.bio,
        website: profileEditData.website,
        location: profileEditData.location,
        privacy_setting: editingUser.privacy_setting,
      };

      setUser(updatedUser);
      storage.saveUser(updatedUser);
      setIsEditingProfile(false);
    } finally {
      setLoading({ ...loading, profileEdit: false });
    }
  };

  const handleCancelEditProfile = () => {
    setIsEditingProfile(false);
    setProfileEditData({
      first_name: "",
      last_name: "",
      bio: "",
      website: "",
      location: "",
    });
    setEditingUser({
      full_name: "",
      bio: "",
      location: "",
      website: "",
      privacy_setting: "public" as "public" | "private" | "followers_only",
    });
    setProfilePictureFile(null);
  };

  // View Profile functions
  const handleViewProfile = async (user: User) => {
    setViewingUser(user);
    setIsViewingProfile(true);
    setLoading({ ...loading, viewProfile: true });

    try {
      // Fetch user's posts using the same base URL as other API calls
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `http://127.0.0.1:8000/api/posts/list/?author=${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setViewingUserPosts(data.results || data);
      } else {
        console.error("Failed to fetch user posts");
        setViewingUserPosts([]);
      }
    } catch (error) {
      console.error("Error fetching user posts:", error);
      setViewingUserPosts([]);
    } finally {
      setLoading({ ...loading, viewProfile: false });
    }
  };

  const handleCloseViewProfile = () => {
    setIsViewingProfile(false);
    setViewingUser(null);
    setViewingUserPosts([]);
  };

  const handleLikePost = async (postId: number) => {
    setLoading({ ...loading, [`like_${postId}`]: true });
    try {
      console.log("🔄 Liking post via backend...");

      // Try to like post via backend API first
      await postsAPI.likePost(postId);

      console.log("✅ Post liked successfully via backend");

      // Update the post in the local state
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                like_count: post.like_count + 1,
                is_liked_by_user: true,
              }
            : post
        )
      );

      // Clear network errors since backend is working
      setErrors((prev) => ({ ...prev, network: "" }));
    } catch (error) {
      console.warn("🔴 Backend like failed, updating locally:", error);

      // Show warning that backend is not available
      setErrors((prev) => ({
        ...prev,
        network: "⚠️ Backend server not available - changes are local only",
      }));

      // Still update locally for better UX
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                like_count: post.like_count + 1,
                is_liked_by_user: true,
              }
            : post
        )
      );
    } finally {
      setLoading({ ...loading, [`like_${postId}`]: false });
    }
  };

  const handleUnlikePost = async (postId: number) => {
    setLoading({ ...loading, [`unlike_${postId}`]: true });
    try {
      console.log("🔄 Unliking post via backend...");

      // Try to unlike post via backend API first
      await postsAPI.unlikePost(postId);

      console.log("✅ Post unliked successfully via backend");

      // Update the post in the local state
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                like_count: Math.max(0, post.like_count - 1),
                is_liked_by_user: false,
              }
            : post
        )
      );

      // Clear network errors since backend is working
      setErrors((prev) => ({ ...prev, network: "" }));
    } catch (error) {
      console.warn("🔴 Backend unlike failed, updating locally:", error);

      // Show warning that backend is not available
      setErrors((prev) => ({
        ...prev,
        network: "⚠️ Backend server not available - changes are local only",
      }));

      // Still update locally for better UX
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                like_count: Math.max(0, post.like_count - 1),
                is_liked_by_user: false,
              }
            : post
        )
      );
    } finally {
      setLoading({ ...loading, [`unlike_${postId}`]: false });
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!user) return;

    // Find the post to check if user owns it
    const post = posts.find((p) => p.id === postId);
    if (!post || post.author.id !== user.id) {
      showErrorDialog(
        "Permission Denied",
        "You can only delete your own posts"
      );
      return;
    }

    // Show confirmation dialog instead of browser confirm
    showConfirmDialog(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
      () => performDeletePost(postId)
    );
  };

  const performDeletePost = async (postId: number) => {
    if (!user) return;

    setLoading((prevLoading) => ({
      ...prevLoading,
      [`delete_${postId}`]: true,
    }));
    setErrors((prevErrors) => ({ ...prevErrors, [`delete_${postId}`]: "" }));

    try {
      console.log("🔄 Deleting post via backend...");

      // Try to delete post via backend API first
      await postsAPI.deletePost(postId);

      console.log("✅ Post deleted successfully via backend");

      // Remove the post from local state
      setPosts((prevPosts) => {
        const updatedPosts = prevPosts.filter((p) => p.id !== postId);
        storage.savePosts(updatedPosts);
        return updatedPosts;
      });

      // Remove associated comments
      setComments((prevComments) => {
        const updatedComments = { ...prevComments };
        delete updatedComments[postId];
        storage.saveComments(updatedComments);
        return updatedComments;
      });

      // Update user's post count
      const userPostCount = getUserPostCount(user.id);
      const updatedUser = { ...user, posts_count: userPostCount };
      setUser(updatedUser);
      storage.saveUser(updatedUser);

      // Close comment dialog if it was open for this post
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
      }
    } catch (error) {
      console.warn("🔴 Backend delete failed, updating locally:", error);

      // Still remove the post locally even if backend fails
      setPosts((prevPosts) => {
        const updatedPosts = prevPosts.filter((p) => p.id !== postId);
        storage.savePosts(updatedPosts);
        return updatedPosts;
      });

      // Remove associated comments
      setComments((prevComments) => {
        const updatedComments = { ...prevComments };
        delete updatedComments[postId];
        storage.saveComments(updatedComments);
        return updatedComments;
      });

      // Update user's post count
      const userPostCount = getUserPostCount(user.id);
      const updatedUser = { ...user, posts_count: userPostCount };
      setUser(updatedUser);
      storage.saveUser(updatedUser);

      // Show warning that backend is not available
      setErrors((prev) => ({
        ...prev,
        network: "⚠️ Backend server not available - changes are local only",
      }));
    } finally {
      setLoading((prevLoading) => ({
        ...prevLoading,
        [`delete_${postId}`]: false,
      }));
    }
  };

  const loadComments = async (postId: number) => {
    if (comments[postId]) return; // Already loaded

    setLoading((prevLoading) => ({
      ...prevLoading,
      [`comments_${postId}`]: true,
    }));
    try {
      // In a real app, this would make an API call
      // const response = await postsAPI.getComments(postId);

      // Simulate loading comments with mock data
      await new Promise((resolve) => setTimeout(resolve, 300));

      const mockComments = [
        {
          id: Date.now(),
          content: "Great post! Thanks for sharing.",
          author: {
            id: 2,
            username: "user1",
            email: "user1@example.com",
            first_name: "John",
            last_name: "Doe",
            full_name: "John Doe",
            bio: "Software developer",
            avatar_url:
              "https://ui-avatars.com/api/?name=John+Doe&background=10b981&color=fff",
            privacy_setting: "public" as const,
            followers_count: 50,
            following_count: 30,
            posts_count: 25,
            created_at: new Date().toISOString(),
            is_verified: false,
          },
          post: postId,
          created_at: new Date().toISOString(),
          is_active: true,
        },
      ];

      setComments((prevComments) => ({
        ...prevComments,
        [postId]: mockComments,
      }));
    } catch (error) {
      console.error("Failed to load comments:", error);
      setErrors((prevErrors) => ({
        ...prevErrors,
        [`comments_${postId}`]: "Failed to load comments. Please try again.",
      }));
    } finally {
      setLoading((prevLoading) => ({
        ...prevLoading,
        [`comments_${postId}`]: false,
      }));
    }
  };

  const handleAddComment = async (postId: number) => {
    const content = newComment[postId];
    if (!content?.trim()) return;

    setLoading((prevLoading) => ({
      ...prevLoading,
      [`addComment_${postId}`]: true,
    }));
    try {
      // Make API call to add comment
      const response = await postsAPI.addComment(postId, { content });
      console.log("✅ Comment added successfully:", response.data);

      // Get the new comment data from response
      const newCommentData = response.data;

      // Update comments state
      setComments((prevComments) => ({
        ...prevComments,
        [postId]: [...(prevComments[postId] || []), newCommentData],
      }));
      setNewComment((prevNewComment) => ({ ...prevNewComment, [postId]: "" }));

      console.log("💬 Comment added and saved successfully");
    } catch (error) {
      console.error("❌ Failed to add comment:", error);
      setErrors((prevErrors) => ({
        ...prevErrors,
        [`addComment_${postId}`]: "Failed to add comment. Please try again.",
      }));
    } finally {
      setLoading((prevLoading) => ({
        ...prevLoading,
        [`addComment_${postId}`]: false,
      }));
    }
  };

  const searchUsersFunction = async () => {
    if (!searchQuery.trim()) {
      setSearchUsers([]);
      return;
    }

    setLoading({ ...loading, search: true });
    setErrors({ ...errors, search: "" });

    try {
      console.log("🔄 Searching users via backend...");

      // Try to search users from backend API first
      const response = await usersAPI.search(searchQuery.trim());
      const backendUsers = response.data.results || response.data || [];

      console.log(
        "✅ User search successful via backend:",
        backendUsers.length,
        "results"
      );

      setSearchUsers(backendUsers);

      // Clear any previous network errors since backend is working
      setErrors((prev) => ({ ...prev, search: "", network: "" }));
    } catch (apiError: any) {
      console.warn(
        "🔴 Backend search failed, falling back to local search:",
        apiError
      );

      // Show warning that backend is not available
      setErrors((prev) => ({
        ...prev,
        network:
          "⚠️ Backend server not available - showing local search results only",
      }));

      // Fallback to local search through allUsers if API fails
      const query = searchQuery.toLowerCase();
      const filteredUsers = allUsers
        .filter(
          (user) =>
            user.username.toLowerCase().includes(query) ||
            user.full_name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            user.bio.toLowerCase().includes(query)
        )
        .map((user) => ({
          ...user,
          // Get real-time follower/following counts
          followers_count: storage.loadFollowers(user.id).length,
          following_count: storage.loadFollowing(user.id).length,
        }));

      console.log("📱 Local search results:", filteredUsers.length);
      setSearchUsers(filteredUsers);
    } finally {
      setLoading({ ...loading, search: false });
    }
  };

  const handleFollowUser = async (targetUserId: number) => {
    if (!user) return;

    // Prevent following if already following
    if (following.includes(targetUserId)) {
      console.log(`⚠️ Already following user ${targetUserId}`);
      return;
    }

    console.log(`🔄 Following user ${targetUserId} (current user: ${user.id})`);
    setLoading({ ...loading, [`follow_${targetUserId}`]: true });
    try {
      // Try to follow user via backend API first
      let success = false;
      try {
        await usersAPI.follow(targetUserId);
        success = true;
        console.log(`✅ Backend follow successful for user ${targetUserId}`);
        // Update local storage to keep it in sync with backend
        storage.followUser(user.id, targetUserId);
      } catch (apiError: any) {
        console.warn("Backend follow failed, using local storage:", apiError);
        // Fallback to local storage system
        success = storage.followUser(user.id, targetUserId);
      }

      if (success) {
        // Update local state - avoid duplicates and clean up existing ones
        const cleanFollowing = [...new Set(following)]; // Remove existing duplicates
        const newFollowing = cleanFollowing.includes(targetUserId)
          ? cleanFollowing
          : [...cleanFollowing, targetUserId];
        setFollowing(newFollowing);
        console.log(`📊 Updated following list:`, newFollowing);

        // When backend succeeds, update the follower count optimistically
        // instead of relying on local storage
        setSearchUsers(
          searchUsers.map((searchUser) =>
            searchUser.id === targetUserId
              ? {
                  ...searchUser,
                  followers_count: searchUser.followers_count + 1,
                }
              : searchUser
          )
        );

        console.log(`📊 Target user ${targetUserId} followers increased by 1`);

        // Update all users list
        setAllUsers(
          allUsers.map((allUser) =>
            allUser.id === targetUserId
              ? {
                  ...allUser,
                  followers_count: allUser.followers_count + 1,
                }
              : allUser.id === user.id
              ? {
                  ...allUser,
                  following_count: newFollowing.length,
                }
              : allUser
          )
        );

        // Update current user's following count
        const updatedUser = {
          ...user,
          following_count: newFollowing.length,
        };
        setUser(updatedUser);
        storage.saveUser(updatedUser);

        // Create notification for the followed user
        const followNotification: Notification = {
          id: Date.now(),
          sender: user,
          notification_type: "follow",
          message: `${user.full_name} started following you`,
          is_read: false,
          created_at: new Date().toISOString(),
        };

        const currentNotifications = storage.loadNotifications();
        const updatedNotifications = [
          followNotification,
          ...currentNotifications,
        ];
        setNotifications(updatedNotifications);
        storage.saveNotifications(updatedNotifications);
      }
    } catch (error: any) {
      console.error("Failed to follow user:", error);
      setErrors({
        ...errors,
        [`follow_${targetUserId}`]: "Failed to follow user. Please try again.",
      });
    } finally {
      setLoading({ ...loading, [`follow_${targetUserId}`]: false });
    }
  };

  const handleUnfollowUser = async (targetUserId: number) => {
    if (!user) return;

    // Prevent unfollowing if not following
    if (!following.includes(targetUserId)) {
      console.log(`⚠️ Not following user ${targetUserId}`);
      return;
    }

    console.log(
      `🔄 Unfollowing user ${targetUserId} (current user: ${user.id})`
    );
    setLoading({ ...loading, [`unfollow_${targetUserId}`]: true });
    try {
      // Try to unfollow user via backend API first
      let success = false;
      try {
        await usersAPI.unfollow(targetUserId);
        success = true;
        console.log(`✅ Backend unfollow successful for user ${targetUserId}`);
        // Update local storage to keep it in sync with backend
        storage.unfollowUser(user.id, targetUserId);
      } catch (apiError: any) {
        console.warn("Backend unfollow failed, using local storage:", apiError);
        // Fallback to local storage system
        success = storage.unfollowUser(user.id, targetUserId);
      }

      if (success) {
        // Update local state
        const newFollowing = following.filter((id) => id !== targetUserId);
        setFollowing(newFollowing);

        // When backend succeeds, update the follower count optimistically
        setSearchUsers(
          searchUsers.map((searchUser) =>
            searchUser.id === targetUserId
              ? {
                  ...searchUser,
                  followers_count: Math.max(0, searchUser.followers_count - 1),
                }
              : searchUser
          )
        );

        // Update all users list
        setAllUsers(
          allUsers.map((allUser) =>
            allUser.id === targetUserId
              ? {
                  ...allUser,
                  followers_count: storage.loadFollowers(targetUserId).length,
                }
              : allUser.id === user.id
              ? {
                  ...allUser,
                  following_count: newFollowing.length,
                }
              : allUser
          )
        );

        // Update current user's following count
        const updatedUser = {
          ...user,
          following_count: newFollowing.length,
        };
        setUser(updatedUser);
        storage.saveUser(updatedUser);
      }
    } catch (error: any) {
      console.error("Failed to unfollow user:", error);
      setErrors({
        ...errors,
        [`unfollow_${targetUserId}`]:
          "Failed to unfollow user. Please try again.",
      });
    } finally {
      setLoading({ ...loading, [`unfollow_${targetUserId}`]: false });
    }
  };

  // Helper function to check if current user is following target user
  const isFollowing = (targetUserId: number): boolean => {
    return following.includes(targetUserId);
  };

  const loadNotifications = async () => {
    setLoading({ ...loading, notifications: true });
    setErrors({ ...errors, notifications: "" });
    try {
      console.log("🔄 Loading notifications from backend...");

      // Try to fetch notifications from backend first
      const response = await notificationsAPI.getNotifications();
      const backendNotifications = response.data.results || response.data || [];

      if (backendNotifications.length > 0) {
        console.log(
          "✅ Loaded notifications from backend:",
          backendNotifications.length
        );
        setNotifications(backendNotifications);
        storage.saveNotifications(backendNotifications);
        setErrors((prev) => ({ ...prev, network: "" })); // Clear network errors
      } else {
        console.log(
          "⚠️ Backend returned empty notifications, using stored/mock data"
        );
        // Fallback to stored data if backend returns empty
        const storedNotifications = storage.loadNotifications();
        if (storedNotifications.length > 0) {
          setNotifications(storedNotifications);
        } else {
          const mockNotifications = getDefaultMockNotifications();
          setNotifications(mockNotifications);
          storage.saveNotifications(mockNotifications);
        }
      }
    } catch (error) {
      console.warn("🔴 Failed to load notifications from backend:", error);
      setErrors((prev) => ({
        ...prev,
        network:
          "⚠️ Backend server not available - showing cached/offline notifications",
      }));

      // Fallback to stored data
      const storedNotifications = storage.loadNotifications();
      if (storedNotifications.length > 0) {
        console.log(
          "📱 Using cached notifications:",
          storedNotifications.length
        );
        setNotifications(storedNotifications);
      } else {
        console.log("📋 Using mock notifications");
        const mockNotifications = getDefaultMockNotifications();
        setNotifications(mockNotifications);
        storage.saveNotifications(mockNotifications);
      }
    } finally {
      setLoading({ ...loading, notifications: false });
    }
  };

  const markNotificationAsRead = async (notificationId: number) => {
    setLoading({ ...loading, [`notification_${notificationId}`]: true });
    try {
      // Make API call to mark notification as read
      await notificationsAPI.markAsRead(notificationId);
      console.log(`✅ Notification ${notificationId} marked as read`);

      // Update local state to reflect the change immediately
      setNotifications(
        notifications.map((notif) =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error: any) {
      console.error("Failed to mark notification as read:", error);

      let errorMessage = "Failed to mark notification as read.";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrors({
        ...errors,
        [`notification_${notificationId}`]: errorMessage,
      });
    } finally {
      setLoading({ ...loading, [`notification_${notificationId}`]: false });
    }
  };

  const markAllNotificationsAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.is_read);

    if (unreadNotifications.length === 0) {
      console.log("No unread notifications to mark");
      return;
    }

    setLoading({ ...loading, markAllNotifications: true });
    try {
      // Make API call to mark all notifications as read
      await notificationsAPI.markAllAsRead();
      console.log(
        `✅ All ${unreadNotifications.length} notifications marked as read`
      );

      // Update local state to mark all notifications as read
      setNotifications(
        notifications.map((notif) => ({ ...notif, is_read: true }))
      );
    } catch (error: any) {
      console.error("Failed to mark all notifications as read:", error);

      let errorMessage = "Failed to mark all notifications as read.";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrors({
        ...errors,
        markAllNotifications: errorMessage,
      });
    } finally {
      setLoading({ ...loading, markAllNotifications: false });
    }
  };

  // New Independent Comments Modal to avoid infinite loops
  const SimpleCommentsModal = ({
    post,
    isOpen,
    onClose,
  }: {
    post: Post;
    isOpen: boolean;
    onClose: () => void;
  }) => {
    const [dialogComments, setDialogComments] = useState<Comment[]>([]);
    const [newCommentText, setNewCommentText] = useState("");
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [isAddingComment, setIsAddingComment] = useState(false);

    // Load comments when dialog opens - prevent infinite loops
    const hasLoadedRef = React.useRef(false);

    React.useEffect(() => {
      if (isOpen && post?.id && !hasLoadedRef.current) {
        hasLoadedRef.current = true;
        loadDialogComments();
      }

      // Reset when dialog closes
      if (!isOpen) {
        hasLoadedRef.current = false;
        setNewCommentText("");
        setDialogComments([]);
      }
    }, [isOpen, post?.id]);

    const loadDialogComments = async () => {
      setIsLoadingComments(true);
      try {
        // Try to load from API first
        try {
          console.log(`🔄 Loading comments for post ${post.id} from API...`);
          const response = await postsAPI.getComments(post.id);
          console.log(`📋 Dialog API response:`, response.data);

          // Handle Django REST framework pagination response
          const commentsData = response.data.results || response.data || [];
          console.log(`✅ Loaded ${commentsData.length} comments from API`);

          setDialogComments(commentsData);
          return;
        } catch (apiError) {
          console.error("❌ API error loading comments:", apiError);
        }

        // Fallback to local state if API fails
        if (comments[post.id] && comments[post.id].length > 0) {
          console.log(
            `📦 Using ${comments[post.id].length} comments from local state`
          );
          setDialogComments(comments[post.id]);
        } else {
          console.log("📭 No comments found, starting with empty state");
          setDialogComments([]);
        }
      } catch (error) {
        console.error("Failed to load comments:", error);
        setDialogComments([]);
      } finally {
        setIsLoadingComments(false);
      }
    };

    const handleDialogAddComment = async () => {
      if (!newCommentText.trim() || !user) return;

      setIsAddingComment(true);
      try {
        const response = await postsAPI.addComment(post.id, {
          content: newCommentText,
        });
        console.log("✅ Comment added successfully:", response.data);

        // Ensure the comment has proper author info and date
        const newComment = {
          ...response.data,
          author: response.data.author || user, // Use current user if API doesn't return author
          created_at: response.data.created_at || new Date().toISOString(), // Ensure valid date
        };

        // Add the new comment to dialog state
        setDialogComments((prev) => [...prev, newComment]);
        setNewCommentText("");

        // Update the main comments state for count (using functional update)
        setComments((prevComments) => ({
          ...prevComments,
          [post.id]: [...(prevComments[post.id] || []), newComment],
        }));
      } catch (error) {
        console.error("❌ Failed to add comment:", error);

        // If API fails, create a local comment with current user
        const localComment: Comment = {
          id: Date.now(), // Temporary ID
          content: newCommentText,
          author: user,
          post: post.id,
          created_at: new Date().toISOString(),
          is_active: true,
        };

        // Add to dialog state
        setDialogComments((prev) => [...prev, localComment]);
        setNewCommentText("");

        // Update main comments state
        setComments((prevComments) => ({
          ...prevComments,
          [post.id]: [...(prevComments[post.id] || []), localComment],
        }));

        console.log("💬 Comment added locally due to API error");
      } finally {
        setIsAddingComment(false);
      }
    };

    const handleClose = () => {
      console.log("🔄 Closing comments dialog");
      setDialogComments([]);
      setNewCommentText("");
      hasLoadedRef.current = false;
      onClose();
    };

    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col bg-white">
          <DialogHeader>
            <DialogTitle>Comments ({dialogComments.length})</DialogTitle>
            <DialogDescription>
              Comments on {post?.author?.username}'s post
            </DialogDescription>
          </DialogHeader>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto space-y-4 py-4 max-h-96">
            {isLoadingComments ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Loading comments...</div>
              </div>
            ) : dialogComments.length > 0 ? (
              dialogComments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <button
                    onClick={() => handleViewProfile(comment.author)}
                    className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-colors cursor-pointer"
                  >
                    {comment.author?.username?.[0]?.toUpperCase() || "?"}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewProfile(comment.author)}
                        className="font-medium text-sm hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        {comment.author?.username || "Anonymous"}
                      </button>
                      <span className="text-xs text-gray-500">
                        {formatCommentDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{comment.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No comments yet. Be the first to comment!
              </div>
            )}
          </div>

          {/* Add Comment */}
          <div className="border-t pt-4 mt-4">
            <div className="flex space-x-2">
              <Textarea
                placeholder="Write a comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                rows={2}
                className="flex-1 resize-none"
              />
              <Button
                onClick={handleDialogAddComment}
                disabled={!newCommentText.trim() || isAddingComment}
                className="self-end"
              >
                {isAddingComment ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // View Profile Modal
  const ViewProfileModal = ({
    user,
    posts,
    isOpen,
    onClose,
  }: {
    user: User;
    posts: Post[];
    isOpen: boolean;
    onClose: () => void;
  }) => {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* User Header */}
            <div className="flex items-start space-x-4">
              <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-semibold">
                    {user?.full_name?.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{user?.full_name}</h2>
                <p className="text-gray-600">@{user?.username}</p>
                {user?.bio && <p className="text-gray-700 mt-2">{user.bio}</p>}
                {user?.location && (
                  <p className="text-gray-500 text-sm mt-1">
                    📍 {user.location}
                  </p>
                )}
                {user?.website && (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 text-sm mt-1 block hover:underline"
                  >
                    🔗 {user.website}
                  </a>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex space-x-6 text-center py-4 border-y">
              <div>
                <div className="font-bold text-lg">{posts.length}</div>
                <div className="text-gray-500 text-sm">Posts</div>
              </div>
              <div>
                <div className="font-bold text-lg">
                  {user?.followers_count || 0}
                </div>
                <div className="text-gray-500 text-sm">Followers</div>
              </div>
              <div>
                <div className="font-bold text-lg">
                  {user?.following_count || 0}
                </div>
                <div className="text-gray-500 text-sm">Following</div>
              </div>
            </div>

            {/* Posts */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Posts</h3>
              {loading.viewProfile ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading posts...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No posts yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <Card key={post.id} className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                          {user?.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm">
                              {user?.full_name?.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">
                              {user?.full_name}
                            </span>
                            <span className="text-gray-500 text-sm">
                              {new Date(post.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="mt-2">
                            <p className="text-gray-900">{post.content}</p>
                            {post.image_url && (
                              <img
                                src={post.image_url}
                                alt="Post"
                                className="mt-2 max-w-full h-auto rounded-lg"
                              />
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-3 text-gray-500 text-sm">
                            <span>❤️ {post.like_count}</span>
                            <span>💬 {getPostCommentCount(post.id)}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const CommentsModal = ({
    post,
    isOpen,
    onClose,
  }: {
    post: Post;
    isOpen: boolean;
    onClose: () => void;
  }) => {
    React.useEffect(() => {
      if (isOpen && post) {
        loadComments(post.id);
      }
    }, [isOpen, post?.id]);

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
            <DialogDescription>
              Comments on {post?.author?.username}'s post
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Original Post */}
            <div className="border-b pb-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {post?.author?.username?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold">
                      {post?.author?.username || "Anonymous"}
                    </h4>
                    <span className="text-sm text-gray-500">
                      {post && new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1">{post?.content}</p>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="space-y-3">
              {loading[`comments_${post?.id}`] ? (
                <div className="text-center py-4">Loading comments...</div>
              ) : comments[post?.id]?.length > 0 ? (
                comments[post.id].map((comment) => (
                  <div key={comment.id} className="flex items-start space-x-3">
                    <button
                      onClick={() => handleViewProfile(comment.author)}
                      className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm hover:bg-gray-500 transition-colors cursor-pointer"
                    >
                      {comment.author?.username?.[0]?.toUpperCase() || "U"}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewProfile(comment.author)}
                          className="font-medium text-sm hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          {comment.author?.username || "Anonymous"}
                        </button>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{comment.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No comments yet
                </div>
              )}
            </div>
          </div>

          {/* Add Comment */}
          <div className="border-t pt-4 mt-4">
            <div className="flex space-x-2">
              <Textarea
                placeholder="Write a comment..."
                value={newComment[post?.id] || ""}
                onChange={(e) =>
                  setNewComment({ ...newComment, [post.id]: e.target.value })
                }
                rows={2}
                className="flex-1 resize-none"
              />
              <Button
                onClick={() => handleAddComment(post.id)}
                disabled={
                  !newComment[post?.id]?.trim() ||
                  loading[`addComment_${post?.id}`]
                }
                className="self-end"
              >
                {loading[`addComment_${post?.id}`] ? "..." : "Post"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const renderDashboardContent = () => {
    switch (currentView) {
      case "feed":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">News Feed</h2>
              <div className="flex space-x-2">
                <Button
                  onClick={loadFeed}
                  disabled={loading.feed}
                  variant="outline"
                >
                  {loading.feed ? "Loading..." : "Refresh Feed"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentView("dashboard")}
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>

            {errors.feed && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {errors.feed}
              </div>
            )}

            {loading.feed ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="animate-pulse">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-gray-500">
                    No posts yet. Be the first to share something!
                  </p>
                  <div className="text-center mt-4">
                    <Button onClick={() => setCurrentView("create")}>
                      Create Your First Post
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts
                  .filter((post) => post && post.id) // Filter out invalid posts
                  .map((post) => (
                    <Card key={post.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <button
                            onClick={() => handleViewProfile(post.author)}
                            className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold hover:bg-blue-600 transition-colors cursor-pointer"
                          >
                            {post.author?.username?.[0]?.toUpperCase() || "U"}
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewProfile(post.author)}
                                className="font-semibold hover:text-blue-600 transition-colors cursor-pointer"
                              >
                                {post.author?.username || "Anonymous"}
                              </button>
                              <span className="text-sm text-gray-500">
                                {new Date(post.created_at).toLocaleDateString()}
                              </span>
                              {post.category !== "general" && (
                                <Badge variant="secondary">
                                  {post.category}
                                </Badge>
                              )}
                            </div>
                            <p className="mt-2">{post.content}</p>
                            {post.image_url && (
                              <img
                                src={post.image_url}
                                alt="Post image"
                                className="mt-3 rounded-lg max-w-full h-auto"
                              />
                            )}
                            <div className="flex items-center space-x-4 mt-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  post.is_liked_by_user
                                    ? handleUnlikePost(post.id)
                                    : handleLikePost(post.id)
                                }
                                className={
                                  post.is_liked_by_user ? "text-red-500" : ""
                                }
                              >
                                {post.is_liked_by_user ? "❤️" : "🤍"}{" "}
                                {post.like_count || 0}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedPost(post);
                                }}
                              >
                                💬 {getPostCommentCount(post.id)}
                              </Button>
                              {user && post.author.id === user.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeletePost(post.id)}
                                  disabled={loading[`delete_${post.id}`]}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  {loading[`delete_${post.id}`]
                                    ? "Deleting..."
                                    : "🗑️"}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}

            {/* Comments Modal */}
            {selectedPost && (
              <SimpleCommentsModal
                post={selectedPost}
                isOpen={!!selectedPost}
                onClose={() => setSelectedPost(null)}
              />
            )}
          </div>
        );

      case "create":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Create Post</h2>
              <Button
                variant="outline"
                onClick={() => setCurrentView("dashboard")}
              >
                Back to Dashboard
              </Button>
            </div>

            {errors.createPost && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {errors.createPost}
              </div>
            )}

            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleCreatePost} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      What's on your mind?
                    </label>
                    <Textarea
                      placeholder="Share your thoughts..."
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      rows={4}
                      className="resize-none"
                      disabled={loading.createPost}
                    />
                  </div>

                  {/* Image Upload Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium">
                        Add Image (Optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="post-image-upload"
                        disabled={loading.createPost || isUploadingImage}
                      />
                      <label
                        htmlFor="post-image-upload"
                        className="cursor-pointer inline-flex items-center px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                      >
                        {isUploadingImage ? "Uploading..." : "📷 Choose Image"}
                      </label>
                    </div>

                    {errors.imageUpload && (
                      <div className="text-sm text-red-600">
                        {errors.imageUpload}
                      </div>
                    )}

                    {showImagePreview && postImageUrl && (
                      <div className="relative">
                        <img
                          src={postImageUrl}
                          alt="Post preview"
                          className="w-full max-h-64 object-cover rounded-md border"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {newPostContent.length}/500 characters
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setNewPostContent("")}
                        disabled={loading.createPost}
                      >
                        Clear
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          !newPostContent.trim() ||
                          newPostContent.length > 500 ||
                          loading.createPost
                        }
                      >
                        {loading.createPost ? "Posting..." : "Share Post"}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Recent Posts Preview */}
            {posts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Your Recent Posts
                </h3>
                <div className="space-y-3">
                  {posts.slice(0, 3).map((post) => (
                    <Card key={post.id}>
                      <CardContent className="p-3">
                        <div className="flex items-start space-x-3">
                          <button
                            onClick={() => handleViewProfile(post.author)}
                            className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold hover:bg-blue-600 transition-colors cursor-pointer"
                          >
                            {post.author?.username?.[0]?.toUpperCase() || "U"}
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewProfile(post.author)}
                                className="text-sm font-medium hover:text-blue-600 transition-colors cursor-pointer"
                              >
                                {post.author?.username}
                              </button>
                              <span className="text-xs text-gray-500">
                                {new Date(post.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm mt-1">
                              {post.content.substring(0, 100)}
                              {post.content.length > 100 ? "..." : ""}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center space-x-3 text-xs text-gray-500">
                                <span>❤️ {post.like_count}</span>
                                <span>💬 {getPostCommentCount(post.id)}</span>
                              </div>
                              {user && post.author.id === user.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeletePost(post.id)}
                                  disabled={loading[`delete_${post.id}`]}
                                  className="text-red-500 hover:text-red-700 text-xs p-1 h-6"
                                >
                                  {loading[`delete_${post.id}`] ? "..." : "🗑️"}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "social":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Social Features</h2>
              <Button
                variant="outline"
                onClick={() => setCurrentView("dashboard")}
              >
                Back to Dashboard
              </Button>
            </div>

            {/* User Search */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Find Friends</h3>
                  <div className="text-xs flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        errors.network
                          ? "bg-amber-500 animate-pulse"
                          : "bg-green-500"
                      }`}
                    ></div>
                    <span className="text-gray-500">
                      {errors.network ? "Offline Mode" : "Connected to Backend"}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2 mb-4">
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && searchUsersFunction()
                    }
                  />
                  <Button
                    onClick={searchUsersFunction}
                    disabled={loading.search || !searchQuery.trim()}
                  >
                    {loading.search ? "Searching..." : "Search"}
                  </Button>
                </div>

                {searchUsers.length > 0 && (
                  <div className="space-y-3">
                    {searchUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.username[0].toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-medium">{user.username}</h4>
                            <p className="text-sm text-gray-500">
                              {user.full_name}
                            </p>
                            <div className="flex space-x-3 text-xs text-gray-500">
                              <span>{user.followers_count} followers</span>
                              <span>{user.following_count} following</span>
                              <span>{user.posts_count} posts</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {isFollowing(user.id) ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnfollowUser(user.id)}
                              disabled={loading[`unfollow_${user.id}`]}
                            >
                              {loading[`unfollow_${user.id}`]
                                ? "Unfollowing..."
                                : "Unfollow"}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleFollowUser(user.id)}
                              disabled={loading[`follow_${user.id}`]}
                            >
                              {loading[`follow_${user.id}`]
                                ? "Following..."
                                : "Follow"}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewProfile(user)}
                          >
                            View Profile
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Your Network Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {user?.followers_count || 0}
                  </div>
                  <div className="text-sm text-gray-600">Followers</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {user?.following_count || 0}
                  </div>
                  <div className="text-sm text-gray-600">Following</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {user?.posts_count || 0}
                  </div>
                  <div className="text-sm text-gray-600">Posts</div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => setCurrentView("notifications")}
                  >
                    🔔 View Notifications
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => setCurrentView("profile")}
                  >
                    👤 Edit Profile
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => {
                      /* View followers functionality */
                    }}
                  >
                    👥 View Followers
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => {
                      /* View following functionality */
                    }}
                  >
                    ➡️ View Following
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Notifications</h2>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadNotifications}
                  disabled={loading.notifications}
                >
                  {loading.notifications ? "Loading..." : "Refresh"}
                </Button>
                {notifications.filter((n) => !n.is_read).length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllNotificationsAsRead}
                    disabled={loading.markAllNotifications}
                    className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                  >
                    {loading.markAllNotifications
                      ? "Marking..."
                      : `Mark All Read (${
                          notifications.filter((n) => !n.is_read).length
                        })`}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setCurrentView("dashboard")}
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>

            {loading.notifications ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="animate-pulse flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-gray-500">
                    <div className="text-4xl mb-2">🔔</div>
                    <p>No notifications yet</p>
                    <p className="text-sm">
                      You'll see notifications when people interact with your
                      posts
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={
                      notification.is_read
                        ? "opacity-75"
                        : "border-blue-200 bg-blue-50"
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                          {notification.notification_type === "like"
                            ? "❤️"
                            : notification.notification_type === "comment"
                            ? "💬"
                            : notification.notification_type === "follow"
                            ? "👤"
                            : "🔔"}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">
                              {notification.sender?.username}
                            </span>{" "}
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(
                              notification.created_at
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              markNotificationAsRead(notification.id)
                            }
                            disabled={
                              loading[`notification_${notification.id}`]
                            }
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            {loading[`notification_${notification.id}`] ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 mr-1"></div>
                                Marking...
                              </>
                            ) : (
                              "✓ Mark read"
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case "profile":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Profile Settings</h2>
              <div className="flex space-x-2">
                {!isEditingProfile && (
                  <Button onClick={handleEditProfile}>Edit Profile</Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setCurrentView("dashboard")}
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>

            {errors.profileEdit && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {errors.profileEdit}
              </div>
            )}

            {errors.profilePic && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {errors.profilePic}
              </div>
            )}

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="relative">
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {user?.username?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                      id="profile-pic-upload"
                      disabled={loading.profilePic}
                    />
                    <label
                      htmlFor="profile-pic-upload"
                      className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs cursor-pointer hover:bg-blue-600"
                    >
                      {loading.profilePic ? "..." : "📷"}
                    </label>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {user?.full_name || user?.username}
                    </h3>
                    <p className="text-gray-600">@{user?.username}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>

                {isEditingProfile ? (
                  <div className="space-y-4">
                    <h4 className="font-medium">Edit Profile Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          First Name
                        </label>
                        <Input
                          value={profileEditData.first_name}
                          onChange={(e) =>
                            setProfileEditData({
                              ...profileEditData,
                              first_name: e.target.value,
                            })
                          }
                          disabled={loading.profileEdit}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Last Name
                        </label>
                        <Input
                          value={profileEditData.last_name}
                          onChange={(e) =>
                            setProfileEditData({
                              ...profileEditData,
                              last_name: e.target.value,
                            })
                          }
                          disabled={loading.profileEdit}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">
                          Bio
                        </label>
                        <Textarea
                          value={profileEditData.bio}
                          onChange={(e) =>
                            setProfileEditData({
                              ...profileEditData,
                              bio: e.target.value,
                            })
                          }
                          rows={3}
                          disabled={loading.profileEdit}
                          placeholder="Tell people about yourself..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Website
                        </label>
                        <Input
                          value={profileEditData.website}
                          onChange={(e) =>
                            setProfileEditData({
                              ...profileEditData,
                              website: e.target.value,
                            })
                          }
                          disabled={loading.profileEdit}
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Location
                        </label>
                        <Input
                          value={profileEditData.location}
                          onChange={(e) =>
                            setProfileEditData({
                              ...profileEditData,
                              location: e.target.value,
                            })
                          }
                          disabled={loading.profileEdit}
                          placeholder="City, Country"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Privacy Setting
                        </label>
                        <select
                          value={editingUser.privacy_setting}
                          onChange={(e) =>
                            setEditingUser({
                              ...editingUser,
                              privacy_setting: e.target.value as
                                | "public"
                                | "private"
                                | "followers_only",
                            })
                          }
                          disabled={loading.profileEdit}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="public">Public</option>
                          <option value="followers_only">Followers Only</option>
                          <option value="private">Private</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex space-x-2 pt-4">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={loading.profileEdit}
                      >
                        {loading.profileEdit ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancelEditProfile}
                        disabled={loading.profileEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">
                          Account Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">First Name:</span>{" "}
                            {user?.first_name}
                          </div>
                          <div>
                            <span className="font-medium">Last Name:</span>{" "}
                            {user?.last_name}
                          </div>
                          <div>
                            <span className="font-medium">Email:</span>{" "}
                            {user?.email}
                          </div>
                          <div>
                            <span className="font-medium">Bio:</span>{" "}
                            {user?.bio || "No bio yet"}
                          </div>
                          <div>
                            <span className="font-medium">Location:</span>{" "}
                            {user?.location || "Not specified"}
                          </div>
                          <div>
                            <span className="font-medium">Website:</span>{" "}
                            {user?.website || "Not specified"}
                          </div>
                          <div>
                            <span className="font-medium">Privacy:</span>{" "}
                            <span
                              className={`capitalize px-2 py-1 rounded-full text-xs ${
                                user?.privacy_setting === "private"
                                  ? "bg-red-100 text-red-700"
                                  : user?.privacy_setting === "followers_only"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {user?.privacy_setting === "followers_only"
                                ? "Followers Only"
                                : user?.privacy_setting || "Public"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-3">Account Stats</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Member since:</span>{" "}
                            {user &&
                              new Date(user.created_at).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Posts:</span>{" "}
                            {user?.posts_count || 0}
                          </div>
                          <div>
                            <span className="font-medium">Followers:</span>{" "}
                            <button
                              className="text-blue-600 hover:underline"
                              onClick={() => setCurrentView("followers" as any)}
                            >
                              {followers.length}
                            </button>
                          </div>
                          <div>
                            <span className="font-medium">Following:</span>{" "}
                            <button
                              className="text-blue-600 hover:underline"
                              onClick={() => setCurrentView("following" as any)}
                            >
                              {following.length}
                            </button>
                          </div>
                          <div>
                            <span className="font-medium">Privacy:</span>{" "}
                            {user?.privacy_setting || "public"}
                          </div>
                          <div>
                            <span className="font-medium">Verified:</span>{" "}
                            {user?.is_verified ? "✅ Yes" : "❌ No"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex space-x-3">
                      <Button
                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                      >
                        {isEditingProfile ? "Cancel" : "Edit Profile"}
                      </Button>
                      <Button variant="outline">Change Password</Button>
                      <Button variant="outline">Privacy Settings</Button>
                    </div>

                    {isEditingProfile && (
                      <div className="mt-6 p-4 border rounded-lg bg-slate-50">
                        <h3 className="text-lg font-semibold mb-4">
                          Edit Profile
                        </h3>
                        <form
                          onSubmit={handleUpdateProfile}
                          className="space-y-4"
                        >
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Profile Picture
                            </label>
                            <div className="flex items-center space-x-4">
                              <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                                {user?.avatar_url ? (
                                  <img
                                    src={user.avatar_url}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xl">
                                    {user?.full_name?.charAt(0)}
                                  </span>
                                )}
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePictureUpload}
                                className="hidden"
                                id="profile-picture-upload"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  document
                                    .getElementById("profile-picture-upload")
                                    ?.click()
                                }
                              >
                                Change Photo
                              </Button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Full Name
                            </label>
                            <input
                              type="text"
                              value={editingUser.full_name}
                              onChange={(e) =>
                                setEditingUser({
                                  ...editingUser,
                                  full_name: e.target.value,
                                })
                              }
                              className="w-full p-2 border rounded-md"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Bio
                            </label>
                            <textarea
                              value={editingUser.bio}
                              onChange={(e) =>
                                setEditingUser({
                                  ...editingUser,
                                  bio: e.target.value,
                                })
                              }
                              className="w-full p-2 border rounded-md h-24"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Location
                            </label>
                            <input
                              type="text"
                              value={editingUser.location}
                              onChange={(e) =>
                                setEditingUser({
                                  ...editingUser,
                                  location: e.target.value,
                                })
                              }
                              className="w-full p-2 border rounded-md"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Website
                            </label>
                            <input
                              type="url"
                              value={editingUser.website}
                              onChange={(e) =>
                                setEditingUser({
                                  ...editingUser,
                                  website: e.target.value,
                                })
                              }
                              className="w-full p-2 border rounded-md"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Privacy Setting
                            </label>
                            <select
                              value={editingUser.privacy_setting}
                              onChange={(e) =>
                                setEditingUser({
                                  ...editingUser,
                                  privacy_setting: e.target.value as
                                    | "public"
                                    | "private",
                                })
                              }
                              className="w-full p-2 border rounded-md"
                            >
                              <option value="public">Public</option>
                              <option value="private">Private</option>
                            </select>
                          </div>

                          <div className="flex space-x-3">
                            <Button type="submit">Save Changes</Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsEditingProfile(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "followers":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Followers ({followers.length})</CardTitle>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentView("profile")}
                  >
                    Back to Profile
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {followers.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No followers yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {followers.map((followerId) => {
                      const follower = allUsers.find(
                        (u) => u.id === followerId
                      );
                      if (!follower) return null;
                      return (
                        <div
                          key={followerId}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              {follower.avatar_url ? (
                                <img
                                  src={follower.avatar_url}
                                  alt={follower.full_name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-medium">
                                  {follower.full_name.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium">
                                {follower.username}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {follower.full_name}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {isFollowing(follower.id) ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUnfollowUser(follower.id)}
                                disabled={loading[`unfollow_${follower.id}`]}
                              >
                                {loading[`unfollow_${follower.id}`]
                                  ? "Unfollowing..."
                                  : "Unfollow"}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleFollowUser(follower.id)}
                                disabled={loading[`follow_${follower.id}`]}
                              >
                                {loading[`follow_${follower.id}`]
                                  ? "Following..."
                                  : "Follow Back"}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "following":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Following ({following.length})</CardTitle>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentView("profile")}
                  >
                    Back to Profile
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {following.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Not following anyone yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {following.map((followingId) => {
                      const followedUser = allUsers.find(
                        (u) => u.id === followingId
                      );
                      if (!followedUser) return null;
                      return (
                        <div
                          key={followingId}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              {followedUser.avatar_url ? (
                                <img
                                  src={followedUser.avatar_url}
                                  alt={followedUser.full_name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-medium">
                                  {followedUser.full_name.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium">
                                {followedUser.username}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {followedUser.full_name}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnfollowUser(followedUser.id)}
                            disabled={loading[`unfollow_${followedUser.id}`]}
                          >
                            {loading[`unfollow_${followedUser.id}`]
                              ? "Unfollowing..."
                              : "Unfollow"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            {/* Welcome Section */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-blue-800">
                      Welcome back, {user?.username}!
                    </h2>
                    <p className="text-blue-600 mt-1">
                      Ready to connect and share today?
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-blue-600">Member since</div>
                    <div className="font-semibold text-blue-800">
                      {user && new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {user?.posts_count || 0}
                  </div>
                  <div className="text-sm text-gray-600">Your Posts</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {user?.followers_count || 0}
                  </div>
                  <div className="text-sm text-gray-600">Followers</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {user?.following_count || 0}
                  </div>
                  <div className="text-sm text-gray-600">Following</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {notifications.filter((n) => !n.is_read).length}
                  </div>
                  <div className="text-sm text-gray-600">
                    Unread Notifications
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">
                  What would you like to do?
                </CardTitle>
                <CardDescription>
                  Choose a feature below to get started with SocialConnect
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => {
                      setCurrentView("feed");
                      loadFeed();
                    }}
                    className="p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left group"
                  >
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                      📰
                    </div>
                    <h3 className="font-semibold text-blue-800 mb-2">
                      News Feed
                    </h3>
                    <p className="text-sm text-blue-600">
                      See the latest posts from your network and discover new
                      content
                    </p>
                    <div className="text-xs text-blue-500 mt-2">
                      {posts.length} posts loaded
                    </div>
                  </button>

                  <button
                    onClick={() => setCurrentView("create")}
                    className="p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left group"
                  >
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                      ✏️
                    </div>
                    <h3 className="font-semibold text-green-800 mb-2">
                      Create Posts
                    </h3>
                    <p className="text-sm text-green-600">
                      Share your thoughts, updates, and media with your
                      followers
                    </p>
                    <div className="text-xs text-green-500 mt-2">
                      Express yourself
                    </div>
                  </button>

                  <button
                    onClick={() => setCurrentView("social")}
                    className="p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left group"
                  >
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                      👥
                    </div>
                    <h3 className="font-semibold text-purple-800 mb-2">
                      Social Features
                    </h3>
                    <p className="text-sm text-purple-600">
                      Connect with friends, discover new people, and manage your
                      network
                    </p>
                    <div className="text-xs text-purple-500 mt-2">
                      Build connections
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            {posts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <CardDescription>
                    Your latest posts and interactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {posts
                      .filter((post) => post && post.id) // Filter out invalid posts
                      .slice(0, 2)
                      .map((post) => (
                        <div
                          key={post.id}
                          className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <button
                            onClick={() => handleViewProfile(post.author)}
                            className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold hover:bg-blue-600 transition-colors cursor-pointer"
                          >
                            {post.author?.username?.[0]?.toUpperCase() || "U"}
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewProfile(post.author)}
                                className="text-sm font-medium hover:text-blue-600 transition-colors cursor-pointer"
                              >
                                {post.author?.username}
                              </button>
                              <span className="text-xs text-gray-500">
                                {new Date(post.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm mt-1 text-gray-700">
                              {post.content.substring(0, 120)}
                              {post.content.length > 120 ? "..." : ""}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center space-x-3 text-xs text-gray-500">
                                <span>❤️ {post.like_count}</span>
                                <span>💬 {getPostCommentCount(post.id)}</span>
                              </div>
                              {user && post.author.id === user.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeletePost(post.id)}
                                  disabled={loading[`delete_${post.id}`]}
                                  className="text-red-500 hover:text-red-700 text-xs p-1 h-6"
                                >
                                  {loading[`delete_${post.id}`] ? "..." : "🗑️"}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="mt-4 text-center">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentView("feed")}
                    >
                      View All Posts
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-blue-600">
                SocialConnect
              </CardTitle>
              <CardDescription>
                Connect, share, and engage with your network
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showLogin && !showRegister ? (
                <div className="space-y-4">
                  <Button
                    onClick={() => {
                      setShowLogin(true);
                      setLoginError(null);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setShowRegister(true);
                      setRegisterError(null);
                    }}
                  >
                    Create Account
                  </Button>
                </div>
              ) : showLogin ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  {loginError && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                      {loginError}
                    </div>
                  )}
                  <Input
                    type="text"
                    placeholder="Username"
                    value={credentials.username}
                    onChange={(e) =>
                      setCredentials({
                        ...credentials,
                        username: e.target.value,
                      })
                    }
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={credentials.password}
                    onChange={(e) =>
                      setCredentials({
                        ...credentials,
                        password: e.target.value,
                      })
                    }
                    required
                  />
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Sign In
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowLogin(false);
                      setLoginError(null);
                    }}
                    className="w-full"
                  >
                    Back
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  {registerError && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                      {registerError}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="text"
                      placeholder="First Name"
                      value={registerData.first_name}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          first_name: e.target.value,
                        })
                      }
                      required
                    />
                    <Input
                      type="text"
                      placeholder="Last Name"
                      value={registerData.last_name}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          last_name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <Input
                    type="text"
                    placeholder="Username"
                    value={registerData.username}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        username: e.target.value,
                      })
                    }
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={registerData.email}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={registerData.password}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        password: e.target.value,
                      })
                    }
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Confirm Password"
                    value={registerData.password_confirm}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        password_confirm: e.target.value,
                      })
                    }
                    required
                  />
                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Create Account
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowRegister(false);
                      setRegisterError(null);
                    }}
                    className="w-full"
                  >
                    Back
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Network Status Indicator */}
      {errors.network && (
        <div className="bg-yellow-100 border-b border-yellow-200 px-4 py-2 text-center text-sm text-yellow-800">
          {errors.network}
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">
                SocialConnect
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant={currentView === "dashboard" ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentView("dashboard")}
              >
                Dashboard
              </Button>
              <Button
                variant={currentView === "feed" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setCurrentView("feed");
                  loadFeed();
                }}
              >
                Feed
              </Button>
              <Button
                variant={currentView === "create" ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentView("create")}
              >
                Create
              </Button>
              <Button
                variant={currentView === "social" ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentView("social")}
              >
                Social
              </Button>
              <div className="relative">
                <Button
                  variant={
                    currentView === "notifications" ? "default" : "ghost"
                  }
                  size="sm"
                  onClick={() => {
                    setCurrentView("notifications");
                    loadNotifications();
                  }}
                >
                  🔔
                </Button>
                {notifications.filter((n) => !n.is_read).length > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {notifications.filter((n) => !n.is_read).length}
                  </Badge>
                )}
              </div>
              <span className="text-sm text-gray-700">
                Welcome, {user.username}!
              </span>
              {(user.username === "admin" ||
                user.username.includes("admin") ||
                user.email.includes("admin")) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("/admin", "_blank")}
                  className="text-purple-600 border-purple-600 hover:bg-purple-50 text-sm"
                >
                  🛠️ Admin Panel
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleLogout}
                className="text-sm"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Network Status Banner */}
        {errors.network && (
          <div className="mb-4 mx-4 sm:mx-0">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-800">{errors.network}</p>
                </div>
                <div className="ml-auto">
                  <button
                    onClick={() =>
                      setErrors((prev) => ({ ...prev, network: "" }))
                    }
                    className="text-amber-800 hover:text-amber-900"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 py-6 sm:px-0">{renderDashboardContent()}</div>
      </main>

      {/* View Profile Modal - Available in all views */}
      {isViewingProfile && viewingUser && (
        <ViewProfileModal
          user={viewingUser}
          posts={viewingUserPosts}
          isOpen={isViewingProfile}
          onClose={handleCloseViewProfile}
        />
      )}

      {/* Styled Dialog */}
      <Dialog
        open={dialogState.isOpen}
        onOpenChange={() =>
          setDialogState((prev) => ({ ...prev, isOpen: false }))
        }
      >
        <DialogContent className="sm:max-w-lg bg-white rounded-xl shadow-2xl border-0 p-0 overflow-hidden">
          <div
            className={`px-6 py-4 border-b ${
              dialogState.type === "error"
                ? "bg-red-50 border-red-200"
                : dialogState.type === "confirm"
                ? "bg-amber-50 border-amber-200"
                : "bg-blue-50 border-blue-200"
            }`}
          >
            <DialogHeader>
              <DialogTitle
                className={`text-lg font-semibold flex items-center gap-2 ${
                  dialogState.type === "error"
                    ? "text-red-700"
                    : dialogState.type === "confirm"
                    ? "text-amber-700"
                    : "text-blue-700"
                }`}
              >
                {dialogState.type === "error" && (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {dialogState.type === "confirm" && (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {dialogState.type === "info" && (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {dialogState.title}
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="px-6 py-6">
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
              {dialogState.message}
            </p>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
            {dialogState.type === "confirm" ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogState((prev) => ({ ...prev, isOpen: false }));
                    if (dialogState.onCancel) dialogState.onCancel();
                  }}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 px-4 py-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setDialogState((prev) => ({ ...prev, isOpen: false }));
                    if (dialogState.onConfirm) dialogState.onConfirm();
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 shadow-md transition-all duration-200"
                >
                  Confirm
                </Button>
              </>
            ) : (
              <Button
                onClick={() =>
                  setDialogState((prev) => ({ ...prev, isOpen: false }))
                }
                className={`px-6 py-2 shadow-md transition-all duration-200 ${
                  dialogState.type === "error"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                OK
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
