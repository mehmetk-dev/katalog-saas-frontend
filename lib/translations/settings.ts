// Diller ayrı dosyalarda: tarayıcı yalnızca seçili dili indirir (bkz. lib/contexts/i18n-provider.tsx)
import tr from "./tr/settings"
import en from "./en/settings"

const settings = { tr, en } as const

export default settings
