export interface Category {
    id: string
    name: string
    color: string
    productCount: number
    images?: string[]
    productNames?: string[]
    cover_image?: string
}

export const CATEGORY_COLORS = [
    "#ef4444", // Red
    "#f97316", // Orange
    "#eab308", // Yellow
    "#22c55e", // Green
    "#06b6d4", // Cyan
    "#3b82f6", // Blue
    "#8b5cf6", // Violet
    "#ec4899", // Pink
]
