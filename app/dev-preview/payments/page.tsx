// GEÇİCİ: görsel QA için — commit'lenmeyecek
import { ThemeProvider } from '@/components/theme-provider'

import { PaymentOperationsTab } from './tab-copy'

export default function Page() {
    return <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange><div className="min-h-dvh bg-background p-8"><div className="mx-auto max-w-7xl"><PaymentOperationsTab /></div></div></ThemeProvider>
}
