"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Calendar, BookOpen, Rocket, TrendingUp, Award, Sparkles } from 'lucide-react'
import { PublicHeader } from '@/components/layout/public-header'
import { PublicFooter } from '@/components/layout/public-footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n-provider'
import { cn } from '@/lib/utils'

// Metadata cannot be here in a client component, but generateSEO 
// can be used in a separate layout if needed. For now, we focus on functionality.

// CATEGORY DEFINITIONS (TR + EN)
const CATEGORIES = {
    tr: [
        { id: 'all', label: 'Tümü', icon: Sparkles, color: 'slate' },
        { id: 'guides', label: 'Rehberler', icon: BookOpen, color: 'blue' },
        { id: 'product-updates', label: 'Ürün Güncellemeleri', icon: Rocket, color: 'purple' },
        { id: 'ecommerce-tips', label: 'E-ticaret İpuçları', icon: TrendingUp, color: 'green' },
        { id: 'success-stories', label: 'Başarı Hikayeleri', icon: Award, color: 'amber' },
    ],
    en: [
        { id: 'all', label: 'All', icon: Sparkles, color: 'slate' },
        { id: 'guides', label: 'Guides', icon: BookOpen, color: 'blue' },
        { id: 'product-updates', label: 'Product Updates', icon: Rocket, color: 'purple' },
        { id: 'ecommerce-tips', label: 'E-commerce Tips', icon: TrendingUp, color: 'green' },
        { id: 'success-stories', label: 'Success Stories', icon: Award, color: 'amber' },
    ]
}

// CATEGORY COLOR SCHEMES
const getCategoryStyles = (color: string, isActive: boolean) => {
    const styles = {
        slate: {
            bg: isActive ? 'bg-slate-600' : 'bg-slate-100 hover:bg-slate-200',
            text: isActive ? 'text-white' : 'text-slate-700',
            border: isActive ? 'border-slate-700' : 'border-slate-200',
            badge: 'bg-slate-100 text-slate-700 border-slate-200'
        },
        blue: {
            bg: isActive ? 'bg-blue-600' : 'bg-blue-50 hover:bg-blue-100',
            text: isActive ? 'text-white' : 'text-blue-700',
            border: isActive ? 'border-blue-700' : 'border-blue-200',
            badge: 'bg-blue-100 text-blue-700 border-blue-200'
        },
        purple: {
            bg: isActive ? 'bg-violet-600' : 'bg-violet-50 hover:bg-violet-100',
            text: isActive ? 'text-white' : 'text-violet-700',
            border: isActive ? 'border-violet-700' : 'border-violet-200',
            badge: 'bg-violet-100 text-violet-700 border-violet-200'
        },
        green: {
            bg: isActive ? 'bg-emerald-600' : 'bg-emerald-50 hover:bg-emerald-100',
            text: isActive ? 'text-white' : 'text-emerald-700',
            border: isActive ? 'border-emerald-700' : 'border-emerald-200',
            badge: 'bg-emerald-100 text-emerald-700 border-emerald-200'
        },
        amber: {
            bg: isActive ? 'bg-amber-600' : 'bg-amber-50 hover:bg-amber-100',
            text: isActive ? 'text-white' : 'text-amber-700',
            border: isActive ? 'border-amber-700' : 'border-amber-200',
            badge: 'bg-amber-100 text-amber-700 border-amber-200'
        }
    }
    return styles[color as keyof typeof styles] || styles.slate
}

// Get category color for post badge
const getPostCategoryColor = (categoryId: string) => {
    const colorMap: Record<string, string> = {
        'guides': 'blue',
        'product-updates': 'purple',
        'ecommerce-tips': 'green',
        'success-stories': 'amber',
        'Transformation': 'blue',  // Legacy mapping
        'E-Commerce': 'green'  // Legacy mapping
    }
    return colorMap[categoryId] || 'slate'
}

