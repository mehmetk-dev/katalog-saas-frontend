import { describe, it, expect } from 'vitest'
import common from '@/lib/translations/common'
import auth from '@/lib/translations/auth'
import billing from '@/lib/translations/billing'
import layout from '@/lib/translations/layout'
import dashboard from '@/lib/translations/dashboard'
import products from '@/lib/translations/products'
import catalog from '@/lib/translations/catalog'
import settings from '@/lib/translations/settings'
import publicPages from '@/lib/translations/public-pages'
import legal from '@/lib/translations/legal'
import admin from '@/lib/translations/admin'
import excel from '@/lib/translations/excel'

const modules = { common, auth, billing, layout, dashboard, products, catalog, settings, publicPages, legal, admin, excel }

/**
 * lib/translations/index.ts modülleri sığ spread ile birleştirir: iki modül aynı üst
 * düzey anahtarı (ör. "pdf") tanımlarsa sonraki öncekini tamamen ezer ve ilkindeki
 * çeviriler sessizce kaybolur.
 */
describe('translations structure', () => {
  for (const lang of ['tr', 'en'] as const) {
    it(`${lang}: hiçbir üst düzey anahtar birden fazla modülde tanımlı değil`, () => {
      const owners = new Map<string, string[]>()
      for (const [name, mod] of Object.entries(modules)) {
        for (const key of Object.keys((mod as Record<string, object>)[lang])) {
          owners.set(key, [...(owners.get(key) ?? []), name])
        }
      }
      const shadowed = Object.fromEntries([...owners].filter(([, mods]) => mods.length > 1))
      expect(shadowed).toEqual({})
    })
  }
})
