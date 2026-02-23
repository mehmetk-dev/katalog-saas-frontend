"use server"

import { revalidatePath } from "next/cache"

import { apiFetch } from "@/lib/api"

export interface CustomAttribute {
  name: string
  value: string
  unit?: string
}

export interface Product {
  id: string
  user_id: string
  sku: string | null
  name: string
  description: string | null
  price: number
  stock: number
  category: string | null
  image_url: string | null
  images: string[] // Tüm görseller
  product_url: string | null  // Ürün satış/detay linki
  custom_attributes: CustomAttribute[]
  created_at: string
  updated_at: string
  order: number
}

export interface ProductsResponse {
  products: Product[]
  metadata: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export async function getProducts(params?: {
  page?: number
  limit?: number
  category?: string
  search?: string
}): Promise<ProductsResponse> {
  const queryParams = new URLSearchParams()
  if (params?.page) queryParams.set("page", params.page.toString())
  if (params?.limit) queryParams.set("limit", params.limit.toString())
  if (params?.category) queryParams.set("category", params.category)
  if (params?.search) queryParams.set("search", params.search)

  const queryString = queryParams.toString()
  const path = `/products${queryString ? `?${queryString}` : ""}`

  return await apiFetch<ProductsResponse>(path)
}

export interface ProductStats {
  total: number
  inStock: number
  lowStock: number
  outOfStock: number
  totalValue: number
}

export async function getProductStats(): Promise<ProductStats> {
  return await apiFetch<ProductStats>("/products/stats")
}

export async function createProduct(formData: FormData) {
  const customAttributesJson = formData.get("custom_attributes") as string
  let customAttributes: CustomAttribute[] = []
  try {
    if (customAttributesJson) {
      customAttributes = JSON.parse(customAttributesJson)
    }
  } catch {
    customAttributes = []
  }

  const imagesJson = formData.get("images") as string
  let images: string[] = []
  try {
    if (imagesJson) {
      images = JSON.parse(imagesJson)
    }
  } catch {
    images = []
  }

  const productData = {
    name: formData.get("name") as string,
    sku: (formData.get("sku") as string) || null,
    description: (formData.get("description") as string) || null,
    price: Number.parseFloat(formData.get("price") as string) || 0,
    stock: Number.parseInt(formData.get("stock") as string) || 0,
    category: (formData.get("category") as string) || null,
    image_url: (formData.get("image_url") as string) || null,
    images: images,
    product_url: (formData.get("product_url") as string) || null,
    custom_attributes: customAttributes,
  }

  const data = await apiFetch<Product>("/products", {
    method: "POST",
    body: JSON.stringify(productData),
  })
  revalidatePath("/dashboard/products")
  return data
}

export async function updateProduct(id: string, formData: FormData) {
  const customAttributesJson = formData.get("custom_attributes") as string
  let customAttributes: CustomAttribute[] = []
  try {
    if (customAttributesJson) {
      customAttributes = JSON.parse(customAttributesJson)
    }
  } catch {
    customAttributes = []
  }

  const imagesJson = formData.get("images") as string
  try {
    if (imagesJson) {
      JSON.parse(imagesJson) // Parse to validate, but we'll get images from formData
    }
  } catch {
    // If not provided in update, maybe we shouldn't overwrite? 
    // But formData usually contains all fields in this app approach.
    // If images field is missing from formData, it might mean no change? 
    // But we are constructing 'updates' object. 
    // Let's assume frontend sends it if it changes.
    // If it is undefined in formData, user might not want to update it.
    // But here we default to [] if parse fails or empty.
    // Ideally we should check if key exists.
    // Images are handled separately in the form data
  }

  // Refined Logic:
  // We will assume the frontend ALWAYS sends 'images' array as JSON if it's an edit form.

  const updates: Record<string, unknown> = {
    name: formData.get("name") as string,
    sku: (formData.get("sku") as string) || null,
    description: (formData.get("description") as string) || null,
    price: Number.parseFloat(formData.get("price") as string) || 0,
    stock: Number.parseInt(formData.get("stock") as string) || 0,
    category: (formData.get("category") as string) || null,
    image_url: (formData.get("image_url") as string) || null,
    product_url: (formData.get("product_url") as string) || null,
    custom_attributes: customAttributes,
  }

  if (formData.has("images")) {
    try {
      updates.images = JSON.parse(formData.get("images") as string || "[]")
    } catch {
      updates.images = []
    }
  }

  await apiFetch(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  })
  revalidatePath("/dashboard/products")
  return { success: true }
}