// ELLERİNİZLE YÖNETEBİLECEĞİNİZ STATİK LİSTE
const POSTS = [
    {
        slug: 'dijital-katalog-ile-satis-artirma',
        title: 'Dijital Katalog ile Satışlarınızı Artırmanın 5 Yolu',
        excerpt: 'Doğru kurgulanmış bir dijital katalog, satış ekibinizin en büyük yardımcısıdır. İşte ciroyu artıracak taktikler.',
        date: '2026-02-08',
        author: 'Mehmet K.',
        category: 'ecommerce-tips',
        readingTime: '5 dk okuma',
        coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80',
        language: 'tr'
    },
    {
        slug: 'neden-dijital-katalog-kullanmalisiniz',
        title: 'Üretkenliğin Yeni Dijital Yüzü',
        excerpt: 'Geleneksel kağıt kataloglar artık tarih oluyor. Dijitalin kazandıracağı kritik avantajları keşfedin.',
        date: '2026-02-04',
        author: 'Mehmet K.',
        category: 'guides',  // Updated to use new category IDs
        readingTime: '4 dk okuma',
        coverImage: '/blog/hero1.png',
        language: 'tr'
    },
    {
        slug: 'why-digital-catalog',
        title: 'The New Era of Digital Productivity',
        excerpt: 'Paper catalogs are now a thing of the past. Explore the advantages of digital transformation.',
        date: '2026-02-04',
        author: 'Mehmet K.',
        category: 'guides',  // Updated to use new category IDs
        readingTime: '4 min read',
        coverImage: '/blog/hero2.png',
        language: 'en'
    }
]

