// Diller ayrı dosyalarda: tarayıcı yalnızca seçili dili indirir (bkz. lib/contexts/i18n-provider.tsx)
import tr from "./tr/billing"
import en from "./en/billing"

const billing = { tr, en } as const

export default billing
