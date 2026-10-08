"use client"

import { useState, useRef, useEffect, useMemo, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { type Catalog, createCatalog, updateCatalog } from "@/lib/actions/catalogs"
import { slugify, type BuilderCatalogData, buildCatalogPayload } from "@/components/builder/builder-utils"

/** Son düzenlemeden bu kadar sonra otomatik kaydedilir */
export const AUTOSAVE_DELAY_MS = 2000

export type SaveStatus = "idle" | "saving" | "saved" | "error"

interface UseCatalogActionsOptions {
    currentCatalogId: string | null
    catalog: Catalog | null
    isPublished: boolean
    user: { company?: string; name?: string; plan?: string } | null
    /** A callback returning current builder state - called at action-time to avoid stale closures */
    getState: () => BuilderCatalogData
    /** Taslak nesnesi; her düzenlemede kimliği değişir — otomatik kayıt zamanlayıcısını yeniden kurar */
    draft: unknown
    catalogName: string
    hasUnsavedChanges: boolean
    // Setters
    setCatalogName: (name: string) => void
    setCurrentCatalogId: (id: string | null) => void
    markSaved: (snapshot: BuilderCatalogData) => void
    setIsPublished: (published: boolean) => void
    refreshUser: () => Promise<void>
    t: (key: string, params?: Record<string, unknown>) => string
}

export function useCatalogActions({
    currentCatalogId,
    catalog,
    isPublished,
    user,
    getState,
    draft,
    catalogName,
    hasUnsavedChanges,
    setCatalogName,
    setCurrentCatalogId,
    markSaved,
    setIsPublished,
    refreshUser,
    t,
}: UseCatalogActionsOptions) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")

    // FIX(L7): Guard against state updates after unmount
    const isMountedRef = useRef(true)
    useEffect(() => {
        isMountedRef.current = true
        return () => { isMountedRef.current = false }
    }, [])

    // Refs so async work always reads fresh values
    const getStateRef = useRef(getState)
    getStateRef.current = getState
    const hasUnsavedChangesRef = useRef(hasUnsavedChanges)
    hasUnsavedChangesRef.current = hasUnsavedChanges
    // Yayındaki kataloğun public sayfası kayıttan sonra yenilensin; yayında değilse hiçbir public sayfaya dokunulmaz
    const publicSlugRef = useRef<string | null>(null)
    publicSlugRef.current = isPublished ? catalog?.share_slug ?? null : null

    // ─── Serialized writes ──────────────────────────────────────────────
    // Otomatik kayıt, elle kayıt ve yayınlama aynı kataloğa yazar; sırayla çalışmaları
    // eski bir isteğin yenisinin üzerine yazmasını engeller.
    const writeQueueRef = useRef<Promise<unknown>>(Promise.resolve())
    const enqueueWrite = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
        const run = writeQueueRef.current.catch(() => undefined).then(task)
        writeQueueRef.current = run
        return run
    }, [])

    const autosaveErrorShownRef = useRef(false)

    /** Mevcut taslağı sunucuya yazar ve kaydedilen anlık görüntüyü işaretler */
    const persist = useCallback(async (catalogId: string, data: BuilderCatalogData) => {
        setSaveStatus("saving")
        try {
            await updateCatalog(catalogId, buildCatalogPayload(data), { publicSlug: publicSlugRef.current })
            if (!isMountedRef.current) return
            // Kayıt sürerken yapılan değişiklikler bu snapshot'ta olmadığından kaydedilmemiş kalır
            markSaved(data)
            setSaveStatus("saved")
            autosaveErrorShownRef.current = false
        } catch (error) {
            if (isMountedRef.current) setSaveStatus("error")
            throw error
        }
    }, [markSaved])

    // ─── Autosave ───────────────────────────────────────────────────────
    // Her düzenlemede zamanlayıcı yeniden kurulur: kayıt, son değişiklikten AUTOSAVE_DELAY_MS sonra yapılır.
    useEffect(() => {
        if (!currentCatalogId || !hasUnsavedChanges) return
        const catalogId = currentCatalogId

        const timer = setTimeout(() => {
            enqueueWrite(async () => {
                // Sırada beklerken elle kayıt veya yayınlama değişiklikleri zaten yazmış olabilir
                if (!isMountedRef.current || !hasUnsavedChangesRef.current) return
                await persist(catalogId, getStateRef.current())
            }).catch((error) => {
                console.error("Autosave failed:", error)
                if (!autosaveErrorShownRef.current) {
                    autosaveErrorShownRef.current = true
                    toast.error(t("builder.autosaveFailed"))
                }
            })
        }, AUTOSAVE_DELAY_MS)

        return () => clearTimeout(timer)
    }, [currentCatalogId, hasUnsavedChanges, draft, enqueueWrite, persist, t])

    // ─── Slug ───────────────────────────────────────────────────────────
    const expectedSlug = useMemo(() => {
        if (!currentCatalogId) return ""
        const companyPart = (user?.company || user?.name || "user")
        const cleanCompany = companyPart.toLowerCase().replace(/[^a-z0-9]/g, "") === "fogcatalog" ? "" : companyPart
        const namePart = catalogName && catalogName.trim().length > 0 ? catalogName : "katalog"
        const idPart = currentCatalogId.slice(0, 4)

        const parts = [slugify(cleanCompany), slugify(namePart), idPart]
        return parts.filter(p => p && p.length > 0).join('-')
    }, [user, catalogName, currentCatalogId])

    const isUrlOutdated = !!(isPublished && catalog?.share_slug && catalog.share_slug !== expectedSlug)

    // ─── Save ───────────────────────────────────────────────────────────
    // FIX(L12): Returns a Promise so callers (handleSaveAndExit) can await completion.
    const handleSave = useCallback((): Promise<string | null> => {
        let finalName = catalogName?.trim()
        if (!finalName) {
            const currentDate = new Date().toLocaleDateString('tr-TR')
            finalName = `${t("catalogs.newCatalog")} - ${currentDate}`
            setCatalogName(finalName)
        }

        return new Promise<string | null>((resolve, reject) => {
            startTransition(async () => {
                try {
                    const data = { ...getStateRef.current(), catalogName: finalName! }

                    if (currentCatalogId) {
                        await enqueueWrite(() => persist(currentCatalogId, data))
                        toast.success(t('toasts.catalogSaved'))
                        resolve(currentCatalogId)
                    } else {
                        setSaveStatus("saving")
                        const newCatalog = await enqueueWrite(() => createCatalog(buildCatalogPayload(data)))
                        setCurrentCatalogId(newCatalog.id)
                        markSaved(data)
                        setSaveStatus("saved")
                        toast.success(t('toasts.catalogCreated'))
                        refreshUser().catch(() => undefined)
                        router.replace(`/dashboard/builder?id=${newCatalog.id}`)
                        resolve(newCatalog.id)
                    }
                } catch (error) {
                    console.error('Catalog save error:', error)
                    setSaveStatus("error")
                    const errorMessage = error instanceof Error ? error.message : ''
                    toast.error(errorMessage ? `${t('toasts.catalogSaveFailed')}: ${errorMessage}` : t('toasts.catalogSaveFailed'))
                    reject(error)
                }
            })
        })
    }, [catalogName, currentCatalogId, t, setCatalogName, setCurrentCatalogId, markSaved, persist, enqueueWrite, refreshUser, router])

    // ─── Update Slug ────────────────────────────────────────────────────
    const handleUpdateSlug = useCallback(() => {
        if (!currentCatalogId) return

        startTransition(async () => {
            try {
                await enqueueWrite(() => updateCatalog(currentCatalogId, { share_slug: expectedSlug }))

                const { revalidateCatalogPublic } = await import("@/lib/actions/catalogs")
                if (catalog?.share_slug) {
                    await revalidateCatalogPublic(catalog.share_slug)
                }

                // The catalog prop owns the current public slug. Refresh it so
                // share/copy/view actions immediately use the new URL.
                router.refresh()

                toast.success(t('builder.slugUpdated'), { description: t('builder.slugUpdatedDesc') })
            } catch {
                toast.error(t('builder.slugUpdateFailed'))
            }
        })
    }, [currentCatalogId, expectedSlug, catalog?.share_slug, router, enqueueWrite, t])

    // ─── Publish / Unpublish ────────────────────────────────────────────
    const handlePublish = useCallback(() => {
        if (!currentCatalogId) {
            toast.error(t('toasts.saveCatalogFirst'))
            return
        }

        startTransition(async () => {
            try {
                const newPublishState = !isPublished
                // Yayınlarken (veya slug'ı yoksa) beklenen slug'ı kullan
                const shareSlug = !isPublished || !catalog?.share_slug ? expectedSlug : catalog.share_slug

                const data = await enqueueWrite(async () => {
                    const snapshot = getStateRef.current()
                    await updateCatalog(currentCatalogId, {
                        ...buildCatalogPayload(snapshot),
                        share_slug: shareSlug,
                    })
                    const { publishCatalog } = await import("@/lib/actions/catalogs")
                    await publishCatalog(currentCatalogId, newPublishState, shareSlug)
                    return snapshot
                })

                setIsPublished(newPublishState)
                markSaved(data)
                setSaveStatus("saved")

                if (newPublishState) {
                    const shareUrl = `${window.location.origin}/catalog/${shareSlug}`
                    toast.success(t('builder.catalogPublished'), {
                        description: t('builder.catalogPublishedDesc'),
                        action: {
                            label: t('builder.copyLinkAction'),
                            onClick: () => {
                                navigator.clipboard.writeText(shareUrl)
                                toast.success(t('toasts.linkCopied'))
                            }
                        }
                    })
                } else {
                    toast.success(t('builder.catalogUnpublished'), { description: t('builder.catalogUnpublishedDesc') })
                }
            } catch (error) {
                console.error("Publish error:", error)
                toast.error(t('builder.publishFailed'))
            }
        })
    }, [currentCatalogId, catalog?.share_slug, isPublished, expectedSlug, t, setIsPublished, markSaved, enqueueWrite])

    return {
        isPending,
        expectedSlug,
        isUrlOutdated,
        saveStatus,
        handleSave,
        handleUpdateSlug,
        handlePublish,
    }
}
