'use client'

import { useState } from 'react'
import { Copy, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TemplateSection {
  id: string
  label: string
  content: string
}

interface NicheTemplate {
  industry: string
  tagline: string
  sections: TemplateSection[]
}

// ─── Template data ────────────────────────────────────────────────────────────

const TEMPLATES: NicheTemplate[] = [
  {
    industry: 'HVAC',
    tagline: 'For AC repair, heating, and maintenance companies in Florida.',
    sections: [
      {
        id: 'hvac-hero',
        label: 'Hero Copy',
        content: `Headline: Florida's #1 HVAC Repair & Installation
Subheadline: Fast, affordable AC repair and installation for homeowners across [City], FL. Licensed & insured. Same-day service available.
Hero CTA: Call Now for a Free Estimate → [Phone Number]
Hero Sub-CTA: Or fill out our quick form and we'll call you within 15 minutes.`,
      },
      {
        id: 'hvac-services',
        label: 'Services Copy',
        content: `AC Repair
Is your AC blowing warm air? Making strange noises? Don't sweat it. Our certified technicians diagnose and fix AC problems fast — usually same day.

AC Installation
New home? Old unit failing? We install all major brands with manufacturer warranties. Financing available.

AC Maintenance
A $99 tune-up today saves a $1,500 repair tomorrow. We check refrigerant, clean coils, and test all components.

Heating Repair
Florida winters get cold. When your heat goes out, we're ready. 24/7 emergency heating repair available.

Duct Cleaning
Dirty ducts = higher bills and poor air quality. We clean and seal your ductwork to improve efficiency.

Emergency HVAC
AC dies at midnight in August? We've got you. Call anytime — we answer 24/7.`,
      },
      {
        id: 'hvac-about',
        label: 'About Page',
        content: `About [Business Name]

[Business Name] has been serving [City] and surrounding areas since [Year]. We're a local, family-owned HVAC company that treats every customer like a neighbor — because most of them are.

Our team of certified technicians has handled thousands of AC repairs, installations, and maintenance calls across [County] County. We're fully licensed and insured, and we back every job with a [X]-year labor warranty.

Why homeowners choose us:
✓ Same-day service available
✓ Upfront pricing — no surprise bills
✓ Licensed & insured technicians
✓ 5-star rated on Google
✓ Family-owned since [Year]

We service: [City], [City 2], [City 3], and all of [County] County.

Call us today: [Phone Number]`,
      },
      {
        id: 'hvac-testimonials',
        label: 'Testimonials',
        content: `"Our AC went out on a Friday night in July. [Business Name] picked up the phone, came out within 2 hours, and had it running before midnight. Incredible service."
— Jennifer M., [City], FL ⭐⭐⭐⭐⭐

"I got three quotes and [Business Name] was the most affordable and the most professional. The tech explained everything clearly and didn't try to upsell me on stuff I didn't need."
— Robert K., [City], FL ⭐⭐⭐⭐⭐

"Been using [Business Name] for our yearly maintenance for 4 years. My energy bills dropped $40/month after their first tune-up. Highly recommend."
— Maria T., [City], FL ⭐⭐⭐⭐⭐`,
      },
      {
        id: 'hvac-seo',
        label: 'SEO Title',
        content: `Primary: [City] AC Repair & HVAC Services | [Business Name] | Licensed & Insured
Alternate: AC Repair [City] FL | Fast HVAC Service | [Business Name]
Location page: [Neighborhood] AC Repair | Same-Day Service | [Business Name] [City]`,
      },
      {
        id: 'hvac-meta',
        label: 'Meta Description',
        content: `Fast, affordable AC repair and HVAC installation in [City], FL. Licensed & insured. Same-day service available. Call [Business Name] today for a free estimate: [Phone].`,
      },
      {
        id: 'hvac-faq',
        label: 'FAQ',
        content: `Q: How much does AC repair cost in Florida?
A: Most AC repairs range from $150–$600 depending on the issue. We give you an upfront quote before any work begins.

Q: Do you offer same-day AC repair?
A: Yes. We prioritize same-day appointments for AC failures, especially during summer months.

Q: How long does AC installation take?
A: Most installations take 4–8 hours. We'll remove your old unit and have your new one running the same day.

Q: Do you service all AC brands?
A: Yes. We service and install all major brands including Carrier, Trane, Lennox, Rheem, Goodman, and more.

Q: Are you licensed and insured?
A: Yes. We're fully licensed by the state of Florida and carry full liability insurance and worker's compensation.

Q: What areas do you serve?
A: We serve [City], [City 2], [City 3], and all of [County] County. Call to confirm service to your area.`,
      },
      {
        id: 'hvac-cta',
        label: 'CTA Variations',
        content: `CTA 1 (primary): Call Now for a Free Estimate → [Phone Number]
CTA 2 (form): Get My Free Estimate in 60 Seconds
CTA 3 (urgency): AC Down? We're Available Now — Call [Phone]
CTA 4 (value): Book a $99 Tune-Up — Save Hundreds on Repairs
CTA 5 (social proof): Join 500+ Happy Customers in [City] — Get Your Free Quote`,
      },
    ],
  },
  {
    industry: 'Barber',
    tagline: 'For barbershops and independent barbers building an online presence.',
    sections: [
      {
        id: 'barber-hero',
        label: 'Hero Copy',
        content: `Headline: [City]'s Freshest Cuts. Book Online.
Subheadline: Professional haircuts, fades, and beard trims in [City], FL. No wait. No walk-in chaos. Book your spot online in 30 seconds.
Hero CTA: Book My Appointment →
Hero Sub-CTA: Or call/text: [Phone Number]`,
      },
      {
        id: 'barber-services',
        label: 'Services Copy',
        content: `Classic Haircut — $[Price]
Clean lines, perfect fade, sharp finish. Takes 30–45 minutes.

Skin Fade — $[Price]
Zero-to-skin precision fade. The cleanest look in the shop.

Beard Trim & Shape — $[Price]
From full beard sculpts to edge-up cleanups. We make it look intentional.

Kids Cut (under 12) — $[Price]
Patient, fun, and fast. We've cut thousands of kids' first fades.

Cut + Beard Combo — $[Price]
Full haircut plus beard shape. Best value in the shop.

Hot Towel Shave — $[Price]
The full experience. Prep, hot towel, straight razor, finish. 45 minutes of relaxation.`,
      },
      {
        id: 'barber-about',
        label: 'About Page',
        content: `About [Business/Barber Name]

[Name] has been cutting hair in [City] for [X] years. What started as a passion became a craft — and now a community.

Every cut at [Shop Name] is done with attention to detail, respect for your time, and pride in the finish. No rushing. No excuses. Just clean work.

[Name] specializes in [specialty — fades, textured hair, beards, etc.] and stays current on techniques through [training/certification if any].

Shop Hours: [Days and Hours]
Location: [Address], [City], FL
Parking: [Parking details]

Book online or call/text [Phone Number] to reserve your spot.`,
      },
      {
        id: 'barber-testimonials',
        label: 'Testimonials',
        content: `"Best fade in [City]. Period. I've been coming here for 2 years and I won't go anywhere else."
— Marcus D., [City], FL ⭐⭐⭐⭐⭐

"Online booking changed my life. No more calling or waiting. I book Monday, walk in Friday, and look fresh for the weekend."
— Darius W., [City], FL ⭐⭐⭐⭐⭐

"[Name] did my son's first haircut. He was nervous and [Name] made it fun. Perfect cut and great experience."
— Tanya R., [City], FL ⭐⭐⭐⭐⭐`,
      },
      {
        id: 'barber-seo',
        label: 'SEO Title',
        content: `Primary: Barbershop in [City], FL | [Shop Name] | Book Online
Alternate: [City] Barber | Fades, Cuts & Beard Trims | [Shop Name]`,
      },
      {
        id: 'barber-meta',
        label: 'Meta Description',
        content: `Clean cuts and fresh fades in [City], FL. Book your appointment online in 30 seconds. [Shop Name] — professional haircuts and beard trims. Call or text: [Phone].`,
      },
      {
        id: 'barber-faq',
        label: 'FAQ',
        content: `Q: Do I need an appointment?
A: Walk-ins are welcome when we have space, but booking online guarantees your spot with no wait time.

Q: How long does a haircut take?
A: Most cuts take 30–45 minutes. Combo services (cut + beard) take about 60 minutes.

Q: What payment methods do you accept?
A: Cash, card, Venmo, and CashApp. Tip appreciated but never required.

Q: Do you cut kids' hair?
A: Yes. We cut hair for kids of all ages and we're patient with the little ones.

Q: What's your cancellation policy?
A: Please cancel at least 2 hours before your appointment so another client can take your slot.`,
      },
      {
        id: 'barber-cta',
        label: 'CTA Variations',
        content: `CTA 1 (primary): Book My Appointment →
CTA 2 (urgency): Spots Filling Up — Reserve Yours Now
CTA 3 (value): Walk In Fresh. Walk Out Fresh. Book Online.
CTA 4 (simple): Pick Your Time. Show Up. Look Good.
CTA 5 (phone): Call/Text to Book: [Phone Number]`,
      },
    ],
  },
  {
    industry: 'Roofing',
    tagline: 'For residential and commercial roofing contractors.',
    sections: [
      {
        id: 'roof-hero',
        label: 'Hero Copy',
        content: `Headline: Storm Damage? Roof Leak? We're On It.
Subheadline: Licensed Florida roofing contractor serving [City] and surrounding areas. Free inspections. Insurance claims handled. Done in days, not weeks.
Hero CTA: Get My Free Roof Inspection →
Hero Sub-CTA: Or call now: [Phone Number]`,
      },
      {
        id: 'roof-services',
        label: 'Services Copy',
        content: `Storm Damage Repair
Florida storms hit hard. We respond fast. Full documentation for insurance claims included at no extra charge.

Full Roof Replacement
Old roof, persistent leaks, or storm total-loss? We replace full roofs in 1–3 days with manufacturer-backed materials.

Roof Repair
Missing shingles, small leaks, flashing damage. Fixed right the first time.

New Construction Roofing
Building a home or addition? We work with general contractors and homeowners on new construction installs.

Commercial Roofing
Flat roofs, TPO, modified bitumen. We handle commercial properties across [County] County.

Roof Inspection
Buying a home? Selling a home? Annual checkup? We provide written inspection reports you can share with your insurance company or real estate agent.`,
      },
      {
        id: 'roof-seo',
        label: 'SEO Title',
        content: `Primary: Roofing Contractor [City], FL | Storm Damage Repair | [Business Name]
Alternate: [City] Roofer | Free Inspections | Licensed & Insured | [Business Name]`,
      },
      {
        id: 'roof-meta',
        label: 'Meta Description',
        content: `Licensed roofing contractor in [City], FL. Storm damage repair, full replacements, and free inspections. Insurance claims handled. Call [Business Name]: [Phone].`,
      },
      {
        id: 'roof-cta',
        label: 'CTA Variations',
        content: `CTA 1: Get My Free Roof Inspection →
CTA 2: Storm Damage? Call Now — We Document Everything for Insurance
CTA 3: Free Estimate in 24 Hours — No Obligation
CTA 4: Roof Leaking? We Fix It Right. Call [Phone].
CTA 5: 100+ Roofs Replaced in [City]. Get Your Free Quote.`,
      },
      {
        id: 'roof-faq',
        label: 'FAQ',
        content: `Q: Do you work with insurance companies?
A: Yes. We document all storm damage, work directly with your adjuster, and handle the paperwork so you don't have to.

Q: How long does a roof replacement take?
A: Most residential replacements are completed in 1–2 days.

Q: Do you offer financing?
A: Yes. We partner with [Financing Partner] for flexible payment options.

Q: Are you licensed in Florida?
A: Yes. We hold a Florida State Certified Roofing Contractor license.`,
      },
    ],
  },
  {
    industry: 'Plumbing',
    tagline: 'For local plumbers offering residential and emergency services.',
    sections: [
      {
        id: 'plumb-hero',
        label: 'Hero Copy',
        content: `Headline: [City]'s Most Trusted Plumbers. Available 24/7.
Subheadline: From leaky faucets to burst pipes — we fix it fast. Licensed Florida plumbers serving [City] and [County] County. No overtime charges.
Hero CTA: Call Now — We Answer 24/7 →
Hero Sub-CTA: [Phone Number]`,
      },
      {
        id: 'plumb-services',
        label: 'Services Copy',
        content: `Emergency Plumbing
Burst pipe? Sewer backup? Flooding? Call now. We're available 24/7 with no extra charge for nights or weekends.

Drain Cleaning
Slow drains, clogged sinks, blocked toilets. We clear them fast with hydro-jetting or snake service.

Water Heater Repair & Replacement
No hot water? We diagnose, repair, or replace same day. All major brands. Tankless installs available.

Leak Detection & Repair
Hidden leaks destroy homes silently. We find them with non-invasive technology and fix them right.

Toilet Repair & Replacement
Running, leaking, or not flushing? We repair or replace same day.

Repiping
Old galvanized pipes corroding? We repipe homes and commercial buildings in [City] and surrounding areas.`,
      },
      {
        id: 'plumb-seo',
        label: 'SEO Title',
        content: `Primary: Plumber in [City], FL | 24/7 Emergency Plumbing | [Business Name]
Alternate: [City] Plumbing Services | Licensed Plumber | [Business Name]`,
      },
      {
        id: 'plumb-meta',
        label: 'Meta Description',
        content: `24/7 emergency plumbing in [City], FL. Drain cleaning, water heater repair, leak detection, and repiping. Licensed & insured. Call [Business Name]: [Phone].`,
      },
      {
        id: 'plumb-cta',
        label: 'CTA Variations',
        content: `CTA 1: Call Now — We Answer 24/7 →
CTA 2: Emergency? We're On Our Way. Call [Phone].
CTA 3: Get a Free Plumbing Quote in 60 Seconds
CTA 4: No Overtime Charges — Ever. Call Anytime.
CTA 5: Same-Day Plumbing Repairs in [City]. Book Now.`,
      },
      {
        id: 'plumb-faq',
        label: 'FAQ',
        content: `Q: Do you charge extra for nights or weekends?
A: No. Our flat-rate pricing is the same 24 hours a day, 7 days a week.

Q: How quickly can you arrive?
A: For emergencies, we typically arrive within 60–90 minutes. For non-emergencies, we offer same-day and next-day scheduling.

Q: Are you licensed and insured?
A: Yes. We are fully licensed Florida plumbing contractors and carry full liability insurance.

Q: Do you give free estimates?
A: Yes. We provide free written estimates for all non-emergency work before we begin.`,
      },
    ],
  },
]

// ─── Section labels for display ───────────────────────────────────────────────

const SECTION_LABELS: Record<string, { color: string; bg: string }> = {
  'Hero Copy':        { color: 'text-sky-400',    bg: 'bg-sky-500/10 border-sky-500/20'     },
  'Services Copy':    { color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20' },
  'About Page':       { color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20'},
  'Testimonials':     { color: 'text-emerald-400',bg: 'bg-emerald-500/10 border-emerald-500/20'},
  'SEO Title':        { color: 'text-pink-400',   bg: 'bg-pink-500/10 border-pink-500/20'   },
  'Meta Description': { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20'},
  'FAQ':              { color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20'   },
  'CTA Variations':   { color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20'     },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const [activeIndustry, setActiveIndustry] = useState('HVAC')
  const [copied, setCopied] = useState<string | null>(null)

  const template = TEMPLATES.find(t => t.industry === activeIndustry)

  function copy(content: string, id: string) {
    navigator.clipboard.writeText(content)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-5">

      <div className="page-header">
        <div>
          <h2 className="page-title">Template Library</h2>
          <p className="text-sm text-zinc-600 mt-0.5">Reusable copy for every niche. Fill in the brackets and deploy.</p>
        </div>
      </div>

      {/* Industry tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {TEMPLATES.map(t => (
          <button key={t.industry}
            onClick={() => setActiveIndustry(t.industry)}
            className={cn('rounded-lg px-4 py-2 text-sm font-medium border transition',
              activeIndustry === t.industry
                ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                : 'bg-zinc-800/60 text-zinc-500 hover:text-zinc-300 border-zinc-800')}>
            {t.industry}
          </button>
        ))}
        <span className="flex items-center px-3 py-2 text-xs text-zinc-700">+ more coming</span>
      </div>

      {/* Usage note */}
      {template && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <p className="text-xs text-zinc-400">
            <span className="font-semibold text-zinc-300">{template.industry}</span> — {template.tagline}
          </p>
          <p className="text-xs text-zinc-600 mt-1">Replace all <code className="bg-zinc-800 px-1 rounded text-[10px]">[brackets]</code> with the client&apos;s real info before using.</p>
        </div>
      )}

      {/* Template sections */}
      {template && (
        <div className="space-y-3">
          {template.sections.map(section => {
            const style = SECTION_LABELS[section.label] ?? { color: 'text-zinc-400', bg: 'bg-zinc-800 border-zinc-700' }
            const isCopied = copied === section.id

            return (
              <div key={section.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
                {/* Section header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/60">
                  <span className={cn('rounded border px-2.5 py-1 text-xs font-semibold', style.bg, style.color)}>
                    {section.label}
                  </span>
                  <button
                    onClick={() => copy(section.content, section.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition',
                      isCopied
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                    )}>
                    {isCopied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {isCopied ? 'Copied!' : 'Copy All'}
                  </button>
                </div>

                {/* Content */}
                <pre className="px-5 py-4 text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap font-sans">
                  {section.content}
                </pre>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer note */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4 pb-6">
        <p className="text-xs font-semibold text-zinc-400 mb-1">How GR Scale AI uses these</p>
        <p className="text-xs text-zinc-600 leading-relaxed">
          When you run the Demo Builder for a new niche, these templates pre-fill the copy sections.
          Customize per-client from there. The goal: launch a demo in under 2 hours per niche.
        </p>
      </div>
    </div>
  )
}
