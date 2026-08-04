'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bot, CheckCircle2, ExternalLink, FileSearch, MapPin, Search, Star } from 'lucide-react'
import { CORE_SERVICES, SEO_KEYWORDS } from '@/lib/seo'
import { cn } from '@/lib/utils'

const SEO_CHECKLIST_KEY = 'gr.seo-playbook.v1'
const CITATION_KEY = 'gr.citations.v1'
const GBP_KEY = 'gr.gbp-status.v1'

const GOOGLE_SETUP = [
  'Do not create duplicate Google profiles',
  'Finish verification on the existing GR Scale profile',
  'Keep home address hidden as service-area business',
  'Add services, booking link, photos, and Q&A',
  'Post one useful Google update every week',
  'Ask real clients only for honest reviews',
]

const SEO_PAGES = [
  '/hvac-marketing',
  '/google-business-profile-optimization',
  '/grow-my-local-business',
  '/local-business-marketing',
  '/free-website-audit',
  '/roofing-marketing',
  '/plumber-marketing',
  '/barbershop-websites',
  '/business-visibility-system',
  '/pricing-explained',
]

const CITATIONS = ['Bing Places', 'Yelp', 'Nextdoor', 'Apple Business Connect', 'Facebook page info', 'Foursquare', 'BBB free listing', 'Alignable']

const GBP_POSTS = [
  'Free audit offer',
  'Melo Air before/after',
  '3 things losing calls',
  'Why Google profile matters',
  'Lex barber showcase',
  'What $500 includes',
  'Review spotlight',
  'Mobile self-test',
  'Founder intro',
  'Book an audit CTA',
]

function readRecord(key: string) {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}') as Record<string, boolean>
  } catch {
    return {}
  }
}

function writeRecord(key: string, value: Record<string, boolean>) {
  localStorage.setItem(key, JSON.stringify(value))
}

export default function SeoGrowthConsole() {
  const [seoDone, setSeoDone] = useState<Record<string, boolean>>({})
  const [citationDone, setCitationDone] = useState<Record<string, boolean>>({})
  const [gbpDone, setGbpDone] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setSeoDone(readRecord(SEO_CHECKLIST_KEY))
    setCitationDone(readRecord(CITATION_KEY))
    setGbpDone(readRecord(GBP_KEY))
  }, [])

  function toggle(key: string, storeKey: string, state: Record<string, boolean>, setter: (next: Record<string, boolean>) => void) {
    const next = { ...state, [key]: !state[key] }
    setter(next)
    writeRecord(storeKey, next)
  }

  const seoCount = SEO_PAGES.filter(page => seoDone[page]).length
  const citationCount = CITATIONS.filter(site => citationDone[site]).length
  const gbpCount = GOOGLE_SETUP.filter(item => gbpDone[item]).length

  return (
    <section className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-black text-cyan-100">
            <Search className="h-3.5 w-3.5" /> Google and AI SEO
          </div>
          <h2 className="mt-3 text-2xl font-black text-white">Rank for business growth by becoming the clearest useful answer.</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
            The target is not just websites. It is local business visibility: Google profile, search pages, trust proof, content, reviews, and conversion.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/grow-business" target="_blank" className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950 hover:bg-cyan-200">
            Public growth page <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <a href="https://business.google.com/create" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-black text-white/80 hover:text-white">
            Google setup <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-black/25 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-cyan-200" />
              <p className="text-sm font-black text-white">Google Business setup</p>
            </div>
            <span className="rounded-full border border-cyan-300/20 px-2 py-1 text-[10px] font-black text-cyan-100">{gbpCount}/{GOOGLE_SETUP.length}</span>
          </div>
          <div className="mt-3 space-y-2">
            {GOOGLE_SETUP.map(item => (
              <button
                key={item}
                onClick={() => toggle(item, GBP_KEY, gbpDone, setGbpDone)}
                className={cn(
                  'flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left text-xs leading-relaxed transition',
                  gbpDone[item] ? 'border-cyan-300/25 bg-cyan-300/10 text-cyan-100' : 'border-zinc-800 bg-black/20 text-zinc-400 hover:text-zinc-200'
                )}
              >
                <CheckCircle2 className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', gbpDone[item] ? 'text-cyan-200' : 'text-zinc-700')} />
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-black/25 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-emerald-200" />
              <p className="text-sm font-black text-white">10-page SEO playbook</p>
            </div>
            <span className="rounded-full border border-emerald-300/20 px-2 py-1 text-[10px] font-black text-emerald-100">{seoCount}/{SEO_PAGES.length}</span>
          </div>
          <div className="mt-3 grid max-h-56 gap-2 overflow-auto pr-1">
            {SEO_PAGES.map(page => (
              <button
                key={page}
                onClick={() => toggle(page, SEO_CHECKLIST_KEY, seoDone, setSeoDone)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-bold transition',
                  seoDone[page] ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100' : 'border-zinc-800 bg-black/20 text-zinc-400 hover:text-zinc-200'
                )}
              >
                <Star className={cn('h-3.5 w-3.5 shrink-0', seoDone[page] ? 'text-emerald-300' : 'text-zinc-700')} />
                {page}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-black/25 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileSearch className="h-4 w-4 text-amber-200" />
              <p className="text-sm font-black text-white">Citation tracker</p>
            </div>
            <span className="rounded-full border border-amber-300/20 px-2 py-1 text-[10px] font-black text-amber-100">{citationCount}/{CITATIONS.length}</span>
          </div>
          <div className="mt-3 grid gap-2">
            {CITATIONS.map(site => (
              <button
                key={site}
                onClick={() => toggle(site, CITATION_KEY, citationDone, setCitationDone)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-left text-xs font-bold transition',
                  citationDone[site] ? 'border-amber-300/25 bg-amber-300/10 text-amber-100' : 'border-zinc-800 bg-black/20 text-zinc-400 hover:text-zinc-200'
                )}
              >
                {site}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <div className="rounded-lg border border-zinc-800 bg-black/25 p-4">
          <p className="text-sm font-black text-white">Google Business post queue</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {GBP_POSTS.map(post => (
              <span key={post} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-bold text-zinc-300">{post}</span>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-black/25 p-4">
          <p className="text-sm font-black text-white">Keyword lanes</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SEO_KEYWORDS.slice(0, 8).map(keyword => (
              <span key={keyword} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-bold text-zinc-300">
                {keyword}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs font-black text-white">Services to sell</p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            {CORE_SERVICES.map(service => service.name).join(' / ')}
          </p>
        </div>
      </div>
    </section>
  )
}
