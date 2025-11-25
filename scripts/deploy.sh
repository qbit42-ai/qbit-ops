#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Ensure project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}Error: Project directory does not exist: $PROJECT_DIR${NC}"
    exit 1
fi

# Change to project directory (use absolute path to avoid getcwd issues)
cd "$PROJECT_DIR" || {
    echo -e "${RED}Error: Failed to change to project directory: $PROJECT_DIR${NC}"
    exit 1
}

# Verify we're in the right directory
if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}Error: docker-compose.prod.yml not found. Current directory: $(pwd)${NC}"
    exit 1
fi

# Function to show usage
show_usage() {
    echo -e "${BLUE}Usage:${NC} $0 [command]"
    echo ""
    echo -e "${YELLOW}Commands:${NC}"
    echo "  deploy      Deploy services (default: pull, build, stop, start)"
    echo "  start       Start services (docker compose up -d)"
    echo "  stop        Stop services (docker compose down)"
    echo "  restart     Restart services (stop + start)"
    echo "  remove      Stop and remove containers, networks, and volumes"
    echo "  logs        Show logs from all services"
    echo "  logs-backend Show logs from backend only"
    echo "  logs-frontend Show logs from frontend only"
    echo "  status      Show status of containers"
    echo "  build       Build Docker images"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 deploy        # Full deployment (default)"
    echo "  $0 stop          # Stop all services"
    echo "  $0 remove        # Stop and remove everything"
    echo "  $0 logs          # View logs"
}

# Check if .env exists
check_env() {
    if [ ! -f .env ]; then
        echo -e "${RED}Error: .env file not found${NC}"
        exit 1
    fi
}

# Deploy services (full deployment)
deploy_services() {
    check_env
    
    echo -e "${YELLOW}🚀 Starting qbit-ops deployment...${NC}"
    
    # Load environment variables
    export $(cat .env | grep -v '^#' | xargs)
    
    # Pull latest code
    echo -e "${YELLOW}📥 Pulling latest code...${NC}"
    git pull origin main || echo "Warning: Could not pull latest code"
    
    # Build and start services
    echo -e "${YELLOW}🏗️  Building Docker images...${NC}"
    docker compose -f docker-compose.prod.yml build
    
    # Stop existing containers
    echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
    docker compose -f docker-compose.prod.yml down
    
    # Start new containers
    echo -e "${YELLOW}🚀 Starting containers...${NC}"
    docker compose -f docker-compose.prod.yml up -d
    
    # Wait for health checks
    echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
    sleep 10
    
    # Health check
    if curl -f http://localhost:4001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is healthy${NC}"
    else
        echo -e "${RED}❌ Backend health check failed${NC}"
        echo -e "${YELLOW}📋 Container logs:${NC}"
        docker compose -f docker-compose.prod.yml logs backend
        exit 1
    fi
    
    # Show running containers
    echo -e "${GREEN}✅ Deployment complete!${NC}"
    echo -e "${YELLOW}📋 Running containers:${NC}"
    docker compose -f docker-compose.prod.yml ps
    
    echo -e "${GREEN}🎉 qbit-ops is now running!${NC}"
}

# Start services
start_services() {
    check_env
    echo -e "${YELLOW}🚀 Starting qbit-ops services...${NC}"
    
    # Build images if needed
    echo -e "${YELLOW}🏗️  Building Docker images...${NC}"
    docker compose -f docker-compose.prod.yml build
    
    # Start services
    echo -e "${YELLOW}▶️  Starting containers...${NC}"
    docker compose -f docker-compose.prod.yml up -d
    
    # Wait a bit for services to start
    echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
    sleep 5
    
    # Show status
    echo -e "${GREEN}✅ Services started!${NC}"
    docker compose -f docker-compose.prod.yml ps
}

# Stop services
stop_services() {
    echo -e "${YELLOW}🛑 Stopping qbit-ops services...${NC}"
    docker compose -f docker-compose.prod.yml down
    echo -e "${GREEN}✅ Services stopped${NC}"
}

# Remove containers, networks, and volumes
remove_services() {
    echo -e "${YELLOW}🗑️  Removing qbit-ops containers, networks, and volumes...${NC}"
    docker compose -f docker-compose.prod.yml down -v --remove-orphans
    echo -e "${GREEN}✅ Containers, networks, and volumes removed${NC}"
}

# Show logs
show_logs() {
    docker compose -f docker-compose.prod.yml logs -f "$@"
}

# Show status
show_status() {
    echo -e "${YELLOW}📊 Container status:${NC}"
    docker compose -f docker-compose.prod.yml ps
    
    echo ""
    echo -e "${YELLOW}🔍 Health check:${NC}"
    if curl -f http://localhost:4001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is healthy${NC}"
    else
        echo -e "${RED}❌ Backend health check failed${NC}"
    fi
}

# Build images
build_images() {
    check_env
    echo -e "${YELLOW}🏗️  Building Docker images...${NC}"
    docker compose -f docker-compose.prod.yml build
    echo -e "${GREEN}✅ Build complete${NC}"
}

# Main command handler
case "${1:-deploy}" in
    deploy)
        deploy_services
        ;;
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        start_services
        ;;
    remove)
        remove_services
        ;;
    logs)
        show_logs
        ;;
    logs-backend)
        show_logs backend
        ;;
    logs-frontend)
        show_logs frontend
        ;;
    status)
        show_status
        ;;
    build)
        build_images
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo ""
        show_usage
        exit 1
        ;;
esac
