import { describe, it, expect, vi, beforeEach } from 'vitest'

const revalidatePath = vi.fn()
vi.mock('next/cache', () => ({ revalidatePath: (...args: unknown[]) => revalidatePath(...args) }))
vi.mock('@/lib/api', () => ({ apiFetch: vi.fn().mockResolvedValue({}) }))

import { updateCatalog } from '@/lib/actions/catalogs'

describe('updateCatalog revalidation', () => {
  beforeEach(() => revalidatePath.mockClear())

  it('yayında olmayan katalog için hiçbir public katalog sayfasını yenilemez', async () => {
    await updateCatalog('cat-1', { name: 'Taslak' })

    const paths = revalidatePath.mock.calls.map((call) => call[0])
    expect(paths.some((p) => String(p).startsWith('/catalog'))).toBe(false)
    // Tüm dashboard layout'u (açık builder dahil) yenilenmemeli
    expect(revalidatePath).not.toHaveBeenCalledWith('/dashboard', 'layout')
  })

  it('yayındaki katalogta sadece o kataloğun sayfasını yeniler', async () => {
    await updateCatalog('cat-1', { name: 'Canlı' }, { publicSlug: 'acme-katalog-ab12' })

    expect(revalidatePath).toHaveBeenCalledWith('/catalog/acme-katalog-ab12')
    expect(revalidatePath).not.toHaveBeenCalledWith('/catalog/[slug]', 'page')
  })

  it('revalidate: false ile hiçbir yolu yenilemez (builder otomatik kaydı)', async () => {
    await updateCatalog('cat-1', { name: 'Otomatik' }, { revalidate: false, publicSlug: 'acme' })

    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('slug değişikliğinde yeni slug sayfasını yeniler', async () => {
    await updateCatalog('cat-1', { share_slug: 'yeni-slug' })

    expect(revalidatePath).toHaveBeenCalledWith('/catalog/yeni-slug')
  })
})
