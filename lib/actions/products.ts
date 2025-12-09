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

  const productData = {
    name: formData.get("name") as string,
    sku: (formData.get("sku") as string) || null,
    description: (formData.get("description") as string) || null,
    price: Number.parseFloat(formData.get("price") as string) || 0,
    stock: Number.parseInt(formData.get("stock") as string) || 0,
    category: (formData.get("category") as string) || null,
    image_url: (formData.get("image_url") as string) || null,
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

  const updates = {
    name: formData.get("name") as string,
    sku: (formData.get("sku") as string) || null,
    description: (formData.get("description") as string) || null,
    price: Number.parseFloat(formData.get("price") as string) || 0,
    stock: Number.parseInt(formData.get("stock") as string) || 0,
    category: (formData.get("category") as string) || null,
    image_url: (formData.get("image_url") as string) || null,
    custom_attributes: customAttributes,
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
    const dummyProducts = [
      {
        name: "Test Ürün 1",
        description: "Otomatik oluşturulan test ürünü açıklaması.",
        price: 150,
        stock: 20,
        category: null,
        sku: `TEST-${Date.now()}-1`,
        image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80",
        custom_attributes: []
      },
      {
        name: "Test Ürün 2",
        description: "Harika bir test ürünü.",
        price: 299.99,
        stock: 5,
        category: null,
        sku: `TEST-${Date.now()}-2`,
        image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
        custom_attributes: []
      },
      {
        name: "Test Ürün 3",
        description: "İndirimli test ürünü",
        price: 49.50,
        stock: 100,
        category: null,
        sku: `TEST-${Date.now()}-3`,
        image_url: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&q=80",
        custom_attributes: []
      },
      {
        name: "Test Ürün 4",
        description: "Premium test ürünü.",
        price: 1250,
        stock: 2,
        category: null,
        sku: `TEST-${Date.now()}-4`,
        image_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80",
        custom_attributes: []
      },
      {
        name: "Test Ürün 5",
        description: "Son test ürünü.",
        price: 15,
        stock: 50,
        category: null,
        sku: `TEST-${Date.now()}-5`,
        image_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&q=80",
        custom_attributes: []
      }
    ];

    return await bulkImportProducts(dummyProducts);
  } catch (error) {
    throw error;
  }
}
