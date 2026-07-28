'use client'

import {
  BarChart3,
  Bot,
  Calendar,
  CreditCard,
  DollarSign,
  Facebook,
  FileInput,
  Github,
  Globe,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Shield,
  Triangle,
  Zap,
} from 'lucide-react'
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
      { label: 'Dashboard', sub: 'Private OS', href: 'https://gr-scale-os.vercel.app', icon: Shield, color: 'text-violet-400' },
      { label: 'Demo Gallery', sub: '13 niche demos', href: 'https://gr-scale-demos.vercel.app', icon: Globe, color: 'text-teal-400' },
      { label: 'LexTheBarber', sub: 'Proof site', href: 'https://lexthebarber.com', icon: Globe, color: 'text-emerald-400' },
    ],
  },
  {
    title: 'Business Tools',
    tiles: [
      { label: 'Zoho Mail', sub: 'gio@grscales.com', href: 'https://mail.zoho.com', icon: Mail, color: 'text-red-400' },
      { label: 'Phone', sub: 'business number', href: 'https://voice.google.com', icon: Phone, color: 'text-emerald-400', setup: true },
      { label: 'Calendly', sub: 'Free Website Audit', href: 'https://calendly.com/gio-grscales/free-website-audit-20-min', icon: Calendar, color: 'text-sky-400' },
      { label: 'Stripe', sub: 'payment links', href: 'https://dashboard.stripe.com/payment-links', icon: CreditCard, color: 'text-violet-400', setup: true },
      { label: 'Formspree', sub: 'lead forms', href: 'https://formspree.io', icon: FileInput, color: 'text-emerald-400', setup: true },
      { label: 'Google Business', sub: 'verify profile', href: 'https://business.google.com', icon: MapPin, color: 'text-amber-400', setup: true },
    ],
  },
  {
    title: 'Build And Hosting',
    tiles: [
      { label: 'Vercel', sub: 'deploys & env vars', href: 'https://vercel.com/gio-rivera-s-projects', icon: Triangle, color: 'text-zinc-300' },
      { label: 'GitHub', sub: 'gr-scale-os repo', href: 'https://github.com/hayabusarivera23-ops/gr-scale-os', icon: Github, color: 'text-zinc-300' },
      { label: 'Cloudflare', sub: 'DNS & domain', href: 'https://dash.cloudflare.com', icon: Shield, color: 'text-orange-400' },
    ],
  },
  {
    title: 'AI Team',
    tiles: [
      { label: 'ChatGPT', sub: 'Codex + planning', href: 'https://chatgpt.com', icon: Bot, color: 'text-emerald-400' },
      { label: 'Claude', sub: 'drafts + research', href: 'https://claude.ai', icon: MessageCircle, color: 'text-amber-400' },
      { label: 'Dispatch Desk', sub: 'send work orders', href: '/dispatch', icon: Zap, color: 'text-sky-400', internal: true },
    ],
  },
  {
    title: 'Marketing',
    tiles: [
      { label: 'Instagram', sub: 'create @grscales', href: 'https://www.instagram.com', icon: Instagram, color: 'text-pink-400', setup: true },
      { label: 'Facebook', sub: 'create page', href: 'https://www.facebook.com/pages/create', icon: Facebook, color: 'text-blue-400', setup: true },
      { label: 'Outreach Log', sub: 'track daily reps', href: '/outreach', icon: Phone, color: 'text-orange-400', internal: true },
    ],
  },
  {
    title: 'Analytics',
    tiles: [
      { label: 'Site Analytics', sub: 'Vercel traffic', href: 'https://vercel.com/gio-rivera-s-projects/gr-scale-os/analytics', icon: BarChart3, color: 'text-teal-400' },
      { label: 'Revenue', sub: 'money dashboard', href: '/revenue', icon: DollarSign, color: 'text-emerald-400', internal: true },
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
        {GROUPS.map(group => (
          <div key={group.title}>
            <p className="text-[10px] font-semibold tracking-wider text-zinc-600 uppercase mb-1.5">{group.title}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {group.tiles.map(tile => <TileCard key={tile.label} t={tile} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
