#!/bin/bash

# Database setup script for Battleship Naval Strategy Game
# This script initializes PostgreSQL and Electric SQL for development

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚢 Battleship Database Setup Script${NC}"
echo "======================================"

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
    echo -e "${GREEN}✓ Loaded environment variables from .env.local${NC}"
else
    echo -e "${RED}✗ .env.local file not found!${NC}"
    echo "Please copy .env.example to .env.local and configure it."
    exit 1
fi

# Parse database connection string
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\(.*\)/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')

echo -e "${YELLOW}Database Configuration:${NC}"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Function to check if PostgreSQL is running
check_postgres() {
    if command -v pg_isready &> /dev/null; then
        pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER &> /dev/null
        return $?
    else
        echo -e "${YELLOW}Warning: pg_isready not found. Attempting connection...${NC}"
        return 1
    fi
}

# Function to run SQL file
run_sql() {
    local sql_file=$1
    local db_name=${2:-$DB_NAME}

    if [ -f "$sql_file" ]; then
        echo -e "${YELLOW}Running: $sql_file${NC}"
        PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $db_name -f $sql_file
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Successfully executed $sql_file${NC}"
        else
            echo -e "${RED}✗ Failed to execute $sql_file${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗ File not found: $sql_file${NC}"
        return 1
    fi
}

# Check if PostgreSQL is running
echo -e "${YELLOW}Checking PostgreSQL connection...${NC}"
if check_postgres; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
else
    echo -e "${RED}✗ PostgreSQL is not accessible${NC}"
    echo "Please ensure PostgreSQL is running and accessible at $DB_HOST:$DB_PORT"

    # Offer to start PostgreSQL with Docker
    echo ""
    echo -e "${YELLOW}Would you like to start PostgreSQL using Docker? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Starting PostgreSQL with Docker...${NC}"
        docker run -d \
            --name battleship-postgres \
            -e POSTGRES_USER=$DB_USER \
            -e POSTGRES_PASSWORD=$DB_PASS \
            -e POSTGRES_DB=$DB_NAME \
            -p $DB_PORT:5432 \
            -v battleship-postgres-data:/var/lib/postgresql/data \
            postgres:15-alpine

        echo -e "${YELLOW}Waiting for PostgreSQL to start...${NC}"
        sleep 5

        if check_postgres; then
            echo -e "${GREEN}✓ PostgreSQL started successfully${NC}"
        else
            echo -e "${RED}✗ Failed to start PostgreSQL${NC}"
            exit 1
        fi
    else
        exit 1
    fi
fi

# Create database if it doesn't exist
echo -e "${YELLOW}Checking if database exists...${NC}"
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Creating database: $DB_NAME${NC}"
    PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME;"
    echo -e "${GREEN}✓ Database created${NC}"
else
    echo -e "${GREEN}✓ Database already exists${NC}"
fi

# Initialize database schema
echo ""
echo -e "${YELLOW}Initializing database schema...${NC}"
run_sql "scripts/db/init.sql"

# Ask about seeding data
echo ""
echo -e "${YELLOW}Would you like to seed the database with sample data? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    run_sql "scripts/db/seed.sql"
fi

# Setup Electric SQL (if needed)
echo ""
echo -e "${YELLOW}Setting up Electric SQL...${NC}"

# Check if Electric service is configured
if [ ! -z "$ELECTRIC_SERVICE_URL" ]; then
    echo -e "${YELLOW}Electric SQL configuration detected${NC}"
    echo "  Service URL: $ELECTRIC_SERVICE_URL"

    # Create electric user if needed
    echo -e "${YELLOW}Creating Electric SQL user...${NC}"
    PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<EOF
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'electric') THEN
        CREATE USER electric WITH PASSWORD 'electric_pass';
        GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO electric;
    END IF;
END
\$\$;
EOF
    echo -e "${GREEN}✓ Electric SQL user configured${NC}"

    # Enable logical replication
    echo -e "${YELLOW}Enabling logical replication...${NC}"
    PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "ALTER SYSTEM SET wal_level = logical;"
    echo -e "${GREEN}✓ Logical replication enabled (restart PostgreSQL to apply)${NC}"
else
    echo -e "${YELLOW}⚠ Electric SQL not configured in .env.local${NC}"
fi

# Create backup script
echo ""
echo -e "${YELLOW}Creating backup script...${NC}"
cat > scripts/backup-db.sh << 'EOF'
#!/bin/bash
# Database backup script

source .env.local

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups"
BACKUP_FILE="$BACKUP_DIR/battleship_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

echo "Creating backup: $BACKUP_FILE"
PGPASSWORD=$DB_PASS pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✓ Backup created successfully"
    # Keep only last 5 backups
    ls -t $BACKUP_DIR/*.sql | tail -n +6 | xargs -r rm
    echo "✓ Old backups cleaned up"
else
    echo "✗ Backup failed"
    exit 1
fi
EOF

chmod +x scripts/backup-db.sh
echo -e "${GREEN}✓ Backup script created at scripts/backup-db.sh${NC}"

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 Database setup completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Start the development server: npm run dev"
echo "  2. Access the application at: http://localhost:3000"
echo ""
echo "Useful commands:"
echo "  - Backup database: ./scripts/backup-db.sh"
echo "  - Reset database: ./scripts/setup-db.sh"
echo "  - View logs: docker logs battleship-postgres (if using Docker)"
echo ""