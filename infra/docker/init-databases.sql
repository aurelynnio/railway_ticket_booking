-- =============================================================================
-- PostgreSQL init script: create per-service databases
-- This script runs automatically on first PostgreSQL container startup.
-- Each microservice gets its own isolated database for data independence.
-- The 'app' user is created via POSTGRES_USER/POSTGRES_PASSWORD env vars.
-- =============================================================================

CREATE DATABASE railway_auth
  WITH ENCODING 'UTF8' LC_COLLATE 'en_US.utf8' LC_CTYPE 'en_US.utf8' TEMPLATE template0;

CREATE DATABASE railway_users
  WITH ENCODING 'UTF8' LC_COLLATE 'en_US.utf8' LC_CTYPE 'en_US.utf8' TEMPLATE template0;

CREATE DATABASE railway_orders
  WITH ENCODING 'UTF8' LC_COLLATE 'en_US.utf8' LC_CTYPE 'en_US.utf8' TEMPLATE template0;

CREATE DATABASE railway_payments
  WITH ENCODING 'UTF8' LC_COLLATE 'en_US.utf8' LC_CTYPE 'en_US.utf8' TEMPLATE template0;

CREATE DATABASE railway_notifications
  WITH ENCODING 'UTF8' LC_COLLATE 'en_US.utf8' LC_CTYPE 'en_US.utf8' TEMPLATE template0;

-- Grant access to the application user (created by POSTGRES_USER env)
GRANT ALL PRIVILEGES ON DATABASE railway_auth TO app;
GRANT ALL PRIVILEGES ON DATABASE railway_users TO app;
GRANT ALL PRIVILEGES ON DATABASE railway_orders TO app;
GRANT ALL PRIVILEGES ON DATABASE railway_payments TO app;
GRANT ALL PRIVILEGES ON DATABASE railway_notifications TO app;
