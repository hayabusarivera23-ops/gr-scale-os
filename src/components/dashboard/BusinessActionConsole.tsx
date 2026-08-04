'use client'

import { useMemo, useState } from 'react'
import { ClipboardCheck, Copy, FileSearch, Lightbulb, Megaphone, Search, ShieldCheck } from 'lucide-react'
import { CORE_SERVICES, SEO_KEYWORDS } from '@/lib/seo'
import { LOCAL_APPROVALS_KEY, createApproval, type LocalApproval } from '@/lib/business'
import { cn } from '@/lib/utils'

const CONTENT_KITS_KEY = 'gr.contentKits.v1'
const CONTENT_USED_KEY = 'gr.contentUsedHashes.v1'
const CONTENT_BUMP_KEY = 'gr.contentBumps.v1'

const CONTENT_THEMES = [
  { id: 't1', name: 'Teardown', ideas: ['3 things I found on a real HVAC site that lose calls', 'This business pays for a domain that does not load', 'Old footer dates tell customers the site is abandoned'] },
  { id: 't2', name: 'Before / after', ideas: ['Melo Air: before vs after', 'What changed when Melo Air got a real site', 'From no site to a real online first impression'] },
  { id: 't3', name: 'Founder journey', ideas: ['I am 16 and I run a web agency: day in the life', 'What wrestling taught me about cold outreach', 'My first no-revenue week: what I learned'] },
  { id: 't4', name: 'Education', ideas: ['Your Google profile matters more than your website', '60-second mobile test for your site', 'Why 4.9 stars still lose if your site is broken'] },
  { id: 't5', name: 'Proof', ideas: ['13 industries, 13 demo sites: pick yours', 'Watch this demo load fast', 'What $500 actually buys'] },
  { id: 't6', name: 'Myth bust', ideas: ['My nephew does my website: here is the risk', 'Word of mouth is enough, until people search you', 'Nobody checks websites anymore is not true'] },
  { id: 't7', name: 'Checklist', ideas: ['Rate your own site: 5 checks, 2 minutes', 'Does your site pass the thumb test?', '5 signs your site was built years ago'] },
  { id: 't8', name: 'Local spotlight', ideas: ['A local business doing visibility right', 'Best local business site I saw this week', '3 things to learn from a strong local brand'] },
  { id: 't9', name: 'Behind the build', ideas: ['Building an HVAC homepage in 60 seconds', 'How I research a business before I pitch', 'My exact audit checklist, free'] },
  { id: 't10', name: 'Offer', ideas: ['Free 20-minute audit: I show what is costing calls', 'First 3 businesses this month get an audit and action plan', 'DM AUDIT and I will look at your site'] },
]

const SCRIPTS = [
  '[screen record] This company has strong reviews and a website that makes customers work too hard. Reviews get attention. The site either closes the call or loses it.',
  '[before after] Same business, different first impression. One feels outdated. One makes it easy to trust and call.',
  '[face cam] I am 16, I build websites for local businesses, and the first thing I look for is not design. It is whether customers know what to do next.',
  '[phone test] Open your site on your phone. If the phone number, services, and trust proof are not obvious, you are losing calls.',
  '[Google profile] Your Google profile is often your real homepage. Photos, services, reviews, and the call button matter before ads.',
  '[build timelapse] Watch me build a homepage in 60 seconds. The goal is not decoration. The goal is trust and calls.',
  '[checklist] 5 checks, 2 minutes: clear service, service area, proof, click-to-call, fast mobile load.',
  '[face cam] Word of mouth is great, but people still Google you before they call. That first impression matters.',
  '[demo scroll] This is what a simple $500 website can look like now: fast, clear, mobile-first, and built for calls.',
  '[calendar] Free audit, 20 minutes, zero pressure. You keep the findings whether you hire me or not.',
]

const CAPTIONS = [
  'Reviews get them interested. Your website closes them or loses them.',
  'The build changes the first impression forever.',
  'Building in public. Watch the whole thing.',
  'Most local sites fail the thumb test. Does yours?',
  'Google Business Profile is one of the most underrated free marketing tools.',
  'No agency games. Just a site that works.',
  'Screenshot this checklist.',
  'Every weak first impression sends someone to a competitor.',
  'Fast, modern, yours. That is it.',
  '20 minutes. Zero pressure. You keep the findings.',
]

