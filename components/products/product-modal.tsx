"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
import { Plus, Trash2, Loader2, Upload, X, Wand2, ImagePlus, GripVertical, Sparkles, Tag, Barcode, Package2, Layers, ChevronDown, ChevronUp, FolderPlus } from "lucide-react"
import NextImage from "next/image"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { type Product, type CustomAttribute, createProduct, updateProduct } from "@/lib/actions/products"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { storage } from "@/lib/storage"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTranslation } from "@/lib/i18n-provider"

interface ProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSaved: (product: Product) => void
  allCategories?: string[]
  userPlan?: 'free' | 'plus' | 'pro'
}

// Magic descriptions kept as hardcoded fallback for now
const MAGIC_DESCRIPTIONS_TR = [
  "Modern tasarımı ve üstün kalitesiyle yaşam alanınıza zarafet katacak bu ürün, dayanıklı malzemelerden üretilmiş olup uzun ömürlü kullanım sunar.",
  "Ergonomik yapısı ve şık detaylarıyla dikkat çeken bu parça, beklentilerinizi fazlasıyla karşılayacak. Hem fonksiyonel hem estetik.",
  "Minimalist çizgileri ve fonksiyonel yapısıyla öne çıkan bu tasarım, kullanım kolaylığı sağlarken şıklığından ödün vermiyor.",
  "Kaliteden ödün vermeyenler için özel olarak tasarlandı. Her detayı özenle düşünülen bu ürün, stil sahibi kullanıcılar için ideal.",
  "Yüksek performans ve estetik bir arada. Bu ürün, günlük ihtiyaçlarınızı karşılarken mekanınıza modern bir dokunuş katacak.",
  "Profesyonel kullanım için tasarlanan bu ürün, üstün kalite standartlarıyla öne çıkıyor. Dayanıklı yapısıyla uzun yıllar size eşlik edecek.",
  "Zarif tasarımı ve kullanışlı özellikleriyle dikkat çeken bu ürün, her ortama uyum sağlayacak şekilde tasarlandı.",
]

const MAGIC_DESCRIPTIONS_EN = [
  "With its modern design and superior quality, this product adds elegance to your living space. Made from durable materials for long-lasting use.",
  "Standing out with its ergonomic structure and stylish details, this piece will exceed your expectations. Both functional and aesthetic.",
  "Featuring minimalist lines and functional structure, this design offers ease of use without compromising on style.",
  "Designed specifically for those who do not compromise on quality. Every detail is carefully considered, ideal for stylish users.",
  "High performance and aesthetics combined. this product will add a modern touch to your space while meeting your daily needs.",
  "Designed for professional use, this product stands out with superior quality standards. It will accompany you for many years with its durable structure.",
  "Attention-grabbing with its elegant design and useful features, this product is designed to fit into any environment.",
]

