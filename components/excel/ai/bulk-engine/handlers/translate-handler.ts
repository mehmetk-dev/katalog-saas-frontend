import type { ExcelAiTranslateOperation } from "@/lib/excel-ai/types"
import type { CellField } from "../../../types"
import { translateFieldForProducts } from "../generators"
import type { BulkOperationHandler } from "../types"

export const translateOperationHandler: BulkOperationHandler = {
    operationType: "translate",
    canHandle(operation) {
        return operation.type === "translate"
    },
    async apply(operation, context) {
        if (!this.canHandle(operation)) return
        const typedOperation = operation as ExcelAiTranslateOperation
        const field = typedOperation.field as CellField

        const productsWithValues = context.products
            .map((product) => {
                const raw = context.readValue(product.id, field)
                const value = typeof raw === "string" ? raw.trim() : ""
                return { id: product.id, value }
            })
            .filter((item) => item.value.length > 0)

        if (productsWithValues.length === 0) return

        const translations = await translateFieldForProducts(productsWithValues, context.language, typedOperation)

        productsWithValues.forEach((item) => {
            const translated = translations.get(item.id)
            if (!translated) return
            context.writeValue(item.id, field, translated)
        })
    },
}
