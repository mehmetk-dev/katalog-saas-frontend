"use client"

import { PublicHeader } from "@/components/layout/public-header"
import { DemoBuilder } from "@/components/demo/demo-builder"

export default function CreateDemoPage() {
    return (
        <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
            <PublicHeader fullWidth={true} />
            <main className="flex-1 flex flex-col min-h-0 pt-16">
                <DemoBuilder />
            </main>
        </div>
    )
}
