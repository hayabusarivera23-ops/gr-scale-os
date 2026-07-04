'use client'

import { useState } from 'react'
import { Search, ChevronRight, AlertTriangle, CheckCircle, XCircle, Copy, ArrowRight, Zap } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditDimension {
  key: string
  label: string
  description: string
  weight: number          // contribution to overall score
  questions: { label: string; yes: boolean }[]
}

interface AuditResult {
  businessName: string
  websiteUrl: string
  industry: string
  city: string
  scores: Record<string, number>          // 0-100 per dimension
  overallScore: number
  opportunityScore: number
  weaknesses: string[]
  strengths: string[]
  outreachAngle: string
  estimatedValue: number
  auditedAt: string
}

// ─── Audit Dimensions ────────────────────────────────────────────────────────
// Each yes/no question contributes equally within its dimension.
// Dimensions are weighted differently toward the overall score.

const DIMENSIONS: AuditDimension[] = [
  {
    key: 'mobile',
    label: 'Mobile Experience',
    description: 'How usable is the site on a phone?',
    weight: 25,
    questions: [
      { label: 'Site is mobile-responsive (no pinch/zoom required)', yes: true },
      { label: 'Phone number is tap-to-call', yes: true },
      { label: 'Text is readable without zooming', yes: true },
      { label: 'Buttons are large enough to tap easily', yes: true },
      { label: 'No horizontal scrolling on mobile', yes: true },
    ],
  },
  {
    key: 'cta',
    label: 'CTA & Conversion',
    description: 'Does the site convert visitors into calls/leads?',
    weight: 25,
    questions: [
      { label: 'Clear call-to-action above the fold', yes: true },
      { label: 'Quote/contact form is visible without scrolling', yes: true },
      { label: 'Phone number visible in the header', yes: true },
      { label: '"Get a Free Quote" or similar CTA exists', yes: true },
      { label: 'Form actually works (submits to email)', yes: true },
    ],
  },
  {
    key: 'seo',
    label: 'Local SEO',
    description: 'Can customers find them on Google?',
    weight: 20,
    questions: [
      { label: 'Page title includes business name + city', yes: true },
      { label: 'Meta description is set (not blank)', yes: true },
      { label: 'H1 heading exists and is relevant', yes: true },
      { label: 'Service pages exist for each service offered', yes: true },
      { label: 'City/area is mentioned in page content', yes: true },
    ],
  },
  {
    key: 'speed',
    label: 'Speed & Performance',
    description: 'Does the site load fast enough to not lose visitors?',
    weight: 15,
    questions: [
      { label: 'Site loads in under 3 seconds on mobile', yes: true },
      { label: 'Images are not oversized/uncompressed', yes: true },
      { label: 'No obvious JavaScript errors on load', yes: true },
      { label: 'Site has SSL (https://)', yes: true },
      { label: 'No broken images or missing resources', yes: true },
    ],
  },
  {
    key: 'trust',
    label: 'Trust Signals',
    description: 'Does the site make visitors confident enough to call?',
    weight: 10,
    questions: [
      { label: 'Google reviews or star rating shown', yes: true },
      { label: 'License number or "Licensed & Insured" visible', yes: true },
      { label: 'Real photos (not generic stock images)', yes: true },
      { label: 'Years in business or "About" section exists', yes: true },
      { label: 'Address or service area clearly stated', yes: true },
    ],
  },
  {
    key: 'design',
    label: 'Design & First Impression',
    description: 'Does the site look professional and current?',
    weight: 5,
    questions: [
      { label: 'Design looks modern (not pre-2015)', yes: true },
      { label: 'Colors and fonts are consistent', yes: true },
      { label: 'Logo is high-quality (not blurry)', yes: true },
      { label: 'No placeholder/dummy content visible', yes: true },
      { label: 'No expired promotions or outdated dates', yes: true },
    ],
  },
]

