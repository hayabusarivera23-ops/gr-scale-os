'use client'

import { useState } from 'react'
import { Phone, Mail, MessageSquare, PhoneIncoming, Voicemail, Calendar, Plus, TrendingUp } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

// Day 1 — no outreach logged yet. Use "Log Activity" after every call or email.
const LOGS: {
  id: string; type: string; outcome: string; notes: string; logged_at: string; lead: string;
}[] = []

const TODAY_STATS = {
  calls: 0, answers: 0, voicemails: 0, emails: 0, responses: 0, appointments: 0,
}

const WEEK_STATS = {
  calls: 0, answers: 0, voicemails: 0, emails: 0, responses: 0, appointments: 0,
}

const outcomeLabel: Record<string, { label: string; color: string }> = {
  appointment_set: { label: 'Appt Set', color: 'bg-emerald-900/50 text-emerald-300' },
  interested: { label: 'Interested', color: 'bg-violet-900/50 text-violet-300' },
  not_interested: { label: 'Not Interested', color: 'bg-red-900/50 text-red-400' },
  voicemail: { label: 'Voicemail', color: 'bg-zinc-700 text-zinc-400' },
  no_answer: { label: 'No Answer', color: 'bg-zinc-700 text-zinc-500' },
  sent: { label: 'Sent', color: 'bg-blue-900/50 text-blue-300' },
  replied: { label: 'Replied', color: 'bg-sky-900/50 text-sky-300' },
  callback_requested: { label: 'Callback', color: 'bg-amber-900/50 text-amber-300' },
}

const typeIcon: Record<string, React.ElementType> = {
  cold_call: Phone, email: Mail, dm: MessageSquare,
  voicemail: Voicemail, text: MessageSquare, meeting: Calendar,
}

export default function OutreachPage() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today')
  const [showLog, setShowLog] = useState(false)
  const [logType, setLogType] = useState('cold_call')
  const [logOutcome, setLogOutcome] = useState('no_answer')
  const [logNote, setLogNote] = useState('')

  const stats = period === 'today' ? TODAY_STATS : WEEK_STATS
  const closeRate = stats.answers > 0 ? Math.round((stats.appointments / stats.answers) * 100) : 0

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="page-header">
        <div>
          <h2 className="page-title">Outreach Center</h2>
          <p className="text-sm text-zinc-600 mt-0.5">Track every call, email, and DM</p>
        </div>
        <button onClick={() => setShowLog(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Log Activity
        </button>
      </div>

      {/* Period toggle */}
      <div className="flex gap-1.5">
        {(['today', 'week', 'month'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={cn('rounded-lg px-4 py-1.5 text-sm font-medium transition capitalize',
              period === p ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-zinc-800/60 text-zinc-500 hover:text-zinc-300 border border-zinc-800')}>
            {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Calls Made', value: stats.calls, icon: Phone, color: 'text-sky-400' },
          { label: 'Answered', value: stats.answers, icon: PhoneIncoming, color: 'text-emerald-400' },
          { label: 'Voicemails', value: stats.voicemails, icon: Voicemail, color: 'text-zinc-400' },
          { label: 'Emails Sent', value: stats.emails, icon: Mail, color: 'text-violet-400' },
          { label: 'Responses', value: stats.responses, icon: MessageSquare, color: 'text-amber-400' },
          { label: 'Appointments', value: stats.appointments, icon: Calendar, color: 'text-orange-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card text-center">
            <Icon className={cn('h-5 w-5 mx-auto mb-2', color)} />
            <p className="text-2xl font-bold text-zinc-100">{value}</p>
            <p className="text-xs text-zinc-600 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Conversion metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Answer Rate', value: stats.calls > 0 ? `${Math.round((stats.answers / stats.calls) * 100)}%` : '0%' },
          { label: 'Close Rate (from answers)', value: `${closeRate}%` },
          { label: 'Target: calls/day', value: '20' },
          { label: 'Target: emails/day', value: '20' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-center">
            <p className="text-xl font-bold text-sky-400">{value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Log activity modal */}
      {showLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Log Outreach Activity</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Type</label>
                <select className="input-base" value={logType} onChange={e => setLogType(e.target.value)}>
                  {['cold_call', 'email', 'dm', 'voicemail', 'text', 'meeting'].map(t => (
                    <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Outcome</label>
                <select className="input-base" value={logOutcome} onChange={e => setLogOutcome(e.target.value)}>
                  {Object.entries(outcomeLabel).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Notes</label>
                <textarea className="input-base min-h-[80px] resize-none" value={logNote} onChange={e => setLogNote(e.target.value)} placeholder="What happened? What did they say?" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowLog(false)} className="btn-primary flex-1 justify-center">Log Activity</button>
                <button onClick={() => setShowLog(false)} className="btn-ghost">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity feed */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-sky-400" />
            <span className="text-sm font-semibold">Recent Activity</span>
          </div>
        </div>
        <div className="divide-y divide-zinc-800/50">
          {LOGS.map(log => {
            const Icon = typeIcon[log.type] ?? Phone
            const outcome = outcomeLabel[log.outcome] ?? { label: log.outcome, color: 'bg-zinc-700 text-zinc-400' }
            return (
              <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-zinc-800/20 transition">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 shrink-0">
                  <Icon className="h-3.5 w-3.5 text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-medium text-zinc-300">{log.lead}</span>
                    <span className={cn('badge', outcome.color)}>{outcome.label}</span>
                  </div>
                  <p className="text-sm text-zinc-500">{log.notes}</p>
                  <p className="text-xs text-zinc-700 mt-1">{new Date(log.logged_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                </div>
              </div>
            )
          })}
          {LOGS.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Phone className="h-8 w-8 text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-500">No outreach logged yet.</p>
              <p className="text-xs text-zinc-700 mt-1">Make your first call, then hit "Log Activity."</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
