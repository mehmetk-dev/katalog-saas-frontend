import type { Product } from "@/lib/actions/products"
import type { ExcelAiEnrichDescriptionOperation, ExcelAiGenerateDescriptionOperation, ExcelAiTranslateOperation } from "@/lib/excel-ai/types"
import type { Language } from "./types"

const AI_DESCRIPTION_CHUNK_SIZE = 50
const AI_CATEGORY_CHUNK_SIZE = 80
const AI_NAME_CHUNK_SIZE = 80
const AI_TRANSLATE_CHUNK_SIZE = 50

export async function generateDescriptionsForProducts(
  products: Product[],
  language: Language,
  operation: ExcelAiGenerateDescriptionOperation,
): Promise<Map<string, string>> {
  const descriptionMap = new Map<string, string>()

  for (let i = 0; i < products.length; i += AI_DESCRIPTION_CHUNK_SIZE) {
    const chunk = products.slice(i, i + AI_DESCRIPTION_CHUNK_SIZE)
    if (chunk.length === 0) continue

    const response = await fetch("/api/excel-ai/generate-descriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        style: operation.style,
        maxLength: operation.maxLength,
        products: chunk.map((product) => ({
          id: product.id,
          name: product.name,
          category: product.category,
          currentDescription: product.description,
        })),
      }),
    })

    const payload = (await response.json()) as {
      descriptions?: Array<{ productId: string; description: string }>
      error?: string
    }

    if (!response.ok || !payload.descriptions) {
      throw new Error(payload.error || "Description generation failed")
    }

    payload.descriptions.forEach((item) => {
      if (item.productId && item.description) {
        descriptionMap.set(item.productId, item.description)
      }
    })
  }

  return descriptionMap
}

export async function generateCategoriesForProducts(
  products: Product[],
  existingCategories: string[],
  language: Language,
): Promise<Map<string, string>> {
  const categoryMap = new Map<string, string>()

  for (let i = 0; i < products.length; i += AI_CATEGORY_CHUNK_SIZE) {
    const chunk = products.slice(i, i + AI_CATEGORY_CHUNK_SIZE)
    if (chunk.length === 0) continue

    const response = await fetch("/api/excel-ai/generate-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        existingCategories,
        products: chunk.map((product) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          currentCategory: product.category,
        })),
      }),
    })

    const payload = (await response.json()) as {
      categories?: Array<{ productId: string; category: string }>
      error?: string
    }

    if (!response.ok || !payload.categories) {
      throw new Error(payload.error || "Category generation failed")
    }

    payload.categories.forEach((item) => {
      if (item.productId && item.category) {
        categoryMap.set(item.productId, item.category)
      }
    })
  }

  return categoryMap
}

export async function enrichDescriptionsForProducts(
  products: Product[],
  language: Language,
  operation: ExcelAiEnrichDescriptionOperation,
): Promise<Map<string, string>> {
  const descriptionMap = new Map<string, string>()

  for (let i = 0; i < products.length; i += AI_DESCRIPTION_CHUNK_SIZE) {
    const chunk = products.slice(i, i + AI_DESCRIPTION_CHUNK_SIZE)
    if (chunk.length === 0) continue

    const response = await fetch("/api/excel-ai/enrich-descriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        style: operation.style,
        maxLength: operation.maxLength,
        products: chunk.map((product) => ({
          id: product.id,
          name: product.name,
          category: product.category,
          currentDescription: product.description,
        })),
      }),
    })

    const payload = (await response.json()) as {
      descriptions?: Array<{ productId: string; description: string }>
      error?: string
    }

    if (!response.ok || !payload.descriptions) {
      throw new Error(payload.error || "Description enrichment failed")
    }

    payload.descriptions.forEach((item) => {
      if (item.productId && item.description) {
        descriptionMap.set(item.productId, item.description)
      }
    })
  }

  return descriptionMap
}

export async function fixNamesForProducts(
  products: Product[],
  language: Language,
): Promise<Map<string, string>> {
  const nameMap = new Map<string, string>()

  for (let i = 0; i < products.length; i += AI_NAME_CHUNK_SIZE) {
    const chunk = products.slice(i, i + AI_NAME_CHUNK_SIZE)
    if (chunk.length === 0) continue

    const response = await fetch("/api/excel-ai/fix-names", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        products: chunk.map((product) => ({
          id: product.id,
          name: product.name,
        })),
      }),
    })

    const payload = (await response.json()) as {
      names?: Array<{ productId: string; name: string }>
      error?: string
    }

    if (!response.ok || !payload.names) {
      throw new Error(payload.error || "Name fix failed")
    }

    payload.names.forEach((item) => {
      if (item.productId && item.name) {
        nameMap.set(item.productId, item.name)
      }
    })
  }

  return nameMap
}

export async function translateFieldForProducts(
  products: Array<{ id: string; value: string }>,
  language: Language,
  operation: ExcelAiTranslateOperation,
): Promise<Map<string, string>> {
  const translationMap = new Map<string, string>()

  for (let i = 0; i < products.length; i += AI_TRANSLATE_CHUNK_SIZE) {
    const chunk = products.slice(i, i + AI_TRANSLATE_CHUNK_SIZE)
    if (chunk.length === 0) continue

    const response = await fetch("/api/excel-ai/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        targetLanguage: operation.targetLanguage,
        field: operation.field,
        products: chunk.map((item) => ({
          id: item.id,
          value: item.value,
        })),
      }),
    })

    const payload = (await response.json()) as {
      translations?: Array<{ productId: string; value: string }>
      error?: string
    }

    if (!response.ok || !payload.translations) {
      throw new Error(payload.error || "Translation failed")
    }

    payload.translations.forEach((item) => {
      if (item.productId && item.value) {
        translationMap.set(item.productId, item.value)
      }
    })
  }

  return translationMap
}
