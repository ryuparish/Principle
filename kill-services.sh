#!/bin/bash

# Kill processes running on common ports
# API Gateway - 3000
# Node Service - 3001
# Edge Service - 3002
# Media Service - 3003
# AI Service - 3004
# Queue Service - 3005
# Client - 5173, 5174 (Vite)

echo "Killing existing services..."

# Function to kill process on port
kill_port() {
  PORT=$1
  PID=$(lsof -ti:$PORT 2>/dev/null)
  if [ ! -z "$PID" ]; then
    echo "Killing process on port $PORT (PID: $PID)"
    kill -9 $PID 2>/dev/null
  fi
}

# Kill all service ports
kill_port 3000
kill_port 3001
kill_port 3002
kill_port 3003
kill_port 3004
kill_port 3005
kill_port 5173
kill_port 5174

# Kill ts-node-dev processes (more specific than just node)
echo "Killing ts-node-dev processes..."
pkill -9 -f "ts-node-dev" 2>/dev/null

# Kill concurrently processes
echo "Killing concurrently processes..."
pkill -9 -f "concurrently" 2>/dev/null

# Kill any vite processes
echo "Killing vite processes..."
pkill -9 -f "vite" 2>/dev/null

# Wait a moment for processes to die
sleep 1

# Double-check ports and force kill any remaining
echo "Double-checking ports..."
for port in 3000 3001 3002 3003 3004 3005 5173 5174; do
  PID=$(lsof -ti:$port 2>/dev/null)
  if [ ! -z "$PID" ]; then
    echo "Force killing remaining process on port $port (PID: $PID)"
    kill -9 $PID 2>/dev/null
  fi
done

echo "All services killed."
