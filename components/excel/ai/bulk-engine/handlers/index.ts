import type { BulkOperationHandler } from "../types"
import { enrichDescriptionOperationHandler } from "./enrich-description-handler"
import { fillEmptyOperationHandler } from "./fill-empty-handler"
import { fixNameOperationHandler } from "./fix-name-handler"
import { generateCategoryOperationHandler } from "./generate-category-handler"
import { generateDescriptionOperationHandler } from "./generate-description-handler"
import { generatePriceOperationHandler } from "./generate-price-handler"
import { generateSkuOperationHandler } from "./generate-sku-handler"
import { primitiveOperationHandler } from "./primitive-handler"
import { roundPriceOperationHandler } from "./round-price-handler"
import { translateOperationHandler } from "./translate-handler"

export const BULK_OPERATION_HANDLERS: BulkOperationHandler[] = [
  generateSkuOperationHandler,
  generatePriceOperationHandler,
  generateDescriptionOperationHandler,
  generateCategoryOperationHandler,
  enrichDescriptionOperationHandler,
  fixNameOperationHandler,
  translateOperationHandler,
  roundPriceOperationHandler,
  fillEmptyOperationHandler,
  primitiveOperationHandler,
]
