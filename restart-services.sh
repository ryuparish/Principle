#!/bin/bash

# Principle - Restart All Services Script
# This script stops and restarts all services

# Colors for output
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Restarting Principle Services${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Stop all services
./stop-services.sh

# Wait a moment
echo ""
echo "Waiting 2 seconds before restarting..."
sleep 2
echo ""

# Start all services
./start-services.sh
