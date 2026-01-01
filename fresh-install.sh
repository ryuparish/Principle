#!/bin/bash

# Fresh Installation Script for Principle
# Use this on a freshly cloned repository

set -e  # Exit on any error

echo "🚀 Principle Fresh Installation"
echo "================================"
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

step() {
    echo -e "${BLUE}▶${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check prerequisites
step "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js >= 18.0.0"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm >= 9.0.0"
    exit 1
fi

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
success "Node.js $NODE_VERSION"
success "npm $NPM_VERSION"
echo ""

# Step 1: Install root dependencies
step "Step 1/7: Installing root dependencies..."
npm install
success "Root dependencies installed"
echo ""

# Step 2: Install API Gateway
step "Step 2/7: Installing API Gateway dependencies..."
cd api-gateway
npm install
npm run build
cd ..
success "API Gateway ready"
echo ""

# Step 3: Install Node Service
step "Step 3/7: Installing Node Service dependencies..."
cd node-service
npm install
npm run build
cd ..
success "Node Service ready"
echo ""

# Step 4: Install Edge Service
step "Step 4/7: Installing Edge Service dependencies..."
cd edge-service
npm install
npm run build
cd ..
success "Edge Service ready"
echo ""

# Step 5: Install Media Service
step "Step 5/7: Installing Media Service dependencies..."
cd media-service
npm install
npm run build
cd ..
success "Media Service ready"
echo ""

# Step 6: Install Client
step "Step 6/7: Installing Client dependencies..."
cd client
npm install
cd ..
success "Client ready"
echo ""

# Step 7: Database setup reminder
step "Step 7/7: Database setup..."
warn "Database will be created automatically on first run"
warn "If you need to run migrations, see SETUP.md > Database Migrations"
echo ""

# Final summary
echo "================================"
echo -e "${GREEN}✅ Installation Complete!${NC}"
echo ""
echo "To start the application:"
echo ""
echo "  npm run dev:all"
echo ""
echo "This will start all services and the client:"
echo "  - API Gateway     → http://localhost:3000"
echo "  - Node Service    → http://localhost:3001"
echo "  - Edge Service    → http://localhost:3002"
echo "  - Media Service   → http://localhost:3003"
echo "  - Client          → http://localhost:5173"
echo ""
echo "For troubleshooting, run: ./check-setup.sh"
echo "For detailed setup info, see: SETUP.md"
echo ""
