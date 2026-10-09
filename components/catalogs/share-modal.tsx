"use client"

import React, { useState, useEffect } from "react"
import QRCode from "qrcode"
import NextImage from "next/image"
import { Check, Copy, Download, Globe, Link as LinkIcon, QrCode, Send } from "lucide-react"
import { toast } from "sonner"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type Catalog } from "@/lib/actions/catalogs"
import { useTranslation } from "@/lib/contexts/i18n-provider"

interface ShareModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    catalog: Catalog | null
    isPublished: boolean
    shareUrl: string
    /** Verilmezse yayında olmayan katalog için PDF butonu gösterilmez */
    onDownloadPdf?: () => Promise<void> | void
}

export function ShareModal({ open, onOpenChange, catalog, isPublished, shareUrl, onDownloadPdf }: ShareModalProps) {
    const { t } = useTranslation()
    const [copied, setCopied] = useState(false)
    const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
    const [activeTab, setActiveTab] = useState<"link" | "qr">("link")

    const catalogName = catalog?.name || "Katalog"

    // QR kodu (görsel içeriği: koyu modül, beyaz zemin — taranabilirlik için temadan bağımsız)
    useEffect(() => {
        if (open && shareUrl && isPublished) {
            QRCode.toDataURL(shareUrl, {
                width: 600,
                margin: 2,
                color: {
                    dark: "#18181b",
                    light: "#ffffff"
                },
                errorCorrectionLevel: "H"
            }).then(setQrCodeUrl).catch(console.error)
        }
    }, [open, shareUrl, isPublished])

    const handleCopyLink = async () => {
        if (!isPublished || !shareUrl) return
        try {
            await navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            toast.success(t("share.linkCopiedToast"))
            setTimeout(() => setCopied(false), 2000)
        } catch {
            toast.error(t("share.copyFailed"))
        }
    }

    const handleDownloadQR = () => {
        if (!qrCodeUrl) return
        const link = document.createElement("a")
        link.download = `${catalogName.replace(/\s+/g, "-").toLowerCase()}-qr.png`
        link.href = qrCodeUrl
        link.click()
        toast.success(t("share.qrSavedToast"))
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
                    text: t("share.qrCodeTitle").replace("{name}", catalogName)
                })
            } else {
                handleDownloadQR()
            }
        } catch (error) {
            console.error("QR Share Error:", error)
        }
    }

    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedText = encodeURIComponent(t("share.shareText").replace("{name}", catalogName))

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t("share.title")}</DialogTitle>
                    <DialogDescription className="truncate">{catalogName}</DialogDescription>
                </DialogHeader>

                {!isPublished ? (
                    <div className="flex flex-col items-center gap-4 rounded-lg border border-warning/30 bg-warning-soft px-6 py-8 text-center">
                        <Globe className="size-8 text-warning-soft-foreground" />
                        <div className="space-y-1">
                            <h3 className="font-semibold text-foreground">{t("share.notPublishedTitle")}</h3>
                            <p className="mx-auto max-w-xs text-sm text-muted-foreground">{t("share.notPublishedDesc")}</p>
                        </div>
                        {onDownloadPdf && (
                            <Button variant="outline" onClick={() => { onOpenChange(false); void onDownloadPdf() }}>
                                <Download /> {t("share.downloadPdf")}
                            </Button>
                        )}
                    </div>
                ) : (
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "link" | "qr")} className="gap-5">
                        <TabsList className="w-full">
                            <TabsTrigger value="link"><LinkIcon /> {t("share.linkTab")}</TabsTrigger>
                            <TabsTrigger value="qr"><QrCode /> {t("share.qrTab")}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="link" className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="share-url">{t("share.catalogLink")}</Label>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <Input
                                        id="share-url"
                                        readOnly
                                        value={shareUrl.replace(/^https?:\/\//, "")}
                                        onFocus={(e) => e.currentTarget.select()}
                                        className="font-mono text-xs"
                                    />
                                    <Button onClick={handleCopyLink} className="shrink-0">
                                        {copied ? <Check /> : <Copy />}
                                        {copied ? t("share.copied") : t("share.copyLink")}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium text-foreground">{t("share.quickShare")}</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { name: "WhatsApp", icon: "/icons/social/whatsapp.png", url: `https://wa.me/?text=${encodedText}%20${encodedUrl}` },
                                        { name: "Telegram", icon: "/icons/social/telegram.png", url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}` },
                                        { name: "Email", icon: "/icons/social/gmail.png", url: `mailto:?subject=${encodeURIComponent(catalogName)}&body=${encodedText}%0A%0A${encodedUrl}` },
                                        { name: "LinkedIn", icon: "/icons/social/linkedin.png", url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
                                    ].map((soc) => (
                                        <a
                                            key={soc.name}
                                            href={soc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex flex-col items-center gap-1.5 rounded-lg border bg-card px-2 py-3 text-xs font-medium text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            <NextImage src={soc.icon} width={24} height={24} alt="" className="object-contain" unoptimized />
                                            {soc.name}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="qr" className="flex flex-col items-center gap-4">
                            <div className="flex size-52 items-center justify-center rounded-lg border bg-card p-3">
                                {qrCodeUrl && (
                                    <NextImage src={qrCodeUrl} alt={t("share.qrCodeTitle").replace("{name}", catalogName)} width={180} height={180} unoptimized className="rounded-md" />
                                )}
                            </div>
                            <p className="max-w-xs text-center text-sm text-muted-foreground">{t("share.qrDescription")}</p>
                            <div className="grid w-full grid-cols-2 gap-2">
                                <Button onClick={handleShareQR}>
                                    <Send /> {t("share.shareBtn")}
                                </Button>
                                <Button variant="outline" onClick={handleDownloadQR}>
                                    <Download /> {t("share.downloadBtn")}
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    )
}
