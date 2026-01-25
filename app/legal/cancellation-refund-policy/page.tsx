import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"

export const metadata = {
    title: "İptal ve İade Koşulları | FogCatalog",
    description: "FogCatalog abonelik iptali ve iade prosedürleri.",
}

export default function CancellationPolicyPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <PublicHeader />

            <main className="pt-32 pb-20">
                <div className="max-w-3xl mx-auto px-6">
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-3">İptal ve İade Koşulları</h1>
                    <p className="text-slate-500 mb-12">Yürürlük Tarihi: 25 Ocak 2026</p>

                    <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-10 space-y-8">
                        <section>
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">1. İade Politikası</h2>
                            <p className="text-slate-600 leading-relaxed mb-4">
                                FogCatalog bir dijital yazılım hizmeti (SaaS) sunmaktadır. Mesafeli Sözleşmeler Yönetmeliği gereği, <strong>"elektronik ortamda anında ifa edilen hizmetler"</strong> kapsamında olduğu için, satın alınan aboneliklerde ve paketlerde kural olarak <strong>para iadesi yapılmamaktadır.</strong>
                            </p>
                            <div className="bg-amber-50 text-amber-800 p-4 rounded-lg text-sm border border-amber-200">
                                <strong>Önemli Not:</strong> Kullanıcılarımızın mağdur olmaması için ücretsiz deneme süresi (Free Plan/Trial) sunmaktayız. Lütfen ücretli pakete geçmeden önce sistemi bu sürümle test ediniz.
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">2. Abonelik İptal Süreci</h2>
                            <p className="text-slate-600 leading-relaxed mb-4">
                                Aboneliğinizi dilediğiniz zaman, hiçbir taahhüt bedeli ödemeden iptal edebilirsiniz.
                            </p>
                            <ul className="space-y-3 text-slate-600">
                                <li className="flex gap-3">
                                    <span className="text-violet-500 font-bold">1.</span>
                                    <div>
                                        <strong>İptal İşlemi:</strong> Profil ayarlarınızdan "Aboneliği Yönet" sekmesine giderek "Paketi İptal Et" butonuna tıklamanız yeterlidir.
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-violet-500 font-bold">2.</span>
                                    <div>
                                        <strong>Kullanım Hakkı:</strong> İptal işlemi yapıldığında, o ayın (veya yılın) ödemesi peşin alındığı için, abonelik sürenizin sonuna kadar Premium özellikleri kullanmaya devam edersiniz.
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-violet-500 font-bold">3.</span>
                                    <div>
                                        <strong>Yenileme:</strong> Süre dolduğunda sistem otomatik çekimi durdurur ve hesabınız "Ücretsiz Paket"e düşürülür. Verileriniz silinmez ancak limitler ücretsiz paket seviyesine iner.
                                    </div>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">3. İstisnai Durumlar</h2>
                            <p className="text-slate-600 leading-relaxed">
                                Teknik kaynaklı, FogCatalog tarafından hizmetin hiç verilemediği veya sistemin 24 saatten uzun süre kapalı kaldığı durumlarda, talep üzerine ilgili döneme ait ücret iadesi değerlendirmeye alınabilir. Bu tür durumlarda <a href="mailto:destek@fogcatalog.com" className="text-violet-600 underline">destek@fogcatalog.com</a> üzerinden bizimle iletişime geçebilirsiniz.
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    )
}
