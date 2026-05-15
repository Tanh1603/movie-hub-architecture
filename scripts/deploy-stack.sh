#!/bin/bash
# ============================================================
# Deploy MovieHub Stack to Docker Swarm
# Phase 07 - Replica, Failover, and Rollout Policy
# ============================================================
#
# Usage:
#   ./scripts/deploy-stack.sh init           # Initialize Swarm (one-time)
#   ./scripts/deploy-stack.sh deploy         # Deploy or update stack
#   ./scripts/deploy-stack.sh status         # Show stack status
#   ./scripts/deploy-stack.sh remove         # Remove stack
#
# Requirements:
#   - Docker Engine installed
#   - All services docker images built (or registry references available)
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
STACK_FILE="$REPO_ROOT/infra/docker-stack.yml"
STACK_NAME="moviehub"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

stack_service_name() {
    echo "${STACK_NAME}_$1"
}

# Check if docker swarm is active
swarm_is_active() {
    docker info 2>&1 | grep -q "Swarm: active"
}

# Initialize Docker Swarm (if not already initialized)
init_swarm() {
    if swarm_is_active; then
        log_info "Docker Swarm already initialized"
    else
        log_info "Initializing Docker Swarm..."
        docker swarm init
        log_info "Swarm initialized successfully"
    fi
}

# Build all service images (or use existing)
build_images() {
    log_info "Building service images..."
    docker compose -f "$REPO_ROOT/docker-compose.yml" build api-gateway user-service movie-service cinema-service booking-service
    log_info "Images built successfully"
}

# Tag images for Swarm (images are already built with the exact names used by docker-stack.yml)
tag_images() {
    log_info "Swarm image names already match the built Compose images; skipping retag step."
}

# Deploy or update stack
deploy_stack() {
    if ! swarm_is_active; then
        log_error "Docker Swarm is not active. Run './scripts/deploy-stack.sh init' first"
        exit 1
    fi

    if [ ! -f "$STACK_FILE" ]; then
        log_error "Stack file not found: $STACK_FILE"
        exit 1
    fi

    log_info "Deploying stack: $STACK_NAME..."
    docker stack deploy -c "$STACK_FILE" "$STACK_NAME"
    log_info "Stack deployed successfully"
    log_info "Waiting for services to stabilize (15 seconds)..."
    sleep 15
    
    log_info "Checking service status..."
    docker service ls
}

# Show stack status
show_status() {
    if ! swarm_is_active; then
        log_error "Docker Swarm is not active"
        exit 1
    fi

    log_info "=== Stack Status ==="
    docker stack ls | grep -E "^$STACK_NAME|NAME"
    
    log_info ""
    log_info "=== Services ==="
    docker service ls --filter label=com.docker.stack.namespace="$STACK_NAME"
    
    log_info ""
    log_info "=== Service Details (Replicas) ==="
    docker service ls --filter label=com.docker.stack.namespace="$STACK_NAME" -q | while read service_id; do
        service_name=$(docker service inspect "$service_id" --format='{{.Spec.Name}}')
        replicas=$(docker service ls --filter "id=$service_id" --format='{{.Replicas}}')
        log_info "  $service_name: $replicas"
    done
    
    log_info ""
    log_info "=== Task Status (Running Instances) ==="
    docker stack ps "$STACK_NAME" --no-trunc
}

# Remove stack
remove_stack() {
    if ! swarm_is_active; then
        log_error "Docker Swarm is not active"
        exit 1
    fi

    log_warn "Removing stack: $STACK_NAME..."
    docker stack rm "$STACK_NAME"
    
    log_info "Waiting for cleanup (10 seconds)..."
    sleep 10
    
    log_info "Stack removed successfully"
}

# Main command handler
case "${1:-status}" in
    init)
        init_swarm
        ;;
    build)
        build_images
        tag_images
        ;;
    deploy)
        init_swarm
        build_images
        tag_images
        deploy_stack
        show_status
        ;;
    status)
        show_status
        ;;
    remove)
        remove_stack
        ;;
    *)
        echo "Usage: $0 {init|build|deploy|status|remove}"
        echo ""
        echo "Commands:"
        echo "  init    - Initialize Docker Swarm (one-time setup)"
        echo "  build   - Build and tag service images"
        echo "  deploy  - Deploy/update stack (includes init, build, tag)"
        echo "  status  - Show current stack status"
        echo "  remove  - Remove stack"
        exit 1
        ;;
esac
