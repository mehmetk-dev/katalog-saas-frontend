import { redirect } from "next/navigation"

// Excel Düzenleyici artık Ürünler sayfasının "Tablo" görünümü; eski linkler ve yer imleri oraya gider
export default async function ExcelPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page } = await searchParams
  const pageNumber = Number.parseInt(page || "", 10)
  redirect(`/dashboard/products?view=table${Number.isFinite(pageNumber) && pageNumber > 1 ? `&page=${pageNumber}` : ""}`)
}
