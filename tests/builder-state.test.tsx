import { act, renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Catalog } from '@/lib/actions/catalogs'
import { useUser } from '@/lib/contexts/user-context'
import { useBuilderState } from '@/lib/hooks/use-builder-state'
import {
  DRAFT_KEYS,
  buildInitialCatalogState,
  draftsEqual,
  getAvailableColumns,
  normalizeColumnsPerRow,
  toDraft,
} from '@/components/builder/builder-utils'

vi.mock('@/lib/contexts/user-context')
vi.mock('@/lib/actions/products', () => ({ getProductsByIds: vi.fn().mockResolvedValue([]) }))

const catalog = {
  id: 'cat_1',
  name: 'Bahar',
  product_ids: [],
  layout: 'modern-grid',
  columns_per_row: 3,
  is_published: false,
} as unknown as Catalog

function renderBuilderState() {
  return renderHook(() => useBuilderState({ catalog, products: [] }))
}

describe('builder-utils: taslak yardımcıları', () => {
  it('DRAFT_KEYS her katalog alanını içerir ama yayın durumunu içermez', () => {
    const keys = Object.keys(buildInitialCatalogState(null)).filter((k) => k !== 'isPublished')
    expect([...DRAFT_KEYS].sort()).toEqual(keys.sort())
  })

  it('draftsEqual dizilerin sırasını dikkate alır', () => {
    const base = toDraft(buildInitialCatalogState(null))
    expect(draftsEqual(base, { ...base, selectedProductIds: [] })).toBe(true)
    expect(draftsEqual({ ...base, selectedProductIds: ['a', 'b'] }, { ...base, selectedProductIds: ['b', 'a'] })).toBe(false)
  })

  it('şablonun desteklemediği sütun sayısını düzeltir', () => {
    expect(getAvailableColumns('product-tiles')).toEqual([3])
    expect(normalizeColumnsPerRow('compact-list', 3)).toBe(1)
    expect(normalizeColumnsPerRow('luxury', 4)).toBe(4)
    // registry takma adları da tanınır
    expect(getAvailableColumns('classic-list')).toEqual([1])
  })
})

describe('useBuilderState', () => {
  beforeEach(() => {
    vi.mocked(useUser).mockReturnValue({ user: null } as unknown as ReturnType<typeof useUser>)
  })

  it('değişiklik kaydedilmemiş sayılır, markSaved sonrası temizlenir', () => {
    const { result } = renderBuilderState()
    expect(result.current.hasUnsavedChanges).toBe(false)

    act(() => result.current.setCatalogName('Yaz'))
    expect(result.current.hasUnsavedChanges).toBe(true)

    act(() => result.current.markSaved(result.current.getState()))
    expect(result.current.hasUnsavedChanges).toBe(false)
  })

  it('kayıt sürerken yapılan değişiklik kaydedilmemiş kalır', () => {
    const { result } = renderBuilderState()
    act(() => result.current.setCatalogName('Yaz'))
    const snapshotSentToServer = result.current.getState()

    act(() => result.current.setPrimaryColor('#ff0000'))
    act(() => result.current.markSaved(snapshotSentToServer))

    expect(result.current.hasUnsavedChanges).toBe(true)
  })

  it('geri al / yinele taslağı geri getirir', () => {
    const { result } = renderBuilderState()
    act(() => result.current.setShowPrices(false))
    expect(result.current.canUndo).toBe(true)

    act(() => result.current.undo())
    expect(result.current.showPrices).toBe(true)
    expect(result.current.canRedo).toBe(true)
    expect(result.current.hasUnsavedChanges).toBe(false)

    act(() => result.current.redo())
    expect(result.current.showPrices).toBe(false)
  })

  it('aynı alana art arda yapılan değişiklikler tek geri alma adımıdır', () => {
    vi.useFakeTimers()
    const { result } = renderBuilderState()
    act(() => result.current.setPrimaryColor('#111111'))
    act(() => result.current.setPrimaryColor('#222222'))
    act(() => result.current.setPrimaryColor('#333333'))

    act(() => result.current.undo())
    expect(result.current.primaryColor).not.toBe('#222222')
    expect(result.current.canUndo).toBe(false)
    vi.useRealTimers()
  })

  it('şablon değişince sütun aynı adımda düzelir, tek geri alma ikisini birden geri alır', () => {
    const { result } = renderBuilderState()
    act(() => result.current.setLayout('compact-list'))
    expect(result.current.columnsPerRow).toBe(1)

    act(() => result.current.undo())
    expect(result.current.layout).toBe('modern-grid')
    expect(result.current.columnsPerRow).toBe(3)
    expect(result.current.canUndo).toBe(false)
  })

  it('değer değişmeyen düzenleme geçmişe eklenmez', () => {
    const { result } = renderBuilderState()
    act(() => result.current.setCatalogName('Bahar'))
    expect(result.current.canUndo).toBe(false)
    expect(result.current.hasUnsavedChanges).toBe(false)
  })
})
