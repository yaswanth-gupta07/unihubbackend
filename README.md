# UniHub - University Student Platform

**UniHub** is a comprehensive mobile application platform designed specifically for university students. It combines two main modules: **UniLancer** (freelancing platform) and **UniMarket** (marketplace for buying/selling products). The platform connects students within the same university, enabling them to find freelance work, post jobs, buy and sell items, and build a community.

---

## 📱 What is UniHub?

UniHub is a dual-purpose platform that serves university students:

### 🎯 UniLancer Module
- **For Clients**: Post jobs and find freelancers for projects (web development, design, writing, tutoring, etc.)
- **For Freelancers**: Browse available jobs, submit proposals, and manage your work portfolio
- **Job Management**: Track job status (OPEN → IN_PROGRESS → COMPLETED → CLOSED)
- **Application System**: Freelancers can apply to jobs, clients can review and select applicants

### 🛒 UniMarket Module
- **Buy & Sell**: Marketplace for students to buy and sell items within their university
- **Categories**: Electronics, Books & Study, Room Essentials, Fashion, Transport, Sports & Fitness, Kitchen, and more
- **Product Management**: Post items with images, descriptions, and pricing
- **Interest System**: Buyers can show interest in products and contact sellers
- **Wishlist**: Save favorite products for later

### 🔐 Key Features
- **OTP-Based Authentication**: Secure login without passwords using email OTP
- **University-Based Filtering**: All content is filtered by university - students only see jobs/products from their own university
- **Image Upload**: Cloudinary integration for product and profile images
- **Email Notifications**: OTP emails, job application notifications, and product interest alerts
- **Cross-Platform**: Flutter app works on iOS, Android, and Web

---

## 🏗️ Architecture

This is a **full-stack application** with:

- **Backend**: Node.js + Express.js REST API
- **Frontend**: Flutter mobile app (iOS, Android, Web)
- **Database**: MongoDB with Mongoose ODM
- **Image Storage**: Cloudinary
- **Authentication**: JWT tokens
- **Email Service**: Nodemailer (Gmail SMTP)

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Backend Requirements
- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier)
- **npm** (comes with Node.js)