const CTAS = [
  'Free audit: grscales.com/book',
  'DM AUDIT',
  'Link in bio',
  'Text (813) 869-5917',
  'See demos: grscales.com/demos',
  'Book before Friday',
  'Send this to a business owner you know',
  'Follow the build',
  'Comment your industry and I will post a demo',
  'grscales.com: see real work',
]

const SEO_PAGES = [
  { path: '/hvac-marketing', title: 'HVAC Marketing: Get More Calls From Google | GR Scale', h1: 'HVAC Marketing That Turns Searches Into Booked Calls', keyword: 'HVAC marketing', faq: ['How do HVAC companies get more calls from Google?', 'What should an HVAC website include?', 'How much does HVAC marketing cost?'] },
  { path: '/google-business-profile-optimization', title: 'Google Business Profile Optimization ($150) | GR Scale', h1: 'Get Found on Google Maps', keyword: 'Google Business Profile optimization', faq: ['What is GBP optimization?', 'How long until results?', 'Do I need a website too?'] },
  { path: '/grow-my-local-business', title: 'How to Grow My Local Business (Visibility System) | GR Scale', h1: 'Grow Your Local Business: The Visibility System', keyword: 'grow my local business', faq: ['What grows a local business fastest?', 'Website or Google profile first?', 'What does it cost?'] },
  { path: '/local-business-marketing', title: 'Local Business Marketing That Is Not An Agency Retainer', h1: 'Local Business Marketing, Minus the Agency Games', keyword: 'local business marketing', faq: ['What is local business marketing?', 'What should I fix first?', 'Do I need monthly marketing?'] },
  { path: '/free-website-audit', title: 'Free Website Audit - 20 Minutes | GR Scale', h1: 'Your Free Website Audit', keyword: 'free website audit', faq: ['What do you check?', 'Is it really free?', 'What happens after?'] },
  { path: '/roofing-marketing', title: 'Roofing Marketing: Get More Calls From Google | GR Scale', h1: 'Roofing Marketing That Turns Searches Into Calls', keyword: 'roofing marketing', faq: ['How do roofers get more calls?', 'What should a roofing site include?', 'How much does roofing marketing cost?'] },
  { path: '/plumber-marketing', title: 'Plumber Marketing: Get More Calls From Google | GR Scale', h1: 'Plumber Marketing That Wins Emergency Calls', keyword: 'plumber marketing', faq: ['How do plumbers get more calls?', 'What should a plumbing site include?', 'How much does plumber marketing cost?'] },
  { path: '/barbershop-websites', title: 'Barbershop Websites That Turn Searches Into Bookings | GR Scale', h1: 'Barbershop Websites Built for Bookings', keyword: 'barbershop websites', faq: ['Do barbers need a website?', 'What should a barber website include?', 'Can it connect to booking?'] },
  { path: '/business-visibility-system', title: 'The Business Visibility System | GR Scale', h1: 'Get Seen. Get Trusted. Get Called.', keyword: 'business visibility system', faq: ['What is a business visibility system?', 'What comes first?', 'How do I measure results?'] },
  { path: '/pricing-explained', title: 'What a $500 Website Includes (Full Breakdown)', h1: 'What a $500 Website Actually Includes', keyword: 'website pricing explained', faq: ['What is included?', 'Why monthly maintenance?', 'Can I start smaller?'] },
]

const SALES_SCRIPTS = {
  review: 'Hey {name}, awesome working with you on the new site. One favor: a quick Google review helps a small business like mine more than anything. 30 seconds, honest words: {link}. Thank you.',
  referral: 'Yo, quick one. I build websites and visibility systems for local businesses now. If you know any business owner with an ugly site or no site, intro me. If they sign, I pay you $50. Just send them my number: (813) 869-5917.',
  proposal: "Hey {name}, no rush on the proposal. Just making sure it did not get buried. If price is the snag, tell me straight and we will figure it out. If timing is bad, when should I check back?",
  price: 'Fair. One new customer from Google can cover the whole build. And the $99/mo replaces hosting, updates, and maintenance you would pay someone anyway. If $500 up front is the issue, I can split it: $250 to start, $250 at launch.',
  think: "Totally fine. It is your business. What is the main thing you are weighing? If it is price, timing, or whether this actually gets calls, I would rather answer it straight than leave you guessing.",
  info: 'For sure. Quick version: I found {problem} on your site. That is the kind of thing sending customers to competitors. Real example: meloair.net. Free audit if you want the full breakdown: grscales.com/book. No pressure either way.',
  examples: 'Yep: meloair.net for HVAC in Tampa and lexthebarber.com in Orlando. Built both. There are also more demos at grscales.com/demos if you want to see your industry.',
}

