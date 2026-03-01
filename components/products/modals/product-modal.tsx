"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Package2, Tag, ImagePlus, Layers, Loader2 } from "lucide-react"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { type Product, type CustomAttribute, createProduct, updateProduct } from "@/lib/actions/products"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { useProductImages } from "@/lib/hooks/use-product-images"

import { ProductBasicTab } from "../tabs/product-basic-tab"
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

  // ─── Images Hook ────────────────────────────────────────────────────
  const images = useProductImages({ t })

  // ─── Modal Open / Close ─────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      // Init form from product
      setName(product?.name || "")
      setSku(product?.sku || "")
      setDescription(product?.description || "")
      setPrice(product?.price?.toString() || "")
      setStock(product?.stock?.toString() || "")
      setCategory(product?.category ? product.category.split(",").map((c) => c.trim()).filter(Boolean) : [])
      setCurrency(product?.custom_attributes?.find((a) => a.name === "currency")?.value || "TRY")
      setProductUrl(product?.product_url || "")
      setCustomAttributes(product?.custom_attributes?.filter((a) => a.name !== "currency" && a.name !== "additional_images") || [])
      setActiveTab("basic")
      images.initFromProduct(product)
    } else {
      images.cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // ─── Submit ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formElement = e.currentTarget instanceof HTMLFormElement ? e.currentTarget : (e.target as HTMLFormElement)
    const formDataLocal = formElement instanceof HTMLFormElement ? new FormData(formElement) : new FormData()
    const pendingCat = (formDataLocal.get("newCategoryInput") as string || "").trim()

    if (!name.trim()) {
      toast.error(t("toasts.productNameRequired"))
      setActiveTab("basic")
      return
    }
    if (images.isUploading) {
      toast.error("Fotoğraflar yüklenirken kayıt yapılamaz. Lütfen bekleyin.")
      return
    }

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
      finalImageUrls = [coverUrl, ...finalImageUrls].slice(0, 5)
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
    formData.append("price", price)
    formData.append("stock", stock)
    formData.append("category", finalCategories.join(", "))
    formData.append("image_url", coverUrl)
    formData.append("images", JSON.stringify(finalImageUrls))
    formData.append("product_url", productUrl)

    const attrs = customAttributes.filter((a) => a.name && a.value && a.name !== "currency" && a.name !== "additional_images")
    if (currency) attrs.push({ name: "currency", value: currency, unit: "" })
    formData.set("custom_attributes", JSON.stringify(attrs))

    setIsSaving(true)
    try {
      if (isEditing) {
        await updateProduct(product.id, formData)
        await new Promise((r) => setTimeout(r, 500)) // DB consistency wait
        onSaved({
          ...product,
          name, sku, description,
          price: parseFloat(price) || 0,
          stock: parseInt(stock) || 0,
          category: finalCategories.join(", "),
          image_url: coverUrl,
          images: finalImageUrls,
          product_url: productUrl || null,
          custom_attributes: attrs,
        })
        toast.success(t("toasts.productUpdated"))
      } else {
        if (currentProductCount >= maxProducts) {
          toast.error(t("toasts.productLimitReached", {
            current: currentProductCount.toString(),
            incoming: "1",
            max: maxProducts.toString(),
          }))
          return
        }

        const newProduct = await createProduct(formData)
        onSaved(newProduct)
        toast.success(t("toasts.productCreated"))
      }
      onOpenChange(false)
    } catch {
      toast.error(isEditing ? t("toasts.productUpdateFailed") : t("toasts.productCreateFailed"))
    } finally {
      setIsSaving(false)
    }
  }

  // ─── Cancel ─────────────────────────────────────────────────────────
  const handleCancel = () => {
    images.pendingImages.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl))
    onOpenChange(false)
  }

  // ─── Render ─────────────────────────────────────────────────────────
  const tabTriggerClass = "data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-400 rounded-md h-full text-xs sm:text-sm font-medium transition-all gap-1.5"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
              <Package2 className="w-5 h-5 text-white" />
            </div>
            {isEditing ? t("products.editProduct") : t("products.addNew")}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t("products.editProductDesc") || "Ürün bilgilerini güncelleyin." : t("products.addProductDesc") || "Yeni bir ürün ekleyin."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b px-4 sm:px-6 shrink-0 py-2 bg-slate-50/50">
              <TabsList className="h-11 w-full grid grid-cols-3 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-lg gap-1">
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
              <Button type="button" variant="outline" onClick={handleCancel}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isSaving || images.isUploading} className="min-w-[120px] bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
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
  )
}
