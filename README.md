# Bill Management System

A comprehensive bill management system with user authentication, role-based access control, and admin dashboard.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (running locally or connection string)
- Git

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bill_management
   ```

2. **Start the system**
   ```bash
   ./start.sh
   ```

That's it! The system will automatically:
- Install all dependencies
- Start the backend server (port 5001)
- Start the frontend server (port 5173)
- Open the application in your browser

### 🛑 Stop the System
```bash
./stop.sh
```

## 📱 Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001
- **Health Check**: http://localhost:5001/api/health

## 👤 Default Login Credentials

### Admin Account
- **Email**: admin@example.com
- **Password**: admin123
- **Access**: Full system access, user management, analytics

### Operations Manager Account
- **Email**: manager@example.com
- **Password**: manager123
- **Access**: Report management, bill creation, user assignment

### Regular User Account
- **Email**: user@example.com
- **Password**: user123
- **Access**: View assigned bills, upload bills, analytics

## 🏗️ System Architecture

### Backend (Node.js + Express)
- **Port**: 5001
- **Database**: MongoDB
- **Authentication**: JWT tokens
- **File Upload**: Multer
- **API Documentation**: RESTful endpoints

### Frontend (React + Vite)
- **Port**: 5173
- **Framework**: React 18
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **State Management**: Context API

## 📁 Project Structure

```
bill_management/
├── backend/
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Authentication & validation
│   ├── uploads/         # File uploads
│   └── server.js        # Main server file
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page components
│   ├── context/         # React context
│   └── services/        # API services
├── start.sh             # Startup script
├── stop.sh              # Stop script
└── README.md            # This file
```

## 🔧 Manual Setup (Alternative)

If the automated scripts don't work, you can set up manually:

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Edit with your settings
node server.js
```

### Frontend Setup
```bash
npm install
npm run dev
```

## 🗄️ Database Setup

The system uses MongoDB. Make sure MongoDB is running:

### Local MongoDB
```bash
# Start MongoDB service
brew services start mongodb-community  # macOS
# or
sudo systemctl start mongod            # Linux
```

### MongoDB Atlas (Cloud)
Update the `MONGODB_URI` in `backend/.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bill_management
```

## 🔐 Environment Variables

Create `backend/.env` file:
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/bill_management
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

## 📊 Features

### User Management
- User registration and authentication
- Role-based access control (Admin, Operations Manager, User)
- User profile management
- Password hashing and security

### Bill Management
- Create, edit, and delete bills
- File upload and download
- Bill assignment to users
- Status tracking (Draft, Pending, Paid, Overdue)
- Category and priority management

### Admin Dashboard
- System statistics and analytics
- User management (view, edit, delete users)
- Reports and bills overview
- Detailed analytics with charts
- Search and filtering capabilities

### Report Management
- Create and manage reports
- File upload and download
- User assignment
- Status tracking
- Priority management

## 🐛 Troubleshooting

### Port Already in Use Error
If you get `EADDRINUSE` errors:
```bash
./stop.sh  # Stop all servers
./start.sh # Start fresh
```

### MongoDB Connection Issues
1. Ensure MongoDB is running
2. Check the connection string in `backend/.env`
3. Verify network connectivity

### Frontend Not Loading
1. Check if backend is running: `curl http://localhost:5001/api/health`
2. Check frontend logs: `tail -f frontend.log`
3. Restart: `./stop.sh && ./start.sh`

### Backend Errors
1. Check backend logs: `tail -f backend/server.log`
2. Verify environment variables
3. Check database connection

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Bills
- `GET /api/bills/my-bills` - Get user's bills
- `POST /api/bills` - Create new bill
- `GET /api/bills/:id` - Get bill details
- `PATCH /api/bills/:id/status` - Update bill status
- `DELETE /api/bills/:id` - Delete bill

### Admin
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/role` - Update user role
- `GET /api/admin/analytics` - Detailed analytics

## 🚀 Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use a strong JWT_SECRET
3. Configure production MongoDB
4. Set up proper CORS origins

### Security Considerations
- Change default passwords
- Use HTTPS in production
- Implement rate limiting
- Regular security updates

## 📞 Support

If you encounter any issues:
1. Check the logs: `tail -f backend/server.log` and `tail -f frontend.log`
2. Verify all prerequisites are installed
3. Ensure MongoDB is running
4. Check network connectivity

## 🎯 System Requirements

- **Node.js**: v16 or higher
- **MongoDB**: v4.4 or higher
- **RAM**: 2GB minimum
- **Storage**: 1GB free space
- **OS**: macOS, Linux, or Windows

---

**Happy Bill Managing! 🎉**