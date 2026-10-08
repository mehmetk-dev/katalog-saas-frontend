import { act, renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const replace = vi.fn()
const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push, refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

import { useProductsPageState } from '@/components/products/hooks/use-products-page-state'

const baseProps = {
  initialProducts: [],
  initialMetadata: { total: 0, page: 1, limit: 12, totalPages: 1 },
  initialStats: { total: 0, inStock: 0, lowStock: 0, outOfStock: 0, totalValue: 0 },
  initialAllCategories: [],
  userPlan: 'pro' as const,
  maxProducts: 500,
  t: (key: string) => key,
}

describe('useProductsPageState', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    replace.mockClear()
    push.mockClear()
    // Node 26'nın global localStorage'ı jsdom'unkini gölgeliyor; bellek içi taklit
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v) },
      removeItem: (k: string) => { store.delete(k) },
      clear: () => store.clear(),
    })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('arama kutusu anında güncellenir, URL tek seferde ve son değerle güncellenir', () => {
    const { result } = renderHook(() => useProductsPageState(baseProps))

    act(() => {
      for (const value of ['e', 'el', 'elb', 'elbise']) result.current.handleSearchChange(value)
    })
    expect(result.current.search).toBe('elbise')
    expect(replace).not.toHaveBeenCalled()

    act(() => { vi.advanceTimersByTime(350) })
    expect(replace).toHaveBeenCalledTimes(1)
    expect(replace.mock.calls[0][0]).toContain('search=elbise')
  })

  it('filtre değişiklikleri tarayıcı geçmişine yeni kayıt eklemez', () => {
    const { result } = renderHook(() => useProductsPageState(baseProps))
    act(() => result.current.handleCategoryChange('Elbiseler'))
    expect(push).not.toHaveBeenCalled()
    expect(replace).toHaveBeenCalledWith(expect.stringContaining('category=Elbiseler'), { scroll: false })
  })

  it('fiyat aralığı sayfadaki ürünlerden türetilmez (0 = sınır yok)', () => {
    const { result } = renderHook(() => useProductsPageState({
      ...baseProps,
      initialProducts: [{ id: 'a', price: 4500 }, { id: 'b', price: 900 }] as never,
    }))
    expect(result.current.priceRange).toEqual([0, 0])
  })

  it('görünüm tercihi hatırlanır', () => {
    const first = renderHook(() => useProductsPageState(baseProps))
    act(() => first.result.current.setViewMode('grid'))
    first.unmount()

    const second = renderHook(() => useProductsPageState(baseProps))
    expect(second.result.current.viewMode).toBe('grid')
  })
})
