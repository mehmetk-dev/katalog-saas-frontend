"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

/**
 * SessionWatcher Component
 * 
 * Bu bileşen arka planda Supabase oturumunu izler.
 * Java/Spring dünyasındaki SessionListener'a benzer bir görevi vardır:
 * 1. Oturum durumunda bir değişiklik (giriş/çıkış/token yenileme) olduğunda Server Component'leri yeniler.
 * 2. Uygulama sekmesi tekrar odaklandığında (focus) session'ı tazeler (refresh).
 * 3. Token süresi dolmuşsa veya başka bir sekmede çıkış yapılmışsa UI'ı güncel tutar.
 */
export function SessionWatcher() {
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        // 1. Auth Durum Değişikliklerini Dinle
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {

            if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
                // Next.js router.refresh() sunucu tarafındaki cookie'leri ve durumu senkronize eder
                router.refresh()
            }
        })

        // 2. Sekmeye Geri Dönüldüğünde Session'ı Tazele
        // Bilgisayar uykudan kalktığında veya sekme saatler sonra açıldığında çalışır
        const handleFocus = async () => {
            const { data: { session }, error } = await supabase.auth.getSession()

            if (error) {
                console.error("[SessionWatcher] Session refresh error:", error)
                return
            }

            if (!session) {
                // Eğer session yoksa ve dashboard'daysak logout olmuş olabiliriz
                if (window.location.pathname.startsWith('/dashboard')) {
                    router.refresh()
                }
            }
        }

        window.addEventListener("focus", handleFocus)

        return () => {
            subscription.unsubscribe()
            window.removeEventListener("focus", handleFocus)
        }
    }, [router, supabase.auth])

    return null // Bu bileşen bir şey render etmez, sadece arka planda çalışır
}