export async function deleteProduct(id: string) {
  await apiFetch(`/products/${id}`, {
    method: "DELETE",
  })
  revalidatePath("/dashboard/products")
  return { success: true }
}

export async function deleteProducts(ids: string[]) {
  await apiFetch("/products/bulk-delete", {
    method: "POST",
    body: JSON.stringify({ ids }),
  })
  revalidatePath("/dashboard/products")
  return { success: true }
}

export interface CatalogReference {
  id: string
  name: string
}

export interface ProductCatalogCheck {
  isInCatalogs: boolean
  catalogs: CatalogReference[]
  count: number
}

export interface ProductsCatalogCheck {
  productsInCatalogs: { productId: string; catalogs: CatalogReference[] }[]
  hasAnyInCatalogs: boolean
}

// Tek bir ürünün hangi kataloglarda olduğunu kontrol et
export async function checkProductInCatalogs(productId: string): Promise<ProductCatalogCheck> {
  try {
    return await apiFetch<ProductCatalogCheck>(`/products/${productId}/catalogs`)
  } catch (error) {
    console.error("Error checking product catalogs:", error)
    return { isInCatalogs: false, catalogs: [], count: 0 }
  }
}

// Birden fazla ürünün kataloglarda olup olmadığını kontrol et
export async function checkProductsInCatalogs(productIds: string[]): Promise<ProductsCatalogCheck> {
  try {
    return await apiFetch<ProductsCatalogCheck>("/products/check-catalogs", {
      method: "POST",
      body: JSON.stringify({ productIds }),
    })
  } catch (error) {
    console.error("Error checking products catalogs:", error)
    return { productsInCatalogs: [], hasAnyInCatalogs: false }
  }
}

export async function bulkImportProducts(products: Omit<Product, "id" | "user_id" | "created_at" | "updated_at">[]) {
  try {
    // Toplu import için retry ve daha uzun timeout kullan
    const importedProducts = await apiFetch<Product[]>("/products/bulk-import", {
      method: "POST",
      body: JSON.stringify({ products }),
      retries: 3, // 3 kez retry yap
      retryDelay: 2000, // Her retry arasında 2 saniye bekle
      timeout: 120000, // 120 saniye timeout - büyük dosyalar için
    })
    revalidatePath("/dashboard/products")
    return importedProducts
  } catch (error) {
    console.error("Bulk import error:", error)
    throw error
  }
}

export async function updateProductOrder(orderData: { id: string; order: number }[]) {
  try {
    await apiFetch("/products/reorder", {
      method: "POST",
      body: JSON.stringify({ order: orderData }),
    })
    revalidatePath("/dashboard/products")
    return { success: true }
  } catch (error) {
    // Sıralama kaydetme başarısız olsa bile UI'da çalışmaya devam et
    console.error("Error updating product order:", error)
    return { success: false }
  }
}

export async function bulkUpdatePrices(
  productIds: string[],
  changeType: "increase" | "decrease",
  changeMode: "percentage" | "fixed",
  amount: number
) {
  const updatedProducts = await apiFetch<Product[]>("/products/bulk-price-update", {
    method: "POST",
    body: JSON.stringify({
      productIds,
      changeType,
      changeMode,
      amount
    }),
  })
  revalidatePath("/dashboard/products")
  return updatedProducts
}

