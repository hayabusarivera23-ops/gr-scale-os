import Link from 'next/link'
import {
  Compass, Radar, Search, Globe, MessageSquare, Phone, FileText,
  DollarSign, Wrench, RefreshCw, ArrowRight, CheckCircle2,
} from 'lucide-react'

// ── The beginner pipeline (Phase 4): the OS always shows the next step ──
const PIPELINE = [
  'Research Lead', 'Audit Website', 'Send Outreach', 'Follow Up', 'Book Call',
  'Send Proposal', 'Collect Deposit', 'Build Website', 'Launch', 'Sell Maintenance',
]

// ── The 10 training steps ──
type Step = {
  icon: React.ElementType
  title: string
  means: string
  matters: string
  href?: string
  cta?: string
  next: string
}

const STEPS: Step[] = [
  {
    icon: Compass,
    title: '1. What GR Scale Does',
    means: 'GR Scale builds fast, modern websites for local businesses (HVAC, barbers, plumbers, etc.) and later manages their online presence — SEO, Google Business Profile, and maintenance.',
    matters: 'You sell something every local business needs but most do badly. One website = $750–$2,500. One maintenance plan = $99–$149 every month, forever.',
    next: 'Read the pipeline above once. Then start at Step 2 — finding leads.',
  },
  {
    icon: Radar,
    title: '2. How I Find Leads',
    means: 'A lead is a local business with a bad website, no website, or a weak Google listing. You find them on Google Maps and add them to the OS.',
    matters: 'No leads = no clients = no money. This is the top of the funnel. Everything else depends on it.',
    href: '/discover',
    cta: 'Open Lead Discovery',
    next: 'Add 10 businesses today. Search "HVAC near [city]" on Google Maps and grab any with a weak or missing site.',
  },
  {
    icon: Search,
    title: '3. How I Audit a Website',
    means: 'Paste a business’s website URL into the Audit Engine. It scores the site 0–100 and lists exactly what’s wrong (slow, not mobile-friendly, no quote button, etc.).',
    matters: 'The audit is your icebreaker. "I noticed your site has no click-to-call" is 10x stronger than "want a website?"',
    href: '/audit',
    cta: 'Open Audit Engine',
    next: 'Run audits on the 10 leads you just added. Note the #1 flaw for each.',
  },
  {
    icon: Globe,
    title: '4. How I Match a Demo',
    means: 'Pick the demo site that matches the lead’s industry (HVAC lead → HVAC demo). The Demo Builder tracks which demos are ready.',
    matters: 'Showing a real demo for their industry makes them picture their own business on it. Demos close deals.',
    href: '/demos',
    cta: 'Open Demo Builder',
    next: 'Confirm the demo for each lead’s industry is live, then copy its link to send.',
  },
  {
    icon: MessageSquare,
    title: '5. How I Send Outreach',
    means: 'Use the Workspace or Templates to send a cold email + SMS. Each one names the flaw you found and links the matching demo.',
    matters: 'Outreach is what turns a stranger into a conversation. Volume + a specific hook = booked calls.',
    href: '/workspace',
    cta: 'Open Workspace',
    next: 'Send 20 messages today (email or text). Personalize the first line with their flaw.',
  },
  {
    icon: Phone,
    title: '6. How I Book a Call',
    means: 'When someone replies, get them on a 20-minute call. Log it in the Outreach Log so you remember to follow up.',
    matters: 'Calls are where deals are won. A booked call is the single best predictor of getting paid.',
    href: '/outreach',
    cta: 'Open Outreach Log',
    next: 'Reply to every response within an hour. Offer 2 specific time slots — don’t ask "when are you free?"',
  },
  {
    icon: FileText,
    title: '7. How I Send a Proposal',
    means: 'After the call, send a simple proposal: what you’ll build, the price, and the 50% deposit to start. Use the Proposals page.',
    matters: 'A clear proposal removes hesitation. Price + deposit + next step = a decision instead of a "maybe".',
    href: '/proposals',
    cta: 'Open Proposals',
    next: 'Send the proposal same-day while the call is fresh. Keep it to one page.',
  },
  {
    icon: DollarSign,
    title: '8. How I Collect Payment',
    means: 'Take a 50% deposit before you build. (Stripe payment links coming soon — for now, use Stripe/Zelle/Cash App and mark it paid.)',
    matters: 'The deposit is the moment you actually get paid. Never start building without it — it protects your time.',
    href: '/revenue',
    cta: 'Open Revenue',
    next: 'Send a payment link with the proposal. No deposit, no build.',
  },
  {
    icon: Wrench,
    title: '9. How I Build the Website',
    means: 'Start from the matching demo, swap in the client’s real info, photos, and services, then deploy. Track it on the Projects page.',
    matters: 'Fast delivery = happy client = referrals + a maintenance upsell. The demo does 80% of the work for you.',
    href: '/projects',
    cta: 'Open Projects',
    next: 'Aim to deliver a first draft within 3–5 days. Use the demo as your starting template.',
  },
  {
    icon: RefreshCw,
    title: '10. How I Sell Monthly Maintenance',
    means: 'After launch, offer a $99–$149/mo plan: hosting, edits, updates, and keeping their Google listing fresh. Track clients on the Clients page.',
    matters: 'This is recurring revenue — the real business. 10 maintenance clients = ~$1,000–$1,500 every month on autopilot.',
    href: '/clients',
    cta: 'Open Clients',
    next: 'Pitch maintenance at launch, when they’re happiest. Make it the default, not an add-on.',
  },
]

