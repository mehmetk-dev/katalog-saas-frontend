// Diller ayrı dosyalarda: tarayıcı yalnızca seçili dili indirir (bkz. lib/contexts/i18n-provider.tsx)
import tr from "./tr/public-pages"
import en from "./en/public-pages"

const publicPages = { tr, en } as const

export default publicPages
