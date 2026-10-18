// Diller ayrı dosyalarda: tarayıcı yalnızca seçili dili indirir (bkz. lib/contexts/i18n-provider.tsx)
import tr from "./tr/layout"
import en from "./en/layout"

const layout = { tr, en } as const

export default layout
