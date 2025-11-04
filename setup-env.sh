#!/bin/bash

echo "Setting up environment files..."

# Array of services with .env files
services=("api-gateway" "node-service" "edge-service" "media-service" "ai-service" "queue-service" "client")

for service in "${services[@]}"; do
  if [ -f "$service/.env.example" ]; then
    if [ ! -f "$service/.env" ]; then
      cp "$service/.env.example" "$service/.env"
      echo "✅ Created $service/.env"
    else
      echo "⏭️  $service/.env already exists (skipping)"
    fi
  fi
done

echo ""
echo "Environment setup complete!"
