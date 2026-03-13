import type { Product } from "@/lib/actions/products"

import { sanitizeCsvCell } from "@/components/products/products-page-utils"

type Translate = (key: string, params?: Record<string, unknown>) => string

function normalizeExportValue(value: unknown): string {
  const normalized = String(value ?? "").trim()
  const lowered = normalized.toLowerCase()
  if (!normalized || lowered === "null" || lowered === "undefined" || lowered === "n/a" || lowered === "-") {
    return ""
  }
  return normalized
}

function hasAnyValue(values: Array<unknown>): boolean {
  return values.some((value) => normalizeExportValue(value).length > 0)
}

export function downloadProductsCsv(products: Product[], t: Translate): number {
  const columnDefs = [
    {
      key: "name",
      header: t("importExport.systemFields.name"),
      value: (product: Product) => product.name || "",
      required: true,
    },
    {
      key: "sku",
      header: t("importExport.systemFields.sku"),
      value: (product: Product) => normalizeExportValue(product.sku),
      required: false,
    },
    {
      key: "description",
      header: t("importExport.systemFields.description"),
      value: (product: Product) => normalizeExportValue(product.description),
      required: false,
    },
    {
      key: "price",
      header: t("importExport.systemFields.price"),
      value: (product: Product) => String(product.price ?? ""),
      required: true,
    },
    {
      key: "stock",
      header: t("importExport.systemFields.stock"),
      value: (product: Product) => String(product.stock ?? ""),
      required: true,
    },
    {
      key: "category",
      header: t("importExport.systemFields.category"),
      value: (product: Product) => normalizeExportValue(product.category),
      required: false,
    },
    {
      key: "coverImage",
      header: t("importExport.systemFields.coverImage"),
      value: (product: Product) => normalizeExportValue(product.image_url),
      required: false,
    },
    {
      key: "additionalImages",
      header: t("importExport.systemFields.additionalImages"),
      value: (product: Product) =>
        (product.images || [])
          .map((img: string) => normalizeExportValue(img))
          .filter((img: string) => img && img !== normalizeExportValue(product.image_url))
          .join("|"),
      required: false,
    },
    {
      key: "productUrl",
      header: t("importExport.systemFields.productUrl"),
      value: (product: Product) => normalizeExportValue(product.product_url),
      required: false,
    },
  ]

  const activeColumns = columnDefs.filter((column) =>
    column.required || hasAnyValue(products.map((product) => column.value(product))),
  )

  const customAttrNames = new Set<string>()
  products.forEach((product) => {
    if (!Array.isArray(product.custom_attributes)) return

    product.custom_attributes.forEach((attr: { name?: string; value?: string | null }) => {
      const attrName = normalizeExportValue(attr?.name)
      const attrValue = normalizeExportValue(attr?.value)
      if (attrName && attrValue) customAttrNames.add(attrName)
    })
  })
  const customAttrList = Array.from(customAttrNames)

  const headers = [
    ...activeColumns.map((column) => column.header),
    ...customAttrList,
  ]

  const rows = products.map((product) => {
    const baseValues = activeColumns.map((column) => column.value(product))

    const customAttrValues = customAttrList.map((attrName) => {
      if (!Array.isArray(product.custom_attributes)) return ""
      const attr = product.custom_attributes.find((a: { name: string }) => a.name === attrName)
      if (!attr) return ""
      const val = (attr as { value?: string }).value || ""
      const unit = (attr as { unit?: string }).unit || ""
      return unit ? `${val} ${unit}` : val
    })

    return [...baseValues, ...customAttrValues].map((field) => {
      const raw = String(field ?? "")
      const sanitized = sanitizeCsvCell(raw)
      const escaped = sanitized.replace(/"/g, '""')
      return `"${escaped}"`
    })
  })

  const bom = "\uFEFF"
  const csvContent = bom + [headers.map((h) => `"${h}"`), ...rows].map((e) => e.join(",")).join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `products_export_${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  return products.length
}
