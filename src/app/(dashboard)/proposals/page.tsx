'use client'

/**
 * Proposals — Phases 3 + 4
 *
 * Builder tab: pick a lead → package engine recommends Starter/Growth/Scale
 * with reasons (Phase 3) → generate a client-ready proposal (Phase 4) →
 * save as Draft/Sent (persisted) → copy to clipboard for text/email.
 *
 * Packages come from src/lib/packages.ts — the single source of truth.
 */

import { useMemo, useState } from 'react'
import { FileText, Plus, Copy, Sparkles, Check } from 'lucide-react'
import { cn, formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { PACKAGES, PACKAGE_LIST, recommendPackage, generateProposal, type PackageId } from '@/lib/packages'
import { useOS, type OSProposal } from '@/lib/store'

const OUTREACH_TEMPLATES = [
  { name: 'Cold Email', subject: 'Wrong phone number on [Business Name]\'s website', body: `Hey [First Name],\n\nI was checking out [Business Name] online and noticed your site [SPECIFIC FLAW — one sentence].\n\nThat's likely costing you calls — most homeowners pick whichever AC company they can tap-to-call in 5 seconds.\n\nI build fast, mobile-first websites for Florida HVAC companies. Here's one I built: meloair-v2.vercel.app\n\nWant me to send a free 1-minute video audit of your site? No strings.\n\n— Gio, GR Scale\n[phone]` },
  { name: 'Cold Call Script', subject: 'Phone script — Tier A leads', body: `"Hey, is this the owner of [Business Name]? ... My name's Gio — I'll be 20 seconds, I promise.\nI build websites for HVAC companies here in Florida, and I was on your site yesterday — did you know it still shows [SPECIFIC FLAW]?\nThat means people trying to call you are hitting a dead number. I made a quick 1-minute video showing exactly what's wrong and how I'd fix it — can I text it to you?"` },
  { name: 'Follow-Up Day 1', subject: 'Text after call', body: `Hey [Name] — did my video come through okay?\nHere's the link again: [LOOM LINK]\nAnd the example site: meloair-v2.vercel.app\n— Gio` },
  { name: 'Follow-Up Day 3', subject: 'Value touch', body: `Hey [Name] — quick update on [Business Name]: also noticed your Google listing is missing service photos (only 2 listed). That's costing you clicks too. Easy fix — I can handle it same week as the site. Worth a 10-min call?` },
  { name: 'Closing Text', subject: 'Close', body: `Hey [Name] — ready to get [Business Name]'s site live? $[SETUP] to build (half now, half at launch), then $[MONTHLY]/mo covers hosting, updates, and keeping it working for you. I can send the payment link in 2 minutes. Want to go?` },
  { name: 'Age Objection', subject: 'Objection handler', body: `"16. I built meloair-v2.vercel.app — open it on your phone right now and judge the work, not the age. You're not paying for my age, you're paying for a site that makes your phone ring."` },
]

export default function ProposalsPage() {
  const { data, ready, addProposal } = useOS()
  const [tab, setTab] = useState<'builder' | 'proposals' | 'packages' | 'templates'>('builder')
  const [copied, setCopied] = useState<string | null>(null)

  // Builder state
  const [leadId, setLeadId] = useState<string>('')
  const [pkgOverride, setPkgOverride] = useState<PackageId | null>(null)
  const [setupFee, setSetupFee] = useState<number | null>(null)
  const [generated, setGenerated] = useState<string>('')

  const lead = data.leads.find(l => l.id === leadId) ?? null

  const recommendation = useMemo(() => {
    if (!lead) return null
    return recommendPackage({
      hasWebsite: !!lead.website,
      websiteScore: lead.website_score,
      opportunityScore: lead.opportunity_score,
      city: lead.city,
      industry: lead.industry,
    })
  }, [lead])

  const chosenPkg: PackageId | null = pkgOverride ?? recommendation?.id ?? null
  const effectiveSetup = setupFee ?? (chosenPkg ? PACKAGES[chosenPkg].defaultSetupFee : 0)

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  function handleGenerate() {
    if (!lead || !chosenPkg) return
    const body = generateProposal({
      businessName: lead.business_name,
      city: lead.city,
      industry: lead.industry,
      packageId: chosenPkg,
      setupFee: effectiveSetup,
      specificWeakness: lead.notes ? lead.notes.split('.')[0].toLowerCase() + '.' : undefined,
      demoUrl: 'https://meloair-v2.vercel.app',
    })
    setGenerated(body)
  }

  function handleSave(status: 'Draft' | 'Sent') {
    if (!lead || !chosenPkg || !generated) return
    const proposal: OSProposal = {
      id: `p-${lead.id}-${Date.now()}`,
      lead_id: lead.id,
      business_name: lead.business_name,
      package: chosenPkg,
      monthly: PACKAGES[chosenPkg].monthly,
      setup_fee: effectiveSetup,
      status,
      created_at: new Date().toISOString(),
      body: generated,
    }
    addProposal(proposal)
    setTab('proposals')
    setGenerated('')
    setLeadId('')
    setPkgOverride(null)
    setSetupFee(null)
  }

  if (!ready) return <div className="text-sm text-zinc-600 p-4">Loading…</div>

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="page-header">
        <h2 className="page-title">Proposals</h2>
        <button className="btn-primary" onClick={() => setTab('builder')}><Plus className="h-4 w-4" /> New Proposal</button>
      </div>

      <div className="border-b border-zinc-800">
        <div className="flex gap-0">
          {(['builder', 'proposals', 'packages', 'templates'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px capitalize',
                tab === t ? 'border-sky-500 text-sky-400' : 'border-transparent text-zinc-500 hover:text-zinc-300')}>
              {t === 'templates' ? 'Outreach Scripts' : t === 'builder' ? 'Proposal Builder' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ─── BUILDER (Phases 3+4) ─────────────────────────────────────────── */}
      {tab === 'builder' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            {/* Step 1: lead */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
              <p className="text-xs font-black tracking-widest text-zinc-600 uppercase">1 · Pick the lead</p>
              <select className="input-base w-full" value={leadId} onChange={e => { setLeadId(e.target.value); setPkgOverride(null); setSetupFee(null); setGenerated('') }}>
                <option value="">Select a lead…</option>
                {data.leads.filter(l => !['Won', 'Lost'].includes(l.status)).map(l => (
                  <option key={l.id} value={l.id}>{l.business_name} — {l.city}</option>
                ))}
              </select>
              {lead && <p className="text-xs text-zinc-500 leading-relaxed">{lead.notes}</p>}
            </div>

            {/* Step 2: engine recommendation */}
            {recommendation && lead && (
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black tracking-widest text-violet-400 uppercase flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> 2 · Recommended package
                  </p>
                  <span className="text-[10px] text-zinc-500">Confidence: {recommendation.confidence}</span>
                </div>
                <div>
                  <p className="text-lg font-black text-zinc-100">
                    {recommendation.pkg.name} <span className="text-violet-400">{recommendation.pkg.monthlyLabel}</span>
                  </p>
                  <p className="text-xs text-zinc-500">{recommendation.pkg.tagline}</p>
                </div>
                <ul className="space-y-1.5">
                  {recommendation.reasons.map((r, i) => (
                    <li key={i} className="text-xs text-zinc-400 leading-relaxed flex gap-2">
                      <span className="text-violet-400 shrink-0">→</span> {r}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2 pt-1">
                  {PACKAGE_LIST.map(p => (
                    <button key={p.id}
                      onClick={() => setPkgOverride(p.id)}
                      className={cn('flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition',
                        chosenPkg === p.id
                          ? 'border-violet-500/50 bg-violet-500/20 text-violet-300'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:text-zinc-300')}>
                      {p.name}<br /><span className="font-normal">{p.monthlyLabel}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: setup fee + generate */}
            {lead && chosenPkg && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
                <p className="text-xs font-black tracking-widest text-zinc-600 uppercase">3 · One-time build fee</p>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500 text-sm">$</span>
                  <input type="number" className="input-base w-32" value={effectiveSetup}
                    onChange={e => setSetupFee(Number(e.target.value))} />
                  <span className="text-xs text-zinc-600">then {PACKAGES[chosenPkg].monthlyLabel}</span>
                </div>
                <button className="btn-primary w-full justify-center" onClick={handleGenerate}>
                  <FileText className="h-4 w-4" /> Generate Proposal
                </button>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black tracking-widest text-zinc-600 uppercase">Client-ready proposal</p>
              {generated && (
                <button onClick={() => copy(generated, 'gen')} className={cn('btn-ghost text-xs', copied === 'gen' && 'text-emerald-400')}>
                  <Copy className="h-3.5 w-3.5" /> {copied === 'gen' ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>
            {generated ? (
              <>
                <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed bg-zinc-800/40 rounded-lg p-4 max-h-[480px] overflow-y-auto">{generated}</pre>
                <div className="flex gap-2">
                  <button className="btn-ghost flex-1 justify-center text-xs" onClick={() => handleSave('Draft')}>Save Draft</button>
                  <button className="btn-primary flex-1 justify-center text-xs" onClick={() => handleSave('Sent')}>
                    <Check className="h-3.5 w-3.5" /> Mark Sent
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-zinc-600">Pick a lead, confirm the package, and hit Generate. The proposal text appears here — copy it into a text, email, or PDF.</p>
            )}
          </div>
        </div>
      )}

      {/* ─── PROPOSALS LIST ───────────────────────────────────────────────── */}
      {tab === 'proposals' && (
        <div className="space-y-3">
          {data.proposals.length === 0 && (
            <p className="text-sm text-zinc-600">No proposals yet. Build one in the Proposal Builder.</p>
          )}
          {data.proposals.map(p => (
            <div key={p.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-sky-400" />
                    <h3 className="font-semibold text-zinc-100">{p.business_name} — {PACKAGES[p.package].name}</h3>
                  </div>
                  <p className="text-sm text-zinc-500 mt-0.5">Created {formatDate(p.created_at)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn('badge', getStatusColor(p.status))}>{p.status}</span>
                  <span className="text-sm font-bold text-zinc-100">
                    {formatCurrency(p.monthly)}/mo{p.setup_fee > 0 && ` + ${formatCurrency(p.setup_fee)} setup`}
                  </span>
                </div>
              </div>
              {p.body && (
                <button onClick={() => copy(p.body, p.id)} className={cn('btn-ghost text-xs', copied === p.id && 'text-emerald-400')}>
                  <Copy className="h-3.5 w-3.5" /> {copied === p.id ? 'Copied!' : 'Copy proposal text'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── PACKAGES ─────────────────────────────────────────────────────── */}
      {tab === 'packages' && (
        <div className="grid md:grid-cols-3 gap-4">
          {PACKAGE_LIST.map(pkg => (
            <div key={pkg.id} className={cn('rounded-xl border p-5', pkg.id === 'growth' ? 'border-sky-500/40 bg-sky-500/5' : 'border-zinc-800 bg-zinc-900/60')}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-zinc-100">{pkg.name}</h3>
                <span className="text-lg font-bold text-sky-400">{pkg.monthlyLabel}</span>
              </div>
              <p className="text-xs text-zinc-500 mb-3">{pkg.tagline}</p>
              {pkg.id === 'growth' && <span className="badge bg-sky-500/20 text-sky-400 mb-3 inline-block">Most popular</span>}
              <ul className="space-y-1.5">
                {pkg.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-zinc-400">
                    <span className="text-emerald-400 text-xs">✓</span> {f}
                  </li>
                ))}
              </ul>
              <p className="text-[10px] text-zinc-600 mt-3">{pkg.bestFor}</p>
            </div>
          ))}
        </div>
      )}

      {/* ─── OUTREACH SCRIPTS ─────────────────────────────────────────────── */}
      {tab === 'templates' && (
        <div className="space-y-3">
          {OUTREACH_TEMPLATES.map(t => (
            <div key={t.name} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-zinc-100">{t.name}</h3>
                  <p className="text-xs text-zinc-600 italic">{t.subject}</p>
                </div>
                <button onClick={() => copy(t.body, t.name)} className={cn('btn-ghost text-xs', copied === t.name && 'text-emerald-400')}>
                  <Copy className="h-3.5 w-3.5" /> {copied === t.name ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-sans leading-relaxed bg-zinc-800/40 rounded-lg p-3 max-h-48 overflow-y-auto">{t.body}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
