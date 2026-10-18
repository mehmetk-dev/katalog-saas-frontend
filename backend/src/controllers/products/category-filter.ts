/**
 * Ürünün `category` alanı virgülle ayrılmış birden çok kategori tutabilir ("Masa, Sandalye").
 * Filtre, listedeki kategorilerden biriyle birebir (büyük/küçük harf duyarsız) eşleşmelidir:
 * eski `ilike %Masa%` filtresi "Masa Lambası" kategorisini de getiriyordu.
 *
 * PostgreSQL `~*` (PostgREST `imatch`) için desen döner; kategori metnindeki regex
 * karakterleri kaçışlanır, böylece kullanıcı girdisi desen olarak yorumlanmaz.
 */
export function categoryMatchPattern(category: string): string {
    const escaped = category.trim().replace(/[\\^$.*+?()[\]{}|-]/g, '\\$&');
    return `(^|,)\\s*${escaped}\\s*(,|$)`;
}
