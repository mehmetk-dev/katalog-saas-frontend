import type { ExcelAiRoundPriceOperation } from "@/lib/excel-ai/types"
import type { BulkOperationHandler } from "../types"

function roundFloor(price: number): number {
    return Math.floor(price)
}

function roundNearest(price: number): number {
    return Math.round(price)
}

function roundCharm(price: number): number {
    if (price <= 0) return 0
    const base = Math.round(price / 10) * 10
    const charmed = base - 0.10
    return charmed > 0 ? Number(charmed.toFixed(2)) : 0.90
}

export const roundPriceOperationHandler: BulkOperationHandler = {
    operationType: "round_price",
    canHandle(operation) {
        return operation.type === "round_price"
    },
    async apply(operation, context) {
        if (!this.canHandle(operation)) return
        const typedOperation = operation as ExcelAiRoundPriceOperation
        const strategy = typedOperation.strategy || "nearest"

        const roundFn = strategy === "floor" ? roundFloor : strategy === "charm" ? roundCharm : roundNearest

        context.products.forEach((product) => {
            const raw = context.readValue(product.id, "price")
            const num = Number(raw)
            if (!Number.isFinite(num) || num < 0) return

            const rounded = roundFn(num)
            context.writeValue(product.id, "price", Math.max(0, Number(rounded.toFixed(2))))
        })
    },
}
