'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Clipboard, RefreshCw, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const PROMPTS_URL = 'https://raw.githubusercontent.com/hayabusarivera23-ops/gr-scale-os/main/ops/daily-prompts.md'

interface PromptSection {
  title: string
  body: string
}

function todayText() {
  return new Date().toISOString().slice(0, 10)
}

function parsePrompts(markdown: string): PromptSection[] {
  const clean = markdown.trim()
  if (!clean) return []

  const sections: PromptSection[] = []
  const blocks = clean.split(/\n(?=#{1,3}\s+)/g)

  blocks.forEach((block, index) => {
    const lines = block.trim().split('\n')
    const first = lines[0] ?? ''
    const heading = first.replace(/^#{1,3}\s*/, '').trim()
    const body = (first.startsWith('#') ? lines.slice(1) : lines).join('\n').trim()

    if (body) {
      sections.push({
        title: heading || `Prompt ${index + 1}`,
        body,
      })
    }
  })

  if (sections.length) return sections

  return [{ title: 'Daily Prompt', body: clean }]
}

export default function DailyPromptsCard({ scope = 'business' }: { scope?: 'business' | 'personal' }) {
  const [raw, setRaw] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState('')
  const [error, setError] = useState('')

  async function loadPrompts() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${PROMPTS_URL}?t=${Date.now()}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('Prompts not ready')
      const text = await response.text()
      setRaw(text)
    } catch {
      setRaw('')
      setError('Prompts arrive at 6am. Paste Claude reports until the file is live.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPrompts()
  }, [])

  const sections = useMemo(() => {
    const parsed = parsePrompts(raw)
    const target = scope === 'personal' ? /gio|personal|coach|meal|workout|faith|fitness/i : /business|lead|outreach|seo|content|sales|proposal|customer/i
    const focused = parsed.filter((section) => target.test(`${section.title}\n${section.body}`))
    return focused.length ? focused : parsed
  }, [raw, scope])

  const stale = raw ? !raw.includes(todayText()) : false

  async function copyPrompt(section: PromptSection) {
    const text = `${section.title}\n\n${section.body}`.trim()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(section.title)
      window.setTimeout(() => setCopied(''), 1200)
    } catch {
      setCopied('')
    }
  }

  return (
    <section className="rounded-lg border border-cyan-400/20 bg-cyan-400/[0.045] p-4 shadow-xl shadow-black/15">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button onClick={loadPrompts} className="flex min-w-0 items-center gap-3 text-left">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-cyan-300/35 bg-cyan-300/10 text-cyan-200">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">Daily Prompts</span>
            <span className="block truncate text-sm font-black text-zinc-100">
              {scope === 'personal' ? 'Coach, food, workout, faith' : 'Revenue, leads, content, SEO'}
            </span>
          </span>
        </button>
        <button
          onClick={loadPrompts}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-black text-zinc-300 transition hover:border-cyan-300/50 hover:text-white"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {loading ? (
        <button className="w-full rounded-lg border border-white/10 bg-black/30 p-4 text-left text-sm font-bold text-zinc-400">
          Loading today&apos;s prompts...
        </button>
      ) : sections.length ? (
        <div className="grid gap-2">
          {stale ? (
            <button onClick={loadPrompts} className="rounded-lg border border-amber-300/25 bg-amber-300/10 p-3 text-left text-xs font-bold text-amber-100">
              This prompt file does not show today&apos;s date yet. Use it if helpful, but refresh after Claude posts the 6am file.
            </button>
          ) : null}
          {sections.slice(0, 4).map((section) => (
            <button
              key={section.title}
              onClick={() => copyPrompt(section)}
              className="rounded-lg border border-white/10 bg-black/30 p-3 text-left transition hover:border-cyan-300/50"
            >
              <span className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-black text-zinc-100">{section.title}</span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[10px] font-black text-black">
                  {copied === section.title ? <Check className="h-3 w-3" /> : <Clipboard className="h-3 w-3" />}
                  {copied === section.title ? 'Copied' : 'Copy'}
                </span>
              </span>
              <span className="line-clamp-3 whitespace-pre-line text-xs font-semibold leading-relaxed text-zinc-400">
                {section.body}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <button onClick={loadPrompts} className="w-full rounded-lg border border-dashed border-white/15 bg-black/30 p-5 text-left">
          <span className="block text-sm font-black text-zinc-200">Prompts arrive at 6am.</span>
          <span className="mt-1 block text-xs font-semibold text-zinc-500">
            {error || 'Claude can publish ops/daily-prompts.md, then this card turns into copy-ready prompts.'}
          </span>
        </button>
      )}
    </section>
  )
}
