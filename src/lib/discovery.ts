/**
 * GR Scale OS — Lead Discovery Engine
 *
 * Architecture designed for progressive enhancement:
 *   Day 1:  Manual entry + CSV import (zero API keys needed)
 *   Day 2:  Google Maps API (plug in key → full automation)
 *   Day 3+: Yelp, Bing Places, custom scrapers, Clay, Outscraper
 *
 * Design rule: pages import ILeadProvider, never a concrete class.
 * Swap providers here. Nothing else changes.
 */

// ─── Search query ─────────────────────────────────────────────────────────────

export interface SearchQuery {
  industry: string
  city?: string
  zip?: string
  radius?: number       // miles, default 10
  limit?: number        // max results, default 25
  minRating?: number    // e.g. 3.5
}

// ─── Discovered business ──────────────────────────────────────────────────────

export interface DiscoveredBusiness {
  id: string
  source: string              // which provider found this

  // Raw data from the provider
  business_name: string
  industry: string
  address: string
  city: string
  state: string
  zip?: string
  phone?: string
  website?: string            // undefined = confirmed NO website
  google_rating?: number      // 0–5
  review_count?: number

  // Derived by the scoring engine
  website_score?: number      // null until audited
  priority_score: number      // 0–100, higher = better prospect
  category: LeadCategory
  opportunity: OpportunityTier
  recommended_offer: string
  recommended_demo: string    // URL or ''
  suggested_action: string
}

// ─── Lead categories ──────────────────────────────────────────────────────────

export type LeadCategory =
  | 'NO_WEBSITE'        // ★★★★★ Highest priority
  | 'BROKEN_WEBSITE'    // ★★★★
  | 'OUTDATED_WEBSITE'  // ★★★
  | 'MODERN_WEBSITE'    // ★★
  | 'NOT_A_TARGET'      // ★

export type OpportunityTier = 'Very High' | 'High' | 'Medium' | 'Low'

