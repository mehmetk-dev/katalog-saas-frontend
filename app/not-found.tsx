"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, Home, ArrowLeft, Search, FileQuestion } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "@/lib/i18n-provider"

export default function NotFound() {
    const [mounted, setMounted] = useState(false)
    const { t } = useTranslation()

    useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-indigo-100 flex items-center justify-center p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-64 h-64 bg-violet-200/30 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-100/20 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-2xl w-full">
                {/* 404 Catalog Card */}
                <div
                    className={`bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                        }`}
                >
                    {/* Header - Catalog Style */}
                    <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 sm:p-8 text-center relative overflow-hidden">
                        {/* Decorative circles */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

                        <div className="relative">
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
                                <BookOpen className="w-4 h-4 text-white/80" />
                                <span className="text-white/80 text-sm font-medium">CatalogPro</span>
                            </div>
                            <h1 className="text-7xl sm:text-8xl font-bold text-white mb-2 tracking-tight">
                                404
                            </h1>
                            <p className="text-white/80 text-lg sm:text-xl">
                                {t('notFound.title')}
                            </p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 sm:p-8">
                        {/* Error Illustration */}
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <div className="w-24 h-24 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                                    <FileQuestion className="w-12 h-12 text-violet-500" />
                                </div>
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                    <Search className="w-4 h-4 text-red-500" />
                                </div>
                            </div>
                        </div>

                        <div className="text-center space-y-4 mb-8">
                            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                                {t('notFound.desc')}
                            </h2>
                            <p className="text-gray-500 max-w-md mx-auto">
                                {t('notFound.text')}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button
                                asChild
                                size="lg"
                                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25"
                            >
                                <Link href="/">
                                    <Home className="w-4 h-4 mr-2" />
                                    {t('notFound.home')}
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                size="lg"
                                className="border-2"
                            >
                                <Link href="/dashboard">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    {t('notFound.dashboard')}
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t bg-gray-50/50 px-6 py-4">
                        <p className="text-center text-sm text-gray-400">
                            Hata Kodu: <span className="font-mono text-gray-500">404_PAGE_NOT_FOUND</span>
                        </p>
                    </div>
                </div>

                {/* Floating elements for visual interest */}
                <div
                    className={`absolute -top-4 -left-4 w-8 h-8 bg-violet-400 rounded-lg shadow-lg transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 rotate-12' : 'opacity-0 rotate-0'
                        }`}
                />
                <div
                    className={`absolute -bottom-4 -right-4 w-6 h-6 bg-indigo-400 rounded-full shadow-lg transition-all duration-1000 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'
                        }`}
                />
                <div
                    className={`absolute top-1/2 -right-8 w-4 h-4 bg-purple-300 rounded-md shadow-lg transition-all duration-1000 delay-700 ${mounted ? 'opacity-100 rotate-45' : 'opacity-0 rotate-0'
                        }`}
                />
            </div>
        </div>
    )
}
