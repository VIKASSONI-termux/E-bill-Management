#!/bin/bash

# Bill Management System Startup Script
echo "🚀 Starting Bill Management System..."

# Function to kill processes on port 5001
kill_port_5001() {
    echo "🔄 Cleaning up port 5001..."
    lsof -ti:5001 | xargs kill -9 2>/dev/null || true
    pkill -f "node server.js" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true
    sleep 2
}

# Function to kill processes on port 5173 (Vite)
kill_port_5173() {
    echo "🔄 Cleaning up port 5173..."
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    sleep 1
}

# Clean up any existing processes
kill_port_5001
kill_port_5173

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   Current directory: $(pwd)"
    echo "   Expected: /path/to/bill_management"
    exit 1
fi

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo "❌ Error: Backend directory not found"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

# Check if .env file exists in backend
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Warning: backend/.env file not found"
    echo "   Creating a default .env file..."
    cat > backend/.env << EOF
PORT=5001
MONGODB_URI=mongodb://localhost:27017/bill_management
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
EOF
    echo "✅ Created backend/.env file with default values"
    echo "   Please update the JWT_SECRET for production use"
fi

# Start backend server
echo "🔧 Starting backend server..."
cd backend
nohup node server.js > server.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 3

# Check if backend is running
if curl -s http://localhost:5001/api/health > /dev/null; then
    echo "✅ Backend server started successfully on port 5001"
else
    echo "❌ Backend server failed to start"
    echo "   Check backend/server.log for details"
    exit 1
fi

# Start frontend server
echo "🎨 Starting frontend server..."
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 5

# Check if frontend is running
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend server started successfully on port 5173"
else
    echo "❌ Frontend server failed to start"
    echo "   Check frontend.log for details"
    exit 1
fi

echo ""
echo "🎉 Bill Management System is now running!"
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:5001"
echo "📊 Health:   http://localhost:5001/api/health"
echo ""
echo "👤 Default Admin Login:"
echo "   Email: admin@example.com"
echo "   Password: admin123"
echo ""
echo "👤 Default User Login:"
echo "   Email: user@example.com"
echo "   Password: user123"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f backend/server.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop the servers:"
echo "   ./stop.sh"
echo ""

# Save PIDs for stop script
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

echo "✅ Startup complete! The system is ready to use."
