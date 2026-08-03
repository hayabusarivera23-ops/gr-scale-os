import { createClient, type User } from '@supabase/supabase-js'
import type { HvacPipelineStage, LocalApproval } from './business'
import type { DailyGrowthLog } from './personal'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

const businessClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export type BusinessTable = 'leads' | 'pipeline_events' | 'sends' | 'approvals' | 'content_kits'
export type PersonalTable = 'gio_checkins' | 'gio_food_logs' | 'gio_workouts' | 'gio_water' | 'gio_faith' | 'gio_watch_metrics'

export interface BusinessLeadRow {
  id?: string
  name: string
  contact_name?: string | null
  phone?: string | null
  email?: string | null
  site_url?: string | null
  niche?: string
  flaws?: string[]
  stage?: HvacPipelineStage
  heat?: number
  last_touch?: string | null
  next_touch?: string | null
  notes?: string | null
}

export interface BusinessApprovalRow {
  id?: string
  kind: LocalApproval['kind']
  lead_id?: string | null
  title: string
  body?: string | null
  status?: LocalApproval['status']
  created_by?: string
}

export function isBusinessMemoryConnected() {
  return Boolean(businessClient)
}

export function isPersonalMemoryConnected() {
  return Boolean(businessClient)
}

export async function getCurrentUser() {
  if (!businessClient) return null
  const { data } = await businessClient.auth.getUser()
  return data.user
}

export function onAuthChanged(callback: (user: User | null) => void) {
  if (!businessClient) return () => undefined
  const { data } = businessClient.auth.onAuthStateChange((_event, session) => callback(session?.user ?? null))
  return () => data.subscription.unsubscribe()
}

export async function signInWithEmail(email: string) {
  if (!businessClient) return { error: new Error('Supabase is not connected.') }
  return businessClient.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/gio#track` : undefined },
  })
}

export async function signOutOfMemory() {
  if (!businessClient) return { error: new Error('Supabase is not connected.') }
  return businessClient.auth.signOut()
}

export async function listBusinessLeads() {
  if (!businessClient) return { data: [] as BusinessLeadRow[], error: null }
  return businessClient.from('leads').select('*').order('created_at', { ascending: false })
}

export async function saveBusinessLead(lead: BusinessLeadRow) {
  if (!businessClient) return { data: null, error: new Error('Supabase is not connected.') }
  return businessClient.from('leads').upsert(lead).select('*').single()
}

export async function saveBusinessApproval(approval: BusinessApprovalRow) {
  if (!businessClient) return { data: null, error: new Error('Supabase is not connected.') }
  return businessClient.from('approvals').insert(approval).select('*').single()
}

export async function logBusinessPipelineEvent(leadId: string, event: string, detail?: string) {
  if (!businessClient) return { data: null, error: new Error('Supabase is not connected.') }
  return businessClient.from('pipeline_events').insert({ lead_id: leadId, event, detail })
}

export async function saveGioCheckin(log: DailyGrowthLog) {
  if (!businessClient) return { error: new Error('Supabase is not connected.') }
  return businessClient.from('gio_checkins').upsert({
    date: log.date,
    weight: log.weight || null,
    sleep: log.sleep || null,
    energy: log.energy || null,
    soreness: log.soreness || null,
    mood: log.mood || null,
    injury: log.injury || null,
    pushups: log.pushups || null,
    pullups: log.pullups || null,
    plank: log.plank || null,
    workout: log.workout || null,
    business_win: log.businessWin || null,
  }, { onConflict: 'user_id,date' })
}

export async function saveGioWater(date: string, count: number) {
  if (!businessClient) return { error: new Error('Supabase is not connected.') }
  return businessClient.from('gio_water').upsert({ date, count }, { onConflict: 'user_id,date' })
}

export async function saveGioFaith(date: string, faith: string) {
  if (!businessClient) return { error: new Error('Supabase is not connected.') }
  return businessClient.from('gio_faith').upsert({ date, entry: faith }, { onConflict: 'user_id,date' })
}

export async function saveGioWatchMetrics(log: DailyGrowthLog) {
  if (!businessClient) return { error: new Error('Supabase is not connected.') }
  return businessClient.from('gio_watch_metrics').upsert({
    date: log.date,
    active_calories: log.appleActiveCalories || null,
    workout_minutes: log.appleWorkoutMinutes || null,
    avg_hr: log.appleAvgHr || null,
    resting_hr: log.appleRestingHr || null,
  }, { onConflict: 'user_id,date' })
}

export async function listGioCheckins() {
  if (!businessClient) return { data: [] as DailyGrowthLog[], error: null }
  const { data, error } = await businessClient
    .from('gio_checkins')
    .select('*')
    .order('date', { ascending: false })
    .limit(60)

  return {
    data: (data ?? []).map(row => ({
      date: row.date,
      weight: row.weight ?? undefined,
      sleep: row.sleep ?? undefined,
      energy: row.energy ?? undefined,
      soreness: row.soreness ?? undefined,
      mood: row.mood ?? undefined,
      injury: row.injury ?? undefined,
      pushups: row.pushups ?? undefined,
      pullups: row.pullups ?? undefined,
      plank: row.plank ?? undefined,
      workout: row.workout ?? undefined,
      businessWin: row.business_win ?? undefined,
    })),
    error,
  }
}

// No generic Supabase client is exported on purpose.
// Use explicit helpers only, so business and Gio OS personal memory cannot
// accidentally write arbitrary data to the wrong table.