export const CATEGORY_CONFIG: Record<LeadCategory, {
  stars: string
  label: string
  color: string
  bg: string
  border: string
  dot: string
  priority: number    // base priority if not overridden
}> = {
  NO_WEBSITE:       { stars: '★★★★★', label: 'No Website',       color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     dot: 'bg-red-400',     priority: 100 },
  BROKEN_WEBSITE:   { stars: '★★★★',  label: 'Broken Website',   color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  dot: 'bg-orange-400',  priority: 85  },
  OUTDATED_WEBSITE: { stars: '★★★',   label: 'Outdated Website',  color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   dot: 'bg-amber-400',   priority: 65  },
  MODERN_WEBSITE:   { stars: '★★',    label: 'Modern Website',    color: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/30',     dot: 'bg-sky-400',     priority: 30  },
  NOT_A_TARGET:     { stars: '★',     label: 'Not a Target',      color: 'text-zinc-500',    bg: 'bg-zinc-800/60',    border: 'border-zinc-700',       dot: 'bg-zinc-600',    priority: 5   },
}

// ─── Demo recommendation by industry ─────────────────────────────────────────

const INDUSTRY_DEMO: Record<string, string> = {
  'HVAC':             'https://acorlandohvac.com',
  'AC Repair':        'https://acorlandohvac.com',
  'Heating & Cooling':'https://acorlandohvac.com',
  'Barber':           'https://lexthebarber.com',
  'Barbershop':       'https://lexthebarber.com',
  'Hair Salon':       'https://lexthebarber.com',
}

export function getDemoForIndustry(industry: string): string {
  const key = Object.keys(INDUSTRY_DEMO).find(k =>
    industry.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(industry.toLowerCase())
  )
  return key ? INDUSTRY_DEMO[key] : ''
}

// ─── Scoring engine ───────────────────────────────────────────────────────────

export interface ScoringInput {
  website?: string          // undefined = no website
  website_score?: number    // null = not yet audited
  industry?: string
  google_rating?: number
  review_count?: number
}

export function scoreDiscoveredLead(input: ScoringInput): Pick<
  DiscoveredBusiness,
  'priority_score' | 'category' | 'opportunity' | 'recommended_offer' | 'recommended_demo' | 'suggested_action'
> {
  const demo = getDemoForIndustry(input.industry ?? '')

  // ── No website at all ────────────────────────────────────────────────────────
  if (!input.website) {
    return {
      priority_score:    100,
      category:          'NO_WEBSITE',
      opportunity:       'Very High',
      recommended_offer: 'Build them a professional website from scratch.',
      recommended_demo:  demo,
      suggested_action:  'Call immediately — pitch a new website. Lead with the demo.',
    }
  }

  // ── Website exists, not yet audited ──────────────────────────────────────────
  if (input.website_score === undefined || input.website_score === null) {
    // Pre-audit: assume outdated until proven otherwise
    return {
      priority_score:    70,
      category:          'OUTDATED_WEBSITE',
      opportunity:       'High',
      recommended_offer: 'Website redesign — faster, mobile-first, more calls.',
      recommended_demo:  demo,
      suggested_action:  'Run the audit first, then call with a specific finding.',
    }
  }

  const score = input.website_score

  // ── Broken website (score < 35) ───────────────────────────────────────────
  if (score < 35) {
    return {
      priority_score:    85,
      category:          'BROKEN_WEBSITE',
      opportunity:       'Very High',
      recommended_offer: 'Full website rebuild — current site is actively losing customers.',
      recommended_demo:  demo,
      suggested_action:  'Call with the 3 worst issues from the audit. Easy close.',
    }
  }

  // ── Outdated website (score 35–64) ────────────────────────────────────────
  if (score < 65) {
    return {
      priority_score:    Math.round(65 - (score - 35) * 0.5),  // 65 → 50 as score rises
      category:          'OUTDATED_WEBSITE',
      opportunity:       'High',
      recommended_offer: 'Website upgrade — better mobile experience and conversion rate.',
      recommended_demo:  demo,
      suggested_action:  'Lead with the mobile score. Show them the demo on your phone.',
    }
  }

  // ── Modern website (score 65–80) ─────────────────────────────────────────
  if (score < 80) {
    return {
      priority_score:    30,
      category:          'MODERN_WEBSITE',
      opportunity:       'Medium',
      recommended_offer: 'SEO optimization and local search visibility.',
      recommended_demo:  demo,
      suggested_action:  'Only pitch if they have a specific weakness (e.g. no reviews section).',
    }
  }

  // ── Not a target (score ≥ 80) ────────────────────────────────────────────
  return {
    priority_score:    5,
    category:          'NOT_A_TARGET',
    opportunity:       'Low',
    recommended_offer: 'No clear need at this time.',
    recommended_demo:  '',
    suggested_action:  'Skip. Find a better lead.',
  }
}

// ─── Provider interface ───────────────────────────────────────────────────────

export type ProviderStatus =
  | 'ready'           // works today, no setup needed
  | 'needs_key'       // API key required
  | 'coming_soon'     // planned, not yet built
  | 'connected'       // fully set up and active

export interface ILeadProvider {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly status: ProviderStatus
  readonly icon: string
  search(query: SearchQuery): Promise<DiscoveredBusiness[]>
  // Providers that don't support free-form search return false
  supportsSearch(): boolean
}

// ─── Provider: Manual Entry ───────────────────────────────────────────────────
// Works today. User types in a business they found. Scores it immediately.

export class ManualEntryProvider implements ILeadProvider {
  readonly id          = 'manual'
  readonly name        = 'Manual Entry'
  readonly description = 'Type in any business you find. Score it instantly.'
  readonly status: ProviderStatus = 'ready'
  readonly icon        = 'PenLine'

  supportsSearch() { return false }

  async search(): Promise<DiscoveredBusiness[]> { return [] }

  score(raw: {
    business_name: string
    industry: string
    city: string
    state?: string
    phone?: string
    website?: string
    google_rating?: number
    review_count?: number
    address?: string
    zip?: string
  }): DiscoveredBusiness {
    const scoring = scoreDiscoveredLead({
      website:      raw.website || undefined,
      industry:     raw.industry,
      google_rating: raw.google_rating,
      review_count:  raw.review_count,
    })
    return {
      id:            `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      source:        'Manual Entry',
      business_name: raw.business_name,
      industry:      raw.industry,
      address:       raw.address ?? '',
      city:          raw.city,
      state:         raw.state ?? 'FL',
      zip:           raw.zip,
      phone:         raw.phone,
      website:       raw.website || undefined,
      google_rating: raw.google_rating,
      review_count:  raw.review_count,
      ...scoring,
    }
  }
}

// ─── Provider: CSV Import ─────────────────────────────────────────────────────
// Works today. User exports from Google Maps (via Outscraper, PhantomBuster,
// or any Maps export tool) and uploads the CSV here.
//
// Expected columns (flexible, case-insensitive):
//   name/business_name, phone, address, website, rating, reviews, industry/category

export class CSVImportProvider implements ILeadProvider {
  readonly id          = 'csv'
  readonly name        = 'CSV Import'
  readonly description = 'Import from Google Maps exports, Outscraper, or any CSV tool.'
  readonly status: ProviderStatus = 'ready'
  readonly icon        = 'FileSpreadsheet'

  supportsSearch() { return false }
  async search(): Promise<DiscoveredBusiness[]> { return [] }

  parse(csvText: string, defaultIndustry = 'HVAC'): DiscoveredBusiness[] {
    const lines  = csvText.trim().split('\n').filter(Boolean)
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))

    // Flexible column resolution
    const col = (candidates: string[]) =>
      candidates.map(c => headers.indexOf(c)).find(i => i >= 0) ?? -1

    const iName     = col(['business name', 'name', 'title', 'company'])
    const iPhone    = col(['phone', 'phone number', 'telephone', 'phone_number'])
    const iAddress  = col(['address', 'full address', 'street', 'location'])
    const iCity     = col(['city', 'locality'])
    const iZip      = col(['zip', 'postal code', 'zip code', 'postcode'])
    const iWebsite  = col(['website', 'website url', 'url', 'web'])
    const iRating   = col(['rating', 'google rating', 'stars', 'avg rating'])
    const iReviews  = col(['reviews', 'review count', 'num reviews', 'number of reviews'])
    const iIndustry = col(['industry', 'category', 'type', 'business type'])

    const results: DiscoveredBusiness[] = []

    for (let i = 1; i < lines.length; i++) {
      const cells = parseCSVLine(lines[i])
      const get   = (idx: number) => (idx >= 0 ? cells[idx]?.trim().replace(/^["']|["']$/g, '') || undefined : undefined)

      const rawName    = get(iName)
      if (!rawName) continue

      const rawWebsite = get(iWebsite)
      const rawRating  = get(iRating)
      const rawReviews = get(iReviews)
      const rawCity    = get(iCity) ?? ''
      const industry   = get(iIndustry) ?? defaultIndustry

      const scoring = scoreDiscoveredLead({
        website:      rawWebsite,
        industry,
        google_rating: rawRating ? parseFloat(rawRating) : undefined,
        review_count:  rawReviews ? parseInt(rawReviews) : undefined,
      })

      results.push({
        id:            `csv-${i}-${Date.now()}`,
        source:        'CSV Import',
        business_name: rawName,
        industry,
        address:       get(iAddress) ?? '',
        city:          rawCity,
        state:         'FL',
        zip:           get(iZip),
        phone:         get(iPhone),
        website:       rawWebsite,
        google_rating: rawRating ? parseFloat(rawRating) : undefined,
        review_count:  rawReviews ? parseInt(rawReviews) : undefined,
        ...scoring,
      })
    }

    return results.sort((a, b) => b.priority_score - a.priority_score)
  }
}

// Simple CSV line parser (handles quoted fields with commas)
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

// ─── Provider: Google Maps (Future) ──────────────────────────────────────────
// Requires: NEXT_PUBLIC_GOOGLE_MAPS_KEY in .env.local
// When key is set, this provider becomes active automatically.

export class GoogleMapsProvider implements ILeadProvider {
  readonly id          = 'google_maps'
  readonly name        = 'Google Maps'
  readonly description = 'Full automation. Search any city + industry. Returns real businesses.'
  readonly status: ProviderStatus =
    typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_GOOGLE_MAPS_KEY
      ? 'connected'
      : 'needs_key'
  readonly icon = 'MapPin'

  supportsSearch() {
    return this.status === 'connected'
  }

  async search(query: SearchQuery): Promise<DiscoveredBusiness[]> {
    if (!this.supportsSearch()) return []

    // Implementation when key is available:
    // const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
    // const q = `${query.industry} in ${query.city ?? query.zip}`
    // const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&key=${key}`
    // const res = await fetch(url)
    // const data = await res.json()
    // return data.results.map((place: any) => mapGooglePlace(place, query.industry))

    return []
  }

  // Helper: how to get a key
  static setupInstructions = `
1. Go to console.cloud.google.com
2. Create a project → Enable "Places API"
3. Create an API key → restrict to Places API
4. Add to .env.local: NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_key_here
5. Restart the dev server
`
}

// ─── Provider: Yelp (Future) ─────────────────────────────────────────────────

export class YelpProvider implements ILeadProvider {
  readonly id          = 'yelp'
  readonly name        = 'Yelp Business Search'
  readonly description = 'Searches Yelp for local businesses. Good for restaurants + services.'
  readonly status: ProviderStatus = 'needs_key'
  readonly icon        = 'Star'

  supportsSearch() { return false }
  async search(): Promise<DiscoveredBusiness[]> { return [] }
}

// ─── Provider: Outscraper (Future) ────────────────────────────────────────────
// Outscraper scrapes Google Maps without needing a GCP account.
// Paid service but cheap — ~$0.002 per result.

export class OutscraperProvider implements ILeadProvider {
  readonly id          = 'outscraper'
  readonly name        = 'Outscraper'
  readonly description = 'Google Maps scraper. No GCP account needed. ~$0.002/result.'
  readonly status: ProviderStatus = 'needs_key'
  readonly icon        = 'Database'

  supportsSearch() { return false }
  async search(): Promise<DiscoveredBusiness[]> { return [] }
}

// ─── Provider: Bing Places (Future) ──────────────────────────────────────────

export class BingPlacesProvider implements ILeadProvider {
  readonly id          = 'bing'
  readonly name        = 'Bing Places'
  readonly description = 'Microsoft local business search. Good backup for Google Maps.'
  readonly status: ProviderStatus = 'coming_soon'
  readonly icon        = 'Search'

  supportsSearch() { return false }
  async search(): Promise<DiscoveredBusiness[]> { return [] }
}

// ─── Provider registry ────────────────────────────────────────────────────────
// Add new providers here. Everything else adapts automatically.

export const PROVIDERS: ILeadProvider[] = [
  new ManualEntryProvider(),
  new CSVImportProvider(),
  new GoogleMapsProvider(),
  new YelpProvider(),
  new OutscraperProvider(),
  new BingPlacesProvider(),
]

export const manualProvider  = PROVIDERS[0] as ManualEntryProvider
export const csvProvider     = PROVIDERS[1] as CSVImportProvider

// ─── Google Maps search URL builder ──────────────────────────────────────────
// Use when no API key: opens Google Maps in a new tab so user can manually find leads

export function buildGoogleMapsSearchURL(query: SearchQuery): string {
  const q = [query.industry, query.city ?? query.zip].filter(Boolean).join(' ')
  return `https://www.google.com/maps/search/${encodeURIComponent(q)}`
}

// ─── CRM import payload ───────────────────────────────────────────────────────
// What gets sent to the leads list when user clicks "Import to CRM"

export interface CRMImportPayload {
  business_name: string
  industry: string
  city: string
  state: string
  phone?: string
  email?: string
  website?: string
  status: 'New'
  lead_score: number
  estimated_deal_value: number
  website_score?: number
  opportunity_score: number
  notes: string
  source: string
  category: LeadCategory
  recommended_demo: string
}

export function toCRMPayload(b: DiscoveredBusiness): CRMImportPayload {
  const dealValue = b.category === 'NO_WEBSITE' || b.category === 'BROKEN_WEBSITE'
    ? 750
    : b.priority_score >= 60 ? 1000 : 750

  const notes = [
    b.category === 'NO_WEBSITE' && 'No website — highest priority lead.',
    b.google_rating && `Google Rating: ${b.google_rating}★ (${b.review_count ?? 0} reviews).`,
    b.address && `Address: ${b.address}.`,
    `Discovered via ${b.source}.`,
    b.recommended_offer,
  ].filter(Boolean).join(' ')

  return {
    business_name:    b.business_name,
    industry:         b.industry,
    city:             b.city,
    state:            b.state,
    phone:            b.phone,
    website:          b.website,
    status:           'New',
    lead_score:       b.priority_score,
    estimated_deal_value: dealValue,
    website_score:    b.website_score,
    opportunity_score: b.priority_score,
    notes,
    source:           b.source,
    category:         b.category,
    recommended_demo: b.recommended_demo,
  }
}

// ─── Sample CSV template ──────────────────────────────────────────────────────
// Show users what format to export

export const CSV_TEMPLATE = `Business Name,Phone,Address,City,ZIP,Website,Rating,Reviews,Industry
Cool Coast Heating & Cooling,(941) 623-4518,"1234 Main St",Sarasota,34201,https://coolcoast.net,4.2,87,HVAC
Aire Masters Heating & Air,(352) 414-6556,"789 Oak Ave",Ocala,34470,https://airemasters.com,3.8,43,HVAC
Breeze Masters AC,(305) 555-0404,"456 Palm Blvd",Miami,33101,,4.5,120,HVAC`

export const CSV_TEMPLATE_DESCRIPTION = `Required: Business Name
Optional: Phone, Address, City, ZIP, Website, Rating (1-5), Reviews, Industry

If Website column is blank → classified as NO WEBSITE (priority 100).
Export from: Google Maps (via Outscraper or PhantomBuster), Yelp, any business directory.`
