import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type Side = "left" | "center" | "right"

interface HeaderSlotsProps {
    /** Builder'daki logo konumu: none | header-left | header-center | header-right */
    logoPosition?: string | null
    titlePosition?: string | null
    /** Şablonun kendi stilindeki logo öğesi (logo yüklenmemişse null) */
    logo: ReactNode | null
    /** Şablonun kendi stilindeki başlık öğesi */
    title: ReactNode
    /** Sağ uca eklenen ek bilgi (sayfa numarası vb.) */
    aside?: ReactNode
    /** Öğeler arası boşluk sınıfı */
    gapClassName?: string
    /** Dikey hizalama */
    align?: "center" | "end"
    className?: string
}

function sideOf(position: string | null | undefined): Side | null {
    const side = position?.split("-")[1]
    return side === "left" || side === "center" || side === "right" ? side : null
}

/**
 * Şablon başlıklarında logo ve katalog adını builder ayarına göre yerleştirir.
 * Logo ile başlık aynı taraftaysa yan yana durur (üst üste yığılıp başlık alanından taşmaz);
 * ortada öğe yoksa başlık taraf, sayfanın geri kalanını kullanabilir (gereksiz kesilmez).
 */
export function HeaderSlots({
    logoPosition,
    titlePosition,
    logo,
    title,
    aside,
    gapClassName = "gap-4",
    align = "center",
    className,
}: HeaderSlotsProps) {
    const logoSide = logo && logoPosition?.startsWith("header") ? sideOf(logoPosition) : null
    const titleSide: Side = titlePosition === "center" || titlePosition === "right" ? titlePosition : "left"

    const itemsFor = (side: Side): ReactNode[] => {
        const items: ReactNode[] = []
        const hasLogo = logoSide === side
        const hasTitle = titleSide === side
        // Logo her zaman dış kenarda: solda başlığın önünde, sağda arkasında
        if (side === "right") {
            if (hasTitle) items.push(<div key="title" className="min-w-0">{title}</div>)
            if (hasLogo) items.push(<div key="logo" className="shrink-0">{logo}</div>)
            if (aside) items.push(<div key="aside" className="shrink-0">{aside}</div>)
        } else {
            if (hasLogo) items.push(<div key="logo" className="shrink-0">{logo}</div>)
            if (hasTitle) items.push(<div key="title" className="min-w-0">{title}</div>)
        }
        return items
    }

    const left = itemsFor("left")
    const center = itemsFor("center")
    const right = itemsFor("right")
    const hasCenter = center.length > 0
    const alignClass = align === "end" ? "items-end" : "items-center"

    // Ortada öğe varsa yanlar eşit genişlikte (orta gerçekten ortada kalır);
    // yoksa başlığın bulunduğu taraf genişler, diğeri içeriği kadar yer kaplar.
    // Başlık içermeyen taraf (yalnızca logo / ek bilgi) içeriğinden dar olamaz: ortadaki başlığın üstüne taşmaz
    const sideClass = (side: "left" | "right") => {
        const holdsTitle = titleSide === side
        if (hasCenter) return cn("flex-1 basis-0", !holdsTitle && "min-w-fit")
        return holdsTitle ? "flex-1" : "flex-none max-w-[50%]"
    }

    return (
        <div className={cn("flex w-full min-w-0", alignClass, gapClassName, className)}>
            <div className={cn("flex min-w-0 justify-start", alignClass, gapClassName, sideClass("left"))}>{left}</div>
            {hasCenter && (
                <div className={cn("flex min-w-0 max-w-[60%] shrink justify-center text-center", alignClass, gapClassName)}>{center}</div>
            )}
            <div className={cn("flex min-w-0 justify-end text-right", alignClass, gapClassName, sideClass("right"))}>{right}</div>
        </div>
    )
}
