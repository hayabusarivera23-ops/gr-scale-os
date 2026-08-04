export const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gr-scale-os.vercel.app'

export const GR_SCALE = {
  name: 'GR Scale',
  legalName: 'GR Scale',
  url: PUBLIC_SITE_URL,
  brandUrl: 'https://www.grscales.com',
  bookingUrl: 'https://calendly.com/gio-grscales/free-website-audit-20-min',
  email: 'gio@grscales.com',
  area: 'Tampa Bay, Florida',
  description:
    'GR Scale helps local businesses get seen, earn trust, and turn more searches into calls through websites, Google Business Profile improvements, local SEO, reviews, content, and conversion systems.',
}

export const SEO_KEYWORDS = [
  'help me grow my business',
  'grow my local business',
  'business visibility system',
  'local business marketing',
  'local SEO Tampa',
  'HVAC marketing Tampa',
  'website design for HVAC companies',
  'Google Business Profile optimization',
  'get more calls from Google',
  'small business growth help',
]

export const SERVICE_AREAS = [
  'Tampa',
  'Brandon',
  'Riverview',
  'Clearwater',
  'St. Petersburg',
  'Lakeland',
  'Wesley Chapel',
  'Sarasota',
]

export const CORE_SERVICES = [
  {
    name: 'Business Visibility Audit',
    summary: 'A fast review of the website, Google presence, search results, trust signals, and call path.',
  },
  {
    name: 'Local Business Website',
    summary: 'Mobile-first pages built to explain the offer, build trust, and make calling or booking easy.',
  },
  {
    name: 'Google Business Profile Optimization',
    summary: 'Service categories, service areas, photos, descriptions, posts, Q&A, and review systems.',
  },
  {
    name: 'Local SEO Foundation',
    summary: 'Search-intent pages, structured data, internal links, titles, descriptions, and local keywords.',
  },
  {
    name: 'Content and Follow-Up System',
    summary: 'Simple posts, scripts, offers, and follow-up messages that keep the business visible.',
  },
]

export const FAQS = [
  {
    question: 'How can I get more customers for my local business?',
    answer:
      'Start by fixing visibility and trust: make sure customers can find you on Google, understand what you do in five seconds, see proof that you are real, and contact you easily from a phone.',
  },
  {
    question: 'Does GR Scale only build websites?',
    answer:
      'No. A website is one part of the system. GR Scale also works on Google Business Profile, local SEO, reviews, content, and conversion paths that help a business get seen and get more calls.',
  },
  {
    question: 'What type of business should start first?',
    answer:
      'Local service businesses such as HVAC, roofing, plumbing, landscaping, barber shops, and contractors usually benefit quickly because customers often search nearby and call from their phone.',
  },
  {
    question: 'What is the first step?',
    answer:
      'The first step is a short visibility audit that identifies the biggest problem costing calls, then turns that into a simple action plan.',
  },
]

export function publicUrl(path = '') {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${PUBLIC_SITE_URL}${cleanPath}`
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'LocalBusiness'],
    name: GR_SCALE.name,
    url: GR_SCALE.url,
    email: GR_SCALE.email,
    areaServed: SERVICE_AREAS.map(name => ({ '@type': 'City', name })),
    description: GR_SCALE.description,
    sameAs: [GR_SCALE.brandUrl],
    makesOffer: CORE_SERVICES.map(service => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: service.name,
        description: service.summary,
      },
    })),
  }
}

export function faqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}
