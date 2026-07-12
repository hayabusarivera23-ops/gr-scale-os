/**
 * GR Scale OS — Prompt Engine
 *
 * SINGLE SOURCE OF TRUTH for every prompt Mission Control generates for
 * Claude. Each builder returns a COMPLETE, self-contained prompt: full
 * business context baked in, so Claude can run it with ZERO extra context.
 *
 * ARCHITECTURE: this site never calls an API and never sends anything itself.
 * Gio copies a prompt → pastes it into Claude → Claude does the work and
 * reports back. Every prompt ends with a report-back instruction so Gio can
 * log the result in the Command Queue and Claude can update the activity feed.
 */

// ─── Business context (baked into every prompt) ──────────────────────────────

export const BUSINESS_CONTEXT = `BUSINESS CONTEXT — GR Scale (read this first, it is everything you need):
- GR Scale is Gio Rivera's web agency: websites for local service businesses, nationwide. Site: grscales.com · Email: gio@grscales.com · Phone: (813) 869-5917.
- Packages: Starter $99/mo (hosting, updates, edits, backups) · Growth $299/mo (adds local SEO, Google Business Profile, monthly reports) · Scale $599+/mo (adds advanced SEO, landing pages, AI chatbot, reputation management, lead tracking). One-time build fee $500-750.
- Proof to show prospects: meloair.net (real HVAC client site), lexthebarber.com (real barber client site), and 13 live niche demos at gr-scale-demos.vercel.app (hvac, roofing, plumbing, electrician, pest-control, cleaning, painting, flooring, tree-service, pressure-washing, landscaping, restaurant, barber).
- Claude already runs scheduled jobs: 7am daily engine (10 pitch drafts into Gmail + reply scan + report to Downloads), 4pm reply scan, Sunday 5pm content factory, Monday site health check.
- Mission Control dashboard lives in the GitHub repo hayabusarivera23-ops/gr-scale-os. Claude's state files there: src/lib/store.ts (CRM seed — bump the localStorage KEY version when the seed changes) and src/lib/activity.ts (Claude's logbook — prepend an entry every work session).
- HARD RULE: never send anything to a business yourself. Produce drafts for Gio's approval only.`

const REPORT_BACK = `When you finish: (1) give Gio a short report of exactly what you did and where the output lives, so he can mark this command Done in Mission Control, and (2) prepend a matching entry to src/lib/activity.ts in the gr-scale-os repo and push to main.`

function assemble(role: string, task: string): string {
  return `${BUSINESS_CONTEXT}\n\nYOUR ROLE: ${role}\n\nTASK:\n${task}\n\n${REPORT_BACK}`
}

// ─── Command Center commands ──────────────────────────────────────────────────

export interface CommandInput {
  id: string
  label: string
  placeholder: string
}

export interface CommandDef {
  id: string
  label: string
  emoji: string
  description: string
  inputs: CommandInput[]
  build: (values: Record<string, string>) => string
}

