"use client"

import React, { useState } from "react"
import Link from "next/link"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import {
    Search,
    MessageCircle,
    Settings,
    ShieldCheck,
    Package,
    ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const categories = [
    { id: "general", label: "Genel BakÄ±ÅŸ", icon: ShieldCheck },
    { id: "products", label: "ÃœrÃ¼nler & Katalog", icon: Package },
    { id: "sharing", label: "PaylaÅŸÄ±m & EriÅŸim", icon: MessageCircle },
    { id: "account", label: "Ãœyelik & Fatura", icon: Settings },
]

const faqData: Record<string, { q: string, a: string }[]> = {
    general: [
        {
            q: "FogCatalog tam olarak nedir ve iÅŸletmeme nasÄ±l deÄŸer katar?",
            a: "FogCatalog, klasik PDF kataloglarÄ±n hantallÄ±ÄŸÄ±nÄ± ortadan kaldÄ±ran yeni nesil bir SaaS Ã§Ã¶zÃ¼mÃ¼dÃ¼r. ÃœrÃ¼nlerinizi saniyeler iÃ§inde dijital, gÃ¼ncellenebilir ve etkileÅŸimli bir mikrositeye dÃ¶nÃ¼ÅŸtÃ¼rÃ¼r. MÃ¼ÅŸterileriniz Ã¼rÃ¼nleri incelerken sizinle kolayca iletiÅŸime geÃ§ebilir, bu da etkileÅŸimi artÄ±rÄ±r."
        },
        {
            q: "Ãœcretsiz planda herhangi bir sÃ¼re sÄ±nÄ±rÄ± var mÄ±?",
            a: "HayÄ±r, 'Starter' paketimiz tamamen Ã¼cretsizdir ve sonsuza kadar kullanabilirsiniz. Deneme sÃ¼resi bitince otomatik Ã¶deme alma gibi sÃ¼rprizler yoktur. Ä°ÅŸletmeniz bÃ¼yÃ¼dÃ¼ÄŸÃ¼nde dilediÄŸiniz zaman Ã¼st paketlere geÃ§iÅŸ yapabilirsiniz."
        },
        {
            q: "Mobil uygulama indirmem gerekiyor mu?",
            a: "HayÄ±r. FogCatalog %100 bulut tabanlÄ±dÄ±r (Web-based). BilgisayarÄ±nÄ±zdan, tabletinizden veya telefonunuzun tarayÄ±cÄ±sÄ±ndan panelinize eriÅŸip yÃ¶netim saÄŸlayabilirsiniz. MÃ¼ÅŸterileriniz de herhangi bir uygulama indirmeden kataloÄŸunuzu gÃ¶rÃ¼ntÃ¼leyebilir."
        },
        {
            q: "Birden fazla dil desteÄŸi var mÄ±?",
            a: "Åu an iÃ§in arayÃ¼zÃ¼mÃ¼z TÃ¼rkÃ§e ve Ä°ngilizce dillerini desteklemektedir. Ancak katalog iÃ§eriklerinizi (Ã¼rÃ¼n isimleri ve aÃ§Ä±klamalarÄ±) dilediÄŸiniz dilde girebilirsiniz."
        },
        {
            q: "ZiyaretÃ§i istatistiklerini gÃ¶rebilir miyim?",
            a: "Kesinlikle. 'Plus' ve Ã¼zeri paketlerimizde, kataloÄŸunuzun kaÃ§ kez gÃ¶rÃ¼ntÃ¼lendiÄŸini, en Ã§ok hangi Ã¼rÃ¼nlerin tÄ±klandÄ±ÄŸÄ±nÄ± detaylÄ± panelimizde gÃ¶rebilirsiniz."
        }
    ],
    products: [
        {
            q: "Toplu Ã¼rÃ¼n yÃ¼kleme yapabilir miyim?",
            a: "Evet! YÃ¼zlerce Ã¼rÃ¼n fotoÄŸrafÄ±nÄ± sÃ¼rÃ¼kle-bÄ±rak yÃ¶ntemiyle tek seferde yÃ¼kleyebilirsiniz. AkÄ±llÄ± sistemimiz, gÃ¶rsel isimlerinden Ã¼rÃ¼n adlarÄ±nÄ± otomatik olarak oluÅŸturmaya Ã§alÄ±ÅŸÄ±r, size sadece fiyatlarÄ± ve detaylarÄ± girmek kalÄ±r."
        },
        {
            q: "ÃœrÃ¼n resim kalitesi dÃ¼ÅŸer mi?",
            a: "HayÄ±r. Sistemimiz yÃ¼klediÄŸiniz yÃ¼ksek Ã§Ã¶zÃ¼nÃ¼rlÃ¼klÃ¼ gÃ¶rselleri akÄ±llÄ± sÄ±kÄ±ÅŸtÄ±rma algoritmalarÄ±yla optimize eder. BÃ¶ylece hem sayfanÄ±z milisaniyeler iÃ§inde aÃ§Ä±lÄ±r hem de Ã¼rÃ¼nleriniz cam gibi net gÃ¶rÃ¼nÃ¼r."
        },
        {
            q: "FiyatÄ± olmayan Ã¼rÃ¼n ekleyebilir miyim?",
            a: "Tabii ki. Dilerseniz bazÄ± Ã¼rÃ¼nlerin fiyatÄ±nÄ± gizleyebilir veya 'Fiyat Sorunuz' ÅŸeklinde gÃ¶sterebilirsiniz. Bu Ã¶zellik Ã¶zellikle B2B toptan satÄ±ÅŸ yapan firmalar veya proje bazlÄ± Ã§alÄ±ÅŸanlar iÃ§in idealdir."
        },
        {
            q: "OluÅŸturduÄŸum kataloÄŸun PDF Ã§Ä±ktÄ±sÄ±nÄ± alabilir miyim?",
            a: "Evet. Dijital kataloÄŸunuzu tek bir tÄ±klamayla A4 formatÄ±nda, baskÄ±ya hazÄ±r yÃ¼ksek Ã§Ã¶zÃ¼nÃ¼rlÃ¼klÃ¼ bir PDF dosyasÄ±na dÃ¶nÃ¼ÅŸtÃ¼rebilirsiniz. Hem dijital hem fiziksel pazarlama ihtiyacÄ±nÄ±zÄ± tek panelden Ã§Ã¶zersiniz."
        },
        // "Stok takibi" removed/simplified if not needed, but general "stokta var/yok" is usually fine. User didn't ask to remove it specifically aside from "WP sipariÅŸ" and "ek kullanÄ±cÄ±". I'll keep it unless it implies complex inventory.
        {
            q: "Stok durumu belirtebilir miyim?",
            a: "Evet, Ã¼rÃ¼nleriniz iÃ§in 'Stokta Var/Yok' veya 'TÃ¼kendi' etiketlerini kullanarak mÃ¼ÅŸterilerinizi bilgilendirebilirsiniz."
        },
        {
            q: "ÃœrÃ¼nlerimi Excel'e aktarabilir miyim?",
            a: "Evet, tÃ¼m Ã¼rÃ¼n listenizi, fiyatlarÄ± ve aÃ§Ä±klamalarÄ±yla birlikte istediÄŸiniz zaman Excel (CSV/XLS) formatÄ±nda dÄ±ÅŸa aktarabilirsiniz."
        }
    ],
    sharing: [
        // Removed WhatsApp Order Question
        {
            q: "QR kodum deÄŸiÅŸecek mi?",
            a: "HayÄ±r. Size Ã¶zel oluÅŸturulan QR kod 'Statik' deÄŸil 'Dinamik' bir yapÄ±dadÄ±r. Yani kataloÄŸunuzun iÃ§eriÄŸini, fiyatlarÄ±nÄ± veya resimlerini ne kadar deÄŸiÅŸtirirseniz deÄŸiÅŸtirin, QR kodunuz her zaman aynÄ± kalÄ±r ve gÃ¼ncel kataloÄŸunuza yÃ¶nlendirir."
        },
        {
            q: "KataloÄŸumu sosyal medyada paylaÅŸabilir miyim?",
            a: "Kesinlikle. Size verdiÄŸimiz katalog linkini (fogcatalog.com/firma-adiniz) Instagram biyografinize, Facebook gÃ¶nderilerinize veya LinkedIn profilinize ekleyebilirsiniz. Link Ã¶nizlemeleri profesyonel gÃ¶rÃ¼necek ÅŸekilde optimize edilmiÅŸtir."
        },
        {
            q: "KataloÄŸumu kimler gÃ¶rebilir?",
            a: "KataloÄŸunuz internet Ã¼zerinde eriÅŸilebilir bir web sayfasÄ± olarak yayÄ±nlanÄ±r. PaylaÅŸtÄ±ÄŸÄ±nÄ±z linke sahip olan veya QR kodunuzu okutan herkes kataloÄŸunuzu gÃ¶rÃ¼ntÃ¼leyebilir."
        },
        {
            q: "Tablet ve mobilde dÃ¼zgÃ¼n gÃ¶rÃ¼nÃ¼r mÃ¼?",
            a: "Evet. FogCatalog tÃ¼m cihazlar ve ekran boyutlarÄ± iÃ§in (responsive) Ã¶zel olarak optimize edilmiÅŸtir. MÃ¼ÅŸterileriniz telefon, tablet veya bilgisayardan sorunsuz bir deneyim yaÅŸar."
        }
    ],
    account: [
        {
            q: "AboneliÄŸimi nasÄ±l iptal ederim?",
            a: "KullanÄ±cÄ± panelinizdeki 'Ayarlar > Abonelik' sekmesinden tek tÄ±kla iptal iÅŸlemini gerÃ§ekleÅŸtirebilirsiniz. Herhangi bir taahhÃ¼t veya cayma bedeli yoktur."
        },
        {
            q: "Paket deÄŸiÅŸikliÄŸi yapabilir miyim?",
            a: "Evet, dilediÄŸiniz zaman paketinizi yÃ¼kseltebilir veya dÃ¼ÅŸÃ¼rebilirsiniz."
        },
        {
            q: "Fatura kesiyor musunuz?",
            a: "Evet. Ã–demeniz baÅŸarÄ±yla alÄ±ndÄ±ktan sonra, ÅŸirket bilgilerinizle oluÅŸturulan yasal e-faturanÄ±z sistemde kayÄ±tlÄ± e-posta adresinize otomatik olarak gÃ¶nderilir."
        },
        // Removed Extra User Question
        {
            q: "Teknik destek veriyor musunuz?",
            a: "TÃ¼m kullanÄ±cÄ±larÄ±mÄ±za e-posta desteÄŸi sunuyoruz. Pro kullanÄ±cÄ±larÄ±mÄ±z ise Ã¶ncelikli destek hattÄ±mÄ±za eriÅŸebilirler."
        }
    ]
}

export default function FAQPage() {
    const [activeCategory, setActiveCategory] = useState("general")
    const [openQuestion, setOpenQuestion] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")

    const toggleQuestion = (id: string) => {
        setOpenQuestion(openQuestion === id ? null : id)
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-violet-100">
            <PublicHeader />

            <main className="pt-24 pb-24">
                {/* HERO SECTION */}
                <section className="relative pt-16 pb-20 px-6 text-center overflow-hidden">
                    {/* Background decoration */}
                    <div className={cn(
                        "absolute top-0 left-1/2 -translate-x-1/2 w-full",
                        "max-w-7xl h-[600px] bg-gradient-to-b",
                        "from-indigo-50 via-white to-transparent",
                        "-z-10 rounded-full blur-3xl opacity-70"
                    )} />

                    <div className="max-w-3xl mx-auto relative z-10">
                        <div className={cn(
                            "inline-flex items-center gap-2 px-4 py-1.5 rounded-full",
                            "bg-white shadow-sm border border-slate-200",
                            "text-slate-600 text-sm font-medium mb-8"
                        )}>
                            <span className="flex h-2 w-2 rounded-full bg-indigo-500"></span>
                            YardÄ±m Merkezi & Destek
                        </div>

                        <h1 className={cn(
                            "text-4xl md:text-5xl lg:text-6xl font-black",
                            "text-slate-900 mb-6 tracking-tight"
                        )}>
                            NasÄ±l yardÄ±mcÄ± olabiliriz?
                        </h1>

                        <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                            AklÄ±nÄ±za takÄ±lan sorularÄ±n cevaplarÄ±nÄ± burada bulabilirsiniz.
                            Hala yardÄ±ma ihtiyacÄ±nÄ±z varsa bizimle iletiÅŸime geÃ§in.
                        </p>

                        <div className="relative max-w-xl mx-auto group">
                            <div className={cn(
                                "absolute inset-y-0 left-0 pl-4",
                                "flex items-center pointer-events-none",
                                "text-slate-400 group-focus-within:text-indigo-500",
                                "transition-colors"
                            )}>
                                <Search className="h-5 w-5" />
                            </div>
                            <Input
                                type="text"
                                placeholder="Bir soru arayÄ±n..."
                                className={cn(
                                    "pl-12 h-14 rounded-2xl border-slate-200",
                                    "shadow-lg shadow-slate-200/50",
                                    "focus:ring-4 focus:ring-indigo-100",
                                    "focus:border-indigo-500 text-lg",
                                    "transition-all bg-white"
                                )}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                {/* CONTENT SECTION */}
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">

                        {/* SIDEBAR NAVIGATION */}
                        <div className="lg:col-span-4 lg:sticky lg:top-32 self-start space-y-8">
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2">
                                <nav className="space-y-1">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => {
                                                setActiveCategory(cat.id)
                                                setOpenQuestion(null)
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-3.5",
                                                "rounded-xl text-sm font-semibold",
                                                "transition-all duration-200",
                                                activeCategory === cat.id
                                                    ? cn(
                                                        "bg-indigo-50 text-indigo-700",
                                                        "shadow-sm ring-1 ring-indigo-100"
                                                    )
                                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            )}
                                        >
                                            <cat.icon className={cn(
                                                "w-5 h-5",
                                                activeCategory === cat.id
                                                    ? "text-indigo-600"
                                                    : "text-slate-400"
                                            )} />
                                            {cat.label}
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            {/* SUPPORT CARD - IMPROVED */}
                            <div className="bg-slate-900 rounded-3xl p-8 relative overflow-hidden text-white">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600 rounded-full blur-[80px] opacity-40" />
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-600 rounded-full blur-[60px] opacity-30" />

                                <div className="relative z-10 flex flex-col items-start">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md",
                                        "flex items-center justify-center mb-6",
                                        "border border-white/10"
                                    )}>
                                        <MessageCircle className="w-6 h-6 text-white" />
                                    </div>

                                    <h3 className="text-xl font-bold mb-2">Hala sorunuz mu var?</h3>
                                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                        AradÄ±ÄŸÄ±nÄ±z cevabÄ± bulamadÄ±ysanÄ±z destek ekibimizle iletiÅŸime geÃ§ebilirsiniz.
                                    </p>

                                    <Button asChild className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold h-11 rounded-xl">
                                        <Link href="/contact">Bize UlaÅŸÄ±n</Link>
                                    </Button>

                                    <div className="mt-6 flex items-center gap-2 text-xs font-medium text-slate-500">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span>Ortalama yanÄ±t sÃ¼resi: &lt; 2 saat</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MAIN ACCORDION */}
                        <div className="lg:col-span-8 min-h-[500px]">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                    {categories.find(c => c.id === activeCategory)?.label}
                                    <span className="text-base font-normal text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                                        {faqData[activeCategory]?.length} Soru
                                    </span>
                                </h2>
                            </div>

                            <div className="space-y-4">
                                {faqData[activeCategory]?.map((item, index) => {
                                    const id = `${activeCategory}-${index}`
                                    const isOpen = openQuestion === id

                                    // Search filter
                                    if (searchTerm && !item.q.toLowerCase().includes(searchTerm.toLowerCase()) && !item.a.toLowerCase().includes(searchTerm.toLowerCase())) {
                                        return null
                                    }

                                    return (
                                        <div
                                            key={id}
                                            className={cn(
                                                "group rounded-2xl bg-white transition-all duration-300 border",
                                                isOpen
                                                    ? cn(
                                                        "border-indigo-200 shadow-xl",
                                                        "shadow-indigo-100/50 ring-1 ring-indigo-50"
                                                    )
                                                    : cn(
                                                        "border-slate-100 hover:border-indigo-100",
                                                        "hover:shadow-md hover:shadow-slate-200/50"
                                                    )
                                            )}
                                        >
                                            <button
                                                onClick={() => toggleQuestion(id)}
                                                className="w-full flex items-start justify-between p-6 text-left gap-4"
                                            >
                                                <span className={cn(
                                                    "font-semibold text-lg transition-colors leading-relaxed",
                                                    isOpen ? "text-indigo-900" : "text-slate-700 group-hover:text-slate-900"
                                                )}>
                                                    {item.q}
                                                </span>
                                                <span className={cn(
                                                    "flex-shrink-0 w-8 h-8 rounded-full",
                                                    "flex items-center justify-center",
                                                    "transition-all duration-300 bg-slate-50",
                                                    isOpen
                                                        ? "bg-indigo-100 text-indigo-600 rotate-180"
                                                        : cn(
                                                            "text-slate-400 group-hover:bg-indigo-50",
                                                            "group-hover:text-indigo-500"
                                                        )
                                                )}>
                                                    <ChevronDown className="w-5 h-5" />
                                                </span>
                                            </button>

                                            <div
                                                className={cn(
                                                    "grid transition-all duration-300 ease-in-out",
                                                    isOpen ? "grid-rows-[1fr] opacity-100 pb-6" : "grid-rows-[0fr] opacity-0"
                                                )}
                                            >
                                                <div className="overflow-hidden px-6">
                                                    <div className={cn(
                                                        "pt-2 border-t border-indigo-50/50",
                                                        "text-slate-600 leading-relaxed font-medium"
                                                    )}>
                                                        {item.a}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    )
}
