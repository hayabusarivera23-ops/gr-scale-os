import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  try {
    const d = parseISO(dateStr)
    if (isToday(d)) return 'Today'
    if (isTomorrow(d)) return 'Tomorrow'
    return format(d, 'MMM d, yyyy')
  } catch {
    return dateStr
  }
}

export function isOverdue(dateStr?: string | null): boolean {
  if (!dateStr) return false
  try {
    return isPast(parseISO(dateStr)) && !isToday(parseISO(dateStr))
  } catch {
    return false
  }
}

export function getInitials(name?: string): string {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function getLeadScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-yellow-400'
  return 'text-red-400'
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    'New': 'bg-zinc-700 text-zinc-300',
    'Researching': 'bg-blue-900/50 text-blue-300',
    'Contacted': 'bg-indigo-900/50 text-indigo-300',
    'Interested': 'bg-violet-900/50 text-violet-300',
    'Appointment Set': 'bg-amber-900/50 text-amber-300',
    'Proposal Sent': 'bg-orange-900/50 text-orange-300',
    'Negotiating': 'bg-yellow-900/50 text-yellow-300',
    'Won': 'bg-emerald-900/50 text-emerald-300',
    'Lost': 'bg-red-900/50 text-red-400',
    'Planning': 'bg-zinc-700 text-zinc-300',
    'Design': 'bg-blue-900/50 text-blue-300',
    'Development': 'bg-violet-900/50 text-violet-300',
    'Content Collection': 'bg-amber-900/50 text-amber-300',
    'Client Review': 'bg-orange-900/50 text-orange-300',
    'Revision': 'bg-yellow-900/50 text-yellow-300',
    'Deployment': 'bg-sky-900/50 text-sky-300',
    'Completed': 'bg-emerald-900/50 text-emerald-300',
    'Active': 'bg-emerald-900/50 text-emerald-300',
    'Paused': 'bg-yellow-900/50 text-yellow-300',
    'Churned': 'bg-red-900/50 text-red-400',
    'Pending': 'bg-yellow-900/50 text-yellow-300',
    'Paid': 'bg-emerald-900/50 text-emerald-300',
    'Overdue': 'bg-red-900/50 text-red-400',
    'Sent': 'bg-blue-900/50 text-blue-300',
    'High': 'bg-red-900/50 text-red-400',
    'Medium': 'bg-amber-900/50 text-amber-300',
    'Low': 'bg-zinc-700 text-zinc-400',
    'Current': 'bg-emerald-900/50 text-emerald-300',
  }
  return map[status] ?? 'bg-zinc-700 text-zinc-300'
}
