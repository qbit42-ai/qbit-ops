#!/bin/bash
set -e

echo "🏗️  Building qbit-ops Docker images..."

docker-compose -f docker-compose.prod.yml build

echo "✅ Build complete!"
