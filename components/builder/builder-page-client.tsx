"use client"

import { CatalogEditor } from "@/components/builder/editor/catalog-editor"
import { CatalogPreview } from "@/components/builder/preview/catalog-preview"
import { UpgradeModal } from "@/components/builder/modals/upgrade-modal"
import { ShareModal } from "@/components/catalogs/share-modal"
import { type Catalog } from "@/lib/actions/catalogs"
import { type Product, type ProductsResponse } from "@/lib/actions/products"
import { LightboxProvider, CatalogPreloader } from "@/lib/contexts/lightbox-context"
import { ImageLightbox } from "@/components/ui/image-lightbox"
import { SPLIT_PREVIEW_SOFT_LIMIT } from "@/components/builder/builder-utils"
import { useTranslation } from "@/lib/contexts/i18n-provider"

import React from "react"
import { BuilderToolbar } from "./toolbar/builder-toolbar"
import { ExitDialog } from "./modals/exit-dialog"
import { PreviewFloatingHeader } from "./toolbar/preview-floating-header"
import { PdfProgressModal } from "@/components/ui/pdf-progress-modal"

// FIX(F2): Context-based architecture — replaces 60+ prop drilling
import { BuilderProvider, useBuilder } from "./builder-context"

// ─── Types ──────────────────────────────────────────────────────────────────────

interface BuilderPageClientProps {
  catalog: Catalog | null
  products: Product[]
  initialProductsResponse: ProductsResponse
}

// ─── Root Component (Provider Wrapper) ──────────────────────────────────────────

export function BuilderPageClient({
  catalog,
  products,
  initialProductsResponse,
}: BuilderPageClientProps) {
  return (
    <BuilderProvider
      catalog={catalog}
      products={products}
      initialProductsResponse={initialProductsResponse}
    >
      <LightboxProvider>
        <CatalogPreloader products={products} />
        <ImageLightbox />
        <BuilderContent />
      </LightboxProvider>
    </BuilderProvider>
  )
}

// ─── Inner Content (Consumes Context) ───────────────────────────────────────────

