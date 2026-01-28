"use client"

import React, { useState, useEffect } from "react"
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
    Globe,
    Send
} from "lucide-react"
import { toast } from "sonner"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
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
    const [copied, setCopied] = useState(false)
    const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
    const [activeTab, setActiveTab] = useState<"link" | "qr">("link")

    const catalogName = catalog?.name || "Katalog"

    // Generate QR Code with premium styling
    useEffect(() => {
        if (open && shareUrl && isPublished) {
            QRCode.toDataURL(shareUrl, {
                width: 600,
                margin: 2,
                color: {
                    dark: "#0f172a", // Slate 900
                    light: "#ffffff"
                },
                errorCorrectionLevel: "H"
            }).then(setQrCodeUrl).catch(console.error)
        }
    }, [open, shareUrl, isPublished])

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
        toast.success("QR kod galeriye kaydedildi.")
    }

    const handleShareQR = async () => {
        if (!qrCodeUrl) return
        try {
            const response = await fetch(qrCodeUrl)
            const blob = await response.blob()
            const file = new File([blob], "katalog-qr.png", { type: "image/png" })

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: catalogName,
                    text: `${catalogName} Kataloğu QR Kodu`
                })
            } else {
                handleDownloadQR()
            }
        } catch (error) {
            console.error("QR Share Error:", error)
        }
    }

    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedText = encodeURIComponent(`${catalogName} kataloğuna göz atın!`)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-w-[95vw] p-0 overflow-hidden border-0 shadow-2xl bg-background rounded-[2rem]">
                <DialogTitle className="sr-only">Kataloğu Paylaş</DialogTitle>

                {/* Minimalist Header Style (Matching UpgradeModal) */}
                <div className="relative border-b border-border bg-gradient-to-b from-background to-muted/20 pb-1">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-full bg-primary/5 blur-[80px] pointer-events-none" />

                    <div className="relative px-6 pt-6 pb-2">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-border flex items-center justify-center">
                                <Share2 className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div className="text-center space-y-1">
                                <h2 className="text-xl font-bold tracking-tight text-foreground">Kataloğu Paylaş</h2>
                                <p className="text-xs text-muted-foreground">{catalogName}</p>
                            </div>

                            {/* Pill Toggle (Matching UpgradeModal Style) */}
                            {isPublished && (
                                <div className="relative flex items-center p-1 bg-muted/50 rounded-full border border-border shadow-inner w-full max-w-[240px]">
                                    <div
                                        className={cn(
                                            "absolute h-[calc(100%-8px)] rounded-full bg-background shadow-sm border border-border/10 transition-all duration-300 ease-in-out",
                                            activeTab === "qr" ? "left-[calc(50%+4px)] w-[calc(50%-8px)]" : "left-1 w-[calc(50%-8px)]"
                                        )}
                                    />
                                    <button
                                        onClick={() => setActiveTab("link")}
                                        className={cn(
                                            "relative flex-1 py-1.5 text-[11px] font-bold z-10 transition-colors flex items-center justify-center gap-1.5",
                                            activeTab === "link" ? "text-foreground" : "text-muted-foreground"
                                        )}
                                    >
                                        <LinkIcon className="w-3 h-3" />
                                        Link Paylaş
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("qr")}
                                        className={cn(
                                            "relative flex-1 py-1.5 text-[11px] font-bold z-10 flex items-center justify-center gap-1.5 transition-colors",
                                            activeTab === "qr" ? "text-foreground" : "text-muted-foreground"
                                        )}
                                    >
                                        <QrCode className="w-3 h-3" />
                                        QR Kod
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="px-6 py-6 overflow-y-auto max-h-[60vh] custom-scrollbar bg-slate-50/30 dark:bg-background/20">
                    {!isPublished ? (
                        <div className="text-center py-6 space-y-4">
                            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto border border-amber-100">
                                <Globe className="w-8 h-8 text-amber-500" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-800">Katalog Yayında Değil</h3>
                                <p className="text-slate-500 text-[11px] max-w-[240px] mx-auto">
                                    Paylaşım yapabilmek için önce kataloğu yayınlamanız gerekiyor.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => { onOpenChange(false); onDownloadPdf() }}
                                className="h-10 px-6 rounded-xl text-xs font-bold"
                            >
                                <Download className="w-3.5 h-3.5 mr-2" /> PDF Olarak İndir
                            </Button>
                        </div>
                    ) : (
                        <div className="animate-in fade-in duration-500">
                            {activeTab === "link" ? (
                                <div className="space-y-6">
                                    {/* Link Card - Premium Stylized */}
                                    <div className="group relative bg-white dark:bg-card border border-border rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:border-indigo-200">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Katalog Bağlantısı</span>
                                                {copied && (
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 animate-in fade-in slide-in-from-right-2">
                                                        <Check className="w-3 h-3" /> Kopyalandı
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-xl border border-dashed border-border/50 select-all overflow-hidden shrink-0">
                                                <LinkIcon className="w-4 h-4 text-slate-400 shrink-0" />
                                                <code className="text-xs font-medium text-foreground truncate flex-1 font-mono">
                                                    {shareUrl.replace(/^https?:\/\//, '')}
                                                </code>
                                            </div>
                                            <Button
                                                onClick={handleCopyLink}
                                                className={cn(
                                                    "w-full h-10 font-bold text-xs rounded-xl transition-all",
                                                    copied ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                                )}
                                            >
                                                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                                                {copied ? "Link Kopyalandı" : "Linki Kopyala"}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Social Connect Grid */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 px-1">
                                            <div className="h-px bg-border flex-1" />
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hızlı Paylaş</span>
                                            <div className="h-px bg-border flex-1" />
                                        </div>

                                        <div className="grid grid-cols-4 gap-2">
                                            {[
                                                { name: "WhatsApp", color: "bg-[#25D366]", icon: "/icons/social/whatsapp.png", url: `https://wa.me/?text=${encodedText}%20${encodedUrl}` },
                                                { name: "Telegram", color: "bg-[#0088cc]", icon: "/icons/social/telegram.png", url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}` },
                                                { name: "Email", color: "bg-slate-700", icon: "/icons/social/gmail.png", url: `mailto:?subject=${encodeURIComponent(catalogName)}&body=${encodedText}%0A%0A${encodedUrl}` },
                                                { name: "LinkedIn", color: "bg-[#0077b5]", icon: "/icons/social/linkedin.png", url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
                                            ].map((soc) => (
                                                <a
                                                    key={soc.name}
                                                    href={soc.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex flex-col items-center gap-1.5 group transition-transform hover:-translate-y-1"
                                                >
                                                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-white dark:bg-card border border-border shadow-sm group-hover:shadow-md")}>
                                                        <NextImage src={soc.icon} width={24} height={24} alt={soc.name} className="object-contain transition-transform group-hover:scale-110" unoptimized />
                                                    </div>
                                                    <span className="text-[9px] font-bold text-muted-foreground">{soc.name}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center space-y-6 animate-in slide-in-from-right-4 duration-500">
                                    {/* QR Code Frame - High-End Aesthetic */}
                                    <div className="relative p-6 bg-white dark:bg-card rounded-[2.5rem] shadow-xl border border-border group overflow-hidden">
                                        {/* Abstract background for QR */}
                                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                        {/* Corner Frames (Minimalist) */}
                                        <div className="absolute top-6 left-6 w-8 h-8 border-l-2 border-t-2 border-indigo-200 rounded-tl-xl" />
                                        <div className="absolute top-6 right-6 w-8 h-8 border-r-2 border-t-2 border-indigo-200 rounded-tr-xl" />
                                        <div className="absolute bottom-6 left-6 w-8 h-8 border-l-2 border-b-2 border-indigo-200 rounded-bl-xl" />
                                        <div className="absolute bottom-6 right-6 w-8 h-8 border-r-2 border-b-2 border-indigo-200 rounded-br-xl" />

                                        {qrCodeUrl && (
                                            <div className="relative z-10 bg-white p-2 rounded-2xl shadow-sm border border-slate-50">
                                                <NextImage
                                                    src={qrCodeUrl}
                                                    alt="QR"
                                                    width={180}
                                                    height={180}
                                                    unoptimized
                                                    className="mix-blend-multiply transition-transform group-hover:scale-105 duration-700"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-center space-y-4 w-full">
                                        <p className="text-[11px] text-muted-foreground font-medium px-8 leading-relaxed">
                                            Müşterileriniz cihazlarıyla tarayarak kataloğunuzu hızlıca açabilir.
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                onClick={handleShareQR}
                                                className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px]"
                                            >
                                                <Send className="w-3.5 h-3.5 mr-2" /> Paylaş
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={handleDownloadQR}
                                                className="h-10 rounded-xl font-bold text-[11px] border-indigo-100 text-indigo-700 bg-indigo-50/10 hover:bg-indigo-50"
                                            >
                                                <Download className="w-3.5 h-3.5 mr-2" /> İndir
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Trust Section (Matching UpgradeModal) */}
                <div className="px-6 py-4 border-t border-border bg-muted/10">
                    <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <div className="flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Mobil Uyumlu</span>
                        </div>
                        <div className="h-3 w-px bg-border/50" />
                        <div className="flex items-center gap-1.5 px-4">
                            <Download className="w-3.5 h-3.5 text-blue-500" />
                            <span>PDF Destekli</span>
                        </div>
                        <div className="h-3 w-px bg-border/50" />
                        <div className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Canlı Link</span>
                        </div>
                    </div>
                </div>

                {/* Close Button UI Adjustment */}
                <button
                    onClick={() => onOpenChange(false)}
                    className="absolute right-4 top-4 rounded-full p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-white"
                >
                    <X className="h-4 w-4 text-muted-foreground" />
                    <span className="sr-only">Kapat</span>
                </button>
            </DialogContent>
        </Dialog>
    )
}
