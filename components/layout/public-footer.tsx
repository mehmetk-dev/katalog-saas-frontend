import Link from "next/link"
import { LayoutGrid } from "lucide-react"

export function PublicFooter() {
    return (
        <footer className="border-t border-slate-200 bg-white pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-3 gap-12 mb-12">
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center">
                                <LayoutGrid className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-lg">CatalogPro</span>
                        </Link>
                        <p className="text-slate-500 leading-relaxed text-sm">
                            Modern işletmeler için yeni nesil katalog oluşturma platformu.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 mb-5">Ürün</h4>
                        <ul className="space-y-3 text-sm text-slate-500">
                            <li><Link href="/features" className="hover:text-violet-600 transition-colors">Özellikler</Link></li>
                            <li><Link href="/pricing" className="hover:text-violet-600 transition-colors">Fiyatlandırma</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 mb-5">Destek</h4>
                        <ul className="space-y-3 text-sm text-slate-500">
                            <li><Link href="/contact" className="hover:text-violet-600 transition-colors">İletişim</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
                    <p>© 2025 CatalogPro. Tüm hakları saklıdır.</p>
                    <div className="flex items-center gap-6">
                        <Link href="/privacy" className="hover:text-violet-600 transition-colors">Gizlilik Politikası</Link>
                        <Link href="/terms" className="hover:text-violet-600 transition-colors">Kullanım Şartları</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
