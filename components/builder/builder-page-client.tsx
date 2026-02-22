"use client"

import { CatalogEditor } from "@/components/builder/editor/catalog-editor"
import { CatalogPreview } from "@/components/builder/preview/catalog-preview"
import { UpgradeModal } from "@/components/builder/modals/upgrade-modal"
import { ShareModal } from "@/components/catalogs/share-modal"
import { useUser } from "@/lib/user-context"
import { type Catalog } from "@/lib/actions/catalogs"
import { type Product } from "@/lib/actions/products"
import { LightboxProvider, CatalogPreloader } from "@/lib/lightbox-context"
import { ImageLightbox } from "@/components/ui/image-lightbox"
import { SPLIT_PREVIEW_SOFT_LIMIT } from "@/components/builder/builder-utils"

import { BuilderToolbar } from "./toolbar/builder-toolbar"
import { ExitDialog } from "./modals/exit-dialog"
import { PreviewFloatingHeader } from "./toolbar/preview-floating-header"

import { useBuilderState } from "@/lib/hooks/use-builder-state"
import { useBuilderHandlers } from "@/lib/hooks/use-builder-handlers"

// ─── Types ──────────────────────────────────────────────────────────────────────

interface BuilderPageClientProps {
  catalog: Catalog | null
  products: Product[]
  productTotalCount?: number
  isProductListTruncated?: boolean
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function BuilderPageClient({
  catalog,
  products,
  productTotalCount,
  isProductListTruncated = false,
}: BuilderPageClientProps) {
  const { user } = useUser()

  const state = useBuilderState({ catalog, products })
  const handlers = useBuilderHandlers({ catalog, state })

  const { effectiveView, shouldUseSplitPreviewSampling, previewProducts } = state

  return (
    <LightboxProvider>
      <CatalogPreloader products={products} />
      <ImageLightbox />
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
              <CatalogEditor
                products={products}
                totalProductCount={productTotalCount}
                isProductListTruncated={isProductListTruncated}
                selectedProductIds={state.selectedProductIds}
                onSelectedProductIdsChange={state.handleSelectedProductIdsChange}
                description={state.catalogDescription}
                onDescriptionChange={state.setCatalogDescription}
                layout={state.layout}
                onLayoutChange={state.setLayout}
                primaryColor={state.primaryColor}
                onPrimaryColorChange={state.setPrimaryColor}
                headerTextColor={state.headerTextColor}
                onHeaderTextColorChange={state.setHeaderTextColor}
                showPrices={state.showPrices}
                onShowPricesChange={state.setShowPrices}
                showDescriptions={state.showDescriptions}
                onShowDescriptionsChange={state.setShowDescriptions}
                showAttributes={state.showAttributes}
                onShowAttributesChange={state.setShowAttributes}
                showSku={state.showSku}
                onShowSkuChange={state.setShowSku}
                showUrls={state.showUrls}
                onShowUrlsChange={state.setShowUrls}
                productImageFit={state.productImageFit}
                onProductImageFitChange={state.setProductImageFit}
                userPlan={user?.plan || "free"}
                onUpgrade={() => state.setShowUpgradeModal(true)}
                columnsPerRow={state.columnsPerRow}
                onColumnsPerRowChange={state.setColumnsPerRow}
                backgroundColor={state.backgroundColor}
                onBackgroundColorChange={state.setBackgroundColor}
                backgroundImage={state.backgroundImage}
                onBackgroundImageChange={state.setBackgroundImage}
                backgroundImageFit={state.backgroundImageFit}
                onBackgroundImageFitChange={(v) => state.setBackgroundImageFit(v)}
                backgroundGradient={state.backgroundGradient}
                onBackgroundGradientChange={state.setBackgroundGradient}
                logoUrl={state.logoUrl}
                onLogoUrlChange={state.setLogoUrl}
                logoPosition={state.logoPosition}
                onLogoPositionChange={(v) => state.setLogoPosition(v)}
                logoSize={state.logoSize}
                onLogoSizeChange={(v) => state.setLogoSize(v)}
                titlePosition={state.titlePosition}
                onTitlePositionChange={(v) => state.setTitlePosition(v)}
                enableCoverPage={state.enableCoverPage}
                onEnableCoverPageChange={state.setEnableCoverPage}
                coverImageUrl={state.coverImageUrl}
                onCoverImageUrlChange={state.setCoverImageUrl}
                coverDescription={state.coverDescription}
                onCoverDescriptionChange={state.setCoverDescription}
                enableCategoryDividers={state.enableCategoryDividers}
                onEnableCategoryDividersChange={state.setEnableCategoryDividers}
                coverTheme={state.coverTheme}
                onCoverThemeChange={state.setCoverTheme}
                showInSearch={state.showInSearch}
                onShowInSearchChange={state.setShowInSearch}
                catalogName={state.catalogName}
              />
            </div>
          )}

          {/* Preview */}
          {(effectiveView === "split" || effectiveView === "preview") && (
            <div
              id="catalog-preview-container"
              className={`${effectiveView === "split" ? "w-1/2" : "w-full"} bg-slate-100 dark:bg-[#03040a] overflow-auto`}
            >
              {shouldUseSplitPreviewSampling && (
                <div className="sticky top-0 z-20 px-3 py-2 text-xs border-b border-amber-200 bg-amber-50 text-amber-800">
                  Performans modu: bölünmüş görünümde ilk {SPLIT_PREVIEW_SOFT_LIMIT} ürün gösteriliyor.
                  Tam önizleme için &quot;Önizleme&quot; moduna geç.
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
                theme={state.coverTheme}
              />
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
          plan={user?.plan || "free"}
        />

        <ShareModal
          open={state.showShareModal}
          onOpenChange={state.setShowShareModal}
          catalog={catalog}
          isPublished={state.isPublished}
          shareUrl={catalog?.share_slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/catalog/${catalog.share_slug}` : ""}
          onDownloadPdf={handlers.handleDownloadPDF}
        />

        <ExitDialog
          open={state.showExitDialog}
          onOpenChange={state.setShowExitDialog}
          onExitWithoutSaving={handlers.handleExitWithoutSaving}
          onSaveAndExit={handlers.handleSaveAndExit}
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
              theme={state.coverTheme}
            />
          </div>
        )}
      </div>
    </LightboxProvider>
  )
}
