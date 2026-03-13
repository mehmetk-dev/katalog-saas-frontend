import type { Product } from "@/lib/actions/products"
import type { PrimitiveOperation } from "./types"

export function collectExistingCategories(products: Product[]): string[] {
  const set = new Set<string>()
  products.forEach((product) => {
    const category = product.category?.trim()
    if (category) set.add(category)
  })
  return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"))
}

function toNumber(value: string | number | null): number | null {
  if (value === null || value === "") return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function roundPrice(value: number): number {
  return Math.max(0, Number(value.toFixed(2)))
}

export function sanitizeSkuPrefix(prefix?: string): string {
  if (!prefix) return "SKU"
  const normalized = prefix.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 24)
  return normalized.length > 0 ? normalized : "SKU"
}

export function randomSkuPart(length: number): string {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const normalizedLength = Math.max(4, Math.min(length, 24))
  let value = ""
  for (let i = 0; i < normalizedLength; i += 1) {
    const index = Math.floor(Math.random() * charset.length)
    value += charset[index]
  }
  return value
}

export function applyPrimitiveOperation(currentValue: string | number | null, operation: PrimitiveOperation): string | number | null {
  if (operation.type === "clear") {
    return null
  }

  if (operation.type === "set") {
    if (operation.field === "stock" && typeof operation.value === "number") {
      return Math.max(0, Math.round(operation.value))
    }

    if (operation.field === "price" && typeof operation.value === "number") {
      return Math.max(0, roundPrice(operation.value))
    }

    return operation.value
  }

  if (operation.type === "multiply") {
    const baseValue = toNumber(currentValue)
    if (baseValue === null) return null

    const nextValue = baseValue * operation.value
    if (operation.field === "stock") {
      return Math.max(0, Math.round(nextValue))
    }

    return roundPrice(nextValue)
  }

  const currentText = currentValue === null || currentValue === undefined ? "" : String(currentValue)
  const separator = operation.separator ?? " "

  if (operation.type === "append_text") {
    if (!currentText.trim()) return operation.text
    return `${currentText}${separator}${operation.text}`
  }

  if (!currentText.trim()) return operation.text
  return `${operation.text}${separator}${currentText}`
}
