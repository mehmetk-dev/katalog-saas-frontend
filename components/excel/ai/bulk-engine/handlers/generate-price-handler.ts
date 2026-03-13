import type { ExcelAiGeneratePriceOperation } from "@/lib/excel-ai/types"
import { roundPrice } from "../utils"
import type { BulkOperationHandler } from "../types"

export const generatePriceOperationHandler: BulkOperationHandler = {
  operationType: "generate_price",
  canHandle(operation) {
    return operation.type === "generate_price"
  },
  async apply(operation, context) {
    if (!this.canHandle(operation)) return
    const typedOperation = operation as ExcelAiGeneratePriceOperation

    const pricedRows = context.products
      .map((product) => {
        const raw = context.readValue(product.id, "price")
        const num = Number(raw)
        return Number.isFinite(num) ? num : null
      })
      .filter((num): num is number => num !== null)

    if (pricedRows.length === 0) {
      throw new Error(
        context.language === "tr"
          ? "Ortalama fiyat hesaplamak için geçerli fiyat bulunamadı."
          : "No valid prices were found to compute averages.",
      )
    }

    const scopeAverage = roundPrice(pricedRows.reduce((sum, val) => sum + val, 0) / pricedRows.length)
    const strategy = typedOperation.strategy || "scope_average"

    if (strategy === "category_average") {
      const categoryBuckets = new Map<string, number[]>()

      context.products.forEach((product) => {
        const categoryRaw = context.readValue(product.id, "category")
        const category = typeof categoryRaw === "string" ? categoryRaw.trim() : ""
        if (!category) return

        const priceRaw = context.readValue(product.id, "price")
        const price = Number(priceRaw)
        if (!Number.isFinite(price)) return

        const current = categoryBuckets.get(category) || []
        current.push(price)
        categoryBuckets.set(category, current)
      })

      const categoryAverage = new Map<string, number>()
      categoryBuckets.forEach((values, category) => {
        if (values.length === 0) return
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length
        categoryAverage.set(category, roundPrice(avg))
      })

      context.products.forEach((product) => {
        const categoryRaw = context.readValue(product.id, "category")
        const category = typeof categoryRaw === "string" ? categoryRaw.trim() : ""
        const nextPrice = categoryAverage.get(category) ?? scopeAverage
        context.writeValue(product.id, "price", nextPrice)
      })
      return
    }

    context.products.forEach((product) => {
      context.writeValue(product.id, "price", scopeAverage)
    })
  },
}
