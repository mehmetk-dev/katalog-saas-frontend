import type { ExcelAiFillEmptyOperation, ExcelAiGenerateDescriptionOperation } from "@/lib/excel-ai/types"
import type { CellField } from "../../../types"
import { generateCategoriesForProducts, generateDescriptionsForProducts } from "../generators"
import { randomSkuPart, roundPrice, sanitizeSkuPrefix } from "../utils"
import type { BulkOperationHandler } from "../types"

function isEmpty(value: string | number | null): boolean {
    if (value === null || value === undefined) return true
    if (typeof value === "string") return value.trim().length === 0
    return false
}

export const fillEmptyOperationHandler: BulkOperationHandler = {
    operationType: "fill_empty",
    canHandle(operation) {
        return operation.type === "fill_empty"
    },
    async apply(operation, context) {
        if (!this.canHandle(operation)) return
        const typedOperation = operation as ExcelAiFillEmptyOperation
        const field = typedOperation.field as CellField

        const emptyProducts = context.products.filter((product) => {
            const value = context.readValue(product.id, field)
            return isEmpty(value)
        })

        if (emptyProducts.length === 0) return

        if (field === "description") {
            const descOp: ExcelAiGenerateDescriptionOperation = {
                type: "generate_description",
                field: "description",
                style: typedOperation.style,
                maxLength: typedOperation.maxLength,
            }
            const descriptions = await generateDescriptionsForProducts(emptyProducts, context.language, descOp)
            emptyProducts.forEach((product) => {
                const desc = descriptions.get(product.id)
                if (desc) context.writeValue(product.id, "description", desc)
            })
            return
        }

        if (field === "category") {
            const categories = await generateCategoriesForProducts(emptyProducts, context.existingCategories, context.language)
            emptyProducts.forEach((product) => {
                const cat = categories.get(product.id)
                if (cat) context.writeValue(product.id, "category", cat)
            })
            return
        }

        if (field === "sku") {
            emptyProducts.forEach((product) => {
                const sku = `${sanitizeSkuPrefix("SKU")}-${randomSkuPart(6)}`
                context.writeValue(product.id, "sku", sku)
            })
            return
        }

        if (field === "price") {
            const pricedRows = context.products
                .map((p) => {
                    const raw = context.readValue(p.id, "price")
                    const num = Number(raw)
                    return Number.isFinite(num) && num > 0 ? num : null
                })
                .filter((n): n is number => n !== null)

            if (pricedRows.length === 0) return

            const average = roundPrice(pricedRows.reduce((sum, val) => sum + val, 0) / pricedRows.length)
            emptyProducts.forEach((product) => {
                context.writeValue(product.id, "price", average)
            })
        }
    },
}
