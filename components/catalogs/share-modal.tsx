"use client"

import React, { useState, useEffect, useRef } from "react"
import QRCode from "qrcode"
import NextImage from "next/image"
import {
    X,
    Copy,
    Check,
    Download,
    Share2,
    QrCode,
    Smartphone,
    Link as LinkIcon,
    Globe
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n-provider"
import { type Catalog } from "@/lib/actions/catalogs"

interface ShareModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    catalog: Catalog | null
    isPublished: boolean
    shareUrl: string
    onDownloadPdf: () => Promise<void>
}

export function ShareModal({ open, onOpenChange, catalog, isPublished, shareUrl, onDownloadPdf }: ShareModalProps) {
    const { t } = useTranslation()
    const [copied, setCopied] = useState(false)
    const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
    const [activeTab, setActiveTab] = useState<"social" | "qr">("social")

    // Yükseklik Animasyonu için Ref
    const contentRef = useRef<HTMLDivElement>(null)
    const [contentHeight, setContentHeight] = useState<number | undefined>(undefined)

    // Tab değiştiğinde yüksekliği güncelle
    useEffect(() => {
        if (contentRef.current) {
            const resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    setContentHeight(entry.contentRect.height)
                }
            })
            resizeObserver.observe(contentRef.current)
            return () => resizeObserver.disconnect()
        }
    }, [activeTab, open])

    const catalogName = catalog?.name || "Katalog"
    const catalogDescription = catalog?.description || ""

    // Generate QR Code
    useEffect(() => {
        if (open && shareUrl && isPublished) {
            QRCode.toDataURL(shareUrl, {
                width: 600, // Yüksek kalite
                margin: 2,
                color: {
                    dark: "#4338ca",
                    light: "#ffffff"
                },
                errorCorrectionLevel: "H"
            }).then(setQrCodeUrl).catch(console.error)
        }
    }, [open, shareUrl, isPublished])

    if (!open) return null

    const handleCopyLink = async () => {
        if (!isPublished) return
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        toast.success("Link kopyalandı!")
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDownloadQR = () => {
        if (!qrCodeUrl) return
        const link = document.createElement("a")
        link.download = `${catalogName.replace(/\s+/g, "-").toLowerCase()}-qr.png`
        link.href = qrCodeUrl
        link.click()
        toast.success("QR kod indirildi!")
    }

    // QR Kodu Paylaşma Mantığı (WhatsApp Odaklı)
    const handleShareQR = async () => {
        if (!qrCodeUrl) return

        try {
            const response = await fetch(qrCodeUrl)
            const blob = await response.blob()
            const file = new File([blob], "katalog-qr.png", { type: "image/png" })

            // 1. Mobil Native Paylaşım (Varsa)
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: catalogName,
                    text: `${catalogName} WhatsApp QR Kodu`
                })
                // Başarılı olursa native ekran açılır.
            } else {
                // 2. Desteklemiyorsa (Desktop) -> Kopyala ve Uyar
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ [blob.type]: blob })
                    ])
                    toast.success("QR Kod Kopyalandı! 📋", {
                        description: "WhatsApp Web'i açıp sohbete yapıştırabilirsin (Ctrl+V).",
                        duration: 5000,
                        action: {
                            label: "WhatsApp Web'i Aç",
                            onClick: () => window.open('https://web.whatsapp.com', '_blank')
                        }
                    })
                } catch (err) {
                    // 3. Hiçbiri olmadı -> İndir
                    handleDownloadQR()
                    toast.info("Resim indirildi. WhatsApp'tan gönderebilirsiniz.")
                }
            }
        } catch (error) {
            console.error("QR Share Error:", error)
        }
    }

    const handlePdfClick = async () => {
        onOpenChange(false)
        await onDownloadPdf()
    }

    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedText = encodeURIComponent(catalogDescription || `${catalogName} kataloğuna göz atın!`)

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop with Blur */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={() => onOpenChange(false)}
            />

            {/* Modal Container with Smooth Height Transition */}
            <div
                className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 flex flex-col transition-[height] ease-in-out"
                style={{ height: contentHeight ? `${contentHeight}px` : 'auto', maxHeight: '90vh' }}
            >
                {/* Content Wrapper for measuring height */}
                <div ref={contentRef} className="flex flex-col h-full">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-6 flex items-start justify-between shrink-0 relative overflow-hidden">
                        {/* Abstract Shapes */}
                        <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10">
                            <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="100" cy="100" r="100" fill="white" />
                            </svg>
                        </div>

                        <div className="relative z-10 flex items-center gap-4">
                            <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md shadow-inner border border-white/10">
                                <Share2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight">Kataloğu Paylaş</h2>
                                <p className="text-white/80 text-sm font-medium">{catalogName}</p>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="text-white hover:bg-white/20 rounded-full relative z-10 -mr-2"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Main Body */}
                    <div className="p-6 bg-slate-50/50 flex-1">
                        {!isPublished ? (
                            <div className="text-center py-8 space-y-4">
                                <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                    <Globe className="w-8 h-8 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">Yayında Değil</h3>
                                    <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1">
                                        Paylaşım seçeneklerini kullanabilmek için kataloğunuzu yayınlamanız gerekiyor.
                                    </p>
                                </div>
                                <Button onClick={handlePdfClick} className="w-full bg-slate-900 text-white rounded-xl h-12 mt-4">
                                    <Download className="w-4 h-4 mr-2" /> PDF İndir
                                </Button>
                            </div>
                        ) : (
                            <>
                                {/* Tabs */}
                                <div className="bg-slate-200/60 p-1.5 rounded-2xl flex relative mb-6 shrink-0">
                                    <button
                                        onClick={() => setActiveTab("social")}
                                        className={cn(
                                            "flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-xl transition-all duration-300 z-10 relative",
                                            activeTab === "social"
                                                ? "bg-white text-indigo-600 shadow-sm"
                                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-300/50"
                                        )}
                                    >
                                        <LinkIcon className="w-4 h-4" />
                                        Link Paylaş
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("qr")}
                                        className={cn(
                                            "flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-xl transition-all duration-300 z-10 relative",
                                            activeTab === "qr"
                                                ? "bg-white text-indigo-600 shadow-sm"
                                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-300/50"
                                        )}
                                    >
                                        <QrCode className="w-4 h-4" />
                                        QR Kod
                                    </button>
                                </div>

                                <div className="relative">
                                    {/* SOCIAL VIEW */}
                                    {activeTab === "social" && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">

                                            {/* Copy Link Card */}
                                            <div
                                                onClick={handleCopyLink}
                                                className="group cursor-pointer bg-white border border-slate-200 hover:border-indigo-400 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between relative overflow-hidden"
                                            >
                                                <div className="flex items-center gap-4 relative z-10">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300",
                                                        copied ? "bg-emerald-100 text-emerald-600" : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100"
                                                    )}>
                                                        {copied ? <Check className="w-6 h-6" /> : <LinkIcon className="w-6 h-6" />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={cn(
                                                            "font-bold text-sm transition-colors",
                                                            copied ? "text-emerald-700" : "text-slate-700 group-hover:text-indigo-700"
                                                        )}>
                                                            {copied ? "Kopyalandı!" : "Katalog Linkini Kopyala"}
                                                        </span>
                                                        <span className="text-xs text-slate-400 truncate max-w-[200px] mt-0.5">
                                                            {shareUrl.replace(/^https?:\/\//, '')}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50 p-2 rounded-lg text-slate-400 group-hover:bg-white group-hover:text-indigo-500 transition-colors border border-slate-100 group-hover:border-indigo-100 relative z-10">
                                                    <Copy className="w-4 h-4" />
                                                </div>

                                                {/* Gradient Hover Effect bg */}
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-50/30 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            </div>

                                            {/* Social Grid */}
                                            <div>
                                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-3 block">
                                                    Sosyal Medyada Paylaş
                                                </label>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {[
                                                        { name: "WhatsApp", src: "/icons/social/whatsapp.png", url: `https://wa.me/?text=${encodedText}%20${encodedUrl}` },
                                                        { name: "Email", src: "/icons/social/gmail.png", url: `mailto:?subject=${encodeURIComponent(catalogName)}&body=${encodedText}%0A%0A${encodedUrl}` },
                                                        { name: "LinkedIn", src: "/icons/social/linkedin.png", url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
                                                        { name: "Twitter", src: "/icons/social/twitter.png", url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}` },
                                                        { name: "Telegram", src: "/icons/social/telegram.png", url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}` },
                                                        { name: "Facebook", src: "/icons/social/facebook.png", url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
                                                    ].map((social) => (
                                                        <a
                                                            key={social.name}
                                                            href={social.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-100 hover:-translate-y-1 transition-all duration-300 group"
                                                        >
                                                            <div className="relative w-8 h-8 group-hover:scale-110 transition-transform duration-300">
                                                                <NextImage src={social.src} alt={social.name} width={32} height={32} className="object-contain" unoptimized />
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">
                                                                {social.name}
                                                            </span>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>

                                            <Button
                                                variant="outline"
                                                onClick={handlePdfClick}
                                                className="w-full h-12 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl font-medium"
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                PDF Versiyonunu İndir
                                            </Button>
                                        </div>
                                    )}

                                    {/* QR VIEW */}
                                    {activeTab === "qr" && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                            {/* QR Container - Enlarged and Spaced */}
                                            <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />

                                                {/* Corner Frames */}
                                                <div className="absolute top-4 left-4 w-6 h-6 border-l-4 border-t-4 border-slate-900 rounded-tl-lg opacity-10" />
                                                <div className="absolute top-4 right-4 w-6 h-6 border-r-4 border-t-4 border-slate-900 rounded-tr-lg opacity-10" />
                                                <div className="absolute bottom-4 left-4 w-6 h-6 border-l-4 border-b-4 border-slate-900 rounded-bl-lg opacity-10" />
                                                <div className="absolute bottom-4 right-4 w-6 h-6 border-r-4 border-b-4 border-slate-900 rounded-br-lg opacity-10" />

                                                {qrCodeUrl && (
                                                    <div className="relative z-10 bg-white p-2 rounded-xl shadow-sm">
                                                        <NextImage
                                                            src={qrCodeUrl}
                                                            alt="QR"
                                                            width={240}
                                                            height={240}
                                                            unoptimized
                                                            className="mix-blend-multiply"
                                                        />
                                                    </div>
                                                )}
                                                <p className="relative z-10 text-[11px] text-slate-400 mt-4 font-medium px-4 text-center leading-tight">
                                                    Müşterileriniz telefonuyla tarayarak kataloğu açabilir.
                                                </p>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="grid grid-cols-2 gap-3 mt-auto">
                                                <Button
                                                    onClick={handleShareQR}
                                                    className="w-full h-12 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-xl shadow-lg shadow-green-600/20 font-bold text-xs transition-transform active:scale-[0.98] group flex items-center justify-center gap-2"
                                                >
                                                    <NextImage src="/icons/social/whatsapp.png" width={18} height={18} alt="WA" className="brightness-0 invert" unoptimized />
                                                    WhatsApp
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    onClick={handleDownloadQR}
                                                    className="w-full h-12 bg-white hover:bg-slate-50 border-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                                                >
                                                    <Download className="w-4 h-4 mr-2" />
                                                    İndir
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
