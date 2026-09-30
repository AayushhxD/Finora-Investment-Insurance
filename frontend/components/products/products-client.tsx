'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createProduct, updateProduct, deleteProduct } from '@backend/actions/products'
import type { Product } from '@shared/types/store-types'
import { Plus, Search, Package, Pencil, Trash2, TrendingUp, Shield, BarChart2, X } from 'lucide-react'

const RISK_COLORS: Record<string, string> = { Low: 'badge-green', Medium: 'badge-yellow', High: 'badge-red' }
const RISK_DOTS: Record<string, string> = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' }
const CAT_ICONS: Record<string, string> = { Investment: '📈', Insurance: '🛡️', Demat: '💹' }
const CAT_ICON_CLASS: Record<string, string> = { Investment: 'invest', Insurance: 'insure', Demat: 'demat' }
const CAT_BADGE: Record<string, string> = { Investment: 'b-blue', Insurance: 'b-green', Demat: 'badge-violet' }

const SUB_CATEGORIES = {
  Investment: ['Mutual Fund', 'Bond', 'Other Investment'],
  Insurance: ['LIC', 'Life Insurance', 'Health Insurance', 'Personal Accident', 'General Insurance'],
  Demat: ['Demat Account', 'Trading Account', 'Equity', 'IPO', 'Other Market'],
}

