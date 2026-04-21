"use client"

import { useState, useRef, useEffect, useMemo, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { type Catalog, createCatalog, updateCatalog } from "@/lib/actions/catalogs"
import { slugify, type BuilderCatalogData, buildCatalogPayload, buildSavedStateSnapshot } from "@/components/builder/builder-utils"

export type SavedState = ReturnType<typeof buildSavedStateSnapshot>

interface UseCatalogActionsOptions {
    currentCatalogId: string | null
    catalog: Catalog | null
    isPublished: boolean
    user: { company?: string; name?: string; plan?: string } | null
    /** A callback returning current builder state - called at action-time to avoid stale closures */
    getState: () => BuilderCatalogData
    catalogName: string
    hasUnsavedChanges: boolean
    isDirty: boolean
    // Setters
    setCatalogName: (name: string) => void
    setCurrentCatalogId: (id: string | null) => void
    setLastSavedState: (state: SavedState) => void
    setIsDirty: (dirty: boolean) => void
    setIsPublished: (published: boolean) => void
    setHasUnpushedChanges: (unpushed: boolean) => void
    refreshUser: () => void
    t: (key: string, params?: Record<string, unknown>) => string
}

export function useCatalogActions({
    currentCatalogId,
    catalog,
    isPublished,
    user,
    getState,
    catalogName,
    hasUnsavedChanges,
    isDirty,
    setCatalogName,
    setCurrentCatalogId,
    setLastSavedState,
    setIsDirty,
    setIsPublished,
    setHasUnpushedChanges,
    refreshUser,
    t,
}: UseCatalogActionsOptions) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    // ─── Autosave ───────────────────────────────────────────────────────
    const [, setIsAutoSaving] = useState(false)
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const isSavingRef = useRef(false)
    // FIX(L7): Guard against state updates after unmount
    const isMountedRef = useRef(true)
    useEffect(() => { return () => { isMountedRef.current = false } }, [])

    // Ref for autosave to read fresh state without stale closure
    const getStateRef = useRef(getState)
    getStateRef.current = getState

    useEffect(() => {
        if (!currentCatalogId || !hasUnsavedChanges) return

        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current)
        }

        autoSaveTimeoutRef.current = setTimeout(async () => {
            // Guard: prevent concurrent autosaves (race condition fix)
            if (isSavingRef.current || !isMountedRef.current) return
            isSavingRef.current = true

            const data = getStateRef.current()
            if (isMountedRef.current) setIsAutoSaving(true)
            try {
                await updateCatalog(currentCatalogId, buildCatalogPayload(data))

                if (!isMountedRef.current) return
                setLastSavedState(buildSavedStateSnapshot(data))
                setIsDirty(false)
                if (data.isPublished) {
                    setHasUnpushedChanges(true)
                }
                // PERF(K1): No router.refresh() — client state already in sync.
                // server action revalidatePath handles cache invalidation for other routes.
            } catch (error) {
                console.error('Autosave failed:', error)
            } finally {
                if (isMountedRef.current) setIsAutoSaving(false)
                isSavingRef.current = false
            }
        }, 3000)

        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentCatalogId, isDirty])

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
    const handleSave = useCallback((): Promise<void> => {
        let finalName = catalogName?.trim()
        if (!finalName) {
            const currentDate = new Date().toLocaleDateString('tr-TR')
            finalName = `${t("catalogs.newCatalog") || "Yeni Katalog"} - ${currentDate}`
            setCatalogName(finalName)
        }

        return new Promise<void>((resolve, reject) => {
            startTransition(async () => {
                try {
                    const data = getStateRef.current()
                    // Override name with the final validated name
                    data.catalogName = finalName!

                    if (currentCatalogId) {
                        await updateCatalog(currentCatalogId, buildCatalogPayload(data))
                        toast.success(t('toasts.catalogSaved') as string)
                    } else {
                        const newCatalog = await createCatalog(buildCatalogPayload(data))
                        setCurrentCatalogId(newCatalog.id)
                        toast.success(t('toasts.catalogCreated') as string)
                        refreshUser()
                        router.replace(`/dashboard/builder?id=${newCatalog.id}`)
                    }

                    setLastSavedState(buildSavedStateSnapshot(data))
                    setIsDirty(false)
                    if (isPublished) {
                        setHasUnpushedChanges(true)
                    }
                    // PERF(K2): No router.refresh() — server action already called
                    // revalidatePath("/dashboard", "layout"); builder client state is fresh.
                    resolve()
                } catch (error) {
                    console.error('Catalog save error:', error)
                    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
                    toast.error(`${t('toasts.catalogSaveFailed') as string}: ${errorMessage}`)
                    reject(error)
                }
            })
        })
    }, [catalogName, currentCatalogId, isPublished, t, setCatalogName, setCurrentCatalogId, setLastSavedState, setIsDirty, setHasUnpushedChanges, refreshUser, router])

    // ─── Push Updates ───────────────────────────────────────────────────
    const handlePushUpdates = useCallback(() => {
        if (!currentCatalogId) return

        startTransition(async () => {
            try {
                const data = getStateRef.current()
                await updateCatalog(currentCatalogId, buildCatalogPayload(data))

                const shareSlug = catalog?.share_slug
                if (shareSlug) {
                    const { revalidateCatalogPublic } = await import("@/lib/actions/catalogs")
                    await revalidateCatalogPublic(shareSlug)
                }

                setHasUnpushedChanges(false)
                setIsDirty(false)
                setLastSavedState(buildSavedStateSnapshot(data))
                toast.success("Yayındaki katalog güncellendi! 🚀")
                // PERF(K2): No router.refresh() — revalidateCatalogPublic handles public page cache.
            } catch (error) {
                console.error('Catalog publish/push error:', error)
                const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
                toast.error(`Güncelleme sırasında bir hata oluştu: ${errorMessage}`)
            }
        })
    }, [currentCatalogId, catalog?.share_slug, setHasUnpushedChanges, setIsDirty, setLastSavedState])

    // ─── Update Slug ────────────────────────────────────────────────────
    const handleUpdateSlug = useCallback(() => {
        if (!currentCatalogId) return

        startTransition(async () => {
            try {
                await updateCatalog(currentCatalogId, { share_slug: expectedSlug })

                const { revalidateCatalogPublic } = await import("@/lib/actions/catalogs")
                if (catalog?.share_slug) {
                    await revalidateCatalogPublic(catalog.share_slug)
                }
                await revalidateCatalogPublic(expectedSlug)

                toast.success("Katalog linki güncellendi!", {
                    description: "Yeni link oluşturuldu."
                })
            } catch {
                toast.error("Link güncellenirken hata oluştu.")
            }
        })
    }, [currentCatalogId, expectedSlug, catalog?.share_slug])

    // ─── Publish / Unpublish ────────────────────────────────────────────
    const handlePublish = useCallback(() => {
        if (!currentCatalogId) {
            toast.error(t('toasts.saveCatalogFirst') as string)
            return
        }

        startTransition(async () => {
            try {
                const data = getStateRef.current()

                // Determine slug
                let shareSlug = catalog?.share_slug
                if (!isPublished) {
                    shareSlug = expectedSlug
                } else if (!shareSlug) {
                    shareSlug = expectedSlug
                }

                await updateCatalog(currentCatalogId, {
                    ...buildCatalogPayload(data),
                    share_slug: shareSlug,
                })

                const newPublishState = !isPublished
                const { publishCatalog: publishCatalogAction, revalidateCatalogPublic } = await import("@/lib/actions/catalogs")
                await publishCatalogAction(currentCatalogId, newPublishState, shareSlug)

                if (newPublishState && shareSlug) {
                    await revalidateCatalogPublic(shareSlug)
                }

                setIsPublished(newPublishState)
                setHasUnpushedChanges(false)
                setIsDirty(false)

                if (newPublishState) {
                    const shareUrl = `${window.location.origin}/catalog/${shareSlug}`
                    toast.success("Katalog başarıyla yayınlandı! 🎉", {
                        description: "Artık herkes tarafından görüntülenebilir.",
                        action: {
                            label: "Linki Kopyala",
                            onClick: () => {
                                navigator.clipboard.writeText(shareUrl)
                                toast.success(t('toasts.linkCopied') as string)
                            }
                        }
                    })
                } else {
                    toast.success("Katalog yayından kaldırıldı.", {
                        description: "Mevcut link artık çalışmayacaktır."
                    })
                }
            } catch (error) {
                console.error("Publish error:", error)
                toast.error("İşlem sırasında bir hata oluştu.")
            }
        })
    }, [currentCatalogId, catalog?.share_slug, isPublished, expectedSlug, t, setIsPublished, setHasUnpushedChanges, setIsDirty])

    return {
        isPending,
        expectedSlug,
        isUrlOutdated,
        handleSave,
        handlePushUpdates,
        handleUpdateSlug,
        handlePublish,
    }
}
