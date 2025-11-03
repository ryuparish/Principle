#!/bin/bash
set -e

echo "Initializing principle_edges_db permissions..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    GRANT USAGE ON SCHEMA public TO $POSTGRES_USER;
    GRANT CREATE ON SCHEMA public TO $POSTGRES_USER;
    GRANT ALL ON SCHEMA public TO $POSTGRES_USER;
    ALTER SCHEMA public OWNER TO $POSTGRES_USER;
EOSQL

echo "Permissions granted successfully for principle_edges_db"
