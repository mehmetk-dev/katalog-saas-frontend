import type { ExcelAiEnrichDescriptionOperation } from "@/lib/excel-ai/types"
import { enrichDescriptionsForProducts } from "../generators"
import type { BulkOperationHandler } from "../types"

export const enrichDescriptionOperationHandler: BulkOperationHandler = {
    operationType: "enrich_description",
    canHandle(operation) {
        return operation.type === "enrich_description"
    },
    async apply(operation, context) {
        if (!this.canHandle(operation)) return
        const typedOperation = operation as ExcelAiEnrichDescriptionOperation
        const descriptions = await enrichDescriptionsForProducts(context.products, context.language, typedOperation)

        context.products.forEach((product) => {
            const enrichedDescription = descriptions.get(product.id)
            if (!enrichedDescription) return
            context.writeValue(product.id, "description", enrichedDescription)
        })
    },
}
