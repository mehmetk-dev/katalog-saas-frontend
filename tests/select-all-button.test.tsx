import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { SelectAllButton } from "@/components/builder/editor/editor-product-cards"

const t = (key: string) => key

describe("SelectAllButton", () => {
  it("selects the filtered IDs with a single click even when they are fetched lazily", async () => {
    const onChange = vi.fn()
    const onFetch = vi.fn().mockResolvedValue(["filtered-1", "filtered-2"])

    render(
      <SelectAllButton
        allProductIds={[]}
        selectedProductIdSet={new Set(["already-selected"])}
        selectedProductIds={["already-selected"]}
        onSelectedProductIdsChange={onChange}
        onPrefetchAllProductIds={onFetch}
        t={t}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "builder.selectAll" }))

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith([
        "already-selected",
        "filtered-1",
        "filtered-2",
      ])
    })
  })

  it("clears only the IDs in the active filter", () => {
    const onChange = vi.fn()

    render(
      <SelectAllButton
        allProductIds={["filtered-1", "filtered-2"]}
        selectedProductIdSet={new Set(["outside-filter", "filtered-1", "filtered-2"])}
        selectedProductIds={["outside-filter", "filtered-1", "filtered-2"]}
        onSelectedProductIdsChange={onChange}
        t={t}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "builder.clearSelection" }))

    expect(onChange).toHaveBeenCalledWith(["outside-filter"])
  })
})
