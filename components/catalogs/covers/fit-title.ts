/**
 * Kapak başlığı yazı boyutu. Dar sütunlu temalarda sabit büyük punto "Koleksiyonu" gibi uzun
 * kelimeleri ortadan bölüyordu ("KOLEKSİY / ONU"); en uzun kelime sığmıyorsa punto orantılı küçülür.
 *
 * @param basePx  temanın normal puntosu
 * @param maxChars bu puntoda tek satıra sığan en uzun kelimenin harf sayısı
 */
export function fitTitleFontSize(title: string, basePx: number, maxChars: number): number {
    const longest = Math.max(0, ...title.split(/\s+/).map((word) => [...word].length))
    return longest > maxChars ? Math.floor((basePx * maxChars) / longest) : basePx
}
