'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

const FEED_URL =
  'https://raw.githubusercontent.com/hayabusarivera23-ops/gr-scale-os/main/ops/site-activity.json'

interface ActivityEvent {
  ts: string
  type: 'booking' | 'lead' | 'reply' | 'system' | string
  title: string
  detail?: string
}

const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  booking: { icon: '📅', color: '#34d399', label: 'Booking' },
  lead: { icon: '📥', color: '#22d3ee', label: 'New lead' },
  reply: { icon: '💬', color: '#fbbf24', label: 'Reply' },
  system: { icon: '🛰️', color: '#a78bfa', label: 'System' },
}

function timeAgo(iso: string) {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return `${days}d ago`
}

export default function ActivityPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [checkedAt, setCheckedAt] = useState<string>('')
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${FEED_URL}?t=${Date.now()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(String(res.status))
      const data = (await res.json()) as { events?: ActivityEvent[] }
      const list = (data.events ?? []).slice().sort((a, b) => (a.ts < b.ts ? 1 : -1))
      setEvents(list)
      setState('ok')
      setCheckedAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))
    } catch {
      setState('error')
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, 60000)
    return () => clearInterval(id)
  }, [load])

  return (
    <div style={{ minHeight: '100vh', background: '#07090d', color: '#e7ecf3', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: 2, color: '#22d3ee', margin: 0 }}>GRSCALES.COM</p>
            <h1 style={{ fontSize: 30, fontWeight: 800, margin: '2px 0 0' }}>Site Activity</h1>
          </div>
          <Link
            href="/"
            style={{ fontSize: 13, fontWeight: 600, color: '#0b0f14', background: '#e7ecf3', borderRadius: 999, padding: '8px 14px', textDecoration: 'none' }}
          >
            Dashboard
          </Link>
        </div>
        <p style={{ fontSize: 13, color: '#8b98a9', margin: '0 0 22px' }}>
          Bookings, form fills, and replies from your website. Refreshed at 12pm &amp; 6pm daily.
          {checkedAt ? ` Last checked ${checkedAt}.` : ''}
        </p>

        {state === 'loading' && (
          <div style={{ padding: 40, textAlign: 'center', color: '#8b98a9', fontSize: 14 }}>Loading activity…</div>
        )}

        {state === 'error' && (
          <div style={{ padding: 24, borderRadius: 16, background: '#12161d', border: '1px solid #232a35', fontSize: 14, color: '#fbbf24' }}>
            Could not load the feed. It will retry automatically.
          </div>
        )}

        {state === 'ok' && events.length <= 1 && (
          <div style={{ padding: '28px 24px', borderRadius: 18, background: 'linear-gradient(160deg,#101722,#0b0f14)', border: '1px solid #1d2836', marginBottom: 14 }}>
            <p style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px' }}>Quiet for now.</p>
            <p style={{ fontSize: 13.5, color: '#8b98a9', margin: 0, lineHeight: 1.6 }}>
              The moment someone books an audit, fills a form, or replies, it shows up here.
              More visitors = more activity — today&apos;s move: send your 10 pitches.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {state === 'ok' &&
            events.map((e, i) => {
              const meta = TYPE_META[e.type] ?? TYPE_META.system
              return (
                <div
                  key={`${e.ts}-${i}`}
                  style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '16px 18px', borderRadius: 16, background: '#0e131a', border: '1px solid #1b2330' }}
                >
                  <div style={{ fontSize: 22, lineHeight: '28px' }}>{meta.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: meta.color, letterSpacing: 1 }}>{meta.label.toUpperCase()}</span>
                      <span style={{ fontSize: 12, color: '#5d6b7d', whiteSpace: 'nowrap' }}>{timeAgo(e.ts)}</span>
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 650, margin: '3px 0 2px' }}>{e.title}</p>
                    {e.detail ? (
                      <p style={{ fontSize: 13, color: '#8b98a9', margin: 0, lineHeight: 1.55 }}>{e.detail}</p>
                    ) : null}
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