export default function BlogPage() {
    const { language } = useTranslation()
    const [activeCategory, setActiveCategory] = useState('all')

    const categories = CATEGORIES[language] || CATEGORIES.tr

    // Filter posts by language and category
    const filteredPosts = POSTS
        .filter(post => post.language === language)
        .filter(post => activeCategory === 'all' || post.category === activeCategory)

    return (
        <div className="min-h-screen bg-slate-50/50">
            <PublicHeader />

            <main className="pt-32 pb-24 px-6 font-geist">
                <div className="max-w-7xl mx-auto">
                    {/* Header: Katalog kapağı gibi şık bir giriş */}
                    <div className="relative rounded-[2.5rem] bg-slate-900 overflow-hidden mb-20 p-12 md:p-20 text-center shadow-2xl">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px]" />
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-[120px]" />

                        <div className="relative z-10">
                            <Badge className="mb-6 bg-white/10 text-white/90 border-white/20 px-4 py-1.5 uppercase tracking-[0.2em] text-[10px] font-bold backdrop-blur-md">
                                FOG CATALOG JOURNAL
                            </Badge>
                            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter mb-8 leading-[1.05]">
                                {language === 'tr' ? 'Üretkenliğin Yeni' : 'The New Digital'} <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-300 italic">
                                    {language === 'tr' ? 'Dijital Yüzü' : 'Face of Productivity'}
                                </span>
                            </h1>
                            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                                {language === 'tr'
                                    ? 'Katalog dünyasındaki son trendler, başarı hikayeleri ve uzman rehberlerimizle işinizi büyütün.'
                                    : 'Grow your business with the latest trends in the catalog world, success stories, and our expert guides.'}
                            </p>
                        </div>
                    </div>

                    {/* Category Filter Navigation */}
                    <div className="mb-16">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">
                                {language === 'tr' ? 'Konulara Göz At' : 'Browse Topics'}
                            </h2>
                            <span className="text-sm text-slate-500 font-medium">
                                {filteredPosts.length} {language === 'tr' ? 'yazı' : 'posts'}
                            </span>
                        </div>

                        {/* Category Pills - Horizontal scroll on mobile */}
                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                            {categories.map((category) => {
                                const isActive = activeCategory === category.id
                                const styles = getCategoryStyles(category.color, isActive)
                                const Icon = category.icon
                                const count = category.id === 'all'
                                    ? POSTS.filter(p => p.language === language).length
                                    : POSTS.filter(p => p.language === language && p.category === category.id).length

                                return (
                                    <button
                                        key={category.id}
                                        onClick={() => setActiveCategory(category.id)}
                                        className={cn(
                                            'flex items-center gap-2 px-5 py-3 rounded-2xl border-2 font-bold text-sm transition-all duration-300 whitespace-nowrap',
                                            styles.bg,
                                            styles.text,
                                            styles.border,
                                            isActive && 'shadow-lg scale-105'
                                        )}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{category.label}</span>
                                        <span className={cn(
                                            'ml-1 px-2 py-0.5 rounded-full text-xs font-black',
                                            isActive ? 'bg-white/20' : 'bg-black/5'
                                        )}>
                                            {count}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Blog Post Grid: Ultra Editorial Two-Column Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
                        {filteredPosts.map((post) => (
                            <Link
                                key={post.slug}
                                href={`/blog/${post.slug}`}
                                className="flex flex-col h-full border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group"
                            >
                                {/* Görsel Alanı: Katalogdaki aspect-[4/3] oranını koruduk */}
                                <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                                    <Image
                                        src={post.coverImage}
                                        alt={post.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute top-4 left-4">
                                        {(() => {
                                            const categoryColor = getPostCategoryColor(post.category)
                                            const categoryLabel = categories.find(c => c.id === post.category)?.label || post.category
                                            const badgeStyles = getCategoryStyles(categoryColor, false).badge

                                            return (
                                                <Badge className={cn(
                                                    'backdrop-blur-sm border-2 font-black text-[10px] uppercase tracking-widest px-3 py-1 shadow-md',
                                                    badgeStyles
                                                )}>
                                                    {categoryLabel}
                                                </Badge>
                                            )
                                        })()}
                                    </div>
                                </div>

                                {/* Bilgiler Alanı: Katalog şablonlarındaki tipografi ve yerleşime göre tasarlandı */}
                                <div className="p-6 flex-1 flex flex-col relative">
                                    <div className="flex justify-between items-start gap-4 mb-3">
                                        <h3 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-violet-600 transition-colors line-clamp-2">
                                            {post.title}
                                        </h3>
                                    </div>

                                    <p className="text-slate-400 text-xs font-medium leading-relaxed line-clamp-2 italic mb-6 flex-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                        {post.excerpt}
                                    </p>

                                    <div className="pt-6 border-t border-slate-50 mt-auto flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-slate-400">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">
                                                {new Date(post.date).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long' })}
                                            </span>
                                        </div>

                                        {/* Buy Button yerine "Read More" ikonu, aynı katalog butonu tarzında */}
                                        <div className="p-2.5 rounded-full bg-slate-50 text-slate-400 group-hover:bg-violet-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Empty State - No posts in selected category */}
                    {filteredPosts.length === 0 && (
                        <div className="text-center py-20">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-6">
                                <BookOpen className="w-10 h-10 text-slate-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">
                                {language === 'tr' ? 'Henüz içerik yok' : 'No content yet'}
                            </h3>
                            <p className="text-slate-500 mb-8">
                                {language === 'tr'
                                    ? 'Bu kategoride henüz yayınlanmış bir yazı bulunmuyor.'
                                    : 'No posts have been published in this category yet.'}
                            </p>
                            <Button
                                onClick={() => setActiveCategory('all')}
                                variant="outline"
                                className="rounded-full"
                            >
                                {language === 'tr' ? 'Tüm Yazıları Gör' : 'View All Posts'}
                            </Button>
                        </div>
                    )}

                    {/* Footer CTA: Katalog sonu kapağı tarzında */}
                    <div className="mt-32 border-t border-slate-200 pt-20 text-center">
                        <div className="max-w-3xl mx-auto space-y-8">
                            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
                                {language === 'tr' ? 'Siz de Kendi Profesyonel' : 'Create Your Own Professional'} <br />
                                {language === 'tr' ? 'Kataloğunuzu Oluşturun' : 'Digital Catalog Today'}
                            </h2>
                            <p className="text-slate-500 text-lg">
                                {language === 'tr'
                                    ? 'Dijitalleşen dünyada rakiplerinizin bir adım önüne geçin.'
                                    : 'Stay one step ahead of your competitors in the digitalizing world.'}
                            </p>
                            <Link href="/auth?tab=signup" className="inline-block">
                                <Button size="lg" className="h-16 px-12 bg-violet-600 hover:bg-violet-700 text-white rounded-full text-lg font-bold shadow-2xl shadow-violet-500/20 transition-all hover:scale-105">
                                    {language === 'tr' ? 'Ücretsiz Başla' : 'Start for Free'}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    )
}
