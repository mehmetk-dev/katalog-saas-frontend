"use client"

import { useState } from "react"
import { MessageSquare, Send, Loader2, AlertCircle } from "lucide-react"
import { usePathname } from "next/navigation"
import { toast } from "sonner"

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
    const pathname = usePathname()
    const { t } = useTranslation()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!subject.trim() || !message.trim()) {
            toast.error("Lütfen tüm alanları doldurun")
            return
        }

        setLoading(true)
        try {
            await sendFeedback({
                subject,
                message,
                page_url: pathname
            })
            toast.success("Geri bildiriminiz için teşekkürler! Ekibimiz en kısa sürede inceleyecektir.")
            setOpen(false)
            setSubject("")
            setMessage("")
        } catch (error) {
            console.error(error)
            toast.error("Bir hata oluştu, lütfen tekrar deneyin.")
        } finally {
            setLoading(false)
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

                        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50">
                            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-amber-800 dark:text-amber-300">
                                Geri bildiriminizle birlikte adınız, e-posta adresiniz ve şu an bulunduğunuz sayfa adresi sistemimize kaydedilecektir.
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
