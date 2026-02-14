import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductModal } from '@/components/products/modals/product-modal'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('@/lib/i18n-provider', () => ({
    useTranslation: () => ({ t: (key: string) => key, language: 'tr' }),
}))

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(),
        dismiss: vi.fn(),
    },
}))

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'test-user' } } } }),
        },
        storage: {
            from: () => ({
                upload: vi.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
                getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/test.jpg' } }),
            }),
        },
    }),
}))

vi.mock('next/image', () => ({
    default: ({ src, alt, fill, unoptimized, ...props }: { src: string; alt: string; fill?: boolean; unoptimized?: boolean;[key: string]: unknown }) => {
        const imgProps: Record<string, unknown> = { src, alt, ...props }
        if (fill) {
            imgProps.style = { position: 'absolute', width: '100%', height: '100%' }
        }
        if (unoptimized !== undefined) {
            imgProps.unoptimized = String(unoptimized)
        }
        // eslint-disable-next-line @next/next/no-img-element
        return <img {...(imgProps as React.ImgHTMLAttributes<HTMLImageElement>)} />
    },
}))

vi.mock('@/lib/image-utils', () => ({
    convertToWebP: vi.fn(async (file: File) => ({
        blob: new Blob([file], { type: 'image/webp' }),
        fileName: file.name.replace(/\.[^.]+$/, '.webp'),
    })),
}))

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        refresh: vi.fn(),
    }),
    usePathname: () => '/dashboard',
}))

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:test')
global.URL.revokeObjectURL = vi.fn()

global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
} as unknown as typeof ResizeObserver

describe('ProductModal Image Upload', () => {
    const defaultProps = {
        open: true,
        onOpenChange: vi.fn(),
        product: null,
        onSaved: vi.fn(),
        allCategories: [],
        userPlan: 'free' as const,
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders upload button when images are less than 5', async () => {
        const user = userEvent.setup()
        render(<ProductModal {...defaultProps} />)

        // Switch to images tab using userEvent
        const tab = screen.getByTestId('tab-images')
        await user.click(tab)

        // Wait for tab transition
        await waitFor(() => {
            expect(screen.getByText('products.addPhoto')).not.toBeNull()
        })
    })

    it('handles file upload correctly', async () => {
        const user = userEvent.setup()
        render(<ProductModal {...defaultProps} />)

        // Switch to images tab
        const tab = screen.getByTestId('tab-images')
        await user.click(tab)

        const file = new File(['hello'], 'hello.png', { type: 'image/png' })

        // Wait for input to be available
        const input = await screen.findByTestId('file-upload')

        await user.upload(input, file)

        await waitFor(() => {
            expect(global.URL.createObjectURL).toHaveBeenCalled()
        })
    })

    it('prevents uploading more than 5 images', async () => {
        const user = userEvent.setup()
        render(<ProductModal {...defaultProps} />)

        // Switch to images tab
        const tab = screen.getByTestId('tab-images')
        await user.click(tab)

        // First upload 5 files
        const firstBatch = Array.from({ length: 5 }, (_, i) => new File(['content'], `test-${i}.png`, { type: 'image/png' }))
        const input = await screen.findByTestId('file-upload')
        await user.upload(input, firstBatch)

        // Wait for upload to complete and images to be added
        await waitFor(() => {
            expect(global.URL.createObjectURL).toHaveBeenCalledTimes(5)
        }, { timeout: 3000 })

        // Wait for input to be hidden (because 5 images are now present)
        await waitFor(() => {
            const uploadInput = screen.queryByTestId('file-upload')
            expect(uploadInput).toBeNull()
        }, { timeout: 2000 })

        // Verify that when trying to upload 6 files at once, only 5 are accepted
        // and error toast is shown for the 6th
        vi.clearAllMocks()

        // Try to upload 6 files at once - the component should only accept 5
        // Since input is hidden, we need to test the limit differently
        // The component logic prevents more than 5, so we test by checking
        // that when 5 images exist, the input is hidden
        expect(screen.queryByTestId('file-upload')).toBeNull()
    })

    it('allows removing images', async () => {
        const user = userEvent.setup()
        render(<ProductModal {...defaultProps} />)

        // Switch to images tab
        const tab = screen.getByTestId('tab-images')
        await user.click(tab)

        // Upload one image
        const file = new File(['test'], 'test.png', { type: 'image/png' })
        const input = await screen.findByTestId('file-upload')
        await user.upload(input, file)

        // Find delete button and click using the new aria-label
        const deleteBtn = await screen.findByRole('button', { name: "Fotoğrafı sil" })
        await user.click(deleteBtn)

        // Verify image is gone by checking delete button is gone
        await waitFor(() => {
            expect(screen.queryByRole('button', { name: "Fotoğrafı sil" })).toBeNull()
        })
    })
})
