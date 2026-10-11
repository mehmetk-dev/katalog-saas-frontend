'use client'
// GEÇİCİ: görsel QA için — commit'lenmeyecek
import { useState } from 'react'

import { OnboardingModal } from '@/components/auth/onboarding-modal'
import { UpgradeModal } from '@/components/builder/modals/upgrade-modal'
import { ExitDialog } from '@/components/builder/modals/exit-dialog'
import { UnsavedDialog } from '@/components/excel/toolbar/unsaved-dialog'
import { DeleteAlertDialog } from '@/components/products/table/components/delete-alert-dialog'
import { ProductsBulkPriceModal } from '@/components/products/bulk/bulk-price-modal'
import { BulkImageUploadModal } from '@/components/products/bulk/bulk-image-upload-modal'
import { ProductPreviewDialog } from '@/components/products/table/components/product-preview-dialog'
import { PdfProgressModal, type PdfProgressState } from '@/components/ui/pdf-progress-modal'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useTranslation } from '@/lib/contexts/i18n-provider'

import { products } from '../data'

const pdf: Record<string, PdfProgressState> = {
    'pdf-rendering': { phase: 'rendering', currentPage: 3, totalPages: 8, percent: 42, estimatedTimeLeft: '~20 sn' },
    'pdf-queued': { phase: 'queued', currentPage: 0, totalPages: 8, percent: 0, estimatedTimeLeft: '' },
    'pdf-done': { phase: 'done', currentPage: 8, totalPages: 8, percent: 100, estimatedTimeLeft: '', downloadUrl: '#' },
    'pdf-error': { phase: 'error', currentPage: 3, totalPages: 8, percent: 42, estimatedTimeLeft: '', errorMessage: 'Sunucu yanıt vermedi.' },
}

export function Gallery({ m }: { m: string }) {
    const { t: baseT } = useTranslation()
    const t = (k: string, p?: Record<string, unknown>) => baseT(k, p) as string
    const [ids, setIds] = useState<string[]>(products.slice(0, 3).map((p) => p.id))
    const noop = () => {}
    return (
        <div className="min-h-dvh bg-background p-8">
            {m === 'onboarding' && <OnboardingModal open onOpenChange={noop} />}
            {m === 'upgrade' && <UpgradeModal open onOpenChange={noop} />}
            {m === 'exit' && <ExitDialog open onOpenChange={noop} onExitWithoutSaving={noop} onSaveAndExit={noop} />}
            {m === 'unsaved' && <UnsavedDialog open onOpenChange={noop} dirtyCount={4} onConfirmLeave={noop} />}
            {m === 'delete' && <DeleteAlertDialog deleteId="p1" deleteCatalogs={[{ id: 'c1', name: 'Yaz Koleksiyonu 2026' }, { id: 'c2', name: 'Ofis Mobilyaları' }]} isPending={false} onClose={noop} onConfirm={noop} t={t} />}
            {m === 'bulkprice' && <ProductsBulkPriceModal open onOpenChange={noop} selectedIds={ids} onSelectedIdsChange={setIds} paginatedProducts={products as never} priceChangeType="increase" onPriceChangeTypeChange={noop} priceChangeMode="percentage" onPriceChangeModeChange={noop} priceChangeAmount={10} onPriceChangeAmountChange={noop} onUpdate={noop} isPending={false} />}
            {m === 'bulkimage' && <BulkImageUploadModal open onOpenChange={noop} products={products as never} onSuccess={noop} />}
            {m === 'preview' && (
                <Dialog open>
                    <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                        <ProductPreviewDialog product={{ ...products[0], images: [products[0].image_url!, products[1].image_url!] } as never} onEdit={noop} onClose={noop} />
                    </DialogContent>
                </Dialog>
            )}
            {pdf[m] && <PdfProgressModal state={pdf[m]} onCancel={noop} onDismiss={noop} t={t} />}
        </div>
    )
}
