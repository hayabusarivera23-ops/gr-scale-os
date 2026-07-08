/**
 * GR Scale OS — Live Demo Registry
 *
 * SINGLE SOURCE OF TRUTH for the deployed Demo Factory.
 * All 13 demos are LIVE at gr-scale-demos.vercel.app — these are real URLs,
 * not placeholders. Every OS page that references a demo imports from here.
 */

export const DEMO_BASE = 'https://gr-scale-demos.vercel.app'

export interface LiveDemo {
  slug: string
  industry: string
  url: string
  status: 'Live'
  useCase: string
  outreachAngle: string
  /** matches lead.industry values used in the CRM */
  industryKeys: string[]
  /** relative sales value of this niche (avg ticket + recurring fit) */
  priority: number
}

export const LIVE_DEMOS: LiveDemo[] = [
  { slug: 'hvac',             industry: 'HVAC',             url: `${DEMO_BASE}/hvac`,             status: 'Live', priority: 10, industryKeys: ['hvac', 'ac', 'air'],                        useCase: 'Primary niche. Lead with meloair.net — REAL client site Gio built, live on the client\'s domain. Demo is backup.', outreachAngle: '"Your reviews are great but your site loses mobile callers — here\'s a Tampa HVAC site I built: meloair.net"' },
  { slug: 'roofing',          industry: 'Roofing',          url: `${DEMO_BASE}/roofing`,          status: 'Live', priority: 9,  industryKeys: ['roof'],                                     useCase: 'Highest ticket sizes in local services. Great Scale-package targets after storms.', outreachAngle: '"Storm season is here — homeowners pick the roofer whose site looks trustworthy at 11pm. Yours doesn\'t show your insurance-claim help."' },
  { slug: 'plumbing',         industry: 'Plumbing',         url: `${DEMO_BASE}/plumbing`,         status: 'Live', priority: 8,  industryKeys: ['plumb'],                                    useCase: 'Emergency-driven niche — sites that answer "can they come NOW" win the call.', outreachAngle: '"When a pipe bursts at 2am, people call whoever\'s site loads first and says 24/7. Yours takes 8 seconds and doesn\'t."' },
  { slug: 'electrician',      industry: 'Electrical',       url: `${DEMO_BASE}/electrician`,      status: 'Live', priority: 8,  industryKeys: ['electric'],                                 useCase: 'EV charger demand = homeowners actively searching. Panel upgrades are big tickets.', outreachAngle: '"People searching \'EV charger installer near me\' are ready to spend $1,000+. Your site doesn\'t even mention it."' },
  { slug: 'pest-control',     industry: 'Pest Control',     url: `${DEMO_BASE}/pest-control`,     status: 'Live', priority: 7,  industryKeys: ['pest'],                                     useCase: 'Recurring-revenue businesses understand monthly plans — easiest Growth/Scale pitch.', outreachAngle: '"You sell monthly protection plans — your website should sell them too. Right now it doesn\'t."' },
  { slug: 'cleaning',         industry: 'Cleaning',         url: `${DEMO_BASE}/cleaning`,         status: 'Live', priority: 6,  industryKeys: ['clean', 'maid'],                            useCase: 'High volume of owner-operators with DIY sites. Fast closes at Starter tier.', outreachAngle: '"Recurring clients are your goldmine — your site should book them, not just show photos."' },
  { slug: 'painting',         industry: 'Painting',         url: `${DEMO_BASE}/painting`,         status: 'Live', priority: 6,  industryKeys: ['paint'],                                    useCase: 'Visual niche — before/after gallery sells itself. Cabinet painting = high margin.', outreachAngle: '"Your work is visual. Your website has no gallery. That\'s jobs walking to the next painter."' },
  { slug: 'flooring',         industry: 'Flooring',         url: `${DEMO_BASE}/flooring`,         status: 'Live', priority: 6,  industryKeys: ['floor'],                                    useCase: 'Financing section matters — big tickets. Showroom businesses have budget.', outreachAngle: '"Flooring is a $5k+ decision. Buyers research 5 sites first — yours needs to look like the winner."' },
  { slug: 'tree-service',     industry: 'Tree Service',     url: `${DEMO_BASE}/tree-service`,     status: 'Live', priority: 7,  industryKeys: ['tree'],                                     useCase: 'Storm/emergency + crane work = urgency + big tickets. Insurance angle like roofing.', outreachAngle: '"After every storm, homeowners Google in a panic. The tree company with the emergency-ready site gets the crane jobs."' },
  { slug: 'pressure-washing', industry: 'Pressure Washing', url: `${DEMO_BASE}/pressure-washing`, status: 'Live', priority: 5,  industryKeys: ['pressure', 'wash'],                         useCase: 'Low-ticket but easy closes and great before/after content. Starter-tier volume.', outreachAngle: '"Before/after photos are your best salesman — your Facebook page buries them. A site would close them."' },
  { slug: 'landscaping',      industry: 'Landscaping',      url: `${DEMO_BASE}/landscaping`,      status: 'Live', priority: 6,  industryKeys: ['landscap', 'lawn'],                         useCase: 'Monthly maintenance contracts = recurring mindset. Seasonal packages upsell well.', outreachAngle: '"You want monthly contracts, not one-off mows. Your site should sell the yearly plan — here\'s how that looks."' },
  { slug: 'restaurant',       industry: 'Restaurant',       url: `${DEMO_BASE}/restaurant`,       status: 'Live', priority: 4,  industryKeys: ['restaurant', 'food', 'cafe'],               useCase: 'Future niche. Use when a restaurant owner crosses your path — don\'t prospect it yet.', outreachAngle: '"Your menu is a blurry PDF from 2022. Diners check the site before they book — here\'s what they should see."' },
  { slug: 'barber',           industry: 'Barbershop',       url: 'https://lexthebarber.com',      status: 'Live', priority: 5,  industryKeys: ['barber', 'hair'],                           useCase: 'Secondary niche. lexthebarber.com is a REAL client site Gio built — send it as proof. Generic demo backup: ' + DEMO_BASE + '/barber.', outreachAngle: '"Your Instagram is fire but bookings live in your DMs. Here\'s a barber site I built: lexthebarber.com"' },
]

/** Match a CRM lead industry string to the right live demo. */
export function demoForIndustry(industry: string | undefined | null): LiveDemo {
  const n = (industry ?? '').toLowerCase()
  const hit = LIVE_DEMOS.find(d => d.industryKeys.some(k => n.includes(k)))
  return hit ?? LIVE_DEMOS[0] // default: HVAC (primary niche)
}

/** Highest-value demo to lead with today (primary niche first). */
export function highestValueDemo(): LiveDemo {
  return [...LIVE_DEMOS].sort((a, b) => b.priority - a.priority)[0]
}

export const DEMOS_LIVE_COUNT = LIVE_DEMOS.length
