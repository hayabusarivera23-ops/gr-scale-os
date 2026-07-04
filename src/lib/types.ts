export type LeadStatus =
  | 'New' | 'Researching' | 'Contacted' | 'Interested'
  | 'Appointment Set' | 'Proposal Sent' | 'Negotiating' | 'Won' | 'Lost'

export type LeadSource =
  | 'Google Maps' | 'Instagram' | 'Facebook' | 'Referral'
  | 'Cold Call' | 'Email' | 'Other'

export type ProjectStatus =
  | 'Planning' | 'Design' | 'Development' | 'Content Collection'
  | 'Client Review' | 'Revision' | 'Deployment' | 'Completed'

export type TaskPriority = 'Low' | 'Medium' | 'High'
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed'

export type OutreachType = 'cold_call' | 'email' | 'dm' | 'voicemail' | 'text' | 'meeting'
export type OutreachOutcome =
  | 'no_answer' | 'voicemail' | 'not_interested' | 'interested'
  | 'appointment_set' | 'callback_requested' | 'sent' | 'opened' | 'replied'

export type DemoCategory =
  | 'HVAC' | 'Barber' | 'Roofing' | 'Plumbing' | 'Pressure Washing'
  | 'Landscaping' | 'Restaurant' | 'Automotive' | 'Other'

export type Package = 'Starter' | 'Growth' | 'Scale'
export type ClientStatus = 'Active' | 'Paused' | 'Completed' | 'Churned'
export type PaymentStatus = 'Current' | 'Overdue' | 'Pending'
export type InvoiceStatus = 'Pending' | 'Sent' | 'Paid' | 'Overdue'
export type InvoiceType = 'Deposit' | 'Final' | 'Retainer' | 'Other'

export interface Lead {
  id: string
  business_name: string
  owner_name?: string
  phone?: string
  email?: string
  website?: string
  industry: string
  city?: string
  state: string
  status: LeadStatus
  lead_source: LeadSource
  lead_score: number
  estimated_deal_value: number
  notes?: string
  call_notes?: string
  website_notes?: string
  pain_points?: string
  opportunity_notes?: string
  proposal_notes?: string
  last_contact_date?: string
  next_follow_up?: string
  created_at: string
  updated_at: string
}

export interface LeadTask {
  id: string
  lead_id: string
  title: string
  completed: boolean
  due_date?: string
  priority: TaskPriority
  created_at: string
}

export interface LeadActivity {
  id: string
  lead_id: string
  type: 'call' | 'email' | 'note' | 'meeting' | 'stage_change' | 'task'
  description: string
  created_at: string
}

export interface Client {
  id: string
  business_name: string
  owner_name?: string
  email?: string
  phone?: string
  website_url?: string
  package: Package
  monthly_value: number
  project_status: ClientStatus
  payment_status: PaymentStatus
  last_contact?: string
  renewal_date?: string
  notes?: string
  lead_id?: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  client_id?: string
  name: string
  status: ProjectStatus
  project_value: number
  deposit_paid: number
  final_payment_paid: boolean
  deadline?: string
  notes?: string
  deliverables?: string
  created_at: string
  updated_at: string
  client?: Client
}

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  due_date?: string
  related_lead_id?: string
  related_project_id?: string
  related_client_id?: string
  completed_at?: string
  created_at: string
  lead?: Pick<Lead, 'id' | 'business_name'>
}

export interface OutreachLog {
  id: string
  lead_id?: string
  type: OutreachType
  outcome?: OutreachOutcome
  notes?: string
  logged_at: string
  lead?: Pick<Lead, 'id' | 'business_name'>
}

export interface Invoice {
  id: string
  client_id?: string
  project_id?: string
  type: InvoiceType
  amount: number
  status: InvoiceStatus
  due_date?: string
  paid_at?: string
  notes?: string
  created_at: string
  client?: Pick<Client, 'id' | 'business_name'>
}

export interface Demo {
  id: string
  name: string
  url: string
  category: DemoCategory
  description?: string
  thumbnail_url?: string
  is_active: boolean
  created_at: string
}

export interface DashboardStats {
  totalLeads: number
  newLeads: number
  contactedLeads: number
  qualifiedLeads: number
  appointmentsSet: number
  proposalsSent: number
  closedDeals: number
  revenueClosed: number
  revenuePending: number
  projectsActive: number
  projectsCompleted: number
  tasksDueToday: number
  monthlyGoal: number
  mrr: number
}
