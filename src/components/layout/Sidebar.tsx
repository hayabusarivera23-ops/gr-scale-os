'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Kanban, Phone, FolderKanban,
  Building2, DollarSign, CheckSquare, Globe, FileText,
  Settings, Zap, ChevronRight, Search, Target,
  Inbox, ListChecks, MessageSquare, LibraryBig, Radar, Compass,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Users, Kanban, Phone, FolderKanban,
  Building2, DollarSign, CheckSquare, Globe, FileText,
  Settings, Zap, Search, Target, Inbox, ListChecks,
  MessageSquare, LibraryBig, Radar, Compass,
}

interface NavItem {
  href: string
  label: string
  icon: string
  highlight?: boolean
  section?: string   // section divider label
}

const NAV: NavItem[] = [
  // ── Execution Layer ──
  { href: '/start-here', label: 'Start Here',      icon: 'Compass',        highlight: true  },
  { href: '/',          label: 'Dashboard',       icon: 'LayoutDashboard' },
  { href: '/inbox',     label: 'Lead Inbox',      icon: 'Inbox',          highlight: true  },
  { href: '/queue',     label: 'Work Queue',      icon: 'ListChecks',     highlight: true  },
  { href: '/workspace', label: 'Workspace',       icon: 'MessageSquare',  highlight: true  },
  // ── Discover ──
  { href: '/discover',  label: 'Lead Discovery',  icon: 'Radar',          highlight: true  },
  // ── CRM ──
  { href: '/command',   label: 'Command Center',  icon: 'Target'     },
  { href: '/leads',     label: 'Leads',           icon: 'Users'      },
  { href: '/audit',     label: 'Audit Engine',    icon: 'Search'     },
  { href: '/pipeline',  label: 'Pipeline',        icon: 'Kanban'     },
  // ── Build ──
  { href: '/demos',     label: 'Demo Builder',    icon: 'Globe'      },
  { href: '/templates', label: 'Templates',       icon: 'LibraryBig' },
  // ── Ops ──
  { href: '/outreach',  label: 'Outreach Log',    icon: 'Phone'      },
  { href: '/projects',  label: 'Projects',        icon: 'FolderKanban' },
  { href: '/clients',   label: 'Clients',         icon: 'Building2'  },
  { href: '/revenue',   label: 'Revenue',         icon: 'DollarSign' },
  { href: '/tasks',     label: 'Tasks',           icon: 'CheckSquare'},
  { href: '/proposals', label: 'Proposals',       icon: 'FileText'   },
  { href: '/settings',  label: 'Settings',        icon: 'Settings'   },
]

// Group into sections for visual separation
const SECTIONS = [
  { label: 'Execute',  items: NAV.filter(n => ['/start-here', '/', '/inbox', '/queue', '/workspace'].includes(n.href)) },
  { label: 'Discover', items: NAV.filter(n => ['/discover'].includes(n.href)) },
  { label: 'CRM',      items: NAV.filter(n => ['/command', '/leads', '/audit', '/pipeline'].includes(n.href)) },
  { label: 'Build',    items: NAV.filter(n => ['/demos', '/templates'].includes(n.href)) },
  { label: 'Ops',      items: NAV.filter(n => ['/outreach', '/projects', '/clients', '/revenue', '/tasks', '/proposals', '/settings'].includes(n.href)) },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 border-r border-zinc-800/80 bg-[#0d0d0f] flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-zinc-800/80">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-none">GR Scale</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Operating System</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {SECTIONS.map(section => (
          <div key={section.label} className="mb-4">
            <p className="px-3 mb-1 text-[9px] font-bold uppercase tracking-widest text-zinc-700">{section.label}</p>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const Icon = iconMap[item.icon]
                const active = item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all group',
                      active
                        ? 'bg-sky-500/10 text-sky-400 font-medium'
                        : item.highlight && !active
                          ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                          : 'text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/60'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0',
                      active ? 'text-sky-400' : item.highlight ? 'text-amber-400' : 'text-zinc-500 group-hover:text-zinc-300')} />
                    <span className="flex-1 text-sm">{item.label}</span>
                    {active && <ChevronRight className="h-3 w-3 text-sky-500/60" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-800/80 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 text-xs font-semibold">
            G
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-300">Gio</p>
            <p className="text-[10px] text-zinc-600">Founder & CEO</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
