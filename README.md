# Qbit Ops - Admin Operations Panel

Admin operations control panel for qbit platform. Allows admin login, JWT token minting for user emulation, organization-based user filtering, and future dashboard features.

## Features

- **Admin Authentication**: Password-based login with JWT tokens
- **User Management**: Search and filter users by organization
- **User Emulation**: Mint JWT tokens to login as any user (with admin tracking)
- **Organization Support**: Filter users by organization membership
- **Cookie-based SSO**: Seamless login to main qbit-chat service
- **Audit Logging**: Track which admin emulated which user

## Architecture

- **Backend**: Node.js/Express API server
- **Frontend**: React/TypeScript with Vite, Tailwind CSS, shadcn/ui components
- **Database**: Shared MongoDB connection with qbit-chat
- **Domain**: `ops.qbit42.ai`

## Prerequisites

- Node.js 18+
- MongoDB (shared with qbit-chat)
- Docker & Docker Compose (for containerized deployment)

## Quick Start

### Using Docker Compose

1. Clone the repository and navigate to the directory:
```bash
cd qbit-ops
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Run setup script:
```bash
chmod +x scripts/*.sh
./scripts/setup.sh
```

4. Start services:
```bash
docker-compose up -d
```

Services will be available at:
- Backend API: http://localhost:4001
- Frontend UI: http://localhost:8080

### Local Development

**Backend:**
```bash
cd backend
npm install
cp .env.template .env
# Edit .env with your configuration
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend

```bash
PORT=4001
MONGO_URI=<same as qbit-chat>
JWT_SECRET=<same as qbit-chat>
JWT_REFRESH_SECRET=<same as qbit-chat>
ADMIN_JWT_SECRET=<new secret for admin auth>
NODE_ENV=production
QBIT_CHAT_URL=https://chat.qbit42.ai
COOKIE_DOMAIN=.qbit42.ai
ALLOWED_ORIGINS=https://ops.qbit42.ai

# Token/Session settings (should match qbit-chat)
SESSION_EXPIRY=900000  # 15 min in ms
REFRESH_TOKEN_EXPIRY=604800000  # 7 days in ms

# Optional security
ADMIN_IP_WHITELIST=1.2.3.4,5.6.7.8
```

## API Endpoints

### Authentication

```
POST   /api/admin/auth/login    # Admin login
POST   /api/admin/auth/logout   # Admin logout
GET    /api/admin/auth/me       # Get current admin
```

### Organisations

```
GET    /api/admin/organisations              # List organisations
GET    /api/admin/organisations/:id          # Get organisation details
GET    /api/admin/organisations/:id/members  # Get organisation members
```

### Users

```
GET    /api/admin/users        # List/search users (with org filter)
GET    /api/admin/users/:id    # Get user details
```

### Token Minting

```
POST   /api/admin/tokens/mint      # Mint JWT token (returns token)
POST   /api/admin/tokens/emulate   # Mint token + redirect (SSO)
```

All endpoints except `/auth/login` require admin JWT authentication.

## Deployment

### Production Deployment

```bash
# Build and deploy
./scripts/deploy.sh
```

The deployment script will:
1. Pull latest code
2. Build Docker images
3. Stop existing containers
4. Start new containers
5. Run health checks

### Using GitHub Actions

The repository includes GitHub Actions workflows for:
- **CI**: Run tests and build checks on PRs
- **Deploy**: Automatic deployment to production on main branch

Configure secrets in GitHub:
- `PROD_HOST`: Production server hostname
- `PROD_USER`: SSH username
- `PROD_SSH_KEY`: SSH private key

## Security

- Separate admin JWT secret
- Rate limiting on token minting
- Audit logging for token generation
- Admin-only access restrictions
- IP whitelist option (optional)
- Secure cookie flags in production
- Admin tracking in minted JWT tokens

## Testing

### Backend Tests

```bash
cd backend
npm test
npm run test:coverage
```

## Development

### Creating an Admin User (Local Development Only)

For local development, use the provided setup script:

```bash
# From the qbit-ops root directory
./scripts/create-local-admin.sh
```

Or manually from the backend directory:

```bash
cd backend
npm run create-admin
```

**Default credentials (local development only):**
- Email: `admin@local.test`
- Password: `admin123`

You can customize these by setting environment variables before running:
```bash
export ADMIN_EMAIL=admin@example.com
export ADMIN_PASSWORD=your-password
npm run create-admin
```

⚠️ **Important**: This script only works in development mode (`NODE_ENV` != `production`). For production, manually create admin users with secure passwords.

## License

Proprietary - Qbit Platform
