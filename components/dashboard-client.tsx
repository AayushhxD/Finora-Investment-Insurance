'use client'
import { useState } from 'react'
import { addInvestment } from '@/app/actions/investments'
import { ShieldCheck } from 'lucide-react'

type Product = { id: number; name: string; category: string; fundSize: string; returnPa: string; risk: string }

export function DashboardClient({ name, products, investments }: { name: string; products: Product[]; investments: { amount: string }[] }) {
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState('')
  
  const invested = investments.reduce((sum, item) => sum + Number(item.amount), 0)
  const filtered = products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))

  async function invest(id: number) {
    await addInvestment(id, 500)
    setToast('Investment request added securely')
    setTimeout(() => setToast(''), 2800)
  }

  return (
    <div className="content">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">PRIVATE CLIENT DASHBOARD</p>
          <h1>Good morning, {name.split(' ')[0]}.</h1>
          <p className="muted">Your financial picture, composed in one view.</p>
        </div>
        <button className="primary" onClick={() => document.getElementById('funds')?.scrollIntoView({ behavior: 'smooth' })}>
          Invest now <span>→</span>
        </button>
      </div>

      <section className="metric-grid">
        <article>
          <span>PORTFOLIO VALUE</span>
          <strong>${(10125 + invested).toLocaleString()}</strong>
          <em className="positive">+28.2% <small>this year</small></em>
        </article>
        <article>
          <span>CONTRIBUTED</span>
          <strong>${(8032 + invested).toLocaleString()}</strong>
          <em>Across 4 positions</em>
        </article>
        <article>
          <span>PROTECTION COVER</span>
          <strong>$1.25m</strong>
          <em className="positive">Fully active</em>
        </article>
        <article>
          <span>NEXT RENEWAL</span>
          <strong>18 Jun</strong>
          <em>Life cover · 2025</em>
        </article>
      </section>

      <section className="feature-grid">
        <article className="panel growth-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">WEALTH TRAJECTORY</p>
              <h2>Investment growth</h2>
            </div>
            <select aria-label="Growth period">
              <option>12 months</option>
              <option>3 years</option>
            </select>
          </div>
          <div className="chart">
            <div className="chart-labels">
              <span>$12k</span><span>$9k</span><span>$6k</span><span>$3k</span><span>$0</span>
            </div>
            <div className="chart-lines">
              <i /><i /><i /><i /><i />
              <svg viewBox="0 0 620 220" preserveAspectRatio="none" aria-label="Investment growth chart">
                <path d="M0,194 C56,188 70,152 125,162 S176,173 220,137 S295,151 344,119 S397,128 444,99 S496,76 526,88 S573,55 620,18 L620,220 L0,220 Z" fill="url(#fill)" />
                <path d="M0,194 C56,188 70,152 125,162 S176,173 220,137 S295,151 344,119 S397,128 444,99 S496,76 526,88 S573,55 620,18" fill="none" stroke="#35b87d" strokeWidth="3" />
                <defs>
                  <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
                    <stop stopColor="#35b87d" stopOpacity=".28" />
                    <stop offset="1" stopColor="#35b87d" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          <div className="chart-foot">
            <span>Jun 24</span><span>Sep 24</span><span>Dec 24</span><span>Mar 25</span><span>Jun 25</span>
          </div>
        </article>

        <article className="panel allocation-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">ALLOCATION</p>
              <h2>Your portfolio</h2>
            </div>
            <button className="icon-btn" aria-label="Portfolio details">↗</button>
          </div>
          <div className="donut-wrap">
            <div className="donut">
              <div>4<br /><small>positions</small></div>
            </div>
            <ul>
              <li><i className="dot green" />Large cap <b>42%</b></li>
              <li><i className="dot violet" />Diversified <b>31%</b></li>
              <li><i className="dot mint" />Debt funds <b>27%</b></li>
            </ul>
          </div>
        </article>
      </section>

      <section className="section-head" id="funds">
        <div>
          <p className="eyebrow">CURATED FOR YOU</p>
          <h2>Funds worth a closer look</h2>
        </div>
        <button className="text-btn">View all →</button>
      </section>

      <div className="product-list">
        {filtered.map(product => (
          <article className="product" key={product.id}>
            <div className="product-icon">{product.category === 'Debt' ? '◒' : '↗'}</div>
            <div className="product-main">
              <div className="product-top">
                <span>{product.category} <small>•</small> Growth</span>
                <h3>{product.name}</h3>
              </div>
              <div className="product-stats">
                <div>
                  <small>FUND SIZE</small>
                  <b>₹{(Number(product.fundSize) / 10000000).toFixed(0)}cr</b>
                </div>
                <div>
                  <small>RETURN (P.A.)</small>
                  <b className="positive">+{product.returnPa}%</b>
                </div>
                <div>
                  <small>RISK</small>
                  <b>{product.risk}</b>
                </div>
              </div>
            </div>
            <button className="outline-btn" onClick={() => invest(product.id)}>Invest ₹500</button>
          </article>
        ))}
      </div>

      {toast && (
        <div className="toast">
          <ShieldCheck size={18} />
          {toast}
        </div>
      )}
    </div>
  )
}