export async function bulkUpdateProductImages(updates: { productId: string; images: string[] }[]) {
  // Veriyi hazırlarken her bir ürün için mevcut görselleri koruyarak ekleme yapılması
  // Normalde backend'in bunu yapması idealdir ama backend'e müdahale edemediğimiz için
  // burada her ürün için güncel halini alıp birleştiriyoruz (Server-side merge).

  const finalUpdates = await Promise.all(updates.map(async (update) => {
    try {
      // Ürünün en güncel halini çek
      const currentProduct = await apiFetch<Product>(`/products/${update.productId}`)
      const existingImages = currentProduct.images || (currentProduct.image_url ? [currentProduct.image_url] : [])

      // Mevcut olanların üzerine yenileri ekle (Tekil tutarak ve limitleyerek)
      const combined = [...existingImages]
      update.images.forEach(img => {
        if (!combined.includes(img)) combined.push(img)
      })

      return {
        productId: update.productId,
        images: combined.slice(0, 5)
      }
    } catch (error) {
      console.error(`[bulkUpdateProductImages] Fetch error for ${update.productId}:`, error)
      return update // Hata durumunda orijinal güncellemeyi döndür (fallback)
    }
  }))

  await apiFetch("/products/bulk-image-update", {
    method: "POST",
    body: JSON.stringify({ updates: finalUpdates }),
  })

  revalidatePath("/dashboard/products")
  return { success: true }
}

export async function renameCategory(oldName: string, newName: string) {
  const updatedProducts = await apiFetch<Product[]>("/products/rename-category", {
    method: "POST",
    body: JSON.stringify({ oldName, newName }),
  })
  revalidatePath("/dashboard/products")
  revalidatePath("/dashboard/categories")
  return updatedProducts
}

export async function deleteCategory(categoryName: string) {
  const updatedProducts = await apiFetch<Product[]>("/products/delete-category", {
    method: "POST",
    body: JSON.stringify({ categoryName }),
  })
  revalidatePath("/dashboard/products")
  revalidatePath("/dashboard/categories")
  return updatedProducts
}

