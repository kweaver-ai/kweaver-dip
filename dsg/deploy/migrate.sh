#!/bin/bash

DB_USER="root"
DB_PASS="root123"
DB_NAME="dsg"
CONTAINER="mariadb"

echo "Waiting for MariaDB..."
until docker compose exec -T $CONTAINER mysqladmin ping -h localhost -u $DB_USER -p$DB_PASS --silent; do
    echo "MariaDB is unavailable - sleeping"
    sleep 2
done

apply_sql() {
    local file=$1
    echo "Applying $file..."
    # Strip USE statements and replace DB names with dsg
    sed -e 's/USE .*;//g' -e 's/af_configuration/dsg/g' -e 's/af_data_catalog/dsg/g' "$file" | docker compose exec -T $CONTAINER mysql -u $DB_USER -p$DB_PASS $DB_NAME
}

# Order matters? configuration-center seems foundational.
SERVICES=("configuration-center" "auth-service" "data-catalog" "data-exploration-service" "data-subject" "data-view" "session" "task_center")

for service in "${SERVICES[@]}"; do
    # Find init.sql (handling task-center vs task_center directory name if needed)
    # The directory is services/apps/task_center but Makefile says task_center?
    # Actually directory on disk is task_center.
    
    # Locate init.sql
    INIT_SQL=$(find ../services/apps/$service/migrations/mariadb/0.1.0/pre -name "init.sql" 2>/dev/null | head -n 1)
    
    if [ -f "$INIT_SQL" ]; then
        apply_sql "$INIT_SQL"
    else
        echo "No init.sql found for $service"
    fi
    
    # Also apply numbered SQLs for configuration-center if any?
    if [ "$service" == "configuration-center" ]; then
         for f in $(find ../services/apps/$service/migrations/mariadb/0.1.0/pre -name "*.sql" | sort); do
            if [ "$f" != "$INIT_SQL" ]; then
                apply_sql "$f"
            fi
         done
    fi
    # Same for data-catalog
    if [ "$service" == "data-catalog" ]; then
         for f in $(find ../services/apps/$service/migrations/mariadb/0.1.0/pre -name "*.sql" | sort); do
            if [ "$f" != "$INIT_SQL" ]; then
                apply_sql "$f"
            fi
         done
    fi
done

echo "Migration completed."
