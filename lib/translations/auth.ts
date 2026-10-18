// Diller ayrı dosyalarda: tarayıcı yalnızca seçili dili indirir (bkz. lib/contexts/i18n-provider.tsx)
import tr from "./tr/auth"
import en from "./en/auth"

const auth = { tr, en } as const

export default auth
