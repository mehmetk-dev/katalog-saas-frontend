/**
 * Kullanıcının yazdığı fiyatı sayıya çevirir. `parseFloat("199,90")` 199, `parseFloat("1.250,50")`
 * 1.25 döndürdüğü için Türkçe biçimli fiyatlar yanlış kaydediliyordu.
 *
 * Kurallar:
 *  - Hem nokta hem virgül varsa sondaki ondalık ayırıcıdır ("1.250,50" → 1250.5, "1,250.50" → 1250.5)
 *  - Yalnızca virgül varsa ondalıktır ("199,90" → 199.9); İngilizce arayüzde ardından tam 3 rakam
 *    geliyorsa binliktir ("1,250" → 1250)
 *  - Yalnızca nokta: birden fazlaysa binlik ("1.250.000" → 1250000); tekse ve Türkçe arayüzde
 *    ardından tam 3 rakam geliyorsa binlik ("1.250" → 1250), aksi halde ondalık ("199.90" → 199.9)
 * Geçersizse null döner.
 */
export function parseLocalizedNumber(input: string, language: string = "tr"): number | null {
    const value = input.replace(/\s|₺|\$|€|£/g, "").trim()
    if (!value) return null
    if (!/^[0-9.,]+$/.test(value)) return null

    const lastDot = value.lastIndexOf(".")
    const lastComma = value.lastIndexOf(",")
    let normalized: string

    if (lastDot >= 0 && lastComma >= 0) {
        const decimalSep = lastDot > lastComma ? "." : ","
        const thousandSep = decimalSep === "." ? "," : "."
        normalized = value.split(thousandSep).join("").replace(decimalSep, ".")
    } else if (lastComma >= 0) {
        const commaCount = value.split(",").length - 1
        const decimals = value.length - lastComma - 1
        // İngilizce arayüzde "1,250" ve "1,250,000" binliktir
        if (language === "en" && decimals === 3) {
            normalized = value.split(",").join("")
        } else if (commaCount > 1) {
            return null
        } else {
            normalized = value.replace(",", ".")
        }
    } else if (lastDot >= 0) {
        const dotCount = value.split(".").length - 1
        const decimals = value.length - lastDot - 1
        if (dotCount > 1 || (language === "tr" && decimals === 3)) {
            normalized = value.split(".").join("")
        } else {
            normalized = value
        }
    } else {
        normalized = value
    }

    if ((normalized.match(/\./g) || []).length > 1) return null
    const result = Number(normalized)
    return Number.isFinite(result) ? result : null
}

/** Kayıtlı sayıyı düzenleme alanında kullanıcının dilinde gösterir (Türkçe: ondalık virgül) */
export function formatNumberForInput(value: number | null | undefined, language: string = "tr"): string {
    if (value === null || value === undefined || !Number.isFinite(value)) return ""
    const raw = String(value)
    return language === "tr" ? raw.replace(".", ",") : raw
}
