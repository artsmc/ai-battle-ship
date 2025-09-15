#!/bin/bash

# Database Initialization Script
# Sets up the complete Battleship database with schema, seed data, and test data

set -e

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-battleship_db}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if database exists
database_exists() {
    PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"
}

# Function to create database
create_database() {
    print_message "$BLUE" "Creating database '$DB_NAME'..."

    if database_exists; then
        print_message "$YELLOW" "Database '$DB_NAME' already exists"
        read -p "Do you want to drop and recreate it? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;"
            PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"
            print_message "$GREEN" "✓ Database recreated"
        else
            print_message "$YELLOW" "Using existing database"
        fi
    else
        PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"
        print_message "$GREEN" "✓ Database created"
    fi
}

# Function to run SQL file
run_sql_file() {
    local file=$1
    local description=$2

    if [ ! -f "$file" ]; then
        print_message "$RED" "✗ File not found: $file"
        return 1
    fi

    print_message "$BLUE" "$description"
    print_message "$YELLOW" "  Running: $(basename $file)"

    if PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file" > /dev/null 2>&1; then
        print_message "$GREEN" "  ✓ Success"
        return 0
    else
        print_message "$RED" "  ✗ Failed"
        PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file"
        return 1
    fi
}

# Function to generate test data
generate_test_data() {
    print_message "$BLUE" "Generating test data..."

    cd "$SCRIPT_DIR/../.."

    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_message "$YELLOW" "Installing dependencies..."
        npm install
    fi

    # Run test data generation
    if [ -f "$SCRIPT_DIR/generate-test-data.ts" ]; then
        print_message "$YELLOW" "  Running test data generator..."
        npx tsx "$SCRIPT_DIR/generate-test-data.ts"
        print_message "$GREEN" "  ✓ Test data generated"
    else
        print_message "$YELLOW" "  ⚠ Test data generator not found, skipping"
    fi
}

# Function to verify installation
verify_installation() {
    print_message "$BLUE" "Verifying installation..."

    # Check tables
    local table_count=$(PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'battleship';")
    print_message "$GREEN" "  ✓ Tables created: $table_count"

    # Check data
    local user_count=$(PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM battleship.users;" 2>/dev/null || echo "0")
    local ship_count=$(PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM battleship.ship_types;" 2>/dev/null || echo "0")
    local game_count=$(PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM battleship.games;" 2>/dev/null || echo "0")

    print_message "$GREEN" "  ✓ Users: $user_count"
    print_message "$GREEN" "  ✓ Ship types: $ship_count"
    print_message "$GREEN" "  ✓ Games: $game_count"
}

# Function to show connection string
show_connection_info() {
    print_message "$BLUE" "\nConnection Information:"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  User: $DB_USER"
    echo ""
    print_message "$YELLOW" "Connection string:"
    echo "  postgresql://$DB_USER:****@$DB_HOST:$DB_PORT/$DB_NAME"
    echo ""
    print_message "$YELLOW" "Environment variables for .env file:"
    echo "  DATABASE_URL=\"postgresql://$DB_USER:\$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME\""
    echo "  DB_HOST=\"$DB_HOST\""
    echo "  DB_PORT=\"$DB_PORT\""
    echo "  DB_NAME=\"$DB_NAME\""
    echo "  DB_USER=\"$DB_USER\""
    echo "  DB_PASSWORD=\"\$DB_PASSWORD\""
}

# Main execution
main() {
    print_message "$BLUE" "================================"
    print_message "$BLUE" "Battleship Database Setup"
    print_message "$BLUE" "================================"
    echo ""

    # Parse command line options
    SKIP_CREATE=false
    SKIP_SCHEMA=false
    SKIP_SEED=false
    SKIP_TEST_DATA=false
    SCHEMA_FILE="$SCRIPT_DIR/schema-enhanced.sql"

    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-create)
                SKIP_CREATE=true
                shift
                ;;
            --skip-schema)
                SKIP_SCHEMA=true
                shift
                ;;
            --skip-seed)
                SKIP_SEED=true
                shift
                ;;
            --skip-test-data)
                SKIP_TEST_DATA=true
                shift
                ;;
            --basic-schema)
                SCHEMA_FILE="$SCRIPT_DIR/init.sql"
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --skip-create     Skip database creation"
                echo "  --skip-schema     Skip schema creation"
                echo "  --skip-seed       Skip seed data"
                echo "  --skip-test-data  Skip test data generation"
                echo "  --basic-schema    Use basic schema instead of enhanced"
                echo "  --help           Show this help message"
                exit 0
                ;;
            *)
                print_message "$RED" "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    # Step 1: Create database
    if [ "$SKIP_CREATE" = false ]; then
        create_database
    else
        print_message "$YELLOW" "Skipping database creation"
    fi

    # Step 2: Create schema
    if [ "$SKIP_SCHEMA" = false ]; then
        run_sql_file "$SCHEMA_FILE" "Creating database schema..." || exit 1
    else
        print_message "$YELLOW" "Skipping schema creation"
    fi

    # Step 3: Load ship types and seed data
    if [ "$SKIP_SEED" = false ]; then
        if [ -f "$SCRIPT_DIR/seed-ship-types.sql" ]; then
            run_sql_file "$SCRIPT_DIR/seed-ship-types.sql" "Loading ship types..." || exit 1
        fi

        if [ -f "$SCRIPT_DIR/seed.sql" ]; then
            run_sql_file "$SCRIPT_DIR/seed.sql" "Loading seed data..." || exit 1
        fi
    else
        print_message "$YELLOW" "Skipping seed data"
    fi

    # Step 4: Generate test data
    if [ "$SKIP_TEST_DATA" = false ]; then
        generate_test_data
    else
        print_message "$YELLOW" "Skipping test data generation"
    fi

    # Step 5: Verify installation
    verify_installation

    # Step 6: Show connection info
    show_connection_info

    print_message "$GREEN" "\n✅ Database setup completed successfully!"
    print_message "$BLUE" "\nNext steps:"
    echo "  1. Update your .env file with the database credentials"
    echo "  2. Run 'npm run dev' to start the application"
    echo "  3. Access the application at http://localhost:3000"
    echo ""
    print_message "$YELLOW" "Backup reminder:"
    echo "  Run './backup-restore.sh' to set up automated backups"
}

# Check prerequisites
command -v psql >/dev/null 2>&1 || {
    print_message "$RED" "Error: PostgreSQL client (psql) is not installed"
    echo "Please install PostgreSQL client tools and try again"
    exit 1
}

# Run main function
main "$@"