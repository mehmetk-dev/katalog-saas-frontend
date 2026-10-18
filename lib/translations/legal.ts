// Diller ayrı dosyalarda: tarayıcı yalnızca seçili dili indirir (bkz. lib/contexts/i18n-provider.tsx)
import tr from "./tr/legal"
import en from "./en/legal"

const legal = { tr, en } as const

export default legal
