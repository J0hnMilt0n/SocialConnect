# SocialConnect - Social Media Backend API

A comprehensive social media backend application built with Django REST Framework, featuring user authentication, posts, social interactions, real-time notifications, and admin management.

## 🚀 Features

### Core Functionality

- **JWT Authentication**: Secure login/register/logout system
- **User Profiles**: Customizable profiles with privacy settings
- **Content Creation**: Text posts with image upload support
- **Social Interactions**: Follow/unfollow, like posts, comment system
- **Personalized Feed**: Chronological feed from followed users
- **Real-time Notifications**: Live notifications using Supabase Real-Time
- **Admin Dashboard**: User and content management

### Key Highlights

- **RESTful API Design**: Clean, intuitive endpoints
- **Role-based Permissions**: User and Admin access levels
- **Image Upload**: Supabase Storage integration with fallback to local storage
- **Comprehensive Models**: Users, Posts, Follows, Likes, Comments, Notifications
- **Django Signals**: Automated notification creation
- **Pagination**: Efficient data loading
- **Error Handling**: Detailed error responses
- **Logging**: Comprehensive logging system

## 🛠️ Technology Stack

- **Backend**: Django 5.2.3, Django REST Framework
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Database**: PostgreSQL (Supabase) with SQLite fallback
- **Storage**: Supabase Storage for images
- **Real-time**: Supabase Real-Time Subscriptions
- **CORS**: django-cors-headers for frontend integration

## 📋 Prerequisites

- Python 3.8+
- PostgreSQL (optional - SQLite fallback available)
- Supabase account (optional - for PostgreSQL and Storage)

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd SocialConnect
```

### 2. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Environment Configuration

Create a `.env` file in the project root:

```env
# Django Configuration
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration (Optional - uses SQLite if not configured)
DATABASE_URL=postgresql://username:password@db.supabaseproject.co:5432/postgres
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_supabase_password
DB_HOST=db.supabaseproject.co
DB_PORT=5432

# Supabase Configuration (Optional)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
SUPABASE_STORAGE_BUCKET=socialconnect-media

# Email Configuration (Optional)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password

# JWT Configuration (Optional)
JWT_ACCESS_TOKEN_LIFETIME=60  # minutes
JWT_REFRESH_TOKEN_LIFETIME=7  # days
```

### 5. Database Setup

```bash
# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create admin user
python manage.py create_admin

# Create sample data (optional)
python manage.py create_sample_data --users 10 --posts 20
```

### 6. Run the Development Server

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`

## 📚 API Documentation

### Base URL

```
http://localhost:8000/api/
```

### Authentication

All endpoints (except registration/login) require JWT authentication:

```
Authorization: Bearer <access_token>
```

### Quick Start Endpoints

#### Authentication

- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/token/refresh/` - Refresh access token

#### User Management

- `GET /api/users/me/` - Get current user profile
- `PUT /api/users/me/update/` - Update profile
- `GET /api/users/{id}/` - Get user profile

#### Posts

- `POST /api/posts/` - Create post
- `GET /api/posts/list/` - List all posts
- `GET /api/posts/feed/` - Get personalized feed
- `GET /api/posts/{id}/` - Get specific post

#### Social Features

- `POST /api/users/{id}/follow/` - Follow user
- `DELETE /api/users/{id}/unfollow/` - Unfollow user
- `POST /api/posts/{id}/like/` - Like post
- `POST /api/posts/{id}/comments/` - Add comment

#### Notifications

- `GET /api/notifications/` - Get notifications
- `POST /api/notifications/mark-all-read/` - Mark all as read

For complete API documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## 🏗️ Project Structure

```
SocialConnect/
├── accounts/           # User management and authentication
│   ├── models.py      # Custom User model
│   ├── serializers.py # API serializers
│   ├── views.py       # Authentication views
│   ├── permissions.py # Custom permissions
│   └── urls.py        # Authentication URLs
├── posts/             # Post management
│   ├── models.py      # Post model
│   ├── serializers.py # Post serializers
│   ├── views.py       # Post CRUD views
│   └── urls.py        # Post URLs
├── social/            # Social features (Follow, Like, Comment)
│   ├── models.py      # Social interaction models
│   ├── serializers.py # Social serializers
│   ├── views.py       # Social interaction views
│   └── urls.py        # Social URLs
├── notifications/     # Real-time notifications
│   ├── models.py      # Notification model
│   ├── signals.py     # Django signals for auto-notifications
│   ├── views.py       # Notification views
│   └── urls.py        # Notification URLs
├── utils/             # Utilities and services
│   ├── storage.py     # Supabase storage service
│   ├── views.py       # Image upload views
│   └── admin_views.py # Admin statistics
├── project/           # Django project settings
│   ├── settings.py    # Main settings
│   └── urls.py        # Main URL configuration
└── manage.py          # Django management script
```

## 🔐 Authentication & Permissions

### User Roles

- **User** (default): Can create posts, follow users, like/comment
- **Admin**: All user permissions + user management and content moderation

### Privacy Settings

- **Public**: Profile visible to everyone
- **Private**: Profile visible only to user themselves
- **Followers Only**: Profile visible to followers only

### Permissions Matrix

| Feature                 | User | Admin |
| ----------------------- | ---- | ----- |
| Authentication          | ✅   | ✅    |
| Create/Edit Own Profile | ✅   | ✅    |
| Create/Delete Own Posts | ✅   | ✅    |
| Follow/Unfollow Users   | ✅   | ✅    |
| Like/Comment on Posts   | ✅   | ✅    |
| View Public Feeds       | ✅   | ✅    |
| User Management         | ❌   | ✅    |
| Delete Any Content      | ❌   | ✅    |
| View All Users List     | ❌   | ✅    |

## 🔄 Real-time Features

### Notification Types

1. **Follow Notifications**: When someone follows you
2. **Like Notifications**: When someone likes your post
3. **Comment Notifications**: When someone comments on your post

### Supabase Integration

The application includes optional Supabase Real-Time integration:

- Notifications are automatically created via Django signals
- Real-time updates can be implemented on the frontend using Supabase client
- Falls back gracefully if Supabase is not configured

## 📱 Frontend Integration

### CORS Configuration

CORS is pre-configured for common development URLs:

- `http://localhost:3000` (React)
- `http://localhost:8000` (Django)

### Example Frontend Usage (JavaScript)

```javascript
// Login
const response = await fetch("http://localhost:8000/api/auth/login/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    username_or_email: "john_doe",
    password: "password123",
  }),
});

const data = await response.json();
const accessToken = data.tokens.access;

// Make authenticated requests
const posts = await fetch("http://localhost:8000/api/posts/feed/", {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

## 🧪 Development Commands

### Create Admin User

```bash
python manage.py create_admin --username admin --email admin@example.com
```

### Generate Sample Data

```bash
python manage.py create_sample_data --users 20 --posts 50
```

### Database Operations

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Reset database
python manage.py flush
```

### Run Tests

```bash
python manage.py test
```

## 🚀 Deployment

### Environment Variables for Production

```env
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
SECRET_KEY=your-production-secret-key

# Use PostgreSQL in production
DATABASE_URL=postgresql://user:password@host:port/database

# Configure Supabase for file storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-production-key
```

### Deployment Checklist

- [ ] Set `DEBUG=False`
- [ ] Configure production database
- [ ] Set up Supabase for file storage
- [ ] Configure email backend for password reset
- [ ] Set secure `SECRET_KEY`
- [ ] Configure CORS for production domain
- [ ] Set up HTTPS
- [ ] Configure logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [API Documentation](API_DOCUMENTATION.md)
2. Review the Django logs: `debug.log`
3. Create an issue in the repository

## 🔮 Future Enhancements

- [ ] WebSocket integration for real-time chat
- [ ] Advanced search functionality
- [ ] Post categories and tags
- [ ] User blocking and reporting
- [ ] Content moderation tools
- [ ] Analytics dashboard
- [ ] Mobile app API endpoints
- [ ] Social media integrations
