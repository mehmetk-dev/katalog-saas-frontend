import type { Product } from "@/lib/actions/products"
import type {
  ExcelAiEnrichDescriptionOperation,
  ExcelAiFillEmptyOperation,
  ExcelAiFixNameOperation,
  ExcelAiGenerateCategoryOperation,
  ExcelAiGenerateDescriptionOperation,
  ExcelAiGeneratePriceOperation,
  ExcelAiGenerateSkuOperation,
  ExcelAiIntent,
  ExcelAiOperation,
  ExcelAiRoundPriceOperation,
  ExcelAiTranslateOperation,
} from "@/lib/excel-ai/types"

import type { CellField } from "../../types"

export type Language = "tr" | "en"

export type PrimitiveOperation = Exclude<
  ExcelAiOperation,
  | ExcelAiGenerateDescriptionOperation
  | ExcelAiGenerateCategoryOperation
  | ExcelAiGenerateSkuOperation
  | ExcelAiGeneratePriceOperation
  | ExcelAiEnrichDescriptionOperation
  | ExcelAiFixNameOperation
  | ExcelAiTranslateOperation
  | ExcelAiRoundPriceOperation
  | ExcelAiFillEmptyOperation
>

export interface BulkCellChange {
  productId: string
  field: CellField
  value: string | number | null
}

export interface BuildBulkChangesParams {
  products: Product[]
  operations: ExcelAiIntent["operations"]
  getCellValue: (productId: string, field: CellField) => string | number | null
  language: Language
  existingCategories: string[]
}

export interface BulkOperationContext {
  products: Product[]
  language: Language
  existingCategories: string[]
  readValue: (productId: string, field: CellField) => string | number | null
  writeValue: (productId: string, field: CellField, value: string | number | null) => void
}

export interface BulkOperationHandler {
  readonly operationType: ExcelAiOperation["type"]
  canHandle: (operation: ExcelAiOperation) => boolean
  apply: (operation: ExcelAiOperation, context: BulkOperationContext) => Promise<void>
}
