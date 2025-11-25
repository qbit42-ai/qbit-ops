#!/bin/bash
set -e

echo "🔧 Setting up qbit-ops..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cat > .env << EOF
# Database
MONGO_URI=mongodb://localhost:27017/qbit-chat

# JWT Secrets (use same as qbit-chat)
JWT_SECRET=your-jwt-secret-here
JWT_REFRESH_SECRET=your-jwt-refresh-secret-here
ADMIN_JWT_SECRET=your-admin-jwt-secret-here

# Application
PORT=4001
NODE_ENV=production
QBIT_CHAT_URL=https://chat.qbit42.ai
COOKIE_DOMAIN=.qbit42.ai
ALLOWED_ORIGINS=https://ops.qbit42.ai

# Token/Session settings
SESSION_EXPIRY=900000
REFRESH_TOKEN_EXPIRY=604800000

# Optional
ADMIN_IP_WHITELIST=
EOF
    echo "✅ Created .env file. Please update with your values."
else
    echo "ℹ️  .env file already exists"
fi

# Install backend dependencies
if [ -d "backend" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

# Install frontend dependencies
if [ -d "frontend" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

echo "✅ Setup complete!"
echo "📝 Please update .env with your configuration before deploying."