const WEAKNESS_MESSAGES: Record<string, Record<number, string>> = {
  mobile: {
    0: 'Site is completely unusable on mobile — customers calling from phones can\'t use it',
    1: 'Critical mobile issues — tap-to-call missing, text too small, buttons unclickable',
    2: 'Poor mobile experience — likely losing 60%+ of visitors who search from phones',
    3: 'Mobile issues present — some friction for phone visitors',
  },
  cta: {
    0: 'No way for visitors to contact them — zero conversion potential',
    1: 'Severely weak CTAs — visitors have no clear next step',
    2: 'Weak CTAs — no quote form or header phone, losing leads',
    3: 'CTAs need improvement — below-fold placement losing conversions',
  },
  seo: {
    0: 'Invisible to Google — no local SEO at all',
    1: 'Critically weak local SEO — won\'t rank for any local searches',
    2: 'Poor local SEO — missing title tags, meta descriptions, service pages',
    3: 'Local SEO gaps — missing city targeting and service pages',
  },
  speed: {
    0: 'Site is broken — errors, no SSL, or completely non-functional',
    1: 'Critical performance issues — very slow load, broken resources',
    2: 'Slow loading site — losing visitors before page finishes loading',
    3: 'Speed could be improved — some performance issues present',
  },
  trust: {
    0: 'No trust signals at all — visitors have no reason to call over a competitor',
    1: 'Almost no credibility signals — no reviews, license, or real photos',
    2: 'Low trust — missing reviews display and license information',
    3: 'Some trust gaps — reviews or credentials not prominently shown',
  },
  design: {
    0: 'Site looks outdated or broken — immediately loses credibility',
    1: 'Very dated design — looks unprofessional next to competitors',
    2: 'Outdated design — hurts first impression vs. modern competitors',
    3: 'Design showing its age — minor but visible professionalism gap',
  },
}

const INDUSTRIES = ['HVAC', 'Roofing', 'Plumbing', 'Landscaping', 'Pressure Washing', 'Barber', 'Restaurant', 'Auto Detailing', 'Other']

// ─── Score color helpers ──────────────────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 75) return 'text-emerald-400'
  if (s >= 50) return 'text-amber-400'
  return 'text-red-400'
}

