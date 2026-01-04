"use client"

import { useState, useRef } from "react"
import { MessageSquare, Send, Loader2, AlertCircle, Paperclip, X, Image as ImageIcon, Film } from "lucide-react"
import { usePathname } from "next/navigation"
import { toast } from "sonner"
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
    const fileInputRef = useRef<HTMLInputElement>(null)
    const pathname = usePathname()
    const { t } = useTranslation()
    const supabase = createClient()

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
            toast.error("Lütfen tüm alanları doldurun")
            return
        }

        setLoading(true)
        try {
            const attachmentUrls: string[] = []

            // Dosyaları yükle
            if (files.length > 0) {
                setUploading(true)
                for (const item of files) {
                    const fileExt = item.file.name.split('.').pop()
                    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
                    const filePath = `feedback/${fileName}`

                    const { error: uploadError } = await supabase.storage
                        .from('feedback-attachments')
                        .upload(filePath, item.file)

                    if (uploadError) throw uploadError

                    const { data: { publicUrl } } = supabase.storage
                        .from('feedback-attachments')
                        .getPublicUrl(filePath)

                    attachmentUrls.push(publicUrl)
                }
                setUploading(false)
            }

            await sendFeedback({
                subject,
                message,
                page_url: pathname,
                attachments: attachmentUrls
            })

            toast.success("Geri bildiriminiz için teşekkürler! Ekibimiz en kısa sürede inceleyecektir.")
            setOpen(false)
            setSubject("")
            setMessage("")
            setFiles([])
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Bir hata oluştu, lütfen tekrar deneyin.")
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
                        <span>Sorun Bildir / Geri Bildirim</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-violet-600" />
                            Geri Bildirim Gönder
                        </DialogTitle>
                        <DialogDescription>
                            Uygulama ile ilgili bir sorun mu yaşıyorsunuz veya bir öneriniz mi var? Bizimle paylaşın.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="subject">Konu</Label>
                            <Input
                                id="subject"
                                placeholder="Örn: Resim yükleme hatası, Yeni özellik önerisi..."
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message">Mesajınız</Label>
                            <Textarea
                                id="message"
                                placeholder="Lütfen yaşadığınız sorunu veya önerinizi detaylıca açıklayın..."
                                className="min-h-[120px] resize-none"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Dosya Ekle (Opsiyonel)</Label>
                            <div className="flex flex-wrap gap-2">
                                {files.map((file, index) => (
                                    <div key={index} className="relative w-20 h-20 rounded-lg border overflow-hidden group">
                                        {file.type.startsWith('image/') ? (
                                            <img src={file.preview} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                                <Film className="w-8 h-8 text-slate-400" />
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {files.length < 5 && (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center hover:border-violet-500 hover:bg-violet-50 transition-all text-slate-500 hover:text-violet-600"
                                    >
                                        <Paperclip className="w-6 h-6" />
                                        <span className="text-[10px] mt-1">Dosya Seç</span>
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
                                Maksimum 5 dosya (Görsel veya Video)
                            </p>
                        </div>

                        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50">
                            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-amber-800 dark:text-amber-300">
                                Geri bildiriminizle birlikte adınız, e-posta adresiniz ve sayfa bilginiz kaydedilecektir.
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
                            İptal
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
                            Gönder
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
