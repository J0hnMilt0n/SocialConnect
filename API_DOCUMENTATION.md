# SocialConnect API Documentation

A comprehensive social media backend application using Django REST Framework.

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Posts](#posts)
4. [Social Features](#social-features)
5. [Notifications](#notifications)
6. [Admin Features](#admin-features)
7. [File Upload](#file-upload)

## Base URL

```
http://localhost:8000/api/
```

## Authentication

All endpoints except registration and login require JWT authentication.

Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Register

**POST** `/auth/register/`

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "password_confirm": "password123",
  "first_name": "John",
  "last_name": "Doe"
}
```

### Login

**POST** `/auth/login/`

```json
{
  "username_or_email": "john_doe",
  "password": "password123"
}
```

### Logout

**POST** `/auth/logout/`

```json
{
  "refresh_token": "<refresh_token>"
}
```

### Token Refresh

**POST** `/auth/token/refresh/`

```json
{
  "refresh": "<refresh_token>"
}
```

### Change Password

**POST** `/auth/change-password/`

```json
{
  "old_password": "oldpassword123",
  "new_password": "newpassword123",
  "new_password_confirm": "newpassword123"
}
```

### Password Reset

**POST** `/auth/password-reset/`

```json
{
  "email": "john@example.com"
}
```

## User Management

### Get Current User Profile

**GET** `/users/me/`

### Update Profile

**PUT/PATCH** `/users/me/update/`

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "bio": "Software developer and coffee enthusiast",
  "website": "https://johndoe.com",
  "location": "New York, NY",
  "privacy_setting": "public"
}
```

### Get User Profile

**GET** `/users/{user_id}/`

### List Users (Admin Only)

**GET** `/users/`

Query parameters:

- `search`: Search by username or name

### Deactivate User (Admin Only)

**POST** `/admin/users/{user_id}/deactivate/`

## Posts

### Create Post

**POST** `/posts/`

```json
{
  "content": "Just had an amazing day at the beach! 🌊",
  "image_url": "https://example.com/image.jpg",
  "category": "general"
}
```

### Get Post

**GET** `/posts/{post_id}/`

### Update Post

**PUT/PATCH** `/posts/{post_id}/update/`

```json
{
  "content": "Updated content",
  "category": "announcement"
}
```

### Delete Post

**DELETE** `/posts/{post_id}/delete/`

### List Posts

**GET** `/posts/list/`

Query parameters:

- `author`: Filter by author ID
- `category`: Filter by category
- `search`: Search in content

### Get User Feed

**GET** `/posts/feed/`

Returns posts from followed users and own posts in chronological order.

### Admin - List All Posts

**GET** `/posts/admin/`

Query parameters:

- `is_active`: Filter by active status

### Admin - Delete Any Post

**DELETE** `/posts/admin/{post_id}/delete/`

## Social Features

### Follow User

**POST** `/users/{user_id}/follow/`

### Unfollow User

**DELETE** `/users/{user_id}/unfollow/`

### Get User Followers

**GET** `/users/{user_id}/followers/`

### Get User Following

**GET** `/users/{user_id}/following/`

### Like Post

**POST** `/posts/{post_id}/like/`

### Unlike Post

**DELETE** `/posts/{post_id}/unlike/`

### Check Like Status

**GET** `/posts/{post_id}/like-status/`

### Get Post Comments

**GET** `/posts/{post_id}/comments/`

### Add Comment

**POST** `/posts/{post_id}/comments/`

```json
{
  "content": "Great post! Thanks for sharing."
}
```

### Delete Comment

**DELETE** `/comments/{comment_id}/delete/`

## Notifications

### Get Notifications

**GET** `/notifications/`

### Mark Notification as Read

**POST** `/notifications/{notification_id}/read/`

### Mark All Notifications as Read

**POST** `/notifications/mark-all-read/`

### Get Unread Count

**GET** `/notifications/unread-count/`

## File Upload

### Upload Image

**POST** `/upload/image/`

Form data:

- `image`: Image file (JPEG/PNG, max 2MB)

### Upload Avatar

**POST** `/upload/avatar/`

Form data:

- `avatar`: Avatar image file (JPEG/PNG, max 2MB)

## Admin Features

### Admin Statistics

**GET** `/admin/stats/`

Returns comprehensive statistics including:

- Total users, posts, likes, comments
- Today's activity
- Recent activity (last 7 days)
- Top users by followers
- Top posts by likes

## Response Format

### Success Response

```json
{
    "message": "Operation successful",
    "data": { ... }
}
```

### Error Response

```json
{
    "error": "Error message",
    "details": { ... }
}
```

### Validation Error Response

```json
{
  "field_name": ["Error message for this field"],
  "another_field": ["Another error message"]
}
```

## Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Permission denied
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Pagination

List endpoints support pagination with the following parameters:

- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)

Response format:

```json
{
    "count": 150,
    "next": "http://localhost:8000/api/posts/list/?page=2",
    "previous": null,
    "results": [ ... ]
}
```

## Models

### User

- `id`: Integer (Primary Key)
- `username`: String (Unique, 3-30 chars)
- `email`: String (Unique)
- `first_name`: String
- `last_name`: String
- `bio`: String (Max 160 chars)
- `avatar_url`: String (URL)
- `website`: String (URL)
- `location`: String
- `role`: String ('user' or 'admin')
- `privacy_setting`: String ('public', 'private', 'followers_only')
- `is_verified`: Boolean
- `followers_count`: Integer (Read-only)
- `following_count`: Integer (Read-only)
- `posts_count`: Integer (Read-only)
- `created_at`: DateTime
- `updated_at`: DateTime

### Post

- `id`: Integer (Primary Key)
- `content`: String (Max 280 chars)
- `author`: User (Foreign Key)
- `image_url`: String (URL, Optional)
- `category`: String ('general', 'announcement', 'question')
- `like_count`: Integer
- `comment_count`: Integer
- `is_active`: Boolean
- `created_at`: DateTime
- `updated_at`: DateTime

### Follow

- `id`: Integer (Primary Key)
- `follower`: User (Foreign Key)
- `following`: User (Foreign Key)
- `created_at`: DateTime

### Like

- `id`: Integer (Primary Key)
- `user`: User (Foreign Key)
- `post`: Post (Foreign Key)
- `created_at`: DateTime

### Comment

- `id`: Integer (Primary Key)
- `content`: String (Max 200 chars)
- `author`: User (Foreign Key)
- `post`: Post (Foreign Key)
- `is_active`: Boolean
- `created_at`: DateTime

### Notification

- `id`: Integer (Primary Key)
- `recipient`: User (Foreign Key)
- `sender`: User (Foreign Key)
- `notification_type`: String ('follow', 'like', 'comment')
- `post`: Post (Foreign Key, Optional)
- `message`: String
- `is_read`: Boolean
- `created_at`: DateTime
