import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { LegalDocument } from "@/components/marketing"
import { Mail, MessageSquare, Phone, Bell, ShieldCheck } from "lucide-react"
import { FOGCATALOG_COMPANY } from "@/lib/legal/fogcatalog-company"

export const metadata = {
    title: "Ticari Elektronik İleti Onay Metni | FogCatalog",
    description: "FogCatalog pazarlama iletişimi ve ticari elektronik ileti onay metni.",
}

export default function ExplicitConsentPage() {
    return (
        <LegalDocument header={<PublicHeader />} footer={<PublicFooter />} title="Ticari Elektronik İleti Onay Metni" meta="Yürürlük tarihi: 25.01.2026">


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
                    <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
01. Kapsam ve İzin
                    </h2>
                    <p className="text-muted-foreground ">
                        Hukuki ünvanı <strong>{FOGCATALOG_COMPANY.legalName}</strong> olan (işbu metinde &quot;FogCatalog&quot; veya &quot;Şirket&quot;
                        olarak anılacaktır) işletme tarafından; tarafıma kampanya,
                        yeni özellik tanıtımları, promosyon, davet, indirim, kutlama
                        ve benzeri pazarlama faaliyetleri kapsamında ticari elektronik
                        ileti gönderilmesine;
                    </p>
                </section>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {[
                        { icon: <Mail className="w-4 h-4" />, label: "E-Posta" },
                        { icon: <MessageSquare className="w-4 h-4" />, label: "SMS" },
                        { icon: <Phone className="w-4 h-4" />, label: "Telefon" },
                        { icon: <Bell className="w-4 h-4" />, label: "Push" }
                    ].map((channel, i) => (
                        <div key={i} className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-6 text-center">
                            <div className="text-muted-foreground">{channel.icon}</div>
                            <span className="text-sm font-medium text-foreground">{channel.label}</span>
                        </div>
                    ))}
                </div>

                {/* 2. Veri İşleme ve Paylaşım */}
                <section>
                    <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
02. Veri İşleme ve Paylaşım
                    </h2>
                    <p className="text-muted-foreground ">
                        İletişim bilgilerimin (ad, soyad, telefon, e-posta),
                        bu faaliyetlerin yürütülebilmesi amacıyla FogCatalog
                        tarafından işlenmesine ve sadece bu amaçla sınırlı olmak
                        üzere; İleti Yönetim Sistemi (İYS) entegratörleri ve
                        SMS/E-posta gönderim hizmeti sağlayan yetkili tedarikçiler
                        ile paylaşılmasına;
                    </p>
                </section>

                {/* Açık Rıza Onayı */}
                <div >
                    <div className="flex flex-col items-center gap-6 rounded-xl border border-border bg-muted/50 p-6 sm:flex-row">
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
                    <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
Bilgilendirme
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                        <ul className="space-y-4">
                            <li className="flex gap-4 items-start">
                                <div className="min-w-6 font-semibold text-foreground tabular-nums">01</div>
                                <p>Dilediğiniz zaman hiçbir gerekçe göstermeksizin ticari ileti almayı durdurabilirsiniz.</p>
                            </li>
                            <li className="flex gap-4 items-start">
                                <div className="min-w-6 font-semibold text-foreground tabular-nums">02</div>
                                <p>Red talebiniz Şirket'e ulaştığı tarihten itibaren 3 iş günü içinde SMS/E-posta gönderimi durdurulur.</p>
                            </li>
                            <li className="flex gap-4 items-start">
                                <div className="min-w-6 font-semibold text-foreground tabular-nums">03</div>
                                <p>
                                    İptal işlemi için gelen mesajlardaki red linkini
                                    kullanabilir veya doğrudan <strong className="text-foreground">{FOGCATALOG_COMPANY.email}</strong> adresine yazabilirsiniz.
                                </p>
                            </li>
                        </ul>
                    </div>
                </section>
        </LegalDocument>
    )
}
