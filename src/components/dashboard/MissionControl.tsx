'use client'

/**
 * Mission Control — one-tap shortcuts to everything GR Scale.
 * Groups: My Sites / Business Tools / Marketing / Analytics.
 * Tiles marked setup:true are placeholders until Gio creates the account.
 */

import { Globe, Mail, Github, Triangle, MapPin, Calendar, CreditCard, Instagram, Facebook, BarChart3, DollarSign, Phone } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Tile = {
  label: string
  sub: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  internal?: boolean
  setup?: boolean
}

const GROUPS: { title: string; tiles: Tile[] }[] = [
  {
    title: 'My Sites',
    tiles: [
      { label: 'grscales.com', sub: 'Main site', href: 'https://www.grscales.com', icon: Globe, color: 'text-sky-400' },
      { label: 'Demo Gallery', sub: '13 niche demos', href: 'https://gr-scale-demos.vercel.app', icon: Globe, color: 'text-teal-400' },
      { label: 'LexTheBarber', sub: 'Client · live', href: 'https://lexthebarber.com', icon: Globe, color: 'text-emerald-400' },
      { label: 'Melo Air', sub: 'Client · live', href: 'https://meloair.net', icon: Globe, color: 'text-emerald-400' },
    ],
  },
  {
    title: 'Business Tools',
    tiles: [
      { label: 'Gmail', sub: 'gio@grscales.com', href: 'https://mail.google.com', icon: Mail, color: 'text-red-400' },
      { label: 'Vercel', sub: 'Deploys & hosting', href: 'https://vercel.com/gio-rivera-s-projects', icon: Triangle, color: 'text-zinc-300' },
      { label: 'GitHub', sub: 'gr-scale-os code', href: 'https://github.com/hayabusarivera23-ops/gr-scale-os', icon: Github, color: 'text-zinc-300' },
      { label: 'Google Business', sub: 'Local profile', href: 'https://business.google.com', icon: MapPin, color: 'text-amber-400' },
      { label: 'Calendly', sub: 'Set up account →', href: 'https://calendly.com/signup', icon: Calendar, color: 'text-sky-400', setup: true },
      { label: 'Stripe', sub: 'Set up account →', href: 'https://dashboard.stripe.com/register', icon: CreditCard, color: 'text-violet-400', setup: true },
    ],
  },
  {
    title: 'Marketing',
    tiles: [
      { label: 'Instagram', sub: 'Create page →', href: 'https://www.instagram.com', icon: Instagram, color: 'text-pink-400', setup: true },
      { label: 'Facebook', sub: 'Create page →', href: 'https://www.facebook.com/pages/create', icon: Facebook, color: 'text-blue-400', setup: true },
      { label: 'Outreach Log', sub: 'Track daily reps', href: '/outreach', icon: Phone, color: 'text-orange-400', internal: true },
    ],
  },
  {
    title: 'Analytics',
    tiles: [
      { label: 'Site Analytics', sub: 'Vercel traffic', href: 'https://vercel.com/gio-rivera-s-projects/gr-scale-os/analytics', icon: BarChart3, color: 'text-teal-400' },
      { label: 'Revenue', sub: 'Money dashboard', href: '/revenue', icon: DollarSign, color: 'text-emerald-400', internal: true },
    ],
  },
]

function TileCard({ t }: { t: Tile }) {
  const inner = (
    <div className={cn(
      'rounded-xl border bg-zinc-900/60 px-3 py-2.5 hover:border-zinc-600 transition h-full',
      t.setup ? 'border-dashed border-zinc-700' : 'border-zinc-800',
    )}>
      <div className="flex items-center gap-2">
        <t.icon className={cn('h-4 w-4 shrink-0', t.color)} />
        <div className="min-w-0">
          <p className="text-xs font-bold text-zinc-200 truncate">{t.label}</p>
          <p className={cn('text-[10px] truncate', t.setup ? 'text-amber-500/80' : 'text-zinc-600')}>{t.sub}</p>
        </div>
      </div>
    </div>
  )
  return t.internal
    ? <Link href={t.href}>{inner}</Link>
    : <a href={t.href} target="_blank" rel="noopener noreferrer">{inner}</a>
}

export default function MissionControl() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Globe className="h-4 w-4 text-sky-500" />
        <h2 className="text-sm font-black tracking-wide text-zinc-200 uppercase">Mission Control</h2>
        <span className="text-[10px] text-zinc-600 ml-auto">every shortcut, one tap</span>
      </div>
      <div className="space-y-3">
        {GROUPS.map(g => (
          <div key={g.title}>
            <p className="text-[10px] font-semibold tracking-wider text-zinc-600 uppercase mb-1.5">{g.title}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {g.tiles.map(t => <TileCard key={t.label} t={t} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
