import { getPlanLimits, TEMPLATES, type PlanType } from "@/lib/constants"

/**
 * Planların müşteriye gösterilen özellik listesi — fiyatlandırma sayfası ve plan yükseltme
 * penceresi aynı listeyi kullanır. Sayılar plan limitlerinden ve şablon listesinden gelir;
 * yalnızca uygulamada gerçekten karşılığı olan özellikler yazılır.
 */
export interface PlanFeature {
    /** `planCatalog.features.*` çeviri anahtarı */
    key: string
    params?: Record<string, number>
    /** limited: planın kısıtı (ör. filigran) — farklı ikonla gösterilir */
    tone?: "included" | "limited"
}

export const PLAN_ORDER: PlanType[] = ["free", "plus", "pro"]
export const RECOMMENDED_PLAN: PlanType = "plus"

const FREE_TEMPLATE_COUNT = TEMPLATES.filter((template) => !template.isPro).length
const ALL_TEMPLATE_COUNT = TEMPLATES.length

function limitFeature(name: "catalogs" | "products" | "exports", value: number): PlanFeature {
    return Number.isFinite(value) ? { key: name, params: { count: value } } : { key: `${name}Unlimited` }
}

export function getPlanFeatures(plan: PlanType): PlanFeature[] {
    const limits = getPlanLimits(plan)
    const base = [
        limitFeature("catalogs", limits.maxCatalogs),
        limitFeature("products", limits.maxProducts),
        limitFeature("exports", limits.maxExports),
    ]

    if (plan === "free") {
        return [
            ...base,
            { key: "basicTemplates", params: { count: FREE_TEMPLATE_COUNT } },
            { key: "shareLinkQr" },
            { key: "analytics" },
            { key: "standardPdf" },
            { key: "watermark", tone: "limited" },
        ]
    }

    return [
        ...base,
        { key: "allTemplates", params: { count: ALL_TEMPLATE_COUNT } },
        { key: "shareLinkQr" },
        { key: "analytics" },
        { key: "categories" },
        { key: "highQualityPdf" },
        { key: "noWatermark" },
        ...(plan === "pro" ? [{ key: "prioritySupport" }] : []),
    ]
}
