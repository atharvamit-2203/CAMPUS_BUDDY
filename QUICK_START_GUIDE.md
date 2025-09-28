# 🎓 Campus Connect - Quick Start Guide

Welcome to Campus Connect! This guide will help you set up and run the complete campus management system with all advanced features.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download here](https://python.org/)
- **PostgreSQL** (v12 or higher) - [Download here](https://postgresql.org/)
- **Git** - [Download here](https://git-scm.com/)

## 🚀 Quick Setup (5 minutes)

### Step 1: Database Setup

1. **Create Database**
   ```sql
   -- Connect to PostgreSQL as superuser
   psql -U postgres
   
   -- Create database and user
   CREATE DATABASE campus_connect;
   CREATE USER campus_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE campus_connect TO campus_user;
   ```

2. **Run Database Setup Script**
   ```powershell
   # Navigate to backend directory
   cd backend
   
   # Run the PowerShell setup script
   .\setup_database.ps1 -DBPassword "your_password"
   ```

### Step 2: Backend Setup

1. **Install Python Dependencies**
   ```powershell
   # Install required packages
   pip install -r requirements.txt
   ```

2. **Configure Environment**
   ```powershell
   # Create .env file
   echo "DATABASE_URL=postgresql://campus_user:your_password@localhost:5432/campus_connect" > .env
   echo "SECRET_KEY=your_secret_key_here" >> .env
   echo "JWT_SECRET=your_jwt_secret_here" >> .env
   ```

3. **Start Backend Server**
   ```powershell
   python main.py
   ```
   Backend will be available at: http://localhost:8000

### Step 3: Frontend Setup

1. **Install Dependencies**
   ```powershell
   # Navigate to frontend directory
   cd ../frontend
   
   # Install packages
   npm install
   ```

2. **Start Development Server**
   ```powershell
   npm run dev
   ```
   Frontend will be available at: http://localhost:3000

## 🎯 Test the System

### Default Login Credentials

**Students:**
- Email: `student1@nmims.edu` | Password: `password123`
- Email: `student2@nmims.edu` | Password: `password123`

**Faculty:**
- Email: `faculty1@nmims.edu` | Password: `password123`
- Email: `faculty2@nmims.edu` | Password: `password123`

**Organizations:**
- Email: `techclub@nmims.edu` | Password: `password123`

### Key Features to Test

1. **Student Dashboard**
   - ✅ Canteen ordering with cart management
   - ✅ Detailed weekly timetable
   - ✅ Resource access
   - ✅ QR code generation for orders

2. **Teacher Dashboard**
   - ✅ Timetable management
   - ✅ Extra class scheduling
   - ✅ Room booking
   - ✅ Student notifications

3. **Organization Dashboard**
   - ✅ Event management
   - ✅ Member recruitment
   - ✅ Resource booking

## 🔧 Advanced Configuration

### Environment Variables (.env)

```env
# Database
DATABASE_URL=postgresql://campus_user:password@localhost:5432/campus_connect
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campus_connect
DB_USER=campus_user
DB_PASSWORD=your_password

# Security
SECRET_KEY=your-super-secret-key-here
JWT_SECRET=your-jwt-secret-key-here
JWT_EXPIRE_HOURS=24

# Features
ENABLE_QR_CODES=true
ENABLE_NOTIFICATIONS=true
ENABLE_ANALYTICS=true

# Payment (for future integration)
PAYMENT_GATEWAY_URL=https://api.payment-gateway.com
PAYMENT_API_KEY=your_payment_api_key

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

## 📊 Database Schema Overview

The system includes 20+ tables supporting:

- **User Management**: Students, Faculty, Organizations
- **Academic System**: Courses, Subjects, Timetables
- **Canteen System**: Menu, Orders, QR Codes
- **Booking System**: Rooms, Extra Classes
- **Notification System**: Real-time alerts
- **Analytics**: Usage statistics and reporting

## 🔌 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### Canteen Management
- `GET /api/v2/canteen/menu` - Get menu items
- `POST /api/v2/canteen/orders` - Create order
- `GET /api/v2/canteen/orders/{order_id}` - Get order details
- `POST /api/v2/canteen/scan-qr` - Scan QR code

### Room Booking
- `GET /api/v2/rooms` - Get available rooms
- `POST /api/v2/rooms/book` - Book a room
- `GET /api/v2/rooms/bookings` - Get user bookings

### Timetable Management
- `GET /api/v2/timetable` - Get user timetable
- `POST /api/v2/timetable/update` - Update schedule (faculty only)
- `POST /api/v2/extra-classes` - Schedule extra class

### Notifications
- `GET /api/v2/notifications` - Get user notifications
- `POST /api/v2/notifications/mark-read` - Mark as read

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```
   Error: could not connect to server
   ```
   **Solution**: Ensure PostgreSQL is running and credentials are correct

2. **Port Already in Use**
   ```
   Error: Port 3000 is already in use
   ```
   **Solution**: Kill the process or use a different port
   ```powershell
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

3. **Module Not Found**
   ```
   Error: Cannot find module 'xyz'
   ```
   **Solution**: Reinstall dependencies
   ```powershell
   npm install  # or pip install -r requirements.txt
   ```

### Database Reset

If you need to reset the database:

```powershell
# Drop and recreate database
psql -U postgres -c "DROP DATABASE campus_connect;"
psql -U postgres -c "CREATE DATABASE campus_connect;"

# Re-run setup
.\setup_database.ps1
```

## 📈 Performance Tips

1. **Database Optimization**
   - Indexes are already created for optimal performance
   - Use connection pooling for production

2. **Frontend Optimization**
   - Images are optimized with Next.js Image component
   - API calls are cached where appropriate

3. **Backend Optimization**
   - FastAPI provides automatic API documentation
   - Async/await is used for database operations

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Pydantic models for API validation
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Proper cross-origin setup

## 📱 Mobile Responsiveness

The system is fully responsive and works on:
- 📱 Mobile devices (phones)
- 📱 Tablets 
- 💻 Laptops
- 🖥️ Desktop computers

## 🎨 UI Features

- **Consistent Design**: Unified color scheme across all dashboards
- **Interactive Elements**: Hover effects, smooth transitions
- **Real-time Updates**: Live notifications and status updates
- **Accessibility**: Keyboard navigation and screen reader support

## 📞 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the console logs for specific error messages
3. Verify all prerequisites are installed correctly
4. Ensure all environment variables are set properly

## 🚀 Production Deployment

For production deployment:

1. Use environment-specific configurations
2. Set up proper SSL certificates
3. Configure production database with backups
4. Set up monitoring and logging
5. Use a process manager like PM2 for Node.js
6. Configure reverse proxy (nginx/Apache)

---

**🎉 Congratulations!** You now have a fully functional campus management system with advanced features like QR code ordering, room booking, and real-time notifications!

Happy coding! 🎓✨
