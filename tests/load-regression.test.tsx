import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { act, render, renderHook, waitFor } from "@testing-library/react"
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest"

import { SpreadsheetTable } from "@/components/excel/table/spreadsheet-table"
import type { CellField, SpreadsheetColumn } from "@/components/excel/types"
import { useSpreadsheet } from "@/components/excel/hooks/use-spreadsheet"
import { useBuilderSelectedProducts } from "@/lib/hooks/use-builder-selected-products"
import type { Product } from "@/lib/actions/products"
import { getProductsByIds } from "@/lib/actions/products"

vi.mock("@/lib/actions/products", () => ({
  getProductsByIds: vi.fn(),
}))

const PERF_METRICS: Record<string, number> = {}
const TOTAL_PRODUCTS = Number(process.env.TOTAL_PRODUCTS || "2000")
const BUILDER_FETCH_CHUNK_SIZE = 500

function makeProduct(index: number): Product {
  return {
    id: `p-${index}`,
    user_id: "u-1",
    sku: `SKU-${index}`,
    name: `Product ${index}`,
    description: index % 2 === 0 ? `Description ${index}` : null,
    price: index * 10,
    stock: index % 200,
    category: index % 2 === 0 ? "A" : "B",
    image_url: null,
    images: [],
    product_url: null,
    custom_attributes: [{ name: "Size", value: String((index % 10) + 1) }],
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    order: index,
  }
}

function nowMs() {
  return performance.now()
}

describe("Load Regression (2000+ products)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("builder selected products: chunked fetch and hydration should stay bounded", async () => {
    const total = TOTAL_PRODUCTS
    const selectedIds = Array.from({ length: total }, (_, i) => `p-${i + 1}`)
    const initialProducts = Array.from({ length: 24 }, (_, i) => makeProduct(i + 1))

    vi.mocked(getProductsByIds).mockImplementation(async (ids: string[]) => {
      return ids.map((id) => {
        const index = Number(id.replace("p-", ""))
        return makeProduct(index)
      })
    })

    const startedAt = nowMs()
    const { result } = renderHook(() =>
      useBuilderSelectedProducts({
        initialProducts,
        selectedProductIds: selectedIds,
      })
    )

    await waitFor(() => {
      expect(result.current.loadedProductsCount).toBe(total)
    }, { timeout: 6000 })

    const tookMs = nowMs() - startedAt
    PERF_METRICS.builder_hydration_ms = Number(tookMs.toFixed(2))
    PERF_METRICS.builder_fetch_calls = vi.mocked(getProductsByIds).mock.calls.length

    const expectedCalls = Math.ceil(total / BUILDER_FETCH_CHUNK_SIZE)
    expect(vi.mocked(getProductsByIds)).toHaveBeenCalledTimes(expectedCalls)
    expect(
      vi.mocked(getProductsByIds).mock.calls.every((call) => call[0].length <= BUILDER_FETCH_CHUNK_SIZE)
    ).toBe(true)
    expect(tookMs).toBeLessThan(6000)
  })

  it("excel spreadsheet hook: bulk edits should remain responsive at 2000 rows", () => {
    const products = Array.from({ length: TOTAL_PRODUCTS }, (_, i) => makeProduct(i + 1))

    const initStartedAt = nowMs()
    const { result } = renderHook(() => useSpreadsheet(products))
    const initTookMs = nowMs() - initStartedAt

    const changes = Array.from({ length: 500 }, (_, i) => ({
      productId: `p-${i + 1}`,
      field: "price" as CellField,
      value: i * 3 + 100,
    }))

    const applyStartedAt = nowMs()
    act(() => {
      result.current.applyBulkChanges(changes)
    })
    const applyTookMs = nowMs() - applyStartedAt

    PERF_METRICS.excel_hook_init_ms = Number(initTookMs.toFixed(2))
    PERF_METRICS.excel_apply_500_changes_ms = Number(applyTookMs.toFixed(2))

    expect(result.current.productMap.size).toBe(TOTAL_PRODUCTS)
    expect(result.current.dirtyProductCount).toBe(500)
    expect(initTookMs).toBeLessThan(3000)
    expect(applyTookMs).toBeLessThan(1500)
  })

  it("excel spreadsheet table: virtualization should cap rendered rows", () => {
    const products = Array.from({ length: TOTAL_PRODUCTS }, (_, i) => makeProduct(i + 1))
    const columns: SpreadsheetColumn[] = [
      { key: "name", label: "columns.name", type: "text", width: "w-48", editable: true },
      { key: "price", label: "columns.price", type: "number", width: "w-24", editable: true },
      { key: "stock", label: "columns.stock", type: "number", width: "w-24", editable: true },
    ]

    const startedAt = nowMs()
    const { container } = render(
      <div style={{ height: 540 }}>
        <SpreadsheetTable
          products={products}
          newRows={[]}
          deletedIds={new Set()}
          selectedIds={[]}
          columns={columns}
          pageOffset={0}
          onSelectedIdsChange={() => {}}
          getCellValue={(productId, field) => {
            const product = products.find((p) => p.id === productId)
            if (!product) return null
            if (field === "price" || field === "stock") return product[field]
            if (field === "name" || field === "sku" || field === "category" || field === "description" || field === "product_url") {
              return product[field] as string | null
            }
            return ""
          }}
          setCellValue={() => {}}
          isCellDirty={() => false}
          getCellError={() => null}
          updateNewRow={() => {}}
          sortConfig={null}
          onSort={() => {}}
        />
      </div>
    )
    const tookMs = nowMs() - startedAt

    const renderedRows = container.querySelectorAll("tbody tr").length
    PERF_METRICS.excel_table_initial_render_ms = Number(tookMs.toFixed(2))
    PERF_METRICS.excel_table_rendered_tr_count = renderedRows

    expect(renderedRows).toBeLessThan(120)
    expect(tookMs).toBeLessThan(2500)
  })
})

afterAll(() => {
  const reportPath = join(process.cwd(), "reports", "load-regression-report.md")
  mkdirSync(join(process.cwd(), "reports"), { recursive: true })

  const lines = [
    "# Load Regression Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Metrics",
    `- Total products: ${TOTAL_PRODUCTS}`,
    `- Builder hydration (${TOTAL_PRODUCTS} selected): ${PERF_METRICS.builder_hydration_ms ?? "n/a"} ms`,
    `- Builder fetch calls: ${PERF_METRICS.builder_fetch_calls ?? "n/a"} (expected ${Math.ceil(TOTAL_PRODUCTS / BUILDER_FETCH_CHUNK_SIZE)}, chunk size ${BUILDER_FETCH_CHUNK_SIZE})`,
    `- Excel hook init (${TOTAL_PRODUCTS} rows): ${PERF_METRICS.excel_hook_init_ms ?? "n/a"} ms`,
    `- Excel apply 500 changes: ${PERF_METRICS.excel_apply_500_changes_ms ?? "n/a"} ms`,
    `- Excel table first render: ${PERF_METRICS.excel_table_initial_render_ms ?? "n/a"} ms`,
    `- Excel table rendered <tr>: ${PERF_METRICS.excel_table_rendered_tr_count ?? "n/a"} (virtualized)`,
    "",
    "## Notes",
    "- These checks are regression-oriented and run in test environment (jsdom), not production browser timing.",
    "- Thresholds are intentionally generous to detect structural regressions, not micro benchmark noise.",
  ]

  writeFileSync(reportPath, lines.join("\n"), "utf8")
})
