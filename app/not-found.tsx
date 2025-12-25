"use client"

import Link from "next/link"
import { Home, ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n-provider"

export default function NotFound() {
    const { t } = useTranslation()

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center px-6">
            <div className="max-w-md w-full text-center">
                {/* Large 404 Number - Apple Style */}
                <h1 className="text-[180px] sm:text-[220px] font-bold leading-none tracking-tighter text-gray-200 dark:text-gray-800 select-none">
                    404
                </h1>

                {/* Content */}
                <div className="-mt-8 space-y-3">
                    <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">
                        {t('notFound.title')}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed">
                        {t('notFound.text')}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        asChild
                        size="lg"
                        className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-8"
                    >
                        <Link href="/">
                            <Home className="w-4 h-4 mr-2" />
                            {t('notFound.home')}
                        </Link>
                    </Button>
                    <Button
                        asChild
                        variant="ghost"
                        size="lg"
                        className="text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 rounded-full"
                    >
                        <Link href="/dashboard">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {t('notFound.dashboard')}
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
