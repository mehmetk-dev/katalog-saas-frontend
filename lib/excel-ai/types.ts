export const AI_SCOPES = ["selected", "currentPage", "all"] as const
export type ExcelAiScope = (typeof AI_SCOPES)[number]

export const AI_NUMERIC_FIELDS = ["price", "stock"] as const
export type ExcelAiNumericField = (typeof AI_NUMERIC_FIELDS)[number]

export const AI_TEXT_FIELDS = ["name", "sku", "category", "description", "product_url"] as const
export type ExcelAiTextField = (typeof AI_TEXT_FIELDS)[number]

export const AI_FIELDS = [...AI_NUMERIC_FIELDS, ...AI_TEXT_FIELDS] as const
export type ExcelAiField = (typeof AI_FIELDS)[number]

export interface ExcelAiSetOperation {
  type: "set"
  field: ExcelAiField
  value: string | number | null
}

export interface ExcelAiMultiplyOperation {
  type: "multiply"
  field: ExcelAiNumericField
  value: number
}

export interface ExcelAiAppendTextOperation {
  type: "append_text"
  field: ExcelAiTextField
  text: string
  separator?: string
}

export interface ExcelAiPrependTextOperation {
  type: "prepend_text"
  field: ExcelAiTextField
  text: string
  separator?: string
}

export interface ExcelAiClearOperation {
  type: "clear"
  field: ExcelAiField
}

export interface ExcelAiGenerateDescriptionOperation {
  type: "generate_description"
  field: "description"
  style?: string
  maxLength?: number
}

export interface ExcelAiGenerateCategoryOperation {
  type: "generate_category"
  field: "category"
  useExistingOnly?: boolean
}

export interface ExcelAiGenerateSkuOperation {
  type: "generate_sku"
  field: "sku"
  prefix?: string
  length?: number
}

export interface ExcelAiGeneratePriceOperation {
  type: "generate_price"
  field: "price"
  strategy?: "scope_average" | "category_average"
}

export type ExcelAiOperation =
  | ExcelAiSetOperation
  | ExcelAiMultiplyOperation
  | ExcelAiAppendTextOperation
  | ExcelAiPrependTextOperation
  | ExcelAiClearOperation
  | ExcelAiGenerateDescriptionOperation
  | ExcelAiGenerateCategoryOperation
  | ExcelAiGenerateSkuOperation
  | ExcelAiGeneratePriceOperation

export interface ExcelAiIntent {
  scope: ExcelAiScope
  operations: ExcelAiOperation[]
  reason?: string
}

export interface GeneratedProduct {
  name: string
  description: string
  price: number
  stock: number
  category: string
  sku: string
}

