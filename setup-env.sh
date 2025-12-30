#!/bin/bash

echo "========================================="
echo "  Principle Docker-Free Setup"
echo "========================================="
echo ""

# Array of services with .env files
services=("api-gateway" "node-service" "edge-service" "media-service" "ai-service" "queue-service" "client")

echo "📝 Step 1: Setting up environment files..."
echo ""

env_created=0
env_exists=0

for service in "${services[@]}"; do
  if [ -f "$service/.env.example" ]; then
    if [ ! -f "$service/.env" ]; then
      cp "$service/.env.example" "$service/.env"
      echo "  ✅ Created $service/.env"
      env_created=$((env_created + 1))
    else
      echo "  ⏭️  $service/.env already exists"
      env_exists=$((env_exists + 1))
    fi
  fi
done

echo ""
echo "Environment files: $env_created created, $env_exists already existed"
echo ""

echo "📂 Step 2: Checking database files..."
echo ""

db_exists=0
db_missing=0

# Check for database files
databases=("node-service/dev.db" "edge-service/dev.db" "media-service/dev.db")
for db in "${databases[@]}"; do
  if [ -f "$db" ]; then
    size=$(ls -lh "$db" | awk '{print $5}')
    echo "  ✅ Found $db ($size)"
    db_exists=$((db_exists + 1))
  else
    echo "  📝 Missing $db (will be created on first startup)"
    db_missing=$((db_missing + 1))
  fi
done

echo ""
echo "Databases: $db_exists found, $db_missing will be created"
echo ""

echo "========================================="
echo "  Setup Complete!"
echo "========================================="
echo ""

if [ $db_missing -gt 0 ]; then
  echo "ℹ️  IMPORTANT: Database tables will be created automatically"
  echo "   when you first run 'npm run dev:all'"
  echo ""
  echo "   You'll see messages like:"
  echo "   📝 Fresh database detected - will create schema"
  echo ""
fi

echo "Next steps:"
echo "  1. Run: npm run dev:all"
echo "  2. Open: http://localhost:5173"
echo ""
