'use client'

import { useState } from 'react'
import { DollarSign, TrendingUp, Clock, CheckCircle, Target } from 'lucide-react'
import { cn, formatCurrency, formatDate, getStatusColor } from '@/lib/utils'

// Day 1 — no revenue yet. Invoices are added when deals close.
const INVOICES: {
  id: string; type: string; amount: number; status: string;
  due_date?: string; paid_at?: string; notes?: string; client: string;
}[] = []

const MONTHLY_GOAL = 5000

const revenueClosed = 0
const revenuePending = 0
const mrr = 0

export default function RevenuePage() {
  const goalPct = Math.min(100, Math.round((revenueClosed / MONTHLY_GOAL) * 100))

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="page-header">
        <h2 className="page-title">Revenue</h2>
      </div>

      {/* Monthly goal */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-sky-400" />
            <span className="text-sm font-semibold">Monthly Goal</span>
          </div>
          <span className="text-sm font-bold text-zinc-100">{formatCurrency(revenueClosed)} <span className="text-zinc-600 font-normal">/ {formatCurrency(MONTHLY_GOAL)}</span></span>
        </div>
        <div className="h-3 w-full rounded-full bg-zinc-800">
          <div className="h-3 rounded-full bg-gradient-to-r from-sky-600 to-sky-400 transition-all duration-700" style={{ width: `${goalPct}%` }} />
        </div>
        <div className="flex justify-between mt-2">
          <p className="text-xs text-zinc-600">{goalPct}% of goal reached</p>
          <p className="text-xs text-zinc-600">{formatCurrency(MONTHLY_GOAL - revenueClosed)} remaining</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Revenue Closed', value: formatCurrency(revenueClosed), icon: CheckCircle, color: 'text-emerald-400', sub: 'This month' },
          { label: 'Revenue Pending', value: formatCurrency(revenuePending), icon: Clock, color: 'text-amber-400', sub: 'Proposals + finals' },
          { label: 'MRR', value: formatCurrency(mrr), icon: TrendingUp, color: 'text-sky-400', sub: 'Monthly retainers' },
          { label: 'Avg Project Value', value: '$0', icon: DollarSign, color: 'text-violet-400', sub: 'No projects yet' },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={cn('h-4 w-4', color)} />
              <span className="text-xs text-zinc-500">{label}</span>
            </div>
            <p className={cn('text-2xl font-bold', color)}>{value}</p>
            <p className="text-xs text-zinc-700 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Invoices */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between">
          <span className="text-sm font-semibold">Invoices</span>
          <button className="btn-primary text-xs py-1.5">+ New Invoice</button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {INVOICES.map(inv => (
              <tr key={inv.id}>
                <td className="font-medium text-zinc-200">{inv.client}</td>
                <td><span className="text-xs text-zinc-500">{inv.type}</span></td>
                <td><span className="font-semibold text-zinc-100">{formatCurrency(inv.amount)}</span></td>
                <td><span className={cn('badge', getStatusColor(inv.status))}>{inv.status}</span></td>
                <td><span className="text-xs text-zinc-500">{formatDate(inv.due_date)}</span></td>
                <td><span className="text-xs text-zinc-600 truncate max-w-[200px] block">{inv.notes}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800/60">
          <span className="text-xs text-zinc-600">Total invoiced: {formatCurrency(INVOICES.reduce((s, i) => s + i.amount, 0))}</span>
          <span className="text-xs text-emerald-400 font-medium">Collected: {formatCurrency(revenueClosed)}</span>
        </div>
      </div>

      {/* Revenue roadmap */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <p className="text-sm font-semibold mb-4">Revenue Roadmap</p>
        <div className="space-y-2">
          {[
            { label: 'Month 1 (Current)', target: 5000, current: revenueClosed, active: true },
            { label: 'Month 2', target: 8000, current: 0, active: false },
            { label: 'Month 3', target: 12000, current: 0, active: false },
          ].map(({ label, target, current, active }) => {
            const pct = Math.min(100, Math.round((current / target) * 100))
            return (
              <div key={label} className={cn('rounded-lg p-3', active ? 'border border-sky-500/20 bg-sky-500/5' : 'border border-zinc-800')}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={cn('text-sm font-medium', active ? 'text-sky-400' : 'text-zinc-500')}>{label}</span>
                  <span className="text-sm font-semibold text-zinc-300">{formatCurrency(current)} <span className="text-zinc-600 font-normal">/ {formatCurrency(target)}</span></span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-800">
                  <div className="h-1.5 rounded-full bg-sky-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
