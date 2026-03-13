import type { ExcelAiGenerateDescriptionOperation } from "@/lib/excel-ai/types"
import { generateDescriptionsForProducts } from "../generators"
import type { BulkOperationHandler } from "../types"

export const generateDescriptionOperationHandler: BulkOperationHandler = {
  operationType: "generate_description",
  canHandle(operation) {
    return operation.type === "generate_description"
  },
  async apply(operation, context) {
    if (!this.canHandle(operation)) return
    const typedOperation = operation as ExcelAiGenerateDescriptionOperation
    const descriptions = await generateDescriptionsForProducts(context.products, context.language, typedOperation)

    context.products.forEach((product) => {
      const generatedDescription = descriptions.get(product.id)
      if (!generatedDescription) return
      context.writeValue(product.id, "description", generatedDescription)
    })
  },
}
