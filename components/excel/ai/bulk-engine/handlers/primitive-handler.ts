import type { ExcelAiOperation } from "@/lib/excel-ai/types"
import type { CellField } from "../../../types"
import { applyPrimitiveOperation } from "../utils"
import type { BulkOperationHandler, PrimitiveOperation } from "../types"

const PRIMITIVE_TYPES = new Set<ExcelAiOperation["type"]>(["set", "multiply", "append_text", "prepend_text", "clear"])

export const primitiveOperationHandler: BulkOperationHandler = {
  operationType: "set",
  canHandle(operation) {
    return PRIMITIVE_TYPES.has(operation.type)
  },
  async apply(operation, context) {
    if (!this.canHandle(operation)) return

    for (const product of context.products) {
      const field = operation.field as CellField
      const currentValue = context.readValue(product.id, field)
      const nextValue = applyPrimitiveOperation(currentValue, operation as PrimitiveOperation)
      context.writeValue(product.id, field, nextValue)
    }
  },
}
