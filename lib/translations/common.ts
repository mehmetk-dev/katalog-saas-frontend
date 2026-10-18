// Diller ayrı dosyalarda: tarayıcı yalnızca seçili dili indirir (bkz. lib/contexts/i18n-provider.tsx)
import tr from "./tr/common"
import en from "./en/common"

const common = { tr, en } as const

export default common
