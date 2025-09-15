#!/bin/bash

# Development helper script for Battleship Naval Strategy Game
# Provides quick commands for common development tasks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Show header
show_header() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════╗"
    echo "║   Battleship Naval Strategy Development   ║"
    echo "╚════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Show menu
show_menu() {
    echo -e "${GREEN}Available Commands:${NC}"
    echo ""
    echo "  1) Start Development Server"
    echo "  2) Start with Turbopack (experimental)"
    echo "  3) Start Docker Environment"
    echo "  4) Setup Database"
    echo "  5) Reset Database"
    echo "  6) Run Type Check"
    echo "  7) Run Linter"
    echo "  8) Format Code"
    echo "  9) Run All Checks"
    echo "  10) Build Production"
    echo "  11) Clean Install"
    echo "  12) View Docker Logs"
    echo "  13) Stop Docker Environment"
    echo "  14) Open Database UI (Adminer)"
    echo "  15) Generate Types from DB"
    echo "  0) Exit"
    echo ""
}

# Start development server
start_dev() {
    echo -e "${YELLOW}Starting development server...${NC}"
    npm run dev
}

# Start with Turbopack
start_turbo() {
    echo -e "${YELLOW}Starting with Turbopack...${NC}"
    npm run dev:turbo
}

# Start Docker environment
start_docker() {
    echo -e "${YELLOW}Starting Docker environment...${NC}"
    docker-compose up -d
    echo -e "${GREEN}✓ Docker environment started${NC}"
    echo -e "${YELLOW}Services:${NC}"
    echo "  - App: http://localhost:3000"
    echo "  - Database UI: http://localhost:8080"
    echo "  - Electric SQL: http://localhost:5133"
    echo "  - PostgreSQL: localhost:5432"
    echo "  - Redis: localhost:6379"
}

# Setup database
setup_db() {
    echo -e "${YELLOW}Setting up database...${NC}"
    ./scripts/setup-db.sh
}

# Reset database
reset_db() {
    echo -e "${RED}Warning: This will reset all data!${NC}"
    echo -n "Are you sure? (y/n): "
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Resetting database...${NC}"
        npm run db:reset
        echo -e "${GREEN}✓ Database reset complete${NC}"
    fi
}

# Run type check
type_check() {
    echo -e "${YELLOW}Running type check...${NC}"
    npm run type-check
}

# Run linter
run_lint() {
    echo -e "${YELLOW}Running linter...${NC}"
    npm run lint:fix
}

# Format code
format_code() {
    echo -e "${YELLOW}Formatting code...${NC}"
    npm run format
}

# Run all checks
check_all() {
    echo -e "${YELLOW}Running all checks...${NC}"
    npm run check-all
}

# Build production
build_prod() {
    echo -e "${YELLOW}Building for production...${NC}"
    npm run build
}

# Clean install
clean_install() {
    echo -e "${YELLOW}Performing clean install...${NC}"
    npm run clean
}

# View Docker logs
docker_logs() {
    echo -e "${YELLOW}Showing Docker logs (Ctrl+C to exit)...${NC}"
    docker-compose logs -f
}

# Stop Docker
stop_docker() {
    echo -e "${YELLOW}Stopping Docker environment...${NC}"
    docker-compose down
    echo -e "${GREEN}✓ Docker environment stopped${NC}"
}

# Open Adminer
open_adminer() {
    echo -e "${YELLOW}Opening database UI...${NC}"
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:8080
    elif command -v open &> /dev/null; then
        open http://localhost:8080
    else
        echo -e "${GREEN}Open in browser: http://localhost:8080${NC}"
    fi
}

# Generate types from database
generate_types() {
    echo -e "${YELLOW}Generating TypeScript types from database...${NC}"
    # Add your type generation command here
    # Example: npx prisma generate or npx drizzle-kit generate:pg
    echo -e "${YELLOW}Note: Configure your ORM first (Prisma/Drizzle)${NC}"
}

# Main loop
main() {
    show_header

    # Check if running in Docker
    if [ -f /.dockerenv ]; then
        echo -e "${YELLOW}Note: Running inside Docker container${NC}"
        echo ""
    fi

    while true; do
        show_menu
        echo -n "Select an option: "
        read -r choice

        case $choice in
            1) start_dev ;;
            2) start_turbo ;;
            3) start_docker ;;
            4) setup_db ;;
            5) reset_db ;;
            6) type_check ;;
            7) run_lint ;;
            8) format_code ;;
            9) check_all ;;
            10) build_prod ;;
            11) clean_install ;;
            12) docker_logs ;;
            13) stop_docker ;;
            14) open_adminer ;;
            15) generate_types ;;
            0)
                echo -e "${GREEN}Goodbye!${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}Invalid option. Please try again.${NC}"
                ;;
        esac

        echo ""
        echo -e "${GREEN}Press Enter to continue...${NC}"
        read -r
        clear
        show_header
    done
}

# Handle script arguments
if [ $# -gt 0 ]; then
    case $1 in
        dev) start_dev ;;
        turbo) start_turbo ;;
        docker) start_docker ;;
        db) setup_db ;;
        reset) reset_db ;;
        check) check_all ;;
        build) build_prod ;;
        *)
            echo -e "${RED}Unknown command: $1${NC}"
            echo "Usage: ./scripts/dev.sh [dev|turbo|docker|db|reset|check|build]"
            exit 1
            ;;
    esac
else
    main
fi