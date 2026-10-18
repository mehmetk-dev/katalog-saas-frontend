// Diller ayrı dosyalarda: tarayıcı yalnızca seçili dili indirir (bkz. lib/contexts/i18n-provider.tsx)
import tr from "./tr/catalog"
import en from "./en/catalog"

const catalog = { tr, en } as const

export default catalog
