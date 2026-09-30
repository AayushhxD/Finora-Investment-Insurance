import { getProducts } from '@backend/modules/products/presentation/actions'
import ProductsClient from '@/components/products/products-client'

export default async function ProductsPage() {
  const products = await getProducts()
  return <ProductsClient products={products} />
}
