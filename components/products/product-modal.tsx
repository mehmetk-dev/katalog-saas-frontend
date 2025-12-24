"use client"

import type React from "react"
import { useState, useTransition, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Plus, Trash2, Loader2, Upload, X, Wand2, ImagePlus, GripVertical, Sparkles, Tag, Barcode, Package2, DollarSign, Layers, ChevronDown, ChevronUp, FolderPlus, AlertCircle, RefreshCw } from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { type Product, type CustomAttribute, createProduct, updateProduct } from "@/lib/actions/products"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTranslation } from "@/lib/i18n-provider"
import { useAsyncTimeout } from "@/lib/hooks/use-async-timeout"
import { Progress } from "@/components/ui/progress"

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

export function ProductModal({ open, onOpenChange, product, onSaved, allCategories = [], userPlan = 'free' }: ProductModalProps) {
  const [isPending, startTransition] = useTransition()
  const { t, language } = useTranslation()
  const isEditing = !!product
  const isFreeUser = userPlan === 'free'

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

  // Upload State with timeout
  const uploadTimeout = useAsyncTimeout<string[]>({
    totalTimeoutMs: 60000,
    stuckTimeoutMs: 20000,
    timeoutMessage: t('toasts.uploadTimeout') || 'Yükleme zaman aşımına uğradı. Bağlantınızı kontrol edin.',
    showToast: true
  })
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [activeImageUrl, setActiveImageUrl] = useState(product?.image_url || "")
  const [additionalImages, setAdditionalImages] = useState<string[]>([])
  //
  // Drag state for images
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null)

  // Reset state when modal opens/closes or product changes
  // Tıklanan resmi kapak yap
  const handleSetCover = (url: string) => {
    setActiveImageUrl(url)
    toast.success(t('toasts.coverUpdated'))
  }

  // Resim sil
  const handleRemoveImage = (index: number) => {
    const newImages = [...additionalImages]
    const removedUrl = newImages[index]
    newImages.splice(index, 1)
    setAdditionalImages(newImages)

    // Eğer silinen resim kapak fotoğrafıysa ve başka resim varsa, ilkini kapak yap
    if (removedUrl === activeImageUrl) {
      if (newImages.length > 0) {
        setActiveImageUrl(newImages[0])
      } else {
        setActiveImageUrl("")
      }
    }
  }

  // Refactored Upload Logic for 5 images limit with timeout support
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Mevcut resim sayısı + yeni seçilenler <= 5 olmalı
    const currentCount = additionalImages.length
    const allowedCount = 5 - currentCount

    if (allowedCount <= 0) {
      toast.error(t('toasts.maxPhotos'))
      return
    }

    const filesToUpload = Array.from(files).slice(0, allowedCount)
    if (files.length > allowedCount) {
      toast.info(t('toasts.limitInfo', { count: allowedCount }))
    }

    // Reset input değeri
    const inputRef = e.target

    await uploadTimeout.execute(async () => {
      const supabase = createClient()
      const newUrls: string[] = []
      const totalFiles = filesToUpload.length

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i]

        // İlerleme güncelle
        uploadTimeout.setProgress(Math.round((i / totalFiles) * 100))

        if (file.size > 5 * 1024 * 1024) {
          toast.error(t('toasts.fileTooLarge', { name: file.name }))
          continue
        }

        // WebP Dönüşümü
        toast.loading(`${file.name} optimize ediliyor...`, { id: 'webp-process' })
        const { convertToWebP } = await import("@/lib/image-utils")
        const { blob } = await convertToWebP(file)
        toast.dismiss('webp-process')

        // Upload
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.webp`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, blob, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'image/webp'
          })

        if (uploadError) {
          console.error("Upload error details:", uploadError)
          throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)

        newUrls.push(publicUrl)

        // Her başarılı yüklemede ilerleme güncelle
        uploadTimeout.setProgress(Math.round(((i + 1) / totalFiles) * 100))
      }

      const updatedImages = [...additionalImages, ...newUrls]
      setAdditionalImages(updatedImages)

      // İlk yüklenen resmi otomatik kapak yap (eğer hiç yoksa)
      if (!activeImageUrl && updatedImages.length > 0) {
        setActiveImageUrl(updatedImages[0])
      }

      if (newUrls.length > 0) {
        toast.success(t('toasts.imagesUploaded', { count: newUrls.length }))
      }

      return newUrls
    })

    inputRef.value = ''
  }

  // Update effect to merge legacy images
  useEffect(() => {
    if (open) {
      const existingAttrs = product?.custom_attributes?.filter(a => a.name !== "currency" && a.name !== "additional_images") || []
      setCustomAttributes(existingAttrs)

      // Merge logic: product.images OR (product.image_url + additional_images)
      let initialImages: string[] = []

      if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
        initialImages = product.images
      } else {
        // Legacy check
        const legacyAdditional = product?.custom_attributes?.find(a => a.name === "additional_images")?.value
        let legacyImages: string[] = []
        if (legacyAdditional) {
          try { legacyImages = JSON.parse(legacyAdditional) } catch { }
        }
        if (product?.image_url) {
          // Avoid duplicates if image_url is already in list
          if (!legacyImages.includes(product.image_url)) {
            legacyImages.unshift(product.image_url)
          }
        }
        initialImages = legacyImages
      }

      setAdditionalImages(initialImages)
      setActiveImageUrl(product?.image_url || initialImages[0] || "")

      // ... rest of state init
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
    }
  }, [open, product])

  // Submit handler update
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error(t('toasts.productNameRequired'))
      setActiveTab("basic")
      return
    }

    const formData = new FormData()
    formData.append("name", name)
    formData.append("sku", sku)
    formData.append("description", description)
    formData.append("price", price)
    formData.append("stock", stock)
    formData.append("category", category.join(", "))

    // activeImageUrl is the cover
    formData.append("image_url", activeImageUrl || "")

    // additionalImages now contains ALL images including cover
    formData.append("images", JSON.stringify(additionalImages))

    formData.append("product_url", productUrl)

    const attributesToSave = customAttributes.filter((a) => a.name && a.value && a.name !== "currency" && a.name !== "additional_images")
    if (currency) {
      attributesToSave.push({ name: "currency", value: currency, unit: "" })
    }
    // No saving additional_images to custom_attributes anymore!

    formData.set("custom_attributes", JSON.stringify(attributesToSave))

    startTransition(async () => {
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
            image_url: activeImageUrl,
            images: additionalImages, // Optimistic update
            product_url: productUrl || null,
            custom_attributes: attributesToSave,
          })
          toast.success(t('toasts.productUpdated'))
        } else {
          const newProduct = await createProduct(formData)
          onSaved(newProduct)
          toast.success(t('toasts.productCreated'))
        }
        onOpenChange(false)
      } catch {
        toast.error(isEditing ? t('toasts.productUpdateFailed') : t('toasts.productCreateFailed'))
      }
    })
  }

  // UI Render Part (Inside TabsContent value="images")
  /* 
     Replace the existing tabs content with this:
  */
  // ... inside render ... 
  // <TabsContent value="images" ...>
  //    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
  //       {additionalImages.map((url, idx) => (
  //          <div key={idx} className={cn("relative aspect-square rounded-xl border overflow-hidden group", activeImageUrl === url && "ring-2 ring-violet-600 ring-offset-2")}>
  //              <img src={url} className="w-full h-full object-cover" />
  //              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
  //                  {activeImageUrl !== url && (
  //                      <Button size="sm" variant="secondary" onClick={() => handleSetCover(url)}>Kapak Yap</Button>
  //                  )}
  //                  <Button size="icon" variant="destructive" onClick={() => handleRemoveImage(idx)}><Trash2 className="w-4 h-4" /></Button>
  //              </div>
  //              {activeImageUrl === url && <div className="absolute top-2 left-2 bg-violet-600 text-white text-[10px] px-2 py-1 rounded">Kapak</div>}
  //          </div>
  //       ))}
  //       {additionalImages.length < 5 && (
  //          <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
  //              <Upload className="w-8 h-8 text-slate-300 mb-2" />
  //              <span className="text-xs text-slate-500 font-medium">Fotoğraf Ekle</span>
  //              <span className="text-[10px] text-slate-400">({5 - additionalImages.length} hak kaldı)</span>
  //              <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} disabled={isUploading} />
  //          </label>
  //       )}
  //    </div>
  // </TabsContent>


  // Helper Functions
  const generateMagicDescription = () => {
    const source = language === 'tr' ? MAGIC_DESCRIPTIONS_TR : MAGIC_DESCRIPTIONS_EN
    const random = source[Math.floor(Math.random() * source.length)]
    const enhanced = name ? `${name} - ${random}` : random
    setDescription(enhanced)
    toast.success(t('toasts.magicDescription'))
  }

  const generateSKU = () => {
    const prefix = category.length > 0 ? category[0].substring(0, 3).toUpperCase() : "URN"
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    setSku(`${prefix}-${random}`)
    toast.success(t('toasts.skuGenerated'))
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
            {isEditing ? t('products.editProduct') : t('products.addNew')}
          </DialogTitle>
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
                  <span className="hidden sm:inline">{t('products.basicInfo')}</span>
                  <span className="sm:hidden">{t('products.basicInfo')}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="images"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-400 rounded-md h-full text-xs sm:text-sm font-medium transition-all gap-1.5"
                >
                  <ImagePlus className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('products.images')}</span>
                  <span className="sm:hidden">{t('products.images')}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="attributes"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-400 rounded-md h-full text-xs sm:text-sm font-medium transition-all gap-1.5"
                >
                  <Layers className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('products.attributes')}</span>
                  <span className="sm:hidden">{t('products.attributes')}</span>
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
                        {t('products.name')} *
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder={t('products.productNamePlaceholder')}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sku" className="flex items-center gap-2">
                        <Barcode className="w-4 h-4 text-muted-foreground" />
                        {t('products.sku')}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="sku"
                          value={sku}
                          onChange={(e) => setSku(e.target.value)}
                          placeholder={t('products.skuPlaceholder')}
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

                  {/* Kategoriler - Sadece Plus/Pro için */}
                  {!isFreeUser ? (
                    <div className="space-y-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowCategorySection(!showCategorySection)}
                        className="w-full flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <FolderPlus className="w-4 h-4 text-violet-600" />
                          <span className="font-medium text-sm">{t('categories.title')}</span>
                          {category.length > 0 && (
                            <Badge variant="secondary" className="bg-violet-100 text-violet-700 text-xs">
                              {t('products.selected', { count: category.length })}
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
                              placeholder={t('products.newCategory')}
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
                  ) : null}

                  {/* Ürün Linki */}
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="productUrl" className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      {t('products.productUrl')}
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
                      {t('products.productUrlDesc')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description">{t('products.description')}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1.5 text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                        onClick={generateMagicDescription}
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        {t('products.generateAi')}
                      </Button>
                    </div>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t('products.descriptionPlaceholder')}
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  {/* Fiyat ve Stok - Büyük ve Okunaklı */}
                  <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
                    {/* Fiyat */}
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm font-medium">
                        {t('products.price')}
                      </Label>
                      <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                        <Select value={currency} onValueChange={setCurrency}>
                          <SelectTrigger className="w-20 h-10 border-0 bg-transparent text-lg font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
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
                        {t('products.stockCount')}
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
                            <Badge variant="destructive" className="text-sm px-3 py-1">{t('products.outOfStock')}</Badge>
                          ) : Number(stock) < 10 ? (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-sm px-3 py-1">{t('products.lowStock')}</Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-sm px-3 py-1">{t('products.inStock')}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Görseller */}
                <TabsContent value="images" className="m-0 focus-visible:ring-0 p-1">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {additionalImages.map((url, idx) => (
                      <div key={idx} className={cn("relative aspect-square rounded-xl border overflow-hidden group shadow-sm bg-white dark:bg-gray-800", activeImageUrl === url && "ring-2 ring-violet-600 ring-offset-2 dark:ring-offset-gray-900")}>
                        <img src={url} className="w-full h-full object-cover" alt={`Ürün görseli ${idx + 1}`} />
                        <div className={cn(
                          "absolute inset-0 bg-black/40 transition-opacity flex flex-col items-center justify-center gap-2",
                          activeImageUrl === url ? "opacity-0 group-hover:opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}>
                          {activeImageUrl !== url && (
                            <Button type="button" size="sm" variant="secondary" className="h-8 text-xs bg-white/90 hover:bg-white" onClick={() => handleSetCover(url)}>
                              <Sparkles className="w-3.5 h-3.5 mr-1" /> {t('products.makeCover')}
                            </Button>
                          )}
                          <Button type="button" size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleRemoveImage(idx)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        {activeImageUrl === url && (
                          <div className="absolute top-2 left-2 bg-violet-600 text-white text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center shadow-sm">
                            <Sparkles className="w-3 h-3 mr-1" /> {t('products.cover')}
                          </div>
                        )}
                      </div>
                    ))}

                    {additionalImages.length < 5 && (
                      <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-xl cursor-pointer hover:bg-violet-50 hover:border-violet-300 dark:hover:bg-violet-900/20 dark:hover:border-violet-700 transition-all group bg-slate-50/50 dark:bg-slate-900/20">
                        <div className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-sm mb-2 group-hover:scale-110 transition-transform">
                          <Upload className="w-6 h-6 text-violet-500" />
                        </div>
                        <span className="text-xs text-slate-600 font-medium">{t('products.addPhoto')}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{t('products.remainingUploads', { count: 5 - additionalImages.length })}</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/png, image/jpeg, image/webp"
                          multiple
                          onChange={handleImageUpload}
                          disabled={uploadTimeout.isLoading}
                        />
                        {uploadTimeout.isLoading && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl backdrop-blur-[1px]">
                            <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
                          </div>
                        )}
                      </label>
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
                        <Label className="text-base font-medium">{t('products.customAttributes')}</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t('products.customAttributesDesc')}
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
                        const label = t(`products.attributeNames.${attr.key}` as any)
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
                                          {t(`products.units.${key}` as any)}
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
            <div className="text-sm text-muted-foreground">
              {activeTab === "basic" && "1/3"}
              {activeTab === "images" && "2/3"}
              {activeTab === "attributes" && "3/3"}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={uploadTimeout.isLoading}>
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isPending || uploadTimeout.isLoading}
                className="min-w-[120px] bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              >
                {uploadTimeout.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : isPending ? (
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
