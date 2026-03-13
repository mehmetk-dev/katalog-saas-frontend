import { generateCategoriesForProducts } from "../generators"
import type { BulkOperationHandler } from "../types"

export const generateCategoryOperationHandler: BulkOperationHandler = {
  operationType: "generate_category",
  canHandle(operation) {
    return operation.type === "generate_category"
  },
  async apply(operation, context) {
    if (!this.canHandle(operation)) return

    if (context.existingCategories.length === 0) {
      throw new Error(
        context.language === "tr"
          ? "Mevcut kategori bulunamadı. Önce kategori oluşturun veya doğrudan kategori adı verin."
          : "No existing categories found. Create categories first or provide an explicit category value.",
      )
    }

    const categories = await generateCategoriesForProducts(context.products, context.existingCategories, context.language)
    context.products.forEach((product) => {
      const generatedCategory = categories.get(product.id)
      if (!generatedCategory) return
      context.writeValue(product.id, "category", generatedCategory)
    })
  },
}
