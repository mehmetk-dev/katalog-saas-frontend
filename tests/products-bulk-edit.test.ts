import { describe, expect, it } from 'vitest'

import { applyCategoryChange, applyStockChange } from '@/components/products/hooks/use-products-extra-actions'

describe('applyCategoryChange', () => {
    it('adds a category while keeping the existing ones', () => {
        expect(applyCategoryChange('Oturma, Ofis', 'Yeni', 'add')).toBe('Oturma, Ofis, Yeni')
        expect(applyCategoryChange(null, 'Yeni', 'add')).toBe('Yeni')
    })

    it('does not duplicate a category that is already there (case-insensitive, Turkish locale)', () => {
        expect(applyCategoryChange('İç Mekan', 'iç mekan', 'add')).toBe('İç Mekan')
    })

    it('replaces all categories, or clears them when the new name is empty', () => {
        expect(applyCategoryChange('Oturma, Ofis', 'Masalar', 'replace')).toBe('Masalar')
        expect(applyCategoryChange('Oturma, Ofis', '', 'replace')).toBeNull()
    })

    it('removes only the given category', () => {
        expect(applyCategoryChange('Oturma, Ofis, Masalar', 'ofis', 'remove')).toBe('Oturma, Masalar')
        expect(applyCategoryChange('Ofis', 'Ofis', 'remove')).toBeNull()
    })
})

describe('applyStockChange', () => {
    it('sets, increases and decreases stock without going below zero', () => {
        expect(applyStockChange(7, 20, 'set')).toBe(20)
        expect(applyStockChange(7, 3, 'increase')).toBe(10)
        expect(applyStockChange(7, 3, 'decrease')).toBe(4)
        expect(applyStockChange(2, 5, 'decrease')).toBe(0)
    })
})
