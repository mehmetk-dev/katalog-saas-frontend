import { TemplateProps } from "./types"

// Industrial - Endüstriyel/teknik katalog
export function IndustrialTemplate({
    catalogName,
    products,
    primaryColor,
    showPrices,
    showDescriptions,
    pageNumber = 1,
    totalPages = 1,
}: TemplateProps) {
    const safeProducts = products || []

    return (
        <div className="bg-zinc-100 h-full flex flex-col overflow-hidden">
            {/* Üst Header Bar */}
            <div className="h-2 shrink-0" style={{ backgroundColor: primaryColor }} />

            {/* Header */}
            <div className="h-14 bg-zinc-900 px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-1 h-8 bg-yellow-400" />
                    <h1 className="text-white font-bold uppercase tracking-wider text-sm">{catalogName || "Teknik Katalog"}</h1>
                </div>
                <div className="text-zinc-400 text-xs font-mono">REF:{String(pageNumber).padStart(3, '0')}</div>
            </div>

            {/* Tek kolon tam genişlik liste */}
            <div className="flex-1 p-4 flex flex-col gap-2 overflow-hidden">
                {safeProducts.slice(0, 7).map((product, idx) => (
                    <div
                        key={product.id}
                        className="bg-white flex items-center gap-4 p-3 rounded border border-zinc-200 hover:border-zinc-300 transition-colors"
                    >
                        {/* Sıra No */}
                        <div className="w-8 h-8 rounded bg-zinc-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {String(idx + 1 + (pageNumber - 1) * 7).padStart(2, '0')}
                        </div>

                        {/* Görsel */}
                        <div className="w-14 h-14 shrink-0 bg-zinc-100 rounded overflow-hidden">
                            <img loading="lazy" src={product.image_url || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover" />
                        </div>

                        {/* Bilgiler */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2">
                                <h3 className="font-bold text-sm text-zinc-900 uppercase">{product.name}</h3>
                                {product.sku && <span className="text-[9px] text-zinc-400 font-mono bg-zinc-100 px-1.5 py-0.5 rounded shrink-0">{product.sku}</span>}
                            </div>
                            {showDescriptions && product.description && (
                                <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{product.description}</p>
                            )}
                        </div>

                        {/* Fiyat */}
                        {showPrices && (
                            <div className="shrink-0 text-right">
                                <span className="font-bold text-base" style={{ color: primaryColor }}>₺{Number(product.price).toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="h-10 bg-zinc-900 flex items-center justify-between px-6 shrink-0">
                <span className="text-[10px] text-zinc-500 font-mono">{catalogName?.toUpperCase().replace(/\s/g, '-')}-{new Date().getFullYear()}</span>
                <span className="text-zinc-400 text-xs">{pageNumber} / {totalPages}</span>
            </div>
        </div>
    )
}
