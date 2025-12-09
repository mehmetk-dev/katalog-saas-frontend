"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, ArrowRight, CheckCircle2, Layout, Share2, Download } from "lucide-react"

export default function HowItWorksPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary rounded-lg">
                            <BookOpen className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-xl">CatalogPro</span>
                    </Link>
                    <div className="flex items-center gap-6">
                        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                            <Link href="/" className="hover:text-foreground transition-colors">Ana Sayfa</Link>
                            <Link href="/how-it-works" className="text-foreground">Nasıl Çalışır</Link>
                            <Link href="/pricing" className="hover:text-foreground transition-colors">Fiyatlandırma</Link>
                        </nav>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/auth">Giriş Yap</Link>
                            </Button>
                            <Button size="sm" asChild>
                                <Link href="/auth">Başla</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="pt-32 pb-20">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
                            Dakikalar İçinde Profesyonel Kataloglar
                        </h1>
                        <p className="text-xl text-muted-foreground">
                            CatalogPro ile ürünlerinizi ekleyin, şablon seçin ve anında paylaşın. Karmaşık tasarım araçlarına gerek yok.
                        </p>
                    </div>

                    <div className="grid gap-12 lg:grid-cols-3 max-w-6xl mx-auto">
                        {/* Step 1 */}
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 rotate-3 transform hover:rotate-6 transition-transform">
                                <Layout className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold">1. Ürünlerini Ekle</h3>
                            <p className="text-muted-foreground">
                                Manuel olarak ürünlerinizi girin veya Excel'den toplu olarak içe aktarın. Fotoğraf, fiyat ve açıklamaları düzenleyin.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 mb-4 -rotate-3 transform hover:-rotate-6 transition-transform">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold">2. Şablonunu Seç</h3>
                            <p className="text-muted-foreground">
                                Sektörüne uygun profesyonel şablonlardan birini seç. Renkleri ve yazı tiplerini markana göre özelleştir.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 mb-4 rotate-3 transform hover:rotate-6 transition-transform">
                                <Share2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold">3. İndir ve Paylaş</h3>
                            <p className="text-muted-foreground">
                                Kataloğunu PDF olarak indir veya online link ile müşterilerinle paylaş. QR kod oluşturarak erişimi kolaylaştır.
                            </p>
                        </div>
                    </div>

                    <div className="mt-20 text-center">
                        <div className="inline-flex flex-col items-center p-8 bg-muted/50 rounded-3xl border border-muted">
                            <h3 className="text-2xl font-bold mb-4">Hemen Başlamaya Hazır mısın?</h3>
                            <p className="mb-6 text-muted-foreground">Kredi kartı gerekmeden ücretsiz hesabını oluştur.</p>
                            <Button size="lg" asChild className="px-8">
                                <Link href="/auth">
                                    Ücretsiz Dene <ArrowRight className="w-4 h-4 ml-2" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
