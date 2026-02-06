#!/bin/bash

################################################################################
# Environment Setup Script
# Purpose: Setup complete development environment for Claude-Flow project
# Usage: ./scripts/setup-environment.sh [--skip-install] [--dev]
################################################################################

set -euo pipefail

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Flags
SKIP_INSTALL=false
DEV_MODE=false

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

log_step() {
    echo ""
    echo -e "${GREEN}==>${NC} $1"
    echo ""
}

################################################################################
# Parse command line arguments
################################################################################

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-install)
                SKIP_INSTALL=true
                shift
                ;;
            --dev)
                DEV_MODE=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

show_help() {
    cat << EOF
Environment Setup Script

Usage: ./scripts/setup-environment.sh [OPTIONS]

OPTIONS:
    --skip-install    Skip npm package installation
    --dev            Install development dependencies
    --help, -h       Show this help message

EXAMPLES:
    ./scripts/setup-environment.sh
    ./scripts/setup-environment.sh --dev
    ./scripts/setup-environment.sh --skip-install

EOF
}

################################################################################
# Check system requirements
################################################################################

check_requirements() {
    log_step "Checking system requirements"

    local missing_deps=()

    # Check Node.js
    if ! command -v node &> /dev/null; then
        missing_deps+=("Node.js")
    else
        local node_version=$(node --version | sed 's/v//')
        log_info "Node.js version: $node_version"

        # Check if version is >= 18
        local major_version=$(echo "$node_version" | cut -d. -f1)
        if [ "$major_version" -lt 18 ]; then
            log_warning "Node.js version should be >= 18.x (current: $node_version)"
        fi
    fi

    # Check npm
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    else
        log_info "npm version: $(npm --version)"
    fi

    # Check git
    if ! command -v git &> /dev/null; then
        log_warning "git is not installed (optional)"
    else
        log_info "git version: $(git --version | cut -d' ' -f3)"
    fi

    # Report missing dependencies
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        log_info "Please install the missing dependencies and try again"
        exit 1
    fi

    log_success "All required dependencies found"
}

################################################################################
# Create directory structure
################################################################################

create_directories() {
    log_step "Creating directory structure"

    local directories=(
        "src"
        "tests"
        "docs"
        "config"
        "scripts"
        "examples"
        "logs"
        ".claude-flow"
    )

    cd "$PROJECT_ROOT"

    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log_info "Created directory: $dir"
        else
            log_info "Directory exists: $dir"
        fi
    done

    log_success "Directory structure ready"
}

################################################################################
# Install dependencies
################################################################################

install_dependencies() {
    if [ "$SKIP_INSTALL" = true ]; then
        log_step "Skipping dependency installation"
        return 0
    fi

    log_step "Installing dependencies"

    cd "$PROJECT_ROOT"

    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        log_warning "package.json not found. Initializing new project..."
        npm init -y
    fi

    # Install Claude Flow
    log_info "Installing claude-flow@alpha..."
    npm install --save-dev claude-flow@alpha

    # Install development dependencies if dev mode
    if [ "$DEV_MODE" = true ]; then
        log_info "Installing development dependencies..."

        local dev_deps=(
            "jest"
            "eslint"
            "prettier"
            "@types/node"
            "typescript"
        )

        for dep in "${dev_deps[@]}"; do
            log_info "Installing $dep..."
            npm install --save-dev "$dep" || log_warning "Failed to install $dep"
        done
    fi

    log_success "Dependencies installed"
}

################################################################################
# Setup MCP servers
################################################################################

setup_mcp_servers() {
    log_step "Setting up MCP servers"

    # Check if claude CLI is available
    if ! command -v claude &> /dev/null; then
        log_warning "Claude CLI not found. Skipping MCP setup."
        log_info "Install Claude CLI from: https://claude.ai/cli"
        return 0
    fi

    # Add claude-flow MCP server
    log_info "Adding claude-flow MCP server..."
    if claude mcp add claude-flow npx claude-flow@alpha mcp start; then
        log_success "claude-flow MCP server added"
    else
        log_warning "Failed to add claude-flow MCP server (may already exist)"
    fi

    # Optional: Add ruv-swarm
    log_info "Optional: Adding ruv-swarm MCP server..."
    if claude mcp add ruv-swarm npx ruv-swarm mcp start 2>/dev/null; then
        log_success "ruv-swarm MCP server added"
    else
        log_info "Skipped ruv-swarm (optional)"
    fi

    log_success "MCP servers configured"
}