export const COMMANDS: CommandDef[] = [
  {
    id: 'find-leads',
    label: 'Find 10 New Leads',
    emoji: '🔎',
    description: 'Fresh scored leads with contact info + outreach angles',
    inputs: [
      { id: 'niche', label: 'Niche', placeholder: 'e.g. roofing, plumbing, HVAC' },
      { id: 'area', label: 'City/State (or "anywhere")', placeholder: 'e.g. Tampa FL, or anywhere' },
    ],
    build: v => assemble(
      "GR Scale's Growth Operator.",
      `Find 10 NEW leads in the "${v.niche || 'local services'}" niche, located in: ${v.area || 'anywhere in the US'}. Target family-owned businesses with strong reviews (4.5★+) but weak, outdated, or missing websites. For each lead: business name, city/state, phone, email, website URL, a website score (0-100), an opportunity score (0-100), the recommended GR Scale package, the matching live demo link to send them, and a personalized email + SMS draft that opens with the #1 specific flaw you found on their site. Verify contact info is real — NO invented phone numbers or emails; mark anything unverified. Then add the leads to the store.ts seed in the gr-scale-os repo (bump the localStorage KEY version) so they show up in Mission Control.`,
    ),
  },
  {
    id: 'audit-site',
    label: 'Audit a Website',
    emoji: '🧪',
    description: 'Full audit + opportunity score + outreach hook',
    inputs: [
      { id: 'url', label: 'Website URL', placeholder: 'https://example.com' },
    ],
    build: v => assemble(
      "GR Scale's website auditor.",
      `Audit this business website: ${v.url || '[URL missing — ask Gio]'}. Deliver: (1) findings on mobile experience, speed, trust signals, calls-to-action, and SEO; (2) a website score 0-100 and an opportunity score 0-100; (3) the recommended GR Scale package with reasoning; (4) the matching live demo link from gr-scale-demos.vercel.app; (5) a personalized outreach email + SMS draft that opens with the single most damaging specific flaw you found.`,
    ),
  },
  {
    id: 'follow-ups',
    label: 'Draft Follow-Ups',
    emoji: '📞',
    description: 'Follow-up drafts for every lead going cold',
    inputs: [],
    build: () => assemble(
      "GR Scale's pipeline manager.",
      `Check the current pipeline state: read the lead seed in src/lib/store.ts in the gr-scale-os repo and the pipeline/outreach logs from your previous work sessions (Gmail drafts, reports in Downloads). Identify every lead that was contacted but hasn't replied, or has a follow-up due or overdue. For each, draft a short, personalized follow-up (email + SMS versions) that references the original hook and adds one new reason to act. Stage the email drafts in Gmail. Do NOT send anything.`,
    ),
  },
  {
    id: 'build-demo',
    label: 'Build a Demo for a Niche',
    emoji: '🏗️',
    description: 'New niche demo on gr-scale-demos',
    inputs: [
      { id: 'niche', label: 'Niche', placeholder: 'e.g. pool service, med spa' },
    ],
    build: v => assemble(
      "GR Scale's demo builder.",
      `Build a polished demo website for the "${v.niche || '[niche missing — ask Gio]'}" niche, matching the quality and structure of the 13 existing demos at gr-scale-demos.vercel.app (hero with clear CTA, services, trust/reviews section, gallery, contact with click-to-call, mobile-first). Use a fictional but realistic business name. Deploy it under the gr-scale-demos project, then register it in src/lib/demos.ts in the gr-scale-os repo (with industryKeys, useCase, and outreachAngle) and push so Mission Control picks it up.`,
    ),
  },
  {
    id: 'weekly-content',
    label: "Write This Week's Content",
    emoji: '✍️',
    description: 'Week of content drafts for GR Scale',
    inputs: [],
    build: () => assemble(
      "GR Scale's content team.",
      `Produce this week's content batch for GR Scale (same scope as the Sunday 5pm content factory job): (1) 3 short social posts targeting local service business owners (pain-point driven, one proof link each — meloair.net, lexthebarber.com, or a niche demo); (2) 1 short blog/LinkedIn article on why local businesses lose customers to bad websites; (3) 2 cold-outreach email variations to A/B test this week. Match GR Scale's voice: direct, specific, zero fluff, always tied to phone calls and revenue. Save the drafts where Gio can review them — do NOT publish or send anything.`,
    ),
  },
  {
    id: 'proposal',
    label: 'Prep a Proposal',
    emoji: '📄',
    description: 'Ready-to-send proposal for a specific lead',
    inputs: [
      { id: 'business', label: 'Business name', placeholder: 'e.g. Top Dog Roofing' },
      { id: 'package', label: 'Package', placeholder: 'Starter / Growth / Scale' },
    ],
    build: v => assemble(
      "GR Scale's proposal writer.",
      `Prepare a complete proposal for "${v.business || '[business missing — ask Gio]'}" on the ${v.package || 'Growth'} package. Research the business first (their site, reviews, market) so the proposal opens with their specific situation, not a template. Include: project summary referencing their #1 website weakness, scope from the package features, 7-day launch timeline, pricing (one-time build fee $500-750 + monthly plan, no contracts), and next steps. Also draft the short delivery email/text that sends it. Leave everything as drafts for Gio's approval, and update the lead's proposal status in the store.ts seed in the gr-scale-os repo (bump the KEY version) and push.`,
    ),
  },
  {
    id: 'sync-dashboard',
    label: 'Update My Dashboard',
    emoji: '🔄',
    description: 'Sync Mission Control with latest real state',
    inputs: [],
    build: () => assemble(
      "GR Scale's operations engineer.",
      `Sync Mission Control (repo hayabusarivera23-ops/gr-scale-os) with the latest real state of the business: (1) update the lead/client/proposal seed in src/lib/store.ts to match reality from your recent work sessions, reports, and Gmail drafts — and bump the localStorage KEY version so every device reseeds; (2) prepend entries to src/lib/activity.ts covering all work done since the last entry; (3) push to main so Vercel deploys. Tell Gio exactly what changed.`,
    ),
  },
  {
    id: 'fix-website',
    label: 'Fix / Change My Website',
    emoji: '🛠️',
    description: 'Any change to grscales.com or Mission Control',
    inputs: [
      { id: 'change', label: 'Describe the change', placeholder: 'e.g. add a testimonials section to grscales.com' },
    ],
    build: v => assemble(
      "GR Scale's web engineer.",
      `Make this change for Gio: ${v.change || '[change missing — ask Gio]'}. If it concerns grscales.com, work in that site's repo; if it concerns the Mission Control dashboard, work in hayabusarivera23-ops/gr-scale-os. Implement it cleanly (TypeScript strict, mobile-first, keep the existing dark design language), verify it builds, commit with a clear message, and push to main so Vercel deploys. If anything is ambiguous, ask Gio before building the wrong thing.`,
    ),
  },
]

