"use client"

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { A4_HEIGHT_PX, A4_WIDTH_PX } from "../_lib/constants"
import type { CatalogPage } from "../_lib/types"

/** Bir açılım: sol ve sağ sayfanın indeksi (boş taraf null) */
type Spread = [number | null, number | null]

type FlipDirection = "next" | "prev"

interface FlipState {
    direction: FlipDirection
    target: number
}

const FLIP_DURATION_MS = 750
const FLIP_EASING = "cubic-bezier(0.45, 0.05, 0.25, 1)"
/** Okların ve alt bilginin kapladığı alan */
const SIDE_GUTTER_PX = 72
/** Üst/alt boşluk + defterin altındaki sayfa bilgisi */
const VERTICAL_GUTTER_PX = 128
const SWIPE_THRESHOLD_PX = 60

/**
 * Kapak varsa defter kapalı başlar: kapak sağda tek başına durur, ardından sayfalar
 * ikişer ikişer açılır. Kapak yoksa ilk açılım iki sayfadır.
 */
export function buildSpreads(pageCount: number, startsWithCover: boolean): Spread[] {
    const spreads: Spread[] = []
    let index = 0
    if (startsWithCover && pageCount > 0) {
        spreads.push([null, 0])
        index = 1
    }
    for (; index < pageCount; index += 2) {
        spreads.push([index, index + 1 < pageCount ? index + 1 : null])
    }
    return spreads
}

/** Tek sayfalı açılımda (kapalı kapak / arka kapak) defter ortaya kayar */
function spreadShift([left, right]: Spread): number {
    if (left === null && right !== null) return -A4_WIDTH_PX / 2
    if (right === null && left !== null) return A4_WIDTH_PX / 2
    return 0
}

function usePrefersReducedMotion() {
    const [reduced, setReduced] = useState(false)
    useEffect(() => {
        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(query.matches)
        update()
        query.addEventListener("change", update)
        return () => query.removeEventListener("change", update)
    }, [])
    return reduced
}

function isTypingTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false
    return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
}

interface BookViewerProps {
    pages: CatalogPage[]
    /** Sayfanın içeriği (A4 doğal boyutunda); çerçeve ve ölçek bu bileşende */
    renderPageContent: (page: CatalogPage, index: number) => React.ReactNode
    /** Tam ekranda koyu zemin üzerinde metin renkleri */
    onDarkBackground?: boolean
    t: (key: string, params?: Record<string, unknown>) => string
}

