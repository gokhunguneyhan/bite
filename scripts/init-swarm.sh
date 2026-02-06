#!/bin/bash

################################################################################
# Swarm Initialization Script
# Purpose: Initialize Claude-Flow swarm with proper topology and coordination
# Usage: ./scripts/init-swarm.sh [topology] [max-agents]
################################################################################

set -euo pipefail

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Default configuration
DEFAULT_TOPOLOGY="mesh"
DEFAULT_MAX_AGENTS=6
CONFIG_FILE="$(dirname "$0")/../config/swarm-config.json"

################################################################################
# Logging functions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

################################################################################
# Validation functions
################################################################################

validate_topology() {
    local topology=$1
    local valid_topologies=("mesh" "hierarchical" "adaptive" "star" "ring")

    for valid in "${valid_topologies[@]}"; do
        if [[ "$topology" == "$valid" ]]; then
            return 0
        fi
    done

    return 1
}

validate_agent_count() {
    local count=$1
    if [[ "$count" =~ ^[0-9]+$ ]] && [ "$count" -ge 1 ] && [ "$count" -le 20 ]; then
        return 0
    fi
    return 1
}

check_dependencies() {
    log_info "Checking dependencies..."

    if ! command -v npx &> /dev/null; then
        log_error "npx is not installed. Please install Node.js and npm."
        exit 1
    fi

    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js."
        exit 1
    fi

    log_success "All dependencies found"
}

################################################################################
# Configuration management
################################################################################

load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        log_info "Loading configuration from $CONFIG_FILE"

        # Extract values from JSON config
        TOPOLOGY=$(node -pe "JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf8')).swarm.topology" 2>/dev/null || echo "$DEFAULT_TOPOLOGY")
        MAX_AGENTS=$(node -pe "JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf8')).swarm.maxAgents" 2>/dev/null || echo "$DEFAULT_MAX_AGENTS")

        log_success "Configuration loaded: topology=$TOPOLOGY, maxAgents=$MAX_AGENTS"
    else
        log_warning "Config file not found. Using defaults."
        TOPOLOGY=$DEFAULT_TOPOLOGY
        MAX_AGENTS=$DEFAULT_MAX_AGENTS
    fi
}

################################################################################
# Swarm initialization
################################################################################

init_swarm() {
    local topology=$1
    local max_agents=$2

    log_info "Initializing swarm with topology: $topology, max agents: $max_agents"

    # Initialize swarm using Claude Flow
    if npx claude-flow@alpha mcp swarm_init --topology "$topology" --maxAgents "$max_agents"; then
        log_success "Swarm initialized successfully"
    else
        log_error "Failed to initialize swarm"
        return 1
    fi

    # Store initialization in memory
    log_info "Storing swarm initialization data in memory..."
    npx claude-flow@alpha hooks notify --message "Swarm initialized: topology=$topology, maxAgents=$max_agents" || true

    return 0
}

spawn_core_agents() {
    log_info "Spawning core coordination agents..."

    local agents=("researcher" "coder" "tester" "planner" "reviewer")

    for agent in "${agents[@]}"; do
        log_info "Spawning $agent agent..."
        if npx claude-flow@alpha mcp agent_spawn --type "$agent" --capabilities "coordination,memory,hooks"; then
            log_success "$agent agent spawned"
        else
            log_warning "Failed to spawn $agent agent (may already exist)"
        fi
    done
}

check_swarm_status() {
    log_info "Checking swarm status..."

    if npx claude-flow@alpha mcp swarm_status; then
        log_success "Swarm is operational"
        return 0
    else
        log_error "Swarm status check failed"
        return 1
    fi
}

################################################################################
# Main execution
################################################################################

main() {
    echo ""
    log_info "=== Claude-Flow Swarm Initialization ==="
    echo ""

    # Check dependencies first
    check_dependencies

    # Parse command line arguments
    TOPOLOGY="${1:-}"
    MAX_AGENTS="${2:-}"

    # Load from config if not provided
    if [[ -z "$TOPOLOGY" ]] || [[ -z "$MAX_AGENTS" ]]; then
        load_config
    fi

    # Use command line args if provided
    TOPOLOGY="${1:-$TOPOLOGY}"
    MAX_AGENTS="${2:-$MAX_AGENTS}"

    # Validate inputs
    if ! validate_topology "$TOPOLOGY"; then
        log_error "Invalid topology: $TOPOLOGY"
        log_info "Valid topologies: mesh, hierarchical, adaptive, star, ring"
        exit 1
    fi

    if ! validate_agent_count "$MAX_AGENTS"; then
        log_error "Invalid agent count: $MAX_AGENTS (must be 1-20)"
        exit 1
    fi

    # Initialize swarm
    if ! init_swarm "$TOPOLOGY" "$MAX_AGENTS"; then
        log_error "Swarm initialization failed"
        exit 1
    fi

    # Spawn core agents
    spawn_core_agents

    # Verify swarm status
    if ! check_swarm_status; then
        log_error "Swarm verification failed"
        exit 1
    fi

    echo ""
    log_success "=== Swarm initialization complete ==="
    echo ""
    log_info "Next steps:"
    log_info "  1. Use 'npx claude-flow@alpha mcp swarm_status' to check status"
    log_info "  2. Use 'npx claude-flow@alpha mcp agent_list' to see active agents"
    log_info "  3. Start orchestrating tasks with 'npx claude-flow@alpha mcp task_orchestrate'"
    echo ""
}

# Run main function
main "$@"
