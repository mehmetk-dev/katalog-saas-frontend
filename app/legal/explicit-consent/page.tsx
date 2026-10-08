import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { Mail, MessageSquare, Phone, Bell, ShieldCheck } from "lucide-react"
import { FOGCATALOG_COMPANY } from "@/lib/legal/fogcatalog-company"

export const metadata = {
    title: "Ticari Elektronik İleti Onay Metni | FogCatalog",
    description: "FogCatalog pazarlama iletişimi ve ticari elektronik ileti onay metni.",
}

export default function ExplicitConsentPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <PublicHeader />

            <main className="flex-1 pt-32 pb-20 px-4 md:px-6">
                <div className="max-w-[794px] mx-auto bg-card shadow-2xl min-h-[1123px] relative flex flex-col transform transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]">

                    {/* Header */}
                    <div className="h-[80px] px-8 md:px-12 border-b border-border flex items-center justify-between shrink-0 bg-card">
                        <div className="text-[10px] tracking-[0.4em] text-muted-foreground uppercase font-medium">
                            FOGCATALOG
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground/60">
                            REF: LEG-EC-2026/V1
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 px-8 md:px-12 py-12 md:py-16">

                        {/* Title */}
                        <div className="text-center mb-16">
                            <h1 className="text-xl md:text-2xl font-light tracking-[0.3em] text-foreground uppercase mb-6 leading-relaxed">
                                TİCARİ ELEKTRONİK <br /> İLETİ ONAY METNİ
                            </h1>
                            <div className="w-12 h-[1px] bg-black mx-auto mb-6"></div>
                            <p className="text-[10px] tracking-widest text-muted-foreground uppercase">
                                YÜRÜRLÜK TARİHİ: 25.01.2026
                            </p>
                        </div>

                        {/* Text */}
                        <div className="space-y-12 text-foreground text-[13px] leading-relaxed font-light text-justify">

                            <p className="text-muted-foreground mb-6">
                                İşbu metin, FogCatalog markası altında sunulan hizmetlere
                                ilişkin pazarlama iletişimi izinlerini düzenler.
                            </p>

                            {/* Summary */}
                            <div className="bg-muted border border-border rounded-xl p-7 not-italic font-normal text-left">
                                <p className="text-sm text-foreground leading-relaxed">
                                    <span className="font-bold text-foreground">Özet: </span>
                                    Bu onay, size kampanya, yeni özellik ve promosyon bildirimleri göndermemize izin verir.
                                    İstediğiniz zaman hiçbir gerekçe göstermeden iptal edebilirsiniz.
                                </p>
                            </div>

                            {/* 1. Kapsam ve İzin */}
                            <section>
                                <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-3 text-foreground">
                                    <span className="w-4 h-[1px] bg-black"></span>
                                    01. Kapsam ve İzin
                                </h2>
                                <p className="text-muted-foreground pl-7">
                                    Hukuki ünvanı <strong>{FOGCATALOG_COMPANY.legalName}</strong> olan (işbu metinde &quot;FogCatalog&quot; veya &quot;Şirket&quot;
                                    olarak anılacaktır) işletme tarafından; tarafıma kampanya,
                                    yeni özellik tanıtımları, promosyon, davet, indirim, kutlama
                                    ve benzeri pazarlama faaliyetleri kapsamında ticari elektronik
                                    ileti gönderilmesine;
                                </p>
                            </section>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pl-7">
                                {[
                                    { icon: <Mail className="w-4 h-4" />, label: "E-Posta" },
                                    { icon: <MessageSquare className="w-4 h-4" />, label: "SMS" },
                                    { icon: <Phone className="w-4 h-4" />, label: "Telefon" },
                                    { icon: <Bell className="w-4 h-4" />, label: "Push" }
                                ].map((channel, i) => (
                                    <div key={i} className="flex flex-col items-center justify-center gap-3 bg-card border border-border p-6 text-center">
                                        <div className="text-muted-foreground">{channel.icon}</div>
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{channel.label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* 2. Veri İşleme ve Paylaşım */}
                            <section>
                                <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-3 text-foreground">
                                    <span className="w-4 h-[1px] bg-black"></span>
                                    02. Veri İşleme ve Paylaşım
                                </h2>
                                <p className="text-muted-foreground pl-7">
                                    İletişim bilgilerimin (ad, soyad, telefon, e-posta),
                                    bu faaliyetlerin yürütülebilmesi amacıyla FogCatalog
                                    tarafından işlenmesine ve sadece bu amaçla sınırlı olmak
                                    üzere; İleti Yönetim Sistemi (İYS) entegratörleri ve
                                    SMS/E-posta gönderim hizmeti sağlayan yetkili tedarikçiler
                                    ile paylaşılmasına;
                                </p>
                            </section>

                            {/* Açık Rıza Onayı */}
                            <div className="pl-7">
                                <div className="border border-border bg-muted/50 p-6 flex flex-col sm:flex-row items-center gap-6">
                                    <div className="p-3 bg-card border border-border rounded-full flex-shrink-0">
                                        <ShieldCheck className="w-6 h-6 text-foreground" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-foreground mb-1 uppercase tracking-widest underline decoration-2 underline-offset-4">
                                            AÇIK RIZA GÖSTERİYORUM
                                        </h4>
                                        <p className="text-xs text-muted-foreground">Onayınız dilediğiniz zaman geri çekilebilir.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Bilgilendirme */}
                            <section>
                                <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-3 text-foreground">
                                    <span className="w-4 h-[1px] bg-black"></span>
                                    Bilgilendirme
                                </h2>
                                <div className="pl-7 space-y-4 text-muted-foreground">
                                    <ul className="space-y-4">
                                        <li className="flex gap-4 items-start">
                                            <div className="text-[10px] font-bold mt-0.5">01</div>
                                            <p>Dilediğiniz zaman hiçbir gerekçe göstermeksizin ticari ileti almayı durdurabilirsiniz.</p>
                                        </li>
                                        <li className="flex gap-4 items-start">
                                            <div className="text-[10px] font-bold mt-0.5">02</div>
                                            <p>Red talebiniz Şirket'e ulaştığı tarihten itibaren 3 iş günü içinde SMS/E-posta gönderimi durdurulur.</p>
                                        </li>
                                        <li className="flex gap-4 items-start">
                                            <div className="text-[10px] font-bold mt-0.5">03</div>
                                            <p>
                                                İptal işlemi için gelen mesajlardaki red linkini
                                                kullanabilir veya doğrudan <strong className="text-foreground">{FOGCATALOG_COMPANY.email}</strong> adresine yazabilirsiniz.
                                            </p>
                                        </li>
                                    </ul>
                                </div>
                            </section>

                        </div>
                    </div>

                    {/* Footer */}
                    <div className="h-[48px] border-t border-border flex items-center justify-center shrink-0 bg-card mt-auto">
                        <div className="flex items-center gap-8">
                            <div className="w-8 h-[1px] bg-muted" />
                            <span className="text-[9px] tracking-[0.5em] text-muted-foreground/60 uppercase">
                                SAYFA 01 / 01
                            </span>
                            <div className="w-8 h-[1px] bg-muted" />
                        </div>
                    </div>

                </div>
            </main>

            <PublicFooter />
        </div>
    )
}
