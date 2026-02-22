const legal = {
    tr: {
        legal: {
            cancellationPolicy: {
                title: "İptal ve İade Koşulları",
                ref: "REF: LEG-REF-2026/V1",
                warning: "ÖNEMLİ BİLGİLENDİRME",
                refundPolicy: {
                    title: "1. İADE POLİTİKASI",
                    desc:
                        "FogCatalog, kullanıcılara dijital bir yazılım hizmeti (SaaS) sunmaktadır. " +
                        "6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesi uyarınca " +
                        "hizmetimiz, 'Elektronik ortamda anında ifa edilen hizmetler' kapsamında yer almaktadır. " +
                        "Bu nedenle, satın alınan ücretli aboneliklerde (Aylık/Yıllık Pro Paketler) kural olarak " +
                        "para iadesi (cayma hakkı) bulunmamaktadır.",
                    importantInfo:
                        "Kullanıcılarımızın satın alma kararı vermeden önce sistemi tam anlamıyla " +
                        "deneyimleyebilmesi için, süre kısıtlaması olmayan 'Ücretsiz Paket' sunmaktayız. " +
                        "Her kullanıcı, hiçbir ücret ödemeden 1 Katalog ve 50 Ürün limitine kadar sistemi " +
                        "dilediği kadar kullanabilir ve tüm özelliklerini test edebilir. Ücretli pakete geçen " +
                        "kullanıcı, sistemi yeterince tecrübe ettiğini ve hizmeti beğendiğini kabul etmiş sayılır."
                },
                cancellationProcess: {
                    title: "2. ABONELİK İPTAL SÜRECİ",
                    desc: "Aboneliğinizi dilediğiniz zaman, hiçbir taahhüt bedeli veya cayma cezası ödemeden iptal edebilirsiniz.",
                    howTo: {
                        title: "Nasıl İptal Ederim?",
                        desc:
                            "Profil ayarlarınızdan 'Aboneliği Yönet' sekmesine giderek " +
                            "'Paketi İptal Et' butonuna tıklamanız yeterlidir."
                    },
                    rights: {
                        title: "Kullanım Hakkım Yanar mı?",
                        desc:
                            "Hayır. İptal işlemi yaptığınızda, o dönemin (ilgili ayın veya yılın) ödemesi " +
                            "peşin yapıldığı için, abonelik süreniz dolana kadar Premium özellikleri " +
                            "kullanmaya devam edersiniz."
                    },
                    expiry: {
                        title: "Süre Bitince Ne Olur?",
                        desc:
                            "Süre dolduğunda sistem otomatik ödeme çekmeyi durdurur ve hesabınız " +
                            "otomatik olarak 'Ücretsiz Paket' statüsüne düşürülür."
                    },
                    data: {
                        title: "Verilerim Silinir mi?",
                        desc:
                            "Hesabınız silinmez, ancak ücretsiz paket limitlerinin (1 Katalog / 50 Ürün) " +
                            "üzerinde kalan verileriniz pasife alınabilir veya düzenlemeye kapatılabilir."
                    }
                },
                exceptions: {
                    title: "3. İSTİSNAİ DURUMLAR",
                    desc:
                        "FogCatalog kaynaklı teknik bir sorun nedeniyle hizmetin hiç verilemediği veya " +
                        "sistemin 24 saatten uzun süre erişime kapalı kaldığı (uptime sorunu) durumlarda, " +
                        "talep üzerine ilgili döneme ait ücret iadesi değerlendirmeye alınabilir. Bu tür nadir " +
                        "durumlarda destek@fogcatalog.com üzerinden bizimle iletişime geçebilirsiniz."
                }
            },
            kvkk: {
                title: "KVKK Aydınlatma Metni",
                ref: "REF: LEG-KVK-2026/V1",
                controller: {
                    title: "1. Veri Sorumlusu Kimdir?",
                    desc:
                        "6698 sayılı Kişisel Verilerin Korunması Kanunu (\"KVKK\") uyarınca; Burcu Aldığ " +
                        "(bundan sonra \"FogCatalog\" veya \"Veri Sorumlusu\" olarak anılacaktır) olarak, " +
                        "kişisel verilerinizi aşağıda açıklanan amaçlar kapsamında işlemekteyiz."
                },
                processedData: {
                    title: "2. İşlenen Kişisel Verileriniz",
                    desc: "Sistemimize üye olmanız ve hizmetlerimizden faydalanmanız sırasında aşağıdaki verileriniz işlenmektedir:",
                    identity: {
                        label: "Kimlik Bilgileri",
                        items: "Ad, soyad."
                    },
                    contact: {
                        label: "İletişim Bilgileri",
                        items: "E-posta adresi, telefon numarası, fatura adresi."
                    },
                    transaction: {
                        label: "Müşteri İşlem Bilgileri",
                        items: "Sipariş geçmişi, paket/abonelik bilgileri, talep ve şikayet kayıtları."
                    },
                    security: {
                        label: "İşlem Güvenliği Bilgileri",
                        items: "IP adresi, internet sitesi giriş-çıkış log kayıtları, cihaz bilgileri."
                    }
                },
                purposes: {
                    title: "3. Kişisel Verilerin İşlenme Amaçları",
                    desc: "Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:",
                    items: [
                        "Üyelik işlemlerinin gerçekleştirilmesi, kullanıcı girişinin sağlanması.",
                        "SaaS hizmetinin (katalog oluşturma, yönetme) sunulabilmesi.",
                        "Faturalandırma süreçlerinin yönetilmesi ve ödeme tahsilatı.",
                        "Müşteri destek taleplerinin yanıtlanması.",
                        "5651 sayılı Kanun gereği trafik kayıtlarının (log) tutulması ve bilgi güvenliğinin sağlanması.",
                        "Yasal mevzuattan kaynaklanan yükümlülüklerin yerine getirilmesi."
                    ]
                },
                transfer: {
                    title: "4. Kişisel Verilerin Aktarılması",
                    desc:
                        "Kişisel verileriniz, aşağıdaki durum ve alıcı gruplarına " +
                        "aktarılabilir:",
                    items: [
                        {
                            label: "Yasal Zorunluluklar:",
                            text:
                                "Yetkili kamu kurum ve kuruluşları " +
                                "(Örn: Mahkemeler, BTK, Vergi Daireleri)."
                        },
                        {
                            label: "Hizmetin İfası:",
                            text:
                                "Ödemelerin alınabilmesi için anlaşmalı ödeme kuruluşları " +
                                "(Örn: Iyzico, Stripe) ve altyapı/sunucu hizmeti alınan " +
                                "teknoloji sağlayıcıları."
                        }
                    ]
                },
                collection: {
                    title: "5. Veri Toplama Yöntemi ve Hukuki Sebebi",
                    desc:
                        "Verileriniz, www.fogcatalog.com internet sitesi üzerinden üyelik formunun " +
                        "doldurulması, abonelik satın alınması ve sitenin kullanımı esnasında tamamen " +
                        "otomatik yollarla toplanmaktadır. Bu veri işleme faaliyeti KVKK Madde 5'te belirtilen;",
                    reasons: [
                        "\"Bir sözleşmenin kurulması veya ifası\" (Madde 5/2-c)",
                        "\"Veri sorumlusunun meşru menfaati\" (Madde 5/2-f)",
                        "\"Kanunlarda açıkça öngörülmesi\" (Madde 5/2-a - Log tutma zorunluluğu için)"
                    ],
                    footer: "hukuki sebeplerine dayanmaktadır."
                },
                rights: {
                    title: "6. Haklarınız (KVKK Madde 11)",
                    desc:
                        "Veri sahibi olarak, FogCatalog'a başvurarak; verilerinizin işlenip " +
                        "işlenmediğini öğrenme, yanlış işlenmişse düzeltilmesini isteme, verilerin " +
                        "silinmesini veya yok edilmesini talep etme haklarına sahipsiniz.",
                    contact:
                        "Bu haklarınızı kullanmak için taleplerinizi, kvkk@fogcatalog.com " +
                        "e-posta adresine veya şirket adresimize yazılı olarak iletebilirsiniz."
                },
                ui: {
                    badge: "VERİ GİZLİLİK PROTOKOLÜ",
                    clarification: "AYDINLATMA METNİ",
                    updated: "GÜNCELLENME:",
                    contactTitle: "TALEP VE BAŞVURU"
                }
            },
            distanceSales: {
                title: "Mesafeli Satış Sözleşmesi",
                ref: "REF: LEG-DSA-2026/V1",
                effectiveDateLabel: "Yürürlük Tarihi:",
                effectiveDate: "25.01.2026",
                parties: {
                    title: "1. Taraflar",
                    seller: {
                        title: "1.1. SATICI (Hizmet Sağlayıcı)",
                        nameLabel: "Ünvan",
                        name: "Burcu Aldığ",
                        taxOfficeLabel: "Vergi D.",
                        taxOffice: "Nilüfer V.D. / 0510559196",
                        emailLabel: "Email",
                        email: "info@fogcatalog.com",
                        phoneLabel: "Tel",
                        phone: "+90 545 395 42 03",
                        address: "23 Nisan Mah. 241. Sk. No: 8 İç Kapı No: 42<br />Nilüfer / BURSA / TURKIYE"
                    },
                    buyer: {
                        title: "1.2. ALICI (Müşteri)",
                        scope: "KAPSAM",
                        desc:
                            "Hizmeti satın alan, Platform'a üye olurken bildirdiği ad-soyad " +
                            "ve fatura bilgileri esas alınan gerçek veya tüzel kişidir."
                    }
                },
                subject: {
                    title: "2. Sözleşmenin Konusu",
                    desc:
                        "İşbu Sözleşme'nin konusu, Alıcı'nın FogCatalog'a ait Platform üzerinden " +
                        "elektronik ortamda siparişini verdiği, aşağıda nitelikleri ve satış fiyatı " +
                        "belirtilen 'Dijital Katalog ve Ürün Yönetim Yazılımı' (SaaS) hizmetinin " +
                        "satışı, ifası ve kullanımı ile ilgili olarak 6502 sayılı Tüketicinin Korunması " +
                        "Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince " +
                        "tarafların hak ve yükümlülüklerinin belirlenmesidir."
                },
                service: {
                    title: "3. Hizmet ve Ödeme Bilgileri",
                    item1: {
                        label: "3.1. HİZMETİN TANIMI",
                        desc:
                            "FogCatalog, kullanıcıların dijital ortamda ürün katalogları " +
                            "oluşturmasını, yönetmesini ve paylaşmasını sağlayan bulut " +
                            "tabanlı bir yazılım hizmetidir."
                    },
                    item2: {
                        label: "3.2. SÜRE VE YENİLEME",
                        desc:
                            "Hizmet, Alıcı'nın seçtiği periyot (Aylık/Yıllık) boyunca sunulur. " +
                            "Alıcı iptal etmediği sürece, süre bitiminde güncel fiyat üzerinden " +
                            "otomatik yenilenir."
                    },
                    item3: {
                        label: "3.3. TESLİMAT ŞEKLİ",
                        desc:
                            "Hizmet, 'Elektronik Ortamda Anında İfa' niteliğindedir. Ödeme onayı " +
                            "alındığı anda Alıcı'nın hesabına erişim yetkisi tanımlanır."
                    }
                },
                general: {
                    title: "4. Genel Hükümler",
                    item1:
                        "Alıcı, Platform üzerinde kendisine sunulan ön bilgilendirme formunu " +
                        "okuduğunu, hizmetin temel nitelikleri, satış fiyatı, ödeme şekli ve cayma " +
                        "hakkına ilişkin ön bilgileri edinip teyit ettiğini beyan eder.",
                    item2:
                        "FogCatalog, hizmetin 7/24 erişilebilir olması için gerekli teknik özeni " +
                        "gösterecektir. Ancak mücbir sebepler veya teknik bakım çalışmaları nedeniyle " +
                        "yaşanabilecek erişim sorunlarından sorumlu tutulamaz.",
                    item3:
                        "Alıcı, sisteme yüklediği her türlü içerikten bizzat sorumludur. FogCatalog, " +
                        "kullanıcılar tarafından oluşturulan katalogların içeriğinden ve telif hakkı " +
                        "ihlallerinden sorumlu değildir.",
                    item4:
                        "Alıcı, kullanıcı adı ve şifresinin güvenliğinden sorumludur. Üçüncü " +
                        "kişilerle paylaşılması veya yetkisiz kullanımı nedeniyle doğacak " +
                        "zararlardan FogCatalog sorumlu tutulamaz."
                },
                withdrawal: {
                    title: "5. Cayma Hakkı ve İade (ÖNEMLİ)",
                    item1Part1:
                        "İşbu sözleşme konusu hizmet; 27.11.2014 tarihli Mesafeli Sözleşmeler " +
                        "Yönetmeliği'nin 'Cayma Hakkının İstisnaları' başlıklı 15. maddesin " +
                        "(ğ) bendi uyarınca; ",
                    item1Strong: "\"Elektronik ortamda anında ifa edilen hizmetler\"",
                    item1Part2: " kapsamındadır.",
                    item2Part1: "Bu nedenle, Alıcı hizmeti satın aldıktan veya abonelik yenilendikten sonra ",
                    item2Badge: "CAYMA HAKKINI KULLANAMAZ VE ÜCRET İADESİ TALEP EDEMEZ.",
                    item2Part2:
                        " Alıcı, işbu sözleşmeyi onaylayarak cayma hakkının " +
                        "bulunmadığını peşinen kabul eder.",
                    item3Label: "İptal Prosedürü:",
                    item3Desc: " Alıcı, dilediği zaman panel üzerinden aboneliğini iptal edebilir. İptal durumunda:",
                    list1: "Mevcut ödenmiş dönemin sonuna kadar hizmet kullanımı devam eder.",
                    list2: "Bir sonraki dönem için ücret tahsil edilmez.",
                    list3: "Geçmişe dönük iade yapılmaz."
                },
                privacy: {
                    title: "6. Gizlilik ve KVKK",
                    desc:
                        "Alıcı'ya ait kişisel veriler, 6698 sayılı KVKK ve FogCatalog Gizlilik " +
                        "Politikası kapsamında; hizmetin ifası, faturalandırma ve yasal yükümlülüklerin " +
                        "yerine getirilmesi amacıyla işlenir. Detaylı bilgi Platform üzerindeki " +
                        "'KVKK Aydınlatma Metni'nde yer almaktadır."
                },
                jurisdiction: {
                    title: "7. Yetkili Mahkeme",
                    desc:
                        "İşbu sözleşmeden doğan uyuşmazlıklarda, T.C. Ticaret Bakanlığı " +
                        "parasal sınırları dahilinde Tüketici Hakem Heyetleri, aşan durumlarda ise:",
                    court: "BURSA TÜKETİCİ MAHKEMELERİ",
                    office: "VE İCRA DAİRELERİ"
                },
                enforcement: {
                    title: "8. Yürürlük",
                    desc:
                        "Alıcı, Platform üzerinden verdiği siparişe ait ödemeyi gerçekleştirdiğinde " +
                        "işbu sözleşmenin tüm şartlarını kabul etmiş sayılır."
                },
                footer: {
                    page: "SAYFA 01 / 01"
                }
            },
            cookiePolicy: {
                title: "Çerez (Cookie) Politikası",
                lastUpdated: "Son Güncelleme: 25 Ocak 2026",
                intro:
                    "FogCatalog (Hukuki Ünvan: Burcu Aldığ) olarak, web sitemizden en verimli " +
                    "şekilde faydalanabilmeniz ve kullanıcı deneyiminizi geliştirmek için Çerezler " +
                    "(Cookies) kullanıyoruz. İşbu politika, 6698 sayılı KVKK kapsamındaki Aydınlatma " +
                    "Metnimizin ayrılmaz bir parçasıdır.",
                whatIsCookie: {
                    title: "1. Çerez Nedir?",
                    desc:
                        "Çerezler, ziyaret ettiğiniz web siteleri tarafından tarayıcınız aracılığıyla " +
                        "bilgisayarınıza veya mobil cihazınıza kaydedilen küçük metin dosyalarıdır. " +
                        "Bu dosyalar sayesinde site, tercihlerinizi (örn: oturum durumu, dil seçimi) " +
                        "hatırlar ve bir sonraki ziyaretinizde sizi tanır."
                },
                types: {
                    title: "2. Kullandığımız Çerez Türleri",
                    mandatory: {
                        label: "Zorunlu Çerezler",
                        desc:
                            "Sitenin düzgün çalışması, üyelik hesabınıza giriş yapabilmeniz " +
                            "ve güvenliğiniz (CSRF koruması vb.) için teknik olarak zorunludur. " +
                            "Bu çerezler pazarlama amacıyla kullanılmaz ve sistemlerimizden kapatılamaz."
                    },
                    analytic: {
                        label: "Analitik Çerezler",
                        desc:
                            "Sitemizi kaç kişinin ziyaret ettiği, en çok hangi sayfaların " +
                            "gezildiği gibi anonim verileri toplayarak performansımızı ölçmemize " +
                            "ve sitemizi iyileştirmemize yardımcı olur (Örn: Google Analytics)."
                    },
                    functional: {
                        label: "İşlevsel Çerezler",
                        desc:
                            "Dil seçimi veya 'Beni Hatırla' gibi tercihlerinizi kaydederek " +
                            "size daha kişiselleştirilmiş bir deneyim sunmamızı sağlar."
                    }
                },
                management: {
                    title: "3. Çerezleri Nasıl Yönetebilirsiniz?",
                    desc:
                        "Tarayıcınızın ayarlarını kullanarak çerezleri dilediğiniz zaman " +
                        "silebilir veya engelleyebilirsiniz. Ancak, zorunlu çerezleri sildiğinizde " +
                        "sitenin 'Giriş Yap' ve 'Katalog Düzenle' gibi temel fonksiyonlarının " +
                        "çalışmayabileceğini hatırlatmak isteriz.",
                    instruction: "Tarayıcı ayarlarınızı şu menülerden değiştirebilirsiniz:",
                    browsers: [
                        { name: "Google Chrome", path: "Ayarlar > Gizlilik ve Güvenlik > Çerezler" },
                        { name: "Mozilla Firefox", path: "Seçenekler > Gizlilik ve Güvenlik > Çerezler" },
                        { name: "Safari", path: "Tercihler > Gizlilik" },
                        { name: "Microsoft Edge", path: "Ayarlar > Çerezler ve Site İzinleri" }
                    ]
                },
                contact: {
                    title: "4. İletişim",
                    desc:
                        "Çerez politikamızla ilgili her türlü soru ve görüşünüzü " +
                        "info@fogcatalog.com adresine iletebilirsiniz."
                },
                ui: {
                    policy: "POLİTİKASI",
                    userFocused: "Kullanıcı Odaklı",
                    securityDesc:
                        "Gizliliğinizi ve veri güvenliğinizi her şeyin üzerinde tutuyoruz.",
                    definition: "Tanım",
                    catalog: "KATALOG",
                    controls: "KONTROLLER",
                    inquiries: "SORU VE GÖRÜŞ"
                }
            }
        },
    },
    en: {
        legal: {
            cancellationPolicy: {
                title: "Cancellation & Refund Policy",
                ref: "REF: LEG-REF-2026/V1",
                warning: "IMPORTANT INFORMATION",
                refundPolicy: {
                    title: "1. REFUND POLICY",
                    desc:
                        "FogCatalog provides a digital software service (SaaS) to users. " +
                        "Pursuant to Article 15 of Law No. 6502 and the Distance Contracts " +
                        "Regulation, our service falls under the scope of 'Services performed " +
                        "instantly in electronic environment'. Therefore, there is generally no " +
                        "refund (right of withdrawal) for purchased paid subscriptions " +
                        "(Monthly/Yearly Pro Packages).",
                    importantInfo:
                        "To ensure our users can fully experience the system before making a " +
                        "purchasing decision, we offer a duration-unlimited 'Free Package'. " +
                        "Every user can use the system as much as they wish up to 1 Catalog " +
                        "and 50 Products limit without paying any fee and test all features. " +
                        "A user who upgrades to a paid package is deemed to have sufficiently " +
                        "experienced the system and approved the service."
                },
                cancellationProcess: {
                    title: "2. SUBSCRIPTION CANCELLATION PROCESS",
                    desc: "You can cancel your subscription at any time without paying any commitment fee or withdrawal penalty.",
                    howTo: {
                        title: "How Do I Cancel?",
                        desc:
                            "Simply go to the 'Manage Subscription' tab in your profile " +
                            "settings and click the 'Cancel Package' button."
                    },
                    rights: {
                        title: "Do I Lose My Usage Rights?",
                        desc:
                            "No. When you cancel, since the payment for that period " +
                            "(relevant month or year) is made in advance, you continue " +
                            "to use Premium features until your subscription period expires."
                    },
                    expiry: {
                        title: "What Happens When Time Expires?",
                        desc:
                            "When the period expires, the system stops automatic payment " +
                            "withdrawals and your account is automatically downgraded " +
                            "to 'Free Package' status."
                    },
                    data: {
                        title: "Will My Data Be Deleted?",
                        desc:
                            "Your account is not deleted, but data exceeding the free " +
                            "package limits (1 Catalog / 50 Products) may be passivated " +
                            "or closed for editing."
                    }
                },
                exceptions: {
                    title: "3. EXCEPTIONAL CIRCUMSTANCES",
                    desc:
                        "In cases where the service cannot be provided at all due to a " +
                        "technical problem caused by FogCatalog or the system remains " +
                        "inaccessible for more than 24 hours (uptime issue), a refund for " +
                        "the relevant period may be evaluated upon request. In such rare " +
                        "cases, you can contact us via support@fogcatalog.com."
                }
            },
            kvkk: {
                title: "KVKK Clarification Text",
                ref: "REF: LEG-KVK-2026/V1",
                controller: {
                    title: "1. Who is the Data Controller?",
                    desc:
                        "Pursuant to the Law on Protection of Personal Data No. 6698 " +
                        "(\"KVKK\"); As Burcu Aldig (hereinafter referred to as \"FogCatalog\" " +
                        "or \"Data Controller\"), we process your personal data within the " +
                        "scope of the purposes explained below."
                },
                processedData: {
                    title: "2. Processed Personal Data",
                    desc: "Your following data is processed during your membership to our system and use of our services:",
                    identity: {
                        label: "Identity Information",
                        items: "Name, surname."
                    },
                    contact: {
                        label: "Contact Information",
                        items: "Email address, phone number, billing address."
                    },
                    transaction: {
                        label: "Customer Transaction Information",
                        items: "Order history, package/subscription information, request and complaint records."
                    },
                    security: {
                        label: "Transaction Security Information",
                        items: "IP address, website login/logout log records, device information."
                    }
                },
                purposes: {
                    title: "3. Purposes of Processing Personal Data",
                    desc: "Your personal data is processed for the following purposes:",
                    items: [
                        "Performing membership transactions, ensuring user login.",
                        "Providing SaaS service (creating, managing catalogs).",
                        "Managing billing processes and payment collection.",
                        "Responding to customer support requests.",
                        "Keeping traffic records (logs) pursuant to Law No. 5651 and ensuring information security.",
                        "Fulfilling obligations arising from legal legislation."
                    ]
                },
                transfer: {
                    title: "4. Transfer of Personal Data",
                    desc:
                        "Your personal data may be transferred to the following recipient " +
                        "groups and situations only without seeking your explicit consent:",
                    items: [
                        {
                            label: "Legal Obligations:",
                            text: "Authorized public institutions and organizations (e.g. Courts, BTK, Tax Offices)."
                        },
                        {
                            label: "Performance of Service:",
                            text:
                                "Contracted payment institutions (e.g. Iyzico, Stripe) and " +
                                "technology providers from whom infrastructure/server service " +
                                "is received to collect payments."
                        }
                    ]
                },
                collection: {
                    title: "5. Method and Legal Reason for Data Collection",
                    desc:
                        "Your data is collected entirely by automatic means during the filling " +
                        "of the membership form via the www.fogcatalog.com website, purchasing " +
                        "a subscription and using the site. This data processing activity is " +
                        "based on the legal reasons specified in Article 5 of KVKK;",
                    reasons: [
                        "\"Establishment or performance of a contract\" (Article 5/2-c)",
                        "\"Legitimate interest of the data controller\" (Article 5/2-f)",
                        "\"Explicitly stipulated in laws\" (Article 5/2-a - For log keeping obligation)"
                    ],
                    footer: "."
                },
                rights: {
                    title: "6. Your Rights (KVKK Article 11)",
                    desc:
                        "As a data owner, by applying to FogCatalog; you have the right to " +
                        "learn whether your data is processed, to request correction if it is " +
                        "processed incorrectly, to request deletion or destruction of data.",
                    contact:
                        "To exercise these rights, you can send your requests in writing " +
                        "to kvkk@fogcatalog.com email address or our company address."
                },
                ui: {
                    badge: "DATA PRIVACY PROTOCOL",
                    clarification: "CLARIFICATION TEXT",
                    updated: "UPDATED:",
                    contactTitle: "CONTACT FOR REQUESTS"
                }
            },
            distanceSales: {
                title: "Distance Sales Agreement",
                ref: "REF: LEG-DSA-2026/V1",
                effectiveDateLabel: "Effective Date:",
                effectiveDate: "25.01.2026",
                parties: {
                    title: "1. Parties",
                    seller: {
                        title: "1.1. SELLER (Service Provider)",
                        nameLabel: "Title",
                        name: "Burcu Aldığ",
                        taxOfficeLabel: "Tax Office",
                        taxOffice: "Nilüfer V.D. / 0510559196",
                        emailLabel: "Email",
                        email: "info@fogcatalog.com",
                        phoneLabel: "Phone",
                        phone: "+90 545 395 42 03",
                        address: "23 Nisan Mah. 241. Sk. No: 8 İç Kapı No: 42<br />Nilüfer / BURSA / TURKEY"
                    },
                    buyer: {
                        title: "1.2. BUYER (Customer)",
                        scope: "SCOPE",
                        desc:
                            "The real or legal person whose name-surname and invoice " +
                            "information declared while subscribing to the Platform is " +
                            "taken as the basis."
                    }
                },
                subject: {
                    title: "2. Subject of the Agreement",
                    desc:
                        "The subject of this Agreement is the determination of the rights " +
                        "and obligations of the parties regarding the sale, performance and " +
                        "use of the 'Digital Catalog and Product Management Software' (SaaS) " +
                        "service, the qualifications and sales price of which are specified " +
                        "below, ordered electronically by the Buyer via the FogCatalog " +
                        "Platform, in accordance with the Law No. 6502 on the Protection " +
                        "of Consumers and the Regulation on Distance Contracts."
                },
                service: {
                    title: "3. Service and Payment Details",
                    item1: {
                        label: "3.1. SERVICE DESCRIPTION",
                        desc:
                            "FogCatalog is a cloud-based software service that allows users " +
                            "to create, manage and share product catalogs digitally."
                    },
                    item2: {
                        label: "3.2. DURATION & RENEWAL",
                        desc:
                            "Service is provided for the period selected by the Buyer " +
                            "(Monthly/Yearly). Unless cancelled, it automatically renews " +
                            "at the current price at the end of the term."
                    },
                    item3: {
                        label: "3.3. DELIVERY METHOD",
                        desc:
                            "The service is of 'Immediate Performance in Electronic " +
                            "Environment' nature. Access authority is defined to the " +
                            "Buyer's account upon payment approval."
                    }
                },
                general: {
                    title: "4. General Provisions",
                    item1:
                        "The Buyer declares that they have read the preliminary information " +
                        "form on the Platform, obtained and confirmed the preliminary " +
                        "information regarding the basic characteristics, sales price, " +
                        "payment method and right of withdrawal.",
                    item2:
                        "FogCatalog will show the necessary technical care for the service " +
                        "to be accessible 24/7. However, it cannot be held responsible for " +
                        "access problems due to force majeure or technical maintenance works.",
                    item3:
                        "The Buyer is personally responsible for all content uploaded to " +
                        "the system. FogCatalog is not responsible for the content of catalogs " +
                        "created by users and copyright infringements.",
                    item4:
                        "The Buyer is responsible for the security of their username and " +
                        "password. FogCatalog cannot be held responsible for damages arising " +
                        "from sharing with third parties or unauthorized use."
                },
                withdrawal: {
                    title: "5. Right of Withdrawal (IMPORTANT)",
                    item1Part1: "The service subject to this agreement falls within the scope of ",
                    item1Strong: "\"Services performed instantly in electronic environment\"",
                    item1Part2:
                        " pursuant to Article 15 (ğ) of the Regulation on Distance " +
                        "Contracts titled 'Exceptions to the Right of Withdrawal'.",
                    item2Part1:
                        "Therefore, after purchasing the service or renewing the " +
                        "subscription, the Buyer ",
                    item2Badge:
                        "CANNOT USE THE RIGHT OF WITHDRAWAL AND CANNOT REQUEST A REFUND.",
                    item2Part2:
                        " By approving this agreement, the Buyer accepts in advance " +
                        "that there is no right of withdrawal.",
                    item3Label: "Cancellation Procedure:",
                    item3Desc: " The Buyer can cancel their subscription at any time via the panel. In case of cancellation:",
                    list1: "Service usage continues until the end of the current paid period.",
                    list2: "No fee is charged for the next period.",
                    list3: "No retrospective refunds are made."
                },
                privacy: {
                    title: "6. Privacy & Data Protection",
                    desc:
                        "Personal data belonging to the Buyer is processed within the scope " +
                        "of KVKK No. 6698 and FogCatalog Privacy Policy for the purpose of " +
                        "service performance, invoicing and fulfillment of legal obligations. " +
                        "Detailed information is available in the 'Clarification Text' on the Platform."
                },
                jurisdiction: {
                    title: "7. Jurisdiction",
                    desc:
                        "In disputes arising from this agreement, Consumer Arbitration " +
                        "Committees within the monetary limits, and in exceeding cases:",
                    court: "BURSA CONSUMER COURTS",
                    office: "AND ENFORCEMENT OFFICES"
                },
                enforcement: {
                    title: "8. Enforcement",
                    desc:
                        "When the Buyer performs the payment for the order placed via the " +
                        "Platform, they are deemed to have accepted all terms of this agreement."
                },
                footer: {
                    page: "PAGE 01 / 01"
                }
            },
            cookiePolicy: {
                title: "Cookie Policy",
                lastUpdated: "Last Updated: January 25, 2026",
                intro:
                    "As FogCatalog (Legal Title: Burcu Aldig), we use Cookies to ensure " +
                    "you benefit from our website most efficiently and to improve your user " +
                    "experience. This policy is an integral part of our Clarification Text " +
                    "under KVKK No. 6698.",
                whatIsCookie: {
                    title: "1. What is a Cookie?",
                    desc:
                        "Cookies are small text files saved to your computer or mobile device " +
                        "via your browser by the websites you visit. Thanks to these files, " +
                        "the site remembers your preferences (e.g. login status, language " +
                        "selection) and recognizes you on your next visit."
                },
                types: {
                    title: "2. Types of Cookies We Use",
                    mandatory: {
                        label: "Mandatory Cookies",
                        desc:
                            "Technically mandatory for the site to work properly, for you " +
                            "to log in to your membership account and for your security " +
                            "(CSRF protection, etc.). These cookies are not used for marketing " +
                            "purposes and cannot be turned off from our systems."
                    },
                    analytic: {
                        label: "Analytical Cookies",
                        desc:
                            "Helps us measure our performance and improve our site by " +
                            "collecting anonymous data such as how many people visit our " +
                            "site and which pages are visited most (e.g. Google Analytics)."
                    },
                    functional: {
                        label: "Functional Cookies",
                        desc:
                            "Allows us to offer you a more personalized experience by saving " +
                            "your preferences such as language selection or 'Remember Me'."
                    }
                },
                management: {
                    title: "3. How Can You Manage Cookies?",
                    desc:
                        "You can delete or block cookies at any time using your browser " +
                        "settings. However, we would like to remind you that when you delete " +
                        "mandatory cookies, the basic functions of the site such as 'Log In' " +
                        "and 'Edit Catalog' may not work.",
                    instruction: "You can change your browser settings from these menus:",
                    browsers: [
                        { name: "Google Chrome", path: "Settings > Privacy and Security > Cookies" },
                        { name: "Mozilla Firefox", path: "Options > Privacy and Security > Cookies" },
                        { name: "Safari", path: "Preferences > Privacy" },
                        { name: "Microsoft Edge", path: "Settings > Cookies and Site Permissions" }
                    ]
                },
                contact: {
                    title: "4. Contact",
                    desc: "You can send any questions and opinions regarding our cookie policy to info@fogcatalog.com."
                },
                ui: {
                    policy: "POLICY",
                    userFocused: "User Focused",
                    securityDesc: "We prioritize your privacy and data security above all else.",
                    definition: "Definition",
                    catalog: "CATALOG",
                    controls: "Controls",
                    inquiries: "Inquiries"
                }
            }
        },
    },
} as const

export default legal
