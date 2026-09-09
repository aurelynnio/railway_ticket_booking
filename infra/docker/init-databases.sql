-- =============================================================================
-- PostgreSQL init script: create per-service databases
-- This script runs automatically on first PostgreSQL container startup.
-- Each microservice gets its own isolated database for data independence.
-- The 'app' user is created via POSTGRES_USER/POSTGRES_PASSWORD env vars.
-- =============================================================================

CREATE DATABASE railway_auth
  WITH ENCODING 'UTF8' LC_COLLATE 'en_US.utf8' LC_CTYPE 'en_US.utf8' TEMPLATE template0;

CREATE DATABASE railway_orders
  WITH ENCODING 'UTF8' LC_COLLATE 'en_US.utf8' LC_CTYPE 'en_US.utf8' TEMPLATE template0;

CREATE DATABASE railway_payments
  WITH ENCODING 'UTF8' LC_COLLATE 'en_US.utf8' LC_CTYPE 'en_US.utf8' TEMPLATE template0;

CREATE DATABASE railway_notifications
  WITH ENCODING 'UTF8' LC_COLLATE 'en_US.utf8' LC_CTYPE 'en_US.utf8' TEMPLATE template0;

CREATE DATABASE railway_tickets
  WITH ENCODING 'UTF8' LC_COLLATE 'en_US.utf8' LC_CTYPE 'en_US.utf8' TEMPLATE template0;

-- Grant access to the application user created from POSTGRES_USER.
GRANT ALL PRIVILEGES ON DATABASE railway_auth TO CURRENT_USER;
GRANT ALL PRIVILEGES ON DATABASE railway_orders TO CURRENT_USER;
GRANT ALL PRIVILEGES ON DATABASE railway_payments TO CURRENT_USER;
GRANT ALL PRIVILEGES ON DATABASE railway_notifications TO CURRENT_USER;
GRANT ALL PRIVILEGES ON DATABASE railway_tickets TO CURRENT_USER;