export async function addDummyProducts(language: 'tr' | 'en' = 'tr', userPlan: 'free' | 'plus' | 'pro' = 'free') {
  const timestamp = Date.now();
  const isEn = language === 'en';
  const isFreeUser = userPlan === 'free';

  const dummyProducts = [
    {
      name: isEn ? "Wooden Desk Lamp" : "Ahşap Masa Lambası",
      description: isEn ? "Handmade wooden body, linen fabric shade modern desk lamp. Made from natural oak." : "El yapımı ahşap gövdeli, keten kumaş abajurlu modern masa lambası. Doğal meşe ağacından üretilmiştir.",
      price: 450,
      stock: 15,
      category: isFreeUser ? null : (isEn ? "Lighting" : "Aydınlatma"),
      sku: `LAMP-${timestamp}-1`,
      image_url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&q=80",
      images: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&q=80"],
      product_url: null,
      custom_attributes: [
        { name: isEn ? "Material" : "Malzeme", value: isEn ? "Oak Wood" : "Meşe Ağacı", unit: "" },
        { name: isEn ? "Height" : "Yükseklik", value: "45", unit: "cm" }
      ]
    },
    {
      name: isEn ? "Leather Sofa Set" : "Deri Koltuk Takımı",
      description: isEn ? "Premium Italian leather 3+2+1 sofa set. Ergonomic design and high seating comfort." : "Premium İtalyan derisinden üretilmiş 3+2+1 koltuk takımı. Ergonomik tasarım ve yüksek oturma konforu.",
      price: 28500,
      stock: 3,
      category: isFreeUser ? null : (isEn ? "Furniture" : "Mobilya"),
      sku: `SOFA-${timestamp}-2`,
      image_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80",
      images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80"],
      product_url: null,
      custom_attributes: [
        { name: isEn ? "Material" : "Malzeme", value: isEn ? "Italian Leather" : "İtalyan Deri", unit: "" },
        { name: isEn ? "Color" : "Renk", value: isEn ? "Brown" : "Kahverengi", unit: "" }
      ]
    },
    {
      name: isEn ? "Bluetooth Headphones" : "Bluetooth Kulaklık",
      description: isEn ? "Wireless headphones with active noise cancelling. 30 hours battery life." : "Aktif gürültü engelleme özellikli kablosuz kulaklık. 30 saat pil ömrü.",
      price: 1299,
      stock: 50,
      category: isFreeUser ? null : (isEn ? "Electronics" : "Elektronik"),
      sku: `AUDIO-${timestamp}-3`,
      image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
      images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80"],
      product_url: null,
      custom_attributes: [
        { name: isEn ? "Battery Life" : "Pil Ömrü", value: "30", unit: isEn ? "hours" : "saat" },
        { name: isEn ? "Color" : "Renk", value: isEn ? "Black" : "Siyah", unit: "" }
      ]
    },
    {
      name: isEn ? "Minimalist Wall Clock" : "Minimalist Duvar Saati",
      description: isEn ? "Silent mechanism, Scandinavian style wall clock. Natural beech wood and matte black frame." : "Sessiz mekanizmalı, Skandinav tarzı duvar saati. Doğal kayın ağacı ve mat siyah çerçeve.",
      price: 320,
      stock: 25,
      category: isFreeUser ? null : (isEn ? "Decoration" : "Dekorasyon"),
      sku: `CLOCK-${timestamp}-4`,
      image_url: "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=500&q=80",
      images: ["https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=500&q=80"],
      product_url: null,
      custom_attributes: [
        { name: isEn ? "Diameter" : "Çap", value: "30", unit: "cm" },
        { name: isEn ? "Material" : "Malzeme", value: isEn ? "Beech Wood" : "Kayın Ağacı", unit: "" }
      ]
    },
    {
      name: isEn ? "Ceramic Vase Set" : "Seramik Vazo Set",
      description: isEn ? "Hand-painted 3-piece ceramic vase set. Geometric pattern, matte white and gold details." : "El boyaması 3'lü seramik vazo seti. Geometrik desenli, mat beyaz ve altın detaylı.",
      price: 590,
      stock: 12,
      category: isFreeUser ? null : (isEn ? "Decoration" : "Dekorasyon"),
      sku: `VASE-${timestamp}-5`,
      image_url: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=500&q=80",
      images: ["https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=500&q=80"],
      product_url: null,
      custom_attributes: [
        { name: isEn ? "Pieces" : "Adet", value: "3", unit: isEn ? "pcs" : "parça" },
        { name: isEn ? "Material" : "Malzeme", value: isEn ? "Ceramic" : "Seramik", unit: "" }
      ]
    },
    {
      name: isEn ? "Smart Watch Pro" : "Akıllı Saat Pro",
      description: isEn ? "Premium smart watch with health tracking, GPS and NFC. AMOLED screen, 5 days battery life." : "Sağlık takibi, GPS ve NFC özellikli premium akıllı saat. AMOLED ekran, 5 gün pil ömrü.",
      price: 4999,
      stock: 30,
      category: isFreeUser ? null : (isEn ? "Electronics" : "Elektronik"),
      sku: `WATCH-${timestamp}-6`,
      image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80",
      images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80"],
      product_url: null,
      custom_attributes: [
        { name: isEn ? "Screen" : "Ekran", value: "AMOLED", unit: "" },
        { name: isEn ? "Water Resistant" : "Su Geçirmezlik", value: "5", unit: "ATM" }
      ]
    },
    {
      name: isEn ? "Organic Cotton Bedding" : "Organik Pamuk Nevresim",
      description: isEn ? "100% organic cotton double bedding set with 300 thread count. Oeko-Tex certified." : "300 iplik sayılı %100 organik pamuklu çift kişilik nevresim seti. Oeko-Tex sertifikalı.",
      price: 1150,
      stock: 40,
      category: isFreeUser ? null : (isEn ? "Home Textiles" : "Ev Tekstili"),
      sku: `BED-${timestamp}-7`,
      image_url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500&q=80",
      images: ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500&q=80"],
      product_url: null,
      custom_attributes: [
        { name: isEn ? "Material" : "Malzeme", value: isEn ? "Organic Cotton" : "Organik Pamuk", unit: "" },
        { name: isEn ? "Thread Count" : "İplik Sayısı", value: "300", unit: "" }
      ]
    },
    {
      name: isEn ? "Bamboo Kitchen Set" : "Bambu Mutfak Seti",
      description: isEn ? "5-piece bamboo kitchen utensil set. Includes spoon, spatula, tongs and holder." : "5 parça bambu mutfak gereçleri seti. Kaşık, spatula, maşa ve tutucu dahil.",
      price: 189,
      stock: 80,
      category: isFreeUser ? null : (isEn ? "Kitchen" : "Mutfak"),
      sku: `KITCHEN-${timestamp}-8`,
      image_url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&q=80",
      images: ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&q=80"],
      product_url: null,
      custom_attributes: [
        { name: isEn ? "Pieces" : "Adet", value: "5", unit: isEn ? "pcs" : "parça" },
        { name: isEn ? "Material" : "Malzeme", value: isEn ? "Bamboo" : "Bambu", unit: "" }
      ]
    },
    {
      name: isEn ? "Vintage Leather Bag" : "Vintage Deri Çanta",
      description: isEn ? "Handmade genuine leather messenger bag. Laptop compartment and adjustable strap." : "El yapımı hakiki deri messenger çanta. Laptop bölmesi ve ayarlanabilir askı.",
      price: 2450,
      stock: 8,
      category: isFreeUser ? null : (isEn ? "Accessories" : "Aksesuar"),
      sku: `BAG-${timestamp}-9`,
      image_url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80",
      images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80"],
      product_url: null,
      custom_attributes: [
        { name: isEn ? "Material" : "Malzeme", value: isEn ? "Genuine Leather" : "Hakiki Deri", unit: "" },
        { name: "Laptop", value: "15", unit: isEn ? "inch" : "inç" }
      ]
    },
    {
      name: isEn ? "Aromatic Candle Set" : "Aromatik Mum Koleksiyonu",
      description: isEn ? "Soy-based 4-piece aromatic candle set. Lavender, vanilla, sandalwood and sea breeze scents." : "Soya bazlı 4'lü aromatik mum seti. Lavanta, vanilya, sandal ağacı ve deniz esintisi kokuları.",
      price: 280,
      stock: 60,
      category: isFreeUser ? null : (isEn ? "Decoration" : "Dekorasyon"),
      sku: `CANDLE-${timestamp}-10`,
      image_url: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&q=80",
      images: ["https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&q=80"],
      product_url: null,
      custom_attributes: [
        { name: isEn ? "Pieces" : "Adet", value: "4", unit: isEn ? "pcs" : "parça" },
        { name: isEn ? "Burn Time" : "Yanma Süresi", value: "40", unit: isEn ? "hours" : "saat" }
      ]
    }
  ];

  // Add order field
  const dummyProductsWithOrder = dummyProducts.map((p, index) => ({ ...p, order: index }))


  return await bulkImportProducts(dummyProductsWithOrder);
}

export async function getAllProductIds(): Promise<string[]> {
  try {
    const response = await apiFetch<any>("/products?limit=9999&select=id")
    if (Array.isArray(response)) {
      return response.map(p => p.id)
    }
    // Eğer response formatı { products: [...] } şeklindeyse
    if (response.products && Array.isArray(response.products)) {
      return response.products.map((p: any) => p.id)
    }
    return []
  } catch (error) {
    console.error("Error fetching all product IDs:", error)
    return []
  }
}


