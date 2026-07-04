'use client'

import { Bell, Search } from 'lucide-react'
import { usePathname } from 'next/navigation'

const PAGE_TITLES: Record<string, string> = {
  '/start-here': 'Start Here',
  '/':           'Founder Dashboard',
  '/inbox':      'Lead Inbox',
  '/queue':      'Work Queue',
  '/workspace':  'Outreach Workspace',
  '/discover':   'Lead Discovery',
  '/command':    'Lead Command Center',
  '/leads':      'Lead CRM',
  '/audit':      'Website Audit Engine',
  '/pipeline':   'Pipeline',
  '/outreach':   'Outreach Log',
  '/projects':   'Projects',
  '/clients':    'Clients',
  '/revenue':    'Revenue',
  '/tasks':      'Tasks',
  '/demos':      'Demo Builder',
  '/templates':  'Template Library',
  '/proposals':  'Proposals',
  '/settings':   'Settings',
}

export default function Header() {
  const pathname = usePathname()
  const title = PAGE_TITLES[pathname] ?? PAGE_TITLES[Object.keys(PAGE_TITLES).find(k => pathname.startsWith(k) && k !== '/') ?? '/'] ?? 'GR Scale OS'

  const now = new Date()
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const date = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-zinc-800/80 bg-[#0a0a0b]/95 px-6 backdrop-blur">
      <div className="flex-1">
        <h1 className="text-base font-semibold text-zinc-100">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-sm text-zinc-500">
          <Search className="h-3.5 w-3.5" />
          <span className="text-xs">Search...</span>
          <kbd className="ml-2 rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-600">⌘K</kbd>
        </div>
        <span className="hidden lg:block text-xs text-zinc-600">{date} · {time}</span>
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg hover:bg-zinc-800 transition text-zinc-500 hover:text-zinc-300">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-sky-500" />
        </button>
      </div>
    </header>
  )
}
