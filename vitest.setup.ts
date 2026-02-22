/// <reference types="vitest/globals" />
import '@testing-library/jest-dom'
import '@testing-library/dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import React from 'react'

// Set dummy env vars for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://dummy.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'dummy-key'

// Cleanup after each test
afterEach(() => {
    cleanup()
})

// Mock @/lib/supabase/server
vi.mock('@/lib/supabase/server', () => {
    const mockClient = {
        auth: {
            getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
            getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
            refreshSession: vi.fn(async () => ({ data: { session: null, user: null }, error: null })),
            signOut: vi.fn(async () => ({ error: null })),
            signInWithPassword: vi.fn(async () => ({ data: { user: null, session: null }, error: null })),
            signUp: vi.fn(async () => ({ data: { user: null, session: null }, error: null })),
            resetPasswordForEmail: vi.fn(async () => ({ data: {}, error: null })),
            updateUser: vi.fn(async () => ({ data: { user: null }, error: null })),
        }
    }
    return {
        createServerSupabaseClient: vi.fn(async () => mockClient),
        createClient: vi.fn(() => mockClient),
    }
})

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
        prefetch: vi.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/image', () => ({
    default: (props: any) => {
        const { fill, unoptimized, priority, ...rest } = props;
        const cleanProps = {
            ...rest,
            fill: fill ? "true" : undefined,
            unoptimized: unoptimized ? "true" : undefined,
            priority: priority ? "true" : undefined,
        };
        // eslint-disable-next-line @next/next/no-img-element
        return React.createElement('img', cleanProps);
    },
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}))

// Mock PointerEvent (for Radix UI)
if (!global.PointerEvent) {
    class PointerEvent extends MouseEvent {
        constructor(type: string, params: PointerEventInit = {}) {
            super(type, params)
        }
    }
    // @ts-expect-error - Mocking PointerEvent for Radix UI
    global.PointerEvent = PointerEvent
}

// Mock next/headers
vi.mock('next/headers', () => ({
    cookies: async () => ({
        get: vi.fn(),
        getAll: vi.fn(() => []),
        set: vi.fn(),
        delete: vi.fn(),
        has: vi.fn(),
    }),
    headers: async () => new Map(),
}))

// Mock next/server
vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn((data, init) => ({
            ...init,
            json: async () => data,
        })),
        next: vi.fn(),
        redirect: vi.fn((url) => ({
            headers: new Map([['location', url]]),
        })),
    },
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
})
