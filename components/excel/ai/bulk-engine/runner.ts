import type { ExcelAiOperation } from "@/lib/excel-ai/types"
import { BulkChangeState } from "./state"
import { BULK_OPERATION_HANDLERS } from "./handlers"
import type { BuildBulkChangesParams, BulkCellChange, BulkOperationContext, BulkOperationHandler } from "./types"

function getHandler(operation: ExcelAiOperation): BulkOperationHandler {
  const handler = BULK_OPERATION_HANDLERS.find((candidate) => candidate.canHandle(operation))
  if (!handler) {
    throw new Error(`Unsupported AI operation type: ${operation.type}`)
  }
  return handler
}

export async function buildBulkChangesFromIntent({
  products,
  operations,
  getCellValue,
  language,
  existingCategories,
}: BuildBulkChangesParams): Promise<BulkCellChange[]> {
  const state = new BulkChangeState(getCellValue)

  const context: BulkOperationContext = {
    products,
    language,
    existingCategories,
    readValue: (productId, field) => state.read(productId, field),
    writeValue: (productId, field, value) => state.write(productId, field, value),
  }

  for (const operation of operations) {
    const handler = getHandler(operation)
    await handler.apply(operation, context)
  }

  return state.getChanges()
}
