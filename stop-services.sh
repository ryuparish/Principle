#!/bin/bash

# Principle - Stop All Services Script
# This script stops all backend services and the client

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Stopping Principle Services${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Function to kill process by PID file
kill_service() {
    local service_name=$1
    local pid_file="pids/${service_name}.pid"

    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            echo -e "${GREEN}✓ Stopped ${service_name} (PID: ${pid})${NC}"
        else
            echo -e "${RED}✗ ${service_name} not running (stale PID file)${NC}"
        fi
        rm "$pid_file"
    else
        echo -e "${RED}✗ No PID file for ${service_name}${NC}"
    fi
}

# Stop services using PID files
echo -e "${BLUE}Stopping services using PID files...${NC}"
kill_service "api-gateway"
kill_service "node-service"
kill_service "edge-service"
kill_service "media-service"
kill_service "ai-service"
kill_service "queue-service"
kill_service "client"
echo ""

# Kill any remaining processes on the ports
echo -e "${BLUE}Checking for remaining processes on ports...${NC}"
for port in 3000 3001 3002 3003 3004 3005 5173 5174; do
    if lsof -ti:$port > /dev/null 2>&1; then
        lsof -ti:$port | xargs kill -9 2>/dev/null
        echo -e "${GREEN}✓ Killed process on port ${port}${NC}"
    fi
done
echo ""

# Optionally stop Docker containers (only if --docker flag is passed)
if [[ "$1" == "--docker" ]]; then
    echo -e "${BLUE}Stopping Docker containers...${NC}"
    docker-compose down
    echo -e "${GREEN}✓ Docker containers stopped${NC}"
else
    echo -e "${BLUE}Note: Docker containers are still running${NC}"
    echo -e "${BLUE}To stop them, run: ./stop-services.sh --docker${NC}"
fi

echo ""
echo -e "${GREEN}All services stopped${NC}"
echo ""
