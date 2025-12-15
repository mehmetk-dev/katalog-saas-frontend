import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { ArrowRight, Layout, CheckCircle2, Share2 } from "lucide-react"

export default function HowItWorksPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <PublicHeader />

            <main className="pt-32 pb-20">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6 text-slate-900">
                            Dakikalar İçinde Profesyonel Kataloglar
                        </h1>
                        <p className="text-xl text-slate-500">
                            CatalogPro ile ürünlerinizi ekleyin, şablon seçin ve anında paylaşın.
                        </p>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
                        {/* Step 1 */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-lg transition-all">
                            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-6">
                                <Layout className="w-6 h-6 text-violet-600" />
                            </div>
                            <div className="text-sm font-medium text-violet-600 mb-2">Adım 1</div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">Ürünlerini Ekle</h3>
                            <p className="text-slate-500">
                                Manuel olarak ürünlerinizi girin veya Excel'den toplu olarak içe aktarın.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-lg transition-all">
                            <div className="w-12 h-12 rounded-xl bg-fuchsia-100 flex items-center justify-center mb-6">
                                <CheckCircle2 className="w-6 h-6 text-fuchsia-600" />
                            </div>
                            <div className="text-sm font-medium text-fuchsia-600 mb-2">Adım 2</div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">Şablonunu Seç</h3>
                            <p className="text-slate-500">
                                16+ profesyonel şablondan birini seç ve markanıza göre özelleştir.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-lg transition-all">
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-6">
                                <Share2 className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div className="text-sm font-medium text-emerald-600 mb-2">Adım 3</div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">Paylaş</h3>
                            <p className="text-slate-500">
                                PDF olarak indir veya online link ile paylaş. QR kod oluştur.
                            </p>
                        </div>
                    </div>

                    <div className="mt-20 text-center">
                        <div className="bg-white rounded-2xl border border-slate-200 p-10 max-w-xl mx-auto">
                            <h3 className="text-2xl font-bold mb-4 text-slate-900">Hemen Başlayın</h3>
                            <p className="mb-8 text-slate-500">İlk kataloğunuzu dakikalar içinde oluşturun.</p>
                            <Link href="/auth?tab=signup">
                                <Button size="lg" className="bg-violet-600 hover:bg-violet-700 h-11 px-8">
                                    Ücretsiz Hesap Oluştur
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    )
}
