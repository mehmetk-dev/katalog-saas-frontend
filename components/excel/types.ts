import type { Product, CustomAttribute } from "@/lib/actions/products"

// ── Cell & Field Types ──────────────────────────────────
export type CellField =
  | "name" | "sku" | "price" | "stock"
  | "category" | "description" | "product_url"
  | `attr:${string}`

export interface SpreadsheetColumn {
  key: CellField
  label: string
  type: "text" | "number" | "textarea"
  width: string
  editable: boolean
}

// ── Dirty Tracking ──────────────────────────────────────
// Map<productId, Map<fieldKey, editedValue>>
export type EditedCells = Map<string, Map<string, string | number | null>>

// ── Validation ──────────────────────────────────────────
export interface CellError {
  field: CellField
  message: string
}
// Map<productId | tempId, CellError[]>
export type ValidationErrors = Map<string, CellError[]>

// ── CRUD ────────────────────────────────────────────────
export interface NewRow {
  tempId: string
  name: string
  sku: string
  price: number
  stock: number
  category: string
  description: string
  product_url: string
  custom_attributes: CustomAttribute[]
}

// ── AI-Ready Types (Faz 2) ──────────────────────────────
export interface AISuggestion {
  productId: string
  field: CellField
  oldValue: string | number | null
  newValue: string | number
  confidence: number
  accepted?: boolean
}

export interface AIAction {
  type: "generate_description" | "suggest_category" | "translate"
       | "generate_sku" | "fill_attributes"
  targetProductIds: string[]
  params?: Record<string, unknown>
}

export type { Product, CustomAttribute }
