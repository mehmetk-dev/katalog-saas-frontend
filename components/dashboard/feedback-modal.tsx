"use client"

import { useState, useRef, useEffect } from "react"
import { MessageSquare, Send, Loader2, AlertCircle, Paperclip, X, Film } from "lucide-react"
import { usePathname } from "next/navigation"
import { toast } from "sonner"
import NextImage from "next/image"

import { createClient, getSessionSafe } from "@/lib/supabase/client"
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
import { storage } from "@/lib/storage"

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
    const fileInputRef = useRef<HTMLInputElement>(null)
    const pathname = usePathname()
    const { t } = useTranslation()
    const supabase = createClient()

    // Upload işlemlerini iptal etmek için ref'ler
    const uploadAbortControllers = useRef<Map<string, AbortController>>(new Map())
    const uploadTimeoutIds = useRef<Map<string, NodeJS.Timeout>>(new Map())

    // Fotoğraf yükleme alanına tıklandığında (daha dosya seçilmeden) oturumu tazele (Just-in-Time)
    const handleUploadClick = async () => {
        const { error } = await supabase.auth.refreshSession()
        if (error) console.error('[FeedbackModal] Pre-upload session refresh failed:', error)
    }

    // YENİ: Tekil dosya yükleme ve Retry (Yeniden Deneme) mantığı
    const uploadSingleFileWithRetry = async (file: File, fileIndex: number, signal?: AbortSignal): Promise<string> => {
        const MAX_RETRIES = 3
        const TIMEOUT_MS = 10000 // 10 Saniye (Kullanıcı isteği)
        const uploadKey = `file-${fileIndex}`

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            // ... (rest of the logic remains same until inner try)
            // İptal kontrolü
            if (signal?.aborted) {
                throw new Error('Upload cancelled')
            }

            let timeoutId: NodeJS.Timeout | null = null

            try {
                // 1. Bekleme Süresi (Exponential Backoff - İlk denemede beklemez)
                if (attempt > 0) {
                    const waitTime = 1000 * Math.pow(2, attempt - 1) // 1s, 2s, 4s...


                    // Bekleme sırasında da iptal kontrolü
                    await new Promise<void>((resolve, reject) => {
                        const checkInterval = setInterval(() => {
                            if (signal?.aborted) {
                                clearInterval(checkInterval)
                                reject(new Error('Upload cancelled'))
                            }
                        }, 100)

                        setTimeout(() => {
                            clearInterval(checkInterval)
                            resolve()
                        }, waitTime)
                    })
                }

                // İptal kontrolü (bekleme sonrası)
                if (signal?.aborted) {
                    throw new Error('Upload cancelled')
                }

                // 2. Dosya adı oluştur
                const fileExtension = file.name.split('.').pop() || 'bin'
                const baseName = file.name.substring(0, file.name.lastIndexOf('.') || file.name.length)
                const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50)
                const fileName = `${sanitizedBaseName}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`

                // 3. YARIŞ BAŞLASIN: Upload vs Timeout
                // Hangisi önce biterse o kazanır. 1 saniye bekleme şartı yok.
                const uploadPromise = storage.upload(file, {
                    path: 'feedback', // Yeni klasör yapısı: feedback klasörü
                    contentType: file.type || 'application/octet-stream',
                    cacheControl: '3600',
                    fileName,
                    signal, // AĞ SEVİYESİNDE İPTAL DESTEĞİ
                })

                // Timeout promise'i (temizlenebilir)
                const timeoutPromise = new Promise<never>((_, reject) => {
                    timeoutId = setTimeout(() => {
                        console.error(`[FeedbackModal] ⏱️ Upload timeout for ${file.name} after ${TIMEOUT_MS / 1000} seconds`)
                        reject(new Error('UPLOAD_TIMEOUT'))
                    }, TIMEOUT_MS)

                    // Timeout ID'yi kaydet (temizlemek için)
                    uploadTimeoutIds.current.set(uploadKey, timeoutId)
                })

                const result: any = await Promise.race([uploadPromise, timeoutPromise])

                // Timeout'u temizle (başarılı olduysa)
                if (timeoutId) {
                    clearTimeout(timeoutId)
                    uploadTimeoutIds.current.delete(uploadKey)
                    timeoutId = null
                }

                // 4. Sonuç Kontrolü
                if (result && result.url) {
                    return result.url // Başarılı! URL'i döndür ve fonksiyondan çık.
                } else {
                    throw new Error('Upload successful but URL is missing')
                }

            } catch (error: any) {
                // Timeout'u temizle (hata durumunda)
                if (timeoutId) {
                    clearTimeout(timeoutId)
                    uploadTimeoutIds.current.delete(uploadKey)
                    timeoutId = null
                }

                // İptal hatası ise direkt fırlat
                if (error.message === 'Upload cancelled' || signal?.aborted) {
                    throw error
                }

                console.error(`[FeedbackModal] ❌ Attempt ${attempt + 1} failed:`, error.message)

                // Eğer son denemeyse hatayı fırlat ki ana fonksiyon yakalasın
                if (attempt === MAX_RETRIES - 1) {
                    throw error
                }
                // Değilse döngü başa döner ve tekrar dener
            }
        }
        throw new Error('Unexpected retry loop exit')
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleUploadClick() // Dosya seçildiğinde refresh yap
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
        // Devam eden upload'ı iptal et
        const uploadKey = `file-${index}`
        const controller = uploadAbortControllers.current.get(uploadKey)
        if (controller) {
            controller.abort()
            uploadAbortControllers.current.delete(uploadKey)
        }

        // Timeout'u temizle
        const timeoutId = uploadTimeoutIds.current.get(uploadKey)
        if (timeoutId) {
            clearTimeout(timeoutId)
            uploadTimeoutIds.current.delete(uploadKey)
        }

        setFiles(prev => {
            const newFiles = [...prev]
            URL.revokeObjectURL(newFiles[index].preview)
            newFiles.splice(index, 1)
            return newFiles
        })
    }

    // Modal kapatıldığında devam eden upload'ları iptal et
    useEffect(() => {
        if (!open) {
            // Devam eden upload'ları iptal et
            uploadAbortControllers.current.forEach((controller) => {
                controller.abort()
            })
            uploadAbortControllers.current.clear()

            // Tüm timeout'ları temizle
            uploadTimeoutIds.current.forEach((timeoutId) => {
                clearTimeout(timeoutId)
            })
            uploadTimeoutIds.current.clear()
        }
    }, [open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!subject.trim() || !message.trim()) {
            toast.error(t('feedback.errorFields'))
            return
        }

        setLoading(true)

        try {
            const attachmentUrls: string[] = []

            // Dosyaları yükle (retry logic ile)
            if (files.length > 0) {
                setUploading(true)

                // Ana AbortController oluştur (tüm upload'lar için)
                const mainAbortController = new AbortController()
                uploadAbortControllers.current.set('main-upload', mainAbortController)

                for (let index = 0; index < files.length; index++) {
                    const item = files[index]

                    // İptal kontrolü
                    if (mainAbortController.signal.aborted) break

                    // Dosya boyutu kontrolü (50MB limit)
                    const maxSize = 50 * 1024 * 1024 // 50MB
                    if (item.file.size > maxSize) {
                        throw new Error(`${item.file.name}: ${t('feedback.fileTooLarge')}`)
                    }

                    try {
                        const fileSizeMB = (item.file.size / 1024 / 1024).toFixed(2)
                        toast.loading(`${t('feedback.uploading')} (${index + 1}/${files.length}) - ${fileSizeMB}MB`, { id: `upload-${index}` })

                        const publicUrl = await uploadSingleFileWithRetry(item.file, index, mainAbortController.signal)
                        attachmentUrls.push(publicUrl)

                        toast.success(t('feedback.uploadSuccess', { current: index + 1, total: files.length }), { id: `upload-${index}` })

                    } catch (uploadError: unknown) {
                        if (uploadError instanceof Error && (uploadError.message === 'Upload cancelled' || mainAbortController.signal.aborted)) {

                            break
                        }
                        const msg = uploadError instanceof Error ? uploadError.message : "Upload error"
                        toast.error(msg, { id: `upload-${index}` })
                        throw uploadError
                    }
                }

                // Cleanup
                mainAbortController.abort()
                uploadAbortControllers.current.delete('main-upload')

                setUploading(false)
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

        } catch (error: unknown) {
            console.error("Feedback submit error:", error)
            const msg = error instanceof Error ? error.message : t('common.error')
            toast.error(msg, { id: 'feedback-send' })
        } finally {
            setLoading(false)
            setUploading(false)
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
                                            {uploading && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                                                </div>
                                            )}
                                            {!uploading && (
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
                                        onClick={() => {
                                            handleUploadClick()
                                            fileInputRef.current?.click()
                                        }}
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