function scoreBg(s: number) {
  if (s >= 75) return 'bg-emerald-500'
  if (s >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

function scoreLabel(s: number) {
  if (s >= 75) return 'Good'
  if (s >= 50) return 'Weak'
  if (s >= 25) return 'Poor'
  return 'Critical'
}

// ─── Compute audit results ────────────────────────────────────────────────────

function computeAudit(
  businessName: string,
  websiteUrl: string,
  industry: string,
  city: string,
  answers: Record<string, boolean[]>
): AuditResult {
  // Score each dimension 0-100
  const scores: Record<string, number> = {}
  DIMENSIONS.forEach(dim => {
    const yesses = answers[dim.key]?.filter(Boolean).length ?? 0
    scores[dim.key] = Math.round((yesses / dim.questions.length) * 100)
  })

  // Weighted overall score
  const overallScore = Math.round(
    DIMENSIONS.reduce((sum, dim) => sum + (scores[dim.key] * dim.weight) / 100, 0)
  )

  // Opportunity score = inverse of overall, boosted by low mobile/CTA scores
  const opportunityBoost = ((100 - scores.mobile) * 0.4 + (100 - scores.cta) * 0.4 + (100 - scores.seo) * 0.2) / 100
  const opportunityScore = Math.min(100, Math.round((100 - overallScore) * 0.7 + opportunityBoost * 30))

  // Weaknesses (dimensions scoring below 60)
  const weaknesses: string[] = []
  DIMENSIONS.forEach(dim => {
    const s = scores[dim.key]
    const tier = s === 0 ? 0 : s <= 20 ? 1 : s <= 40 ? 2 : s <= 60 ? 3 : -1
    if (tier >= 0 && WEAKNESS_MESSAGES[dim.key]?.[tier]) {
      weaknesses.push(WEAKNESS_MESSAGES[dim.key][tier])
    }
  })

  // Strengths (dimensions scoring 80+)
  const strengths: string[] = []
  if (scores.mobile >= 80) strengths.push('Good mobile experience')
  if (scores.cta >= 80) strengths.push('Strong calls-to-action')
  if (scores.seo >= 80) strengths.push('Solid local SEO foundation')
  if (scores.trust >= 80) strengths.push('Good trust signals')
  if (scores.speed >= 80) strengths.push('Fast site speed')

  // Outreach angle — pick the worst dimension
  const worstDim = DIMENSIONS.reduce((worst, dim) =>
    (scores[dim.key] < scores[worst.key] ? dim : worst), DIMENSIONS[0])
  const angleMap: Record<string, string> = {
    mobile: `their website is completely broken on mobile — every customer searching from a phone can't use it`,
    cta: `their website has no clear way for customers to contact them — they're getting traffic but losing every lead`,
    seo: `their website isn't showing up on Google for local searches — competitors are taking their customers`,
    speed: `their website loads too slowly — most visitors leave before it finishes loading`,
    trust: `their website shows no reviews or credentials — customers choose competitors who look more credible`,
    design: `their website looks outdated — customers assume the business is too`,
  }
  const outreachAngle = angleMap[worstDim.key] ?? 'their website has significant issues costing them customers'

  // Estimated deal value
  const estimatedValue = overallScore < 40 ? 1500 : 750

  return {
    businessName, websiteUrl, industry, city,
    scores, overallScore, opportunityScore,
    weaknesses, strengths, outreachAngle, estimatedValue,
    auditedAt: new Date().toISOString(),
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = size * 0.4
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const strokeColor = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#27272a" strokeWidth={size * 0.1} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={strokeColor} strokeWidth={size * 0.1}
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4} strokeLinecap="round" />
      </svg>
      <span className={cn('absolute inset-0 flex items-center justify-center font-bold', scoreColor(score))}
        style={{ fontSize: size * 0.22 }}>{score}</span>
    </div>
  )
}

function ScoreBar({ label, score, weight }: { label: string; score: number; weight: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-zinc-400">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-600">{weight}% weight</span>
          <span className={cn('text-xs font-bold', scoreColor(score))}>{score}</span>
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-800">
        <div className={cn('h-1.5 rounded-full transition-all duration-700', scoreBg(score))} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Step = 'input' | 'scoring' | 'results'

export default function AuditPage() {
  const [step, setStep] = useState<Step>('input')
  const [businessName, setBusinessName] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [industry, setIndustry] = useState('HVAC')
  const [city, setCity] = useState('')
  const [currentDimIdx, setCurrentDimIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, boolean[]>>(
    Object.fromEntries(DIMENSIONS.map(d => [d.key, d.questions.map(() => false)]))
  )
  const [result, setResult] = useState<AuditResult | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [savedLeads, setSavedLeads] = useState<AuditResult[]>([])

  const currentDim = DIMENSIONS[currentDimIdx]
  const isLastDim = currentDimIdx === DIMENSIONS.length - 1

  function toggleAnswer(dimKey: string, qIdx: number) {
    setAnswers(prev => ({
      ...prev,
      [dimKey]: prev[dimKey].map((v, i) => i === qIdx ? !v : v),
    }))
  }

  function nextDim() {
    if (isLastDim) {
      const r = computeAudit(businessName, websiteUrl, industry, city, answers)
      setResult(r)
      setStep('results')
    } else {
      setCurrentDimIdx(i => i + 1)
    }
  }

  function prevDim() {
    if (currentDimIdx > 0) setCurrentDimIdx(i => i - 1)
  }

  function resetAudit() {
    setStep('input')
    setBusinessName('')
    setWebsiteUrl('')
    setCity('')
    setCurrentDimIdx(0)
    setAnswers(Object.fromEntries(DIMENSIONS.map(d => [d.key, d.questions.map(() => false)])))
    setResult(null)
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  function saveToLeads() {
    if (!result) return
    setSavedLeads(prev => [...prev, result])
  }

  // ── Generated outreach based on audit ──────────────────────────────────────
  function generateOutreach(r: AuditResult) {
    const topWeakness = r.weaknesses[0] ?? 'has significant website issues'
    const score = r.overallScore
    const opportunity = r.opportunityScore
    const name = r.businessName
    const url = r.websiteUrl || 'your website'

    return {
      coldEmail: `Subject: Quick issue I found on ${name}'s website

Hey,

I was looking up ${r.industry} companies in ${r.city || 'your area'} and checked out ${url}.

I ran a quick audit and your site scored ${score}/100 — primarily because ${r.outreachAngle}.

That's likely costing you calls every day.

I build fast, mobile-first websites for ${r.industry} companies in Florida — and I can show you exactly what I'd fix. I made a 60-second video walking through the issues: [LOOM LINK]

Worth a look?

— Gio, GR Scale
[phone]`,

      followUp1: `Subject: Re: ${name}'s website

Hey — just bumping this up in case it got buried.

Quick recap: ${name}'s site scored ${score}/100. The biggest issue is ${r.weaknesses[0] ?? topWeakness}.

That means for every 10 people who find you on Google and click your site, most leave before calling.

I build sites specifically for ${r.industry} companies — mobile-first, click-to-call, quote form, the whole thing. Live in 7 days.

Would a free 10-minute call make sense? I'll show you the specific fixes on your screen.

— Gio`,

      followUp2: `Hey — last follow-up on this.

I audited ${name}'s site (scored ${score}/100) and put together a quick mockup of what the homepage could look like.

Happy to send it over — free, no strings. If you like it, we talk. If not, you keep it.

Just reply with "send it" and I'll get it to you today.

— Gio`,

      sms: `Hey — Gio here, GR Scale. I audited ${name}'s website and it scored ${score}/100. The main issue: ${r.outreachAngle}. I made a 60-sec video showing exactly what's costing you calls. Can I text you the link?`,

      voicemail: `Hey, this is Gio calling for the owner of ${name}. I build websites for ${r.industry} companies in Florida, and I ran a quick audit of your site — it scored ${score} out of 100. The main issue I found is ${r.outreachAngle}. I made a 1-minute video showing exactly what I'd fix. Can I text it to you? My number is [YOUR NUMBER]. Again, that's [YOUR NUMBER]. Thanks — talk soon.`,
    }
  }

  const outreach = result ? generateOutreach(result) : null

  // ── STEP: INPUT ─────────────────────────────────────────────────────────────
  if (step === 'input') {
    return (
      <div className="max-w-xl space-y-5">
        <div>
          <h2 className="page-title">Website Audit Engine</h2>
          <p className="text-sm text-zinc-500 mt-1">Score any website in 3 minutes. Get the sales angle before you call.</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block">Business Name *</label>
            <input className="input-base" placeholder="Cool Coast Heating & Cooling" value={businessName} onChange={e => setBusinessName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block">Website URL *</label>
            <input className="input-base" placeholder="https://coolcoast.net" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Industry</label>
              <select className="input-base" value={industry} onChange={e => setIndustry(e.target.value)}>
                {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">City</label>
              <input className="input-base" placeholder="Sarasota" value={city} onChange={e => setCity(e.target.value)} />
            </div>
          </div>
          <button
            onClick={() => businessName && websiteUrl && setStep('scoring')}
            disabled={!businessName || !websiteUrl}
            className="btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed">
            <Search className="h-4 w-4" /> Start Audit
          </button>
        </div>

        {/* Saved audits */}
        {savedLeads.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800/80">
              <span className="text-sm font-semibold">Recent Audits</span>
            </div>
            {savedLeads.map((lead, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/40 last:border-0">
                <div>
                  <p className="text-sm font-medium text-zinc-200">{lead.businessName}</p>
                  <p className="text-xs text-zinc-600">{lead.city} · {lead.industry}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('text-sm font-bold', scoreColor(lead.overallScore))}>{lead.overallScore}/100</span>
                  <span className="text-xs text-zinc-600">Opp: {lead.opportunityScore}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── STEP: SCORING ───────────────────────────────────────────────────────────
  if (step === 'scoring') {
    const dimAnswers = answers[currentDim.key]
    const yesses = dimAnswers.filter(Boolean).length
    const dimScore = Math.round((yesses / currentDim.questions.length) * 100)

    return (
      <div className="max-w-xl space-y-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-600 mb-3">
            <span className="font-medium text-zinc-400">{businessName}</span>
            <span>·</span>
            <span>{websiteUrl}</span>
          </div>
          <h2 className="page-title">{currentDim.label}</h2>
          <p className="text-sm text-zinc-500 mt-1">{currentDim.description}</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {DIMENSIONS.map((d, i) => (
            <div key={d.key} className={cn('h-1.5 flex-1 rounded-full transition-all',
              i < currentDimIdx ? 'bg-sky-500' : i === currentDimIdx ? 'bg-sky-400' : 'bg-zinc-800')} />
          ))}
        </div>
        <p className="text-xs text-zinc-600">Step {currentDimIdx + 1} of {DIMENSIONS.length} — open {websiteUrl} on your phone while answering</p>

        {/* Questions */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 divide-y divide-zinc-800/60">
          {currentDim.questions.map((q, qi) => (
            <label key={qi} className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-zinc-800/30 transition">
              <div className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition',
                dimAnswers[qi] ? 'border-sky-500 bg-sky-500' : 'border-zinc-600')}>
                {dimAnswers[qi] && <CheckCircle className="h-3.5 w-3.5 text-white" />}
              </div>
              <input type="checkbox" className="sr-only" checked={dimAnswers[qi]} onChange={() => toggleAnswer(currentDim.key, qi)} />
              <span className="text-sm text-zinc-300 leading-snug">{q.label}</span>
            </label>
          ))}
        </div>

        {/* Live score preview */}
        <div className={cn('rounded-lg border px-4 py-3 flex items-center gap-3',
          dimScore >= 75 ? 'border-emerald-500/30 bg-emerald-500/5' : dimScore >= 40 ? 'border-amber-500/30 bg-amber-500/5' : 'border-red-500/30 bg-red-500/5')}>
          <span className={cn('text-2xl font-bold', scoreColor(dimScore))}>{dimScore}</span>
          <div>
            <p className={cn('text-sm font-semibold', scoreColor(dimScore))}>{scoreLabel(dimScore)}</p>
            <p className="text-xs text-zinc-600">{yesses}/{currentDim.questions.length} criteria met</p>
          </div>
        </div>

        {/* Nav */}
        <div className="flex gap-3">
          {currentDimIdx > 0 && (
            <button onClick={prevDim} className="btn-ghost">← Back</button>
          )}
          <button onClick={nextDim} className="btn-primary flex-1 justify-center">
            {isLastDim ? '→ Generate Audit Report' : `Next: ${DIMENSIONS[currentDimIdx + 1].label} →`}
          </button>
        </div>
      </div>
    )
  }

  // ── STEP: RESULTS ───────────────────────────────────────────────────────────
  if (step === 'results' && result && outreach) {
    return (
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="page-title">{result.businessName}</h2>
            <p className="text-sm text-zinc-500">{result.websiteUrl} · {result.industry} · {result.city}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={saveToLeads} className="btn-primary text-xs py-1.5">Save to CRM</button>
            <button onClick={resetAudit} className="btn-ghost text-xs">New Audit</button>
          </div>
        </div>

        {/* Score overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Overall */}
          <div className={cn('rounded-xl border p-5 flex items-center gap-4',
            result.overallScore < 40 ? 'border-red-500/40 bg-red-500/5' : result.overallScore < 70 ? 'border-amber-500/40 bg-amber-500/5' : 'border-emerald-500/40 bg-emerald-500/5')}>
            <ScoreRing score={result.overallScore} size={80} />
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Website Score</p>
              <p className={cn('text-lg font-bold', scoreColor(result.overallScore))}>{scoreLabel(result.overallScore)}</p>
              <p className="text-xs text-zinc-600 mt-1">
                {result.overallScore < 40 ? 'Actively losing customers' : result.overallScore < 70 ? 'Leaving money on the table' : 'Solid foundation'}
              </p>
            </div>
          </div>

          {/* Opportunity */}
          <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-5 flex items-center gap-4">
            <ScoreRing score={result.opportunityScore} size={80} />
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Opportunity Score</p>
              <p className="text-lg font-bold text-sky-400">
                {result.opportunityScore >= 70 ? 'High' : result.opportunityScore >= 40 ? 'Medium' : 'Low'}
              </p>
              <p className="text-xs text-zinc-600 mt-1">Est. deal: {formatCurrency(result.estimatedValue)}</p>
            </div>
          </div>

          {/* Dimension breakdown */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
            {DIMENSIONS.map(dim => (
              <ScoreBar key={dim.key} label={dim.label} score={result.scores[dim.key]} weight={dim.weight} />
            ))}
          </div>
        </div>

        {/* Weaknesses + Strengths */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-red-500/20 bg-zinc-900/60 p-5">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="h-4 w-4 text-red-400" />
              <p className="text-sm font-semibold text-red-400">Issues Found ({result.weaknesses.length})</p>
            </div>
            <ul className="space-y-2">
              {result.weaknesses.length === 0
                ? <li className="text-sm text-zinc-500">No major issues found.</li>
                : result.weaknesses.map((w, i) => (
                  <li key={i} className="flex gap-2 text-sm text-zinc-300 leading-snug">
                    <span className="text-red-400 shrink-0 mt-0.5">✗</span> {w}
                  </li>
                ))}
            </ul>
          </div>

          {result.strengths.length > 0 && (
            <div className="rounded-xl border border-emerald-500/20 bg-zinc-900/60 p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <p className="text-sm font-semibold text-emerald-400">Working Well</p>
              </div>
              <ul className="space-y-2">
                {result.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-zinc-300 leading-snug">
                    <span className="text-emerald-400 shrink-0 mt-0.5">✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sales angle */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <p className="text-sm font-semibold text-amber-400">Your Sales Angle</p>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Open the call with: <span className="text-amber-300 font-medium">"{result.businessName} scored {result.overallScore}/100 because {result.outreachAngle}. I can show you exactly what that costs you in missed calls — can I text you a 1-minute video?"</span>
          </p>
        </div>

        {/* AI Outreach — all 5 pieces */}
        <div>
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-sky-400" /> Generated Outreach
            <span className="text-xs font-normal text-zinc-600 ml-1">personalized from audit results</span>
          </h3>
          <div className="space-y-3">
            {[
              { key: 'coldEmail', label: 'Cold Email', content: outreach.coldEmail },
              { key: 'followUp1', label: 'Follow-Up #1 (Day 1)', content: outreach.followUp1 },
              { key: 'followUp2', label: 'Follow-Up #2 (Day 3)', content: outreach.followUp2 },
              { key: 'sms', label: 'SMS / Text', content: outreach.sms },
              { key: 'voicemail', label: 'Voicemail Script', content: outreach.voicemail },
            ].map(({ key, label, content }) => (
              <div key={key} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-zinc-200">{label}</span>
                  <button onClick={() => copy(content, key)}
                    className={cn('btn-ghost text-xs py-1', copied === key && 'text-emerald-400')}>
                    <Copy className="h-3.5 w-3.5" /> {copied === key ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">{content}</pre>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 pt-2 pb-8">
          <button onClick={saveToLeads} className="btn-primary">
            Save to CRM
          </button>
          <button onClick={resetAudit} className="btn-ghost">
            Audit Another Site
          </button>
        </div>
      </div>
    )
  }

  return null
}
