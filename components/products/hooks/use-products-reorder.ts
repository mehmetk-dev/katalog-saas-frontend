"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { moveProduct, type Product, type ProductMove } from "@/lib/actions/products"
import { applyLocalMove } from "@/components/products/products-page-utils"

export type ReorderStatus = "idle" | "saving" | "saved" | "error"

interface UseProductsReorderParams {
  t: (key: string, params?: Record<string, unknown>) => string
  currentPage: number
  totalPages: number
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
  routerRefresh: () => void
}

/**
 * Manuel sıralama: ekranda anında (iyimser) uygular, sunucuya taşımaları SIRAYLA gönderir.
 * Sıralı gönderim önemli: art arda iki sürükleme paralel gitseydi ikincisi birincinin
 * eski sırasına göre hesaplanabilirdi. Kuyruk boşalınca gerekiyorsa sayfa sunucudan yenilenir
 * (başka sayfaya giden ürün / hata durumunda doğru listeyi geri getirmek için).
 */
export function useProductsReorder({ t, currentPage, totalPages, setProducts, routerRefresh }: UseProductsReorderParams) {
  const [status, setStatus] = useState<ReorderStatus>("idle")
  const queueRef = useRef<Promise<void>>(Promise.resolve())
  const pendingRef = useRef(0)
  const failedRef = useRef(false)
  const needsRefreshRef = useRef(false)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
  }, [])

  const handleMove = useCallback((move: ProductMove) => {
    const page = { isFirst: currentPage <= 1, isLast: currentPage >= totalPages }
    setProducts((prev) => applyLocalMove(prev, move, page))
    if (move.position === "first" || move.position === "last") needsRefreshRef.current = true

    pendingRef.current += 1
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    setStatus("saving")

    queueRef.current = queueRef.current
      .then(async () => {
        const result = await moveProduct(move)
        if (!result.success) failedRef.current = true
      })
      .catch(() => {
        failedRef.current = true
      })
      .finally(() => {
        pendingRef.current -= 1
        if (pendingRef.current > 0) return

        const failed = failedRef.current
        failedRef.current = false
        if (failed || needsRefreshRef.current) {
          needsRefreshRef.current = false
          routerRefresh()
        }

        if (failed) {
          setStatus("error")
          toast.error(t("products.reorder.failed"))
        } else {
          setStatus("saved")
          savedTimerRef.current = setTimeout(() => setStatus("idle"), 2000)
        }
      })
  }, [currentPage, totalPages, setProducts, routerRefresh, t])

  return { reorderStatus: status, handleMove }
}
