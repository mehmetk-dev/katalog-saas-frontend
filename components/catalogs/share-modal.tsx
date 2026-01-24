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
    Facebook,
    MessageCircle,
    Send, // Telegram
    Linkedin,
    Twitter,
    Link2,
    Mail,
    Smartphone,
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
    const contentRef = useRef<HTMLDivElement>(null)
    const [height, setHeight] = useState<number | "auto">("auto")

    const catalogName = catalog?.name || "Katalog"
    const catalogDescription = catalog?.description || ""

    // Generate QR Code
    useEffect(() => {
        if (open && shareUrl && isPublished) {
            QRCode.toDataURL(shareUrl, {
                width: 300,
                margin: 2,
                color: {
                    dark: "#0f172a", // slate-900
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
        toast.success(t("catalogs.copyLink") || "Link kopyalandı!")
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

    const handlePdfClick = async () => {
        // Modal'ı kapatıp PDF indirme işlemini başlat
        onOpenChange(false)
        await onDownloadPdf()
    }

    const shareText = catalogDescription || `${catalogName} kataloğuna göz atın!`
    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedText = encodeURIComponent(shareText)

    const socialLinks = [
        {
            name: "WhatsApp",
            icon: MessageCircle,
            color: "bg-[#25D366] hover:bg-[#20BD5A] text-white",
            url: `https://wa.me/?text=${encodedText}%20${encodedUrl}`
        },
        // ... (Diğer sosyal linkler aynı kalabilir veya isPublished kontrolü eklenebilir)
    ]

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={() => onOpenChange(false)}
            />

            {/* Modal */}
            <div
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col"
                style={{ maxHeight: '90vh' }}
            >
                {/* Header */}
                <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-slate-100 shrink-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Share2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-900 leading-tight">Paylaş</h2>
                            <p className="text-xs text-slate-500 font-medium">{catalogName}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onOpenChange(false)}
                        className="rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {!isPublished ? (
                        // YAYINDA DEĞİLSE UYARI VE PDF SEÇENEĞİ
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 text-amber-800">
                                <div className="shrink-0 mt-0.5">
                                    <Globe className="w-5 h-5 text-amber-600" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-sm font-bold">Katalog Yayında Değil</h3>
                                    <p className="text-xs opacity-90 leading-relaxed">
                                        Bu katalog şu anda gizli. Paylaşılabilir link oluşturmak için önce <strong>"Yayınla"</strong> butonuna basmalısınız.
                                    </p>
                                </div>
                            </div>

                            <Button
                                onClick={handlePdfClick}
                                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg transition-transform active:scale-[0.98]"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                PDF Olarak İndir ve Paylaş
                            </Button>
                        </div>
                    ) : (
                        // YAYINDAYSA MEVCUT PAYLAŞIM SEÇENEKLERİ
                        <>
                            {/* Tabs */}
                            <div className="flex bg-slate-100/80 p-1 rounded-xl mb-4">
                                <button
                                    onClick={() => setActiveTab("social")}
                                    className={cn(
                                        "flex-1 py-2 text-sm font-semibold flex items-center justify-center gap-2 rounded-lg transition-all duration-200",
                                        activeTab === "social"
                                            ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5"
                                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                    )}
                                >
                                    <Smartphone className="w-4 h-4" />
                                    Link
                                </button>
                                <button
                                    onClick={() => setActiveTab("qr")}
                                    className={cn(
                                        "flex-1 py-2 text-sm font-semibold flex items-center justify-center gap-2 rounded-lg transition-all duration-200",
                                        activeTab === "qr"
                                            ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5"
                                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                    )}
                                >
                                    <QrCode className="w-4 h-4" />
                                    QR Kod
                                </button>
                            </div>

                            {activeTab === "social" && (
                                <div className="space-y-4 animate-in fade-in">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Katalog Linki</label>
                                        <div className="flex items-center gap-2 mt-1.5 p-1.5 bg-white border border-slate-200 rounded-xl shadow-sm">
                                            <div className="h-9 w-9 flex items-center justify-center bg-indigo-50 rounded-lg text-indigo-600 shrink-0">
                                                <Globe className="w-4 h-4" />
                                            </div>
                                            <Input readOnly value={shareUrl} className="border-0 shadow-none focus-visible:ring-0 px-2 h-9 text-sm font-medium bg-transparent" />
                                            <Button onClick={handleCopyLink} size="sm" className="h-9 rounded-lg px-3 bg-slate-900 text-white hover:bg-slate-800">
                                                {copied ? <Check className="w-4 h-4" /> : "Kopyala"}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <Button
                                            variant="outline"
                                            onClick={handlePdfClick}
                                            className="w-full h-10 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            PDF Versiyonunu İndir
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {activeTab === "qr" && (
                                <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in p-2">
                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                        {qrCodeUrl && <NextImage src={qrCodeUrl} alt="QR" width={180} height={180} unoptimized />}
                                    </div>
                                    <Button onClick={handleDownloadQR} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
                                        <Download className="w-4 h-4 mr-2" />
                                        QR Kodu İndir
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
