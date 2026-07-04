'use client'

import { useState, useRef, useMemo } from 'react'
import Link from 'next/link'
import {
  Search, PenLine, FileSpreadsheet, MapPin, Star, Database,
  ExternalLink, Copy, CheckCircle2, Globe, Phone, AlertTriangle,
  ChevronRight, Download, Upload, ArrowRight, Zap, Info,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import {
  DiscoveredBusiness, LeadCategory, CATEGORY_CONFIG,
  PROVIDERS, manualProvider, csvProvider,
  buildGoogleMapsSearchURL, toCRMPayload, CSV_TEMPLATE,
  CSV_TEMPLATE_DESCRIPTION, SearchQuery,
} from '@/lib/discovery'

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  PenLine, FileSpreadsheet, MapPin, Star, Database, Search,
}

// ─── Provider status config ───────────────────────────────────────────────────

const STATUS_STYLE = {
  ready:       { label: 'Ready',        color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  connected:   { label: 'Connected',    color: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/20'     },
  needs_key:   { label: 'Needs API Key',color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   },
  coming_soon: { label: 'Coming Soon',  color: 'text-zinc-500',    bg: 'bg-zinc-800',        border: 'border-zinc-700'       },
}

// ─── Industries ───────────────────────────────────────────────────────────────

const INDUSTRIES = [
  'HVAC', 'Plumbing', 'Roofing', 'Electrician', 'Landscaping',
  'Pressure Washing', 'Barber', 'Cleaning Company', 'Pest Control',
  'Painting', 'Flooring', 'Restaurant', 'Automotive', 'Tree Service',
]

const FL_CITIES = [
  'Tampa', 'Orlando', 'Miami', 'Jacksonville', 'Sarasota',
  'Fort Lauderdale', 'St. Petersburg', 'Hialeah', 'Tallahassee',
  'Fort Myers', 'Cape Coral', 'Gainesville', 'Ocala', 'Lakeland',
  'Port St. Lucie', 'West Palm Beach', 'Clearwater', 'Pensacola',
]

// ─── Manual entry form defaults ───────────────────────────────────────────────

const MANUAL_DEFAULTS = {
  business_name: '',
  industry:      'HVAC',
  city:          '',
  state:         'FL',
  phone:         '',
  address:       '',
  zip:           '',
  website:       '',
  has_website:   'unknown' as 'yes' | 'no' | 'unknown',
  google_rating: '',
  review_count:  '',
}

// ─── Lead result card ──────────────────────────────────────────────────────────

function LeadCard({
  lead,
  onImport,
  imported,
}: {
  lead: DiscoveredBusiness
  onImport: (lead: DiscoveredBusiness) => void
  imported: boolean
}) {
  const [copied, setCopied] = useState<string | null>(null)
  const cfg = CATEGORY_CONFIG[lead.category]

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className={cn('rounded-xl border bg-zinc-900/60 overflow-hidden transition',
      lead.category === 'NO_WEBSITE' ? 'border-red-500/30' :
      lead.category === 'BROKEN_WEBSITE' ? 'border-orange-500/20' :
      lead.category === 'OUTDATED_WEBSITE' ? 'border-amber-500/20' : 'border-zinc-800')}>

      <div className="flex items-start gap-4 px-5 py-4">

        {/* Priority score ring */}
        <div className="shrink-0 mt-0.5">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold text-sm',
            lead.priority_score >= 85 ? 'border-red-500/60 text-red-400' :
            lead.priority_score >= 65 ? 'border-amber-500/60 text-amber-400' :
            lead.priority_score >= 30 ? 'border-sky-500/40 text-sky-400' :
            'border-zinc-700 text-zinc-600')}>
            {lead.priority_score}
          </div>
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-bold text-zinc-100">{lead.business_name}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {lead.city}, {lead.state}
                {lead.address ? ` · ${lead.address}` : ''}
              </p>
            </div>
            {/* Category badge */}
            <span className={cn('inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-bold shrink-0', cfg.color, cfg.bg, cfg.border)}>
              {cfg.stars} {cfg.label}
            </span>
          </div>

          {/* Details row */}
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-sky-400 transition">
                <Phone className="h-3 w-3" /> {lead.phone}
              </a>
            )}
            {lead.website ? (
              <a href={lead.website} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-sky-400 transition max-w-[200px] truncate">
                <Globe className="h-3 w-3 shrink-0" />
                <span className="truncate">{lead.website.replace(/^https?:\/\//, '')}</span>
                <ExternalLink className="h-2.5 w-2.5 shrink-0" />
              </a>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
                <AlertTriangle className="h-3 w-3" /> No website
              </span>
            )}
            {lead.google_rating && (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                {lead.google_rating} ({lead.review_count ?? 0} reviews)
              </span>
            )}
          </div>

          {/* Offer + action */}
          <div className="mt-2 space-y-1">
            <p className="text-xs text-zinc-500">
              <span className="text-zinc-400 font-medium">Offer: </span>{lead.recommended_offer}
            </p>
            <p className="text-xs text-zinc-600">
              <span className="text-zinc-500 font-medium">Action: </span>{lead.suggested_action}
            </p>
          </div>

          {/* Demo recommendation */}
          {lead.recommended_demo && (
            <div className="flex items-center gap-2 mt-2">
              <Globe className="h-3 w-3 text-emerald-400 shrink-0" />
              <span className="text-xs text-zinc-600">Demo: </span>
              <a href={lead.recommended_demo} target="_blank" rel="noreferrer"
                className="text-xs text-emerald-400 hover:underline truncate">
                {lead.recommended_demo.replace('https://', '')}
              </a>
              <button onClick={() => copy(lead.recommended_demo, `demo-${lead.id}`)}
                className={cn('shrink-0 transition', copied === `demo-${lead.id}` ? 'text-emerald-400' : 'text-zinc-700 hover:text-zinc-400')}>
                <Copy className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 shrink-0">
          {imported ? (
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs font-medium text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Imported
            </div>
          ) : (
            <button onClick={() => onImport(lead)}
              className="flex items-center gap-1.5 rounded-lg bg-sky-500/20 border border-sky-500/30 px-3 py-2 text-xs font-semibold text-sky-400 hover:bg-sky-500/30 transition">
              <Zap className="h-3.5 w-3.5" /> Import to CRM
            </button>
          )}
          {lead.website && (
            <Link href="/audit"
              className="flex items-center gap-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition">
              <Search className="h-3.5 w-3.5" /> Run Audit
            </Link>
          )}
          {lead.phone && (
            <a href={`tel:${lead.phone}`}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-sky-400 transition">
              <Phone className="h-3.5 w-3.5" /> Call
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'search' | 'manual' | 'csv'

export default function DiscoverPage() {
  const [activeTab, setActiveTab]     = useState<Tab>('search')
  const [results, setResults]         = useState<DiscoveredBusiness[]>([])
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set())
  const [importing, setImporting]     = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Search tab state ──
  const [searchQuery, setSearchQuery] = useState<Partial<SearchQuery>>({
    industry: 'HVAC', city: 'Tampa', radius: 10,
  })
  const mapsURL = buildGoogleMapsSearchURL({
    industry: searchQuery.industry ?? 'HVAC',
    city:     searchQuery.city,
    zip:      searchQuery.zip,
  })

  // ── Manual entry state ──
  const [form, setForm]           = useState(MANUAL_DEFAULTS)
  const [formErrors, setFormErrors] = useState<string[]>([])

  // ── CSV state ──
  const [csvText, setCsvText]       = useState('')
  const [csvPreview, setCsvPreview] = useState<DiscoveredBusiness[]>([])
  const [csvError, setCsvError]     = useState('')
  const [csvIndustry, setCsvIndustry] = useState('HVAC')

  // ── Filter state ──
  const [filterCat, setFilterCat] = useState<LeadCategory | 'ALL'>('ALL')

  // ── Filtered results ──
  const filtered = useMemo(() => {
    if (filterCat === 'ALL') return results
    return results.filter(r => r.category === filterCat)
  }, [results, filterCat])

  // ── Counts ──
  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of results) counts[r.category] = (counts[r.category] ?? 0) + 1
    return counts
  }, [results])

  // ── Import to CRM ──
  function importLead(lead: DiscoveredBusiness) {
    setImporting(lead.id)
    // In production: write to Supabase. Today: track locally.
    setTimeout(() => {
      setImportedIds(prev => new Set([...prev, lead.id]))
      setImporting(null)
    }, 600)
    // Log what would be imported
    console.log('[CRM Import]', toCRMPayload(lead))
  }

  function importAll() {
    const unimported = filtered.filter(l => !importedIds.has(l.id))
    for (const lead of unimported) importLead(lead)
  }

  // ── Manual submit ──
  function submitManual() {
    const errors: string[] = []
    if (!form.business_name.trim()) errors.push('Business name is required.')
    if (!form.city.trim()) errors.push('City is required.')
    if (errors.length) { setFormErrors(errors); return }
    setFormErrors([])

    const website = form.has_website === 'no' ? undefined :
                    form.has_website === 'yes' ? form.website || undefined :
                    form.website || undefined

    const lead = manualProvider.score({
      business_name:  form.business_name.trim(),
      industry:       form.industry,
      city:           form.city.trim(),
      state:          form.state,
      phone:          form.phone || undefined,
      address:        form.address || undefined,
      zip:            form.zip || undefined,
      website,
      google_rating:  form.google_rating ? parseFloat(form.google_rating) : undefined,
      review_count:   form.review_count ? parseInt(form.review_count) : undefined,
    })

    setResults(prev => [lead, ...prev])
    setActiveTab('search')   // show in results
    setForm(MANUAL_DEFAULTS) // reset form
  }

  // ── CSV parse ──
  function parseCSV(text: string) {
    setCsvError('')
    if (!text.trim()) { setCsvPreview([]); return }
    try {
      const leads = csvProvider.parse(text, csvIndustry)
      if (leads.length === 0) {
        setCsvError('No rows found. Check that your CSV has a header row and data rows.')
        setCsvPreview([])
      } else {
        setCsvPreview(leads)
        setCsvError('')
      }
    } catch (e) {
      setCsvError('Could not parse CSV. Check the format and try again.')
      setCsvPreview([])
    }
  }

  function importCSV() {
    if (!csvPreview.length) return
    setResults(prev => [...csvPreview, ...prev.filter(r => !csvPreview.find(c => c.id === r.id))])
    setCsvPreview([])
    setCsvText('')
    setActiveTab('search')
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      setCsvText(text)
      parseCSV(text)
    }
    reader.readAsText(file)
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'gr-scale-lead-import-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const TABS: { id: Tab; label: string; icon: React.ElementType; sub: string }[] = [
    { id: 'search', label: 'Search & Results', icon: Search,         sub: `${results.length} leads found` },
    { id: 'manual', label: 'Manual Entry',      icon: PenLine,        sub: 'Add one business'              },
    { id: 'csv',    label: 'CSV Import',         icon: FileSpreadsheet,sub: 'Bulk import'                  },
  ]

  return (
    <div className="space-y-5 max-w-5xl">

      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Lead Discovery</h2>
          <p className="text-sm text-zinc-600 mt-0.5">Find real businesses. Score them instantly. Import the best ones.</p>
        </div>
        {results.length > 0 && (
          <button onClick={importAll}
            className="btn-primary text-xs">
            <Zap className="h-3.5 w-3.5" />
            Import All ({results.filter(l => !importedIds.has(l.id)).length})
          </button>
        )}
      </div>

      {/* Provider status bar */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-4">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Lead Providers</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {PROVIDERS.map(provider => {
            const Icon  = ICON_MAP[provider.icon] ?? Search
            const style = STATUS_STYLE[provider.status]
            return (
              <div key={provider.id}
                className={cn('flex items-center gap-3 rounded-lg border px-3 py-2.5', style.border, style.bg)}>
                <Icon className={cn('h-4 w-4 shrink-0', style.color)} />
                <div className="flex-1 min-w-0">
                  <p className={cn('text-xs font-semibold leading-tight', style.color)}>{provider.name}</p>
                  <p className="text-[10px] text-zinc-600 truncate">{style.label}</p>
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-[10px] text-zinc-700 mt-3">
          Manual Entry and CSV Import are ready today. Connect Google Maps by adding
          <code className="bg-zinc-800 px-1 rounded ml-1 text-zinc-500">NEXT_PUBLIC_GOOGLE_MAPS_KEY</code> to
          <code className="bg-zinc-800 px-1 rounded ml-1 text-zinc-500">.env.local</code>.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-zinc-800">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn('flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition',
                activeTab === tab.id
                  ? 'text-sky-400 border-sky-500'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300')}>
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.id === 'search' && results.length > 0 && (
                <span className="rounded-full bg-sky-500/20 text-sky-400 px-1.5 py-0.5 text-[10px] font-bold">{results.length}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── TAB: Search & Results ───────────────────────────────────────────── */}
      {activeTab === 'search' && (
        <div className="space-y-4">

          {/* Search form */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-4">
            <p className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Search Parameters</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] text-zinc-600 mb-1">Industry</label>
                <select className="input-base text-sm w-full"
                  value={searchQuery.industry ?? ''}
                  onChange={e => setSearchQuery(q => ({ ...q, industry: e.target.value }))}>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-zinc-600 mb-1">City</label>
                <select className="input-base text-sm w-full"
                  value={searchQuery.city ?? ''}
                  onChange={e => setSearchQuery(q => ({ ...q, city: e.target.value, zip: '' }))}>
                  <option value="">Select city...</option>
                  {FL_CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-zinc-600 mb-1">ZIP Code</label>
                <input className="input-base text-sm w-full" placeholder="e.g. 33618"
                  value={searchQuery.zip ?? ''}
                  onChange={e => setSearchQuery(q => ({ ...q, zip: e.target.value, city: '' }))} />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-600 mb-1">Radius (miles)</label>
                <select className="input-base text-sm w-full"
                  value={searchQuery.radius ?? 10}
                  onChange={e => setSearchQuery(q => ({ ...q, radius: parseInt(e.target.value) }))}>
                  {[5, 10, 15, 25, 50].map(r => <option key={r} value={r}>{r} miles</option>)}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <a href={mapsURL} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 rounded-lg bg-amber-500/20 border border-amber-500/30 px-4 py-2.5 text-sm font-semibold text-amber-400 hover:bg-amber-500/30 transition">
                <MapPin className="h-4 w-4" />
                Search on Google Maps
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <Info className="h-3.5 w-3.5 shrink-0" />
                Opens Google Maps. Find businesses, note which have no website, enter them in Manual Entry.
              </div>
            </div>

            {/* Coming soon note */}
            <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/40 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-3.5 w-3.5 text-sky-400" />
                <span className="text-xs font-semibold text-sky-400">Automated Search — Coming When Google Maps Key is Added</span>
              </div>
              <p className="text-[10px] text-zinc-600 leading-relaxed">
                Add <code className="bg-zinc-800 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_KEY</code> to .env.local
                and the Search button will return real businesses automatically.
                Until then: use Google Maps above → Manual Entry below → or upload a CSV.
              </p>
            </div>
          </div>

          {/* Results */}
          {results.length > 0 ? (
            <div className="space-y-3">
              {/* Result summary + filter */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-zinc-400 font-medium">{results.length} leads discovered</span>
                <span className="text-zinc-700">·</span>
                <div className="flex gap-1.5 flex-wrap">
                  {(['ALL', 'NO_WEBSITE', 'BROKEN_WEBSITE', 'OUTDATED_WEBSITE', 'MODERN_WEBSITE'] as const).map(cat => {
                    const count = cat === 'ALL' ? results.length : (catCounts[cat] ?? 0)
                    if (cat !== 'ALL' && count === 0) return null
                    const cfg = cat === 'ALL' ? null : CATEGORY_CONFIG[cat]
                    return (
                      <button key={cat} onClick={() => setFilterCat(cat)}
                        className={cn('rounded-lg border px-2.5 py-1 text-xs font-medium transition',
                          filterCat === cat
                            ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                            : 'bg-zinc-800/60 text-zinc-500 hover:text-zinc-300 border-zinc-800')}>
                        {cat === 'ALL' ? `All (${count})` : `${cfg?.stars} ${cfg?.label} (${count})`}
                      </button>
                    )
                  })}
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="text-xs text-zinc-600">{importedIds.size} imported</span>
                </div>
              </div>

              {/* Lead cards */}
              {filtered.map(lead => (
                <LeadCard key={lead.id} lead={lead}
                  onImport={importLead}
                  imported={importedIds.has(lead.id)} />
              ))}
            </div>
          ) : (
            <div className="py-14 text-center">
              <Search className="h-10 w-10 text-zinc-700 mx-auto mb-4" />
              <p className="text-sm font-medium text-zinc-400">No leads yet.</p>
              <p className="text-xs text-zinc-600 mt-1 mb-5">Add leads via Manual Entry, CSV Import, or search Google Maps above.</p>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => setActiveTab('manual')}
                  className="flex items-center gap-1.5 rounded-lg bg-sky-500/20 border border-sky-500/30 px-4 py-2 text-xs font-semibold text-sky-400 hover:bg-sky-500/30 transition">
                  <PenLine className="h-3.5 w-3.5" /> Manual Entry
                </button>
                <button onClick={() => setActiveTab('csv')}
                  className="flex items-center gap-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition">
                  <FileSpreadsheet className="h-3.5 w-3.5" /> CSV Import
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Manual Entry ────────────────────────────────────────────────── */}
      {activeTab === 'manual' && (
        <div className="space-y-4 max-w-2xl">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-5 space-y-4">
            <p className="text-xs text-zinc-600 leading-relaxed">
              Found a business on Google Maps? Enter it here and the scoring engine classifies it instantly.
              The fastest workflow: open Google Maps, search your industry + city, enter leads one by one.
            </p>

            {/* Form */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-zinc-400 mb-1">Business Name <span className="text-red-400">*</span></label>
                <input className="input-base w-full" placeholder="e.g. Premier Climate Control"
                  value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Industry <span className="text-red-400">*</span></label>
                <select className="input-base w-full"
                  value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">City <span className="text-red-400">*</span></label>
                <input className="input-base w-full" placeholder="e.g. Tampa"
                  value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Phone</label>
                <input className="input-base w-full" placeholder="(813) 555-0000"
                  value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Google Rating</label>
                <input className="input-base w-full" placeholder="4.3" type="number" min="1" max="5" step="0.1"
                  value={form.google_rating} onChange={e => setForm(f => ({ ...f, google_rating: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Review Count</label>
                <input className="input-base w-full" placeholder="87" type="number" min="0"
                  value={form.review_count} onChange={e => setForm(f => ({ ...f, review_count: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Address</label>
                <input className="input-base w-full" placeholder="123 Main St"
                  value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>

              {/* Website question — the critical one */}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-zinc-400 mb-2">Does this business have a website?</label>
                <div className="flex gap-2">
                  {(['yes', 'no', 'unknown'] as const).map(v => (
                    <button key={v} onClick={() => setForm(f => ({ ...f, has_website: v }))}
                      className={cn('rounded-lg border px-4 py-2 text-xs font-semibold capitalize transition',
                        form.has_website === v
                          ? v === 'no' ? 'bg-red-500/20 border-red-500/30 text-red-400'
                            : v === 'yes' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-sky-500/20 border-sky-500/30 text-sky-400'
                          : 'bg-zinc-800/60 border-zinc-700 text-zinc-500 hover:text-zinc-300')}>
                      {v === 'yes' ? '✓ Yes' : v === 'no' ? '✕ No Website' : '? Unknown'}
                    </button>
                  ))}
                </div>
                {form.has_website === 'no' && (
                  <p className="text-xs text-red-400 mt-2 font-medium">
                    Will be classified as NO WEBSITE — priority 100. Highest value lead.
                  </p>
                )}
              </div>

              {/* Website URL — only show if they have one */}
              {(form.has_website === 'yes' || form.has_website === 'unknown') && (
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Website URL</label>
                  <input className="input-base w-full" placeholder="https://example.com"
                    value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
                  <p className="text-[10px] text-zinc-600 mt-1">Leave blank if you don&apos;t know the URL yet.</p>
                </div>
              )}
            </div>

            {/* Errors */}
            {formErrors.length > 0 && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                {formErrors.map((e, i) => <p key={i} className="text-xs text-red-400">{e}</p>)}
              </div>
            )}

            {/* Submit */}
            <div className="flex items-center gap-3">
              <button onClick={submitManual} className="btn-primary text-sm">
                <Zap className="h-4 w-4" /> Score & Add to Results
              </button>
              <button onClick={() => setForm(MANUAL_DEFAULTS)}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition">
                Clear form
              </button>
            </div>
          </div>

          {/* Tip */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4">
            <p className="text-xs font-semibold text-zinc-400 mb-1">Fastest Workflow Without an API Key</p>
            <ol className="text-xs text-zinc-600 space-y-1 leading-relaxed list-decimal list-inside">
              <li>Open the Search tab → click &quot;Search on Google Maps&quot;</li>
              <li>Scroll through results — note any business with no website link</li>
              <li>Enter each one here with &quot;No Website&quot; selected</li>
              <li>Switch to Search tab → filter by NO WEBSITE → import them all</li>
              <li>Call the first one with your demo ready</li>
            </ol>
          </div>
        </div>
      )}

      {/* ── TAB: CSV Import ──────────────────────────────────────────────────── */}
      {activeTab === 'csv' && (
        <div className="space-y-4 max-w-3xl">

          {/* Instructions */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Import a CSV</p>
              <button onClick={downloadTemplate}
                className="flex items-center gap-1.5 text-xs text-sky-400 hover:underline">
                <Download className="h-3.5 w-3.5" /> Download Template
              </button>
            </div>
            <pre className="text-[10px] text-zinc-600 bg-zinc-950/60 rounded-lg p-3 overflow-x-auto leading-relaxed">
              {CSV_TEMPLATE_DESCRIPTION}
            </pre>

            {/* Industry for rows with no industry column */}
            <div className="flex items-center gap-3">
              <label className="text-xs text-zinc-400 shrink-0">Default Industry:</label>
              <select className="input-base text-sm"
                value={csvIndustry} onChange={e => { setCsvIndustry(e.target.value); parseCSV(csvText) }}>
                {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
          </div>

          {/* Upload area */}
          <div className="rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900/40 px-5 py-8 text-center">
            <Upload className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-400 mb-1">Drop a CSV file here or</p>
            <button onClick={() => fileRef.current?.click()}
              className="text-sm text-sky-400 hover:underline font-medium">
              browse to upload
            </button>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
          </div>

          {/* Or paste */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">Or paste CSV text:</label>
            <textarea
              className="input-base w-full font-mono text-xs"
              rows={6}
              placeholder={`Business Name,Phone,Website,Rating,Reviews,Industry\nCool Coast H&C,(941) 623-4518,https://coolcoast.net,4.2,87,HVAC\nBreeze Masters AC,(305) 555-0404,,4.5,120,HVAC`}
              value={csvText}
              onChange={e => { setCsvText(e.target.value); parseCSV(e.target.value) }}
            />
          </div>

          {/* Error */}
          {csvError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
              <p className="text-xs text-red-400">{csvError}</p>
            </div>
          )}

          {/* Preview */}
          {csvPreview.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-300">{csvPreview.length} businesses parsed</p>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="text-red-400">{csvPreview.filter(l => l.category === 'NO_WEBSITE').length} no website</span>
                  <span>·</span>
                  <span className="text-amber-400">{csvPreview.filter(l => l.category === 'OUTDATED_WEBSITE').length} outdated</span>
                </div>
              </div>

              {/* Quick preview table */}
              <div className="rounded-xl border border-zinc-800 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/80">
                      <th className="px-4 py-2 text-left text-zinc-500 font-medium">Business</th>
                      <th className="px-4 py-2 text-left text-zinc-500 font-medium">Category</th>
                      <th className="px-4 py-2 text-center text-zinc-500 font-medium">Priority</th>
                      <th className="px-4 py-2 text-left text-zinc-500 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {csvPreview.slice(0, 10).map(lead => {
                      const cfg = CATEGORY_CONFIG[lead.category]
                      return (
                        <tr key={lead.id} className="bg-zinc-900/40">
                          <td className="px-4 py-2.5">
                            <p className="font-medium text-zinc-200">{lead.business_name}</p>
                            <p className="text-zinc-600 text-[10px]">{lead.city}, FL</p>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={cn('text-[10px] font-bold', cfg.color)}>{cfg.stars} {cfg.label}</span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={cn('font-bold', lead.priority_score >= 80 ? 'text-red-400' : lead.priority_score >= 60 ? 'text-amber-400' : 'text-zinc-400')}>
                              {lead.priority_score}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-zinc-600 text-[10px]">{lead.suggested_action.slice(0, 50)}…</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {csvPreview.length > 10 && (
                  <div className="px-4 py-2.5 text-xs text-zinc-600 border-t border-zinc-800">
                    + {csvPreview.length - 10} more rows
                  </div>
                )}
              </div>

              <button onClick={importCSV}
                className="btn-primary">
                <ArrowRight className="h-4 w-4" />
                Import {csvPreview.length} Leads to Results
              </button>
            </div>
          )}

          {/* Where to get CSVs */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4 pb-6">
            <p className="text-xs font-semibold text-zinc-400 mb-2">Where to Get Business CSVs</p>
            <div className="space-y-2 text-xs text-zinc-600 leading-relaxed">
              <p><span className="text-zinc-400 font-medium">Outscraper.com</span> — Scrapes Google Maps. ~$0.002/result. Export as CSV. Best option.</p>
              <p><span className="text-zinc-400 font-medium">PhantomBuster</span> — Google Maps scraper automation. Trial available.</p>
              <p><span className="text-zinc-400 font-medium">Google Maps manually</span> — Search → right-click each result → note in a spreadsheet → export as CSV.</p>
              <p><span className="text-zinc-400 font-medium">Local business directories</span> — Yelp, Angi, HomeAdvisor often allow CSV export.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
