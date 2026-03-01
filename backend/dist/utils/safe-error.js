"use strict";
/**
 * Sanitize error messages for production responses.
 * Prevents leaking internal database/infrastructure details to clients.
 *
 * SECURITY: Raw Supabase/PostgreSQL error messages contain table names,
 * constraint names, and query details that aid attackers in reconnaissance.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeErrorMessage = safeErrorMessage;
const SENSITIVE_PATTERNS = [
    /relation ".*?" does not exist/i,
    /column ".*?" of relation/i,
    /duplicate key value violates unique constraint/i,
    /violates foreign key constraint/i,
    /invalid input syntax for/i,
    /permission denied for/i,
    /SUPABASE_/i,
    /POSTGRES/i,
    /pg_/i,
    /42[0-9]{3}/, // PostgreSQL error codes
    /23[0-9]{3}/, // Constraint violation codes
    /ECONNREFUSED/i, // Network errors
    /ENOTFOUND/i, // DNS resolution failures
    /ETIMEDOUT/i, // Connection timeout
    /getaddrinfo/i, // DNS lookup failures
    /connect ECONNRESET/i, // Connection reset
    /socket hang up/i, // Socket errors
];
/** Returns true if the error message contains sensitive internal details */
function isSensitiveMessage(message) {
    return SENSITIVE_PATTERNS.some(pattern => pattern.test(message));
}
/**
 * Extracts a safe error message suitable for client consumption.
 * In production, replaces sensitive messages with a generic one.
 */
function safeErrorMessage(error, fallback = 'Bir hata oluştu') {
    const message = error instanceof Error ? error.message : String(error || fallback);
    if (process.env.NODE_ENV === 'production' && isSensitiveMessage(message)) {
        return fallback;
    }
    return message;
}
