'use client'

import { useState, useMemo } from 'react'
import { CheckCircle, Circle, Plus, AlertTriangle, Calendar } from 'lucide-react'
import { cn, formatDate, getStatusColor, isOverdue } from '@/lib/utils'

// Day 1 task list — pre-outreach setup. Nothing should be in "In Progress" yet.
// Complete all of these before making your first call.
const SEED_TASKS = [
  { id: '1', title: 'Set up Stripe account', description: 'stripe.com → Business info → Add bank account → Test payment link. You need this before any client can pay you.', status: 'Pending', priority: 'High', due_date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: '2', title: 'Create free Calendly link', description: 'calendly.com → Create "10-min intro call" event → Copy the link. You\'ll use this to book close calls.', status: 'Pending', priority: 'High', due_date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: '3', title: 'Record 60-sec Loom of acorlandohvac.com', description: 'Open Loom → screen record → show mobile view, click-to-call button, quote form, fast load. This is your demo video.', status: 'Pending', priority: 'High', due_date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: '4', title: 'Run audit: Cool Coast Heating & Cooling', description: 'Go to /audit → Enter coolcoast.net → Score all 6 dimensions → Copy the sales angle → Come back and call.', status: 'Pending', priority: 'High', due_date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: '5', title: 'Run audit: Aire Masters Heating & Air', description: 'Go to /audit → Enter airemasters.com → Score 6 dimensions. Note: title tag currently says "Brien for County Commissioner."', status: 'Pending', priority: 'High', due_date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: '6', title: 'Make first cold call: Cool Coast H&C', description: 'After audit is done: call (941) 623-4518. Open with the specific issue from your audit. Ask to text them the Loom.', status: 'Pending', priority: 'High', due_date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: '7', title: 'Make first cold call: Aire Masters', description: 'After audit: call (352) 414-6556. Lead with the title tag issue. Ask to send a 60-sec video showing the problem.', status: 'Pending', priority: 'High', due_date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: '8', title: 'Add 10 more FL HVAC leads to CRM', description: 'Google Maps: search "HVAC" in Gainesville, Pensacola, Tallahassee. Rank 10-30 only (top 10 already have good sites). Add here.', status: 'Pending', priority: 'Medium', due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: '9', title: 'Call no-website leads: Breeze Masters + Comfort Zone', description: 'Both have no website at all. Pitch is simple: "I can build you a site like this → send acorlandohvac.com link."', status: 'Pending', priority: 'Medium', due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: '10', title: 'Write one-page proposal template', description: 'Google Doc. Include: what\'s included, price, timeline (7 days), payment terms (50% deposit), Stripe link. Reusable for every deal.', status: 'Pending', priority: 'Medium', due_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], created_at: new Date().toISOString() },
]

const VIEWS = ['Today', 'This Week', 'High Priority', 'In Progress', 'Overdue', 'Completed']

export default function TasksPage() {
  const [tasks, setTasks] = useState(SEED_TASKS)
  const [view, setView] = useState('Today')
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState('High')

  function toggle(id: string) {
    setTasks(t => t.map(task =>
      task.id === id ? { ...task, status: task.status === 'Completed' ? 'Pending' : 'Completed' } : task
    ))
  }

  function addTask() {
    if (!newTitle.trim()) return
    setTasks(t => [...t, {
      id: Date.now().toString(), title: newTitle, description: '',
      status: 'Pending', priority: newPriority,
      due_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    }])
    setNewTitle('')
  }

  const today = new Date().toISOString().split('T')[0]
  const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

  const filtered = useMemo(() => {
    switch (view) {
      case 'Today': return tasks.filter(t => t.due_date === today && t.status !== 'Completed')
      case 'This Week': return tasks.filter(t => t.due_date <= weekEnd && t.status !== 'Completed')
      case 'High Priority': return tasks.filter(t => t.priority === 'High' && t.status !== 'Completed')
      case 'In Progress': return tasks.filter(t => t.status === 'In Progress')
      case 'Overdue': return tasks.filter(t => t.due_date < today && t.status !== 'Completed')
      case 'Completed': return tasks.filter(t => t.status === 'Completed')
      default: return tasks
    }
  }, [tasks, view, today, weekEnd])

  const counts = useMemo(() => ({
    Today: tasks.filter(t => t.due_date === today && t.status !== 'Completed').length,
    'This Week': tasks.filter(t => t.due_date <= weekEnd && t.status !== 'Completed').length,
    'High Priority': tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length,
    'In Progress': tasks.filter(t => t.status === 'In Progress').length,
    Overdue: tasks.filter(t => t.due_date < today && t.status !== 'Completed').length,
    Completed: tasks.filter(t => t.status === 'Completed').length,
  }), [tasks, today, weekEnd])

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="page-header">
        <h2 className="page-title">Tasks</h2>
      </div>

      {/* Add task */}
      <div className="flex gap-2">
        <input className="input-base flex-1" placeholder="Add a task..." value={newTitle}
          onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} />
        <select className="input-base w-32" value={newPriority} onChange={e => setNewPriority(e.target.value)}>
          {['High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
        </select>
        <button onClick={addTask} className="btn-primary text-sm"><Plus className="h-4 w-4" /> Add</button>
      </div>

      {/* Views */}
      <div className="flex gap-1.5 flex-wrap">
        {VIEWS.map(v => (
          <button key={v} onClick={() => setView(v)}
            className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition',
              view === v ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-zinc-800/60 text-zinc-500 hover:text-zinc-300 border border-zinc-800')}>
            {v === 'Overdue' && <AlertTriangle className="h-3 w-3" />}
            {v}
            {(counts as any)[v] > 0 && <span className={cn('ml-0.5 rounded-full px-1.5 py-0.5 text-[10px]', view === v ? 'bg-sky-500/30' : 'bg-zinc-700')}>{(counts as any)[v]}</span>}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {filtered.map(task => (
          <div key={task.id}
            className={cn('flex items-start gap-3 rounded-xl border p-4 transition',
              task.status === 'Completed' ? 'border-zinc-800/40 opacity-50' : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700')}>
            <button onClick={() => toggle(task.id)} className="shrink-0 mt-0.5">
              {task.status === 'Completed'
                ? <CheckCircle className="h-5 w-5 text-emerald-400" />
                : <Circle className="h-5 w-5 text-zinc-600 hover:text-sky-400 transition" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className={cn('text-sm font-medium', task.status === 'Completed' ? 'line-through text-zinc-600' : 'text-zinc-100')}>{task.title}</p>
                <span className={cn('badge', getStatusColor(task.priority))}>{task.priority}</span>
                {task.status === 'In Progress' && <span className="badge bg-sky-900/50 text-sky-300">In Progress</span>}
              </div>
              {task.description && (
                <p className="text-xs text-zinc-600 mt-1 leading-relaxed">{task.description}</p>
              )}
              {task.due_date && (
                <div className="flex items-center gap-1 mt-1.5">
                  <Calendar className="h-3 w-3 text-zinc-700" />
                  <span className={cn('text-xs', isOverdue(task.due_date) && task.status !== 'Completed' ? 'text-red-400 font-medium' : 'text-zinc-600')}>{formatDate(task.due_date)}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <CheckCircle className="h-8 w-8 text-emerald-500/40 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">
              {view === 'Completed' ? 'No completed tasks yet.' : 'No tasks in this view.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
