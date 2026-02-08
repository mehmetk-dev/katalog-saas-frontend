"use client"

import { useCallback, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

/**
 * SessionWatcher Component
 * 
 * Bu bileşen arka planda Supabase oturumunu izler.
 * 1. Oturum değişikliğinde (giriş/çıkış) sayfayı yeniler.
 * 2. Sekmeye odaklanıldığında veya SAYFA DEĞİŞTİĞİNDE (navigasyon) oturumu tazeler.
 */
export function SessionWatcher() {
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()

    // Gereksiz refresh'leri önlemek için son kontrol zamanı
    const lastCheckTime = useRef<number>(0)

    // Ortak refresh fonksiyonu
    const refreshSession = useCallback(async (source: string) => {
        const now = Date.now()
        // Çok sık kontrolü engelle (örn: 5 saniyede bir en fazla)
        if (now - lastCheckTime.current < 5000) return

        lastCheckTime.current = now

        try {
            // Sadece getSession çağırmak bile arka planda gerekiyorsa refresh yapar
            const { data: { session }, error } = await supabase.auth.getSession()

            if (error) {
                console.error(`[SessionWatcher] ${source} refresh error:`, error)
            } else if (!session && pathname?.startsWith('/dashboard')) {
                // Dashboard'dayız ama session yok, refresh yap ki middleware yakalasın
                console.warn(`[SessionWatcher] ${source} - Session lost, refreshing router`)
                router.refresh()
            } else {
                // console.log(`[SessionWatcher] ${source} - Session active`)
            }
        } catch (e) {
            console.error(`[SessionWatcher] ${source} check failed`, e)
        }
    }, [pathname, router, supabase.auth])

    useEffect(() => {
        // 1. Auth Durum Değişikliklerini Dinle
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event) => {
            if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
                router.refresh()
            }
        })

        // 2. Sekmeye Geri Dönüldüğünde
        const handleFocus = () => refreshSession('focus')
        window.addEventListener("focus", handleFocus)

        return () => {
            subscription.unsubscribe()
            window.removeEventListener("focus", handleFocus)
        }
    }, [router, supabase.auth, refreshSession])

    // 3. Her Sayfa Değişiminde (Pathname değiştiğinde)
    useEffect(() => {
        refreshSession('navigation')
    }, [pathname, refreshSession])

    return null // Bu bileşen bir şey render etmez, sadece arka planda çalışır
}
