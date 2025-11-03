# Prisma P1010 Error with PostgreSQL 15

## Issue Overview

When running Prisma migrations with PostgreSQL 15, you may encounter the following error:

```
Error: P1010: User `principle_user` was denied access on the database `principle_nodes_db.public`
```

This error occurs even when the database user has **superuser privileges**, owns the database, and owns the public schema.

## Root Cause

### PostgreSQL 15 Security Enhancement

PostgreSQL 15 introduced a breaking change to the `public` schema permissions as part of addressing **CVE-2018-1058** (a security vulnerability from 2018).

#### What Changed in PostgreSQL 15:

1. **Removed PUBLIC creation permission on the public schema**
   - Prior to PostgreSQL 15, any user could create objects in the `public` schema by default
   - This created a security risk where malicious users could create objects that trick other users into using them instead of system catalog objects

2. **Changed public schema ownership**
   - Created a new role: `pg_database_owner`
   - Changed the owner of the `public` schema to `pg_database_owner`
   - This allows each database's owner to have ownership privileges on the `public` schema within their database

3. **Applies to new databases only**
   - New database clusters (fresh PostgreSQL 15 installations)
   - Newly-created databases in existing clusters
   - Upgraded databases preserve their existing permissions

### Why This Affects Prisma

Prisma Migrate performs various operations on the database schema including:
- Creating tables, indexes, and constraints
- Creating shadow databases for migration validation
- Managing the `_prisma_migrations` table

Even though the user may have superuser privileges, Prisma Migrate's internal checks may fail due to the restrictive default permissions on the `public` schema in PostgreSQL 15.

## The Security Vulnerability (CVE-2018-1058)

The original vulnerability allowed an attacker to:
1. Create malicious functions or tables in the `public` schema
2. Exploit the default schema search path to intercept queries
3. Execute arbitrary code or access sensitive data

PostgreSQL 15's change implements one of the recommended "secure schema usage patterns" to prevent this attack vector.

## Solutions

### Solution 1: Grant Schema Permissions (Recommended for Docker/Local Development)

Connect to each database and grant the necessary permissions:

```bash
# For principle_nodes_db
docker exec principle-postgres-nodes psql -U principle_user -d principle_nodes_db -c "GRANT USAGE, CREATE ON SCHEMA public TO principle_user;"

# For principle_edges_db
docker exec principle-postgres-edges psql -U principle_user -d principle_edges_db -c "GRANT USAGE, CREATE ON SCHEMA public TO principle_user;"

# For principle_media_db
docker exec principle-postgres-media psql -U principle_user -d principle_media_db -c "GRANT USAGE, CREATE ON SCHEMA public TO principle_user;"
```

### Solution 2: Grant to PUBLIC (Less Secure, but matches pre-PostgreSQL 15 behavior)

If you want to restore the pre-PostgreSQL 15 permissive behavior:

```sql
GRANT USAGE, CREATE ON SCHEMA public TO PUBLIC;
```

**⚠️ Security Warning**: This reverts the PostgreSQL 15 security enhancement and should only be used in development environments.

### Solution 3: Use PostgreSQL 14

Downgrade to PostgreSQL 14 which has the traditional permissive `public` schema permissions:

```yaml
# docker-compose.yml
services:
  postgres-nodes:
    image: postgres:14  # Changed from postgres:15
    # ... rest of configuration
```

### Solution 4: Create Tables Manually

Bypass Prisma Migrate by creating tables manually via SQL:

```bash
docker exec principle-postgres-nodes psql -U principle_user -d principle_nodes_db <<'SQL'
CREATE TABLE IF NOT EXISTS "mindmaps" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "viewport" JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "zoom": 1}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "mindmaps_pkey" PRIMARY KEY ("id")
);
SQL
```

### Solution 5: Use a Shadow Database (For Production)

Configure Prisma to use a shadow database with appropriate permissions:

```prisma
// prisma/schema.prisma
datasource db {
  provider          = "postgresql"
  url               = env("DATABASE_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
}
```

## Recommended Approach for the Principle Project

For the **Principle** project, we recommend **Solution 1** (Grant Schema Permissions) because:

1. ✅ Maintains security by granting permissions only to the specific application user
2. ✅ Works with Docker containers in local development
3. ✅ Doesn't revert PostgreSQL 15's security enhancements
4. ✅ Allows Prisma Migrate to function normally

### Implementation Steps:

1. **Update Docker Compose** to include an initialization script:

```yaml
# docker-compose.yml
services:
  postgres-nodes:
    image: postgres:15
    container_name: principle-postgres-nodes
    environment:
      POSTGRES_DB: principle_nodes_db
      POSTGRES_USER: principle_user
      POSTGRES_PASSWORD: principle_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres-nodes-data:/var/lib/postgresql/data
      - ./docker/init-db.sh:/docker-entrypoint-initdb.d/init-db.sh
```

2. **Create initialization script** (`docker/init-db.sh`):

```bash
#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    GRANT USAGE, CREATE ON SCHEMA public TO $POSTGRES_USER;
    GRANT ALL ON SCHEMA public TO $POSTGRES_USER;
EOSQL
```

3. **Restart containers** with fresh volumes:

```bash
docker-compose down -v
docker-compose up -d
```

4. **Run Prisma migrations**:

```bash
cd node-service && npx prisma migrate dev --name init
cd edge-service && npx prisma migrate dev --name init
cd media-service && npx prisma migrate dev --name init
```

## Migration Guide for Existing PostgreSQL 15 Databases

If you're upgrading an existing database to PostgreSQL 15, the permissions are preserved. However, to adopt the new secure defaults, manually run:

```sql
ALTER SCHEMA public OWNER TO pg_database_owner;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
```

Then grant permissions to specific application users as needed:

```sql
GRANT USAGE, CREATE ON SCHEMA public TO your_app_user;
```

## References

- **PostgreSQL 15 Release Notes**: https://www.postgresql.org/docs/15/release-15.html
- **CVE-2018-1058**: Security vulnerability that prompted this change
- **Prisma Issue #13384**: https://github.com/prisma/prisma/issues/13384
- **EnterpriseDB Blog**: "New Public Schema Permissions in PostgreSQL 15"
- **Stack Overflow Discussion**: https://stackoverflow.com/questions/74110708/postgres-15-permission-denied-for-schema-public

## Best Practices Going Forward

1. **Avoid using the public schema** except for casual development
2. **Create application-specific schemas** with explicit permissions
3. **Use the principle of least privilege** - grant only necessary permissions
4. **Document schema permissions** in your project setup guide

## Additional Notes

- The `principle_user` in the Principle project is configured as a superuser in the Docker containers
- Despite superuser status, Prisma Migrate may still encounter permission issues due to how it validates schemas
- This is a known issue in the Prisma community with PostgreSQL 15
- Future Prisma versions may handle PostgreSQL 15's permission model more gracefully

---

**Last Updated**: November 2, 2025
**PostgreSQL Version**: 15.x
**Prisma Version**: 5.7.1
