"use client"

import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import {
    HeroSection,
    BulkUploadSection,
    ShareSection,
    PublishSection,
    QrPdfSection,
    BentoGridSection,
    CtaSection,
} from "@/components/features"

export default function FeaturesPage() {
    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100">
            <PublicHeader />

            <main className="pt-32 pb-24 md:pt-40 md:pb-32 px-4 overflow-hidden">
                {/* Ambient Background */}
                <div className="fixed inset-0 pointer-events-none -z-10">
                    <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vh] bg-indigo-50/80 rounded-full blur-[150px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vh] bg-blue-50/80 rounded-full blur-[150px]"></div>
                </div>

                <HeroSection />
                <BulkUploadSection />
                <ShareSection />
                <PublishSection />
                <QrPdfSection />
                <BentoGridSection />
                <CtaSection />
            </main>

            <PublicFooter />
        </div>
    )
}
