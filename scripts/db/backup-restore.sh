#!/bin/bash

# Battleship Database Backup and Restore Utilities
# Provides functions for database backup, restore, and maintenance

set -e

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-battleship_db}"
DB_USER="${DB_USER:-postgres}"
DB_SCHEMA="battleship"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Function to print colored output
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check database connection
check_connection() {
    print_message "$BLUE" "Checking database connection..."

    if PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; then
        print_message "$GREEN" "✓ Database connection successful"
        return 0
    else
        print_message "$RED" "✗ Failed to connect to database"
        return 1
    fi
}

# Function to backup entire database
backup_full() {
    local backup_file="${BACKUP_DIR}/battleship_full_${TIMESTAMP}.sql"

    print_message "$BLUE" "Starting full database backup..."
    print_message "$YELLOW" "Backup file: $backup_file"

    if PGPASSWORD="${DB_PASSWORD}" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -n "$DB_SCHEMA" \
        --verbose \
        --no-owner \
        --no-acl \
        --if-exists \
        --clean \
        --create \
        -f "$backup_file"; then

        # Compress the backup
        gzip "$backup_file"
        backup_file="${backup_file}.gz"

        local size=$(du -h "$backup_file" | cut -f1)
        print_message "$GREEN" "✓ Full backup completed successfully"
        print_message "$GREEN" "  File: $backup_file"
        print_message "$GREEN" "  Size: $size"
    else
        print_message "$RED" "✗ Backup failed"
        return 1
    fi
}

# Function to backup only data (no schema)
backup_data() {
    local backup_file="${BACKUP_DIR}/battleship_data_${TIMESTAMP}.sql"

    print_message "$BLUE" "Starting data-only backup..."
    print_message "$YELLOW" "Backup file: $backup_file"

    if PGPASSWORD="${DB_PASSWORD}" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -n "$DB_SCHEMA" \
        --data-only \
        --verbose \
        --no-owner \
        --no-acl \
        --disable-triggers \
        -f "$backup_file"; then

        gzip "$backup_file"
        backup_file="${backup_file}.gz"

        local size=$(du -h "$backup_file" | cut -f1)
        print_message "$GREEN" "✓ Data backup completed successfully"
        print_message "$GREEN" "  File: $backup_file"
        print_message "$GREEN" "  Size: $size"
    else
        print_message "$RED" "✗ Data backup failed"
        return 1
    fi
}

# Function to backup specific tables
backup_tables() {
    local tables=$1
    local backup_file="${BACKUP_DIR}/battleship_tables_${TIMESTAMP}.sql"

    print_message "$BLUE" "Starting table backup..."
    print_message "$YELLOW" "Tables: $tables"
    print_message "$YELLOW" "Backup file: $backup_file"

    # Convert comma-separated list to pg_dump format
    local table_args=""
    IFS=',' read -ra TABLE_ARRAY <<< "$tables"
    for table in "${TABLE_ARRAY[@]}"; do
        table_args="$table_args -t ${DB_SCHEMA}.$(echo $table | xargs)"
    done

    if PGPASSWORD="${DB_PASSWORD}" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        $table_args \
        --verbose \
        --no-owner \
        --no-acl \
        -f "$backup_file"; then

        gzip "$backup_file"
        backup_file="${backup_file}.gz"

        local size=$(du -h "$backup_file" | cut -f1)
        print_message "$GREEN" "✓ Table backup completed successfully"
        print_message "$GREEN" "  File: $backup_file"
        print_message "$GREEN" "  Size: $size"
    else
        print_message "$RED" "✗ Table backup failed"
        return 1
    fi
}

