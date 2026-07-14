const DEFAULT_ASSET_TIMEOUT_MS = 15_000

function settleWithin(promise: PromiseLike<unknown>, timeoutMs: number): Promise<void> {
    return new Promise((resolve) => {
        let settled = false
        const finish = () => {
            if (settled) return
            settled = true
            clearTimeout(timer)
            resolve()
        }
        const timer = setTimeout(finish, timeoutMs)

        Promise.resolve(promise).then(finish, finish)
    })
}

export function waitForImageSettlement(
    image: HTMLImageElement,
    timeoutMs = DEFAULT_ASSET_TIMEOUT_MS
): Promise<void> {
    if (image.complete) return Promise.resolve()

    return new Promise((resolve) => {
        let settled = false
        let timer: ReturnType<typeof setTimeout> | undefined

        const finish = () => {
            if (settled) return
            settled = true
            image.removeEventListener('load', finish)
            image.removeEventListener('error', finish)
            if (timer) clearTimeout(timer)
            resolve()
        }

        image.addEventListener('load', finish, { once: true })
        image.addEventListener('error', finish, { once: true })
        timer = setTimeout(finish, timeoutMs)

        if (image.complete) finish()
    })
}

export async function waitForPdfExportAssets(
    targetDocument: Document,
    timeoutMs = DEFAULT_ASSET_TIMEOUT_MS
): Promise<void> {
    if (targetDocument.fonts?.ready) {
        await settleWithin(targetDocument.fonts.ready, timeoutMs)
    }

    const images = Array.from(targetDocument.querySelectorAll<HTMLImageElement>('img[src]'))
    await Promise.all(images.map((image) => waitForImageSettlement(image, timeoutMs)))
}
