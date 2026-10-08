/**
 * Shared utility functions for catalog templates.
 * Centralizes URL sanitization, currency formatting, and background style generation.
 */

// ─── URL Sanitization ───────────────────────────────────────────────────────

const ALLOWED_URL_SCHEMES = /^https?:\/\//i

/**
 * Sanitize a URL for use in CSS `url()` — blocks non-http(s) schemes and
 * escapes characters that could break out of the `url()` context.
 * Returns `undefined` if the URL is not safe.
 */
export function sanitizeCssUrl(url: string | null | undefined): string | undefined {
    if (!url || typeof url !== "string") return undefined
    const trimmed = url.trim()
    if (!ALLOWED_URL_SCHEMES.test(trimmed)) return undefined
    // Escape parens and quotes that could break CSS url()
    return trimmed.replace(/[()'"]/g, encodeURIComponent)
}

/**
 * Sanitize a URL for use in `<a href>`.
 * Blocks `javascript:`, `data:`, `vbscript:` and other dangerous schemes.
 * Only allows `http:`, `https:`, `mailto:`, and `tel:` schemes.
 * Returns `undefined` if the URL is not safe.
 */
export function sanitizeHref(url: string | null | undefined): string | undefined {
    if (!url || typeof url !== "string") return undefined
    const trimmed = url.trim()
    // Allow http(s), mailto, tel — block everything else
    if (/^https?:\/\//i.test(trimmed)) return trimmed
    if (/^mailto:/i.test(trimmed)) return trimmed
    if (/^tel:/i.test(trimmed)) return trimmed
    return undefined
}

/**
 * Build a safe CSS `backgroundImage` value from a URL.
 * Returns `url(...)` string or `undefined`.
 */
export function safeBackgroundImageUrl(url: string | null | undefined): string | undefined {
    const safe = sanitizeCssUrl(url)
    return safe ? `url(${safe})` : undefined
}

// ─── Background Style ───────────────────────────────────────────────────────

interface BackgroundStyleOptions {
    backgroundColor?: string | null
    backgroundImage?: string | null
    backgroundImageFit?: string | null
    backgroundGradient?: string | null
}

/**
 * Build a `React.CSSProperties` object for container background.
 * Priority: Image > Gradient > Color (matching catalog-preview.tsx logic).
 */
export function buildBackgroundStyle(opts: BackgroundStyleOptions): React.CSSProperties {
    const base: React.CSSProperties = {
        backgroundColor: opts.backgroundColor || "transparent",
    }

    if (opts.backgroundImage) {
        const safeUrl = safeBackgroundImageUrl(opts.backgroundImage)
        if (safeUrl) {
            return {
                ...base,
                backgroundImage: safeUrl,
                backgroundSize: opts.backgroundImageFit || "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }
        }
    }

    if (opts.backgroundGradient && opts.backgroundGradient !== "none") {
        return {
            ...base,
            backgroundImage: opts.backgroundGradient,
        }
    }

    return base
}

// ─── Currency Formatting ─────────────────────────────────────────────────────

interface ProductLike {
    price?: number | string | null
    custom_attributes?: Array<{ name: string; value: string; unit?: string }> | null
}

const CURRENCY_SYMBOLS: Record<string, string> = {
    TRY: "₺",
    USD: "$",
    EUR: "€",
    GBP: "£",
}

/**
 * Format product price with the appropriate currency symbol.
 * Reads currency from `custom_attributes[name=currency]`, defaults to TRY.
 */
export function formatProductPrice(product: ProductLike): string {
    const currency =
        product.custom_attributes?.find((a) => a.name === "currency")?.value || "TRY"
    const symbol = CURRENCY_SYMBOLS[currency] || "₺"
    return `${symbol}${Number(product.price).toFixed(2)}`
}

// ─── Header Layout & Positioning ──────────────────────────────────────────────

/**
 * Common configuration sizes for logos
 */
export function getStandardLogoHeight(logoSize: string | undefined | null): number {
    switch (logoSize) {
        case 'small': return 24
        case 'large': return 48
        case 'medium':
        default: return 36
    }
}

/**
 * Calculate common header layouts, logo alignments and collision states
 */
export function getHeaderLayout(logoPosition: string | undefined | null, titlePosition: string | undefined | null) {
    const isHeaderLogo = logoPosition?.startsWith('header') || false
    const logoAlignment = logoPosition?.split('-')[1] || 'left'
    const safeTitlePosition = titlePosition || 'left'

    const isCollisionLeft = isHeaderLogo && logoAlignment === 'left' && safeTitlePosition === 'left'
    const isCollisionCenter = isHeaderLogo && logoAlignment === 'center' && safeTitlePosition === 'center'
    const isCollisionRight = isHeaderLogo && logoAlignment === 'right' && safeTitlePosition === 'right'

    return {
        isHeaderLogo,
        logoAlignment,
        titlePosition: safeTitlePosition,
        isCollisionLeft,
        isCollisionCenter,
        isCollisionRight,
        isAnyCollision: isCollisionLeft || isCollisionCenter || isCollisionRight
    }
}


// ─── Color Contrast ─────────────────────────────────────────────────────────

function parseColorToRgb(color: string | null | undefined): [number, number, number] | null {
    if (!color) return null
    const value = color.trim()
    const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i)?.[1]
    if (hex) {
        const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex.slice(0, 6)
        return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number]
    }
    const rgb = value.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i)
    if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
    return null
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
    const channel = (c: number) => {
        const s = c / 255
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    }
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG kontrast oranı; renk çözülemezse null */
export function contrastRatio(a: string | null | undefined, b: string | null | undefined): number | null {
    const ra = parseColorToRgb(a)
    const rb = parseColorToRgb(b)
    if (!ra || !rb) return null
    const [hi, lo] = [relativeLuminance(ra), relativeLuminance(rb)].sort((x, y) => y - x)
    return (hi + 0.05) / (lo + 0.05)
}

export function isLightColor(color: string | null | undefined): boolean {
    const rgb = parseColorToRgb(color)
    return rgb ? relativeLuminance(rgb) > 0.4 : true
}

/**
 * Kullanıcının seçtiği yazı rengi zeminde okunuyorsa onu, okunmuyorsa (kontrast < 3)
 * siyah/beyazdan okunanı döndürür. Builder varsayılan olarak her şablona #000000
 * gönderdiği için renkli/koyu başlık barlarında yazı kayboluyordu.
 */
export function ensureReadable(
    textColor: string | null | undefined,
    surfaceColor: string | null | undefined,
    { dark = '#111111', light = '#ffffff', minRatio = 3 }: { dark?: string; light?: string; minRatio?: number } = {}
): string {
    const ratio = contrastRatio(textColor, surfaceColor)
    if (textColor && (ratio === null || ratio >= minRatio)) return textColor
    return isLightColor(surfaceColor) ? dark : light
}

/** Kataloğun varsayılan (dokunulmamış) arka plan rengi */
const CATALOG_DEFAULT_BACKGROUNDS = new Set(['#ffffff', '#fff', 'white'])

/**
 * Koyu zemin için tasarlanmış şablonlar (luxury, showcase) kataloğun varsayılan
 * beyaz arka planını kendi zeminleriyle değiştirir; kullanıcı başka bir renk
 * seçtiyse ona dokunulmaz.
 */
export function resolveTemplateBackground(backgroundColor: string | null | undefined, templateDefault: string): string {
    if (!backgroundColor || CATALOG_DEFAULT_BACKGROUNDS.has(backgroundColor.trim().toLowerCase())) return templateDefault
    return backgroundColor
}
