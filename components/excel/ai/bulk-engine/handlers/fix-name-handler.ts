import { fixNamesForProducts } from "../generators"
import type { BulkOperationHandler } from "../types"

export const fixNameOperationHandler: BulkOperationHandler = {
    operationType: "fix_name",
    canHandle(operation) {
        return operation.type === "fix_name"
    },
    async apply(operation, context) {
        if (!this.canHandle(operation)) return
        const names = await fixNamesForProducts(context.products, context.language)

        context.products.forEach((product) => {
            const fixedName = names.get(product.id)
            if (!fixedName) return
            context.writeValue(product.id, "name", fixedName)
        })
    },
}
