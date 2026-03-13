import type { BulkOperationHandler } from "../types"
import { generateCategoryOperationHandler } from "./generate-category-handler"
import { generateDescriptionOperationHandler } from "./generate-description-handler"
import { generatePriceOperationHandler } from "./generate-price-handler"
import { generateSkuOperationHandler } from "./generate-sku-handler"
import { primitiveOperationHandler } from "./primitive-handler"

export const BULK_OPERATION_HANDLERS: BulkOperationHandler[] = [
  generateSkuOperationHandler,
  generatePriceOperationHandler,
  generateDescriptionOperationHandler,
  generateCategoryOperationHandler,
  primitiveOperationHandler,
]
