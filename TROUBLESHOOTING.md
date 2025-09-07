# Troubleshooting Guide

## 🚨 Common Issues and Solutions

### 1. Port Already in Use Error (EADDRINUSE)

**Error**: `Error: listen EADDRINUSE: address already in use :::5001`

**Solution**:
```bash
# Use the stop script
./stop.sh

# Or manually kill processes
lsof -ti:5001 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Then start again
./start.sh
```

### 2. MongoDB Connection Issues

**Error**: `MongoDB connection error` or `MongooseError`

**Solutions**:
```bash
# Check if MongoDB is running
brew services list | grep mongodb  # macOS
sudo systemctl status mongod       # Linux

# Start MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux

# Check connection string in backend/.env
cat backend/.env
```

### 3. Frontend Not Loading

**Symptoms**: Blank page, connection refused

**Solutions**:
```bash
# Check if backend is running
curl http://localhost:5001/api/health

# Check frontend logs
tail -f frontend.log

# Restart everything
./stop.sh && ./start.sh
```

### 4. Backend Server Crashes

**Symptoms**: Server stops unexpectedly

**Solutions**:
```bash
# Check backend logs
tail -f backend/server.log

# Check for syntax errors
cd backend && node server.js

# Verify environment variables
cat backend/.env
```

### 5. Dependencies Not Found

**Error**: `Cannot find module` or `Module not found`

**Solutions**:
```bash
# Install all dependencies
npm run install:all

# Or manually
npm install
cd backend && npm install
```

### 6. Permission Denied on Scripts

**Error**: `Permission denied` when running start.sh

**Solutions**:
```bash
# Make scripts executable
chmod +x start.sh stop.sh

# Or run with bash
bash start.sh
```

### 7. Registration/Login Issues

**Error**: 400 Bad Request on registration

**Solutions**:
- Ensure you're using the correct field names (name, not username)
- Check if user already exists
- Verify password requirements (min 6 characters)

### 8. File Upload Issues

**Error**: File upload fails

**Solutions**:
```bash
# Check uploads directory permissions
ls -la backend/uploads/

# Create uploads directory if missing
mkdir -p backend/uploads
```

## 🔍 Debugging Commands

### Check Running Processes
```bash
# Check what's running on ports
lsof -i:5001
lsof -i:5173

# Check Node.js processes
ps aux | grep node
```

### Check Logs
```bash
# Backend logs
tail -f backend/server.log

# Frontend logs
tail -f frontend.log

# System logs (macOS)
log show --predicate 'process == "node"' --last 1h
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:5001/api/health

# Test login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### Database Connection Test
```bash
# Test MongoDB connection
mongosh mongodb://localhost:27017/bill_management

# Check collections
show collections
db.users.find().limit(1)
```

## 🛠️ Manual Recovery Steps

If the automated scripts fail:

### 1. Clean Slate Approach
```bash
# Stop everything
./stop.sh

# Kill any remaining processes
pkill -f node
pkill -f vite

# Wait
sleep 5

# Start fresh
./start.sh
```

### 2. Step-by-Step Manual Start
```bash
# Terminal 1 - Backend
cd backend
npm install
node server.js

# Terminal 2 - Frontend
npm install
npm run dev
```

### 3. Reset Database (if needed)
```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/bill_management

# Drop and recreate database
db.dropDatabase()
exit

# Restart backend to recreate collections
cd backend && node server.js
```

## 📞 Getting Help

If you're still having issues:

1. **Check the logs first**: `tail -f backend/server.log`
2. **Verify prerequisites**: Node.js, MongoDB installed and running
3. **Check network**: Ensure ports 5001 and 5173 are available
4. **Try clean restart**: `./stop.sh && sleep 5 && ./start.sh`

## 🎯 System Requirements Checklist

- [ ] Node.js v16+ installed
- [ ] MongoDB running locally or accessible
- [ ] Ports 5001 and 5173 available
- [ ] Sufficient disk space (1GB+)
- [ ] Network connectivity

## 🔧 Environment Verification

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check MongoDB
mongod --version

# Check available ports
netstat -an | grep :5001
netstat -an | grep :5173
```

---

**Remember**: Most issues can be resolved with a clean restart using `./stop.sh && ./start.sh`
