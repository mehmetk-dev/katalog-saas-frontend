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
    Facebook,
    MessageCircle,
    Send,
    Linkedin,
    Twitter,
    Link2,
    Mail,
    Smartphone
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n-provider"

interface ShareModalProps {
    isOpen: boolean
    onClose: () => void
    catalogName: string
    catalogDescription?: string | null
    shareUrl: string
}

export function ShareModal({ isOpen, onClose, catalogName, catalogDescription, shareUrl }: ShareModalProps) {
    const { t } = useTranslation()
    const [copied, setCopied] = useState(false)
    const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
    const [activeTab, setActiveTab] = useState<"social" | "qr">("social")

    // Generate QR Code
    useEffect(() => {
        if (isOpen && shareUrl) {
            QRCode.toDataURL(shareUrl, {
                width: 280,
                margin: 2,
                color: {
                    dark: "#1e1b4b",
                    light: "#ffffff"
                },
                errorCorrectionLevel: "H"
            }).then(setQrCodeUrl).catch(console.error)
        }
    }, [isOpen, shareUrl])

    if (!isOpen) return null

    const handleCopyLink = async () => {
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

    const shareText = catalogDescription || `${catalogName} kataloğuna göz atın!`
    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedText = encodeURIComponent(shareText)

    const socialLinks = [
        {
            name: "WhatsApp",
            icon: MessageCircle,
            color: "bg-[#25D366] hover:bg-[#20BD5A]",
            url: `https://wa.me/?text=${encodedText}%20${encodedUrl}`
        },
        {
            name: "Facebook",
            icon: Facebook,
            color: "bg-[#1877F2] hover:bg-[#166FE5]",
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`
        },
        {
            name: "Twitter / X",
            icon: Twitter,
            color: "bg-black hover:bg-gray-800",
            url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
        },
        {
            name: "LinkedIn",
            icon: Linkedin,
            color: "bg-[#0A66C2] hover:bg-[#0959AB]",
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        },
        {
            name: "Telegram",
            icon: Send,
            color: "bg-[#0088CC] hover:bg-[#007AB8]",
            url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`
        },
        {
            name: "E-posta",
            icon: Mail,
            color: "bg-slate-600 hover:bg-slate-700",
            url: `mailto:?subject=${encodeURIComponent(catalogName)}&body=${encodedText}%20${encodedUrl}`
        }
    ]

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={cn(
                    "relative bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 transition-[max-height] duration-500 ease-in-out will-change-[max-height]",
                    activeTab === "qr" ? "max-h-[860px]" : "max-h-[700px]"
                )}
            >
                {/* Header */}
                <div className="bg-emerald-600 px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white">
                        <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center">
                            <Share2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-lg">Kataloğu Paylaş</h2>
                            <p className="text-xs text-white/80">Linki paylaş, QR kod indir</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50/60">
                    <button
                        onClick={() => setActiveTab("social")}
                        className={cn(
                            "flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-all rounded-full",
                            activeTab === "social"
                                ? "bg-white text-violet-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Smartphone className="w-4 h-4" />
                        Sosyal Medya
                    </button>
                    <button
                        onClick={() => setActiveTab("qr")}
                        className={cn(
                            "flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-all rounded-full",
                            activeTab === "qr"
                                ? "bg-white text-violet-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <QrCode className="w-4 h-4" />
                        QR Kod
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 transition-all duration-300 ease-out">
                    <div
                        key={activeTab}
                        className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                    >
                        {activeTab === "social" ? (
                        <div className="transition-all duration-300 ease-out">
                            {/* Catalog Info */}
                            <div className="mb-6 p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200/60">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                        <Link2 className="w-5 h-5 text-violet-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-slate-900 mb-0.5 truncate">{catalogName}</h3>
                                        {catalogDescription && (
                                            <p className="text-sm text-slate-500 line-clamp-2">{catalogDescription}</p>
                                        )}
                                    </div>
                                </div>
                                {catalogDescription && (
                                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-white/70 border border-slate-200">
                                            {shareUrl.replace(/^https?:\/\//, "")}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Social Buttons Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                                {socialLinks.map((social) => (
                                    <a
                                        key={social.name}
                                        href={social.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl text-white transition-all hover:scale-[1.03] hover:shadow-lg active:scale-95",
                                            social.color
                                        )}
                                    >
                                        <social.icon className="w-6 h-6" />
                                        <span className="text-xs font-medium">{social.name}</span>
                                    </a>
                                ))}
                            </div>

                            <div className="flex gap-2 items-center">
                                <div className="flex-1 flex items-center bg-slate-100 rounded-xl px-3 py-2.5 min-w-0 border border-slate-200/60">
                                    <Link2 className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                                    <span className="text-sm text-slate-600 truncate select-all">{shareUrl}</span>
                                </div>
                                <Button
                                    onClick={handleCopyLink}
                                    className={cn(
                                        "shrink-0 transition-all rounded-xl",
                                        copied
                                            ? "bg-green-600 hover:bg-green-700"
                                            : "bg-violet-600 hover:bg-violet-700"
                                    )}
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4 mr-1" />
                                            Kopyalandı
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4 mr-1" />
                                            Kopyala
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center transition-all duration-300 ease-out">
                            {/* QR Code */}
                            <div className="p-4 bg-white border-2 border-slate-200 rounded-3xl shadow-inner mb-4">
                                {qrCodeUrl ? (
                                    <div className="relative w-64 h-64">
                                        <NextImage
                                            src={qrCodeUrl}
                                            alt="QR Code"
                                            fill
                                            className="object-contain"
                                            unoptimized
                                        />
                                    </div>
                                ) : (
                                    <div className="w-64 h-64 flex items-center justify-center bg-slate-50 rounded-lg">
                                        <div className="animate-spin w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full" />
                                    </div>
                                )}
                            </div>

                            {/* Catalog Name under QR */}
                            <p className="text-center text-slate-600 text-sm mb-6">
                                <span className="font-semibold">{catalogName}</span>
                                <br />
                                <span className="text-slate-400">kataloğuna erişmek için tarayın</span>
                            </p>

                            {/* Actions */}
                            <div className="flex gap-3 w-full">
                                <Button
                                    onClick={handleDownloadQR}
                                    className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl"
                                    disabled={!qrCodeUrl}
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    QR Kodu İndir
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleCopyLink}
                                    className="shrink-0 rounded-xl"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>

                            {/* Tip */}
                            <p className="text-xs text-slate-400 text-center mt-4">
                                💡 QR kodu bastırarak veya dijital olarak paylaşarak
                                <br />
                                müşterilerinizin kataloğunuza kolayca erişmesini sağlayın.
                            </p>
                        </div>
                    )}
                    </div>
                </div>
            </div>
        </div>
    )
}
