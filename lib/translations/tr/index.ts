// Türkçe her sayfayla gelir (varsayılan dil)
import common from "./common"
import auth from "./auth"
import billing from "./billing"
import layout from "./layout"
import dashboard from "./dashboard"
import products from "./products"
import catalog from "./catalog"
import settings from "./settings"
import publicPages from "./public-pages"
import legal from "./legal"
import admin from "./admin"
import excel from "./excel"

export const tr = {
    ...common,
    ...auth,
    ...billing,
    ...layout,
    ...dashboard,
    ...products,
    ...catalog,
    ...settings,
    ...publicPages,
    ...legal,
    ...admin,
    ...excel,
} as const
