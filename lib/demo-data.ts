import type { Product } from "@/lib/actions/products"

const createProduct = (
    id: string,
    name: string,
    description: string,
    price: number,
    category: string,
    image: string,
    order: number,
    sku: string,
    attributes: { name: string, value: string }[] = []
): Product => ({
    id,
    name,
    description,
    price,
    sku,
    images: [image],
    image_url: image,
    category,
    stock: 50,
    user_id: "demo",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    order,
    product_url: null,
    custom_attributes: [
        { name: "Para Birimi", value: "TL", unit: "" },
        ...attributes.map(a => ({ ...a, unit: "" }))
    ]
})

export const DEMO_DATA: Record<string, Product[]> = {
    fashion: [
        createProduct("f1", "İpek Gece Elbisesi", "Resmi etkinlikler için şık, %100 ipek kumaş.", 4500, "Elbiseler", "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800", 0, "MOD-001"),
        createProduct("f2", "Yapılı Blazer Ceket", "Modern kesim, her ortama uygun klasik ceket.", 2250, "Dış Giyim", "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=800", 1, "MOD-002"),
        createProduct("f3", "Deri Botlar", "El yapımı, konforlu ve dayanıklı deri.", 3400, "Ayakkabı", "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&q=80&w=800", 2, "MOD-003"),
        createProduct("f4", "Atkı", "Yumuşak dokulu, sıcak tutan lüks aksesuar.", 850, "Aksesuar", "https://images.unsplash.com/photo-1609803384069-19f3e5a70e75?auto=format&fit=crop&q=80&w=800", 3, "MOD-004"),
        createProduct("f5", "Dizayn El Çantası", "Altın detaylı, geniş iç hacimli şık çanta.", 6800, "Çantalar", "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800", 4, "MOD-005"),
        createProduct("f6", "Altın Kaplama Kolye", "Minimalist tasarım, zarif detaylar.", 1200, "Takı", "https://plus.unsplash.com/premium_photo-1681276170423-2c60b95094b4?auto=format&fit=crop&q=80&w=800", 5, "MOD-006"),
    ],
    tech: [
        createProduct("t1", "ANC Kulaklık", "Üstün gürültü engelleme ve hifi ses kalitesi.", 8500, "Ses", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800", 0, "TEK-001"),
        createProduct("t2", "Akıllı Saat Pro", "Sağlık takibi ve spor modları ile tam kontrol.", 5800, "Giyilebilir", "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800", 1, "TEK-002"),
        createProduct("t3", "Aynasız Kamera", "Profesyonel çekimler için yüksek çözünürlük.", 24000, "Fotoğraf", "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800", 2, "TEK-003"),
        createProduct("t4", "Mekanik Klavye", "RGB aydınlatmalı, tactile anahtarlı konfor.", 2100, "Aksesuar", "https://plus.unsplash.com/premium_photo-1664194583917-b0ba07c4ce2a?auto=format&fit=crop&q=80&w=800", 3, "TEK-004"),
        createProduct("t5", "Kablosuz Mouse", "Ergonomik tasarım, hassas izleme.", 1450, "Aksesuar", "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&q=80&w=800", 4, "TEK-005"),
        createProduct("t6", "Taşınabilir SSD", "Yüksek hızlı veri aktarımı, 1TB kapasite.", 3200, "Depolama", "https://plus.unsplash.com/premium_photo-1721133221361-4f2b2af3b6fe?auto=format&fit=crop&q=80&w=800", 5, "TEK-006"),
    ],
    cosmetic: [
        createProduct("c1", "Yüz Serumu", "Cildi yenileyen, vitamin destekli yoğun bakım.", 950, "Cilt Bakımı", "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800", 0, "KOZ-001"),
        createProduct("c2", "İmza Parfüm", "Uzun süre kalıcı, sofistike çiçeksi koku.", 2800, "Parfüm", "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=800", 1, "KOZ-002"),
        createProduct("c3", "Mat Ruj Seti", "Günün her saati için 5 farklı renk seçeneği.", 750, "Makyaj", "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&q=80&w=800", 2, "KOZ-003"),
        createProduct("c4", "Organik Vücut Yağı", "Tamamen doğal içerikli, derinlemesine nemlendirme.", 620, "Vücut Bakımı", "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800", 3, "KOZ-004"),
        createProduct("c5", "Far Paleti", "Zengin pigmentli, trend renkler bir arada.", 840, "Makyaj", "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=800", 4, "KOZ-005"),
        createProduct("c6", "Gece Kremi", "Uyku sırasında cildi onaran anti-aging formül.", 1150, "Cilt Bakımı", "https://images.unsplash.com/photo-1668025757022-a75458371576?auto=format&fit=crop&q=80&w=800", 5, "KOZ-006"),
    ],
    home: [
        createProduct("h1", "Seramik Vazo", "El yapımı, minimalist tasarım dekoratif obje.", 540, "Dekorasyon", "https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&q=80&w=800", 0, "EV-001"),
        createProduct("h2", "Aromatik Mum", "Sakinleştirici etkili, doğal esansiyel yağlar.", 320, "Ev Kokusu", "https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?auto=format&fit=crop&q=80&w=800", 1, "EV-002"),
        createProduct("h3", "Dekoratif Yastık", "Kadife dokulu, modern desenli konfor.", 280, "Tekstil", "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&q=80&w=800", 2, "EV-003"),
        createProduct("h4", "Örgü Battaniye", "El örgüsü görünümlü, sıcak tutan şık örtü.", 950, "Tekstil", "https://images.unsplash.com/photo-1592652426689-59892540b68a?auto=format&fit=crop&q=80&w=800", 3, "EV-004"),
        createProduct("h5", "Duvar Saati", "Sessiz mekanizmalı, iskandinav stil.", 720, "Dekorasyon", "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&q=80&w=800", 4, "EV-005"),
        createProduct("h6", "Boy Aynası", "İnce metal çerçeveli, modern görünüm.", 2400, "Dekorasyon", "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80&w=800", 5, "EV-006"),
    ],
    furniture: [
        createProduct("fur1", "Kadife Berjer", "Konforlu oturum, zümrüt yeşili şıklık.", 4800, "Koltuk", "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&q=80&w=800", 0, "MOB-001"),
        createProduct("fur2", "Mermer Sehpa", "Doğal mermer tablalı, pirinç ayaklı tasarım.", 3200, "Masa", "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&q=80&w=800", 1, "MOB-002"),
        createProduct("fur3", "Çalışma Masası", "Meşe kaplama, minimal ve fonksiyonel.", 2850, "Masa", "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=800", 2, "MOB-003"),
        createProduct("fur4", "Kitaplık", "Açık raf sistemi, endüstriyel dokunuş.", 1950, "Depolama", "https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&q=80&w=800", 3, "MOB-004"),
        createProduct("fur5", "Yemek Sandalyesi", "Dergonamik sırt desteği, ahşap ayaklar.", 1100, "Sandalye", "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&q=80&w=800", 4, "MOB-005"),
        createProduct("fur6", "Yatak Başlığı", "Döşemeli, modern kapitone detaylar.", 3600, "Yatak Odası", "https://images.unsplash.com/photo-1505693419173-42b9218a5c10?auto=format&fit=crop&q=80&w=800", 5, "MOB-006"),
    ],
    automotive: [
        createProduct("a1", "Bagaj Organizer", "Geniş hacimli, katlanabilir ve dayanıklı bagaj düzenleyici.", 1250, "Aksesuar", "https://images.unsplash.com/photo-1590674412391-7f74950d82d4?auto=format&fit=crop&q=80&w=800", 0, "OTO-001"),
        createProduct("a2", "Telefon Tutucu", "Vakumlu, sarsıntı engelleyici güvenli sürüş.", 380, "Aksesuar", "https://images.unsplash.com/photo-1604837394598-5b700b11f5e4?auto=format&fit=crop&q=80&w=800", 1, "OTO-002"),
        createProduct("a3", "Paspas Seti", "Her araca uyumlu, kolay temizlenen kauçuk.", 850, "Aksesuar", "https://plus.unsplash.com/premium_photo-1661494244080-00d15ad150ca?auto=format&fit=crop&q=80&w=800", 2, "OTO-003"),
        createProduct("a4", "Seramik Kaplama", "Boya koruma ve yüksek parlaklık etkili.", 1200, "Bakım", "https://images.unsplash.com/photo-1607860108855-6b0dc008e600?auto=format&fit=crop&q=80&w=800", 3, "OTO-004"),
        createProduct("a5", "Oto Kokusu", "Premium esanslar, ferah iç mekan.", 150, "Bakım", "https://images.unsplash.com/photo-1512314889357-e157c22f938d?auto=format&fit=crop&q=80&w=800", 4, "OTO-005"),
        createProduct("a6", "Lastik Pompası", "Dijital göstergeli, taşınabilir kompakt güç.", 1100, "Elektronik", "https://images.unsplash.com/photo-1590674844330-891963283307?auto=format&fit=crop&q=80&w=800", 5, "OTO-006"),
    ],
    sports: [
        createProduct("s1", "Kamp Çadırı", "4 mevsim dayanıklı, 3 kişilik geniş alan.", 4200, "Outdoor", "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=800", 0, "SPR-001"),
        createProduct("s2", "Yoga Matı", "Kaymaz taban, eklem dostu kalın doku.", 780, "Fitness", "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?auto=format&fit=crop&q=80&w=800", 1, "SPR-002"),
        createProduct("s3", "Dambıl Seti", "Ayarlanabilir ağırlık, kauçuk kaplama.", 1850, "Fitness", "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800", 2, "SPR-003"),
        createProduct("s4", "Kamp Sırt Çantası", "Ergonomik askılar, 50L geniş kapasite.", 2100, "Outdoor", "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800", 3, "SPR-004"),
        createProduct("s5", "Termos Şişe", "24 saat soğuk tutma etkili çelik yapı.", 640, "Outdoor", "https://images.unsplash.com/photo-1610398041406-a452bfded6c2?auto=format&fit=crop&q=80&w=800", 4, "SPR-005"),
        createProduct("s6", "Koşu Ayakkabısı", "Hafif taban, nefes alan üst kumaş.", 2900, "Giyim", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800", 5, "SPR-006"),
    ],
    toys: [
        createProduct("toy1", "Lego Seti", "Yaratıcılığı geliştiren 1000 parça yapı seti.", 1600, "Eğitici", "https://images.unsplash.com/photo-1585366119957-e55b11dd0171?auto=format&fit=crop&q=80&w=800", 0, "OYU-001"),
        createProduct("toy2", "Kutu Oyunu", "Aile boyu eğlence, strateji odaklı.", 450, "Hobi", "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&q=80&w=800", 1, "OYU-002"),
        createProduct("toy3", "Uzaktan Kumandalı Araba", "Yüksek hız, arazi sürüşüne uygun.", 1250, "Hobi", "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&q=80&w=800", 2, "OYU-003"),
        createProduct("toy4", "Oyuncak Bebek Evi", "Detaylı mobilyalarla ahşap konak.", 2400, "Hobi", "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&q=80&w=800", 3, "OYU-004"),
        createProduct("toy5", "Peluş Ayıcık", "Yumuşak dolgulu, uyku arkadaşı.", 380, "Bebek", "https://images.unsplash.com/photo-1585155770447-2f66e2a397b5?auto=format&fit=crop&q=80&w=800", 4, "OYU-005"),
        createProduct("toy6", "3D Puzzle", "Dünya simgeleriyle eğlenceli yapboz.", 520, "Eğitici", "https://images.unsplash.com/photo-1583244532610-2ca22e171d85?auto=format&fit=crop&q=80&w=800", 5, "OYU-006"),
    ],
    books: [
        createProduct("b1", "Dolma Kalem", "Altın uçlu, özel kutulu imza serisi.", 1850, "Kırtasiye", "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&q=80&w=800", 0, "KIR-001"),
        createProduct("b2", "Deri Ajanda", "Tarihsiz, fildişi kağıt lüks defter.", 420, "Kırtasiye", "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=800", 1, "KIR-002"),
        createProduct("b3", "Masa Düzenleyici", "Meşe ağacı, minimal ofis çözümü.", 680, "Ofis", "https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&q=80&w=800", 2, "KIR-003"),
        createProduct("b4", "Okuma Lambası", "Göz yormayan ışık, retro tasarım.", 850, "Aydınlatma", "https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&q=80&w=800", 3, "KIR-004"),
        createProduct("b5", "Kitap Tutucu", "Sanatsal figürlü metal kitaplık desteği.", 340, "Dekorasyon", "https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=800", 4, "KIR-005"),
        createProduct("b6", "Sanat Kitabı", "Dünya müzeleri koleksiyonu, büyük boy.", 1100, "Kitap", "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800", 5, "KIR-006"),
    ],
    food: [
        createProduct("fo1", "Nitelikli Kahve", "Kolombiya menşeli, taze kavrulmuş.", 450, "İçecek", "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=800", 0, "GID-001"),
        createProduct("fo2", "Soğuk Sıkım Zeytinyağı", "Ege bahçelerinden erken hasat.", 980, "Mutfak", "https://images.unsplash.com/photo-1474979266404-7eaacbad88bc?auto=format&fit=crop&q=80&w=800", 1, "GID-002"),
        createProduct("fo3", "Organik Bal", "Yüksek yayla çiçeği süzme bal.", 720, "Mutfak", "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=800", 2, "GID-003"),
        createProduct("fo4", "Bitki Çayı Seti", "Özel harman rüstik çay koleksiyonu.", 380, "İçecek", "https://images.unsplash.com/photo-1594631252845-29fc4586b51c?auto=format&fit=crop&q=80&w=800", 3, "GID-004"),
        createProduct("fo5", "Baharat Kutusu", "8 farklı dünya baharatlı gurme set.", 560, "Mutfak", "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800", 4, "GID-005"),
        createProduct("fo6", "El Yapımı Çikolata", "Belçika kakaolu, fındıklı trüf seti.", 680, "Gurme", "https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&q=80&w=800", 5, "GID-006"),
    ]
}
