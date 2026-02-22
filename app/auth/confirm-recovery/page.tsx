'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { RefreshCw, ShieldCheck, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Bu sayfa email scanner'ların (Gmail/Outlook) linki 
 * önden "tüketip" geçersiz kılmasını engellemek için yapılmıştır.
 */
export default function ConfirmRecoveryPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isRedirecting, setIsRedirecting] = useState(false)
    const [pageError, setPageError] = useState<string | null>(null)

    // Check for errors immediately on mount
    useEffect(() => {
        const queryError = searchParams.get('error')
        const queryErrorDesc = searchParams.get('error_description')

        // Hash also contains error in Supabase implicit flow
        const hashParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.hash.replace('#', '?')) : null
        const hashError = hashParams?.get('error') || hashParams?.get('?error')
        const hashErrorDesc = hashParams?.get('error_description')

        if (queryError || hashError) {
            setPageError(queryErrorDesc || hashErrorDesc || 'Geçersiz veya süresi dolmuş link.')
        }
    }, [searchParams])

    const handleConfirm = () => {
        setIsRedirecting(true)
        const code = searchParams.get('code')
        const next = searchParams.get('next') || '/auth/reset-password'

        // Supabase implicit flow puts tokens in hash. If hash has access_token, we can go to reset-password
        const hash = typeof window !== 'undefined' ? window.location.hash : ''

        if (code) {
            router.push(`/auth/callback?code=${code}&next=${next}&type=recovery`)
        } else if (hash.includes('access_token')) {
            router.push(`/auth/reset-password${hash}`)
        } else if (pageError) {
            router.push(`/auth/forgot-password?error=invalid_link`)
        } else {
            // No code, no hash, no error - likely PKCE flow handled differently or missing data
            router.push('/auth/forgot-password?error=invalid_link')
        }
    }

    if (pageError) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
                <Card className="w-full max-w-lg shadow-2xl border-t-8 border-t-red-600 rounded-2xl overflow-hidden bg-white">
                    <CardHeader className="text-center pb-0 pt-10">
                        <div className="mx-auto w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                            <ShieldCheck className="w-10 h-10 text-red-600" />
                        </div>
                        <CardTitle className="text-3xl font-montserrat font-black tracking-tighter text-slate-900 leading-none uppercase">
                            Hata <span className="text-red-600">Oluştu</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6 pb-12">
                        <div className="text-center space-y-4 px-4">
                            <p className="text-slate-600 text-lg font-medium leading-relaxed">
                                Şifre sıfırlama linkiniz geçersiz veya süresi dolmuş. Lütfen yeni bir link talep edin.
                            </p>
                        </div>
                        <div className="px-6">
                            <Button
                                onClick={() => router.push('/auth/forgot-password')}
                                className="w-full h-14 bg-slate-900 hover:bg-black text-white font-montserrat font-bold shadow-xl transition-all rounded-xl text-lg uppercase tracking-wider"
                            >
                                Yeni Link İste
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
            <Card className="w-full max-w-lg shadow-2xl border-t-8 border-t-[#cf1414] rounded-2xl overflow-hidden bg-white">
                <CardHeader className="text-center pb-0 pt-10">
                    <div className="mx-auto w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mb-6 rotate-3">
                        <ShieldCheck className="w-10 h-10 text-[#cf1414]" />
                    </div>
                    <CardTitle className="text-3xl font-montserrat font-black tracking-tighter text-slate-900 leading-none uppercase">
                        Giriş <span className="text-[#cf1414]">Onayı</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 pt-6 pb-12">
                    <div className="text-center space-y-4 px-4">
                        <p className="text-slate-600 text-lg font-medium leading-relaxed">
                            Güvenliğiniz için lütfen şifre yenileme işlemini aşağıdaki butona tıklayarak başlatın.
                        </p>
                    </div>

                    <div className="px-6">
                        <Button
                            onClick={handleConfirm}
                            disabled={isRedirecting}
                            className="w-full h-14 bg-[#cf1414] hover:bg-[#b01010] text-white font-montserrat font-bold shadow-xl shadow-red-500/20 transition-all rounded-xl text-lg uppercase tracking-wider"
                        >
                            {isRedirecting ? (
                                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                            ) : null}
                            İşlemi Başlat
                        </Button>
                    </div>

                    <div className="text-center pt-8 border-t border-slate-50 flex items-center justify-center gap-2">
                        <Heart className="w-4 h-4 text-[#cf1414] animate-pulse" />
                        <span className="font-montserrat text-sm text-slate-400 font-bold uppercase tracking-widest">
                            FogCatalog Security
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
