"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { toast } from "sonner"
import { Package2, Tag, ImagePlus, Layers, Loader2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { type Product, type CustomAttribute, createProduct, updateProduct } from "@/lib/actions/products"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { getProductImages, useProductImages } from "@/lib/hooks/use-product-images"
import { formatNumberForInput, parseLocalizedNumber } from "@/lib/utils/number-input"

import { normalizeProductUrl, ProductBasicTab, type ProductFormErrors } from "../tabs/product-basic-tab"
import { ProductImagesTab } from "../tabs/product-images-tab"
import { ProductAttributesTab } from "../tabs/product-attributes-tab"

// ─── Types ───────────────────────────────────────────────────────────
interface ProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSaved: (product: Product) => void
  allCategories?: string[]
  userPlan?: "free" | "plus" | "pro"
  maxProducts: number
  currentProductCount: number
}

// ─── Form values ─────────────────────────────────────────────────────
interface FormValues {
  name: string
  sku: string
  description: string
  price: string
  stock: string
  category: string[]
  currency: string
  productUrl: string
  customAttributes: CustomAttribute[]
}

function buildInitialValues(product: Product | null, language: string): FormValues {
  return {
    name: product?.name || "",
    sku: product?.sku || "",
    description: product?.description || "",
    price: product ? formatNumberForInput(product.price, language) : "",
    stock: product?.stock?.toString() || "",
    category: product?.category ? product.category.split(",").map((c) => c.trim()).filter(Boolean) : [],
    currency: product?.custom_attributes?.find((a) => a.name === "currency")?.value || "TRY",
    productUrl: product?.product_url || "",
    customAttributes: product?.custom_attributes?.filter((a) => a.name !== "currency" && a.name !== "additional_images") || [],
  }
}

/** Kaydedilmemiş değişiklik karşılaştırması için formun tamamı */
function makeSnapshot(values: FormValues & { images: string[]; cover: string }): string {
  return JSON.stringify(values)
}

