"use client"

import React from "react"

import {
    AppearanceSection,
    BrandingSection,
    BackgroundSection,
    StorytellingSection,
    TemplateSection,
} from "./design-sections"

/**
 * Tasarım sekmesi. Bölümler değerlerini builder state'inden (useBuilder) ve editör araçlarından
 * (CatalogEditor'daki DesignToolsProvider) kendileri okur; önceden ~70 değer ve setter prop olarak aktarılıyordu.
 */
export const EditorDesignTab = React.memo(function EditorDesignTab() {
    return (
        <div className="space-y-3">
            {/* Şablon kataloğun görünümünü en çok değiştiren karar — en üstte */}
            <TemplateSection />
            <AppearanceSection />
            <BrandingSection />
            <BackgroundSection />
            <StorytellingSection />
        </div>
    )
})
