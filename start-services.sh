#!/bin/bash

# Principle - Start All Services Script
# This script starts all backend services and the client

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Starting Principle Services${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}Warning: Port $1 is already in use${NC}"
        return 1
    fi
    return 0
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1

    echo -e "Waiting for ${name} to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s "${url}" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ ${name} is ready${NC}"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done

    echo -e "${YELLOW}Warning: ${name} did not respond in time${NC}"
    return 1
}

# Check if Docker containers are running
echo -e "${BLUE}Checking Docker containers...${NC}"
if ! docker-compose ps | grep -q "Up"; then
    echo -e "${YELLOW}Docker containers not running. Starting them...${NC}"
    docker-compose up -d
    echo -e "${GREEN}✓ Docker containers started${NC}"
    sleep 3
else
    echo -e "${GREEN}✓ Docker containers already running${NC}"
fi
echo ""

# Start API Gateway (Port 3000)
echo -e "${BLUE}Starting API Gateway (Port 3000)...${NC}"
if check_port 3000; then
    cd api-gateway
    PORT=3000 npm start > ../logs/api-gateway.log 2>&1 &
    echo $! > ../pids/api-gateway.pid
    cd ..
    wait_for_service "http://localhost:3000/health" "API Gateway"
else
    echo -e "${GREEN}✓ API Gateway already running${NC}"
fi
echo ""

# Start Node Service (Port 3001)
echo -e "${BLUE}Starting Node Service (Port 3001)...${NC}"
if check_port 3001; then
    cd node-service
    PORT=3001 npm start > ../logs/node-service.log 2>&1 &
    echo $! > ../pids/node-service.pid
    cd ..
    wait_for_service "http://localhost:3001/health" "Node Service"
else
    echo -e "${GREEN}✓ Node Service already running${NC}"
fi
echo ""

# Start Edge Service (Port 3002)
echo -e "${BLUE}Starting Edge Service (Port 3002)...${NC}"
if check_port 3002; then
    cd edge-service
    PORT=3002 npm start > ../logs/edge-service.log 2>&1 &
    echo $! > ../pids/edge-service.pid
    cd ..
    wait_for_service "http://localhost:3002/health" "Edge Service"
else
    echo -e "${GREEN}✓ Edge Service already running${NC}"
fi
echo ""

# Start Media Service (Port 3003)
echo -e "${BLUE}Starting Media Service (Port 3003)...${NC}"
if check_port 3003; then
    cd media-service
    PORT=3003 npm start > ../logs/media-service.log 2>&1 &
    echo $! > ../pids/media-service.pid
    cd ..
    wait_for_service "http://localhost:3003/health" "Media Service"
else
    echo -e "${GREEN}✓ Media Service already running${NC}"
fi
echo ""

# Start AI Service (Port 3004)
echo -e "${BLUE}Starting AI Service (Port 3004)...${NC}"
if check_port 3004; then
    cd ai-service
    PORT=3004 npm start > ../logs/ai-service.log 2>&1 &
    echo $! > ../pids/ai-service.pid
    cd ..
    wait_for_service "http://localhost:3004/health" "AI Service"
else
    echo -e "${GREEN}✓ AI Service already running${NC}"
fi
echo ""

# Start Queue Service (Port 3005)
echo -e "${BLUE}Starting Queue Service (Port 3005)...${NC}"
if check_port 3005; then
    cd queue-service
    PORT=3005 npm start > ../logs/queue-service.log 2>&1 &
    echo $! > ../pids/queue-service.pid
    cd ..
    wait_for_service "http://localhost:3005/health" "Queue Service"
else
    echo -e "${GREEN}✓ Queue Service already running${NC}"
fi
echo ""

# Start Client (Port 5173/5174)
echo -e "${BLUE}Starting Client (Port 5173)...${NC}"
if check_port 5173 && check_port 5174; then
    cd client
    npm run dev > ../logs/client.log 2>&1 &
    echo $! > ../pids/client.pid
    cd ..
    sleep 3
    echo -e "${GREEN}✓ Client started${NC}"
else
    echo -e "${GREEN}✓ Client already running${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}  All Services Started Successfully!${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "Service URLs:"
echo -e "  ${GREEN}API Gateway:${NC}    http://localhost:3000"
echo -e "  ${GREEN}Node Service:${NC}   http://localhost:3001"
echo -e "  ${GREEN}Edge Service:${NC}   http://localhost:3002"
echo -e "  ${GREEN}Media Service:${NC}  http://localhost:3003"
echo -e "  ${GREEN}AI Service:${NC}     http://localhost:3004"
echo -e "  ${GREEN}Queue Service:${NC}  http://localhost:3005"
echo -e "  ${GREEN}Client:${NC}         http://localhost:5174"
echo ""
echo -e "Logs are available in: ${BLUE}./logs/${NC}"
echo -e "PIDs are stored in: ${BLUE}./pids/${NC}"
echo ""
echo -e "To stop all services, run: ${YELLOW}./stop-services.sh${NC}"
echo ""