function BuilderContent() {
  const { state, handlers, catalog, userPlan } = useBuilder()
  const { t } = useTranslation()

  // PERF: Defer preview panel mount — let the editor render first for faster TTI.
  // In split view, the heavy CatalogPreview (template dynamic imports + page calculation)
  // is deferred to the next frame so the editor becomes interactive immediately.
  const [previewReady, setPreviewReady] = React.useState(false)
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setPreviewReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const { effectiveView, shouldUseSplitPreviewSampling, previewProducts } = state

  const showPreview = previewReady || effectiveView === "preview"

  useBuilderShortcuts({
    onSave: handlers.handleSave,
    onUndo: state.undo,
    onRedo: state.redo,
  })

  const { splitPercent, splitContainerRef, onResizeStart, onResizeKeyDown, resetSplit } = useSplitResize()
  const isSplit = effectiveView === "split"

  return (
    <div className="builder-page h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] flex flex-col -m-3 sm:-m-4 md:-m-6 overflow-hidden">
      {/* Header */}
      {state.view !== "preview" && (
        <BuilderToolbar
          catalog={catalog}
          catalogName={state.catalogName}
          onCatalogNameChange={handlers.handleCatalogNameChange}
          isMobile={state.isMobile}
          isPublished={state.isPublished}
          hasUnsavedChanges={state.hasUnsavedChanges}
          isUrlOutdated={handlers.isUrlOutdated}
          isPending={handlers.isPending}
          view={state.view}
          onViewChange={handlers.handleViewChange}
          onSave={handlers.handleSave}
          onPublish={handlers.handlePublish}
          onUpdateSlug={handlers.handleUpdateSlug}
          onShare={handlers.handleShare}
          onDownloadPDF={handlers.handleDownloadPDF}
          onExit={handlers.handleExit}
          saveStatus={handlers.saveStatus}
          canUndo={state.canUndo}
          canRedo={state.canRedo}
          onUndo={state.undo}
          onRedo={state.redo}
        />
      )}

      {/* Content */}
      <div ref={splitContainerRef} className="flex-1 flex overflow-hidden">
        {/* Editor */}
        {(isSplit || effectiveView === "editor") && (
          <div
            className={isSplit ? "shrink-0 overflow-auto" : "w-full overflow-auto"}
            style={isSplit ? { width: `${splitPercent}%` } : undefined}
          >
            {/* FIX(F2): CatalogEditor reads all state from BuilderContext — no props needed */}
            <CatalogEditor />
          </div>
        )}

        {isSplit && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label={t('builder.resizePanels')}
            aria-valuenow={Math.round(splitPercent)}
            aria-valuemin={SPLIT_MIN_PERCENT}
            aria-valuemax={SPLIT_MAX_PERCENT}
            tabIndex={0}
            onPointerDown={onResizeStart}
            onKeyDown={onResizeKeyDown}
            onDoubleClick={resetSplit}
            className="group relative w-px shrink-0 cursor-col-resize bg-border outline-none focus-visible:bg-ring"
          >
            {/* Geniş, görünmez tutma alanı */}
            <span className="absolute inset-y-0 -left-1.5 -right-1.5" />
            <span className="absolute left-1/2 top-1/2 h-10 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-border transition-colors group-hover:bg-ring group-focus-visible:bg-ring" />
          </div>
        )}

        {/* Preview */}
        {(isSplit || effectiveView === "preview") && (
          <div
            id="catalog-preview-container"
            className="min-w-0 flex-1 bg-muted overflow-auto"
          >
            {!showPreview ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-full max-w-md p-6 space-y-4 animate-pulse">
                  <div className="aspect-[210/297] bg-accent rounded-lg" />
                </div>
              </div>
            ) : (
              <>
                {shouldUseSplitPreviewSampling && (
                  <div className="sticky top-0 z-20 px-3 py-2 text-xs border-b border-warning/30 bg-warning-soft text-warning-soft-foreground">
                    {t('builder.splitPreviewMode', { limit: SPLIT_PREVIEW_SOFT_LIMIT })}
                  </div>
                )}

                <CatalogPreview
                  catalogName={state.catalogName}
                  products={previewProducts}
                  layout={state.layout}
                  primaryColor={state.primaryColor}
                  headerTextColor={state.headerTextColor}
                  showPrices={state.showPrices}
                  showDescriptions={state.showDescriptions}
                  showAttributes={state.showAttributes}
                  showSku={state.showSku}
                  showUrls={state.showUrls}
                  productImageFit={state.productImageFit}
                  columnsPerRow={state.columnsPerRow}
                  backgroundColor={state.backgroundColor}
                  backgroundImage={state.backgroundImage}
                  backgroundImageFit={state.backgroundImageFit as 'cover' | 'contain' | 'fill' | undefined}
                  backgroundGradient={state.backgroundGradient}
                  logoUrl={state.logoUrl ?? undefined}
                  logoPosition={state.logoPosition ?? undefined}
                  logoSize={state.logoSize}
                  titlePosition={state.titlePosition}
                  enableCoverPage={state.enableCoverPage}
                  coverImageUrl={state.coverImageUrl ?? undefined}
                  coverDescription={state.coverDescription || state.catalogDescription || undefined}
                  enableCategoryDividers={state.enableCategoryDividers}
                  categoryOrder={state.categoryOrder}
                  theme={state.coverTheme}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* Preview Mode Floating Header */}
      <PreviewFloatingHeader
        view={state.view}
        onViewChange={state.setView}
        catalogName={state.catalogName}
        onPublish={handlers.handlePublish}
        onDownloadPDF={handlers.handleDownloadPDF}
      />

      <UpgradeModal
        open={state.showUpgradeModal}
        onOpenChange={state.setShowUpgradeModal}
        plan={userPlan}
      />

      <ShareModal
        open={state.showShareModal}
        onOpenChange={state.setShowShareModal}
        catalog={catalog}
        isPublished={state.isPublished}
        shareUrl={catalog?.share_slug && process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/catalog/${catalog.share_slug}` : ""}
        onDownloadPdf={handlers.handleDownloadPDF}
      />

      <ExitDialog
        open={state.showExitDialog}
        onOpenChange={state.setShowExitDialog}
        onExitWithoutSaving={handlers.handleExitWithoutSaving}
        onSaveAndExit={handlers.handleSaveAndExit}
      />

      {/* PDF Progress Modal */}
      <PdfProgressModal
        state={handlers.pdfProgress}
        onCancel={handlers.pdfProgress.phase === 'done' || handlers.pdfProgress.phase === 'error' || handlers.pdfProgress.phase === 'cancelled'
          ? handlers.closePdfModal
          : handlers.cancelExport
        }
        onDismiss={handlers.dismissPdfModal}
        t={handlers.t}
      />

    </div>
  )
}

// ─── Keyboard shortcuts ─────────────────────────────────────────────────────────

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
}

/** Ctrl/Cmd+S kaydet, Ctrl/Cmd+Z geri al, Ctrl/Cmd+Shift+Z veya Ctrl+Y yinele.
 *  Yazı alanlarında geri al/yinele tarayıcının kendi metin geçmişine bırakılır. */
function useBuilderShortcuts({ onSave, onUndo, onRedo }: { onSave: () => Promise<unknown>; onUndo: () => void; onRedo: () => void }) {
  const handlersRef = React.useRef({ onSave, onUndo, onRedo })
  React.useEffect(() => {
    handlersRef.current = { onSave, onUndo, onRedo }
  }, [onSave, onUndo, onRedo])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return
      const key = e.key.toLowerCase()

      if (key === "s") {
        e.preventDefault()
        handlersRef.current.onSave().catch(() => undefined)
        return
      }
      if (isEditableTarget(e.target)) return
      if (key === "z" && !e.shiftKey) {
        e.preventDefault()
        handlersRef.current.onUndo()
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault()
        handlersRef.current.onRedo()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])
}

// ─── Resizable split ────────────────────────────────────────────────────────────

const SPLIT_DEFAULT_PERCENT = 50
const SPLIT_MIN_PERCENT = 30
const SPLIT_MAX_PERCENT = 70
const SPLIT_STORAGE_KEY = "builder-split-percent"

function clampSplit(value: number) {
  return Math.min(SPLIT_MAX_PERCENT, Math.max(SPLIT_MIN_PERCENT, value))
}

/** Editör / önizleme oranı: sürükle veya ok tuşları; tercih tarayıcıda hatırlanır. */
function useSplitResize() {
  const [splitPercent, setSplitPercent] = React.useState(SPLIT_DEFAULT_PERCENT)
  const splitContainerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    try {
      const stored = Number(window.localStorage.getItem(SPLIT_STORAGE_KEY))
      if (stored) setSplitPercent(clampSplit(stored))
    } catch {
      // localStorage erişilemiyorsa varsayılan oranla devam et
    }
  }, [])

  const commit = React.useCallback((value: number) => {
    const next = clampSplit(value)
    setSplitPercent(next)
    try {
      window.localStorage.setItem(SPLIT_STORAGE_KEY, String(next))
    } catch {
      // yok say
    }
  }, [])

  const onResizeStart = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const container = splitContainerRef.current
    if (!container) return
    e.preventDefault()
    const rect = container.getBoundingClientRect()
    const previousCursor = document.body.style.cursor
    const previousSelect = document.body.style.userSelect
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"

    const handleMove = (ev: PointerEvent) => {
      setSplitPercent(clampSplit(((ev.clientX - rect.left) / rect.width) * 100))
    }
    const handleUp = (ev: PointerEvent) => {
      commit(((ev.clientX - rect.left) / rect.width) * 100)
      document.body.style.cursor = previousCursor
      document.body.style.userSelect = previousSelect
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("pointerup", handleUp)
    }
    window.addEventListener("pointermove", handleMove)
    window.addEventListener("pointerup", handleUp)
  }, [commit])

  const onResizeKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); commit(splitPercent - 5) }
    else if (e.key === "ArrowRight") { e.preventDefault(); commit(splitPercent + 5) }
    else if (e.key === "Home") { e.preventDefault(); commit(SPLIT_DEFAULT_PERCENT) }
  }, [commit, splitPercent])

  const resetSplit = React.useCallback(() => commit(SPLIT_DEFAULT_PERCENT), [commit])

  return { splitPercent, splitContainerRef, onResizeStart, onResizeKeyDown, resetSplit }
}