export function ProductModal({ open, onOpenChange, product, onSaved, allCategories = [], userPlan: _userPlan = 'free' }: ProductModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const { t: baseT, language } = useTranslation()
  const t = useCallback((key: string, params?: Record<string, any>) => baseT(key, params) as string, [baseT])
  const isEditing = !!product

  const unitKeys = ["none", "kg", "g", "m", "cm", "mm", "L", "mL", "adet", "paket", "kutu"]
  const quickAttributeKeys = [
    { key: "color", icon: "🎨" },
    { key: "material", icon: "🧱" },
    { key: "weight", icon: "⚖️" },
    { key: "size", icon: "📐" },
    { key: "origin", icon: "🌍" },
    { key: "warranty", icon: "🛡️" },
  ]

  const [customAttributes, setCustomAttributes] = useState<CustomAttribute[]>(() => product?.custom_attributes || [])
  const [activeTab, setActiveTab] = useState("basic")

  // Form state
  const [name, setName] = useState(product?.name || "")
  const [sku, setSku] = useState(product?.sku || "")
  const [description, setDescription] = useState(product?.description || "")
  const [price, setPrice] = useState(product?.price?.toString() || "")
  const [stock, setStock] = useState(product?.stock?.toString() || "")
  const [category, setCategory] = useState<string[]>(() => {
    if (!product?.category) return []
    // Virgülle ayrılmış kategorileri array'e çevir
    return product.category.split(',').map(c => c.trim()).filter(Boolean)
  })
  const [categoryInput, setCategoryInput] = useState("")
  const [showCategorySection, setShowCategorySection] = useState(false)
  const [currency, setCurrency] = useState(
    product?.custom_attributes?.find(a => a.name === "currency")?.value || "TRY"
  )
  const [productUrl, setProductUrl] = useState(product?.product_url || "")

  // Upload State - UPLOAD ON SAVE: Fotoğraflar sadece "Kaydet" butonuna basıldığında yüklenecek
  const [isUploading, setIsUploading] = useState(false)
  const [, setUploadedUrl] = useState<string | null>(null)
  const [activeImageUrl, setActiveImageUrl] = useState(product?.image_url || "")
  const [additionalImages, setAdditionalImages] = useState<string[]>([])
  const blobUrlsRef = useRef<string[]>([])

  // Upload işlemlerini iptal etmek için ref'ler
  const uploadAbortControllers = useRef<Map<string, AbortController>>(new Map())
  const uploadTimeoutIds = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const currentUploadToastId = useRef<string | number | null>(null)

  // Pending images: Seçilmiş ama henüz Cloudinary'ye yüklenmemiş fotoğraflar
  interface PendingImage {
    file: File
    previewUrl: string
    uploadId: string
  }
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])

  // Listen for session changes
  useEffect(() => {
    // Component unmount olduğunda tüm toast'ları ve upload'ları temizle
    return () => {
      // Bekleyen tüm upload'ları iptal et
      uploadAbortControllers.current.forEach(controller => controller.abort())

      // Tüm aktif timeout'ları temizle
      uploadTimeoutIds.current.forEach(timeout => clearTimeout(timeout))

      // UI temizliği
      toast.dismiss()
    }
  }, [])


  // Reset state when modal opens/closes or product changes
  // Tıklanan resmi kapak yap
  const handleSetCover = (url: string) => {
    setActiveImageUrl(url)
  }

  // Resim sil - YENİ: Pending ve kaydedilmiş fotoğrafları destekler
  const handleRemoveImage = (index: number) => {
    setAdditionalImages(prevImages => {
      const urlToRemove = prevImages[index]
      const next = prevImages.filter((_, i) => i !== index)

      // Active image (kapak) siliniyorsa, yeni listeden birini seç
      setActiveImageUrl(curr => curr === urlToRemove ? (next[0] || "") : curr)

      return next
    })
  }

  // UPLOAD ON SAVE: Fotoğraf seçilince sadece preview oluştur, Cloudinary'ye yükleme
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Limit kontrolü (mevcut + pending)
    const maxFiles = 5
    const currentSavedCount = additionalImages.filter((url) => !url.startsWith("blob:")).length
    const currentPendingCount = pendingImages.length
    const totalCount = currentSavedCount + currentPendingCount
    const allowedCount = maxFiles - totalCount

    if (allowedCount <= 0) {
      toast.error(t("toasts.maxPhotosReached") as string)
      return
    }

    const MAX_SIZE = 5 * 1024 * 1024 // 5MB
    const filesToAdd = Array.from(files)
      .slice(0, allowedCount)
      .filter((file) => {
        if (file.size > MAX_SIZE) {
          toast.error(`${file.name} çok büyük (Max 5MB).`)
          return false
        }
        return true
      })

    // Her dosya için preview oluştur (Cloudinary'ye YÜKLEME)
    const newPendingImages: PendingImage[] = filesToAdd.map((file) => {
      const uploadId = `pending-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const previewUrl = URL.createObjectURL(file)
      blobUrlsRef.current.push(previewUrl)

      return { file, previewUrl, uploadId }
    })

    // Pending images'e ekle
    setPendingImages((prev) => [...prev, ...newPendingImages])

    // Preview'ları state'e ekle (görüntüleme için)
    setAdditionalImages((prev) => {
      const newPreviews = newPendingImages.map((item) => item.previewUrl)
      const updated = [...prev, ...newPreviews].slice(0, 5)
      return updated
    })

    if (!activeImageUrl && newPendingImages.length > 0) {
      setActiveImageUrl(newPendingImages[0].previewUrl)
    }

    // Input'u temizle
    if (e.target) e.target.value = ""
  }

  // Fotoğraf yükleme alanına tıklandığında (daha dosya seçilmeden) oturumu tazele (Just-in-Time)
  const handleUploadClick = async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const { error } = await supabase.auth.refreshSession()
      if (error) console.error('[ProductModal] Pre-upload session refresh failed:', error)
    } catch (e) {
      console.error('[ProductModal] handleUploadClick error:', e)
    }
  }

  // Pending fotoğrafları Cloudinary'ye yükle (sadece "Kaydet" butonunda çağrılacak)
  // YENİ: Tekil dosya yükleme ve Retry (Yeniden Deneme) mantığı
  const uploadSingleImageWithRetry = async (file: File, uploadId: string, signal?: AbortSignal): Promise<string> => {
    const MAX_RETRIES = 3
    const TIMEOUT_MS = 10000 // Kullanıcı isteği: 10 saniye (yeterli süre)

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      // İptal kontrolü
      if (signal?.aborted) {
        throw new Error('Upload cancelled')
      }

      let timeoutId: NodeJS.Timeout | null = null
      let retryToastId: string | number | null = null

      try {
        // 1. Bekleme Süresi (Exponential Backoff - İlk denemede beklemez)
        if (attempt > 0) {
          const waitTime = 1000 * Math.pow(2, attempt - 1)
          retryToastId = toast.loading(`Bağlantı yoğun, tekrar deneniyor (${attempt + 1}/${MAX_RETRIES})...`)

          await new Promise<void>((resolve, reject) => {
            const checkInterval = setInterval(() => {
              if (signal?.aborted) {
                clearInterval(checkInterval)
                if (retryToastId) toast.dismiss(retryToastId)
                reject(new Error('Upload cancelled'))
              }
            }, 100)

            setTimeout(() => {
              clearInterval(checkInterval)
              if (retryToastId) toast.dismiss(retryToastId)
              resolve()
            }, waitTime)
          })
        }

        if (signal?.aborted) {
          throw new Error('Upload cancelled')
        }

        const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

        // 2. YARIŞ BAŞLASIN: Upload vs Timeout
        const uploadPromise = storage.upload(file, {
          path: 'products',
          contentType: file.type || 'image/jpeg',
          cacheControl: '3600',
          fileName,
          signal,
        })

        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            console.error(`[ProductModal] ⏱️ Upload timeout for image after ${TIMEOUT_MS / 1000} seconds`)
            reject(new Error('UPLOAD_TIMEOUT'))
          }, TIMEOUT_MS)

          uploadTimeoutIds.current.set(uploadId, timeoutId)
        })

        const result = (await Promise.race([uploadPromise, timeoutPromise])) as { url: string } | never

        if (timeoutId) {
          clearTimeout(timeoutId)
          uploadTimeoutIds.current.delete(uploadId)
        }
        if (retryToastId) toast.dismiss(retryToastId)

        if (result && result.url) {
          return result.url
        }
        throw new Error('Upload successful but URL is missing')

      } catch (error: unknown) {
        // Timeout'u temizle
        if (timeoutId) {
          clearTimeout(timeoutId)
          uploadTimeoutIds.current.delete(uploadId)
        }
        if (retryToastId) toast.dismiss(retryToastId)

        const errorMessage = error instanceof Error ? error.message : String(error)

        // İptal hatası ise direkt fırlat
        if (errorMessage === 'Upload cancelled' || signal?.aborted) {
          throw error
        }

        console.error(`[ProductModal] ❌ Attempt ${attempt + 1} failed:`, errorMessage)

        // Eğer son denemeyse hatayı fırlat ki ana fonksiyon yakalasın
        if (attempt === MAX_RETRIES - 1) {
          throw error
        }
        // Değilse döngü başa döner ve tekrar dener
      }
    }
    throw new Error('Unexpected retry loop exit')
  }

  // --- ANA UPLOAD FONKSİYONU ---
  const uploadPendingImages = async (): Promise<string[]> => {
    const currentPendingImages = [...pendingImages]
    const currentAdditionalImages = [...additionalImages]

    if (currentPendingImages.length === 0) {
      return currentAdditionalImages.filter(url => !url.startsWith('blob:')).slice(0, 5)
    }

    setIsUploading(true)
    const toastId = "img-upload-" + Date.now()
    currentUploadToastId.current = toastId
    toast.loading(`Fotoğraflar yükleniyor (0/${currentPendingImages.length})...`, { id: toastId })

    // Ana AbortController oluştur
    const mainAbortController = new AbortController()
    uploadAbortControllers.current.set("main-upload", mainAbortController)

    // GLOBAL SİGORTA: 5 dakika sonra her şeyi iptal et (Yavaş ağlar için daha esnek)
    const safetyTimer = setTimeout(() => {

      mainAbortController.abort()
    }, 300000)

    // Toast durumunu takip et
    let toastUpdated = false

    try {
      // Session kontrolünü kaldırdık - Settings sayfası gibi "Trust" modeline geçiyoruz.
      const uploadedUrls: string[] = []
      const successfulPreviewUrls: string[] = []
      const previewToPublic = new Map<string, string>()

      // Her resim için döngü
      for (let i = 0; i < currentPendingImages.length; i++) {
        const { file, previewUrl, uploadId } = currentPendingImages[i]

        // İptal kontrolü
        if (mainAbortController.signal.aborted) {
          break
        }

        try {
          // Progress mesajını güncelle
          toast.loading(`Yükleniyor (${i + 1}/${currentPendingImages.length})...`, { id: toastId })

          // YUKARIDAKİ AKILLI FONKSİYONU ÇAĞIRIYORUZ
          const publicUrl = await uploadSingleImageWithRetry(file, uploadId, mainAbortController.signal)

          uploadedUrls.push(publicUrl)
          successfulPreviewUrls.push(previewUrl)
          previewToPublic.set(previewUrl, publicUrl)

          // State'te preview'ı gerçek URL ile değiştir
          setAdditionalImages(prev => {
            const previewIndex = prev.findIndex(url => url === previewUrl)
            if (previewIndex >= 0) {
              const updated = [...prev]
              updated[previewIndex] = publicUrl
              return updated
            }
            if (!prev.includes(publicUrl)) {
              return [...prev, publicUrl].slice(0, 5)
            }
            return prev
          })

          // Active image güncelle
          setActiveImageUrl(curr => curr === previewUrl ? publicUrl : curr)

        } catch (itemError: unknown) {
          const err = itemError as Error
          console.error(`❌ ${file.name} tamamen başarısız oldu:`, err.message)

          // Hatalı preview'ı state'ten kaldır
          try {
            URL.revokeObjectURL(previewUrl)
            blobUrlsRef.current = blobUrlsRef.current.filter(url => url !== previewUrl)

            setAdditionalImages(prev => prev.filter(url => url !== previewUrl))
            setPendingImages(prev => prev.filter(p => p.uploadId !== uploadId))
          } catch (cleanupError) {
            console.error("[ProductModal] Cleanup error:", cleanupError)
          }
        }
      } // End Loop

      // Temizlik ve State Güncelleme
      clearTimeout(safetyTimer)

      // Sadece yüklenenleri listeden düşür
      setPendingImages(prev => prev.filter(p => !successfulPreviewUrls.includes(p.previewUrl)))

      // Sonuçları birleştir
      const existingUrls = currentAdditionalImages.filter(url => !url.startsWith('blob:'))
      const finalAllUrls = [...existingUrls, ...uploadedUrls].slice(0, 5)

      // State güncelle
      setAdditionalImages(finalAllUrls)

      // Kapak fotoğrafı blob ise ve yüklendiyse güncelle
      if (activeImageUrl.startsWith('blob:')) {
        const mapped = previewToPublic.get(activeImageUrl)
        if (mapped) {
          setActiveImageUrl(mapped)
        } else if (uploadedUrls.length > 0) {
          setActiveImageUrl(finalAllUrls[0])
        }
      }

      if (uploadedUrls.length > 0) {
        toast.success(`${uploadedUrls.length} fotoğraf yüklendi.`, { id: toastId })
        toastUpdated = true
      } else {
        // Hiçbişey yüklenemediyse hata fırlat ki kaydetme işlemi dursun
        const msg = "Fotoğraf yüklenemedi. İşlem durduruldu."
        toast.error(msg, { id: toastId })
        toastUpdated = true
        throw new Error(msg)
      }

      return finalAllUrls

    } catch (err: unknown) {
      const error = err as Error
      console.error("Critical Upload Error:", error.message)
      if (!toastUpdated) toast.error("Yükleme sırasında hata oluştu.", { id: toastId })
      toastUpdated = true
      throw error // Hatayı yukarı fırlat (handleSubmit yakalasın)
    } finally {
      clearTimeout(safetyTimer)
      if (!toastUpdated) {
        toast.dismiss(toastId)
      }

      // Cleanup: AbortController ve timeout'ları temizle
      const mainController = uploadAbortControllers.current.get('main-upload')
      if (mainController) {
        mainController.abort()
        uploadAbortControllers.current.delete('main-upload')
      }

      // Tüm timeout'ları temizle
      uploadTimeoutIds.current.forEach((timeoutId) => {
        clearTimeout(timeoutId)
      })
      uploadTimeoutIds.current.clear()

      setIsUploading(false)

      // EĞER HALA YÜKLENİYOR GÖRÜNÜYORSA VE GÜNCELLENMEDİYSE ZORLA KAPAT
      if (!toastUpdated) {
        toast.dismiss(toastId)
      }
    }
  }

  // Pending fotoğrafı kaldır
  // Modal açıldığında state'leri başlat - SADECE MODAL AÇILDIĞINDA
  // ÖNEMLİ: product prop'u değişse bile state'i sıfırlama (fotoğraf yükleme sırasında kaybolmasın)
  const lastProductIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (open) {
      const currentProductId = product?.id || null

      // Sadece modal ilk açıldığında veya farklı bir ürün seçildiğinde state'i sıfırla
      // Aynı ürün için modal açıkken product prop'u değişse bile state'i koru (fotoğraf yükleme sırasında kaybolmasın)
      if (lastProductIdRef.current !== currentProductId) {
        // Formu temizle veya ürün verilerini yükle
        const existingAttrs = product?.custom_attributes?.filter(a => a.name !== "currency" && a.name !== "additional_images") || []
        setCustomAttributes(existingAttrs)

        let initialImages: string[] = []
        if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
          initialImages = [...product.images]
        } else if (product?.image_url) {
          initialImages = [product.image_url]
          // Legacy images check...
          const legacyAdditional = product?.custom_attributes?.find(a => a.name === "additional_images")?.value
          if (legacyAdditional) {
            try {
              const parsed = JSON.parse(legacyAdditional)
              if (Array.isArray(parsed)) {
                parsed.forEach(img => {
                  if (img && img !== product.image_url && !initialImages.includes(img)) {
                    initialImages.push(img)
                  }
                })
              }
            } catch {
              // Ignore errors in image processing
            }
          }
        }

        // SADECE GEÇERLİ STRİNG'LERİ AL
        const validImages = initialImages.filter((img): img is string => typeof img === 'string' && img.length > 0)

        setAdditionalImages(validImages)
        setActiveImageUrl(product?.image_url || validImages[0] || "")
        setDescription(product?.description || "")
        setName(product?.name || "")
        setSku(product?.sku || "")
        setPrice(product?.price?.toString() || "")
        setStock(product?.stock?.toString() || "")
        setCategory(() => {
          if (!product?.category) return []
          return product.category.split(',').map(c => c.trim()).filter(Boolean)
        })
        setCategoryInput("")
        setCurrency(product?.custom_attributes?.find(a => a.name === "currency")?.value || "TRY")
        setProductUrl(product?.product_url || "")
        setUploadedUrl(null)
        setActiveTab("basic")

        // Modal açıldığında pending images'i temizle
        setPendingImages([])

        lastProductIdRef.current = currentProductId
      }
    } else {
      // Modal kapandığında (iptal edildiğinde veya normal kapanışta):
      // 1. DEVAM EDEN UPLOAD'LARI İPTAL ET
      uploadAbortControllers.current.forEach((controller) => {
        controller.abort()
      })
      uploadAbortControllers.current.clear()

      // 2. TÜM TIMEOUT'LARI TEMİZLE
      uploadTimeoutIds.current.forEach((timeoutId) => {
        clearTimeout(timeoutId)
      })
      uploadTimeoutIds.current.clear()

      // 3. BLOB URL'LERİ TEMİZLE
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url))
      blobUrlsRef.current = []

      // 4. Pending images'deki blob URL'leri temizle
      pendingImages.forEach(({ previewUrl }) => {
        URL.revokeObjectURL(previewUrl)
      })
      setPendingImages([])

      // 5. State'i TAMAMEN SIFIRLA
      setAdditionalImages([])
      setActiveImageUrl("")

      // 6. Upload state'ini sıfırla
      setIsUploading(false)

      // 7. Toast'ı temizle (Varsa)
      if (currentUploadToastId.current) {
        toast.dismiss(currentUploadToastId.current)
        currentUploadToastId.current = null
      }

      // 8. Modal kapandığında flag'leri sıfırla
      lastProductIdRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]) // SADECE modal açılıp kapandığında çalışmalı - product prop'u değişse bile state'i sıfırlama!

  // Submit handler - YENİ: Önce pending fotoğrafları yükle, sonra kaydet
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error(t('toasts.productNameRequired') as string)
      setActiveTab("basic")
      return
    }

    if (isUploading) {
      toast.error("Fotoğraflar yüklenirken kayıt yapılamaz. Lütfen bekleyin.")
      return
    }

    // ÖNCE: Pending fotoğrafları Cloudinary'ye yükle
    let finalImageUrls: string[] = []
    try {
      finalImageUrls = await uploadPendingImages()
    } catch (uploadError: unknown) {
      const err = uploadError as Error
      console.error("[ProductModal] Upload error in handleSubmit:", err.message)
      // Upload hatası varsa dur. Toast zaten atıldı.
      return
    }

    // State'i güncelle (yüklenen URL'lerle)
    setAdditionalImages(finalImageUrls)
    if (finalImageUrls.length > 0 && !finalImageUrls.includes(activeImageUrl)) {
      setActiveImageUrl(finalImageUrls[0])
    }

    const formData = new FormData()
    formData.append("name", name)
    formData.append("sku", sku)
    formData.append("description", description)
    formData.append("price", price)
    formData.append("stock", stock)
    formData.append("category", category.join(", "))

    // activeImageUrl is the cover
    const finalActiveImageUrl = finalImageUrls[0] || activeImageUrl || ""
    formData.append("image_url", finalActiveImageUrl)

    // finalImageUrls contains ALL images
    formData.append("images", JSON.stringify(finalImageUrls))

    formData.append("product_url", productUrl)

    const attributesToSave = customAttributes.filter((a) => a.name && a.value && a.name !== "currency" && a.name !== "additional_images")
    if (currency) {
      attributesToSave.push({ name: "currency", value: currency, unit: "" })
    }
    // No saving additional_images to custom_attributes anymore!

    formData.set("custom_attributes", JSON.stringify(attributesToSave))

    // Direct Async Execution (No startTransition)
    setIsSaving(true)

    try {
      if (isEditing) {
        await updateProduct(product.id, formData)
        onSaved({
          ...product,
          name,
          sku,
          description,
          price: Number.parseFloat(price) || 0,
          stock: Number.parseInt(stock) || 0,
          category: category.join(", "),
          image_url: finalActiveImageUrl,
          images: finalImageUrls,
          product_url: productUrl || null,
          custom_attributes: attributesToSave,
        })
        toast.success(t('toasts.productUpdated') as string)
      } else {
        const newProduct = await createProduct(formData)
        onSaved(newProduct)
        toast.success(t('toasts.productCreated') as string)
      }

      // Kayıt başarılı - pending images zaten temizlendi
      setPendingImages([])
      // Modal'ı kapat
      onOpenChange(false)

    } catch (error) {
      console.error("Save error:", error)
      toast.error(isEditing ? t('toasts.productUpdateFailed') as string : t('toasts.productCreateFailed') as string)
    } finally {
      setIsSaving(false)
    }
  }

  // UI Render Part (Inside TabsContent value="images")
  /* 
     The images tab content is rendered below in the return statement.
  */


  // Helper Functions
  const generateMagicDescription = () => {
    const source = language === 'tr' ? MAGIC_DESCRIPTIONS_TR : MAGIC_DESCRIPTIONS_EN
    const random = source[Math.floor(Math.random() * source.length)]
    const enhanced = name ? `${name} - ${random}` : random
    setDescription(enhanced)
    toast.success(t('toasts.magicDescription') as string)
  }

  const generateSKU = () => {
    const prefix = category.length > 0 ? category[0].substring(0, 3).toUpperCase() : "URN"
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    setSku(`${prefix}-${random}`)
    toast.success(t('toasts.skuGenerated') as string)
  }

  const addCustomAttribute = (presetName?: string) => {
    setCustomAttributes([...customAttributes, { name: presetName || "", value: "", unit: "" }])
  }

  const removeCustomAttribute = (index: number) => {
    setCustomAttributes(customAttributes.filter((_, i) => i !== index))
  }

  const updateCustomAttribute = (index: number, field: keyof CustomAttribute, value: string) => {
    const updated = [...customAttributes]
    const finalValue = field === "unit" && value === "none" ? "" : value
    updated[index] = { ...updated[index], [field]: finalValue }
    setCustomAttributes(updated)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
              <Package2 className="w-5 h-5 text-white" />
            </div>
            {isEditing ? t('products.editProduct') as string : t('products.addNew') as string}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t('products.editProductDesc') as string || 'Ürün bilgilerini güncelleyin.' : t('products.addProductDesc') as string || 'Yeni bir ürün ekleyin.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b px-4 sm:px-6 shrink-0 py-2 bg-slate-50/50">
              <TabsList className="h-11 w-full grid grid-cols-3 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-lg gap-1">
                <TabsTrigger
                  value="basic"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-400 rounded-md h-full text-xs sm:text-sm font-medium transition-all gap-1.5"
                >
                  <Tag className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('products.basicInfo') as string}</span>
                  <span className="sm:hidden">{t('products.basicInfo') as string}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="images"
                  data-testid="tab-images"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-400 rounded-md h-full text-xs sm:text-sm font-medium transition-all gap-1.5"
                >
                  <ImagePlus className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('products.images') as string}</span>
                  <span className="sm:hidden">{t('products.images') as string}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="attributes"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-400 rounded-md h-full text-xs sm:text-sm font-medium transition-all gap-1.5"
                >
                  <Layers className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('products.attributes') as string}</span>
                  <span className="sm:hidden">{t('products.attributes') as string}</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 h-[calc(85vh-180px)]">
              <div className="p-6 pb-24">
                {/* Temel Bilgiler */}
                <TabsContent value="basic" className="space-y-5 m-0 focus-visible:ring-0">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="name" className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        {t('products.name') as string} *
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder={t('products.productNamePlaceholder') as string}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sku" className="flex items-center gap-2">
                        <Barcode className="w-4 h-4 text-muted-foreground" />
                        {t('products.sku') as string}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="sku"
                          value={sku}
                          onChange={(e) => setSku(e.target.value)}
                          placeholder={t('products.skuPlaceholder') as string}
                          className="h-11"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 shrink-0"
                          onClick={generateSKU}
                        >
                          <Sparkles className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 hidden sm:block">
                      {/* Spacer for alignment */}
                    </div>
                  </div>

                  {/* Kategoriler */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCategorySection(!showCategorySection)}
                      className="w-full flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FolderPlus className="w-4 h-4 text-violet-600" />
                        <span className="font-medium text-sm">{t('categories.title') as string}</span>
                        {category.length > 0 && (
                          <Badge variant="secondary" className="bg-violet-100 text-violet-700 text-xs">
                            {t('products.selected', { count: category.length }) as string}
                          </Badge>
                        )}
                      </div>
                      {showCategorySection ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>

                    {/* Seçili Kategoriler - Her zaman göster */}
                    {category.length > 0 && !showCategorySection && (
                      <div className="flex flex-wrap gap-1.5 px-1">
                        {category.map((cat, idx) => (
                          <Badge key={idx} variant="secondary" className="pl-2 pr-1 py-0.5 gap-1 text-xs bg-violet-50 text-violet-700 border-violet-100">
                            {cat}
                            <button
                              type="button"
                              onClick={() => setCategory(category.filter((_, i) => i !== idx))}
                              className="ml-0.5 hover:bg-violet-200 rounded-full p-0.5"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Kategori İçeriği - Açık olduğunda */}
                    {showCategorySection && (
                      <div className="space-y-3 p-3 border rounded-lg bg-background animate-in slide-in-from-top-2 duration-200">
                        {/* Mevcut Kategoriler */}
                        {allCategories.length > 0 && (
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">{t('products.existingCategories')}</Label>
                            <div className="flex flex-wrap gap-1.5">
                              {allCategories.map((cat) => (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => {
                                    if (category.includes(cat)) {
                                      setCategory(category.filter(c => c !== cat))
                                    } else {
                                      setCategory([...category, cat])
                                    }
                                  }}
                                  className={cn(
                                    "px-2.5 py-1 text-xs rounded-full border transition-all",
                                    category.includes(cat)
                                      ? "bg-violet-600 text-white border-violet-600"
                                      : "bg-background hover:bg-violet-50 hover:border-violet-300"
                                  )}
                                >
                                  {cat}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Yeni Kategori Ekle */}
                        <div className="flex gap-2">
                          <Input
                            value={categoryInput}
                            onChange={(e) => setCategoryInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && categoryInput.trim()) {
                                e.preventDefault()
                                if (!category.includes(categoryInput.trim())) {
                                  setCategory([...category, categoryInput.trim()])
                                }
                                setCategoryInput("")
                              }
                            }}
                            placeholder={t('products.newCategory') as string}
                            className="h-8 text-sm"
                          />
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 px-3 bg-violet-600 hover:bg-violet-700"
                            onClick={() => {
                              if (categoryInput.trim() && !category.includes(categoryInput.trim())) {
                                setCategory([...category, categoryInput.trim()])
                                setCategoryInput("")
                              }
                            }}
                            disabled={!categoryInput.trim()}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        {/* Seçili Kategoriler */}
                        {category.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-2 border-t">
                            {category.map((cat, idx) => (
                              <Badge key={idx} variant="secondary" className="pl-2 pr-1 py-0.5 gap-1 text-xs bg-violet-50 text-violet-700">
                                {cat}
                                <button
                                  type="button"
                                  onClick={() => setCategory(category.filter((_, i) => i !== idx))}
                                  className="ml-0.5 hover:bg-violet-200 rounded-full p-0.5"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Ürün Linki */}
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="productUrl" className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      {t('products.productUrl') as string}
                      <span className="text-xs text-muted-foreground font-normal">(opsiyonel)</span>
                    </Label>
                    <Input
                      id="productUrl"
                      type="url"
                      value={productUrl}
                      onChange={(e) => setProductUrl(e.target.value)}
                      placeholder="https://example.com/urun-sayfasi"
                      className="h-10"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('products.productUrlDesc') as string}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description">{t('products.description') as string}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1.5 text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                        onClick={generateMagicDescription}
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        {t('products.generateAi') as string}
                      </Button>
                    </div>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t('products.descriptionPlaceholder') as string}
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  {/* Fiyat ve Stok - Büyük ve Okunaklı */}
                  <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
                    {/* Fiyat */}
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm font-medium">
                        {t('products.price') as string}
                      </Label>
                      <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                        <Select value={currency} onValueChange={setCurrency}>
                          <SelectTrigger className="w-24 h-11 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-lg font-bold shadow-sm hover:border-violet-400 transition-colors">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[100]">
                            <SelectItem value="TRY">₺</SelectItem>
                            <SelectItem value="USD">$</SelectItem>
                            <SelectItem value="EUR">€</SelectItem>
                            <SelectItem value="GBP">£</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          id="price"
                          type="text"
                          inputMode="decimal"
                          value={price}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.,]/g, '')
                            setPrice(val)
                          }}
                          placeholder="0.00"
                          className="flex-1 h-12 text-2xl font-bold border-0 bg-transparent focus-visible:ring-0 text-right"
                        />
                      </div>
                    </div>

                    {/* Stok */}
                    <div className="space-y-2">
                      <Label htmlFor="stock" className="text-sm font-medium">
                        {t('products.stockCount') as string}
                      </Label>
                      <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                        <Input
                          id="stock"
                          type="number"
                          min="0"
                          value={stock}
                          onChange={(e) => setStock(e.target.value)}
                          placeholder="0"
                          className="flex-1 h-12 text-2xl font-bold border-0 bg-transparent focus-visible:ring-0 text-center"
                        />
                        <div className="shrink-0">
                          {Number(stock) === 0 ? (
                            <Badge variant="destructive" className="text-sm px-3 py-1">{t('products.outOfStock') as string}</Badge>
                          ) : Number(stock) < 10 ? (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-sm px-3 py-1">{t('products.lowStock') as string}</Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-sm px-3 py-1">{t('products.inStock') as string}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Görseller */}
                <TabsContent value="images" className="m-0 focus-visible:ring-0 p-1">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {additionalImages.map((url, idx) => {

                      return (
                        <div key={idx} className={cn("relative aspect-square rounded-xl border overflow-hidden group shadow-sm bg-white dark:bg-gray-800", activeImageUrl === url && "ring-2 ring-violet-600 ring-offset-2 dark:ring-offset-gray-900")}>
                          <NextImage
                            src={url}
                            fill
                            className="object-cover"
                            alt={`Ürün görseli ${idx + 1}`}
                            unoptimized
                          />
                          <div className={cn(
                            "absolute inset-0 bg-black/40 transition-opacity flex flex-col items-center justify-center gap-2",
                            activeImageUrl === url ? "opacity-0 group-hover:opacity-100" : "opacity-0 group-hover:opacity-100"
                          )}>
                            {activeImageUrl !== url && (
                              <Button type="button" size="sm" variant="secondary" className="h-8 text-xs bg-white/90 hover:bg-white" onClick={() => handleSetCover(url)}>
                                <Sparkles className="w-3.5 h-3.5 mr-1" /> {t('products.makeCover')}
                              </Button>
                            )}
                            <Button type="button" size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleRemoveImage(idx)} aria-label="Fotoğrafı sil">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          {activeImageUrl === url && (
                            <div className="absolute top-2 left-2 bg-violet-600 text-white text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center shadow-sm">
                              <Sparkles className="w-3 h-3 mr-1" /> {t('products.cover') as string}
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {additionalImages.length < 5 && (
                      <label
                        onClick={handleUploadClick}
                        className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-xl cursor-pointer hover:bg-violet-50 hover:border-violet-300 dark:hover:bg-violet-900/20 dark:hover:border-violet-700 transition-all group bg-slate-50/50 dark:bg-slate-900/20"
                      >
                        <div className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-sm mb-2 group-hover:scale-110 transition-transform">
                          <Upload className="w-6 h-6 text-violet-500" />
                        </div>
                        <span className="text-xs text-slate-600 font-medium">{t('products.addPhoto') as string}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{t('products.remainingUploads', { count: 5 - additionalImages.length }) as string}</span>
                        <input
                          type="file"
                          data-testid="file-upload"
                          className="hidden"
                          accept="image/png, image/jpeg, image/webp"
                          multiple
                          onChange={(e) => {
                            handleUploadClick()
                            handleImageUpload(e)
                          }}
                          disabled={isUploading}
                        />
                      </label>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl backdrop-blur-[1px] z-10">
                        <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-4 text-center">
                    {t('products.maxPhotosDesc')}
                  </p>
                </TabsContent>

                {/* Özellikler */}
                <TabsContent value="attributes" className="space-y-6 m-0 focus-visible:ring-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">{t('products.customAttributes') as string}</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t('products.customAttributesDesc') as string}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addCustomAttribute()}
                        className="gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        {t('products.addAttribute')}
                      </Button>
                    </div>

                    {/* Hızlı Ekleme */}
                    <div className="flex flex-wrap gap-2">
                      {quickAttributeKeys.map((attr) => {
                        const label = t(`products.attributeNames.${attr.key}` as "products.attributeNames.color" | "products.attributeNames.material" | "products.attributeNames.weight" | "products.attributeNames.size" | "products.attributeNames.origin" | "products.attributeNames.warranty") as string
                        return (
                          <Button
                            key={attr.key}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5"
                            onClick={() => addCustomAttribute(label)}
                            disabled={customAttributes.some(a => a.name === label)}
                          >
                            <span>{attr.icon}</span>
                            {label}
                          </Button>
                        )
                      })}
                    </div>

                    {customAttributes.length === 0 ? (
                      <Card className="border-dashed">
                        <CardContent className="py-8 text-center">
                          <Layers className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground">
                            {t('products.noAttributes')}
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {customAttributes.map((attr, index) => (
                          <Card key={index} className="overflow-hidden">
                            <CardContent className="p-3">
                              <div className="flex gap-2 items-center">
                                <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                                <div className="flex-1 grid grid-cols-3 gap-2">
                                  <Input
                                    placeholder={t('products.attributes')}
                                    value={attr.name}
                                    onChange={(e) => updateCustomAttribute(index, "name", e.target.value)}
                                    className="h-9"
                                  />
                                  <Input
                                    placeholder="Value"
                                    value={attr.value}
                                    onChange={(e) => updateCustomAttribute(index, "value", e.target.value)}
                                    className="h-9"
                                  />
                                  <Select
                                    value={attr.unit || "none"}
                                    onValueChange={(value) => updateCustomAttribute(index, "unit", value)}
                                  >
                                    <SelectTrigger className="h-9">
                                      <SelectValue placeholder="Unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {unitKeys.map((key) => (
                                        <SelectItem key={key} value={key}>
                                          {t(`products.units.${key}` as "products.units.none" | "products.units.kg" | "products.units.g" | "products.units.m" | "products.units.cm" | "products.units.mm" | "products.units.L" | "products.units.mL" | "products.units.adet" | "products.units.paket" | "products.units.kutu")}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeCustomAttribute(index)}
                                  className="shrink-0 h-9 w-9 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>

          {/* Footer */}
          <div className="flex justify-between items-center gap-3 px-6 py-4 border-t bg-muted/30 shrink-0">
            <div className="text-sm text-muted-foreground min-w-[30px] text-center">
              <span>{activeTab === "basic" ? "1/3" : activeTab === "images" ? "2/3" : "3/3"}</span>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  // İptal edildiğinde: Pending fotoğrafları temizle (Cloudinary'de yok, sadece blob URL'ler)
                  // Pending images'deki blob URL'leri temizle
                  pendingImages.forEach(({ previewUrl }) => {
                    URL.revokeObjectURL(previewUrl)
                  })

                  // State'ten blob URL'leri kaldır (sadece kaydedilmiş fotoğraflar kalır)
                  setAdditionalImages(prev => prev.filter(url => !url.startsWith('blob:')))

                  // Pending images'i temizle
                  setPendingImages([])

                  // Blob URL ref'ini temizle
                  blobUrlsRef.current = []

                  // Modal'ı kapat - useEffect state'i product'tan yeniden yükleyecek
                  onOpenChange(false)
                }}
              >
                {t('common.cancel') as string}
              </Button>
              <Button
                type="submit"
                disabled={isSaving || isUploading}
                className="min-w-[120px] bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('builder.saving')}
                  </>
                ) : isEditing ? (
                  t('common.save')
                ) : (
                  t('products.addProduct')
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
