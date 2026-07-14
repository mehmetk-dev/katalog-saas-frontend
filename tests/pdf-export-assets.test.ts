import { afterEach, describe, expect, it, vi } from 'vitest'

import { waitForImageSettlement } from '@/lib/pdf-export-assets'

function setImageComplete(image: HTMLImageElement, complete: boolean): void {
    Object.defineProperty(image, 'complete', {
        configurable: true,
        value: complete,
    })
}

describe('waitForImageSettlement', () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it('does not wait again when an image already failed', async () => {
        const image = document.createElement('img')
        setImageComplete(image, true)
        Object.defineProperty(image, 'naturalWidth', {
            configurable: true,
            value: 0,
        })

        await expect(waitForImageSettlement(image)).resolves.toBeUndefined()
    })

    it('settles when a pending image emits an error', async () => {
        const image = document.createElement('img')
        setImageComplete(image, false)
        const promise = waitForImageSettlement(image)

        image.dispatchEvent(new Event('error'))

        await expect(promise).resolves.toBeUndefined()
    })

    it('settles pending images after the timeout', async () => {
        vi.useFakeTimers()
        const image = document.createElement('img')
        setImageComplete(image, false)
        const promise = waitForImageSettlement(image, 1_000)

        await vi.advanceTimersByTimeAsync(1_000)

        await expect(promise).resolves.toBeUndefined()
    })
})
