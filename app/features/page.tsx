"use client"

import Link from "next/link"
import {
    ArrowRight,
    MousePointerClick,
    QrCode,
    BarChart3,
    Share2,
    FileText,
    Smartphone,
    Rocket,
    Globe,
    Zap,
    Image as ImageIcon,
    ShieldCheck
} from "lucide-react"

import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { Button } from "@/components/ui/button"

export default function FeaturesPage() {
    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100">
            <PublicHeader />

            <main className="pt-32 pb-24 md:pt-40 md:pb-32 px-4 overflow-hidden">
                {/* Ambient Background */}
                <div className="fixed inset-0 pointer-events-none -z-10">
                    <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vh] bg-indigo-50/80 rounded-full blur-[150px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vh] bg-blue-50/80 rounded-full blur-[150px]"></div>
                </div>

                {/* Hero Section */}
                <div className="max-w-5xl mx-auto text-center mb-32 relative">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-100 bg-white shadow-sm mb-8 animate-in fade-in zoom-in duration-700">
                        <Rocket className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-900">FogCatalog v2.0 Özellikleri</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 mb-8 leading-[0.95] tracking-tight">
                        İşinizi Büyüten <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 animate-gradient-x">Süper Güçler.</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-light">
                        Sadece bir katalog değil. Satışlarınızı artıran, müşterilerinizi etkileyen ve işinizi kolaylaştıran eksiksiz bir dijital dönüşüm aracı.
                    </p>
                </div>

                {/* FEATURE 1: Bulk Upload (Left Image / Right Text) */}
                <section className="max-w-7xl mx-auto mb-32 md:mb-48">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-[2rem] blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                            <div className="relative bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-indigo-100/50 overflow-hidden min-h-[400px] flex flex-col items-center justify-center">
                                {/* Visual Mockup for Drag & Drop */}
                                <div className="absolute inset-0 bg-slate-50/50 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]"></div>
                                <div className="w-full max-w-sm border-2 border-dashed border-indigo-300 bg-indigo-50/50 rounded-3xl p-10 text-center relative z-10 group-hover:scale-105 transition-transform duration-500">
                                    <div className="w-20 h-20 bg-white rounded-full shadow-lg mx-auto flex items-center justify-center mb-6">
                                        <ImageIcon className="w-10 h-10 text-indigo-600" />
                                    </div>
                                    <p className="font-bold text-indigo-900 text-lg mb-2">Fotoğrafları Buraya Bırakın</p>
                                    <p className="text-sm text-indigo-600/70">veya seçmek için tıklayın</p>

                                    {/* Floating Badges */}
                                    <div className="absolute -right-8 -top-6 bg-white shadow-lg p-3 rounded-xl flex gap-3 animate-bounce">
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg bg-[url('https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100')] bg-cover"></div>
                                        <div>
                                            <div className="h-2 w-16 bg-slate-200 rounded mb-1"></div>
                                            <div className="h-2 w-10 bg-green-200 rounded"></div>
                                        </div>
                                        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">✓</div>
                                    </div>
                                    <div className="absolute -left-8 bottom-10 bg-white shadow-lg p-3 rounded-xl flex gap-3 animate-bounce delay-150">
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg bg-[url('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100')] bg-cover"></div>
                                        <div>
                                            <div className="h-2 w-12 bg-slate-200 rounded mb-1"></div>
                                            <div className="h-2 w-8 bg-green-200 rounded"></div>
                                        </div>
                                        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">✓</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-8">
                                <MousePointerClick className="w-6 h-6 text-indigo-600" />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Binlerce Ürün,<br />Saniyeler İçinde.</h2>
                            <p className="text-xl text-slate-500 leading-relaxed mb-8">
                                Tek tek ürün girmekle uğraşmayın. Akıllı sürükle-bırak teknolojimizle yüzlerce fotoğrafı aynı anda yükleyin. Sistemimiz ürün isimlerini otomatik tanır, size sadece fiyatları girmek kalır.
                            </p>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3 font-semibold text-slate-700">
                                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs">✓</div>
                                    Toplu Fotoğraf Yükleme
                                </li>
                                <li className="flex items-center gap-3 font-semibold text-slate-700">
                                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs">✓</div>
                                    Otomatik İsimlendirme
                                </li>
                                <li className="flex items-center gap-3 font-semibold text-slate-700">
                                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs">✓</div>
                                    Excel ile Düzenleme (Yakında)
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* FEATURE 2: WhatsApp Orders (Right Image / Left Text) */}
                <section className="max-w-7xl mx-auto mb-32 md:mb-48">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="order-2 lg:order-1">
                            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-8">
                                <Smartphone className="w-6 h-6 text-green-600" />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">WhatsApp ile<br />Hızlı Satış.</h2>
                            <p className="text-xl text-slate-500 leading-relaxed mb-8">
                                Müşterileriniz katalogda beğendikleri ürünleri sepete ekler ve tek tuşla WhatsApp üzerinden size gönderir. E-ticaret sitesi karmaşası yok, üyelik zorunluluğu yok.
                            </p>
                            <Link href="/auth?plan=free">
                                <Button className="h-14 px-8 bg-green-600 hover:bg-green-700 text-white rounded-full text-lg font-bold shadow-lg shadow-green-200">
                                    Hemen Deneyin
                                </Button>
                            </Link>
                        </div>
                        <div className="order-1 lg:order-2 relative group">
                            <div className="absolute inset-0 bg-green-200 rounded-[2rem] blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>

                            {/* Phone Mockup */}
                            <div className="relative mx-auto w-[300px] h-[600px] bg-slate-900 rounded-[3rem] border-8 border-slate-900 shadow-2xl overflow-hidden">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-xl z-20"></div>
                                <div className="w-full h-full bg-[#ECE5DD] flex flex-col pt-12 relative">
                                    {/* Chat Header */}
                                    <div className="h-16 bg-[#075E54] flex items-center px-4 gap-3 shadow-md z-10">
                                        <div className="w-10 h-10 bg-white/20 rounded-full"></div>
                                        <div>
                                            <div className="h-2 w-24 bg-white/40 rounded mb-1"></div>
                                            <div className="h-2 w-12 bg-white/20 rounded"></div>
                                        </div>
                                    </div>

                                    {/* Chat Messages */}
                                    <div className="flex-1 p-4 space-y-4">
                                        <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm max-w-[80%] self-start">
                                            <p className="text-xs text-slate-400 mb-1">Otomatik Mesaj</p>
                                            <p className="text-sm font-medium text-slate-800">
                                                Merhaba, kataloğunuzdan aşağıdaki ürünleri sipariş vermek istiyorum:
                                            </p>
                                            <div className="mt-3 space-y-2 border-l-2 border-green-500 pl-2">
                                                <div className="text-xs text-slate-600">— Keten Gömlek (Mavi, L)</div>
                                                <div className="text-xs text-slate-600">— Kot Pantolon (Siyah, 32)</div>
                                            </div>
                                            <div className="mt-3 font-bold text-green-700 text-sm">Toplam: 1.250 ₺</div>
                                        </div>

                                        <div className="bg-[#DCF8C6] p-3 rounded-lg rounded-tr-none shadow-sm max-w-[80%] ml-auto self-end">
                                            <p className="text-sm text-slate-800">Harika! Siparişinizi aldım, hemen hazırlıyorum. 🚀</p>
                                        </div>
                                    </div>

                                    {/* Input Area */}
                                    <div className="h-16 bg-white p-2 flex items-center gap-2">
                                        <div className="flex-1 h-10 bg-slate-100 rounded-full"></div>
                                        <div className="w-10 h-10 bg-[#075E54] rounded-full flex items-center justify-center text-white">
                                            <ArrowRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FEATURE 3: QR & PDF (Dual Cards) */}
                <section className="max-w-7xl mx-auto mb-32">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Card 1: QR Code */}
                        <div className="bg-slate-950 rounded-[3rem] p-10 md:p-14 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/30 rounded-full blur-[80px] group-hover:bg-violet-600/50 transition-colors duration-500"></div>

                            <div className="relative z-10">
                                <QrCode className="w-12 h-12 text-violet-400 mb-6" />
                                <h3 className="text-3xl font-bold mb-4">Akıllı QR Kod</h3>
                                <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                                    Bastırdığınız QR kodu vitrininize veya kartvizitinize koyun. Kataloğunuzu güncellediğinizde QR kodunuz değişmez, her zaman en güncel ürünlerinizi gösterir.
                                </p>
                                <div className="w-full max-w-[200px] aspect-square bg-white p-4 rounded-xl mx-auto shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                    <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center">
                                        <QrCode className="w-24 h-24 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: PDF Generation */}
                        <div className="bg-slate-50 border border-slate-200 rounded-[3rem] p-10 md:p-14 text-slate-900 relative overflow-hidden group">
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-200/30 rounded-full blur-[80px]"></div>

                            <div className="relative z-10 h-full flex flex-col">
                                <div className="mb-auto">
                                    <FileText className="w-12 h-12 text-rose-500 mb-6" />
                                    <h3 className="text-3xl font-bold mb-4">Tek Tıkla PDF</h3>
                                    <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                                        Dijital kataloğunuzu anında baskıya hazır, yüksek çözünürlüklü bir PDF dosyasına dönüştürün. İnternetin olmadığı yerlerde bile sunum yapın.
                                    </p>
                                </div>

                                <div className="relative h-48 mt-8 perspective-[1000px]">
                                    <div className="absolute left-1/2 -translate-x-1/2 top-0 w-40 h-56 bg-white shadow-xl shadow-slate-200 border border-slate-200 rounded-lg rotate-x-12 group-hover:rotate-x-0 group-hover:-translate-y-4 transition-all duration-500 flex flex-col p-4 items-center">
                                        <div className="w-full h-24 bg-slate-100 rounded mb-2 overflow-hidden">
                                            <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200')] bg-cover opacity-50"></div>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded mb-1"></div>
                                        <div className="w-2/3 h-2 bg-slate-100 rounded mb-4"></div>
                                        <div className="mt-auto flex items-center gap-2">
                                            <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center text-[8px] font-bold text-red-600">PDF</div>
                                            <span className="text-[8px] text-slate-400">catalog.pdf</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* BENTO GRID: Other Features */}
                <section className="max-w-7xl mx-auto mb-20">
                    <h2 className="text-3xl font-bold text-center mb-16">Ve Çok Daha Fazlası...</h2>
                    <div className="grid md:grid-cols-4 gap-4 md:gap-6 auto-rows-[250px]">

                        <div className="md:col-span-2 bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:border-slate-200 transition-colors flex flex-col justify-between group">
                            <div>
                                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                                    <BarChart3 className="w-5 h-5" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Gelişmiş Analitik</h3>
                                <p className="text-slate-500">Kataloğunuzu kaç kişi gezdi, en çok hangi ürünlere tıklandı? Tüm veriler elinizin altında.</p>
                            </div>
                            <div className="w-full h-24 flex items-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                <div className="w-full bg-indigo-200 h-1/3 rounded-t-lg"></div>
                                <div className="w-full bg-indigo-300 h-2/3 rounded-t-lg"></div>
                                <div className="w-full bg-indigo-500 h-full rounded-t-lg"></div>
                                <div className="w-full bg-indigo-400 h-1/2 rounded-t-lg"></div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-8 border border-slate-100 flex flex-col justify-center items-center text-center shadow-lg hover:-translate-y-1 transition-transform">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg shadow-purple-200">
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                            <h3 className="font-bold mb-1">Güvenli Altyapı</h3>
                            <p className="text-xs text-slate-400">SSL Korumalı & Yedekli</p>
                        </div>

                        <div className="bg-slate-900 text-white rounded-3xl p-8 flex flex-col justify-between">
                            <Globe className="w-8 h-8 text-emerald-400" />
                            <div>
                                <h3 className="font-bold text-lg mb-1">Global Erişim</h3>
                                <p className="text-slate-400 text-sm">Dünyanın her yerinden kataloğunuza erişim.</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-8 border border-slate-100 flex flex-col items-center justify-center text-center">
                            <Share2 className="w-8 h-8 text-blue-500 mb-4" />
                            <h3 className="font-bold mb-1">Tek Tıkla Paylaş</h3>
                            <p className="text-sm text-slate-500">Instagram, Facebook, Email.</p>
                        </div>

                        <div className="md:col-span-2 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-8 text-white flex flex-col justify-center relative overflow-hidden group">
                            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-2">Sınırsız Varyasyon</h3>
                                <p className="text-indigo-100 mb-6 max-w-sm">Renk, beden, materyal... Ürünlerinizin tüm seçeneklerini detaylıca listeleyin.</p>
                                <div className="flex gap-2">
                                    <span className="w-6 h-6 rounded-full bg-red-500 border-2 border-white/20"></span>
                                    <span className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white/20"></span>
                                    <span className="w-6 h-6 rounded-full bg-green-500 border-2 border-white/20"></span>
                                    <span className="w-6 h-6 rounded-full bg-yellow-500 border-2 border-white/20"></span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex flex-col justify-between hover:bg-slate-100 transition-colors">
                            <Zap className="w-8 h-8 text-amber-500" />
                            <div>
                                <h3 className="font-bold mb-1">Hızlı Kurulum</h3>
                                <p className="text-sm text-slate-500">5 dakikada yayındasınız.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="text-center mt-32">
                    <h2 className="text-3xl font-bold mb-6">Denemeye Hazır mısınız?</h2>
                    <Link href="/auth?tab=signup">
                        <Button size="lg" className="h-16 px-12 rounded-full text-lg bg-slate-900 text-white hover:bg-indigo-600 transition-colors shadow-2xl shadow-indigo-900/20">
                            Ücretsiz Hesabınızı Oluşturun
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                    <p className="mt-4 text-slate-400 text-sm">Kredi kartı gerekmez • 14 gün ücretsiz deneme</p>
                </div>

            </main>

            <PublicFooter />
        </div>
    )
}
