/** Kapak görseli olmayan kataloglarda kapağa konacak ilk ürün görseli */
export function firstProductImage(products: ReadonlyArray<{ image_url?: string | null; images?: string[] | null }> | undefined): string | undefined {
    for (const product of products ?? []) {
        const image = product.image_url || product.images?.[0]
        if (image) return image
    }
    return undefined
}