# Function to restore from backup
restore() {
    local backup_file=$1

    if [ -z "$backup_file" ]; then
        print_message "$RED" "Error: No backup file specified"
        echo "Usage: $0 restore <backup_file>"
        return 1
    fi

    if [ ! -f "$backup_file" ]; then
        print_message "$RED" "Error: Backup file not found: $backup_file"
        return 1
    fi

    print_message "$YELLOW" "⚠️  WARNING: This will overwrite existing data!"
    read -p "Are you sure you want to restore from $backup_file? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        print_message "$YELLOW" "Restore cancelled"
        return 0
    fi

    print_message "$BLUE" "Starting database restore..."

    # Check if file is compressed
    local temp_file=""
    if [[ "$backup_file" == *.gz ]]; then
        temp_file="${backup_file%.gz}"
        print_message "$BLUE" "Decompressing backup file..."
        gunzip -c "$backup_file" > "$temp_file"
        backup_file="$temp_file"
    fi

    if PGPASSWORD="${DB_PASSWORD}" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -f "$backup_file"; then

        print_message "$GREEN" "✓ Database restored successfully"

        # Clean up temporary file
        if [ -n "$temp_file" ]; then
            rm "$temp_file"
        fi
    else
        print_message "$RED" "✗ Restore failed"

        # Clean up temporary file
        if [ -n "$temp_file" ]; then
            rm "$temp_file"
        fi

        return 1
    fi
}

# Function to export data to CSV
export_csv() {
    local export_dir="${BACKUP_DIR}/csv_export_${TIMESTAMP}"
    mkdir -p "$export_dir"

    print_message "$BLUE" "Exporting data to CSV format..."
    print_message "$YELLOW" "Export directory: $export_dir"

    # List of tables to export
    local tables=(
        "users"
        "games"
        "ship_types"
        "ship_placements"
        "game_moves"
        "chat_messages"
        "friendships"
        "tournaments"
        "achievements"
    )

    for table in "${tables[@]}"; do
        local csv_file="${export_dir}/${table}.csv"

        PGPASSWORD="${DB_PASSWORD}" psql \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            -c "\COPY ${DB_SCHEMA}.${table} TO '${csv_file}' WITH CSV HEADER"

        if [ $? -eq 0 ]; then
            print_message "$GREEN" "  ✓ Exported $table"
        else
            print_message "$RED" "  ✗ Failed to export $table"
        fi
    done

    # Create archive
    tar -czf "${export_dir}.tar.gz" -C "${BACKUP_DIR}" "csv_export_${TIMESTAMP}"
    rm -rf "$export_dir"

    print_message "$GREEN" "✓ CSV export completed: ${export_dir}.tar.gz"
}

# Function to clean old backups
clean_old_backups() {
    local days=${1:-30}

    print_message "$BLUE" "Cleaning backups older than $days days..."

    local count=$(find "$BACKUP_DIR" -name "battleship_*.gz" -mtime +$days | wc -l)

    if [ "$count" -eq 0 ]; then
        print_message "$YELLOW" "No old backups to remove"
        return 0
    fi

    print_message "$YELLOW" "Found $count old backup(s)"

    find "$BACKUP_DIR" -name "battleship_*.gz" -mtime +$days -print -delete

    print_message "$GREEN" "✓ Removed $count old backup(s)"
}

