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
}

export async function getProducts() {
  try {
    return await apiFetch<Product[]>("/products")
  } catch (error) {
    console.error("Error fetching products:", error)
    return []
  }
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

  try {
    const data = await apiFetch<Product>("/products", {
      method: "POST",
      body: JSON.stringify(productData),
    })
    revalidatePath("/dashboard/products")
    return data
  } catch (error) {
    throw error
  }
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
  let images: string[] = []
  try {
    if (imagesJson) {
      images = JSON.parse(imagesJson)
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
    if (formData.has("images")) {
      images = []
    } else {
      // preserve existing? The backend usually handles PATCH differently.
      // But here we are sending full object for PUT typically?
      // apiFetch "/products/${id}" with PUT usually replaces.
      // Let's assume we need to send it.
      images = []
    }
  }

  // Refined Logic:
  // We will assume the frontend ALWAYS sends 'images' array as JSON if it's an edit form.

  const updates: any = {
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

  try {
    await apiFetch(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    })
    revalidatePath("/dashboard/products")
    return { success: true }
  } catch (error) {
    throw error
  }
}

export async function deleteProduct(id: string) {
  try {
    await apiFetch(`/products/${id}`, {
      method: "DELETE",
    })
    revalidatePath("/dashboard/products")
    return { success: true }
  } catch (error) {
    throw error
  }
}

export async function deleteProducts(ids: string[]) {
  try {
    await apiFetch("/products/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    })
    revalidatePath("/dashboard/products")
    return { success: true }
  } catch (error) {
    throw error
  }
}

export async function bulkImportProducts(products: Omit<Product, "id" | "user_id" | "created_at" | "updated_at">[]) {
  try {
    const importedProducts = await apiFetch<Product[]>("/products/bulk-import", {
      method: "POST",
      body: JSON.stringify({ products }),
    })
    revalidatePath("/dashboard/products")
    return importedProducts
  } catch (error) {
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
  try {
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
  } catch (error) {
    throw error
  }
}

export async function renameCategory(oldName: string, newName: string) {
  try {
    const updatedProducts = await apiFetch<Product[]>("/products/rename-category", {
      method: "POST",
      body: JSON.stringify({ oldName, newName }),
    })
    revalidatePath("/dashboard/products")
    revalidatePath("/dashboard/categories")
    return updatedProducts
  } catch (error) {
    throw error
  }
}

export async function deleteCategory(categoryName: string) {
  try {
    const updatedProducts = await apiFetch<Product[]>("/products/delete-category", {
      method: "POST",
      body: JSON.stringify({ categoryName }),
    })
    revalidatePath("/dashboard/products")
    revalidatePath("/dashboard/categories")
    return updatedProducts
  } catch (error) {
    throw error
  }
}

export async function addDummyProducts() {
  try {
    const timestamp = Date.now();
    const dummyProducts = [
      {
        name: "Ahşap Masa Lambası",
        description: "El yapımı ahşap gövdeli, keten kumaş abajurlu modern masa lambası. Doğal meşe ağacından üretilmiştir.",
        price: 450,
        stock: 15,
        category: "Aydınlatma",
        sku: `LAMP-${timestamp}-1`,
        image_url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&q=80"],
        product_url: null,
        custom_attributes: [
          { name: "Malzeme", value: "Meşe Ağacı", unit: "" },
          { name: "Yükseklik", value: "45", unit: "cm" }
        ]
      },
      {
        name: "Deri Koltuk Takımı",
        description: "Premium İtalyan derisinden üretilmiş 3+2+1 koltuk takımı. Ergonomik tasarım ve yüksek oturma konforu.",
        price: 28500,
        stock: 3,
        category: "Mobilya",
        sku: `SOFA-${timestamp}-2`,
        image_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80"],
        product_url: null,
        custom_attributes: [
          { name: "Malzeme", value: "İtalyan Deri", unit: "" },
          { name: "Renk", value: "Kahverengi", unit: "" }
        ]
      },
      {
        name: "Bluetooth Kulaklık",
        description: "Aktif gürültü engelleme özellikli kablosuz kulaklık. 30 saat pil ömrü.",
        price: 1299,
        stock: 50,
        category: "Elektronik",
        sku: `AUDIO-${timestamp}-3`,
        image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80"],
        product_url: null,
        custom_attributes: [
          { name: "Pil Ömrü", value: "30", unit: "saat" },
          { name: "Renk", value: "Siyah", unit: "" }
        ]
      },
      {
        name: "Minimalist Duvar Saati",
        description: "Sessiz mekanizmalı, Skandinav tarzı duvar saati. Doğal kayın ağacı ve mat siyah çerçeve.",
        price: 320,
        stock: 25,
        category: "Dekorasyon",
        sku: `CLOCK-${timestamp}-4`,
        image_url: "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=500&q=80"],
        product_url: null,
        custom_attributes: [
          { name: "Çap", value: "30", unit: "cm" },
          { name: "Malzeme", value: "Kayın Ağacı", unit: "" }
        ]
      },
      {
        name: "Seramik Vazo Set",
        description: "El boyaması 3'lü seramik vazo seti. Geometrik desenli, mat beyaz ve altın detaylı.",
        price: 590,
        stock: 12,
        category: "Dekorasyon",
        sku: `VASE-${timestamp}-5`,
        image_url: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=500&q=80"],
        product_url: null,
        custom_attributes: [
          { name: "Adet", value: "3", unit: "parça" },
          { name: "Malzeme", value: "Seramik", unit: "" }
        ]
      },
      {
        name: "Akıllı Saat Pro",
        description: "Sağlık takibi, GPS ve NFC özellikli premium akıllı saat. AMOLED ekran, 5 gün pil ömrü.",
        price: 4999,
        stock: 30,
        category: "Elektronik",
        sku: `WATCH-${timestamp}-6`,
        image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80"],
        product_url: null,
        custom_attributes: [
          { name: "Ekran", value: "AMOLED", unit: "" },
          { name: "Su Geçirmezlik", value: "5", unit: "ATM" }
        ]
      },
      {
        name: "Organik Pamuk Nevresim",
        description: "300 iplik sayılı %100 organik pamuklu çift kişilik nevresim seti. Oeko-Tex sertifikalı.",
        price: 1150,
        stock: 40,
        category: "Ev Tekstili",
        sku: `BED-${timestamp}-7`,
        image_url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500&q=80"],
        product_url: null,
        custom_attributes: [
          { name: "Malzeme", value: "Organik Pamuk", unit: "" },
          { name: "İplik Sayısı", value: "300", unit: "" }
        ]
      },
      {
        name: "Bambu Mutfak Seti",
        description: "5 parça bambu mutfak gereçleri seti. Kaşık, spatula, maşa ve tutucu dahil.",
        price: 189,
        stock: 80,
        category: "Mutfak",
        sku: `KITCHEN-${timestamp}-8`,
        image_url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&q=80"],
        product_url: null,
        custom_attributes: [
          { name: "Adet", value: "5", unit: "parça" },
          { name: "Malzeme", value: "Bambu", unit: "" }
        ]
      },
      {
        name: "Vintage Deri Çanta",
        description: "El yapımı hakiki deri messenger çanta. Laptop bölmesi ve ayarlanabilir askı.",
        price: 2450,
        stock: 8,
        category: "Aksesuar",
        sku: `BAG-${timestamp}-9`,
        image_url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80"],
        product_url: null,
        custom_attributes: [
          { name: "Malzeme", value: "Hakiki Deri", unit: "" },
          { name: "Laptop", value: "15", unit: "inç" }
        ]
      },
      {
        name: "Aromatik Mum Koleksiyonu",
        description: "Soya bazlı 4'lü aromatik mum seti. Lavanta, vanilya, sandal ağacı ve deniz esintisi kokuları.",
        price: 280,
        stock: 60,
        category: "Dekorasyon",
        sku: `CANDLE-${timestamp}-10`,
        image_url: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&q=80"],
        product_url: null,
        custom_attributes: [
          { name: "Adet", value: "4", unit: "parça" },
          { name: "Yanma Süresi", value: "40", unit: "saat" }
        ]
      }
    ];

    return await bulkImportProducts(dummyProducts);
  } catch (error) {
    throw error;
  }
}
