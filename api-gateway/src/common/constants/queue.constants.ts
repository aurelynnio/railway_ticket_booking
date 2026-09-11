/**
 * Centralized RabbitMQ queue name constants.
 * Used across all gateway modules for downstream microservice communication.
 */

export const AUTH_QUEUE = 'auth_queue';
export const ORDERS_QUEUE = 'orders_queue';
export const PAYMENTS_QUEUE = 'payments_queue';
export const TICKETS_QUEUE = 'tickets_queue';
export const NOTIFICATIONS_QUEUE = 'notifications_queue';
export const DEAD_LETTER_QUEUE = 'railway_dead_letter_queue';

