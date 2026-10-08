import { LayoutGrid } from "lucide-react"
import type { AppearanceSectionProps } from "./types"
import { Field, Segmented, SectionWrapper, ToggleRow } from "./section-wrapper"

export function AppearanceSection({
    t,
    openSections,
    toggleSection,
    layout,
    showPrices,
    onShowPricesChange,
    showDescriptions,
    onShowDescriptionsChange,
    showAttributes,
    onShowAttributesChange,
    showSku,
    onShowSkuChange,
    showUrls,
    onShowUrlsChange,
    productImageFit,
    onProductImageFitChange,
    columnsPerRow,
    onColumnsPerRowChange,
    availableColumns,
}: AppearanceSectionProps) {
    const attributesDisabled = layout === 'magazine'

    return (
        <SectionWrapper
            id="appearance"
            title={t('builder.designSettings')}
            icon={<LayoutGrid />}
            isOpen={!!openSections.appearance}
            onToggle={() => toggleSection('appearance')}
        >
            <div className="space-y-3">
                <ToggleRow label={t('builder.showPrices')} checked={showPrices} onCheckedChange={onShowPricesChange} />
                <ToggleRow label={t('builder.showDescriptions')} checked={showDescriptions} onCheckedChange={onShowDescriptionsChange} />
                <ToggleRow
                    label={t('builder.showAttributes')}
                    description={attributesDisabled ? t('builder.notInMagazine') : undefined}
                    checked={showAttributes && !attributesDisabled}
                    onCheckedChange={onShowAttributesChange}
                    disabled={attributesDisabled}
                />
                <ToggleRow label={t('builder.showSku')} checked={showSku} onCheckedChange={onShowSkuChange} />
                <ToggleRow label={t('builder.showUrls')} checked={showUrls} onCheckedChange={onShowUrlsChange} />
            </div>

            <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
                <Field label={t('builder.productImages')}>
                    <Segmented
                        ariaLabel={t('builder.productImages')}
                        value={productImageFit}
                        onChange={onProductImageFitChange}
                        options={[
                            { value: 'cover', label: t('builder.productImageFit.crop') },
                            { value: 'contain', label: t('builder.productImageFit.fit') },
                            { value: 'fill', label: t('builder.productImageFit.fill') },
                        ]}
                    />
                </Field>

                <Field label={t('builder.layoutView')}>
                    {availableColumns.length > 1 ? (
                        <Segmented
                            ariaLabel={t('builder.layoutView')}
                            value={columnsPerRow}
                            onChange={onColumnsPerRowChange}
                            options={availableColumns.map((num) => ({ value: num, label: `${num} ${t('builder.column')}` }))}
                        />
                    ) : (
                        <p className="flex h-9 items-center text-xs text-muted-foreground">{t('builder.layoutFixed')}</p>
                    )}
                </Field>
            </div>
        </SectionWrapper>
    )
}
