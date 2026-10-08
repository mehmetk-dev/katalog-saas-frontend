"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Calendar, BookOpen, Rocket, TrendingUp, Award, Sparkles } from 'lucide-react'
import { PublicHeader } from '@/components/layout/public-header'
import { PublicFooter } from '@/components/layout/public-footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/contexts/i18n-provider'
import { cn } from '@/lib/utils'

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
            bg: isActive ? 'bg-muted-foreground' : 'bg-muted hover:bg-accent',
            text: isActive ? 'text-white' : 'text-foreground',
            border: isActive ? 'border-primary' : 'border-border',
            badge: 'bg-muted text-foreground border-border'
        },
        blue: {
            bg: isActive ? 'bg-info' : 'bg-info-soft hover:bg-info/15',
            text: isActive ? 'text-white' : 'text-info-soft-foreground',
            border: isActive ? 'border-info' : 'border-info/20',
            badge: 'bg-info-soft text-info-soft-foreground border-info/20'
        },
        purple: {
            bg: isActive ? 'bg-primary' : 'bg-accent hover:bg-accent',
            text: isActive ? 'text-white' : 'text-primary',
            border: isActive ? 'border-primary' : 'border-border',
            badge: 'bg-accent text-primary border-border'
        },
        green: {
            bg: isActive ? 'bg-success' : 'bg-success-soft hover:bg-success/15',
            text: isActive ? 'text-white' : 'text-success-soft-foreground',
            border: isActive ? 'border-success' : 'border-success/20',
            badge: 'bg-success-soft text-success-soft-foreground border-success/20'
        },
        amber: {
            bg: isActive ? 'bg-warning' : 'bg-warning-soft hover:bg-warning/15',
            text: isActive ? 'text-white' : 'text-warning-soft-foreground',
            border: isActive ? 'border-warning' : 'border-warning/30',
            badge: 'bg-warning-soft text-warning-soft-foreground border-warning/30'
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
        'Transformation': 'blue',
        'E-Commerce': 'green'
    }
    return colorMap[categoryId] || 'slate'
}

export interface BlogPost {
    slug: string
    title: string
    excerpt: string
    date: string
    author: string
    category: string
    readingTime: string
    coverImage: string
    language: string
}

interface BlogPageClientProps {
    posts: BlogPost[]
}

export default function BlogPageClient({ posts }: BlogPageClientProps) {
    const { language } = useTranslation()
    const [activeCategory, setActiveCategory] = useState('all')

    const categories = CATEGORIES[language] || CATEGORIES.tr

    // Filter posts by language and category
    const filteredPosts = posts
        .filter(post => post.language === language)
        .filter(post => activeCategory === 'all' || post.category === activeCategory)

    return (
        <div className="min-h-screen bg-muted/50">
            <PublicHeader />

            <main className="pt-32 pb-24 px-6 font-geist">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="relative rounded-[2.5rem] bg-primary overflow-hidden mb-20 p-12 md:p-20 text-center shadow-2xl">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />

                        <div className="relative z-10">
                            <Badge className="mb-6 bg-background/10 text-white/90 border-white/20 px-4 py-1.5 uppercase tracking-[0.2em] text-[10px] font-bold backdrop-blur-md">
                                FOG CATALOG JOURNAL
                            </Badge>
                            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter mb-8 leading-[1.05]">
                                {language === 'tr' ? 'Üretkenliğin Yeni' : 'The New Digital'} <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary italic">
                                    {language === 'tr' ? 'Dijital Yüzü' : 'Face of Productivity'}
                                </span>
                            </h1>
                            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                                {language === 'tr'
                                    ? 'Katalog dünyasındaki son trendler, başarı hikayeleri ve uzman rehberlerimizle işinizi büyütün.'
                                    : 'Grow your business with the latest trends in the catalog world, success stories, and our expert guides.'}
                            </p>
                        </div>
                    </div>

                    {/* Category Filter Navigation */}
                    <div className="mb-16">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                                {language === 'tr' ? 'Konulara Göz At' : 'Browse Topics'}
                            </h2>
                            <span className="text-sm text-muted-foreground font-medium">
                                {filteredPosts.length} {language === 'tr' ? 'yazı' : 'posts'}
                            </span>
                        </div>

                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                            {categories.map((category) => {
                                const isActive = activeCategory === category.id
                                const styles = getCategoryStyles(category.color, isActive)
                                const Icon = category.icon
                                const count = category.id === 'all'
                                    ? posts.filter(p => p.language === language).length
                                    : posts.filter(p => p.language === language && p.category === category.id).length

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
                                            isActive ? 'bg-background/20' : 'bg-black/5'
                                        )}>
                                            {count}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Blog Post Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
                        {filteredPosts.map((post) => (
                            <Link
                                key={post.slug}
                                href={`/blog/${post.slug}`}
                                className="flex flex-col h-full border border-border rounded-2xl overflow-hidden bg-card shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group"
                            >
                                <div className="aspect-[4/3] relative overflow-hidden bg-muted">
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

                                <div className="p-6 flex-1 flex flex-col relative">
                                    <div className="flex justify-between items-start gap-4 mb-3">
                                        <h3 className="text-xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                            {post.title}
                                        </h3>
                                    </div>

                                    <p className="text-muted-foreground text-xs font-medium leading-relaxed line-clamp-2 italic mb-6 flex-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                        {post.excerpt}
                                    </p>

                                    <div className="pt-6 border-t border-border mt-auto flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-muted-foreground">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">
                                                {new Date(post.date).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long' })}
                                            </span>
                                        </div>

                                        <div className="p-2.5 rounded-full bg-muted/50 text-muted-foreground group-hover:bg-primary/90 group-hover:text-white transition-all duration-300 shadow-sm">
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Empty State */}
                    {filteredPosts.length === 0 && (
                        <div className="text-center py-20">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                                <BookOpen className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-2">
                                {language === 'tr' ? 'Henüz içerik yok' : 'No content yet'}
                            </h3>
                            <p className="text-muted-foreground mb-8">
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

                    {/* Footer CTA */}
                    <div className="mt-32 border-t border-border pt-20 text-center">
                        <div className="max-w-3xl mx-auto space-y-8">
                            <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">
                                {language === 'tr' ? 'Siz de Kendi Profesyonel' : 'Create Your Own Professional'} <br />
                                {language === 'tr' ? 'Kataloğunuzu Oluşturun' : 'Digital Catalog Today'}
                            </h2>
                            <p className="text-muted-foreground text-lg">
                                {language === 'tr'
                                    ? 'Dijitalleşen dünyada rakiplerinizin bir adım önüne geçin.'
                                    : 'Stay one step ahead of your competitors in the digitalizing world.'}
                            </p>
                            <Link href="/auth?tab=signup" className="inline-block">
                                <Button size="lg" className="h-16 px-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full text-lg font-bold shadow-2xl shadow-black/20 transition-all hover:scale-105">
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
