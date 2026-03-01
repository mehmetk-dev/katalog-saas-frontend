"use client"

import { CatalogEditor } from "@/components/builder/editor/catalog-editor"
import { CatalogPreview } from "@/components/builder/preview/catalog-preview"
import { UpgradeModal } from "@/components/builder/modals/upgrade-modal"
import { ShareModal } from "@/components/catalogs/share-modal"
import { type Catalog } from "@/lib/actions/catalogs"
import { type Product } from "@/lib/actions/products"
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
  productTotalCount?: number
  isProductListTruncated?: boolean
}

// ─── Root Component (Provider Wrapper) ──────────────────────────────────────────

export function BuilderPageClient({
  catalog,
  products,
  productTotalCount,
  isProductListTruncated = false,
}: BuilderPageClientProps) {
  return (
    <BuilderProvider
      catalog={catalog}
      products={products}
      productTotalCount={productTotalCount}
      isProductListTruncated={isProductListTruncated}
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
          hasUnpushedChanges={state.hasUnpushedChanges}
          isUrlOutdated={handlers.isUrlOutdated}
          isPending={handlers.isPending}
          view={state.view}
          onViewChange={handlers.handleViewChange}
          onSave={handlers.handleSave}
          onPublish={handlers.handlePublish}
          onPushUpdates={handlers.handlePushUpdates}
          onUpdateSlug={handlers.handleUpdateSlug}
          onShare={handlers.handleShare}
          onDownloadPDF={handlers.handleDownloadPDF}
          onExit={handlers.handleExit}
        />
      )}

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        {(effectiveView === "split" || effectiveView === "editor") && (
          <div className={`${effectiveView === "split" ? "w-1/2" : "w-full"} border-r overflow-auto`}>
            {/* FIX(F2): CatalogEditor reads all state from BuilderContext — no props needed */}
            <CatalogEditor />
          </div>
        )}

        {/* Preview */}
        {(effectiveView === "split" || effectiveView === "preview") && (
          <div
            id="catalog-preview-container"
            className={`${effectiveView === "split" ? "w-1/2" : "w-full"} bg-slate-100 dark:bg-[#03040a] overflow-auto`}
          >
            {!showPreview ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-full max-w-md p-6 space-y-4 animate-pulse">
                  <div className="aspect-[210/297] bg-slate-200 dark:bg-slate-800 rounded-lg" />
                </div>
              </div>
            ) : (
              <>
            {shouldUseSplitPreviewSampling && (
              <div className="sticky top-0 z-20 px-3 py-2 text-xs border-b border-amber-200 bg-amber-50 text-amber-800">
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
              coverDescription={state.coverDescription ?? undefined}
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
        shareUrl={catalog?.share_slug ? `${process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/catalog/${catalog.share_slug}` : ""}
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
        t={handlers.t}
      />

      {/* GHOST CONTAINER (PDF Export) */}
      {handlers.isExporting && (
        <div
          id="catalog-export-container"
          style={{
            position: 'fixed',
            top: 0,
            left: '-9999px',
            width: '1000px',
            zIndex: -100,
            opacity: 0,
            pointerEvents: 'none',
            overflow: 'visible'
          }}
        >
          <CatalogPreview
            catalogName={state.catalogName}
            products={state.selectedProducts}
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
            isExporting={true}
            enableCoverPage={state.enableCoverPage}
            coverImageUrl={state.coverImageUrl ?? undefined}
            coverDescription={state.coverDescription ?? undefined}
            enableCategoryDividers={state.enableCategoryDividers}
            categoryOrder={state.categoryOrder}
            theme={state.coverTheme}
          />
        </div>
      )}
    </div>
  )
}