export default function StartHerePage() {
  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-400 mb-3">
          <Compass className="h-3.5 w-3.5" /> Start Here
        </span>
        <h1 className="text-2xl font-bold text-white">How to Run GR Scale</h1>
        <p className="text-sm text-zinc-400 mt-2 leading-relaxed max-w-2xl">
          Your step-by-step playbook for getting your first paying client. Follow it top to bottom.
          Each step tells you what it means, why it matters, and exactly where to go in the OS.
        </p>
      </div>

      {/* Pipeline strip (Phase 4) */}
      <div className="rounded-xl border border-zinc-800 bg-[#0d0d0f] p-5 mb-10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">Your Sales Pipeline</p>
        <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
          {PIPELINE.map((stage, i) => (
            <div key={stage} className="flex items-center">
              <span className="rounded-md bg-zinc-800/80 px-2.5 py-1 text-xs font-medium text-zinc-300">
                {stage}
              </span>
              {i < PIPELINE.length - 1 && <ArrowRight className="h-3 w-3 text-zinc-700 mx-1" />}
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-500 mt-3">
          Every client moves left to right. Your job each day: push leads one step further right.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {STEPS.map(step => {
          const Icon = step.icon
          return (
            <div key={step.title} className="rounded-xl border border-zinc-800 bg-[#0d0d0f] p-5 hover:border-zinc-700 transition">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-500/10">
                  <Icon className="h-5 w-5 text-sky-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold text-white mb-3">{step.title}</h2>

                  <div className="space-y-2.5 text-sm leading-relaxed">
                    <p className="text-zinc-300">
                      <span className="font-semibold text-zinc-500">What it means: </span>{step.means}
                    </p>
                    <p className="text-zinc-300">
                      <span className="font-semibold text-zinc-500">Why it matters: </span>{step.matters}
                    </p>
                    <p className="flex items-start gap-1.5 text-emerald-300/90">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                      <span><span className="font-semibold">Do next: </span>{step.next}</span>
                    </p>
                  </div>

                  {step.href && (
                    <Link
                      href={step.href}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-400 transition"
                    >
                      {step.cta} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom CTA */}
      <div className="mt-10 rounded-xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-transparent p-6 text-center">
        <h3 className="text-base font-semibold text-white mb-1">Today’s one job</h3>
        <p className="text-sm text-zinc-400 mb-4">
          Add 10 leads, audit them, and send 20 outreach messages. That’s the whole game right now.
        </p>
        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-400 transition"
        >
          Start with Lead Discovery <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
