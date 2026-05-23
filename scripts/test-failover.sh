#!/bin/bash
# ============================================================
# Test Failover and Replica Behavior
# Phase 07 - Simulate service failures and verify zero-downtime failover
# ============================================================
#
# This script helps verify:
# - Service remains available when one replica fails
# - Swarm auto-restarts unhealthy replicas
# - Rolling updates respect replica health
#
# Usage:
#   ./scripts/test-failover.sh kill-replica <service-name>     # Kill one replica
#   ./scripts/test-failover.sh watch-replicas <service-name>   # Monitor replicas
#   ./scripts/test-failover.sh test-readiness                  # Test readiness endpoint
#   ./scripts/test-failover.sh simulate-bad-deployment         # Simulate deploy failure
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
STACK_NAME="moviehub"

stack_service_name() {
    echo "${STACK_NAME}_$1"
}

running_task_id() {
    local service_name="$1"
    docker service ps "$service_name" --filter "desired-state=running" --format '{{.ID}}' | head -1
}

running_container_id() {
    local service_name="$1"
    docker ps --filter "label=com.docker.swarm.service.name=$service_name" --format '{{.ID}}' | head -1
}

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# Kill one replica of a service
kill_replica() {
    local service_name="$1"
    if [ -z "$service_name" ]; then
        log_error "Service name required"
        exit 1
    fi

    local full_service_name
    full_service_name="$(stack_service_name "$service_name")"
    log_info "Killing one replica of service: $service_name"
    
    # Get one running container for this service
    local container_id
    container_id="$(running_container_id "$full_service_name")"
    
    if [ -z "$container_id" ]; then
        log_error "No running replicas found for service: $service_name"
        exit 1
    fi

    log_info "Container ID: $container_id"
    docker kill "$container_id" || true
    
    log_info "Replica killed successfully"
    log_info "Swarm will automatically restart the failed replica"
    log_info "Waiting 15 seconds for restart..."
    sleep 15
    
    log_info "Checking service status..."
    docker service ps "$full_service_name" --no-trunc
}

# Watch replicas in real-time
watch_replicas() {
    local service_name="$1"
    if [ -z "$service_name" ]; then
        log_error "Service name required"
        exit 1
    fi

    local full_service_name
    full_service_name="$(stack_service_name "$service_name")"
    log_info "Watching replicas for service: $service_name (Press Ctrl+C to stop)"
    
    while true; do
        clear
        log_info "=== Replica Status: $service_name ==="
        docker service ps "$full_service_name" --no-trunc
        log_info ""
        log_info "=== Service Stats ==="
        docker service ls --filter "name=$full_service_name"
        sleep 2
    done
}

# Test readiness endpoint
test_readiness() {
    log_info "Testing readiness endpoints..."
    log_info ""
    
    local services=(
        "api-gateway:3000:/api/health/ready"
        "user-service:3006:/health/ready"
        "movie-service:3007:/health/ready"
        "cinema-service:3008:/health/ready"
        "booking-service:3005:/health/ready"
    )

    for service_config in "${services[@]}"; do
        IFS=':' read -r service_name port endpoint <<< "$service_config"
        full_name="${STACK_NAME}_${service_name}"
        
        log_info "Testing: $full_name -> http://localhost:$port$endpoint"
        
        # Get one running container
        local container_id
        container_id="$(running_container_id "$full_name")"
        
        if [ -z "$container_id" ]; then
            log_warn "No running replicas for $service_name, skipping"
            continue
        fi

        # Test endpoint inside container
        local result=$(docker exec "$container_id" wget -qO- --timeout=2 "http://localhost:$port$endpoint" 2>&1 || echo "FAILED")
        
        if echo "$result" | grep -q "FAILED"; then
            log_error "  ✗ FAILED"
        else
            log_info "  ✓ OK: $(echo $result | head -c 100)..."
        fi
        
        log_info ""
    done
}

# Simulate a bad deployment (trigger rollback)
simulate_bad_deployment() {
    local service_name="${1:-booking-service}"
    log_warn "Simulating bad deployment for: $service_name"
    log_warn "This will:"
    log_warn "  1. Update service with a broken image"
    log_warn "  2. Observe update pause/rollback"
    log_warn "  3. Restore original image"
    log_info ""
    
    local full_service_name="${STACK_NAME}_${service_name}"
    
    # Get current image
    local current_image=$(docker service inspect "$full_service_name" --format='{{.Spec.TaskTemplate.ContainerSpec.Image}}')
    log_info "Current image: $current_image"
    
    # Try to update with broken image (will fail readiness)
    log_warn "Updating with broken image: moviehub-broken:latest..."
    docker service update --image moviehub-broken:latest "$full_service_name" 2>&1 || true
    
    log_info "Waiting 20 seconds to observe rollback behavior..."
    sleep 5
    docker service ps "$full_service_name" --no-trunc
    log_info ""
    log_info "Waiting 15 more seconds..."
    sleep 15
    
    # Restore original image
    log_info "Restoring original image: $current_image"
    docker service update --image "$current_image" "$full_service_name"
    
    log_info "Deployment restored"
    log_info "Waiting 10 seconds for stability..."
    sleep 10
    
    docker service ps "$full_service_name" --no-trunc
}

# Show help
show_help() {
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  kill-replica <service>        - Kill one replica and observe restart"
    echo "  watch-replicas <service>      - Watch replica status in real-time"
    echo "  test-readiness                - Test readiness endpoints of all services"
    echo "  simulate-bad-deployment [svc] - Simulate deploy failure and rollback (default: booking-service)"
    echo ""
    echo "Services: api-gateway, booking-service, user-service, movie-service, cinema-service"
    echo ""
    echo "Examples:"
    echo "  ./scripts/test-failover.sh kill-replica booking-service"
    echo "  ./scripts/test-failover.sh watch-replicas user-service"
    echo "  ./scripts/test-failover.sh test-readiness"
    echo "  ./scripts/test-failover.sh simulate-bad-deployment movie-service"
}

# Main
case "${1:-help}" in
    kill-replica)
        kill_replica "$2"
        ;;
    watch-replicas)
        watch_replicas "$2"
        ;;
    test-readiness)
        test_readiness
        ;;
    simulate-bad-deployment)
        simulate_bad_deployment "${2:-booking-service}"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
