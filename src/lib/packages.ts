/**
 * GR Scale OS — Package Engine
 *
 * SINGLE SOURCE OF TRUTH for the three packages GR Scale sells,
 * plus the recommendation engine (Phase 3).
 *
 * ARCHITECTURAL DECISION (2026-07-02):
 * Old packages (Launch/Growth/Dominate one-time builds) replaced with
 * recurring plans: Starter $99/mo, Growth $299/mo, Scale $599+/mo.
 * One-time build fee is separate and editable per proposal.
 * Every page that shows packages imports from THIS file. Never redefine
 * package data in a page.
 *
 * Roadmap-only services (DO NOT BUILD YET): FB/Google Ads, Email Marketing,
 * AI Phone Receptionist, Appointment Automation, CRM Setup, Review Generation,
 * SMS Automation.
 */

export type PackageId = 'starter' | 'growth' | 'scale'

export interface PackageDef {
  id: PackageId
  name: string
  monthly: number
  monthlyLabel: string
  defaultSetupFee: number   // one-time build fee, editable per proposal
  tagline: string
  features: string[]
  bestFor: string
}

export const PACKAGES: Record<PackageId, PackageDef> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    monthly: 99,
    monthlyLabel: '$99/mo',
    defaultSetupFee: 500,
    tagline: 'Your website, handled forever.',
    features: [
      'Hosting & security',
      'Website updates',
      'Small edits (text, photos, hours)',
      'Backups',
    ],
    bestFor: 'Businesses that need a solid site kept fast, safe, and current.',
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    monthly: 299,
    monthlyLabel: '$299/mo',
    defaultSetupFee: 750,
    tagline: 'Get found on Google. Turn searches into calls.',
    features: [
      'Everything in Starter',
      'Local SEO',
      'Google Business Profile updates',
      'Monthly performance reports',
    ],
    bestFor: 'Businesses with good reviews that competitors outrank on Google.',
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    monthly: 599,
    monthlyLabel: '$599+/mo',
    defaultSetupFee: 1000,
    tagline: 'A full growth engine for your business.',
    features: [
      'Everything in Growth',
      'Advanced SEO',
      'Landing pages',
      'AI chatbot',
      'Reputation management',
      'Lead tracking',
      'Marketing consulting',
    ],
    bestFor: 'Established businesses in competitive markets ready to dominate.',
  },
}

export const PACKAGE_LIST: PackageDef[] = [PACKAGES.starter, PACKAGES.growth, PACKAGES.scale]

// ─── Recommendation Engine (Phase 3) ─────────────────────────────────────────

export interface RecommendInput {
  hasWebsite: boolean
  websiteScore?: number | null   // 0-100 from audit; null = not audited
  opportunityScore?: number      // 0-100 how big the upside is
  reviewCount?: number
  rating?: number
  city?: string
  industry?: string
  multipleLocations?: boolean
  commercialServices?: boolean
}

export interface Recommendation {
  id: PackageId
  pkg: PackageDef
  reasons: string[]
  confidence: 'High' | 'Medium' | 'Low'
}

const COMPETITIVE_CITIES = [
  'miami', 'orlando', 'tampa', 'jacksonville', 'fort lauderdale',
  'st. petersburg', 'hialeah', 'west palm beach',
]

