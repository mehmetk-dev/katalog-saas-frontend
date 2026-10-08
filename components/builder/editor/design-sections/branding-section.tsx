import { Stamp } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Catalog } from "@/lib/actions/catalogs"
import type { BrandingSectionProps } from "./types"
import { ColorField, Field, ImageField, SectionWrapper } from "./section-wrapper"

/** Katalog vurgu rengi için hızlı seçenekler (müşterinin kataloğu — uygulama teması değil) */
const ACCENT_PRESETS = ['#cf1414', '#18181b', '#2563eb', '#0f766e', '#d97706', '#7c3aed', '#db2777', '#475569']
const TEXT_PRESETS = ['#000000', '#18181b', '#475569', '#ffffff']

export function BrandingSection({
    t,
    openSections,
    toggleSection,
    logoUrl,
    onLogoUrlChange,
    onLogoPositionChange,
    logoPosition,
    logoSize,
    onLogoSizeChange,
    titlePosition,
    onTitlePositionChange,
    primaryColor,
    primaryColorParsed,
    debouncedPrimaryColorChange,
    headerTextColor,
    debouncedHeaderTextColorChange,
    handleUploadClick,
    handleFileUpload,
    logoInputRef,
}: BrandingSectionProps) {
    const pickLogo = () => {
        handleUploadClick()
        logoInputRef.current?.click()
    }

    return (
        <SectionWrapper
            id="branding"
            title={t('builder.logoBranding')}
            icon={<Stamp />}
            isOpen={!!openSections.branding}
            onToggle={() => toggleSection('branding')}
        >
            <div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
                <ImageField
                    label={t('builder.logoUpload')}
                    imageUrl={logoUrl}
                    onPick={pickLogo}
                    onRemove={onLogoUrlChange ? () => onLogoUrlChange(null) : undefined}
                    hint="PNG, WEBP"
                    pickLabel={t('builder.selectLogo')}
                    changeLabel={t('builder.changeBtn')}
                    removeLabel={t('builder.removeBtn')}
                    previewClassName="h-24"
                />
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />

                <div className="grid content-start gap-3 sm:grid-cols-2">
                    <Field label={t('builder.logoPosition')}>
                        <Select value={logoPosition || 'none'} onValueChange={(v) => onLogoPositionChange?.(v as NonNullable<Catalog['logo_position']>)}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">{t('builder.hideLabel')}</SelectItem>
                                <SelectItem value="header-left">{t('builder.posTopLeft')}</SelectItem>
                                <SelectItem value="header-center">{t('builder.posTopCenter')}</SelectItem>
                                <SelectItem value="header-right">{t('builder.posTopRight')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field label={t('builder.logoSizeLabel')}>
                        <Select value={logoSize || 'medium'} onValueChange={(v) => onLogoSizeChange?.(v as NonNullable<Catalog['logo_size']>)}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="small">{t('builder.sizeSmall')}</SelectItem>
                                <SelectItem value="medium">{t('builder.sizeMedium')}</SelectItem>
                                <SelectItem value="large">{t('builder.sizeLarge')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field label={t('builder.titleAlignment')} className="sm:col-span-2">
                        <Select value={titlePosition || 'left'} onValueChange={(v) => onTitlePositionChange?.(v as NonNullable<Catalog['title_position']>)}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="left">{t('builder.alignLeft')}</SelectItem>
                                <SelectItem value="center">{t('builder.alignCenter')}</SelectItem>
                                <SelectItem value="right">{t('builder.alignRight')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                </div>
            </div>

            <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
                <ColorField
                    label={t('builder.headerCard')}
                    swatch={primaryColor}
                    hex={primaryColorParsed.hexColor}
                    presets={ACCENT_PRESETS}
                    onChange={(hex) => {
                        const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16)
                        debouncedPrimaryColorChange(`rgba(${r}, ${g}, ${b}, ${primaryColorParsed.rgb.a})`)
                    }}
                />
                <ColorField
                    label={t('builder.textColor')}
                    swatch={headerTextColor || '#ffffff'}
                    hex={headerTextColor || '#ffffff'}
                    presets={TEXT_PRESETS}
                    onChange={debouncedHeaderTextColorChange}
                />
            </div>
        </SectionWrapper>
    )
}
