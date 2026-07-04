'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn, formatCurrency, getStatusColor } from '@/lib/utils'

type PipelineStatus = 'New' | 'Researching' | 'Contacted' | 'Interested' | 'Appointment Set' | 'Proposal Sent' | 'Negotiating' | 'Won' | 'Lost'

interface PipelineLead {
  id: string
  business_name: string
  city: string
  status: PipelineStatus
  estimated_deal_value: number
  lead_score: number
}

const PIPELINE_STAGES: PipelineStatus[] = [
  'New', 'Contacted', 'Interested', 'Appointment Set', 'Proposal Sent', 'Negotiating', 'Won'
]

// Day 1 — all leads New or Researching. Nothing contacted yet.
const LEADS: PipelineLead[] = [
  { id: '1',  business_name: 'Cool Coast Heating & Cooling', city: 'Sarasota',       status: 'New',         estimated_deal_value: 750,  lead_score: 92 },
  { id: '2',  business_name: 'Aire Masters Heating & Air',   city: 'Ocala',           status: 'New',         estimated_deal_value: 750,  lead_score: 89 },
  { id: '7',  business_name: 'Premier Climate Control',      city: 'Jacksonville',    status: 'New',         estimated_deal_value: 2500, lead_score: 91 },
  { id: '5',  business_name: 'Sunshine HVAC Services',       city: 'Tampa',           status: 'New',         estimated_deal_value: 1500, lead_score: 85 },
  { id: '4',  business_name: 'Arctic Air Conditioning',      city: 'Orlando',         status: 'Researching', estimated_deal_value: 1500, lead_score: 78 },
  { id: '9',  business_name: 'Comfort Zone AC',              city: 'Lakeland',        status: 'New',         estimated_deal_value: 750,  lead_score: 70 },
  { id: '10', business_name: 'Elite HVAC Solutions',         city: 'Port St. Lucie',  status: 'Researching', estimated_deal_value: 1500, lead_score: 72 },
  { id: '3',  business_name: 'Fort Lauderdale AC Repair',    city: 'Fort Lauderdale', status: 'New',         estimated_deal_value: 750,  lead_score: 65 },
  { id: '6',  business_name: 'Breeze Masters AC',            city: 'Miami',           status: 'New',         estimated_deal_value: 750,  lead_score: 60 },
]

const STAGE_COLORS: Record<string, string> = {
  'New': 'border-zinc-700',
  'Contacted': 'border-indigo-500/40',
  'Interested': 'border-violet-500/40',
  'Appointment Set': 'border-amber-500/40',
  'Proposal Sent': 'border-orange-500/40',
  'Negotiating': 'border-yellow-500/40',
  'Won': 'border-emerald-500/40',
}

export default function PipelinePage() {
  const [leads, setLeads] = useState(LEADS)

  const stageLeads = (stage: string) => leads.filter(l => l.status === stage || (stage === 'New' && l.status === 'Researching' && stage === 'New'))

  const stageValue = (stage: string) => stageLeads(stage).reduce((s, l) => s + l.estimated_deal_value, 0)

  const totalPipelineValue = leads.filter(l => !['Won', 'Lost'].includes(l.status)).reduce((s, l) => s + l.estimated_deal_value, 0)

  return (
    <div className="space-y-5 max-w-full">
      <div className="page-header">
        <div>
          <h2 className="page-title">Pipeline</h2>
          <p className="text-sm text-zinc-600 mt-0.5">Total pipeline value: <span className="text-sky-400 font-semibold">{formatCurrency(totalPipelineValue)}</span></p>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex gap-3 overflow-x-auto pb-4 min-h-[60vh]">
        {PIPELINE_STAGES.map(stage => {
          const cards = leads.filter(l => {
            if (stage === 'New') return l.status === 'New' || l.status === 'Researching'
            return l.status === stage
          })
          const val = cards.reduce((s, l) => s + l.estimated_deal_value, 0)

          return (
            <div key={stage} className={cn('flex-shrink-0 w-60 rounded-xl border bg-zinc-900/40', STAGE_COLORS[stage])}>
              {/* Column header */}
              <div className="px-4 py-3 border-b border-zinc-800/60">
                <div className="flex items-center justify-between mb-1">
                  <span className={cn('badge', getStatusColor(stage))}>{stage}</span>
                  <span className="text-xs font-semibold text-zinc-500">{cards.length}</span>
                </div>
                <p className="text-xs text-zinc-600">{formatCurrency(val)}</p>
              </div>

              {/* Cards */}
              <div className="p-3 space-y-2 min-h-[200px]">
                {cards.map(lead => (
                  <Link key={lead.id} href={`/leads/${lead.id}`}
                    className="block rounded-lg border border-zinc-800 bg-zinc-800/60 p-3 hover:border-zinc-700 hover:bg-zinc-800 transition cursor-pointer">
                    <p className="text-sm font-medium text-zinc-200 leading-snug">{lead.business_name}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">{lead.city}, FL</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-sky-400">{formatCurrency(lead.estimated_deal_value)}</span>
                      <span className="text-xs text-zinc-600">Score: {lead.lead_score}</span>
                    </div>
                  </Link>
                ))}
                {cards.length === 0 && (
                  <div className="flex h-24 items-center justify-center">
                    <p className="text-xs text-zinc-700">Empty stage</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Pipeline stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Leads in Pipeline', value: leads.filter(l => l.status !== 'Won').length },
          { label: 'Hot Leads (Score 80+)', value: leads.filter(l => l.lead_score >= 80).length },
          { label: 'Pipeline Value', value: formatCurrency(totalPipelineValue) },
          { label: 'Avg Deal Size', value: formatCurrency(leads.reduce((s, l) => s + l.estimated_deal_value, 0) / leads.length) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="text-lg font-bold text-zinc-100 mt-1">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
