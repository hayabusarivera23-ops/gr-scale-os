import type { LeadStatus, ProjectStatus, DemoCategory } from './types'

export const LEAD_STATUSES: LeadStatus[] = [
  'New', 'Researching', 'Contacted', 'Interested',
  'Appointment Set', 'Proposal Sent', 'Negotiating', 'Won', 'Lost'
]

export const PIPELINE_STATUSES: LeadStatus[] = [
  'New', 'Contacted', 'Interested', 'Appointment Set',
  'Proposal Sent', 'Negotiating', 'Won'
]

export const PROJECT_STATUSES: ProjectStatus[] = [
  'Planning', 'Design', 'Development', 'Content Collection',
  'Client Review', 'Revision', 'Deployment', 'Completed'
]

export const DEMO_CATEGORIES: DemoCategory[] = [
  'HVAC', 'Barber', 'Roofing', 'Plumbing', 'Pressure Washing',
  'Landscaping', 'Restaurant', 'Automotive', 'Other'
]

export const INDUSTRIES = [
  'HVAC', 'Barbershop', 'Roofing', 'Plumbing', 'Pressure Washing',
  'Landscaping', 'Restaurant', 'Automotive', 'Cleaning', 'Other'
]

export const MONTHLY_GOAL = 5000

export const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/leads', label: 'Leads', icon: 'Users' },
  { href: '/pipeline', label: 'Pipeline', icon: 'Kanban' },
  { href: '/outreach', label: 'Outreach', icon: 'Phone' },
  { href: '/projects', label: 'Projects', icon: 'FolderKanban' },
  { href: '/clients', label: 'Clients', icon: 'Building2' },
  { href: '/revenue', label: 'Revenue', icon: 'DollarSign' },
  { href: '/tasks', label: 'Tasks', icon: 'CheckSquare' },
  { href: '/demos', label: 'Demo Sites', icon: 'Globe' },
  { href: '/proposals', label: 'Proposals', icon: 'FileText' },
  { href: '/settings', label: 'Settings', icon: 'Settings' },
]
