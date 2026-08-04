import { describe, expect, it } from "vitest"

import { findMissingProductIds } from "@/backend/src/controllers/catalogs/product-ownership"

describe("catalog product ownership", () => {
  it("deduplicates requested IDs and returns IDs not owned by the current tenant", () => {
    expect(
      findMissingProductIds(
        ["product-a", "product-b", "product-a", "product-c"],
        ["product-c", "product-a"]
      )
    ).toEqual(["product-b"])
  })
})
