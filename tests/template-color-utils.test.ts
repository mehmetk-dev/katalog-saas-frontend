import { describe, it, expect } from 'vitest'
import { contrastRatio, ensureReadable, isLightColor, resolveTemplateBackground } from '@/components/catalogs/templates/utils'

describe('template color utils', () => {
  it('contrastRatio: siyah/beyaz 21, aynı renk 1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
    expect(contrastRatio('#cf1414', '#cf1414')).toBeCloseTo(1, 5)
    expect(contrastRatio('rgba(24, 24, 27, 1)', '#fff')).toBeGreaterThan(15)
    expect(contrastRatio('not-a-color', '#fff')).toBeNull()
  })

  it('ensureReadable: okunuyorsa kullanıcının rengini korur', () => {
    expect(ensureReadable('#000000', '#ffffff')).toBe('#000000')
    expect(ensureReadable('#ffd700', '#0a0a0a')).toBe('#ffd700')
  })

  it('ensureReadable: koyu zeminde koyu yazıyı beyaza, açık zeminde açık yazıyı koyuya çeker', () => {
    // builder varsayılanı #000000, koyu başlık barı
    expect(ensureReadable('#000000', 'rgba(24, 24, 27, 1)')).toBe('#ffffff')
    expect(ensureReadable('#ffffff', '#f4f4f5')).toBe('#111111')
    expect(ensureReadable(undefined, '#0a0f18')).toBe('#ffffff')
  })

  it('ensureReadable: minRatio ve özel renkler', () => {
    // siyah yazı mor bar üstünde ~3.6: varsayılan eşiği geçer, 4.5 eşiğinde beyaza döner
    expect(ensureReadable('#000000', '#7c3aed')).toBe('#000000')
    expect(ensureReadable('#000000', '#7c3aed', { minRatio: 4.5 })).toBe('#ffffff')
    expect(ensureReadable('#000000', '#0a0a0a', { light: '#f3eacb' })).toBe('#f3eacb')
  })

  it('isLightColor', () => {
    expect(isLightColor('#ffffff')).toBe(true)
    expect(isLightColor('#18181b')).toBe(false)
  })

  it('resolveTemplateBackground: varsayılan beyaz yerine şablonun zemini, seçilen renge dokunmaz', () => {
    expect(resolveTemplateBackground('#ffffff', '#0a0a0a')).toBe('#0a0a0a')
    expect(resolveTemplateBackground('#FFF', '#0a0a0a')).toBe('#0a0a0a')
    expect(resolveTemplateBackground(null, '#0a0a0a')).toBe('#0a0a0a')
    expect(resolveTemplateBackground('#fef7ed', '#0a0a0a')).toBe('#fef7ed')
  })
})
