-- =============================================================================
-- MySQL init script: create per-service databases
-- This script runs automatically on first MySQL container startup.
-- Each microservice gets its own isolated database for data independence.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `railway_auth`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS `railway_users`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS `railway_orders`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS `railway_payments`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS `railway_notifications`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant access to the application user
GRANT ALL PRIVILEGES ON `railway_auth`.* TO 'app'@'%';
GRANT ALL PRIVILEGES ON `railway_users`.* TO 'app'@'%';
GRANT ALL PRIVILEGES ON `railway_orders`.* TO 'app'@'%';
GRANT ALL PRIVILEGES ON `railway_payments`.* TO 'app'@'%';
GRANT ALL PRIVILEGES ON `railway_notifications`.* TO 'app'@'%';

FLUSH PRIVILEGES;
