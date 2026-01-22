/**
 * Shared types for authentication routes
 */

export interface CheckProviderRequest {
    email: string;
}

export interface CheckProviderResponse {
    exists: boolean;
    provider: string | null;
    isOAuth: boolean;
}
