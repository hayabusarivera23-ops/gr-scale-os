'use client'

import { useState } from 'react'
import { Save, Building2, Package, Users, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = ['Agency', 'Packages', 'Brand', 'Team']

export default function SettingsPage() {
  const [tab, setTab] = useState('Agency')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="page-header">
        <h2 className="page-title">Settings</h2>
        <button onClick={handleSave} className={cn('btn-primary', saved && 'bg-emerald-600 hover:bg-emerald-500')}>
          <Save className="h-4 w-4" /> {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800">
        <div className="flex gap-0">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px',
                tab === t ? 'border-sky-500 text-sky-400' : 'border-transparent text-zinc-500 hover:text-zinc-300')}>
              {t === 'Agency' && <Building2 className="h-3.5 w-3.5" />}
              {t === 'Packages' && <Package className="h-3.5 w-3.5" />}
              {t === 'Brand' && <Palette className="h-3.5 w-3.5" />}
              {t === 'Team' && <Users className="h-3.5 w-3.5" />}
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'Agency' && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-300">Agency Information</h3>
          {[
            { label: 'Agency Name', defaultValue: 'GR Scale', placeholder: 'Your agency name' },
            { label: 'Tagline', defaultValue: 'HVAC Websites That Convert', placeholder: 'Your tagline' },
            { label: 'Your Name', defaultValue: 'Gio', placeholder: 'Your name' },
            { label: 'Email', defaultValue: 'gio@grscale.com', placeholder: 'Contact email' },
            { label: 'Phone', defaultValue: '(407) 555-0100', placeholder: 'Business phone' },
            { label: 'City', defaultValue: 'Orlando', placeholder: 'City' },
            { label: 'State', defaultValue: 'FL', placeholder: 'State' },
          ].map(({ label, defaultValue, placeholder }) => (
            <div key={label}>
              <label className="text-xs text-zinc-500 mb-1.5 block">{label}</label>
              <input className="input-base" defaultValue={defaultValue} placeholder={placeholder} />
            </div>
          ))}
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block">Monthly Revenue Goal ($)</label>
            <input className="input-base" defaultValue="5000" type="number" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block">Primary Niche</label>
            <select className="input-base">
              <option>HVAC</option>
              <option>Barbershop</option>
              <option>Roofing</option>
              <option>Plumbing</option>
              <option>General Local Business</option>
            </select>
          </div>
        </div>
      )}

      {tab === 'Packages' && (
        <div className="space-y-4">
          {[
            { name: 'Starter', price: 99, description: '$99/mo — hosting, website updates, small edits, backups' },
            { name: 'Growth', price: 299, description: '$299/mo — Starter + local SEO, GBP updates, monthly performance reports' },
            { name: 'Scale', price: 599, description: '$599+/mo — Growth + advanced SEO, landing pages, AI chatbot, reputation mgmt, lead tracking, consulting' },
          ].map(pkg => (
            <div key={pkg.name} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">Package Name</label>
                  <input className="input-base" defaultValue={pkg.name} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">Price ($)</label>
                  <input className="input-base" defaultValue={pkg.price} type="number" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">Type</label>
                  <select className="input-base">
                    <option>One-time</option>
                    <option>Monthly</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="text-xs text-zinc-500 mb-1.5 block">Description</label>
                  <input className="input-base" defaultValue={pkg.description} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Brand' && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-5">
          <h3 className="text-sm font-semibold text-zinc-300">Brand Colors</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Primary Color', value: '#0ea5e9' },
              { label: 'Accent Color', value: '#6366f1' },
              { label: 'Background', value: '#0a0a0b' },
              { label: 'Text Color', value: '#f4f4f5' },
            ].map(({ label, value }) => (
              <div key={label}>
                <label className="text-xs text-zinc-500 mb-1.5 block">{label}</label>
                <div className="flex gap-2">
                  <input type="color" defaultValue={value} className="h-9 w-9 rounded border border-zinc-700 bg-zinc-800 cursor-pointer" />
                  <input className="input-base flex-1" defaultValue={value} />
                </div>
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block">Agency Logo URL</label>
            <input className="input-base" placeholder="https://your-logo.com/logo.png" />
          </div>
        </div>
      )}

      {tab === 'Team' && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-300">Team Members</h3>
            <button className="btn-primary text-xs py-1.5">+ Invite</button>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/40 border border-zinc-800">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 font-semibold">G</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-200">Gio</p>
              <p className="text-xs text-zinc-600">hayabusa.rivera23@gmail.com</p>
            </div>
            <span className="badge bg-sky-900/50 text-sky-300">Founder</span>
          </div>
          <p className="text-xs text-zinc-700 mt-4 text-center">Add team members once you reach $5K/mo.</p>
        </div>
      )}
    </div>
  )
}
