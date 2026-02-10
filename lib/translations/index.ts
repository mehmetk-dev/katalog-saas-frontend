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

export type Language = "tr" | "en"

export const translations = {
    tr: {
        ...common.tr,
        ...auth.tr,
        ...billing.tr,
        ...layout.tr,
        ...dashboard.tr,
        ...products.tr,
        ...catalog.tr,
        ...settings.tr,
        ...publicPages.tr,
        ...legal.tr,
        ...admin.tr,
    },
    en: {
        ...common.en,
        ...auth.en,
        ...billing.en,
        ...layout.en,
        ...dashboard.en,
        ...products.en,
        ...catalog.en,
        ...settings.en,
        ...publicPages.en,
        ...legal.en,
        ...admin.en,
    },
} as const
