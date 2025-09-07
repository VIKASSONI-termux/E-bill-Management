#!/bin/bash

# Bill Management System Stop Script
echo "🛑 Stopping Bill Management System..."

# Function to kill processes on port 5001
kill_port_5001() {
    echo "🔄 Stopping backend server on port 5001..."
    lsof -ti:5001 | xargs kill -9 2>/dev/null || true
    pkill -f "node server.js" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true
}

# Function to kill processes on port 5173 (Vite)
kill_port_5173() {
    echo "🔄 Stopping frontend server on port 5173..."
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
}

# Kill processes using saved PIDs if they exist
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "🔄 Stopping backend server (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null || true
    fi
    rm -f .backend.pid
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "🔄 Stopping frontend server (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    rm -f .frontend.pid
fi

# Force kill any remaining processes
kill_port_5001
kill_port_5173

# Wait a moment for processes to terminate
sleep 2

# Verify ports are free
if lsof -i:5001 >/dev/null 2>&1; then
    echo "⚠️  Warning: Port 5001 is still in use"
else
    echo "✅ Port 5001 is now free"
fi

if lsof -i:5173 >/dev/null 2>&1; then
    echo "⚠️  Warning: Port 5173 is still in use"
else
    echo "✅ Port 5173 is now free"
fi

echo "✅ All servers stopped successfully!"
echo ""
echo "💡 To start the system again, run: ./start.sh"
