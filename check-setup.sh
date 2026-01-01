#!/bin/bash

# Principle Setup Checker
# Run this script on a fresh clone to diagnose setup issues

echo "🔍 Principle Setup Checker"
echo "=========================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0
WARN=0

# Helper functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARN++))
}

# 1. Check Node.js version
echo "1. Checking Node.js version..."
NODE_VERSION=$(node --version 2>/dev/null)
if [ $? -eq 0 ]; then
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$MAJOR_VERSION" -ge 18 ]; then
        check_pass "Node.js $NODE_VERSION (>= 18.0.0 required)"
    else
        check_fail "Node.js $NODE_VERSION (>= 18.0.0 required)"
    fi
else
    check_fail "Node.js not found - please install Node.js >= 18.0.0"
fi
echo ""

# 2. Check npm version
echo "2. Checking npm version..."
NPM_VERSION=$(npm --version 2>/dev/null)
if [ $? -eq 0 ]; then
    MAJOR_VERSION=$(echo $NPM_VERSION | cut -d'.' -f1)
    if [ "$MAJOR_VERSION" -ge 9 ]; then
        check_pass "npm $NPM_VERSION (>= 9.0.0 required)"
    else
        check_fail "npm $NPM_VERSION (>= 9.0.0 required)"
    fi
else
    check_fail "npm not found"
fi
echo ""

# 3. Check root node_modules
echo "3. Checking root dependencies..."
if [ -d "node_modules" ]; then
    COUNT=$(ls node_modules 2>/dev/null | wc -l | tr -d ' ')
    if [ "$COUNT" -gt 0 ]; then
        check_pass "Root node_modules exists ($COUNT packages)"
    else
        check_warn "Root node_modules is empty - run: npm install"
    fi
else
    check_fail "Root node_modules missing - run: npm install"
fi
echo ""

# 4. Check service dependencies
echo "4. Checking service dependencies..."
SERVICES=("api-gateway" "node-service" "edge-service" "media-service" "ai-service" "queue-service" "client")
for SERVICE in "${SERVICES[@]}"; do
    if [ -d "$SERVICE/node_modules" ]; then
        COUNT=$(ls "$SERVICE/node_modules" 2>/dev/null | wc -l | tr -d ' ')
        if [ "$COUNT" -gt 10 ]; then
            check_pass "$SERVICE: node_modules exists ($COUNT packages)"
        else
            check_warn "$SERVICE: node_modules exists but may be incomplete ($COUNT packages)"
        fi
    else
        check_fail "$SERVICE: node_modules missing - run: cd $SERVICE && npm install"
    fi
done
echo ""

# 5. Check for react-router-dom specifically
echo "5. Checking react-router-dom (client dependency)..."
if [ -d "client/node_modules/react-router-dom" ]; then
    check_pass "react-router-dom installed in client/node_modules"
elif [ -d "node_modules/react-router-dom" ]; then
    check_pass "react-router-dom installed in root node_modules"
else
    check_fail "react-router-dom NOT FOUND - run: cd client && npm install"
fi
echo ""

# 6. Check built files
echo "6. Checking built service files..."
BUILD_SERVICES=("api-gateway" "node-service" "edge-service" "media-service")
for SERVICE in "${BUILD_SERVICES[@]}"; do
    if [ -f "$SERVICE/dist/index.js" ]; then
        check_pass "$SERVICE: built (dist/index.js exists)"
    else
        check_warn "$SERVICE: not built - run: cd $SERVICE && npm run build"
    fi
done
echo ""

# 7. Check database
echo "7. Checking database..."
if [ -f "node-service/dev.db" ]; then
    check_pass "Database exists (node-service/dev.db)"

    # Check if database has required tables
    TABLES=$(sqlite3 node-service/dev.db "SELECT name FROM sqlite_master WHERE type='table';" 2>/dev/null)
    if echo "$TABLES" | grep -q "mindmaps"; then
        check_pass "Database has 'mindmaps' table"
    else
        check_warn "Database missing 'mindmaps' table - will be created on first run"
    fi

    if echo "$TABLES" | grep -q "nodes"; then
        check_pass "Database has 'nodes' table"
    else
        check_warn "Database missing 'nodes' table - will be created on first run"
    fi
else
    check_warn "Database not created yet (will be created on first run)"
fi
echo ""

# 8. Check for common issues
echo "8. Checking for common issues..."

# Check if ports are in use
for PORT in 3000 3001 3002 3003 3004 3005 5173; do
    if lsof -ti:$PORT > /dev/null 2>&1; then
        check_warn "Port $PORT is in use (may need to kill: lsof -ti:$PORT | xargs kill)"
    fi
done

# Check package-lock.json
if [ ! -f "package-lock.json" ]; then
    check_warn "Root package-lock.json missing - run: npm install"
fi

echo ""

# 9. Summary
echo "=========================="
echo "Summary:"
echo -e "${GREEN}✓ Passed: $PASS${NC}"
if [ "$WARN" -gt 0 ]; then
    echo -e "${YELLOW}⚠ Warnings: $WARN${NC}"
fi
if [ "$FAIL" -gt 0 ]; then
    echo -e "${RED}✗ Failed: $FAIL${NC}"
fi
echo ""

# 10. Recommendations
if [ "$FAIL" -gt 0 ] || [ "$WARN" -gt 3 ]; then
    echo "🔧 Recommended actions:"
    echo ""
    echo "For a fresh clone, run these commands:"
    echo ""
    echo "  1. npm install                    # Install root dependencies"
    echo "  2. npm run install:services       # Install all service dependencies"
    echo "  3. npm run install:client         # Install client dependencies"
    echo ""
    echo "Or use the single command:"
    echo ""
    echo "  npm run install:all"
    echo ""
    echo "Then build the services:"
    echo ""
    echo "  cd api-gateway && npm run build && cd .."
    echo "  cd node-service && npm run build && cd .."
    echo "  cd edge-service && npm run build && cd .."
    echo "  cd media-service && npm run build && cd .."
    echo ""
    echo "Then start the application:"
    echo ""
    echo "  npm run dev:all"
    echo ""
else
    echo "✅ Setup looks good! You can start the application with:"
    echo ""
    echo "  npm run dev:all"
    echo ""
fi

echo "For more help, see SETUP.md"
echo ""