################################################################################
# Initialize configuration files
################################################################################

init_config_files() {
    log_step "Initializing configuration files"

    cd "$PROJECT_ROOT"

    # Create .gitignore if it doesn't exist
    if [ ! -f ".gitignore" ]; then
        log_info "Creating .gitignore..."
        cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json

# Logs
logs/
*.log

# Environment variables
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Build outputs
dist/
build/
*.tsbuildinfo

# Claude Flow
.claude-flow/cache/
.claude-flow/temp/

# Testing
coverage/
.nyc_output/

# Temporary files
*.tmp
*.temp
EOF
        log_success ".gitignore created"
    fi

    # Create README if it doesn't exist
    if [ ! -f "README.md" ]; then
        log_info "Creating README.md..."
        cat > README.md << 'EOF'
# YouTube Summariser with Claude-Flow

A SPARC-based development project using Claude-Flow orchestration.

## Quick Start

```bash
# Setup environment
./scripts/setup-environment.sh

# Initialize swarm
./scripts/init-swarm.sh

# Check status
npx claude-flow@alpha mcp swarm_status
```

## Documentation

See `/docs` directory for detailed documentation.

## Development

Follow SPARC methodology:
- Specification
- Pseudocode
- Architecture
- Refinement
- Completion

EOF
        log_success "README.md created"
    fi

    log_success "Configuration files initialized"
}

################################################################################
# Make scripts executable
################################################################################

make_scripts_executable() {
    log_step "Making scripts executable"

    cd "$PROJECT_ROOT/scripts"

    for script in *.sh; do
        if [ -f "$script" ]; then
            chmod +x "$script"
            log_info "Made executable: $script"
        fi
    done

    log_success "All scripts are executable"
}

################################################################################
# Verify installation
################################################################################

verify_installation() {
    log_step "Verifying installation"

    local errors=0

    # Check if claude-flow is installed
    if npm list claude-flow &> /dev/null; then
        log_success "claude-flow package installed"
    else
        log_error "claude-flow package not found"
        ((errors++))
    fi

    # Check if directories exist
    local required_dirs=("src" "tests" "config" "scripts")
    for dir in "${required_dirs[@]}"; do
        if [ -d "$PROJECT_ROOT/$dir" ]; then
            log_success "Directory exists: $dir"
        else
            log_error "Directory missing: $dir"
            ((errors++))
        fi
    done

    # Check if config file exists
    if [ -f "$PROJECT_ROOT/config/swarm-config.json" ]; then
        log_success "Configuration file exists"
    else
        log_error "Configuration file missing"
        ((errors++))
    fi

    if [ $errors -eq 0 ]; then
        log_success "Installation verified successfully"
        return 0
    else
        log_error "Installation verification failed with $errors error(s)"
        return 1
    fi
}

################################################################################
# Main execution
################################################################################

main() {
    echo ""
    log_info "=== Claude-Flow Environment Setup ==="
    echo ""

    # Parse arguments
    parse_args "$@"

    # Run setup steps
    check_requirements
    create_directories
    install_dependencies
    setup_mcp_servers
    init_config_files
    make_scripts_executable
    verify_installation

    echo ""
    log_success "=== Environment setup complete ==="
    echo ""
    log_info "Next steps:"
    log_info "  1. Review configuration in ./config/swarm-config.json"
    log_info "  2. Initialize swarm with ./scripts/init-swarm.sh"
    log_info "  3. Start developing with SPARC methodology"
    log_info "  4. Use 'npx claude-flow sparc modes' to see available modes"
    echo ""
}

# Run main function
main "$@"
