import { describe, it, expect, vi, beforeEach } from 'vitest'

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }))
vi.mock('@/lib/api', () => ({ apiFetch }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { getAllProductIds } from '@/lib/actions/products'

describe('getAllProductIds', () => {
  beforeEach(() => {
    apiFetch.mockReset()
  })

  it('ilk sayfadan sonra kalan sayfaları paralel ister ve tüm ID\'leri döner', async () => {
    const paths: string[] = []
    let inFlight = 0
    let maxInFlight = 0
    apiFetch.mockImplementation(async (path: string) => {
      paths.push(path)
      inFlight++
      maxInFlight = Math.max(maxInFlight, inFlight)
      await new Promise((resolve) => setTimeout(resolve, 5))
      inFlight--
      const page = new URLSearchParams(path.split('?')[1]).get('page')
      return { products: [{ id: `p-${page}` }], metadata: { totalPages: 6 } }
    })

    const ids = await getAllProductIds({ category: 'Masa' })

    expect(ids).toEqual(['p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6'])
    expect(paths).toHaveLength(6)
    expect(maxInFlight).toBeGreaterThan(1)
    // Supabase satır sınırını aşmamak için sayfa boyutu 1000'de kalmalı
    expect(paths.every((path) => path.includes('limit=1000') && path.includes('category=Masa'))).toBe(true)
  })

  it('tek sayfalık sonuçta tek istek atar', async () => {
    apiFetch.mockResolvedValue({ products: [{ id: 'a' }, { id: 'b' }, { id: 'a' }], metadata: { totalPages: 1 } })

    expect(await getAllProductIds()).toEqual(['a', 'b'])
    expect(apiFetch).toHaveBeenCalledTimes(1)
  })
})