/** Paylaşılan katalogun masaüstü görünümü: iki sayfa yan yana, sayfa çevirme efektiyle */
export function BookViewer({ pages, renderPageContent, onDarkBackground, t }: BookViewerProps) {
    const startsWithCover = pages[0]?.type === "cover"
    const spreads = useMemo(() => buildSpreads(pages.length, startsWithCover), [pages.length, startsWithCover])

    const [spreadIndex, setSpreadIndex] = useState(0)
    const [flip, setFlip] = useState<FlipState | null>(null)
    const [scale, setScale] = useState(0)
    const reducedMotion = usePrefersReducedMotion()

    const containerRef = useRef<HTMLDivElement>(null)
    const leafRef = useRef<HTMLDivElement>(null)
    const frontShadeRef = useRef<HTMLDivElement>(null)
    const backShadeRef = useRef<HTMLDivElement>(null)
    const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
    const animationsRef = useRef<Array<Animation | undefined>>([])
    /** Animasyon sürerken gelen çevirme isteği: mevcut yaprak anında oturur, bu istek hemen başlar */
    const queuedRef = useRef<FlipDirection | null>(null)

    // Arama/kategori değişince sayfalar yeniden üretilir: başa dön
    useEffect(() => {
        queuedRef.current = null
        setSpreadIndex(0)
        setFlip(null)
    }, [pages])

    // Defteri bulunduğu alana sığdır
    useLayoutEffect(() => {
        const el = containerRef.current
        if (!el) return
        const update = () => {
            const width = el.clientWidth - SIDE_GUTTER_PX * 2
            const height = el.clientHeight - VERTICAL_GUTTER_PX
            const next = Math.min(width / (A4_WIDTH_PX * 2), height / A4_HEIGHT_PX)
            setScale(Math.max(0.2, Math.min(next, 1.25)))
        }
        update()
        const observer = new ResizeObserver(update)
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    const current = spreads[Math.min(spreadIndex, spreads.length - 1)] ?? [null, null]
    // Çevirme sürerken sınırlar varılacak açılıma göre hesaplanır
    const position = flip?.target ?? spreadIndex
    const canGoPrev = position > 0
    const canGoNext = position < spreads.length - 1

    const goTo = useCallback(
        (direction: FlipDirection) => {
            const step = direction === "next" ? 1 : -1
            if (flip) {
                const queuedTarget = flip.target + step
                if (queuedTarget < 0 || queuedTarget >= spreads.length) return
                // Hızlı art arda çevirme: beklemek yerine mevcut yaprağı bitir, sıradakini başlat
                queuedRef.current = direction
                animationsRef.current.forEach((animation) => animation?.finish())
                return
            }
            const target = spreadIndex + step
            if (target < 0 || target >= spreads.length) return
            // Hareket azaltma tercihi veya Web Animations desteği yoksa animasyonsuz çevrilir
            if (reducedMotion || typeof Element.prototype.animate !== "function") {
                setSpreadIndex(target)
                return
            }
            setFlip({ direction, target })
        },
        [flip, reducedMotion, spreadIndex, spreads.length],
    )

    // Yaprak çevirme animasyonu: sırt etrafında 180° döner, gölge ortada koyulaşır
    useEffect(() => {
        if (!flip || !leafRef.current) return
        const sign = flip.direction === "next" ? -1 : 1
        const timing: KeyframeAnimationOptions = { duration: FLIP_DURATION_MS, easing: FLIP_EASING, fill: "forwards" }
        const leafAnimation = leafRef.current.animate(
            [{ transform: "rotateY(0deg)" }, { transform: `rotateY(${sign * 180}deg)` }],
            timing,
        )
        const animations = [
            leafAnimation,
            frontShadeRef.current?.animate([{ opacity: 0 }, { opacity: 0.45 }], timing),
            backShadeRef.current?.animate([{ opacity: 0.45 }, { opacity: 0 }], timing),
        ]
        animationsRef.current = animations
        let cancelled = false
        leafAnimation.finished
            .then(() => {
                if (cancelled) return
                setSpreadIndex(flip.target)
                setFlip(null)
            })
            .catch(() => undefined)
        return () => {
            cancelled = true
            animations.forEach((animation) => animation?.cancel())
            animationsRef.current = []
        }
    }, [flip])

    // Sırada bekleyen çevirme varsa önceki yaprak oturur oturmaz başlat
    useEffect(() => {
        if (flip || !queuedRef.current) return
        const direction = queuedRef.current
        queuedRef.current = null
        goTo(direction)
    }, [flip, goTo])

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
            if (isTypingTarget(event.target)) return
            // Açık bir pencere (paylaş, lightbox) varken defter çevrilmez
            if (document.querySelector('[role="dialog"]')) return
            if (event.key === "ArrowRight" || event.key === "PageDown") {
                event.preventDefault()
                goTo("next")
            } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
                event.preventDefault()
                goTo("prev")
            }
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [goTo])

    const onPointerDown = (event: React.PointerEvent) => {
        if (event.pointerType === "mouse") return
        pointerStartRef.current = { x: event.clientX, y: event.clientY }
    }
    const onPointerUp = (event: React.PointerEvent) => {
        const start = pointerStartRef.current
        pointerStartRef.current = null
        if (!start) return
        const dx = event.clientX - start.x
        const dy = event.clientY - start.y
        if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dy) > Math.abs(dx)) return
        goTo(dx < 0 ? "next" : "prev")
    }

    // Animasyon sırasında: altta kalan sayfalar hedef açılımdan, dönen yaprak mevcut açılımdan
    const target = flip ? spreads[flip.target] : null
    const staticLeft = flip?.direction === "prev" && target ? target[0] : current[0]
    const staticRight = flip?.direction === "next" && target ? target[1] : current[1]
    const leafFront = flip ? (flip.direction === "next" ? current[1] : current[0]) : null
    const leafBack = flip && target ? (flip.direction === "next" ? target[0] : target[1]) : null
    const shift = spreadShift(target ?? current)
    const showSpine = staticLeft !== null && staticRight !== null

    const renderSheet = (index: number | null, side: "left" | "right") => {
        if (index === null || !pages[index]) return null
        return (
            <div
                key={`page-${index}`}
                className="catalog-page catalog-light relative size-full overflow-hidden bg-white"
            >
                {renderPageContent(pages[index], index)}
                {/* Sırta doğru hafif kıvrım gölgesi */}
                <div
                    aria-hidden
                    className={cn(
                        "pointer-events-none absolute inset-y-0 w-16 from-black/15 to-transparent",
                        side === "left" ? "right-0 bg-gradient-to-l" : "left-0 bg-gradient-to-r",
                    )}
                />
            </div>
        )
    }

    const indicator = (() => {
        const visible = current.filter((index): index is number => index !== null).map((index) => index + 1)
        if (visible.length === 2) return t("catalogs.public.spreadIndicator", { from: visible[0], to: visible[1], total: pages.length })
        return t("catalogs.public.pageIndicator", { page: visible[0] ?? 1, total: pages.length })
    })()

    return (
        <div
            ref={containerRef}
            className="relative flex size-full flex-col items-center justify-center overflow-hidden select-none"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            role="region"
            aria-roledescription={t("catalogs.public.bookView")}
            aria-label={indicator}
        >
            {scale > 0 && (
                <div className="relative" style={{ width: A4_WIDTH_PX * 2 * scale, height: A4_HEIGHT_PX * scale }}>
                    <div
                        className="absolute left-0 top-0 motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-in-out"
                        style={{
                            width: A4_WIDTH_PX * 2,
                            height: A4_HEIGHT_PX,
                            transform: `scale(${scale}) translateX(${shift}px)`,
                            transformOrigin: "top left",
                            perspective: 5000,
                        }}
                    >
                        <div className="absolute left-0 top-0 h-full shadow-2xl" style={{ width: A4_WIDTH_PX, visibility: staticLeft === null ? "hidden" : "visible" }}>
                            {renderSheet(staticLeft, "left")}
                        </div>
                        <div className="absolute top-0 h-full shadow-2xl" style={{ left: A4_WIDTH_PX, width: A4_WIDTH_PX, visibility: staticRight === null ? "hidden" : "visible" }}>
                            {renderSheet(staticRight, "right")}
                        </div>

                        {showSpine && (
                            <div
                                aria-hidden
                                className="pointer-events-none absolute top-0 z-10 h-full w-10 -translate-x-1/2 bg-gradient-to-r from-transparent via-black/20 to-transparent"
                                style={{ left: A4_WIDTH_PX }}
                            />
                        )}

                        {flip && (
                            <div
                                ref={leafRef}
                                className="absolute top-0 z-20 h-full"
                                style={{
                                    left: flip.direction === "next" ? A4_WIDTH_PX : 0,
                                    width: A4_WIDTH_PX,
                                    transformOrigin: flip.direction === "next" ? "left center" : "right center",
                                    transformStyle: "preserve-3d",
                                }}
                            >
                                <div className="absolute inset-0 shadow-2xl [backface-visibility:hidden]">
                                    {renderSheet(leafFront, flip.direction === "next" ? "right" : "left")}
                                    <div ref={frontShadeRef} aria-hidden className="pointer-events-none absolute inset-0 bg-black opacity-0" />
                                </div>
                                <div className="absolute inset-0 shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
                                    {renderSheet(leafBack, flip.direction === "next" ? "left" : "right")}
                                    <div ref={backShadeRef} aria-hidden className="pointer-events-none absolute inset-0 bg-black opacity-0" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <Button
                variant="outline"
                size="icon"
                onClick={() => goTo("prev")}
                disabled={!canGoPrev}
                aria-label={t("catalogs.public.previousPage")}
                title={t("catalogs.public.previousPage")}
                className="absolute left-4 top-1/2 z-30 size-11 -translate-y-1/2 rounded-full shadow-md"
            >
                <ChevronLeft className="size-5" />
            </Button>
            <Button
                variant="outline"
                size="icon"
                onClick={() => goTo("next")}
                disabled={!canGoNext}
                aria-label={t("catalogs.public.nextPage")}
                title={t("catalogs.public.nextPage")}
                className="absolute right-4 top-1/2 z-30 size-11 -translate-y-1/2 rounded-full shadow-md"
            >
                <ChevronRight className="size-5" />
            </Button>

            <div className="mt-5 flex flex-col items-center gap-0.5">
                <p aria-live="polite" className={cn("text-sm font-medium tabular-nums", onDarkBackground ? "text-white/80" : "text-foreground")}>
                    {indicator}
                </p>
                <p className={cn("text-xs", onDarkBackground ? "text-white/50" : "text-muted-foreground")}>{t("catalogs.public.bookHint")}</p>
            </div>
        </div>
    )
}
