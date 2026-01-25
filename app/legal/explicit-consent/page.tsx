import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { Mail, MessageSquare, Phone, Bell, ShieldCheck, ArrowRight } from "lucide-react"

export const metadata = {
    title: "Ticari Elektronik İleti Onay Metni | FogCatalog",
    description: "FogCatalog pazarlama iletişimi ve ticari elektronik ileti onay metni.",
}

export default function ExplicitConsentPage() {
    return (
        <div className="min-h-screen bg-white selection:bg-indigo-100">
            <PublicHeader />

            <main className="pt-40 pb-32 px-4">
                <div className="max-w-5xl mx-auto">
                    {/* Catalog Header Style */}
                    <div className="relative mb-20">
                        <div className="absolute -top-10 left-0 text-[120px] font-black text-slate-50 select-none leading-none -z-10">ETK</div>
                        <div className="inline-block px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold tracking-[0.3em] uppercase mb-6">
                            Legal Document
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-950 mb-6 uppercase">
                            Ticari Elektronik <br />
                            İleti Onay Metni
                        </h1>
                        <p className="text-slate-500 text-xl font-light max-w-2xl border-l-2 border-indigo-600 pl-6">
                            İşbu metin, FogCatalog markası altında sunulan hizmetlere ilişkin pazarlama iletişimi izinlerini düzenler.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-12 items-start">
                        {/* Main Text Content */}
                        <div className="lg:col-span-7 space-y-12">
                            <section className="relative">
                                <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-4">01. Kapsam ve İzin</h3>
                                <p className="text-lg text-slate-700 leading-relaxed font-medium">
                                    Hukuki ünvanı <span className="text-slate-950 font-bold">Burcu Aldığ</span> olan (işbu metinde "FogCatalog" veya "Şirket" olarak anılacaktır) işletme tarafından; tarafıma kampanya, yeni özellik tanıtımları, promosyon, davet, indirim, kutlama ve benzeri pazarlama faaliyetleri kapsamında ticari elektronik ileti gönderilmesine,
                                </p>
                            </section>

                            {/* visual channels grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { icon: <Mail className="w-5 h-5" />, label: "E-Posta" },
                                    { icon: <MessageSquare className="w-5 h-5" />, label: "SMS" },
                                    { icon: <Phone className="w-5 h-5" />, label: "Telefon" },
                                    { icon: <Bell className="w-5 h-5" />, label: "Push" }
                                ].map((channel, i) => (
                                    <div key={i} className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col items-center justify-center gap-3 group hover:bg-white hover:border-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-500/5">
                                        <div className="text-slate-400 group-hover:text-indigo-600 transition-colors">
                                            {channel.icon}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 transition-colors">
                                            {channel.label}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <section className="relative">
                                <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-4">02. Veri İşleme ve Paylaşım</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    İletişim bilgilerimin (ad, soyad, telefon, e-posta), bu faaliyetlerin yürütülebilmesi amacıyla FogCatalog tarafından işlenmesine ve sadece bu amaçla sınırlı olmak üzere; İleti Yönetim Sistemi (İYS) entegratörleri ve SMS/E-posta gönderim hizmeti sağlayan yetkili tedarikçiler ile paylaşılmasına,
                                </p>
                            </section>

                            <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-6">
                                <div className="p-4 bg-indigo-600 text-white rounded-full flex-shrink-0">
                                    <ShieldCheck className="w-8 h-8" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-900 mb-1 italic uppercase tracking-tighter underline decoration-indigo-500 decoration-4 underline-offset-4">
                                        AÇIK RIZA GÖSTERİYORUM
                                    </h4>
                                    <p className="text-sm text-slate-400">Onayınız dilediğiniz zaman geri çekilebilir.</p>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Info - Catalog Side Info Style */}
                        <div className="lg:col-span-5">
                            <div className="bg-slate-950 text-white p-10 rounded-[2.5rem] relative overflow-hidden shadow-2xl shadow-indigo-200">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/30 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-8">Bilgilendirme</h4>

                                <ul className="space-y-8 relative z-10">
                                    <li className="flex gap-4">
                                        <div className="h-6 w-6 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                                        <p className="text-sm text-slate-300 leading-relaxed">
                                            Dilediğiniz zaman hiçbir gerekçe göstermeksizin ticari ileti almayı durdurabilirsiniz.
                                        </p>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="h-6 w-6 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                                        <p className="text-sm text-slate-300 leading-relaxed">
                                            Red talebiniz Şirket'e ulaştığı tarihten itibaren 3 iş günü içinde SMS/E-posta gönderimi durdurulur.
                                        </p>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="h-6 w-6 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
                                        <p className="text-sm text-slate-300 leading-relaxed">
                                            İptal işlemi için gelen mesajlardaki red linkini kullanabilir veya doğrudan <a href="mailto:info@fogcatalog.com" className="text-white font-bold underline decoration-indigo-500">info@fogcatalog.com</a> adresine yazabilirsiniz.
                                        </p>
                                    </li>
                                </ul>

                                <div className="mt-12 pt-8 border-t border-white/10">
                                    <div className="flex items-center justify-between group cursor-pointer">
                                        <span className="text-xs font-bold tracking-widest uppercase">Geri Dön</span>
                                        <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-2 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    )
}
