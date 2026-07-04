'use client'

import { useState } from 'react'
import { ExternalLink, Copy, Globe, CheckCircle2, Circle, ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type DemoStatus = 'Live' | 'Building' | 'Planned'
type DemoPriority = 'Active' | 'Next' | 'Backlog'

interface AssetStatus {
  logo: boolean
  images: boolean
  copywriting: boolean
  liveUrl: boolean
}

interface ChecklistItem {
  id: string
  label: string
  done: boolean
}

interface DemoSite {
  id: string
  industry: string
  url: string
  status: DemoStatus
  priority: DemoPriority
  description: string
  linked_leads: number
  assets: AssetStatus
  checklist: ChecklistItem[]
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const INITIAL_DEMOS: DemoSite[] = [
  {
    id: 'hvac',
    industry: 'HVAC',
    url: 'https://acorlandohvac.com',
    status: 'Live',
    priority: 'Active',
    description: 'Mobile-first HVAC site. Click-to-call hero, instant quote form, Google Reviews, service area pages.',
    linked_leads: 10,
    assets: { logo: true, images: true, copywriting: true, liveUrl: true },
    checklist: [
      { id: 'h1', label: 'Mobile responsive', done: true },
      { id: 'h2', label: 'Click-to-call hero button', done: true },
      { id: 'h3', label: 'Quote request form', done: true },
      { id: 'h4', label: 'Google Reviews section', done: true },
      { id: 'h5', label: 'Service area pages', done: true },
      { id: 'h6', label: 'SEO title + meta description', done: true },
      { id: 'h7', label: 'Google Business Profile linked', done: true },
      { id: 'h8', label: 'Page speed > 90 (mobile)', done: false },
    ],
  },
  {
    id: 'barber',
    industry: 'Barber',
    url: 'https://lexthebarber.com',
    status: 'Live',
    priority: 'Active',
    description: 'Barbershop site with booking integration, service menu, gallery, and contact.',
    linked_leads: 0,
    assets: { logo: true, images: true, copywriting: true, liveUrl: true },
    checklist: [
      { id: 'b1', label: 'Mobile responsive', done: true },
      { id: 'b2', label: 'Online booking integration', done: true },
      { id: 'b3', label: 'Services + pricing list', done: true },
      { id: 'b4', label: 'Gallery / portfolio section', done: true },
      { id: 'b5', label: 'Click-to-call button', done: true },
      { id: 'b6', label: 'SEO title + meta description', done: true },
      { id: 'b7', label: 'Hours + location map', done: false },
      { id: 'b8', label: 'Reviews section', done: false },
    ],
  },
  {
    id: 'roofing',
    industry: 'Roofing',
    url: '',
    status: 'Planned',
    priority: 'Next',
    description: 'Emergency storm damage CTA, before/after gallery, financing badge, free inspection form.',
    linked_leads: 0,
    assets: { logo: false, images: false, copywriting: false, liveUrl: false },
    checklist: [
      { id: 'r1', label: 'Choose domain / hosting', done: false },
      { id: 'r2', label: 'Source logo or create placeholder', done: false },
      { id: 'r3', label: 'Source before/after images (Unsplash)', done: false },
      { id: 'r4', label: 'Write hero + services copy', done: false },
      { id: 'r5', label: 'Build and deploy site', done: false },
      { id: 'r6', label: 'Mobile + speed test', done: false },
      { id: 'r7', label: 'SEO title + meta description', done: false },
    ],
  },
  {
    id: 'plumbing',
    industry: 'Plumbing',
    url: '',
    status: 'Planned',
    priority: 'Next',
    description: '24/7 emergency plumbing — click-to-call hero, service types, area coverage.',
    linked_leads: 0,
    assets: { logo: false, images: false, copywriting: false, liveUrl: false },
    checklist: [
      { id: 'p1', label: 'Choose domain / hosting', done: false },
      { id: 'p2', label: 'Source logo or create placeholder', done: false },
      { id: 'p3', label: 'Source images (Unsplash)', done: false },
      { id: 'p4', label: 'Write hero + services copy', done: false },
      { id: 'p5', label: 'Build and deploy site', done: false },
      { id: 'p6', label: 'Mobile + speed test', done: false },
      { id: 'p7', label: 'SEO title + meta description', done: false },
    ],
  },
  {
    id: 'landscaping',
    industry: 'Landscaping',
    url: '',
    status: 'Planned',
    priority: 'Backlog',
    description: 'Lawn care — seasonal packages, photo gallery, free estimate form.',
    linked_leads: 0,
    assets: { logo: false, images: false, copywriting: false, liveUrl: false },
    checklist: [
      { id: 'l1', label: 'Choose domain / hosting', done: false },
      { id: 'l2', label: 'Source images', done: false },
      { id: 'l3', label: 'Write copy', done: false },
      { id: 'l4', label: 'Build and deploy', done: false },
      { id: 'l5', label: 'SEO + speed test', done: false },
    ],
  },
  {
    id: 'pressure',
    industry: 'Pressure Washing',
    url: '',
    status: 'Planned',
    priority: 'Backlog',
    description: 'Before/after gallery, instant quote calculator, service area map.',
    linked_leads: 0,
    assets: { logo: false, images: false, copywriting: false, liveUrl: false },
    checklist: [
      { id: 'pw1', label: 'Choose domain / hosting', done: false },
      { id: 'pw2', label: 'Source before/after images', done: false },
      { id: 'pw3', label: 'Write copy', done: false },
      { id: 'pw4', label: 'Build and deploy', done: false },
      { id: 'pw5', label: 'SEO + speed test', done: false },
    ],
  },
  {
    id: 'restaurant',
    industry: 'Restaurant',
    url: '',
    status: 'Planned',
    priority: 'Backlog',
    description: 'Menu, hours, online ordering CTA, Google Maps embed.',
    linked_leads: 0,
    assets: { logo: false, images: false, copywriting: false, liveUrl: false },
    checklist: [
      { id: 're1', label: 'Choose domain', done: false },
      { id: 're2', label: 'Source food photos', done: false },
      { id: 're3', label: 'Write menu + copy', done: false },
      { id: 're4', label: 'Build and deploy', done: false },
      { id: 're5', label: 'SEO + speed test', done: false },
    ],
  },
  {
    id: 'electrician',
    industry: 'Electrician',
    url: '',
    status: 'Planned',
    priority: 'Backlog',
    description: 'Services list, emergency CTA, license badge, quote form.',
    linked_leads: 0,
    assets: { logo: false, images: false, copywriting: false, liveUrl: false },
    checklist: [
      { id: 'e1', label: 'Choose domain', done: false },
      { id: 'e2', label: 'Source images', done: false },
      { id: 'e3', label: 'Write copy', done: false },
      { id: 'e4', label: 'Build and deploy', done: false },
      { id: 'e5', label: 'SEO + speed test', done: false },
    ],
  },
  {
    id: 'cleaning',
    industry: 'Cleaning Company',
    url: '',
    status: 'Planned',
    priority: 'Backlog',
    description: 'Packages, photo gallery, booking form.',
    linked_leads: 0,
    assets: { logo: false, images: false, copywriting: false, liveUrl: false },
    checklist: [
      { id: 'c1', label: 'Choose domain', done: false },
      { id: 'c2', label: 'Source images', done: false },
      { id: 'c3', label: 'Write copy', done: false },
      { id: 'c4', label: 'Build and deploy', done: false },
      { id: 'c5', label: 'SEO + speed test', done: false },
    ],
  },
  {
    id: 'pest',
    industry: 'Pest Control',
    url: '',
    status: 'Planned',
    priority: 'Backlog',
    description: 'Pest types, service area, guarantee badge, quote form.',
    linked_leads: 0,
    assets: { logo: false, images: false, copywriting: false, liveUrl: false },
    checklist: [
      { id: 'pc1', label: 'Choose domain', done: false },
      { id: 'pc2', label: 'Source images', done: false },
      { id: 'pc3', label: 'Write copy', done: false },
      { id: 'pc4', label: 'Build and deploy', done: false },
      { id: 'pc5', label: 'SEO + speed test', done: false },
    ],
  },
  {
    id: 'painting',
    industry: 'Painting',
    url: '',
    status: 'Planned',
    priority: 'Backlog',
    description: 'Interior/exterior, color palette, portfolio, estimate form.',
    linked_leads: 0,
    assets: { logo: false, images: false, copywriting: false, liveUrl: false },
    checklist: [
      { id: 'pa1', label: 'Choose domain', done: false },
      { id: 'pa2', label: 'Source portfolio images', done: false },
      { id: 'pa3', label: 'Write copy', done: false },
      { id: 'pa4', label: 'Build and deploy', done: false },
      { id: 'pa5', label: 'SEO + speed test', done: false },
    ],
  },
  {
    id: 'flooring',
    industry: 'Flooring',
    url: '',
    status: 'Planned',
    priority: 'Backlog',
    description: 'Material types, showroom photos, estimate form, financing.',
    linked_leads: 0,
    assets: { logo: false, images: false, copywriting: false, liveUrl: false },
    checklist: [
      { id: 'f1', label: 'Choose domain', done: false },
      { id: 'f2', label: 'Source images', done: false },
      { id: 'f3', label: 'Write copy', done: false },
      { id: 'f4', label: 'Build and deploy', done: false },
      { id: 'f5', label: 'SEO + speed test', done: false },
    ],
  },
  {
    id: 'tree',
    industry: 'Tree Service',
    url: '',
    status: 'Planned',
    priority: 'Backlog',
    description: 'Emergency removal CTA, before/after gallery, free estimate.',
    linked_leads: 0,
    assets: { logo: false, images: false, copywriting: false, liveUrl: false },
    checklist: [
      { id: 't1', label: 'Choose domain', done: false },
      { id: 't2', label: 'Source images', done: false },
      { id: 't3', label: 'Write copy', done: false },
      { id: 't4', label: 'Build and deploy', done: false },
      { id: 't5', label: 'SEO + speed test', done: false },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function completionPct(demo: DemoSite): number {
  const done = demo.checklist.filter(i => i.done).length
  return demo.checklist.length > 0 ? Math.round((done / demo.checklist.length) * 100) : 0
}

const STATUS_STYLE: Record<DemoStatus, { label: string; dot: string; text: string; border: string }> = {
  Live:     { label: 'Live',     dot: 'bg-emerald-400', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  Building: { label: 'Building', dot: 'bg-amber-400',   text: 'text-amber-400',   border: 'border-amber-500/20'  },
  Planned:  { label: 'Planned',  dot: 'bg-zinc-600',    text: 'text-zinc-500',    border: 'border-zinc-800'      },
}

const PRIORITY_STYLE: Record<DemoPriority, string> = {
  Active:  'text-sky-400 bg-sky-500/10 border-sky-500/20',
  Next:    'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Backlog: 'text-zinc-600 bg-zinc-800 border-zinc-700',
}

type FilterVal = 'All' | 'Live' | 'Building' | 'Planned' | 'Active' | 'Next'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemosPage() {
  const [demos, setDemos]         = useState(INITIAL_DEMOS)
  const [filter, setFilter]       = useState<FilterVal>('All')
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [copied, setCopied]       = useState<string | null>(null)

  function toggleChecklist(demoId: string, itemId: string) {
    setDemos(ds => ds.map(d =>
      d.id === demoId
        ? { ...d, checklist: d.checklist.map(i => i.id === itemId ? { ...i, done: !i.done } : i) }
        : d
    ))
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  const filtered = demos.filter(d => {
    if (filter === 'All')      return true
    if (filter === 'Active')   return d.priority === 'Active'
    if (filter === 'Next')     return d.priority === 'Next'
    return d.status === filter
  })

  const liveCount     = demos.filter(d => d.status === 'Live').length
  const buildingCount = demos.filter(d => d.status === 'Building').length
  const plannedCount  = demos.filter(d => d.status === 'Planned').length

  return (
    <div className="space-y-5">

      <div className="page-header">
        <div>
          <h2 className="page-title">Demo Builder</h2>
          <p className="text-sm text-zinc-600 mt-0.5">Build demos before you pitch. Each demo unlocks a new niche.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Live', value: liveCount, color: 'text-emerald-400' },
          { label: 'Building', value: buildingCount, color: 'text-amber-400' },
          { label: 'Planned', value: plannedCount, color: 'text-zinc-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
            <p className="text-xs text-zinc-500">{label}</p>
            <p className={cn('text-2xl font-bold mt-0.5', color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-zinc-600" />
        {(['All', 'Active', 'Next', 'Live', 'Building', 'Planned'] as FilterVal[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('rounded-lg px-3 py-1.5 text-xs font-medium border transition',
              filter === f
                ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                : 'bg-zinc-800/60 text-zinc-500 hover:text-zinc-300 border-zinc-800')}>
            {f}
          </button>
        ))}
      </div>

      {/* Demo cards */}
      <div className="space-y-3">
        {filtered.map(demo => {
          const pct       = completionPct(demo)
          const ss        = STATUS_STYLE[demo.status]
          const isOpen    = expanded === demo.id
          const assetList = [
            { key: 'logo',        label: 'Logo',         done: demo.assets.logo },
            { key: 'images',      label: 'Images',       done: demo.assets.images },
            { key: 'copywriting', label: 'Copywriting',  done: demo.assets.copywriting },
            { key: 'liveUrl',     label: 'Live URL',     done: demo.assets.liveUrl },
          ]

          return (
            <div key={demo.id}
              className={cn('rounded-xl border bg-zinc-900/60 overflow-hidden transition', ss.border)}>

              {/* Card header */}
              <div className="flex items-center gap-4 px-5 py-4">

                {/* Industry + status */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-zinc-100">{demo.industry}</h3>
                    <span className={cn('inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-semibold', ss.text, ss.border)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', ss.dot)} />{ss.label}
                    </span>
                    <span className={cn('rounded border px-2 py-0.5 text-[10px] font-semibold', PRIORITY_STYLE[demo.priority])}>
                      {demo.priority}
                    </span>
                    {demo.linked_leads > 0 && (
                      <span className="text-[10px] text-zinc-600">{demo.linked_leads} leads</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 mt-1">{demo.description}</p>
                </div>

                {/* Completion ring + % */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="relative">
                    <svg width="40" height="40" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="16" fill="none" stroke="#27272a" strokeWidth="4" />
                      <circle cx="20" cy="20" r="16" fill="none"
                        className={pct === 100 ? 'stroke-emerald-500' : pct > 0 ? 'stroke-sky-500' : 'stroke-zinc-700'}
                        strokeWidth="4"
                        strokeDasharray={`${(pct / 100) * 2 * Math.PI * 16} ${2 * Math.PI * 16}`}
                        strokeDashoffset={2 * Math.PI * 16 * 0.25}
                        strokeLinecap="round" />
                    </svg>
                    <span className={cn('absolute inset-0 flex items-center justify-center text-[10px] font-bold',
                      pct === 100 ? 'text-emerald-400' : pct > 0 ? 'text-sky-400' : 'text-zinc-600')}>{pct}%</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {demo.status === 'Live' && demo.url && (
                    <>
                      <a href={demo.url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition">
                        <ExternalLink className="h-3.5 w-3.5" /> Open
                      </a>
                      <button onClick={() => copy(demo.url, `url-${demo.id}`)}
                        className={cn('flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition',
                          copied === `url-${demo.id}`
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-zinc-200')}>
                        <Copy className="h-3.5 w-3.5" />
                        {copied === `url-${demo.id}` ? 'Copied!' : 'Copy URL'}
                      </button>
                    </>
                  )}
                  <button onClick={() => setExpanded(isOpen ? null : demo.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition">
                    {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {isOpen ? 'Hide' : 'Build'}
                  </button>
                </div>
              </div>

              {/* Expanded: assets + checklist */}
              {isOpen && (
                <div className="border-t border-zinc-800 px-5 py-4 space-y-5 bg-zinc-950/40">

                  {/* Assets needed */}
                  <div>
                    <p className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Assets Needed</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {assetList.map(asset => (
                        <div key={asset.key}
                          className={cn('flex items-center gap-2 rounded-lg border px-3 py-2.5',
                            asset.done ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-900/60')}>
                          {asset.done
                            ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                            : <Circle       className="h-4 w-4 text-zinc-600 shrink-0" />}
                          <span className={cn('text-xs font-medium', asset.done ? 'text-emerald-400' : 'text-zinc-500')}>
                            {asset.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Build Checklist</p>
                      <span className="text-xs text-zinc-500">{demo.checklist.filter(i => i.done).length}/{demo.checklist.length} complete</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-800 mb-3">
                      <div className={cn('h-1.5 rounded-full transition-all', pct === 100 ? 'bg-emerald-500' : 'bg-sky-500')}
                        style={{ width: `${pct}%` }} />
                    </div>

                    {/* Checklist items */}
                    <div className="space-y-1.5">
                      {demo.checklist.map(item => (
                        <button key={item.id}
                          onClick={() => toggleChecklist(demo.id, item.id)}
                          className="flex items-center gap-3 w-full rounded-lg hover:bg-zinc-800/40 px-2 py-2 transition text-left group">
                          {item.done
                            ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                            : <Circle       className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 shrink-0 transition" />}
                          <span className={cn('text-sm', item.done ? 'line-through text-zinc-600' : 'text-zinc-300')}>
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live URL field */}
                  {demo.status !== 'Live' && (
                    <div>
                      <p className="text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Live URL</p>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-zinc-600 shrink-0" />
                        <p className="text-xs text-zinc-600 italic">Not deployed yet. Deploy to Vercel → paste URL here.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Build rule */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4 pb-6">
        <p className="text-xs font-semibold text-zinc-400 mb-1">Build Order Rule</p>
        <p className="text-xs text-zinc-600 leading-relaxed">
          Only build the next demo when you have 5+ leads in that niche. HVAC and Barber are live —
          pitch those first. Roofing and Plumbing are next when you have those leads.
        </p>
      </div>
    </div>
  )
}