function ProductModal({ product, onClose }: { product?: Product | null; onClose: () => void }) {
  const [, startT] = useTransition()
  const [err, setErr] = useState('')
  const [category, setCategory] = useState<keyof typeof SUB_CATEGORIES>(product?.category ?? 'Investment')
  const [docsInput, setDocsInput] = useState(product?.requiredDocs?.join(', ') ?? '')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data: any = Object.fromEntries(fd.entries())
    data.requiredDocs = docsInput.split(',').map(d => d.trim()).filter(Boolean)
    startT(async () => {
      try {
        if (product) { await updateProduct(product.id, data) } else { await createProduct(data) }
        router.refresh(); onClose()
      } catch (ex: any) { setErr(ex.message) }
    })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-head">
          <div>
            <b>{product ? 'Edit Product' : 'Add New Product'}</b>
            <p>{product ? 'Update product details and settings.' : 'Fill in the details to add a new product to your catalogue.'}</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            {/* Basic Info */}
            <div className="modal-section">
              <div className="modal-section-title">Basic Information</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name</label>
                  <input name="name" required defaultValue={product?.name} placeholder="e.g. HDFC Top 100 Fund" />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select name="category" value={category} onChange={e => setCategory(e.target.value as any)}>
                    <option value="Investment">📈 Investment</option>
                    <option value="Insurance">🛡️ Insurance</option>
                    <option value="Demat">💹 Demat</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Sub-category</label>
                  <select name="subCategory" defaultValue={product?.subCategory ?? ''}>
                    {SUB_CATEGORIES[category].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Risk Level</label>
                  <select name="risk" defaultValue={product?.risk ?? 'Medium'}>
                    <option value="Low">🟢 Low Risk</option>
                    <option value="Medium">🟡 Medium Risk</option>
                    <option value="High">🔴 High Risk</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" required defaultValue={product?.description} placeholder="Briefly describe this product, its benefits and suitability…" />
              </div>
              <div className="form-group">
                <label>Eligibility</label>
                <input name="eligibility" defaultValue={product?.eligibility} placeholder="e.g. Age 18–65, any occupation, KYC required" />
              </div>
            </div>

            {/* Financial Details */}
            <div className="modal-section">
              <div className="modal-section-title">Financial Details</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Min Investment (₹)</label>
                  <input name="minInvestment" type="number" defaultValue={product?.minInvestment} min={0} placeholder="5000" />
                </div>
                <div className="form-group">
                  <label>Expected Return (% p.a.)</label>
                  <input name="returnPa" type="number" step="0.1" defaultValue={product?.returnPa} placeholder="e.g. 12.5" />
                </div>
              </div>
            </div>

            {/* Compliance */}
            <div className="modal-section">
              <div className="modal-section-title">Compliance &amp; Status</div>
              <div className="form-row">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Required Documents</label>
                  <input
                    value={docsInput}
                    onChange={e => setDocsInput(e.target.value)}
                    placeholder="PAN, Aadhaar, Bank Statement, Photo…"
                  />
                  <span className="form-helper">Separate multiple documents with commas.</span>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" defaultValue={product?.status ?? 'active'}>
                    <option value="active">✅ Active</option>
                    <option value="inactive">⏸ Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {err && <p className="form-error-msg">⚠ {err}</p>}
          </div>

          <div className="modal-foot">
            <button type="button" className="btn-light" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary">
              {product ? '✓ Save Changes' : '＋ Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProductCard({ p, onEdit, onDelete }: { p: Product; onEdit: () => void; onDelete: () => void }) {
  const iconClass = CAT_ICON_CLASS[p.category] ?? 'invest'
  return (
    <div className="product-card">
      <div className="product-card-header">
        <div className={`product-card-icon ${iconClass}`}>
          {CAT_ICONS[p.category] ?? '📦'}
        </div>
        <div className="product-card-meta">
          <div className="product-card-cat">
            {p.category} <span>/ {p.subCategory}</span>
          </div>
          <div className="product-card-name" title={p.name}>{p.name}</div>
        </div>
      </div>

      <div className="product-card-body">
        {/* Stats row */}
        <div className="product-card-stats">
          <div className="product-stat-box">
            <span className="product-stat-label">Min Invest</span>
            <div className="product-stat-value">
              {p.minInvestment > 0 ? `₹${p.minInvestment.toLocaleString()}` : 'Free'}
            </div>
          </div>
          {p.returnPa ? (
            <div className="product-stat-box">
              <span className="product-stat-label">Return p.a.</span>
              <div className="product-stat-value green">{p.returnPa}%</div>
            </div>
          ) : (
            <div className="product-stat-box">
              <span className="product-stat-label">Risk</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: RISK_DOTS[p.risk] ?? '#94a3b8', display: 'inline-block', boxShadow: `0 0 6px ${RISK_DOTS[p.risk]}` }} />
                <span style={{ fontWeight: 700, fontSize: 14 }}>{p.risk}</span>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {p.description && (
          <p className="product-card-desc">{p.description}</p>
        )}

        {/* Docs */}
        {p.requiredDocs && p.requiredDocs.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {p.requiredDocs.slice(0, 3).map(d => (
              <span key={d} className="badge badge-gray" style={{ fontSize: 10 }}>{d}</span>
            ))}
            {p.requiredDocs.length > 3 && (
              <span className="badge badge-gray" style={{ fontSize: 10 }}>+{p.requiredDocs.length - 3} more</span>
            )}
          </div>
        )}
      </div>

      <div className="product-card-footer">
        <div className="product-card-badges">
          <span className={`badge ${CAT_BADGE[p.category] ?? 'b-blue'}`}>{p.category}</span>
          <span className={`badge ${RISK_COLORS[p.risk] ?? 'badge-gray'}`}>{p.risk} risk</span>
          <span className={`badge ${p.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{p.status}</span>
        </div>
        <div className="product-card-actions">
          <button className="btn-ghost btn-sm" onClick={onEdit} title="Edit">
            <Pencil size={13} />
          </button>
          <button className="btn-ghost btn-sm" onClick={onDelete} title="Delete" style={{ color: 'var(--danger)' }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProductsClient({ products }: { products: Product[] }) {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [, startT] = useTransition()
  const router = useRouter()

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const filtered = products.filter(p =>
    (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.subCategory.toLowerCase().includes(search.toLowerCase())) &&
    (!catFilter || p.category === catFilter) &&
    (!statusFilter || p.status === statusFilter)
  )

  const byCategory = {
    Investment: filtered.filter(p => p.category === 'Investment').length,
    Insurance: filtered.filter(p => p.category === 'Insurance').length,
    Demat: filtered.filter(p => p.category === 'Demat').length,
  }

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Products</h1>
          <p className="muted">{products.length} products across all categories</p>
        </div>
        <button className="primary" onClick={() => { setEditProduct(null); setModal(true) }}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Category summary strip */}
      <div className="stats" style={{ marginBottom: 20 }}>
        <div className="stat" style={{ cursor: 'pointer' }} onClick={() => setCatFilter(catFilter === 'Investment' ? '' : 'Investment')}>
          <div className="stat-top">
            <span className="label">Investment</span>
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #dde8ff 0%, #c7d7fe 100%)', color: 'var(--primary)' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="num">{byCategory.Investment}</div>
          <div className="delta">Mutual Funds &amp; Bonds</div>
        </div>
        <div className="stat" style={{ cursor: 'pointer' }} onClick={() => setCatFilter(catFilter === 'Insurance' ? '' : 'Insurance')}>
          <div className="stat-top">
            <span className="label">Insurance</span>
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', color: 'var(--success)' }}>
              <Shield size={16} />
            </div>
          </div>
          <div className="num">{byCategory.Insurance}</div>
          <div className="delta">LIC, Health &amp; Life</div>
        </div>
        <div className="stat" style={{ cursor: 'pointer' }} onClick={() => setCatFilter(catFilter === 'Demat' ? '' : 'Demat')}>
          <div className="stat-top">
            <span className="label">Demat &amp; Market</span>
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)', color: 'var(--violet)' }}>
              <BarChart2 size={16} />
            </div>
          </div>
          <div className="num">{byCategory.Demat}</div>
          <div className="delta">Equity, IPO &amp; Trading</div>
        </div>
        <div className="stat">
          <div className="stat-top">
            <span className="label">Active Products</span>
            <div className="stat-icon">
              <Package size={16} />
            </div>
          </div>
          <div className="num">{products.filter(p => p.status === 'active').length}</div>
          <div className="delta up">{Math.round(products.filter(p => p.status === 'active').length / Math.max(products.length, 1) * 100)}% active rate</div>
        </div>
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div className="tbl-search" style={{ flex: 1 }}>
          <Search size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products by name or type…"
          />
        </div>
        <select className="tbl-filter-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          <option value="Investment">📈 Investment</option>
          <option value="Insurance">🛡️ Insurance</option>
          <option value="Demat">💹 Demat</option>
        </select>
        <select className="tbl-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Product cards grid */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <Package size={44} />
          <h3>No products found</h3>
          <p>Try adjusting your search or filters, or add a new product to get started.</p>
          <button className="primary" style={{ marginTop: 8 }} onClick={() => { setEditProduct(null); setModal(true) }}>
            <Plus size={16} /> Add Product
          </button>
        </div>
      ) : (
        <div className="product-grid">
          {filtered.map(p => (
            <ProductCard
              key={p.id}
              p={p}
              onEdit={() => { setEditProduct(p); setModal(true) }}
              onDelete={() => setDeleteId(p.id)}
            />
          ))}
        </div>
      )}

      {modal && (
        <ProductModal
          product={editProduct}
          onClose={() => { setModal(false); setEditProduct(null) }}
        />
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-head">
              <b>Delete Product?</b>
              <button
                style={{ width: 32, height: 32, border: '1.5px solid var(--line)', borderRadius: 8, background: '#fff', display: 'grid', placeItems: 'center' }}
                onClick={() => setDeleteId(null)}
              >
                <X size={15} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                This will permanently delete this product and remove it from all active applications. This action cannot be undone.
              </p>
            </div>
            <div className="modal-foot">
              <button className="btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button
                className="btn-danger"
                onClick={() => startT(async () => {
                  await deleteProduct(deleteId!)
                  setDeleteId(null)
                  showToast('Product deleted')
                  router.refresh()
                })}
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast show">{toast}</div>}
    </div>
  )
}
