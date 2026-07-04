'use client'

import { ExternalLink, Mail, Phone, Plus } from 'lucide-react'
import { cn, formatCurrency, formatDate, getStatusColor } from '@/lib/utils'

// Day 1 — no clients yet. Add clients here when a deal closes.
const CLIENTS: {
  id: string; business_name: string; owner_name?: string; email?: string; phone?: string;
  website_url?: string; package: string; monthly_value: number; project_status: string;
  payment_status: string; last_contact?: string; renewal_date?: string; notes?: string;
  created_at: string; updated_at: string;
}[] = []

export default function ClientsPage() {
  const mrr = CLIENTS.filter(c => c.project_status === 'Active').reduce((s, c) => s + c.monthly_value, 0)
  const overdue = CLIENTS.filter(c => c.payment_status === 'Overdue').length

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="page-header">
        <div>
          <h2 className="page-title">Clients</h2>
          <p className="text-sm text-zinc-600 mt-0.5">{CLIENTS.length} active client{CLIENTS.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary"><Plus className="h-4 w-4" /> Add Client</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Clients', value: CLIENTS.length },
          { label: 'MRR', value: formatCurrency(mrr) },
          { label: 'Active Projects', value: CLIENTS.filter(c => c.project_status === 'Active').length },
          { label: 'Payment Overdue', value: overdue, urgent: overdue > 0 },
        ].map(({ label, value, urgent }) => (
          <div key={label} className={cn('rounded-xl border p-4', urgent ? 'border-red-500/30 bg-red-500/5' : 'border-zinc-800 bg-zinc-900/60')}>
            <p className="text-xs text-zinc-500">{label}</p>
            <p className={cn('text-xl font-bold mt-1', urgent ? 'text-red-400' : 'text-zinc-100')}>{value}</p>
          </div>
        ))}
      </div>

      {/* Client cards */}
      <div className="space-y-3">
        {CLIENTS.map(client => (
          <div key={client.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 hover:border-zinc-700 transition">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-semibold text-zinc-100 text-base">{client.business_name}</h3>
                {client.owner_name && <p className="text-sm text-zinc-500">{client.owner_name}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={cn('badge', getStatusColor(client.project_status))}>{client.project_status}</span>
                <span className={cn('badge', getStatusColor(client.payment_status))}>{client.payment_status}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-zinc-600">Package</p>
                <p className="text-sm font-medium text-zinc-200 mt-0.5">{client.package}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-600">Monthly Retainer</p>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">{formatCurrency(client.monthly_value)}/mo</p>
              </div>
              <div>
                <p className="text-xs text-zinc-600">Last Contact</p>
                <p className="text-sm text-zinc-300 mt-0.5">{formatDate(client.last_contact)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-600">Renewal Date</p>
                <p className="text-sm text-zinc-300 mt-0.5">{formatDate(client.renewal_date)}</p>
              </div>
            </div>

            {client.notes && (
              <p className="text-xs text-zinc-600 mb-4 italic">"{client.notes}"</p>
            )}

            <div className="flex items-center gap-2">
              {client.phone && (
                <a href={`tel:${client.phone}`} className="btn-ghost text-xs"><Phone className="h-3.5 w-3.5" />{client.phone}</a>
              )}
              {client.email && (
                <a href={`mailto:${client.email}`} className="btn-ghost text-xs"><Mail className="h-3.5 w-3.5" /> Email</a>
              )}
              {client.website_url && (
                <a href={client.website_url} target="_blank" rel="noreferrer" className="btn-ghost text-xs"><ExternalLink className="h-3.5 w-3.5" /> Website</a>
              )}
            </div>
          </div>
        ))}

        {CLIENTS.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-zinc-800">
            <p className="text-sm text-zinc-500">No clients yet.</p>
            <p className="text-xs text-zinc-700 mt-1">Close your first deal in the pipeline to add a client.</p>
          </div>
        )}
      </div>
    </div>
  )
}
