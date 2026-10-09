import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { toast } from "sonner"

import { ImportExportModal } from "@/components/products/modals/import-export-modal"

vi.mock("@/lib/contexts/i18n-provider", () => ({
  useTranslation: () => ({ t: (key: string) => key, language: "tr" }),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), loading: vi.fn(), dismiss: vi.fn() },
}))

vi.mock("@/components/builder/modals/upgrade-modal", () => ({ UpgradeModal: () => null }))

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver

function csvFile(rows: number) {
  const lines = ["urun adi,fiyat", ...Array.from({ length: rows }, (_, i) => `Ürün ${i + 1},${i + 1}`)]
  return new File([lines.join("\n")], "urunler.csv", { type: "text/csv" })
}

async function uploadAndMap(rows: number) {
  const input = document.getElementById("file-upload") as HTMLInputElement
  fireEvent.change(input, { target: { files: [csvFile(rows)] } })
  return screen.findByRole("button", { name: "importExport.import" })
}

describe("İçe aktarma yarıda kalırsa", () => {
  beforeEach(() => vi.clearAllMocks())

  it("tekrar denemede eklenen partiyi atlayıp kalanları ekler", async () => {
    const onImport = vi.fn()
      .mockResolvedValueOnce(undefined) // 1. parti (500) eklendi
      .mockRejectedValueOnce(new Error("network")) // 2. parti başarısız
      .mockResolvedValueOnce(undefined) // tekrar deneme

    render(
      <ImportExportModal
        open
        onImport={onImport}
        onExport={vi.fn()}
        productCount={0}
        currentProductCount={0}
        maxProducts={999999}
        userPlan="pro"
      />,
    )

    fireEvent.click(await uploadAndMap(600))
    await waitFor(() => expect(onImport).toHaveBeenCalledTimes(2))
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("importExport.partialFailure", expect.anything()),
    )
    expect(onImport.mock.calls[0][0]).toHaveLength(500)

    fireEvent.click(await screen.findByRole("button", { name: "importExport.import" }))
    await waitFor(() => expect(onImport).toHaveBeenCalledTimes(3))
    // Yalnızca kalan 100 ürün gönderilir; ilk 500 ikinci kez eklenmez
    expect(onImport.mock.calls[2][0]).toHaveLength(100)
    expect((onImport.mock.calls[2][0] as { name: string }[])[0].name).toBe("Ürün 501")
  })
})
