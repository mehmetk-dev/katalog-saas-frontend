import type { ExcelAiGenerateSkuOperation } from "@/lib/excel-ai/types"
import { randomSkuPart, sanitizeSkuPrefix } from "../utils"
import type { BulkOperationHandler } from "../types"

export const generateSkuOperationHandler: BulkOperationHandler = {
  operationType: "generate_sku",
  canHandle(operation) {
    return operation.type === "generate_sku"
  },
  async apply(operation, context) {
    if (!this.canHandle(operation)) return
    const typedOperation = operation as ExcelAiGenerateSkuOperation

    const prefix = sanitizeSkuPrefix(typedOperation.prefix)
    const partLength = typedOperation.length ?? 6
    const usedSkus = new Set<string>()

    context.products.forEach((product) => {
      const value = context.readValue(product.id, "sku")
      if (typeof value === "string" && value.trim().length > 0) {
        usedSkus.add(value.trim().toUpperCase())
      }
    })

    context.products.forEach((product, index) => {
      let candidate = `${prefix}-${randomSkuPart(partLength)}`
      let attempts = 0

      while (usedSkus.has(candidate) && attempts < 30) {
        candidate = `${prefix}-${randomSkuPart(partLength)}`
        attempts += 1
      }

      if (usedSkus.has(candidate)) {
        candidate = `${prefix}-${Date.now().toString(36).toUpperCase()}-${(index + 1).toString(36).toUpperCase()}`
      }

      usedSkus.add(candidate)
      context.writeValue(product.id, "sku", candidate)
    })
  },
}