### Frontend Requirements
- **Flutter SDK** (v3.0 or higher) - [Installation Guide](https://docs.flutter.dev/get-started/install)
- **Dart** (comes with Flutter)
- **Android Studio** (for Android development) or **Xcode** (for iOS development, macOS only)
- **VS Code** or **Android Studio** with Flutter extensions

### Accounts Needed
- **Gmail Account** (for email service)
- **Cloudinary Account** (free tier available) - [Sign Up](https://cloudinary.com/users/register/free)

---

## 🚀 Quick Start Guide

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd final
```

### Step 2: Backend Setup

#### 2.1 Install Backend Dependencies

```bash
npm install
```

#### 2.2 Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Copy the example (if available) or create manually
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
# For MongoDB Atlas (Cloud - Recommended):
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/unihub?retryWrites=true&w=majority
# OR for local development (fallback if MONGO_URI not set):
# MONGO_URI=mongodb://127.0.0.1:27017/unihub

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=your_email@gmail.com

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

#### 2.3 Gmail App Password Setup

1. Go to your Google Account settings
2. Enable **2-Step Verification**
3. Go to **App Passwords**: [Manage App Passwords](https://myaccount.google.com/apppasswords)
4. Generate a new app password for "Mail"
5. Copy the 16-character password and use it in `EMAIL_PASS`

#### 2.4 Cloudinary Setup

1. Sign up at [Cloudinary](https://cloudinary.com/users/register/free)
2. Go to Dashboard → Settings
3. Copy your:
   - Cloud Name
   - API Key
   - API Secret
4. Add them to your `.env` file

#### 2.5 Start MongoDB

**Local MongoDB:**
```bash
# Windows
net start MongoDB

# macOS/Linux
mongod
```

**OR use MongoDB Atlas** (cloud - no local installation needed)

#### 2.6 Start the Backend Server

```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

You should see:
```
✅ MongoDB connected
✅ Email transporter verified
🚀 Server running on port 5000
```

---

### Step 3: Frontend Setup

#### 3.1 Install Flutter Dependencies

```bash
# Navigate to project root (where pubspec.yaml is located)
flutter pub get
```

#### 3.2 Configure API Base URL

The Flutter app automatically detects the platform and uses the correct API URL:
- **Web**: `http://localhost:5000/api`
- **Android Emulator**: `http://10.0.2.2:5000/api`
- **iOS Simulator**: `http://localhost:5000/api`
- **Physical Device**: Requires IP configuration (see below)

#### 3.3 For Physical Mobile Devices

If testing on a **physical phone**, you need to set your computer's IP address:

1. **Find your computer's IP address:**
   - **Windows**: Open CMD → `ipconfig` → Look for "IPv4 Address"
   - **Mac/Linux**: Open Terminal → `ifconfig` → Look for "inet"

2. **Update `lib/services/api_service.dart`:**
   ```dart
   // Line 14: Change from null to your IP
   static const String? _customIpAddress = '192.168.1.100'; // Your IP here
   ```

3. **Ensure same WiFi network**: Phone and computer must be on the same WiFi

See `MOBILE_SETUP.md` for detailed instructions.

#### 3.4 Run the Flutter App

```bash
# Check connected devices
flutter devices

# Run on connected device/emulator
flutter run

# Run on specific device
flutter run -d <device-id>

# Run on web
flutter run -d chrome

# Run on Android
flutter run -d android

# Run on iOS (macOS only)
flutter run -d ios
```

---

## 📦 Dependencies

### Backend Dependencies (`package.json`)

#### Production Dependencies
```json
{
  "bcryptjs": "^2.4.3",              // Password hashing (if needed)
  "cloudinary": "^1.41.3",            // Image upload and storage
  "cors": "^2.8.5",                   // Cross-Origin Resource Sharing
  "dotenv": "^16.3.1",                // Environment variables
  "express": "^4.18.2",               // Web framework
  "jsonwebtoken": "^9.0.2",           // JWT authentication
  "mongoose": "^7.5.0",               // MongoDB ODM
  "multer": "^2.0.2",                 // File upload middleware
  "multer-storage-cloudinary": "^4.0.0", // Cloudinary storage for Multer
  "nodemailer": "^6.9.4"              // Email service
}
```

#### Development Dependencies
```json
{
  "nodemon": "^3.0.1"                 // Auto-restart server on changes
}
```

### Frontend Dependencies (Flutter - `pubspec.yaml`)

Based on the codebase, the main dependencies include:

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # HTTP Requests
  http: ^1.1.0
  
  # HTTP Parser (for multipart uploads)
  http_parser: ^4.0.2
  
  # Image Picker
  image_picker: ^1.0.0
  
  # Shared Preferences (for local storage)
  shared_preferences: ^2.2.0
  
  # Other Flutter packages as needed
```

**Note**: Check `pubspec.yaml` in your project for the exact versions.

---

## 📁 Project Structure

```
final/
├── Backend (Node.js)
│   ├── server.js                 # Main server file
│   ├── package.json              # Backend dependencies
│   ├── .env                      # Environment variables (not in git)
│   │
│   ├── config/
│   │   ├── db.js                 # MongoDB connection
│   │   ├── mail.js               # Email configuration
│   │   └── cloudinary.js         # Cloudinary configuration
│   │
│   ├── models/
│   │   ├── User.js               # User model
│   │   ├── Job.js                # Job model
│   │   ├── Application.js        # Job application model
│   │   ├── Product.js            # Product model
│   │   ├── BuyerInterest.js      # Product interest model
│   │   ├── Review.js             # Review model
│   │   └── Otp.js                # OTP model
│   │
│   ├── controllers/
│   │   ├── auth.controller.js    # Authentication logic
│   │   ├── user.controller.js    # User management
│   │   ├── job.controller.js     # Job management
│   │   ├── application.controller.js # Application management
│   │   ├── product.controller.js # Product management
│   │   ├── buyerInterest.controller.js # Buyer interest
│   │   └── review.controller.js  # Review management
│   │
│   ├── routes/
│   │   ├── auth.routes.js        # Auth endpoints
│   │   ├── user.routes.js        # User endpoints
│   │   ├── job.routes.js         # Job endpoints
│   │   ├── application.routes.js  # Application endpoints
│   │   ├── product.routes.js     # Product endpoints
│   │   ├── review.routes.js      # Review endpoints
│   │   └── upload.routes.js      # Image upload endpoints
│   │
│   ├── middleware/
│   │   └── auth.middleware.js    # JWT authentication middleware
│   │
│   └── utils/
│       ├── generateOtp.js        # OTP generation
│       └── sendEmail.js          # Email sending utility
│
└── Frontend (Flutter)
    └── lib/
        ├── main.dart             # App entry point
        │
        ├── auth/
        │   ├── signin_screen.dart      # Login screen
        │   ├── otp_verification_screen.dart # OTP verification
        │   └── terms_and_privacy_screen.dart
        │
        ├── onboarding/
        │   └── onboarding_screen.dart  # Onboarding flow
        │
        ├── splash/
        │   └── splash_screen.dart      # Splash screen
        │
        ├── services/
        │   ├── api_service.dart        # API client
        │   ├── auth_service.dart       # Auth service
        │   ├── user_service.dart       # User service
        │   ├── job_service.dart        # Job service
        │   ├── application_service.dart # Application service
        │   ├── product_service.dart    # Product service
        │   ├── review_service.dart     # Review service
        │   └── storage_service.dart    # Local storage
        │
        ├── unilancer/                  # UniLancer Module
        │   ├── client/
        │   │   ├── client_dashboard.dart
        │   │   ├── managejobs.dart
        │   │   └── PostNewJob.dart
        │   ├── freelancer/
        │   │   ├── freelancer_dashboard.dart
        │   │   ├── FindJobs.dart
        │   │   ├── JobDetails.dart
        │   │   ├── SubmitProposal.dart
        │   │   └── MyWork.dart
        │   └── profile/
        │       └── profile_page.dart
        │
        └── unimarket/                  # UniMarket Module
            ├── main.dart
            ├── home_page.dart
            ├── CategoryDetails_Page.dart
            ├── ItemDetails_page.dart
            ├── postitem/
            │   └── post_page.dart
            ├── profile/
            │   ├── profile_page.dart
            │   └── edit_product_page.dart
            └── wishlist/
                ├── wishlist_page.dart
                └── wishlist_service.dart
```

---

## 🔌 API Endpoints

### Authentication (Public)
- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/verify-otp` - Verify OTP and get JWT token

### User (Protected)
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update user profile

### Jobs (Protected)
- `POST /api/jobs` - Create a new job
- `GET /api/jobs` - Get job feed (freelancer view)
- `GET /api/jobs/my` - Get my jobs (client view)
- `GET /api/jobs/:id` - Get job by ID
- `PUT /api/jobs/:id/start` - Start job (assign freelancer)
- `PUT /api/jobs/:id/complete` - Mark job as completed
- `PUT /api/jobs/:id/confirm` - Confirm job completion (freelancer)

### Applications (Protected)
- `POST /api/applications` - Apply for a job
- `GET /api/applications/freelancer` - Get my applications (freelancer)
- `GET /api/applications/client` - Get applications for my jobs (client)

### Products (Protected)
- `POST /api/products` - Create a new product
- `GET /api/products` - Get product feed
- `GET /api/products/my` - Get my products
- `GET /api/products/:id` - Get product by ID
- `PUT /api/products/:id/reserve` - Reserve a product
- `PUT /api/products/:id/sold` - Mark product as sold
- `POST /api/products/:id/interest` - Show interest in product

### Upload (Protected)
- `POST /api/upload/image` - Upload image to Cloudinary

### Reviews (Protected)
- `POST /api/reviews` - Create a review
- `GET /api/reviews` - Get reviews

---

## 🔐 Authentication Flow

1. User enters email → `POST /api/auth/send-otp`
2. Backend generates 6-digit OTP and emails it
3. User submits OTP → `POST /api/auth/verify-otp`
4. Backend verifies OTP and returns JWT token
5. User uses JWT token for all subsequent requests:
   ```
   Authorization: Bearer <your_jwt_token>
   ```

---

## 🎯 Key Features Explained

### 1. University-Based Filtering
All data (jobs, products) is automatically filtered by the user's university. Users can only see and interact with content from their own university, ensuring a safe and relevant experience.

### 2. Job Lifecycle (UniLancer)
- **OPEN**: Job is accepting applications
- **IN_PROGRESS**: Client selected a freelancer
- **COMPLETED**: Client marked job as done
- **CLOSED**: Freelancer confirmed completion

### 3. Product Status (UniMarket)
- **AVAILABLE**: Product is available for purchase
- **RESERVED**: Product is reserved by a buyer
- **SOLD**: Product has been sold

### 4. Image Upload
- Images are uploaded to Cloudinary
- Supports JPG, JPEG, PNG, WEBP, GIF formats
- Maximum file size: 5MB
- Images are automatically resized and optimized

---

## 🐛 Troubleshooting

### Backend Issues

**MongoDB Connection Error**
- Ensure MongoDB is running: `mongod` (for local) or check MongoDB Atlas connection string (for cloud)
- Verify `MONGO_URI` in `.env` is correct
- For MongoDB Atlas, ensure your IP is whitelisted in Network Access settings

**Email Not Sending**
- Check Gmail app password is correct
- Ensure 2-Step Verification is enabled
- Verify `EMAIL_USER` and `EMAIL_PASS` in `.env`

**Cloudinary Upload Fails**
- Verify Cloudinary credentials in `.env`
- Check file size (max 5MB)
- Ensure file format is supported (jpg, jpeg, png, webp, gif)

**Port Already in Use**
- Change `PORT` in `.env` to a different port (e.g., 5001)
- Or kill the process using port 5000

### Frontend Issues

**Cannot Connect to Backend**
- Ensure backend server is running
- Check API base URL in `lib/services/api_service.dart`
- For physical devices, set `_customIpAddress` correctly
- Verify phone and computer are on same WiFi network

**Images Not Showing**
- Check Cloudinary configuration
- Verify image URLs are HTTPS
- Check browser/device console for errors

**Build Errors**
- Run `flutter clean` then `flutter pub get`
- Ensure Flutter SDK is up to date: `flutter upgrade`
- Check for dependency conflicts in `pubspec.yaml`

---

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `MONGO_URI` | MongoDB connection string (cloud or local) | `mongodb+srv://user:pass@cluster.mongodb.net/unihub` |
| `JWT_SECRET` | Secret key for JWT tokens | `your_secret_key_here` |
| `JWT_EXPIRES_IN` | JWT token expiration | `7d` |
| `EMAIL_HOST` | SMTP server | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | Email username | `your_email@gmail.com` |
| `EMAIL_PASS` | Email app password | `your_app_password` |
| `EMAIL_FROM` | From email address | `your_email@gmail.com` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `your_api_key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your_api_secret` |

---

## 🚀 Production Deployment

### Backend Deployment

1. **Use Environment Variables**: Never commit `.env` file
2. **Use Strong JWT Secret**: Generate a random, secure secret
3. **Use MongoDB Atlas**: Managed MongoDB service
4. **Use Production Email Service**: Consider SendGrid, AWS SES, or similar
5. **Enable HTTPS**: Use reverse proxy (Nginx) with SSL certificate
6. **Set NODE_ENV**: Set to `production` for optimized performance

### Frontend Deployment

1. **Build for Production**:
   ```bash
   # Android
   flutter build apk --release
   
   # iOS
   flutter build ios --release
   
   # Web
   flutter build web --release
   ```

2. **Update API URL**: Change base URL to production server
3. **Enable Obfuscation**: For release builds
4. **Test Thoroughly**: Test on real devices before release

---

## 📄 License

ISC

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📞 Support

For issues, questions, or contributions, please open an issue on the repository.

---

## 🎓 Built For Students, By Students

UniHub is designed to make university life easier by connecting students within the same campus. Whether you need freelance work, want to sell your old textbooks, or buy a bike from a graduating senior, UniHub makes it all possible in one convenient platform.

**Happy Coding! 🚀**