# Function to show backup info
show_backups() {
    print_message "$BLUE" "Available backups in $BACKUP_DIR:"

    if [ -z "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
        print_message "$YELLOW" "No backups found"
        return 0
    fi

    echo ""
    printf "%-50s %10s %20s\n" "Filename" "Size" "Modified"
    printf "%-50s %10s %20s\n" "--------" "----" "--------"

    for file in "$BACKUP_DIR"/*.gz "$BACKUP_DIR"/*.sql 2>/dev/null; do
        if [ -f "$file" ]; then
            local filename=$(basename "$file")
            local size=$(du -h "$file" | cut -f1)
            local modified=$(stat -c %y "$file" | cut -d' ' -f1,2 | cut -d'.' -f1)
            printf "%-50s %10s %20s\n" "$filename" "$size" "$modified"
        fi
    done
}

# Function to verify backup
verify_backup() {
    local backup_file=$1

    if [ -z "$backup_file" ]; then
        print_message "$RED" "Error: No backup file specified"
        return 1
    fi

    if [ ! -f "$backup_file" ]; then
        print_message "$RED" "Error: Backup file not found: $backup_file"
        return 1
    fi

    print_message "$BLUE" "Verifying backup file..."

    # Check if file is compressed
    if [[ "$backup_file" == *.gz ]]; then
        if gunzip -t "$backup_file" 2>/dev/null; then
            print_message "$GREEN" "✓ Compression integrity OK"
        else
            print_message "$RED" "✗ Compression integrity check failed"
            return 1
        fi

        # Check SQL syntax
        if gunzip -c "$backup_file" | head -n 1000 | grep -q "PostgreSQL database dump"; then
            print_message "$GREEN" "✓ Valid PostgreSQL dump file"
        else
            print_message "$RED" "✗ Not a valid PostgreSQL dump file"
            return 1
        fi
    else
        # Check SQL syntax for uncompressed file
        if head -n 1000 "$backup_file" | grep -q "PostgreSQL database dump"; then
            print_message "$GREEN" "✓ Valid PostgreSQL dump file"
        else
            print_message "$RED" "✗ Not a valid PostgreSQL dump file"
            return 1
        fi
    fi

    print_message "$GREEN" "✓ Backup verification completed"
}

# Function to create scheduled backup with cron
setup_cron() {
    local schedule=${1:-"0 2 * * *"}  # Default: 2 AM daily

    print_message "$BLUE" "Setting up scheduled backup..."
    print_message "$YELLOW" "Schedule: $schedule"

    local cron_cmd="$schedule cd $(pwd) && ./$(basename $0) backup-full"

    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -q "battleship.*backup"; then
        print_message "$YELLOW" "Cron job already exists. Updating..."
        (crontab -l 2>/dev/null | grep -v "battleship.*backup"; echo "$cron_cmd") | crontab -
    else
        (crontab -l 2>/dev/null; echo "$cron_cmd") | crontab -
    fi

    print_message "$GREEN" "✓ Scheduled backup configured"
    print_message "$BLUE" "Current crontab:"
    crontab -l | grep "battleship"
}

# Main menu
show_menu() {
    echo ""
    print_message "$BLUE" "================================"
    print_message "$BLUE" "Battleship Database Utilities"
    print_message "$BLUE" "================================"
    echo ""
    echo "1)  Backup full database"
    echo "2)  Backup data only"
    echo "3)  Backup specific tables"
    echo "4)  Restore from backup"
    echo "5)  Export to CSV"
    echo "6)  Show available backups"
    echo "7)  Verify backup file"
    echo "8)  Clean old backups"
    echo "9)  Setup scheduled backup"
    echo "10) Check database connection"
    echo "0)  Exit"
    echo ""
}

# Parse command line arguments
if [ $# -gt 0 ]; then
    case "$1" in
        backup-full)
            check_connection && backup_full
            ;;
        backup-data)
            check_connection && backup_data
            ;;
        backup-tables)
            check_connection && backup_tables "$2"
            ;;
        restore)
            check_connection && restore "$2"
            ;;
        export-csv)
            check_connection && export_csv
            ;;
        list)
            show_backups
            ;;
        verify)
            verify_backup "$2"
            ;;
        clean)
            clean_old_backups "${2:-30}"
            ;;
        setup-cron)
            setup_cron "${2:-0 2 * * *}"
            ;;
        check)
            check_connection
            ;;
        *)
            echo "Usage: $0 {backup-full|backup-data|backup-tables|restore|export-csv|list|verify|clean|setup-cron|check}"
            exit 1
            ;;
    esac
else
    # Interactive mode
    while true; do
        show_menu
        read -p "Select option: " option

        case $option in
            1)
                check_connection && backup_full
                ;;
            2)
                check_connection && backup_data
                ;;
            3)
                read -p "Enter table names (comma-separated): " tables
                check_connection && backup_tables "$tables"
                ;;
            4)
                show_backups
                echo ""
                read -p "Enter backup file path: " backup_file
                check_connection && restore "$backup_file"
                ;;
            5)
                check_connection && export_csv
                ;;
            6)
                show_backups
                ;;
            7)
                read -p "Enter backup file path: " backup_file
                verify_backup "$backup_file"
                ;;
            8)
                read -p "Delete backups older than (days) [30]: " days
                days=${days:-30}
                clean_old_backups "$days"
                ;;
            9)
                echo "Enter cron schedule (default: '0 2 * * *' for 2 AM daily)"
                read -p "Schedule: " schedule
                setup_cron "${schedule:-0 2 * * *}"
                ;;
            10)
                check_connection
                ;;
            0)
                print_message "$GREEN" "Goodbye!"
                exit 0
                ;;
            *)
                print_message "$RED" "Invalid option"
                ;;
        esac

        echo ""
        read -p "Press Enter to continue..."
    done
fi