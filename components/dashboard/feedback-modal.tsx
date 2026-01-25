"use client"

import { useState, useRef } from "react"
import { MessageSquare, Send, Loader2, AlertCircle, Paperclip, X, Film } from "lucide-react"
import { usePathname } from "next/navigation"
import { toast } from "sonner"
import NextImage from "next/image"

import { createClient } from "@/lib/supabase/client"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { sendFeedback } from "@/lib/actions/feedback"
import { useTranslation } from "@/lib/i18n-provider"

interface FeedbackModalProps {
    children?: React.ReactNode
}

export function FeedbackModal({ children }: FeedbackModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [subject, setSubject] = useState("")
    const [message, setMessage] = useState("")
    const [files, setFiles] = useState<{ file: File; preview: string; type: string }[]>([])
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({})
    const fileInputRef = useRef<HTMLInputElement>(null)
    const pathname = usePathname()
    const { t } = useTranslation()
    const supabase = createClient()

    // Kullanıcı ID'sini al (upload için gerekli)
    const getUserId = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            throw new Error(t('auth.sessionExpired'))
        }
        return user.id
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || [])
        const newFiles = selectedFiles.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            type: file.type
        }))
        setFiles(prev => [...prev, ...newFiles].slice(0, 5)) // En fazla 5 dosya
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const removeFile = (index: number) => {
        setFiles(prev => {
            const newFiles = [...prev]
            URL.revokeObjectURL(newFiles[index].preview)
            newFiles.splice(index, 1)
            return newFiles
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!subject.trim() || !message.trim()) {
            toast.error(t('feedback.errorFields'))
            return
        }

        setLoading(true)
        setUploadProgress({})

        try {
            const attachmentUrls: string[] = []

            // Dosyaları yükle (timeout ile)
            if (files.length > 0) {
                setUploading(true)

                // Kullanıcı ID'sini al (storage policy için gerekli)
                const userId = await getUserId()

                for (let index = 0; index < files.length; index++) {
                    const item = files[index]

                    // Dosya boyutu kontrolü (50MB limit)
                    const maxSize = 50 * 1024 * 1024 // 50MB
                    if (item.file.size > maxSize) {
                        throw new Error(t('feedback.fileTooLarge'))
                    }

                    // Storage policy'ye uygun: ilk klasör kullanıcı ID'si olmalı
                    // Dosya adı daha sonra belirlenecek (convert sonrası)
                    let filePath = `${userId}/feedback/temp`

                    try {
                        // Progress göster
                        setUploadProgress(prev => ({ ...prev, [index]: 0 }))
                        const fileSizeMB = (item.file.size / 1024 / 1024).toFixed(2)
                        toast.loading(`${t('feedback.uploading')} (${index + 1}/${files.length}) - ${fileSizeMB}MB`, { id: `upload-${index}` })

                        // 1. Eğer resim ise WebP'ye çevir (hata yönetimi ile)
                        let blobToUpload: Blob = item.file
                        let contentType = item.file.type

                        if (item.file.type.startsWith('image/')) {
                            try {
                                const { convertToWebP } = await import("@/lib/image-utils")
                                const converted = await convertToWebP(item.file)
                                blobToUpload = converted.blob
                                contentType = 'image/webp'
                            } catch (convertError: any) {
                                console.warn(`[FeedbackModal] Convert error for ${item.file.name}:`, convertError)
                                // Convert başarısız olursa orijinal dosyayı kullan
                                blobToUpload = item.file
                                contentType = item.file.type
                                // Timeout hatası ise kullanıcıyı bilgilendir
                                if (convertError.message === 'TIMEOUT' || convertError.message?.includes('timeout')) {
                                    toast.warning('Fotoğraf işleme zaman aşımı, orijinal dosya yükleniyor.', { duration: 3000, id: `upload-${index}` })
                                }
                            }
                        }

                        // Dosya adını oluştur (convert sonrası)
                        const originalName = item.file.name
                        const lastDotIndex = originalName.lastIndexOf('.')
                        const fileExt = contentType === 'image/webp' ? 'webp' : (lastDotIndex > 0 ? originalName.substring(lastDotIndex + 1).toLowerCase() : 'bin')
                        const baseName = originalName.substring(0, lastDotIndex > 0 ? lastDotIndex : originalName.length)
                        const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50)
                        const fileName = `${sanitizedBaseName}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
                        const filePath = `${userId}/feedback/${fileName}`

                        // Dosya boyutuna göre dinamik timeout (her MB için 10 saniye, minimum 60, maksimum 600 saniye)
                        // Convert işlemi için ekstra 20 saniye ekle
                        const baseTimeout = Math.min(Math.max(blobToUpload.size / 1024 / 1024 * 10000, 60000), 600000)
                        const timeoutMs = baseTimeout + 20000 // Convert için ekstra süre

                        // Timeout ID'yi sakla
                        let timeoutId: NodeJS.Timeout | null = null

                        // Upload promise'i oluştur
                        const uploadPromise = supabase.storage
                            .from('feedback-attachments')
                            .upload(filePath, blobToUpload, {
                                cacheControl: '3600',
                                upsert: false,
                                contentType: contentType
                            })
                            .then((result) => {
                                // Timeout'u temizle
                                if (timeoutId) {
                                    clearTimeout(timeoutId)
                                    timeoutId = null
                                }
                                return result
                            })
                            .catch((error) => {
                                // Timeout'u temizle
                                if (timeoutId) {
                                    clearTimeout(timeoutId)
                                    timeoutId = null
                                }
                                throw error
                            })

                        // Timeout promise'i (dinamik)
                        const timeoutPromise = new Promise<never>((_, reject) => {
                            timeoutId = setTimeout(() => {
                                timeoutId = null
                                reject(new Error('UPLOAD_TIMEOUT'))
                            }, timeoutMs)
                        })

                        // Race ile timeout kontrolü
                        const result = await Promise.race([uploadPromise, timeoutPromise])

                        // Timeout'u temizle (eğer hala varsa)
                        if (timeoutId) {
                            clearTimeout(timeoutId)
                            timeoutId = null
                        }

                        // Upload hatası kontrolü
                        if (result.error) {
                            throw new Error(result.error.message || t('feedback.errorUpload'))
                        }

                        // Signed URL al (private bucket için)
                        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                            .from('feedback-attachments')
                            .createSignedUrl(filePath, 31536000) // 1 yıl geçerli

                        if (signedUrlError) {
                            // Fallback: Public URL dene
                            const { data: { publicUrl } } = supabase.storage
                                .from('feedback-attachments')
                                .getPublicUrl(filePath)
                            attachmentUrls.push(publicUrl)
                        } else {
                            attachmentUrls.push(signedUrlData.signedUrl)
                        }

                        setUploadProgress(prev => ({ ...prev, [index]: 100 }))
                        toast.success(t('feedback.uploadSuccess', { current: index + 1, total: files.length }), { id: `upload-${index}` })

                    } catch (uploadError: unknown) {
                        let errorMessage = t('feedback.uploadFailed')

                        if (uploadError instanceof Error) {
                            if (uploadError.message === 'UPLOAD_TIMEOUT') {
                                errorMessage = t('auth.timeout')
                            } else {
                                errorMessage = uploadError.message
                            }
                        }

                        toast.error(errorMessage, { id: `upload-${index}`, duration: 5000 })
                        throw new Error(errorMessage)
                    }
                }

                setUploading(false)
                setUploadProgress({})
            }

            // Feedback gönder
            toast.loading(t('feedback.sending'), { id: 'feedback-send' })

            await sendFeedback({
                subject,
                message,
                page_url: pathname,
                attachments: attachmentUrls
            })

            toast.success(t('feedback.success'), { id: 'feedback-send' })
            setOpen(false)
            setSubject("")
            setMessage("")
            setFiles([])
            setUploadProgress({})
        } catch (error: unknown) {
            console.error("Feedback submit error:", error)
            const msg = error instanceof Error ? error.message : t('common.error')
            toast.error(msg, { id: 'feedback-send' })
        } finally {
            setLoading(false)
            setUploading(false)
            setUploadProgress({})
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-3 px-3">
                        <MessageSquare className="w-5 h-5" />
                        <span>{t('feedback.trigger')}</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-violet-600" />
                            {t('feedback.title')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('feedback.description')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="subject">{t('feedback.subject')}</Label>
                            <Input
                                id="subject"
                                placeholder={t('feedback.subjectPlaceholder')}
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message">{t('feedback.message')}</Label>
                            <Textarea
                                id="message"
                                placeholder={t('feedback.messagePlaceholder')}
                                className="min-h-[120px] resize-none"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{t('feedback.addFiles')}</Label>
                            <div className="flex flex-wrap gap-2">
                                {files.map((file, index) => {
                                    const progress = uploadProgress[index]
                                    const isUploading = uploading && progress !== undefined && progress < 100

                                    return (
                                        <div key={index} className="relative w-20 h-20 rounded-lg border overflow-hidden group">
                                            {file.type.startsWith('image/') ? (
                                                <div className="relative w-full h-full">
                                                    <NextImage src={file.preview} alt="" fill className="object-cover" unoptimized />
                                                </div>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                                    <Film className="w-8 h-8 text-slate-400" />
                                                </div>
                                            )}
                                            {isUploading && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                                                </div>
                                            )}
                                            {!isUploading && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(index)}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    disabled={loading}
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                                {files.length < 5 && (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center hover:border-violet-500 hover:bg-violet-50 transition-all text-slate-500 hover:text-violet-600"
                                    >
                                        <Paperclip className="w-6 h-6" />
                                        <span className="text-[10px] mt-1">{t('feedback.selectFile')}</span>
                                    </button>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*,video/*"
                                multiple
                                onChange={handleFileSelect}
                            />
                            <p className="text-[10px] text-muted-foreground italic">
                                {t('feedback.maxFiles')}
                            </p>
                        </div>

                        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50">
                            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-amber-800 dark:text-amber-300">
                                {t('feedback.alert')}
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            {t('feedback.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-violet-600 hover:bg-violet-700 gap-2"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            {t('feedback.send')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
