/// <reference types="vitest/globals" />
import '@testing-library/dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import React from 'react'

// Cleanup after each test
afterEach(() => {
    cleanup()
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

// Mock next/image
vi.mock('next/image', () => ({
    default: function MockImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
         
        return React.createElement('img', props)
    },
}))
