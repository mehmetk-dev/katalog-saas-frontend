"use client"

import React, { useState, useEffect } from "react"
import { Clock, ArrowLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
interface BlogPostLayoutProps {
    children: React.ReactNode
    title: string
    excerpt: string
    date: string
    author: string
    category: string
    coverImage: string
    readingTime: string
    url?: string
}

export function BlogPostLayout({
    children,
    title,
    excerpt,
    date,
    author,
    category,
    coverImage,
    readingTime
}: BlogPostLayoutProps) {
    const [scrollProgress, setScrollProgress] = useState(0)

    useEffect(() => {
        const handleScroll = () => {
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight
            const progress = (window.scrollY / totalHeight) * 100
            setScrollProgress(progress)
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <div className="min-h-screen bg-white font-geist selection:bg-slate-900 selection:text-white">
            {/* Minimal Reading Progress */}
            <div className="fixed top-0 left-0 w-full h-1 z-[100]">
                <div
                    className="h-full bg-slate-900 transition-all duration-150 ease-out"
                    style={{ width: `${scrollProgress}%` }}
                />
            </div>

            <PublicHeader />

            <main className="pt-20">
                {/* 1. Header Section: Ultra Editorial */}
                <header className="max-w-screen-2xl mx-auto px-6 py-20">
                    <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-10">
                        <nav className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                            <Link href="/blog" className="hover:text-slate-900 transition-colors">Journal</Link>
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-slate-900">{category}</span>
                        </nav>

                        <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-slate-900 leading-[0.9] lg:px-10">
                            {title}
                        </h1>

                        <p className="text-xl md:text-2xl text-slate-500 font-medium leading-relaxed italic">
                            {excerpt}
                        </p>

                        <div className="flex items-center gap-6 pt-6 border-t border-slate-100 w-full justify-center">
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Author</span>
                                <span className="text-xs font-bold text-slate-900">{author}</span>
                            </div>
                            <div className="w-px h-8 bg-slate-100" />
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Published</span>
                                <span className="text-xs font-bold text-slate-900">
                                    {new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                            <div className="w-px h-8 bg-slate-100" />
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Time</span>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                                    <Clock className="w-3.5 h-3.5" />
                                    {readingTime}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* 2. Hero Image: Cinematic & Full Width */}
                <section className="max-w-screen-2xl mx-auto px-6 mb-24">
                    <div className="relative aspect-[21/9] rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] group">
                        <Image
                            src={coverImage}
                            alt={title}
                            fill
                            priority
                            className="object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    </div>
                </section>

                {/* 3. Article Body: Pure Minimalism */}
                <article className="max-w-3xl mx-auto px-6">
                    <div className="prose prose-slate prose-lg lg:prose-xl max-w-none 
                        prose-headings:font-black prose-headings:tracking-tighter prose-headings:text-slate-900
                        prose-p:text-slate-600 prose-p:leading-[1.8] prose-p:font-medium
                        prose-a:text-slate-900 prose-a:no-underline prose-a:font-bold prose-a:border-b-2 prose-a:border-indigo-500/30 hover:prose-a:border-indigo-500 transition-all
                        prose-blockquote:border-l-4 prose-blockquote:border-slate-900 prose-blockquote:bg-slate-50 prose-blockquote:py-2 prose-blockquote:px-8 prose-blockquote:rounded-r-2xl prose-blockquote:italic prose-blockquote:font-medium
                        prose-strong:text-slate-900 prose-strong:font-black
                        prose-img:rounded-3xl prose-img:shadow-2xl
                    ">
                        {children}
                    </div>

                    {/* Back to Blog Navigation */}
                    <div className="mt-24 pt-12 border-t border-slate-100 flex items-center justify-center">
                        <Link href="/blog" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all group">
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            Back to Journal
                        </Link>
                    </div>
                </article>

                {/* 4. Elegant CTA */}
                <section className="max-w-screen-xl mx-auto px-6 py-40">
                    <div className="bg-slate-900 rounded-[4rem] p-12 md:p-32 text-center relative overflow-hidden group shadow-[0_50px_100px_rgba(0,0,0,0.3)]">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.15),transparent)] opacity-50" />

                        <div className="relative z-10 space-y-8">
                            <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-tight">
                                Ready to build your <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-300">digital legacy?</span>
                            </h2>
                            <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto">
                                Join thousands of brands using FogCatalog to showcase their products with cinematic quality.
                            </p>
                            <div className="pt-6">
                                <Link
                                    href="/auth?tab=signup"
                                    className="inline-flex h-20 items-center px-16 bg-white text-slate-900 rounded-full text-xl font-black hover:scale-105 transition-all shadow-2xl hover:shadow-white/10"
                                >
                                    Get Started Free
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <PublicFooter />
        </div>
    )
}
