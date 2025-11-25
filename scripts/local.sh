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

# Change to project directory
cd "$PROJECT_DIR"

# Function to show usage
show_usage() {
    echo -e "${BLUE}Usage:${NC} $0 [command]"
    echo ""
    echo -e "${YELLOW}Commands:${NC}"
    echo "  start       Start services (docker-compose up -d)"
    echo "  stop        Stop services (docker-compose down)"
    echo "  restart     Restart services (stop + start)"
    echo "  remove      Stop and remove containers, networks, and volumes"
    echo "  logs        Show logs from all services"
    echo "  logs-backend Show logs from backend only"
    echo "  logs-frontend Show logs from frontend only"
    echo "  status      Show status of containers"
    echo "  build       Build Docker images"
    echo "  rebuild     Rebuild and restart services"
    echo "  shell-backend   Open shell in backend container"
    echo "  shell-frontend  Open shell in frontend container"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 start          # Start all services"
    echo "  $0 stop           # Stop all services"
    echo "  $0 remove         # Stop and remove everything"
    echo "  $0 logs           # View logs"
}

# Check if .env exists
check_env() {
    if [ ! -f .env ]; then
        echo -e "${RED}❌ Error: .env file not found${NC}"
        echo -e "${YELLOW}💡 Run ./scripts/setup.sh to create one${NC}"
        exit 1
    fi
}

# Start services
start_services() {
    check_env
    echo -e "${YELLOW}🚀 Starting qbit-ops services...${NC}"
    
    # Build images if needed
    echo -e "${YELLOW}🏗️  Building Docker images...${NC}"
    docker-compose -f docker-compose.yml build
    
    # Start services
    echo -e "${YELLOW}▶️  Starting containers...${NC}"
    docker-compose -f docker-compose.yml up -d
    
    # Wait a bit for services to start
    echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
    sleep 5
    
    # Show status
    echo -e "${GREEN}✅ Services started!${NC}"
    echo ""
    docker-compose -f docker-compose.yml ps
    
    echo ""
    echo -e "${GREEN}📍 Services available at:${NC}"
    echo -e "   Backend API: ${BLUE}http://localhost:4001${NC}"
    echo -e "   Frontend UI: ${BLUE}http://localhost:8080${NC}"
}

# Stop services
stop_services() {
    echo -e "${YELLOW}🛑 Stopping qbit-ops services...${NC}"
    docker-compose -f docker-compose.yml down
    echo -e "${GREEN}✅ Services stopped${NC}"
}

# Remove containers, networks, and volumes
remove_services() {
    echo -e "${YELLOW}🗑️  Removing qbit-ops containers, networks, and volumes...${NC}"
    docker-compose -f docker-compose.yml down -v --remove-orphans
    echo -e "${GREEN}✅ Containers, networks, and volumes removed${NC}"
}

# Show logs
show_logs() {
    docker-compose -f docker-compose.yml logs -f "$@"
}

# Show status
show_status() {
    echo -e "${YELLOW}📊 Container status:${NC}"
    docker-compose -f docker-compose.yml ps
    
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
    docker-compose -f docker-compose.yml build
    echo -e "${GREEN}✅ Build complete${NC}"
}

# Rebuild and restart
rebuild_services() {
    check_env
    echo -e "${YELLOW}🔄 Rebuilding and restarting services...${NC}"
    
    # Stop existing
    docker-compose -f docker-compose.yml down
    
    # Build
    echo -e "${YELLOW}🏗️  Building Docker images...${NC}"
    docker-compose -f docker-compose.yml build --no-cache
    
    # Start
    echo -e "${YELLOW}▶️  Starting containers...${NC}"
    docker-compose -f docker-compose.yml up -d
    
    # Wait
    sleep 5
    
    # Show status
    show_status
}

# Open shell in container
open_shell() {
    local service=$1
    local container_name=""
    
    if [ "$service" == "backend" ]; then
        container_name="qbit-ops-backend"
    elif [ "$service" == "frontend" ]; then
        container_name="qbit-ops-frontend"
    else
        echo -e "${RED}❌ Invalid service: $service${NC}"
        exit 1
    fi
    
    if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        echo -e "${YELLOW}🐚 Opening shell in ${service} container...${NC}"
        docker exec -it "$container_name" /bin/sh || docker exec -it "$container_name" /bin/bash
    else
        echo -e "${RED}❌ Container ${container_name} is not running${NC}"
        echo -e "${YELLOW}💡 Start services first with: $0 start${NC}"
        exit 1
    fi
}

# Main command handler
case "${1:-}" in
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
    rebuild)
        rebuild_services
        ;;
    shell-backend)
        open_shell backend
        ;;
    shell-frontend)
        open_shell frontend
        ;;
    help|--help|-h)
        show_usage
        ;;
    "")
        show_usage
        exit 1
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo ""
        show_usage
        exit 1
        ;;
esac