const CITY_OPTIONS = ['Tampa', 'Lakeland', 'Brandon', 'St. Pete', 'Orlando', 'Clearwater']
const NICHE_OPTIONS = ['HVAC', 'roofing', 'plumbing', 'barbershop', 'landscaping']

type ContentKit = {
  id: string
  date: string
  themeId: string
  ideaText: string
  scriptText: string
  captionIg: string
  captionFb: string
  captionX: string
  hashtags: string
  cta: string
  status: 'draft' | 'approved' | 'posted'
  bump: number
  usedHash: string
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function dayIndex() {
  return Math.floor(Date.now() / 86_400_000)
}

function readJson<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || '') as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

function storeApproval(approval: LocalApproval) {
  const saved = readJson<LocalApproval[]>(LOCAL_APPROVALS_KEY, [])
  writeJson(LOCAL_APPROVALS_KEY, [approval, ...saved].slice(0, 80))
}

function nextContentKit(niche: string, bump: number): ContentKit {
  const used = readJson<{ hash: string; date: string }[]>(CONTENT_USED_KEY, [])
  let offset = bump
  let kit: ContentKit

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const index = dayIndex() + offset + attempt
    const theme = CONTENT_THEMES[index % CONTENT_THEMES.length]
    const idea = theme.ideas[index % theme.ideas.length]
    const script = SCRIPTS[index % SCRIPTS.length]
    const caption = CAPTIONS[index % CAPTIONS.length]
    const cta = CTAS[index % CTAS.length]
    const usedHash = `${theme.id}|${idea}|${script}|${caption}|${cta}`
    kit = {
      id: `kit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: todayIso(),
      themeId: theme.id,
      ideaText: idea,
      scriptText: script,
      captionIg: `${caption}\n\n${cta}\n\n#grscale #localbusiness #${niche.toLowerCase()}marketing #smallbusiness`,
      captionFb: `${caption}\n\n${cta}`,
      captionX: `${caption} ${cta}`,
      hashtags: `#grscale #localbusiness #${niche.toLowerCase()}marketing #smallbusiness`,
      cta,
      status: 'draft',
      bump: offset + attempt,
      usedHash,
    }
    const stillFresh = used.some(item => item.hash === usedHash && (Date.now() - new Date(item.date).getTime()) < 30 * 86_400_000)
    if (!stillFresh) return kit
  }

  const theme = CONTENT_THEMES[0]
  return {
    id: `kit-${Date.now()}`,
    date: todayIso(),
    themeId: theme.id,
    ideaText: theme.ideas[0],
    scriptText: SCRIPTS[0],
    captionIg: CAPTIONS[0],
    captionFb: CAPTIONS[0],
    captionX: CAPTIONS[0],
    hashtags: '#grscale #localbusiness',
    cta: CTAS[0],
    status: 'draft',
    bump,
    usedHash: `${theme.id}|fallback`,
  }
}

