# SocialConnect - Complete Social Media Platform

A comprehensive social media platform built with Django REST Framework backend and Next.js frontend.

## 🚀 Features

### ✅ Backend (Django REST Framework)

- **Authentication**: JWT-based login/register/logout with token refresh
- **User Management**: Custom user model with profiles, avatars, privacy settings
- **Posts System**: Create, read, update, delete posts with images and categories
- **Social Features**: Follow/unfollow users, like posts, comment system
- **Notifications**: Real-time notifications for social interactions
- **File Upload**: Profile pictures and post images
- **Admin Interface**: Django admin with custom views
- **API Documentation**: Complete REST API with proper endpoints

### ✅ Frontend (Next.js + TypeScript)

- **Modern Stack**: Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **Authentication Flow**: Complete login/register with JWT handling
- **Responsive Design**: Beautiful UI with Tailwind CSS and Radix UI components
- **Real-time Features**: Live notifications and social interactions
- **Admin Panel**: Comprehensive admin interface for managing users and posts
- **Offline Support**: Local storage fallback for offline functionality
- **Error Handling**: Graceful error handling with user feedback

## 🏗️ Project Structure

```
SocialConnect/
├── Backend/                 # Django REST API
│   ├── project/            # Main Django settings
│   ├── accounts/           # User management & authentication
│   ├── posts/              # Posts & comments system
│   ├── social/             # Follow/like system
│   ├── notifications/      # Notification system
│   ├── utils/              # Utility functions
│   ├── manage.py           # Django management script
│   └── requirements.txt    # Python dependencies
│
└── Frontend/               # Next.js React application
    ├── src/app/            # App Router pages
    ├── src/components/     # Reusable UI components
    ├── src/lib/            # API client & utilities
    ├── src/types/          # TypeScript type definitions
    ├── package.json        # Node.js dependencies
    └── tailwind.config.ts  # Tailwind CSS configuration
```

## 🛠️ Setup Instructions

### Backend Setup (Django)

1. **Navigate to Backend directory:**

   ```bash
   cd Backend
   ```

2. **Install Python dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

3. **Run database migrations:**

   ```bash
   python manage.py migrate
   ```

4. **Create admin user:**

   ```bash
   python manage.py create_admin
   ```

   This creates an admin user with:

   - Username: `admin`
   - Email: `admin@socialconnect.com`
   - Password: `admin123`

5. **Create sample data (optional):**

   ```bash
   python manage.py create_sample_data
   ```

6. **Start the Django development server:**
   ```bash
   python manage.py runserver
   ```
   Backend will be available at: `http://127.0.0.1:8000`

### Frontend Setup (Next.js)

1. **Navigate to Frontend directory:**

   ```bash
   cd Frontend
   ```

2. **Install Node.js dependencies:**

   ```bash
   npm install
   ```

3. **Start the Next.js development server:**
   ```bash
   npm run dev
   ```
   Frontend will be available at: `http://localhost:3000`

## 🔧 Usage

### Main Application

1. Open `http://localhost:3000` in your browser
2. Register a new account or login with existing credentials
3. Explore features:
   - Create posts with text and images
   - Follow other users
   - Like and comment on posts
   - View notifications
   - Edit your profile

### Admin Panel

1. **Option 1 - Direct Access:**
   - Login as admin user on main app
   - Click "🛠️ Admin Panel" button in header
2. **Option 2 - Admin Login Page:**
   - Go to `http://localhost:3000/admin/login`
   - Login with admin credentials
3. **Admin Features:**
   - View dashboard with statistics
   - Manage users (view, delete)
   - Manage posts (view, delete)
   - Monitor notifications
   - System settings

### Django Admin Interface

- Access Django admin at: `http://127.0.0.1:8000/admin/`
- Login with admin credentials created above
- Manage all data models directly

## 🌐 API Endpoints

### Authentication

- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/token/refresh/` - Refresh JWT token
- `GET /api/users/me/` - Get current user

### Posts

- `GET /api/posts/` - List all posts
- `POST /api/posts/` - Create new post
- `GET /api/posts/{id}/` - Get specific post
- `PUT /api/posts/{id}/update/` - Update post
- `DELETE /api/posts/{id}/delete/` - Delete post
- `POST /api/posts/{id}/like/` - Like post
- `DELETE /api/posts/{id}/unlike/` - Unlike post

### Social Features

- `GET /api/users/` - List all users
- `GET /api/users/search/?q={query}` - Search users
- `POST /api/users/{id}/follow/` - Follow user
- `DELETE /api/users/{id}/unfollow/` - Unfollow user
- `GET /api/users/{id}/followers/` - Get user followers
- `GET /api/users/{id}/following/` - Get user following

### Notifications

- `GET /api/notifications/` - Get user notifications
- `POST /api/notifications/{id}/read/` - Mark notification as read
- `POST /api/notifications/mark-all-read/` - Mark all as read

## 🔑 Default Credentials

### Admin User

- **Username:** `admin`
- **Email:** `admin@socialconnect.com`
- **Password:** `admin123`

### Sample Users (if created)

- Various demo users created by the sample data command

## 🔄 Backend Integration

The frontend automatically detects backend availability:

- **✅ Backend Online:** All features work with real-time data
- **⚠️ Backend Offline:** App works in offline mode with cached/mock data
- **🔄 Auto-Retry:** Automatically reconnects when backend comes back online

## 🎨 Technologies Used

### Backend

- **Django 5.2.3** - Web framework
- **Django REST Framework** - API framework
- **djangorestframework-simplejwt** - JWT authentication
- **Pillow** - Image processing
- **django-cors-headers** - CORS handling

### Frontend

- **Next.js 15.5.2** - React framework
- **React 19.1.0** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Radix UI** - UI components
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Zod** - Schema validation

## 🚀 Production Deployment

### Backend (Django)

1. Set up PostgreSQL database
2. Configure environment variables
3. Collect static files: `python manage.py collectstatic`
4. Deploy to your preferred platform (Heroku, DigitalOcean, AWS, etc.)

### Frontend (Next.js)

1. Update `NEXT_PUBLIC_API_BASE_URL` to production backend URL
2. Build the application: `npm run build`
3. Deploy to Vercel, Netlify, or your preferred platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🎯 Future Enhancements

- Real-time chat system
- Advanced search and filtering
- Content moderation tools
- Mobile app (React Native)
- Email notifications
- OAuth social login
- Advanced analytics
- Content recommendations

---

**SocialConnect** - Built with ❤️ using Django REST Framework and Next.js