// ─── Tell Claude Anything ─────────────────────────────────────────────────────

export function buildFreeformPrompt(request: string): string {
  return assemble(
    "Gio's GR Scale executive team — strategist, engineer, and operator in one. Figure out the smartest way to execute this, then execute it.",
    request.trim(),
  )
}

// ─── System health check ──────────────────────────────────────────────────────

export function buildHealthCheckPrompt(): string {
  return assemble(
    "GR Scale's systems auditor.",
    `Run a full health check and report status for each item: (1) grscales.com — loads fast, mobile OK, contact info correct ((813) 869-5917 / gio@grscales.com), no broken links; (2) gio@grscales.com — receiving and sending correctly, staged pitch drafts still in Gmail; (3) client sites meloair.net and lexthebarber.com — up and error-free; (4) the 13 demos at gr-scale-demos.vercel.app — all loading; (5) your scheduled jobs (7am engine, 4pm reply scan, Sunday 5pm content factory, Monday site health check) — confirm each ran on schedule and what it produced last run. Give Gio a pass/fail per item with dates, fix what you can, and sync src/lib/activity.ts in the gr-scale-os repo so the dashboard reflects this check.`,
  )
}

// ─── Batch prompt (Command Queue) ─────────────────────────────────────────────

export function buildBatchPrompt(items: { title: string; prompt: string }[]): string {
  const tasks = items
    .map((it, i) => `━━━ TASK ${i + 1} OF ${items.length}: ${it.title} ━━━\n${it.prompt}`)
    .join('\n\n')
  return `You are Gio's GR Scale executive team. Below are ${items.length} queued tasks. Each one is self-contained with full business context. Work through them IN ORDER, one at a time, and give a short per-task report as you complete each so Gio can mark them Done in Mission Control.\n\n${tasks}`
}