export default function BusinessActionConsole() {
  const [niche, setNiche] = useState('HVAC')
  const [city, setCity] = useState('Tampa')
  const [problem, setProblem] = useState('weak mobile first impression')
  const [name, setName] = useState('there')
  const [output, setOutput] = useState('')
  const [lastKit, setLastKit] = useState<ContentKit | null>(null)
  const [copied, setCopied] = useState('')
  const [saved, setSaved] = useState(false)

  const nextSeo = useMemo(() => SEO_PAGES[dayIndex() % SEO_PAGES.length], [])

  function show(next: string) {
    setOutput(next)
    setCopied('')
    setSaved(false)
  }

  function makeContentKit() {
    const bumps = readJson<Record<string, number>>(CONTENT_BUMP_KEY, {})
    const today = todayIso()
    const bump = bumps[today] ?? 0
    const kit = nextContentKit(niche, bump)
    const kits = readJson<ContentKit[]>(CONTENT_KITS_KEY, [])
    const used = readJson<{ hash: string; date: string }[]>(CONTENT_USED_KEY, [])
    writeJson(CONTENT_KITS_KEY, [kit, ...kits].slice(0, 60))
    writeJson(CONTENT_USED_KEY, [{ hash: kit.usedHash, date: today }, ...used].slice(0, 120))
    writeJson(CONTENT_BUMP_KEY, { ...bumps, [today]: bump + 1 })
    setLastKit(kit)
    show([
      'CONTENT KIT - RULES ENGINE (NOT AI)',
      `Theme: ${CONTENT_THEMES.find(theme => theme.id === kit.themeId)?.name ?? kit.themeId}`,
      `Niche: ${niche}`,
      '',
      `Post idea: ${kit.ideaText}`,
      '',
      `Script:\n${kit.scriptText}`,
      '',
      `Instagram caption:\n${kit.captionIg}`,
      '',
      `Facebook caption:\n${kit.captionFb}`,
      '',
      `X caption:\n${kit.captionX}`,
      '',
      `CTA: ${kit.cta}`,
      '',
      'Approval rule: Gio edits and posts manually. No auto-post.',
    ].join('\n'))
  }

  function makeSeoMove() {
    show([
      'NEXT SEO MOVE - RULES ENGINE (NOT AI)',
      `Build page: ${nextSeo.path}`,
      `Target keyword: ${nextSeo.keyword}`,
      `Title tag: ${nextSeo.title}`,
      `H1: ${nextSeo.h1}`,
      '',
      'Meta description: Write a direct promise around get seen, get trusted, get called.',
      '',
      'Page outline:',
      '1. Problem: why this business loses visibility or calls',
      '2. What customers check before calling',
      '3. What GR Scale fixes',
      '4. Proof/examples',
      '5. Free audit CTA',
      '',
      'FAQs:',
      ...nextSeo.faq.map((faq, index) => `${index + 1}. ${faq}`),
      '',
      'Internal links: /grow-business, /services/local-business-visibility, /services/hvac-marketing, /free-website-audit',
      'GBP action: turn this page into one weekly Google Business post.',
    ].join('\n'))
  }

  function makeLeadQueries() {
    const cleanNiche = niche || 'HVAC'
    const cleanCity = city || 'Tampa'
    const base = cleanNiche.toLowerCase()
    const platformQuery = base === 'barbershop' ? `barbershop ${cleanCity} booksy` : `${base} ${cleanCity} site:facebook.com`
    show([
      'LEAD RESEARCH QUERIES - RULES ENGINE (NOT AI)',
      `Niche: ${cleanNiche}`,
      `City: ${cleanCity}`,
      '',
      'Copy these into Google:',
      `1. ${base} repair ${cleanCity}`,
      `2. ${base} company ${cleanCity} "free estimate"`,
      `3. ${base} ${cleanCity} "website under construction"`,
      `4. ${base} ${cleanCity} "2019" website`,
      `5. ${platformQuery}`,
      '',
      'Weak website signals:',
      '- not mobile friendly',
      '- no HTTPS',
      '- old footer year',
      '- dead links/images',
      '- no CTA above the fold',
      '- Facebook/Instagram only',
      '- domain parked or dead',
      '',
      'Weak Google profile signals:',
      '- fewer than 10 photos',
      '- no posts in 6+ months',
      '- unanswered reviews',
      '- missing services/hours',
      '- no website or booking link',
      '',
      'Heat 3 lead: 50+ reviews at 4.5+ and a weak site/profile.',
      `Opening problem angle: ${problem}`,
    ].join('\n'))
  }

  function makeScripts() {
    const merge = (text: string) => text
      .replaceAll('{name}', name || 'there')
      .replaceAll('{problem}', problem || 'one thing that may be costing calls')
      .replaceAll('{link}', 'your Google review link')
    show([
      'SALES / REVIEW / REFERRAL SCRIPTS - RULES ENGINE (NOT AI)',
      '',
      `Review request:\n${merge(SALES_SCRIPTS.review)}`,
      '',
      `Referral request:\n${merge(SALES_SCRIPTS.referral)}`,
      '',
      `Proposal follow-up:\n${merge(SALES_SCRIPTS.proposal)}`,
      '',
      `Price objection:\n${merge(SALES_SCRIPTS.price)}`,
      '',
      `I need to think:\n${merge(SALES_SCRIPTS.think)}`,
      '',
      `Send info:\n${merge(SALES_SCRIPTS.info)}`,
      '',
      `Examples:\n${merge(SALES_SCRIPTS.examples)}`,
    ].join('\n'))
  }

  async function copyText(text: string, label: string) {
    await navigator.clipboard?.writeText(text)
    setCopied(label)
    window.setTimeout(() => setCopied(''), 1400)
  }

  function addApproval() {
    if (!output.trim()) return
    storeApproval(createApproval({
      kind: 'post',
      title: lastKit ? `Content kit: ${lastKit.ideaText}` : 'Rules-engine business output',
      body: output,
      createdBy: 'Business Action Console',
      href: '/approve',
    }))
    setSaved(true)
  }

  return (
    <section className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.055] p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-black text-emerald-100">
            <Lightbulb className="h-3.5 w-3.5" /> Rules engine - not AI
          </div>
          <h2 className="mt-3 text-2xl font-black text-white">Business action generator</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
            Free deterministic generators for content, SEO, lead research, and sales scripts. Everything is draft-only.
          </p>
        </div>
        <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-amber-100" />
            <p className="text-xs font-black text-amber-100">Approval gate</p>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">No auto-send, no auto-post, no spend, no account changes.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <select value={niche} onChange={event => setNiche(event.target.value)} className="rounded-lg border border-zinc-800 bg-black/25 px-3 py-2 text-sm text-white outline-none">
          {NICHE_OPTIONS.map(item => <option key={item}>{item}</option>)}
        </select>
        <select value={city} onChange={event => setCity(event.target.value)} className="rounded-lg border border-zinc-800 bg-black/25 px-3 py-2 text-sm text-white outline-none">
          {CITY_OPTIONS.map(item => <option key={item}>{item}</option>)}
        </select>
        <input value={name} onChange={event => setName(event.target.value)} className="rounded-lg border border-zinc-800 bg-black/25 px-3 py-2 text-sm text-white outline-none" placeholder="Name/business" />
        <input value={problem} onChange={event => setProblem(event.target.value)} className="rounded-lg border border-zinc-800 bg-black/25 px-3 py-2 text-sm text-white outline-none" placeholder="Problem angle" />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <button onClick={makeContentKit} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-300 px-3 py-3 text-xs font-black text-slate-950 hover:bg-emerald-200">
          <Megaphone className="h-3.5 w-3.5" /> Make more content
        </button>
        <button onClick={makeSeoMove} className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-3 text-xs font-black text-cyan-100 hover:bg-cyan-300/15">
          <FileSearch className="h-3.5 w-3.5" /> Next SEO move
        </button>
        <button onClick={makeLeadQueries} className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-300/20 bg-violet-300/10 px-3 py-3 text-xs font-black text-violet-100 hover:bg-violet-300/15">
          <Search className="h-3.5 w-3.5" /> Lead queries
        </button>
        <button onClick={makeScripts} className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300/20 bg-amber-300/10 px-3 py-3 text-xs font-black text-amber-100 hover:bg-amber-300/15">
          <ClipboardCheck className="h-3.5 w-3.5" /> Scripts
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.75fr]">
        <div>
          <textarea
            value={output}
            onChange={event => setOutput(event.target.value)}
            placeholder="Press a generator button..."
            className="min-h-72 w-full resize-none rounded-lg border border-zinc-800 bg-black/30 p-3 text-sm leading-relaxed text-zinc-200 outline-none placeholder:text-zinc-700"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button disabled={!output.trim()} onClick={() => copyText(output, 'all')} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-black text-slate-950 disabled:opacity-40">
              <Copy className="h-3.5 w-3.5" /> {copied === 'all' ? 'Copied' : 'Copy all'}
            </button>
            {lastKit && (
              <>
                <button onClick={() => copyText(lastKit.scriptText, 'script')} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-black text-zinc-300 hover:text-white">{copied === 'script' ? 'Copied' : 'Copy script'}</button>
                <button onClick={() => copyText(lastKit.captionIg, 'caption')} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-black text-zinc-300 hover:text-white">{copied === 'caption' ? 'Copied' : 'Copy caption'}</button>
                <button onClick={() => copyText(lastKit.cta, 'cta')} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-black text-zinc-300 hover:text-white">{copied === 'cta' ? 'Copied' : 'Copy CTA'}</button>
              </>
            )}
            <button disabled={!output.trim()} onClick={addApproval} className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-black text-emerald-100 disabled:opacity-40">
              {saved ? 'Added to approvals' : 'Add to approval queue'}
            </button>
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-black/25 p-4">
          <p className="text-sm font-black text-white">Free setup targets</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SEO_KEYWORDS.slice(0, 7).map(keyword => (
              <span key={keyword} className={cn('rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-bold text-zinc-300')}>
                {keyword}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs font-black text-white">Service ladder</p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">{CORE_SERVICES.map(service => service.name).join(' / ')}</p>
          <p className="mt-4 text-xs font-black text-white">Stored locally</p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">Content kits save to <span className="font-mono">gr.contentKits</span> and avoid repeating the same combo for 30 days.</p>
        </div>
      </div>
    </section>
  )
}
