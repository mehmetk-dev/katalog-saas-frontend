// Diller ayrı dosyalarda: tarayıcı yalnızca seçili dili indirir (bkz. lib/contexts/i18n-provider.tsx)
import tr from "./tr/admin"
import en from "./en/admin"

const admin = { tr, en } as const

export default admin
