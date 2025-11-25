#!/bin/bash

# Script to create a local admin user for development

set -e

echo "🔧 Creating local admin user for qbit-ops..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create a .env file with MONGO_URI configured"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)


# Set development mode if not set
export NODE_ENV=${NODE_ENV:-development}

# Navigate to backend directory
cd "$(dirname "$0")/../backend" || exit 1

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies first..."
    npm install
fi

# Run the create-admin script
echo "👤 Creating admin user..."
node scripts/create-admin.js

echo "✅ Done!"
