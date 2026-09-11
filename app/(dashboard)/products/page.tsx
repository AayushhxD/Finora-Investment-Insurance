import { getProducts } from '@/app/actions/products'
import ProductsClient from '@/components/products/products-client'

export default async function ProductsPage() {
  const products = await getProducts()
  return <ProductsClient products={products} />
}
