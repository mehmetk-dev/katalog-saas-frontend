"use client"

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { A4_HEIGHT_PX as PAGE_H, A4_WIDTH_PX as PAGE_W } from "../_lib/constants"
import { clampCorner, computeFold, polygonToClipPath, type Point } from "../_lib/page-fold"
import type { CatalogPage } from "../_lib/types"

/** Bir görünüm: sol ve sağ sayfanın indeksi (boş taraf null). Tek sayfa düzeninde sol hep null. */
type Spread = [number | null, number | null]
type BookLayout = "double" | "single"
type Direction = "next" | "prev"

/** Tek sayfa düzeninde çevrilen yaprağın arkası düz kâğıttır */
const BLANK = -1

interface FlipRoles {
    left: number | null
    under: number | null
    front: number | null
    back: number | null
}

interface FlipState {
    from: number
    to: number
    /** forward: P köşeden karşıya gider; backward: aynı geometri tersten (geri çevirme) */
    geometry: "forward" | "backward"
    roles: FlipRoles
    cornerY: number
}

const FLIP_DURATION_MS = 900
const PEEK_DURATION_MS = 260
/** Fareyle köşeye gelince sayfanın kalkma miktarı (sayfa pikseli) */
const PEEK_OFFSET = 70
const CORNER_ZONE = 110
const DRAG_START_PX = 6
/** Okların, sayfa bilgisinin ve kalınlık çizgilerinin kapladığı alan (ekran pikseli) */
const GUTTER = { double: { x: 76, top: 24, bottom: 92 }, single: { x: 12, top: 12, bottom: 76 } }
const MAX_SCALE = { double: 1.25, single: 1.6 }

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

function buildViews(pageCount: number, startsWithCover: boolean, layout: BookLayout): Spread[] {
    if (layout === "single") return Array.from({ length: pageCount }, (_, i) => [null, i] as Spread)
    return buildSpreads(pageCount, startsWithCover)
}

/** Tek sayfalı açılımda (kapalı kapak / arka kapak) defter ortaya kayar */
function spreadShift(layout: BookLayout, [left, right]: Spread): number {
    if (layout === "single") return 0
    if (left === null && right !== null) return -PAGE_W / 2
    if (right === null && left !== null) return PAGE_W / 2
    return 0
}

function rolesFor(views: Spread[], from: number, direction: Direction, layout: BookLayout): FlipRoles {
    // Geri çevirme, bir önceki görünümden ileri çevirmenin tersidir
    const base = direction === "next" ? from : from - 1
    const [left, front] = views[base]
    const [nextLeft, nextRight] = views[base + 1]
    return { left, front, back: layout === "double" ? nextLeft : BLANK, under: nextRight }
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

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
    /** Telefonda tek sayfa, geniş ekranda iki sayfa yan yana */
    layout: BookLayout
    /** Tam ekranda koyu zemin üzerinde metin renkleri */
    onDarkBackground?: boolean
    t: (key: string, params?: Record<string, unknown>) => string
}

/**
 * Paylaşılan katalogun kitap görünümü. Sayfalar kâğıt gibi köşesinden katlanarak çevrilir:
 * oklar/klavye ile animasyonlu, fare veya parmakla sürükleyerek elle. Animasyon yalnızca
 * çevirme sürerken çalışır; her karede React yeniden çizilmez, stiller doğrudan yazılır.
 */