// ─── Component ───────────────────────────────────────────────────────
export function ProductModal({ open, onOpenChange, product, onSaved, allCategories = [], userPlan = "free", maxProducts, currentProductCount }: ProductModalProps) {
  const { t: baseT, language } = useTranslation()
  const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])
  const isEditing = !!product
  const canCreateCategory = userPlan !== "free"

  // ─── Form State ─────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("basic")
  const [isSaving, setIsSaving] = useState(false)
  const [name, setName] = useState("")
  const [sku, setSku] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [stock, setStock] = useState("")
  const [category, setCategory] = useState<string[]>([])
  const [currency, setCurrency] = useState("TRY")
  const [productUrl, setProductUrl] = useState("")
  const [customAttributes, setCustomAttributes] = useState<CustomAttribute[]>([])
  const [errors, setErrors] = useState<ProductFormErrors>({})
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false)
  /** Açılıştaki form değerleri; kapatırken kaydedilmemiş değişiklik kontrolü için */
  const initialSnapshotRef = useRef("")

  // ─── Images Hook ────────────────────────────────────────────────────
  const images = useProductImages({ t })

  // ─── Modal Open / Close ─────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      const initial = buildInitialValues(product, language)
      setName(initial.name)
      setSku(initial.sku)
      setDescription(initial.description)
      setPrice(initial.price)
      setStock(initial.stock)
      setCategory(initial.category)
      setCurrency(initial.currency)
      setProductUrl(initial.productUrl)
      setCustomAttributes(initial.customAttributes)
      const initialImages = getProductImages(product)
      initialSnapshotRef.current = makeSnapshot({ ...initial, images: initialImages.images, cover: initialImages.cover })
      setActiveTab("basic")
      setErrors({})
      setConfirmCloseOpen(false)
      images.initFromProduct(product)
    } else {
      images.cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // ─── Dirty tracking ─────────────────────────────────────────────────
  const snapshot = useMemo(
    () => makeSnapshot({ name, sku, description, price, stock, category, currency, productUrl, customAttributes, images: images.additionalImages, cover: images.activeImageUrl }),
    [name, sku, description, price, stock, category, currency, productUrl, customAttributes, images.additionalImages, images.activeImageUrl],
  )
  const isDirty = open && initialSnapshotRef.current !== "" && initialSnapshotRef.current !== snapshot

  // ─── Validation ─────────────────────────────────────────────────────
  const validate = (): { errors: ProductFormErrors; price: number; stock: number; url: string } => {
    const next: ProductFormErrors = {}
    if (name.trim().length < 2) next.name = name.trim() ? t("productForm.nameTooShort") : t("toasts.productNameRequired")

    const parsedPrice = price.trim() ? parseLocalizedNumber(price, language) : 0
    if (parsedPrice === null || parsedPrice < 0 || parsedPrice > 1_000_000_000) next.price = t("productForm.invalidPrice")

    const parsedStock = stock.trim() ? Number(stock) : 0
    if (!Number.isInteger(parsedStock) || parsedStock < 0 || parsedStock > 10_000_000) next.stock = t("productForm.invalidStock")

    const url = normalizeProductUrl(productUrl)
    if (url) {
      try {
        const parsed = new URL(url)
        if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname.includes(".")) throw new Error("invalid")
      } catch {
        next.productUrl = t("productForm.invalidUrl")
      }
    }

    return { errors: next, price: parsedPrice ?? 0, stock: parsedStock, url }
  }

  // ─── Submit ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formElement = e.currentTarget instanceof HTMLFormElement ? e.currentTarget : (e.target as HTMLFormElement)
    const formDataLocal = formElement instanceof HTMLFormElement ? new FormData(formElement) : new FormData()
    const pendingCat = (formDataLocal.get("newCategoryInput") as string || "").trim()

    const validation = validate()
    setErrors(validation.errors)
    if (Object.keys(validation.errors).length > 0) {
      toast.error(t("productForm.fixErrors"))
      setActiveTab("basic")
      return
    }
    if (images.isUploading) {
      toast.error(t("productForm.imagesUploading"))
      return
    }
    // Limit görseller yüklenmeden önce kontrol edilir; aksi halde reddedilen ürünün görselleri
    // Cloudinary'de sahipsiz kalıyordu
    if (!isEditing && currentProductCount >= maxProducts) {
      toast.error(t("toasts.productLimitReached", {
        current: currentProductCount.toString(),
        incoming: "1",
        max: maxProducts.toString(),
      }))
      return
    }
    setProductUrl(validation.url)

    // Upload pending images first
    let finalImageUrls: string[]
    let urlMap: Map<string, string>

    try {
      const result = await images.uploadPending()
      finalImageUrls = result.finalUrls
      urlMap = result.urlMap
    } catch {
      return // Toast already shown by hook
    }

    // Resolve cover image (may be a blob that was just uploaded)
    let coverUrl = images.activeImageUrl
    if (coverUrl?.startsWith("blob:")) {
      coverUrl = urlMap.get(coverUrl) || finalImageUrls[0] || ""
    }

    // Ensure cover is first in array
    if (coverUrl && finalImageUrls.includes(coverUrl)) {
      finalImageUrls = [coverUrl, ...finalImageUrls.filter((u) => u !== coverUrl)]
    } else if (coverUrl) {
      finalImageUrls = [coverUrl, ...finalImageUrls]
    }

    const finalCategories = [...category]
    if (pendingCat && !finalCategories.includes(pendingCat)) {
      finalCategories.push(pendingCat)
    }

    // Build form data
    const formData = new FormData()
    formData.append("name", name)
    formData.append("sku", sku)
    formData.append("description", description)
    formData.append("price", String(validation.price))
    formData.append("stock", String(validation.stock))
    formData.append("category", finalCategories.join(", "))
    formData.append("image_url", coverUrl)
    formData.append("images", JSON.stringify(finalImageUrls))
    formData.append("product_url", validation.url)

    const attrs = customAttributes.filter((a) => a.name && a.value && a.name !== "currency" && a.name !== "additional_images")
    if (currency) attrs.push({ name: "currency", value: currency, unit: "" })
    formData.set("custom_attributes", JSON.stringify(attrs))

    setIsSaving(true)
    try {
      if (isEditing) {
        const updatedProduct = await updateProduct(product.id, formData)
        onSaved(updatedProduct || {
          ...product,
          name, sku, description,
          price: validation.price,
          stock: validation.stock,
          category: finalCategories.join(", "),
          image_url: coverUrl,
          images: finalImageUrls,
          product_url: validation.url || null,
          custom_attributes: attrs,
        })
        toast.success(t("toasts.productUpdated"))
      } else {
        const newProduct = await createProduct(formData)
        onSaved(newProduct)
        toast.success(t("toasts.productCreated"))
      }
      initialSnapshotRef.current = ""
      onOpenChange(false)
    } catch (error) {
      // Sunucunun anlamlı hata mesajı varsa (ör. limit, doğrulama) onu göster
      const message = error instanceof Error && error.message && !error.message.startsWith("api.error") ? error.message : null
      toast.error(message || (isEditing ? t("toasts.productUpdateFailed") : t("toasts.productCreateFailed")))
    } finally {
      setIsSaving(false)
    }
  }

  // ─── Cancel ─────────────────────────────────────────────────────────
  const closeNow = () => {
    setConfirmCloseOpen(false)
    initialSnapshotRef.current = ""
    onOpenChange(false)
  }

  /** Esc, dışarı tıklama ve İptal aynı yoldan geçer: değişiklik varsa önce sorulur */
  const requestClose = () => {
    if (isSaving || images.isUploading) return
    if (isDirty) {
      setConfirmCloseOpen(true)
      return
    }
    closeNow()
  }

  // ─── Render ─────────────────────────────────────────────────────────
  const tabTriggerClass = "data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-primary rounded-md h-full text-xs sm:text-sm font-medium transition-all gap-1.5"

  return (
    <>
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : requestClose())}>
      <DialogContent className="max-w-3xl h-[85vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary">
              <Package2 className="w-5 h-5 text-primary-foreground" />
            </div>
            {isEditing ? t("products.editProduct") : t("products.addNew")}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t("products.editProductDesc") : t("products.addProductDesc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col h-full overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b px-4 sm:px-6 shrink-0 py-2 bg-muted/50">
              <TabsList className="h-11 w-full grid grid-cols-3 bg-muted/80 p-1 rounded-lg gap-1">
                <TabsTrigger value="basic" className={tabTriggerClass}>
                  <Tag className="w-4 h-4" />
                  <span>{t("products.basicInfo")}</span>
                </TabsTrigger>
                <TabsTrigger value="images" data-testid="tab-images" className={tabTriggerClass}>
                  <ImagePlus className="w-4 h-4" />
                  <span>{t("products.images")}</span>
                </TabsTrigger>
                <TabsTrigger value="attributes" className={tabTriggerClass}>
                  <Layers className="w-4 h-4" />
                  <span>{t("products.attributes")}</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 h-[calc(85vh-180px)]">
              <div className="p-6 pb-24">
                <TabsContent value="basic" className="space-y-5 m-0 focus-visible:ring-0">
                  <ProductBasicTab
                    name={name} onNameChange={setName}
                    sku={sku} onSkuChange={setSku}
                    description={description} onDescriptionChange={setDescription}
                    price={price} onPriceChange={setPrice}
                    stock={stock} onStockChange={setStock}
                    currency={currency} onCurrencyChange={setCurrency}
                    productUrl={productUrl} onProductUrlChange={setProductUrl}
                    category={category} onCategoryChange={setCategory}
                    allCategories={allCategories}
                    canCreateCategory={canCreateCategory}
                    language={language}
                    errors={errors}
                    t={t}
                  />
                </TabsContent>

                <TabsContent value="images" className="m-0 focus-visible:ring-0">
                  <ProductImagesTab
                    images={images.additionalImages}
                    activeImageUrl={images.activeImageUrl}
                    isUploading={images.isUploading}
                    onSetCover={images.setCover}
                    onRemove={images.removeImage}
                    onFilesSelected={images.addFiles}
                    onUploadClick={images.refreshSession}
                    t={t}
                  />
                </TabsContent>

                <TabsContent value="attributes" className="space-y-6 m-0 focus-visible:ring-0">
                  <ProductAttributesTab
                    attributes={customAttributes}
                    onAttributesChange={setCustomAttributes}
                    t={t}
                  />
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>

          {/* Footer */}
          <div className="flex justify-between items-center gap-3 px-6 py-4 border-t bg-muted/30 shrink-0">
            <span className="text-sm text-muted-foreground min-w-[30px] text-center">
              {activeTab === "basic" ? "1/3" : activeTab === "images" ? "2/3" : "3/3"}
            </span>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={requestClose} disabled={isSaving}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isSaving || images.isUploading} className="min-w-[120px]">
                {images.isUploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("common.loading")}</>
                ) : isSaving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("builder.saving")}</>
                ) : isEditing ? t("common.save") : t("products.addProduct")}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <AlertDialog open={confirmCloseOpen} onOpenChange={setConfirmCloseOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("productForm.unsavedTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("productForm.unsavedDesc")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("productForm.unsavedKeep")}</AlertDialogCancel>
          <AlertDialogAction onClick={closeNow} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {t("productForm.unsavedDiscard")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
