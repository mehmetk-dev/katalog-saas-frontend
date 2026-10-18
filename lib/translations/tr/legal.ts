import {
    FOGCATALOG_COMPANY,
    FOGCATALOG_LEGAL_ADDRESS_HTML_TR,
} from "@/lib/legal/fogcatalog-company"

const legalTr = {
    legal: {
        effectiveDateLabel: "Yürürlük tarihi",
        cancellationPolicy: {
            title: "İptal ve İade Koşulları",
            ref: "REF: LEG-REF-2026/V1",
            summary: {
                title: "Özet",
                items: [
                    "Dijital hizmet olduğu için satın alınan aboneliklerde para iadesi yoktur.",
                    "Karar vermeden önce süresiz ücretsiz paketimizi kullanarak sistemi deneyebilirsiniz.",
                    "Aboneliğinizi istediğiniz zaman cezasız iptal edebilirsiniz.",
                    "İptal sonrası mevcut dönem sonuna kadar hizmet devam eder, verileriniz silinmez."
                ]
            },
            warning: "Önemli Bilgilendirme",
            refundPolicy: {
                title: "1. İade Politikası",
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
                title: "2. Abonelik İptal Süreci",
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
                title: "3. İstisnai Durumlar",
                desc:
                    "FogCatalog kaynaklı teknik bir sorun nedeniyle hizmetin hiç verilemediği veya " +
                    "sistemin 24 saatten uzun süre erişime kapalı kaldığı (uptime sorunu) durumlarda, " +
                    "talep üzerine ilgili döneme ait ücret iadesi değerlendirmeye alınabilir. Bu tür nadir " +
                    "durumlarda info@fogcatalog.com üzerinden bizimle iletişime geçebilirsiniz."
            }
        },
        kvkk: {
            title: "KVKK Aydınlatma Metni",
            ref: "REF: LEG-KVK-2026/V1",
            summary: {
                title: "Özet",
                items: [
                    "Hangi verilerinizi topladığımızı (ad, e-posta, IP adresi) ve neden kullandığımızı açıklar.",
                    "Verileriniz yalnızca hizmet sunumu, faturalama ve yasal zorunluluklar için işlenir.",
                    "Verileriniz sadece ödeme kuruluşları ve yetkili kurumlarla paylaşılır, asla satılmaz.",
                    "KVKK Madde 11 kapsamında verilerinizin silinmesini, düzeltilmesini talep edebilirsiniz.",
                    "Sorularınız için: info@fogcatalog.com"
                ]
            },
            controller: {
                title: "1. Veri Sorumlusu Kimdir?",
                desc:
                    "6698 sayılı Kişisel Verilerin Korunması Kanunu (\"KVKK\") uyarınca; " +
                    FOGCATALOG_COMPANY.legalName +
                    " " +
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
                    items: "Sipariş geçmişi, paket/abonelik bilgileri, banka/POS işlem referansı, talep ve şikayet kayıtları. Kart numarası, son kullanma tarihi, CVC ve kartın son 4 hanesi FogCatalog tarafından işlenmez veya saklanmaz."
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
                            "(Garanti BBVA sanal POS) ve altyapı/sunucu hizmeti alınan " +
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
                    "Bu haklarınızı kullanmak için taleplerinizi, info@fogcatalog.com " +
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
            summary: {
                title: "Özet",
                items: [
                    "FogCatalog, bulut tabanlı bir dijital katalog yazılımıdır (SaaS).",
                    "Dijital hizmet olarak cayma hakkı istisnaları kapsamındadır — iade yoktur.",
                    "Abonelik istediğiniz zaman iptal edilebilir, kalan süre boyunca kullanım devam eder.",
                    "Uyuşmazlıklarda İstanbul Tüketici Mahkemeleri yetkilidir."
                ]
            },
            effectiveDateLabel: "Yürürlük Tarihi:",
            effectiveDate: "25.01.2026",
            parties: {
                title: "1. Taraflar",
                seller: {
                    title: "1.1. Satıcı (Hizmet Sağlayıcı)",
                    nameLabel: "Ünvan",
                    name: FOGCATALOG_COMPANY.legalName,
                    taxOfficeLabel: "Vergi D.",
                    taxOffice:
                        FOGCATALOG_COMPANY.taxOffice +
                        " / " +
                        FOGCATALOG_COMPANY.taxNumber,
                    emailLabel: "Email",
                    email: FOGCATALOG_COMPANY.email,
                    phoneLabel: "Tel",
                    phone: FOGCATALOG_COMPANY.phone,
                    address: FOGCATALOG_LEGAL_ADDRESS_HTML_TR
                },
                buyer: {
                    title: "1.2. Alıcı (Müşteri)",
                    scope: "Kapsam",
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
                    label: "3.1. Hizmetin Tanımı",
                    desc:
                        "FogCatalog, kullanıcıların dijital ortamda ürün katalogları " +
                        "oluşturmasını, yönetmesini ve paylaşmasını sağlayan bulut " +
                        "tabanlı bir yazılım hizmetidir."
                },
                item2: {
                    label: "3.2. Süre ve Yenileme",
                    desc:
                        "Hizmet, Alıcı'nın seçtiği periyot (Aylık/Yıllık) boyunca sunulur. " +
                        "Alıcı iptal etmediği sürece, süre bitiminde güncel fiyat üzerinden " +
                        "otomatik yenilenir."
                },
                item3: {
                    label: "3.3. Teslimat Şekli",
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
                court: "İstanbul Tüketici Mahkemeleri",
                office: "ve İcra Daireleri"
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
            summary: {
                title: "Özet",
                items: [
                    "Çerezler, sitemizin düzgün çalışması ve deneyiminizi iyileştirmek için kullanılır.",
                    "Zorunlu çerezler dışında analitik ve tercih çerezleri kullanıyoruz.",
                    "Tarayıcı ayarlarınızdan çerezleri istediğiniz zaman yönetebilirsiniz.",
                    "Sorularınız için: info@fogcatalog.com"
                ]
            },
            lastUpdated: "Son Güncelleme: 25 Ocak 2026",
            intro:
                "FogCatalog (Hukuki Ünvan: " +
                FOGCATALOG_COMPANY.legalName +
                ") olarak, web sitemizden en verimli " +
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
} as const

export default legalTr