export function BookViewer({ pages, renderPageContent, layout, onDarkBackground, t }: BookViewerProps) {
    const startsWithCover = pages[0]?.type === "cover"
    const views = useMemo(() => buildViews(pages.length, startsWithCover, layout), [pages.length, startsWithCover, layout])
    const isDouble = layout === "double"
    const spineX = isDouble ? PAGE_W : 0

    const [viewIndex, setViewIndex] = useState(0)
    const [flip, setFlip] = useState<FlipState | null>(null)
    const [scale, setScale] = useState(0)
    const reducedMotion = usePrefersReducedMotion()
    const canAnimate = !reducedMotion && typeof Element !== "undefined" && typeof Element.prototype.animate === "function"

    const containerRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const pageEls = useRef(new Map<number, HTMLDivElement>())
    const flapShadeRef = useRef<HTMLDivElement>(null)
    const flapShadowRef = useRef<HTMLDivElement>(null)
    const underShadowRef = useRef<HTMLDivElement>(null)

    const flipRef = useRef<FlipState | null>(null)
    const pointRef = useRef<Point>({ x: PAGE_W, y: PAGE_H })
    const rafRef = useRef(0)
    /** Animasyon bitince çalışacak iş; hızlı art arda çevirmede hemen tamamlanabilsin diye saklanır */
    const finishRef = useRef<(() => void) | null>(null)
    const queuedRef = useRef<Direction | null>(null)
    const modeRef = useRef<"idle" | "peek" | "drag" | "anim">("idle")
    const dragRef = useRef<{ id: number; x: number; y: number; started: boolean; direction: Direction; cornerY: number; lastX: number; lastT: number; vx: number; origin: Point } | null>(null)
    const suppressClickRef = useRef(false)
    /** Düzen değişince (telefon döndürülünce) aynı sayfada kalmak için */
    const firstVisibleRef = useRef(0)

    flipRef.current = flip
    const current = useMemo<Spread>(() => views[Math.min(viewIndex, views.length - 1)] ?? [null, null], [views, viewIndex])
    const position = flip ? flip.to : viewIndex
    const canGoPrev = position > 0
    const canGoNext = position < views.length - 1

    // Arama/kategori değişince sayfalar yeniden üretilir: başa dön
    useEffect(() => {
        cancelAnimationFrame(rafRef.current)
        finishRef.current = null
        queuedRef.current = null
        modeRef.current = "idle"
        setFlip(null)
        setViewIndex(0)
        firstVisibleRef.current = 0
    }, [pages])

    // Tek/çift sayfa arasında geçişte okunan sayfa korunur
    useEffect(() => {
        const page = firstVisibleRef.current
        const index = views.findIndex(([l, r]) => l === page || r === page)
        setViewIndex(index >= 0 ? index : 0)
        // views yalnızca düzen değiştiğinde farklılaşır; sayfa değişimi yukarıda ele alınıyor
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layout])

    useEffect(() => {
        const [l, r] = current
        firstVisibleRef.current = l ?? r ?? 0
    }, [current])

    // Defteri bulunduğu alana sığdır
    useLayoutEffect(() => {
        const el = containerRef.current
        if (!el) return
        const gutter = GUTTER[layout]
        const update = () => {
            const width = el.clientWidth - gutter.x * 2
            const height = el.clientHeight - gutter.top - gutter.bottom
            const next = Math.min(width / (PAGE_W * (isDouble ? 2 : 1)), height / PAGE_H)
            setScale(Math.max(0.2, Math.min(next, MAX_SCALE[layout])))
        }
        update()
        const observer = new ResizeObserver(update)
        observer.observe(el)
        return () => observer.disconnect()
    }, [layout, isDouble])

    /** Sayfaları ve gölgeleri mevcut çevirme durumuna göre yerleştirir (her karede çağrılır) */
    const applyLayout = useCallback(() => {
        const state = flipRef.current
        const fold = state ? computeFold(pointRef.current, state.cornerY, PAGE_W, PAGE_H) : null
        const place = (el: HTMLDivElement, transform: string, z: number, clip = "", visible = true) => {
            el.style.transform = transform
            el.style.zIndex = String(z)
            el.style.clipPath = clip
            el.style.visibility = visible ? "visible" : "hidden"
        }
        const atLeft = `translate(${spineX - PAGE_W}px, 0)`
        const atRight = `translate(${spineX}px, 0)`

        for (const [index, el] of pageEls.current) {
            if (!state) {
                place(el, index === current[0] ? atLeft : atRight, 1)
                continue
            }
            const { roles } = state
            if (index === roles.left) place(el, atLeft, 1)
            else if (index === roles.under) place(el, atRight, 1)
            else if (index === roles.front) place(el, atRight, 2, fold ? polygonToClipPath(fold.frontClip) : "")
            else if (index === roles.back) {
                if (!fold) place(el, atRight, 0, "", false)
                else {
                    const [a, b, c, d, e, f] = fold.backMatrix
                    place(el, `matrix(${a}, ${b}, ${c}, ${d}, ${e + spineX}, ${f})`, 5, polygonToClipPath(fold.backClip))
                }
            }
        }

        const shade = flapShadeRef.current
        const shadow = flapShadowRef.current
        const underShadow = underShadowRef.current
        if (!shade || !shadow || !underShadow) return
        if (!fold) {
            shade.style.visibility = shadow.style.visibility = underShadow.style.visibility = "hidden"
            return
        }

        // Kâğıdın ortasında en belirgin, başta ve sonda kaybolan ışık/gölge
        const strength = Math.sin(Math.PI * fold.progress)
        const flapClip = polygonToClipPath(fold.flapPolygon, spineX)
        const strip = (el: HTMLElement, offsetX: number, flipSide: boolean) => {
            const length = PAGE_H * 3
            el.style.transform =
                `translate(${fold.foldOrigin.x + offsetX}px, ${fold.foldOrigin.y}px) rotate(${fold.foldAngle}rad) ` +
                `translate(${-length / 2}px, ${flipSide ? "-100%" : "0"})`
        }

        shade.style.visibility = "visible"
        shade.style.clipPath = flapClip
        const shadeStrip = shade.firstElementChild as HTMLElement
        strip(shadeStrip, spineX, true)
        shadeStrip.style.opacity = String(0.35 + 0.65 * strength)

        shadow.style.visibility = "visible"
        ;(shadow.firstElementChild as HTMLElement).style.clipPath = flapClip
        shadow.style.opacity = String(0.25 + 0.35 * strength)

        underShadow.style.visibility = "visible"
        const underStrip = underShadow.firstElementChild as HTMLElement
        strip(underStrip, 0, false)
        underStrip.style.opacity = String(Math.min(1, 0.4 + strength))
    }, [current, spineX])

    useLayoutEffect(() => {
        applyLayout()
    })

    useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

    const cornerStart = useCallback((cornerY: number): Point => ({ x: PAGE_W, y: cornerY }), [])
    const cornerEnd = useCallback((cornerY: number): Point => ({ x: -PAGE_W, y: cornerY }), [])

    /** P'yi hedefe yay çizerek taşır; tam çevirmede kâğıt hafifçe havalanır */
    const animatePoint = useCallback(
        (target: Point, duration: number, cornerY: number, onDone: () => void) => {
            cancelAnimationFrame(rafRef.current)
            const from = { ...pointRef.current }
            const travel = Math.abs(target.x - from.x) / (2 * PAGE_W)
            const lift = PAGE_H * 0.14 * travel * (cornerY === 0 ? 1 : -1)
            const startedAt = performance.now()
            finishRef.current = () => {
                cancelAnimationFrame(rafRef.current)
                finishRef.current = null
                pointRef.current = target
                onDone()
            }
            const tick = (now: number) => {
                const t = Math.min(1, (now - startedAt) / duration)
                const e = easeInOut(t)
                pointRef.current = clampCorner(
                    { x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e + lift * Math.sin(Math.PI * t) },
                    cornerY, PAGE_W, PAGE_H,
                )
                applyLayout()
                if (t < 1) rafRef.current = requestAnimationFrame(tick)
                else finishRef.current?.()
            }
            rafRef.current = requestAnimationFrame(tick)
        },
        [applyLayout],
    )

    const commit = useCallback((state: FlipState, completed: boolean) => {
        modeRef.current = "idle"
        flipRef.current = null
        setFlip(null)
        if (completed) setViewIndex(state.to)
    }, [])

    /** Çevirmeyi tamamlar ya da geri bırakır */
    const settle = useCallback(
        (state: FlipState, complete: boolean, duration: number) => {
            modeRef.current = "anim"
            const forwardEnd = state.geometry === "forward" ? cornerEnd(state.cornerY) : cornerStart(state.cornerY)
            const backwardEnd = state.geometry === "forward" ? cornerStart(state.cornerY) : cornerEnd(state.cornerY)
            // Tamamlanmazsa defterin kayması da eski haline dönsün diye "to" geri alınır
            if (!complete) setFlip({ ...state, to: state.from })
            animatePoint(complete ? forwardEnd : backwardEnd, duration, state.cornerY, () => commit(state, complete))
        },
        [animatePoint, commit, cornerEnd, cornerStart],
    )

    const beginFlip = useCallback(
        (direction: Direction, cornerY: number): FlipState | null => {
            const from = viewIndex
            const to = from + (direction === "next" ? 1 : -1)
            if (to < 0 || to >= views.length) return null
            const state: FlipState = {
                from,
                to,
                geometry: direction === "next" ? "forward" : "backward",
                roles: rolesFor(views, from, direction, layout),
                cornerY,
            }
            pointRef.current = direction === "next" ? cornerStart(cornerY) : cornerEnd(cornerY)
            flipRef.current = state
            setFlip(state)
            return state
        },
        [cornerEnd, cornerStart, layout, viewIndex, views],
    )

    // Yeni çevirme başlatıldığında: sayfalar DOM'a girdikten sonra animasyon başlar
    const pendingAnimRef = useRef(false)
    useLayoutEffect(() => {
        if (!flip || !pendingAnimRef.current) return
        pendingAnimRef.current = false
        settle(flip, true, FLIP_DURATION_MS)
    }, [flip, settle])

    const goTo = useCallback(
        (direction: Direction) => {
            const step = direction === "next" ? 1 : -1
            const mode = modeRef.current
            if (mode === "anim") {
                // Hızlı art arda çevirme: mevcut yaprağı hemen oturt, sıradakini başlat
                queuedRef.current = direction
                finishRef.current?.()
                return
            }
            if (mode === "drag") return
            const active = flipRef.current
            if (mode === "peek" && active) {
                const sameWay = (active.geometry === "forward") === (direction === "next")
                if (sameWay) settle(active, true, FLIP_DURATION_MS * 0.8)
                return
            }
            const target = viewIndex + step
            if (target < 0 || target >= views.length) return
            if (!canAnimate) {
                setViewIndex(target)
                return
            }
            if (beginFlip(direction, PAGE_H)) {
                modeRef.current = "anim"
                pendingAnimRef.current = true
            }
        },
        [beginFlip, canAnimate, settle, viewIndex, views.length],
    )

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

    /** Ekran koordinatını sırt koordinatına çevirir */
    const toSpine = useCallback(
        (clientX: number, clientY: number): Point | null => {
            const stage = stageRef.current
            if (!stage || scale <= 0) return null
            const rect = stage.getBoundingClientRect()
            return { x: (clientX - rect.left) / scale - spineX, y: (clientY - rect.top) / scale }
        },
        [scale, spineX],
    )

    // Fareyle sayfa köşesine gelince köşe hafifçe kalkar ("buradan çevrilir" ipucu)
    const onPointerMove = (event: React.PointerEvent) => {
        const drag = dragRef.current
        if (drag && drag.id === event.pointerId) {
            const dx = event.clientX - drag.x
            const dy = event.clientY - drag.y
            if (!drag.started) {
                if (Math.hypot(dx, dy) < DRAG_START_PX) return
                // Dokunmatikte dikey hareket sayfa çevirmez
                if (event.pointerType !== "mouse" && Math.abs(dy) > Math.abs(dx)) {
                    dragRef.current = null
                    return
                }
                const active = flipRef.current
                const sameWay = active && (active.geometry === "forward") === (drag.direction === "next")
                if (!(modeRef.current === "peek" && sameWay)) {
                    cancelAnimationFrame(rafRef.current)
                    if (!beginFlip(drag.direction, drag.cornerY)) {
                        dragRef.current = null
                        return
                    }
                }
                cancelAnimationFrame(rafRef.current)
                // Köşe kalkmışken tutulduysa oradan devam eder (geri zıplamasın)
                drag.origin = { ...pointRef.current }
                drag.started = true
                modeRef.current = "drag"
                ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
            }
            const state = flipRef.current
            if (!state) return
            const now = performance.now()
            drag.vx = (event.clientX - drag.lastX) / Math.max(1, now - drag.lastT)
            drag.lastX = event.clientX
            drag.lastT = now
            // Tek sayfa düzeninde yaprak ekrandan iki kat yol alır; parmak hareketi büyütülür
            const gain = (isDouble ? 1 : 2) / scale
            pointRef.current = clampCorner({ x: drag.origin.x + dx * gain, y: drag.origin.y + dy / scale }, state.cornerY, PAGE_W, PAGE_H)
            applyLayout()
            return
        }

        if (event.pointerType !== "mouse" || event.buttons !== 0 || !canAnimate) return
        const mode = modeRef.current
        if (mode === "anim" || mode === "drag") return
        const p = toSpine(event.clientX, event.clientY)
        if (!p) return
        const nearTop = p.y < CORNER_ZONE
        const nearBottom = p.y > PAGE_H - CORNER_ZONE
        const nearRight = p.x > PAGE_W - CORNER_ZONE && p.x <= PAGE_W
        const nearLeft = isDouble ? p.x < -PAGE_W + CORNER_ZONE && p.x >= -PAGE_W : false
        const direction: Direction | null = (nearTop || nearBottom) && nearRight && canGoNext ? "next"
            : (nearTop || nearBottom) && nearLeft && canGoPrev ? "prev" : null
        const active = flipRef.current

        if (direction) {
            const cornerY = nearTop ? 0 : PAGE_H
            if (mode === "peek" && active && active.cornerY === cornerY && (active.geometry === "forward") === (direction === "next")) return
            if (mode === "peek") cancelAnimationFrame(rafRef.current)
            const state = mode === "peek" && active && active.cornerY === cornerY ? active : beginFlip(direction, cornerY)
            if (!state) return
            modeRef.current = "peek"
            const base = direction === "next" ? cornerStart(cornerY) : cornerEnd(cornerY)
            const target = { x: base.x + (direction === "next" ? -PEEK_OFFSET : PEEK_OFFSET), y: base.y + (cornerY === 0 ? PEEK_OFFSET : -PEEK_OFFSET) }
            animatePoint(target, PEEK_DURATION_MS, cornerY, () => { modeRef.current = "peek" })
            modeRef.current = "peek"
        } else if (mode === "peek" && active) {
            modeRef.current = "anim"
            const rest = active.geometry === "forward" ? cornerStart(active.cornerY) : cornerEnd(active.cornerY)
            animatePoint(rest, PEEK_DURATION_MS, active.cornerY, () => commit(active, false))
        }
    }

    const onPointerDown = (event: React.PointerEvent) => {
        if (!canAnimate || (event.pointerType === "mouse" && event.button !== 0)) return
        if (modeRef.current === "anim") return
        const p = toSpine(event.clientX, event.clientY)
        if (!p) return
        const onRightPage = p.x >= 0 && p.x <= PAGE_W
        const half = isDouble ? 0 : PAGE_W / 2
        const direction: Direction = p.x >= half ? "next" : "prev"
        if (direction === "next" ? !canGoNext : !canGoPrev) return
        if (!isDouble && !onRightPage) return
        dragRef.current = {
            id: event.pointerId, x: event.clientX, y: event.clientY, started: false, direction,
            cornerY: p.y < PAGE_H / 2 ? 0 : PAGE_H, lastX: event.clientX, lastT: performance.now(), vx: 0, origin: { x: 0, y: 0 },
        }
    }

    const endDrag = (event: React.PointerEvent) => {
        const drag = dragRef.current
        if (!drag || drag.id !== event.pointerId) return
        dragRef.current = null
        if (!drag.started) return
        suppressClickRef.current = true
        const state = flipRef.current
        if (!state) return
        const p = pointRef.current
        const flingForward = drag.vx < -0.4
        const flingBack = drag.vx > 0.4
        const complete = state.geometry === "forward"
            ? (p.x < 0 && !flingBack) || flingForward
            : (p.x > 0 && !flingForward) || flingBack
        const remaining = complete === (state.geometry === "forward") ? p.x + PAGE_W : PAGE_W - p.x
        settle(state, complete, Math.min(650, Math.max(220, (remaining / (2 * PAGE_W)) * FLIP_DURATION_MS)))
    }

    const onPointerLeave = (event: React.PointerEvent) => {
        if (event.pointerType !== "mouse" || modeRef.current !== "peek") return
        const active = flipRef.current
        if (!active) return
        modeRef.current = "anim"
        const rest = active.geometry === "forward" ? cornerStart(active.cornerY) : cornerEnd(active.cornerY)
        animatePoint(rest, PEEK_DURATION_MS, active.cornerY, () => commit(active, false))
    }

    // Sürükleyip bırakınca altta kalan ürünün tıklaması (görsel büyütme) tetiklenmesin
    const onClickCapture = (event: React.MouseEvent) => {
        if (!suppressClickRef.current) return
        suppressClickRef.current = false
        event.preventDefault()
        event.stopPropagation()
    }

    // Ekranda olması gereken sayfalar: çevirme sürerken dört rol, dururken açık görünüm
    const mounted: number[] = flip
        ? [flip.roles.left, flip.roles.under, flip.roles.front, flip.roles.back].filter((i): i is number => i !== null)
        : current.filter((i): i is number => i !== null)
    const sideOf = (index: number): "left" | "right" | "single" => {
        if (!isDouble) return "single"
        if (flip) return index === flip.roles.left || index === flip.roles.back ? "left" : "right"
        return index === current[0] ? "left" : "right"
    }

    const registerPage = (index: number) => (el: HTMLDivElement | null) => {
        if (el) pageEls.current.set(index, el)
        else pageEls.current.delete(index)
    }

    const shiftTarget = flip ? views[flip.to] : current
    const shift = spreadShift(layout, shiftTarget ?? current)
    const readRatio = views.length > 1 ? position / (views.length - 1) : 0

    const indicator = (() => {
        const visible = current.filter((index): index is number => index !== null).map((index) => index + 1)
        if (visible.length === 2) return t("catalogs.public.spreadIndicator", { from: visible[0], to: visible[1], total: pages.length })
        return t("catalogs.public.pageIndicator", { page: visible[0] ?? 1, total: pages.length })
    })()

    const stageWidth = PAGE_W * (isDouble ? 2 : 1)

    return (
        <div
            ref={containerRef}
            className="relative flex size-full flex-col items-center overflow-hidden select-none"
            style={{ paddingTop: GUTTER[layout].top }}
            role="region"
            aria-roledescription={t("catalogs.public.bookView")}
            aria-label={indicator}
        >
            <div className="flex min-h-0 w-full flex-1 items-center justify-center">
                {scale > 0 && (
                    <div className="relative" style={{ width: stageWidth * scale, height: PAGE_H * scale }}>
                        <div
                            ref={stageRef}
                            className="absolute left-0 top-0 touch-none motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-in-out"
                            style={{
                                width: stageWidth,
                                height: PAGE_H,
                                transform: `scale(${scale}) translateX(${shift}px)`,
                                transformOrigin: "top left",
                            }}
                            onPointerDown={onPointerDown}
                            onPointerMove={onPointerMove}
                            onPointerUp={endDrag}
                            onPointerCancel={endDrag}
                            onPointerLeave={onPointerLeave}
                            onClickCapture={onClickCapture}
                        >
                            <PageStack side="right" ratio={1 - readRatio} x={spineX + PAGE_W} visible={current[1] !== null || flip?.roles.under != null} />
                            {isDouble && <PageStack side="left" ratio={readRatio} x={spineX - PAGE_W} visible={current[0] !== null || flip?.roles.left != null} />}

                            {mounted.map((index) => (
                                <div
                                    key={index}
                                    ref={registerPage(index)}
                                    className="absolute left-0 top-0 overflow-hidden shadow-[0_10px_40px_-12px_rgba(0,0,0,0.45)]"
                                    style={{ width: PAGE_W, height: PAGE_H, transformOrigin: "0 0", willChange: flip ? "transform, clip-path" : undefined }}
                                >
                                    {index === BLANK ? <PaperBack /> : <Sheet side={sideOf(index)}>{pages[index] && renderPageContent(pages[index], index)}</Sheet>}
                                </div>
                            ))}

                            {/* Sırt: iki sayfanın birleştiği yerdeki kıvrım */}
                            {isDouble && (current[0] !== null && current[1] !== null || flip) && (
                                <div
                                    aria-hidden
                                    className="pointer-events-none absolute top-0 z-[3] h-full w-12 -translate-x-1/2 bg-[linear-gradient(90deg,transparent,rgba(0,0,0,0.16)_45%,rgba(0,0,0,0.28)_50%,rgba(0,0,0,0.12)_55%,transparent)]"
                                    style={{ left: spineX }}
                                />
                            )}

                            {/* Katlanan kâğıdın alttaki sayfaya düşen gölgesi */}
                            <div ref={underShadowRef} aria-hidden className="pointer-events-none invisible absolute top-0 z-[2] overflow-hidden" style={{ left: spineX, width: PAGE_W, height: PAGE_H }}>
                                <div className="absolute left-0 top-0 h-[90px] origin-top-left bg-[linear-gradient(to_bottom,rgba(0,0,0,0.38),rgba(0,0,0,0.12)_40%,transparent)]" style={{ width: PAGE_H * 3 }} />
                            </div>
                            {/* Yaprağın kenarından öndeki sayfaya düşen yumuşak gölge */}
                            <div ref={flapShadowRef} aria-hidden className="pointer-events-none invisible absolute inset-0 z-[4] blur-[10px]">
                                <div className="absolute inset-0 bg-black" />
                            </div>
                            {/* Katlanan yüzeyde ışık: katlama çizgisinde koyu, ortada parlak */}
                            <div ref={flapShadeRef} aria-hidden className="pointer-events-none invisible absolute inset-0 z-[6]">
                                <div
                                    className="absolute left-0 top-0 origin-top-left bg-[linear-gradient(to_top,rgba(0,0,0,0.28),rgba(0,0,0,0.06)_8%,rgba(255,255,255,0.22)_22%,rgba(255,255,255,0)_45%,rgba(0,0,0,0.07)_80%,rgba(0,0,0,0.12))]"
                                    style={{ width: PAGE_H * 3, height: PAGE_W * 1.6 }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {isDouble && (
                <>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => goTo("prev")}
                        disabled={!canGoPrev}
                        aria-label={t("catalogs.public.previousPage")}
                        title={t("catalogs.public.previousPage")}
                        className="absolute left-4 top-1/2 z-30 size-11 -translate-y-1/2 rounded-full bg-background/90 shadow-md backdrop-blur"
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
                        className="absolute right-4 top-1/2 z-30 size-11 -translate-y-1/2 rounded-full bg-background/90 shadow-md backdrop-blur"
                    >
                        <ChevronRight className="size-5" />
                    </Button>
                </>
            )}

            {/* Alt bilgi: telefonda başparmakla erişilen ok düğmeleri de burada */}
            <div className="flex shrink-0 flex-col items-center gap-1 pb-4 pt-3">
                <div
                    className={cn(
                        "flex items-center gap-1 rounded-full border p-1 shadow-sm backdrop-blur",
                        onDarkBackground ? "border-white/15 bg-white/10 text-white" : "bg-background/90 text-foreground",
                    )}
                >
                    {!isDouble && (
                        <Button variant="ghost" size="icon" onClick={() => goTo("prev")} disabled={!canGoPrev} aria-label={t("catalogs.public.previousPage")} className="size-9 rounded-full">
                            <ChevronLeft className="size-5" />
                        </Button>
                    )}
                    <p aria-live="polite" className="min-w-28 px-3 text-center text-sm font-medium tabular-nums">
                        {indicator}
                    </p>
                    {!isDouble && (
                        <Button variant="ghost" size="icon" onClick={() => goTo("next")} disabled={!canGoNext} aria-label={t("catalogs.public.nextPage")} className="size-9 rounded-full">
                            <ChevronRight className="size-5" />
                        </Button>
                    )}
                </div>
                <p className={cn("hidden text-xs sm:block", onDarkBackground ? "text-white/50" : "text-muted-foreground")}>
                    {t(isDouble ? "catalogs.public.bookHint" : "catalogs.public.bookHintTouch")}
                </p>
            </div>
        </div>
    )
}

/** Sayfa: katalog çıktısı her zaman açık temada; sırta doğru hafif kıvrım gölgesi */
function Sheet({ side, children }: { side: "left" | "right" | "single"; children: React.ReactNode }) {
    return (
        <div className="catalog-page catalog-light relative size-full overflow-hidden bg-white">
            {children}
            {side !== "single" && (
                <div
                    aria-hidden
                    className={cn(
                        "pointer-events-none absolute inset-y-0 w-20 from-black/[0.14] via-black/[0.04] to-transparent",
                        side === "left" ? "right-0 bg-gradient-to-l" : "left-0 bg-gradient-to-r",
                    )}
                />
            )}
        </div>
    )
}

/** Tek sayfa düzeninde çevrilen yaprağın arka yüzü */
function PaperBack() {
    return <div className="size-full bg-[linear-gradient(105deg,#f3f2ee,#fbfbf9_40%,#efeee9)]" />
}

/** Defterin dış kenarındaki sayfa kalınlığı: okundukça sağ taraf incelir, sol kalınlaşır */
function PageStack({ side, ratio, x, visible }: { side: "left" | "right"; ratio: number; x: number; visible: boolean }) {
    const width = Math.round(2 + ratio * 8)
    if (!visible || width <= 2) return null
    return (
        <div
            aria-hidden
            className="pointer-events-none absolute top-[3px] z-0 bg-[repeating-linear-gradient(90deg,#e7e5e0_0,#e7e5e0_1px,#fafaf8_1px,#fafaf8_2px)] shadow-[0_8px_24px_-10px_rgba(0,0,0,0.4)]"
            style={{ left: side === "right" ? x : x - width, width, height: PAGE_H - 6, borderRadius: side === "right" ? "0 2px 2px 0" : "2px 0 0 2px" }}
        />
    )
}
