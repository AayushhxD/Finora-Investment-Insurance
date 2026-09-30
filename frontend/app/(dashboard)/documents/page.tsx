import { getDocuments } from '@backend/modules/documents/presentation/actions'
import DocumentsClient from '@/components/documents/documents-client'

export default async function DocumentsPage() {
  const documents = await getDocuments()
  return <DocumentsClient documents={documents} />
}
