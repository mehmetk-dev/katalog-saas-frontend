"use client"

import { Logo } from "@/components/ui/logo"
import { useTranslation } from "@/lib/contexts/i18n-provider"

export default function CatalogLoading() {
    const { t } = useTranslation()
    return (
        <div className="min-h-screen bg-muted/50 flex flex-col">
            {/* Header Skeleton */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                                <Logo />
                            </div>
                            <div className="h-6 w-px bg-accent" />
                            <div className="h-4 w-32 bg-accent rounded-md animate-pulse" />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-10 w-48 bg-muted rounded-full animate-pulse" />
                            <div className="h-9 w-9 bg-muted rounded-full animate-pulse" />
                            <div className="h-9 w-9 bg-muted rounded-full animate-pulse" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Page Skeleton */}
            <main className="flex-1 flex flex-col items-center gap-6 px-4 sm:px-6 py-6">
                <div
                    className="bg-card shadow-2xl rounded-lg overflow-hidden border border-border relative"
                    style={{ width: '794px', maxWidth: '100%', height: '1123px' }}
                >
                    {/* Catalog page loading shimmer */}
                    <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-12">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-border border-t-primary rounded-full animate-spin" />
                        </div>
                        <p className="text-sm font-semibold text-muted-foreground">{t("common.loading")}</p>

                        {/* Shimmer grid */}
                        <div className="w-full max-w-lg grid grid-cols-3 gap-4 mt-8 opacity-30">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="aspect-square bg-accent rounded-lg animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                                    <div className="h-3 bg-accent rounded animate-pulse w-3/4" style={{ animationDelay: `${i * 150 + 75}ms` }} />
                                    <div className="h-3 bg-accent rounded animate-pulse w-1/2" style={{ animationDelay: `${i * 150 + 150}ms` }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer Skeleton */}
            <footer className="shrink-0 bg-background/95 backdrop-blur-xl border-t border-border/50 py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Logo size="sm" />
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
