import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { afterAll, describe, expect, it, vi } from "vitest"

const TOTAL_PRODUCTS = Number(process.env.TOTAL_PRODUCTS || "10000")
const BULK_CHUNK_SIZE = 200
const METRICS: Record<string, number> = {}

type NewRowLike = {
  name: string
  sku: string
  price: number
  stock: number
  category: string | null
  description: string | null
  product_url: string | null
}

function buildRows(total: number): NewRowLike[] {
  return Array.from({ length: total }, (_, i) => ({
    name: `Product ${i + 1}`,
    sku: `SKU-${i + 1}`,
    price: (i % 1000) + 1,
    stock: i % 100,
    category: i % 2 === 0 ? "A" : "B",
    description: null,
    product_url: null,
  }))
}

async function runSingleInsert(
  rows: NewRowLike[],
  createFn: (row: NewRowLike) => Promise<void>
) {
  for (const row of rows) {
    await createFn(row)
  }
}

async function runBulkInsert(
  rows: NewRowLike[],
  chunkSize: number,
  bulkFn: (rows: NewRowLike[]) => Promise<void>
) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    await bulkFn(rows.slice(i, i + chunkSize))
  }
}

describe("Ingest Structure Benchmark", () => {
  it("compares single create flow vs chunked bulk flow", async () => {
    const rows = buildRows(TOTAL_PRODUCTS)

    const createFn = vi.fn(async (_row: NewRowLike) => {})
    const bulkFn = vi.fn(async (_chunk: NewRowLike[]) => {})

    const t1 = performance.now()
    await runSingleInsert(rows, createFn)
    const singleMs = performance.now() - t1

    const t2 = performance.now()
    await runBulkInsert(rows, BULK_CHUNK_SIZE, bulkFn)
    const bulkMs = performance.now() - t2

    const singleCalls = createFn.mock.calls.length
    const bulkCalls = bulkFn.mock.calls.length

    METRICS.total_products = TOTAL_PRODUCTS
    METRICS.single_calls = singleCalls
    METRICS.bulk_calls = bulkCalls
    METRICS.single_loop_ms = Number(singleMs.toFixed(2))
    METRICS.bulk_loop_ms = Number(bulkMs.toFixed(2))
    METRICS.call_reduction_factor = Number((singleCalls / Math.max(1, bulkCalls)).toFixed(2))
    METRICS.call_reduction_percent = Number((((singleCalls - bulkCalls) / singleCalls) * 100).toFixed(2))

    expect(singleCalls).toBe(TOTAL_PRODUCTS)
    expect(bulkCalls).toBe(Math.ceil(TOTAL_PRODUCTS / BULK_CHUNK_SIZE))
    expect(bulkCalls).toBeLessThan(singleCalls)
  })
})

afterAll(() => {
  const reportPath = join(process.cwd(), "reports", "ingest-structure-benchmark.md")
  mkdirSync(join(process.cwd(), "reports"), { recursive: true })

  const lines = [
    "# Ingest Structure Benchmark",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Scenario",
    `- Total products: ${METRICS.total_products ?? "n/a"}`,
    `- Bulk chunk size: ${BULK_CHUNK_SIZE}`,
    "",
    "## Results",
    `- Single create calls: ${METRICS.single_calls ?? "n/a"}`,
    `- Bulk import calls: ${METRICS.bulk_calls ?? "n/a"}`,
    `- Call reduction: ${METRICS.call_reduction_percent ?? "n/a"}%`,
    `- Reduction factor: ${METRICS.call_reduction_factor ?? "n/a"}x fewer requests`,
    `- Single loop CPU time: ${METRICS.single_loop_ms ?? "n/a"} ms`,
    `- Bulk loop CPU time: ${METRICS.bulk_loop_ms ?? "n/a"} ms`,
    "",
    "## Interpretation",
    "- Single flow models 'teker teker urun ekleme' request pattern.",
    "- Bulk flow models Excel/batch import pattern (chunked).",
    "- Network/DB latency is not included in this synthetic test.",
  ]

  writeFileSync(reportPath, lines.join("\n"), "utf8")
})
