import Link from "next/link"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { Button } from "@/components/ui/button"
import {
    ArrowRight,
    MousePointerClick,
    QrCode,
    BarChart3,
    Layers,
    Share2,
    Download,
    FileText,
    Palette,
    Smartphone
} from "lucide-react"

export const metadata = {
    title: "Özellikler | CatalogPro",
    description: "CatalogPro'nun sunduğu tüm özellikler.",
}

const features = [
    {
        icon: MousePointerClick,
        title: "Sürükle-Bırak Editör",
        description: "Teknik bilgi gerektirmeden, görsel arayüz ile kataloglarınızı oluşturun."
    },
    {
        icon: Layers,
        title: "Profesyonel Şablonlar",
        description: "16+ farklı şablon arasından markanıza uygun olanı seçin."
    },
    {
        icon: QrCode,
        title: "QR Kod",
        description: "Her katalog için otomatik QR kod oluşturma."
    },
    {
        icon: BarChart3,
        title: "Detaylı Analitik",
        description: "Görüntülenme ve etkileşim verilerini takip edin."
    },
    {
        icon: Share2,
        title: "Kolay Paylaşım",
        description: "Tek tıkla WhatsApp veya sosyal medyada paylaşın."
    },
    {
        icon: Download,
        title: "PDF Dışa Aktarma",
        description: "Kataloglarınızı PDF olarak indirin."
    },
    {
        icon: FileText,
        title: "Excel Import",
        description: "Ürünlerinizi Excel'den toplu olarak içe aktarın."
    },
    {
        icon: Palette,
        title: "Marka Özelleştirme",
        description: "Logo ve renklerinizi ekleyin."
    },
    {
        icon: Smartphone,
        title: "Mobil Uyumlu",
        description: "Tüm cihazlarda mükemmel görünüm."
    }
]

export default function FeaturesPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <PublicHeader />

            <main className="pt-32 pb-20">
                {/* Hero */}
                <div className="max-w-4xl mx-auto px-6 text-center mb-20">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
                        Özellikler
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Profesyonel kataloglar oluşturmak için ihtiyacınız olan tüm araçlar.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="max-w-6xl mx-auto px-6 mb-20">
                    <div className="grid md:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300 group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4 group-hover:bg-violet-100 transition-colors">
                                    <feature.icon className="w-6 h-6 text-slate-500 group-hover:text-violet-600 transition-colors" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                                <p className="text-slate-500">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <div className="bg-white rounded-2xl border border-slate-200 p-10">
                        <h2 className="text-2xl font-bold text-slate-900 mb-3">Hemen başlayın</h2>
                        <p className="text-slate-500 mb-8">İlk kataloğunuzu birkaç dakika içinde oluşturun.</p>
                        <Link href="/auth?tab=signup">
                            <Button className="bg-violet-600 hover:bg-violet-700 h-11 px-6">
                                Ücretsiz Hesap Oluştur
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    )
}
