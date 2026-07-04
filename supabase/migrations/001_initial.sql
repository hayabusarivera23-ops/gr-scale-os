-- ============================================================
-- TURBO WEB CO OS — DATABASE SCHEMA v1
-- ============================================================

-- LEADS table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  owner_name TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  industry TEXT DEFAULT 'HVAC',
  city TEXT,
  state TEXT DEFAULT 'FL',
  status TEXT DEFAULT 'New' CHECK (status IN (
    'New','Researching','Contacted','Interested',
    'Appointment Set','Proposal Sent','Negotiating','Won','Lost'
  )),
  lead_source TEXT DEFAULT 'Google Maps' CHECK (lead_source IN (
    'Google Maps','Instagram','Facebook','Referral','Cold Call','Email','Other'
  )),
  lead_score INTEGER DEFAULT 50 CHECK (lead_score BETWEEN 0 AND 100),
  estimated_deal_value NUMERIC(10,2) DEFAULT 750,
  notes TEXT,
  call_notes TEXT,
  website_notes TEXT,
  pain_points TEXT,
  opportunity_notes TEXT,
  proposal_notes TEXT,
  last_contact_date DATE,
  next_follow_up DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEAD TASKS
CREATE TABLE IF NOT EXISTS lead_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  due_date DATE,
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEAD ACTIVITY
CREATE TABLE IF NOT EXISTS lead_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('call','email','note','meeting','stage_change','task')),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLIENTS
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  owner_name TEXT,
  email TEXT,
  phone TEXT,
  website_url TEXT,
  package TEXT DEFAULT 'Launch' CHECK (package IN ('Launch','Growth','Dominate')),
  monthly_value NUMERIC(10,2) DEFAULT 99,
  project_status TEXT DEFAULT 'Active' CHECK (project_status IN (
    'Active','Paused','Completed','Churned'
  )),
  payment_status TEXT DEFAULT 'Current' CHECK (payment_status IN (
    'Current','Overdue','Pending'
  )),
  last_contact DATE,
  renewal_date DATE,
  notes TEXT,
  lead_id UUID REFERENCES leads(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROJECTS
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'Planning' CHECK (status IN (
    'Planning','Design','Development','Content Collection',
    'Client Review','Revision','Deployment','Completed'
  )),
  project_value NUMERIC(10,2) NOT NULL,
  deposit_paid NUMERIC(10,2) DEFAULT 0,
  final_payment_paid BOOLEAN DEFAULT FALSE,
  deadline DATE,
  notes TEXT,
  deliverables TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OUTREACH LOGS
CREATE TABLE IF NOT EXISTS outreach_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN (
    'cold_call','email','dm','voicemail','text','meeting'
  )),
  outcome TEXT CHECK (outcome IN (
    'no_answer','voicemail','not_interested','interested',
    'appointment_set','callback_requested','sent','opened','replied'
  )),
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','In Progress','Completed')),
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High')),
  due_date DATE,
  related_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  related_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  related_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  type TEXT DEFAULT 'Deposit' CHECK (type IN ('Deposit','Final','Retainer','Other')),
  amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','Sent','Paid','Overdue')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DEMOS (website library)
CREATE TABLE IF NOT EXISTS demos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT DEFAULT 'HVAC' CHECK (category IN (
    'HVAC','Barber','Roofing','Plumbing','Pressure Washing',
    'Landscaping','Restaurant','Automotive','Other'
  )),
  description TEXT,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROPOSALS
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  package TEXT,
  scope TEXT,
  timeline TEXT,
  total_value NUMERIC(10,2),
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft','Sent','Accepted','Rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SETTINGS
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_next_follow_up ON leads(next_follow_up);
CREATE INDEX idx_leads_lead_score ON leads(lead_score DESC);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_outreach_logs_logged_at ON outreach_logs(logged_at DESC);
CREATE INDEX idx_invoices_status ON invoices(status);

-- UPDATED_AT triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
