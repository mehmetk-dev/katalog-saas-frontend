import { Image as ImageIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Catalog } from "@/lib/actions/catalogs"
import { useDesignProps } from "./design-context"
import { ColorField, Field, ImageField, SectionWrapper, Segmented } from "./section-wrapper"

const BACKGROUND_PRESETS = ['#ffffff', '#fafaf9', '#f4f4f5', '#fef7ed', '#f0f9ff', '#18181b']

const GRADIENTS = [
    { value: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', labelKey: 'builder.softSlate' },
    { value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', labelKey: 'builder.indigoNight' },
    { value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', labelKey: 'builder.pinkCloud' },
]

export function BackgroundSection() {
    const {
        t,
        openSections,
        toggleSection,
        backgroundColor,
        debouncedBackgroundColorChange,
        backgroundImage,
        onBackgroundImageChange,
        backgroundImageFit,
        onBackgroundImageFitChange,
        backgroundGradient,
        onBackgroundGradientChange,
        handleUploadClick,
        bgInputRef,
        handleFileUpload,
    } = useDesignProps()
    const pickImage = () => {
        handleUploadClick()
        bgInputRef.current?.click()
    }

    return (
        <SectionWrapper
            id="background"
            title={t('builder.backgroundSettings')}
            icon={<ImageIcon />}
            isOpen={!!openSections.background}
            onToggle={() => toggleSection('background')}
        >
            <div className="grid gap-4 sm:grid-cols-2">
                <ColorField
                    label={t('builder.bgColor')}
                    swatch={backgroundColor || '#ffffff'}
                    hex={backgroundColor || '#ffffff'}
                    presets={BACKGROUND_PRESETS}
                    onChange={debouncedBackgroundColorChange}
                />
                <Field label={t('builder.gradientEffect')}>
                    <Select value={backgroundGradient || 'none'} onValueChange={(v) => onBackgroundGradientChange?.(v === 'none' ? null : v)}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">{t('builder.solidColor')}</SelectItem>
                            {GRADIENTS.map((g) => (
                                <SelectItem key={g.value} value={g.value}>
                                    <span className="size-3.5 rounded-sm border" style={{ background: g.value }} />
                                    {t(g.labelKey)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
            </div>

            <div className="space-y-3 border-t pt-4">
                <ImageField
                    label={t('builder.bgImage')}
                    imageUrl={backgroundImage}
                    onPick={pickImage}
                    onRemove={onBackgroundImageChange ? () => onBackgroundImageChange(null) : undefined}
                    hint="PNG, JPG, WEBP"
                    pickLabel={t('builder.selectImage')}
                    changeLabel={t('builder.changeBtn')}
                    removeLabel={t('builder.removeImage')}
                />
                <input type="file" ref={bgInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'bg')} />

                {backgroundImage && (
                    <Field label={t('builder.imageView')}>
                        <Segmented
                            ariaLabel={t('builder.imageView')}
                            value={backgroundImageFit}
                            onChange={(v) => onBackgroundImageFitChange?.(v as NonNullable<Catalog['background_image_fit']>)}
                            options={[
                                { value: 'cover', label: t('builder.coverFit') },
                                { value: 'contain', label: t('builder.containFit') },
                                { value: 'fill', label: t('builder.fillFit') },
                            ]}
                        />
                    </Field>
                )}
            </div>
        </SectionWrapper>
    )
}
