'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, Calendar, CheckCircle, Circle, Plus } from 'lucide-react'
import { cn, formatDate, getStatusColor, isOverdue } from '@/lib/utils'
import { useOS, type OSTask } from '@/lib/store'

const VIEWS = ['Today', 'This Week', 'High Priority', 'In Progress', 'Overdue', 'Completed']

export default function TasksPage() {
  const { data, ready, update } = useOS()
  const [view, setView] = useState('Today')
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<OSTask['priority']>('High')

  const tasks = data.tasks
  const todayIso = new Date().toISOString().split('T')[0]
  const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

  function toggle(id: string) {
    update(current => ({
      ...current,
      tasks: current.tasks.map(task =>
        task.id === id ? { ...task, status: task.status === 'Completed' ? 'Pending' : 'Completed' } : task,
      ),
    }))
  }

  function addTask() {
    if (!newTitle.trim()) return
    const task: OSTask = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      description: '',
      status: 'Pending',
      priority: newPriority,
      due_date: todayIso,
      created_at: new Date().toISOString(),
    }
    update(current => ({ ...current, tasks: [...current.tasks, task] }))
    setNewTitle('')
  }

  const filtered = useMemo(() => {
    switch (view) {
      case 'Today': return tasks.filter(task => task.due_date === todayIso && task.status !== 'Completed')
      case 'This Week': return tasks.filter(task => task.due_date <= weekEnd && task.status !== 'Completed')
      case 'High Priority': return tasks.filter(task => task.priority === 'High' && task.status !== 'Completed')
      case 'In Progress': return tasks.filter(task => task.status === 'In Progress')
      case 'Overdue': return tasks.filter(task => task.due_date < todayIso && task.status !== 'Completed')
      case 'Completed': return tasks.filter(task => task.status === 'Completed')
      default: return tasks
    }
  }, [tasks, view, todayIso, weekEnd])

  const counts = useMemo(() => ({
    Today: tasks.filter(task => task.due_date === todayIso && task.status !== 'Completed').length,
    'This Week': tasks.filter(task => task.due_date <= weekEnd && task.status !== 'Completed').length,
    'High Priority': tasks.filter(task => task.priority === 'High' && task.status !== 'Completed').length,
    'In Progress': tasks.filter(task => task.status === 'In Progress').length,
    Overdue: tasks.filter(task => task.due_date < todayIso && task.status !== 'Completed').length,
    Completed: tasks.filter(task => task.status === 'Completed').length,
  }), [tasks, todayIso, weekEnd])

  if (!ready) return <div className="text-sm text-zinc-600 p-4">Loading...</div>

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="page-header">
        <div>
          <h2 className="page-title">Business Setup Tasks</h2>
          <p className="text-sm text-zinc-500 mt-1">Finish these once, then the dashboard becomes your daily control center.</p>
        </div>
      </div>

      <div className="flex gap-2">
        <input className="input-base flex-1" placeholder="Add a task..." value={newTitle}
          onChange={event => setNewTitle(event.target.value)} onKeyDown={event => event.key === 'Enter' && addTask()} />
        <select className="input-base w-32" value={newPriority} onChange={event => setNewPriority(event.target.value as OSTask['priority'])}>
          {['High', 'Medium', 'Low'].map(priority => <option key={priority}>{priority}</option>)}
        </select>
        <button onClick={addTask} className="btn-primary text-sm"><Plus className="h-4 w-4" /> Add</button>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {VIEWS.map(viewName => (
          <button key={viewName} onClick={() => setView(viewName)}
            className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition',
              view === viewName ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-zinc-800/60 text-zinc-500 hover:text-zinc-300 border border-zinc-800')}>
            {viewName === 'Overdue' && <AlertTriangle className="h-3 w-3" />}
            {viewName}
            {(counts as Record<string, number>)[viewName] > 0 && <span className={cn('ml-0.5 rounded-full px-1.5 py-0.5 text-[10px]', view === viewName ? 'bg-sky-500/30' : 'bg-zinc-700')}>{(counts as Record<string, number>)[viewName]}</span>}
          </button>
        ))}
      </div>

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
              </div>
              {task.description && (
                <p className="text-xs text-zinc-600 mt-1 leading-relaxed">{task.description}</p>
              )}
              <div className="flex items-center gap-1 mt-1.5">
                <Calendar className="h-3 w-3 text-zinc-700" />
                <span className={cn('text-xs', isOverdue(task.due_date) && task.status !== 'Completed' ? 'text-red-400 font-medium' : 'text-zinc-600')}>{formatDate(task.due_date)}</span>
              </div>
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
