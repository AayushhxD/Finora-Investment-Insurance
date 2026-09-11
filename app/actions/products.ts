'use server'
import { revalidatePath } from 'next/cache'
import { getStore, newId, now, logActivity } from '@/lib/store'
import type { Product, ProductSubCategory } from '@/lib/store-types'
import { z } from 'zod'

const ProductSchema = z.object({
  name: z.string().min(2, 'Name required'),
  category: z.enum(['Investment', 'Insurance', 'Demat']),
  subCategory: z.string().min(2, 'Sub-category required'),
  description: z.string().min(10, 'Description required'),
  eligibility: z.string().min(5, 'Eligibility required'),
  requiredDocs: z.array(z.string()).min(1, 'At least one document required'),
  risk: z.enum(['Low', 'Medium', 'High']),
  minInvestment: z.coerce.number().min(0, 'Min investment must be 0 or more'),
  returnPa: z.coerce.number().optional(),
  status: z.enum(['active', 'inactive']),
})

export async function getProducts() { return getStore().products }
export async function getProductById(id: string) { return getStore().products.find(p => p.id === id) ?? null }
export async function getActiveProducts() { return getStore().products.filter(p => p.status === 'active') }

export async function createProduct(data: unknown) {
  const parsed = ProductSchema.parse(data)
  const product: Product = { 
    id: newId(), 
    ...parsed, 
    subCategory: parsed.subCategory as ProductSubCategory, 
    createdAt: now() 
  }
  getStore().products.push(product)
  logActivity('product', product.id, product.name, 'Product Created', 'Admin')
  revalidatePath('/products')
  return { ok: true, id: product.id }
}

export async function updateProduct(id: string, data: unknown) {
  const parsed = ProductSchema.partial().parse(data)
  const store = getStore()
  const idx = store.products.findIndex(p => p.id === id)
  if (idx === -1) throw new Error('Product not found')
  const updatedData = { ...parsed }
  if (updatedData.subCategory) {
    updatedData.subCategory = updatedData.subCategory as ProductSubCategory
  }
  store.products[idx] = { ...store.products[idx], ...(updatedData as any) }
  logActivity('product', id, store.products[idx].name, 'Product Updated', 'Admin')
  revalidatePath('/products')
  revalidatePath(`/products/${id}`)
  return { ok: true }
}

export async function deleteProduct(id: string) {
  const store = getStore()
  const idx = store.products.findIndex(p => p.id === id)
  if (idx === -1) throw new Error('Product not found')
  const name = store.products[idx].name
  store.products.splice(idx, 1)
  logActivity('product', id, name, 'Product Deleted', 'Admin')
  revalidatePath('/products')
  return { ok: true }
}

export async function getProductStats(productId: string) {
  const store = getStore()
  const apps = store.applications.filter(a => a.productId === productId)
  return {
    totalApplications: apps.length,
    activeApplications: apps.filter(a => !['COMPLETED','REJECTED','RENEWAL_SCHEDULED'].includes(a.status)).length,
    completedApplications: apps.filter(a => a.status === 'COMPLETED' || a.status === 'RENEWAL_SCHEDULED').length,
    rejectedApplications: apps.filter(a => a.status === 'REJECTED').length,
  }
}