export function recommendPackage(input: RecommendInput): Recommendation {
  const reasons: string[] = []
  let score = 0 // 0-3 → starter, 4-7 → growth, 8+ → scale

  const competitive = input.city
    ? COMPETITIVE_CITIES.includes(input.city.toLowerCase())
    : false

  // Signal: web presence quality
  if (!input.hasWebsite) {
    score += 2
    reasons.push('No website — losing every customer who searches online. Needs a build + ongoing care.')
  } else if (input.websiteScore != null && input.websiteScore < 50) {
    score += 2
    reasons.push(`Website audit scored ${input.websiteScore}/100 — outdated site is actively costing calls.`)
  } else if (input.websiteScore != null && input.websiteScore < 75) {
    score += 1
    reasons.push(`Website audit scored ${input.websiteScore}/100 — functional but leaking conversions.`)
  }

  // Signal: reputation vs visibility gap
  if ((input.reviewCount ?? 0) >= 30 && (input.rating ?? 0) >= 4.3) {
    score += 3
    reasons.push(`${input.reviewCount} reviews at ${input.rating}★ — great reputation with weak visibility. Local SEO turns that gap into calls.`)
  } else if ((input.reviewCount ?? 0) >= 10) {
    score += 1
    reasons.push('Established review base worth amplifying with GBP updates.')
  }

  // Signal: market competitiveness
  if (competitive) {
    score += 2
    reasons.push(`${input.city} is a competitive market — ranking requires ongoing SEO work, not a one-time fix.`)
  }

  // Signal: business size / ambition
  if (input.multipleLocations) {
    score += 3
    reasons.push('Multiple locations need landing pages, lead tracking, and reputation management per location.')
  }
  if (input.commercialServices) {
    score += 2
    reasons.push('Commercial services = bigger ticket jobs — advanced SEO and lead tracking pay for themselves fast.')
  }

  // Signal: overall opportunity
  if ((input.opportunityScore ?? 0) >= 85) {
    score += 1
    reasons.push('High opportunity score — this business can absorb and profit from a bigger plan.')
  }

  let id: PackageId
  if (score >= 8) id = 'scale'
  else if (score >= 4) id = 'growth'
  else id = 'starter'

  if (id === 'starter' && reasons.length === 0) {
    reasons.push('Solid basics in place — needs reliable hosting, updates, and backups more than aggressive marketing.')
  }

  const confidence: Recommendation['confidence'] =
    reasons.length >= 3 ? 'High' : reasons.length === 2 ? 'Medium' : 'Low'

  return { id, pkg: PACKAGES[id], reasons, confidence }
}

// ─── Proposal Generator (Phase 4) ─────────────────────────────────────────────

export interface ProposalInput {
  businessName: string
  ownerName?: string
  city?: string
  industry?: string
  packageId: PackageId
  setupFee: number
  specificWeakness?: string   // the one specific finding that sells
  demoUrl?: string
}

export function generateProposal(p: ProposalInput): string {
  const pkg = PACKAGES[p.packageId]
  const owner = p.ownerName || 'there'
  const setupLine = p.setupFee > 0
    ? `One-time build & setup: $${p.setupFee} (half to start, half at launch)\nMonthly plan: ${pkg.monthlyLabel} — starts at launch`
    : `Monthly plan: ${pkg.monthlyLabel} — starts at launch`

  return `# New Website & Growth Plan for ${p.businessName}

Prepared for: ${owner}
From: Gio Rivera — GR Scale
Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

## Project Summary

${p.businessName} does great work${p.city ? ` in ${p.city}` : ''} — but your online presence doesn't show it.${p.specificWeakness ? ` Right now, ${p.specificWeakness}` : ''} That gap costs you jobs every week: customers who found you but called a competitor instead.

This plan fixes that with a professional website and the **${pkg.name} plan** — ${pkg.tagline.toLowerCase()}

${p.demoUrl ? `See the quality of work here: ${p.demoUrl}\n` : ''}
## Scope

${pkg.features.map(f => `- ${f}`).join('\n')}
- Mobile-first design (most of your customers are on their phone)
- Every page built to make the phone ring

## Timeline

- Day 0: You approve + send business info (I make it a 10-minute task for you)
- Days 1-5: I build. You review on your phone.
- Day 7: Launch. Your plan and reporting start.

## Pricing

${setupLine}

No contracts. Cancel anytime — though when your phone starts ringing more, you won't want to.

## Next Steps

1. Reply "let's go" to this message
2. I send the payment link + a short info checklist
3. Your new site is live within 7 days

Gio Rivera · GR Scale
`
}
