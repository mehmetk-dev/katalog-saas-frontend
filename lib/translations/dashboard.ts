// Diller ayrı dosyalarda: tarayıcı yalnızca seçili dili indirir (bkz. lib/contexts/i18n-provider.tsx)
import tr from "./tr/dashboard"
import en from "./en/dashboard"

const dashboard = { tr, en } as const

export default dashboard
