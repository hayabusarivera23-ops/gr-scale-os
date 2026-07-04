-- ============================================================
-- TURBO WEB CO OS — SEED DATA
-- ============================================================

-- Settings
INSERT INTO settings (key, value) VALUES
('agency', '{"name":"Turbo Web Co","tagline":"HVAC Websites That Convert","email":"gio@turbowebco.com","phone":"(407) 555-0100","city":"Orlando","state":"FL","monthly_goal":5000}'),
('packages', '[
  {"id":"launch","name":"Launch","price":750,"description":"5-page HVAC site, mobile-first, click-to-call, quote form, GBP setup","features":["5 pages","Mobile-first","Click-to-call","Quote form","GBP setup"]},
  {"id":"growth","name":"Growth","price":1500,"description":"Launch + service-area pages, reviews widget, local SEO, copywriting","features":["Everything in Launch","Service-area pages","Reviews widget","Local SEO","Copywriting"]},
  {"id":"dominate","name":"Dominate","price":2500,"description":"Growth + financing page, careers page, full SEO, speed optimization","features":["Everything in Growth","Financing page","Careers page","Full SEO","Speed optimization"]},
  {"id":"maintenance","name":"Maintenance","price":99,"description":"Monthly hosting, updates, GBP monitoring","features":["Hosting","Monthly updates","GBP monitoring","1 content change/mo"]}
]');

-- Leads (from real FL_HVAC_Leads data — sanitized)
INSERT INTO leads (business_name, owner_name, phone, email, website, city, state, status, lead_source, lead_score, estimated_deal_value, website_notes, pain_points, last_contact_date, next_follow_up, notes) VALUES
('Cool Coast Heating & Cooling', 'Owner', '(941) 623-4518', 'office@coolcoast.net', 'https://coolcoast.net', 'Sarasota', 'FL', 'Contacted', 'Google Maps', 92, 750, 'Hibu DIY template. Shows placeholder 555-555-5555 phone and mymail@mailservice.com. Expired coupons. Generic stock design.', 'Placeholder contact info live on site. Expired promos. No mobile click-to-call.', CURRENT_DATE - 1, CURRENT_DATE + 1, 'Tier A — verified weak site. Outreach angle: point out the 555 phone number and expired coupons directly.'),

('Aire Masters Heating & Air', NULL, '(352) 414-6556', NULL, 'https://airemasters.com', 'Ocala', 'FL', 'Contacted', 'Google Maps', 89, 750, 'Title tag reads "Brien for County Commissioner" — leftover template. Blank meta description. Broken icon placeholders. Duplicate content blocks.', 'Title tag SEO disaster. No meta description. Broken icons.', CURRENT_DATE - 2, CURRENT_DATE + 2, 'Tier A — angle: their Google result shows "Brien for County Commissioner" as the page title. Opens the call perfectly.'),

('Fort Lauderdale AC Repair', NULL, '(754) 266-3008', NULL, NULL, 'Fort Lauderdale', 'FL', 'New', 'Google Maps', 65, 750, 'Not yet audited — small independent with 11 reviews.', 'Small independent, likely DIY/outdated site.', NULL, CURRENT_DATE + 3, 'Tier B. Audit site before calling. 5-star rating is an asset — can mention that on call.'),

('Arctic Air Conditioning', NULL, '(407) 555-0202', NULL, 'https://arcticair-orlando.com', 'Orlando', 'FL', 'Interested', 'Google Maps', 78, 1500, 'Wix site from ~2018. No service-area pages. No reviews displayed. Loads in 6+ seconds.', 'Slow site. No local SEO. Missing service-area pages.', CURRENT_DATE - 3, CURRENT_DATE + 1, 'Called Monday, showed interest. Sending audit Loom today.'),

('Sunshine HVAC Services', NULL, '(813) 555-0303', 'info@sunshinehvac.com', 'https://sunshinehvac.com', 'Tampa', 'FL', 'Appointment Set', 'Google Maps', 85, 1500, 'GoDaddy site. No quote form. Phone not click-to-call on mobile. No SSL on sub-pages.', 'No mobile UX. No SSL. No quote form.', CURRENT_DATE - 1, CURRENT_DATE + 7, 'Call booked for Thursday 10am. Strong prospect — owner mentioned losing calls to competitors.'),

('Breeze Masters AC', NULL, '(305) 555-0404', NULL, NULL, 'Miami', 'FL', 'New', 'Google Maps', 60, 750, 'No website. Facebook page only.', 'No website at all — pure Facebook.', NULL, CURRENT_DATE + 2, 'No site at all. Easy demo pitch. Lead with acorlandohvac.com demo.'),

('Premier Climate Control', 'Mike R.', '(904) 555-0505', 'mike@premierclimate.com', 'https://premierclimate.com', 'Jacksonville', 'FL', 'Proposal Sent', 'Referral', 91, 2500, 'Outdated site, but owner is professional and growth-minded.', 'Site does not match their service quality. Losing commercial bids because site looks small.', CURRENT_DATE - 5, CURRENT_DATE + 2, 'Proposal sent for Dominate package. Follow up Tuesday. Mike is the decision maker.'),

('Gulf Coast HVAC', NULL, '(239) 555-0606', NULL, 'https://gulfcoasthvac.net', 'Cape Coral', 'FL', 'Lost', 'Google Maps', 45, 750, 'Site rebuilt by nephew last month.', 'Just got a new site from family member.', CURRENT_DATE - 10, NULL, 'Nephew built a site. Mark dead for 6 months then circle back.'),

('Comfort Zone AC', NULL, '(863) 555-0707', NULL, NULL, 'Lakeland', 'FL', 'New', 'Google Maps', 70, 750, 'No website. Listed on Google with a phone only.', 'No site. Phone only listing.', NULL, CURRENT_DATE + 1, 'Priority call target. No site means low bar for pitch.'),

('Elite HVAC Solutions', NULL, '(772) 555-0808', 'info@elitehvac.com', 'https://elitehvac.com', 'Port St. Lucie', 'FL', 'Researching', 'Google Maps', 72, 1500, 'Squarespace template. Decent but no service-area pages, no reviews, no financing page.', 'Missing service-area pages and reviews widget.', NULL, CURRENT_DATE + 4, 'Good size company. Research their service areas before calling. Pitch Growth package.');

-- Clients
INSERT INTO clients (business_name, owner_name, email, phone, website_url, package, monthly_value, project_status, payment_status, last_contact, renewal_date, notes) VALUES
('Sunshine HVAC Services', 'Carlos M.', 'info@sunshinehvac.com', '(813) 555-0303', 'https://sunshinehvac.com', 'Growth', 149, 'Active', 'Current', CURRENT_DATE, CURRENT_DATE + 30, 'First client. Signed Growth + monthly maintenance. Very happy with mobile site.');

-- Projects
INSERT INTO projects (name, status, project_value, deposit_paid, deadline, notes, deliverables)
SELECT 'Sunshine HVAC — Growth Website', 'Development', 1500, 750, CURRENT_DATE + 10,
  'Client provided logo + 12 photos. Services: AC install, repair, maintenance. Cities: Tampa, Brandon, Riverview, Valrico.',
  'Homepage, Services page, Service Areas page, About page, Contact page. Quote form → email. GBP optimization.'
FROM clients WHERE business_name = 'Sunshine HVAC Services' LIMIT 1;

-- UPDATE project to link client
UPDATE projects p
SET client_id = c.id
FROM clients c
WHERE c.business_name = 'Sunshine HVAC Services'
AND p.name = 'Sunshine HVAC — Growth Website';

-- Tasks
INSERT INTO tasks (title, description, priority, due_date, status) VALUES
('Call Cool Coast Heating & Cooling', 'Cite the 555-555-5555 placeholder phone and expired coupons. Ask to text the 1-min Loom audit.', 'High', CURRENT_DATE, 'Pending'),
('Follow up: Aire Masters', 'Day 3 follow-up. Send extra finding: Google title tag reads "Brien for County Commissioner."', 'High', CURRENT_DATE, 'Pending'),
('Send Loom audit to Arctic Air', 'Record 90-sec screen recording of their site on mobile. Show 3 flaws. Send to (407) 555-0202.', 'High', CURRENT_DATE, 'Pending'),
('Prep for Sunshine HVAC call Thursday', 'Review their current site. Prep the Dominate pitch angle. Have Stripe invoice ready at $1,500.', 'Medium', CURRENT_DATE + 2, 'Pending'),
('Follow up: Premier Climate proposal', 'Mike has had the proposal 5 days. Call him. Ask if he has questions about the Dominate scope.', 'High', CURRENT_DATE + 1, 'Pending'),
('Build Sunshine HVAC — Services page', 'Tampa, Brandon, Riverview, Valrico service areas. 5 service blurbs from client notes.', 'High', CURRENT_DATE + 3, 'In Progress'),
('Set up Stripe account', 'Create account at stripe.com. Add business info. Test invoice flow.', 'High', CURRENT_DATE, 'Pending'),
('Record acorlandohvac.com Loom demo', '60-second walkthrough. Show mobile view, click-to-call, quote form. This is your sales weapon.', 'High', CURRENT_DATE, 'Pending'),
('Add 20 new FL HVAC leads', 'Google Maps: search AC repair in Gainesville and Pensacola. Rank 10-30 results only.', 'Medium', CURRENT_DATE + 2, 'Pending'),
('Call 10 New leads from spreadsheet', 'Focus on leads #3, #9 (no website at all). Pitch the free demo.', 'Medium', CURRENT_DATE + 1, 'Pending');

-- Outreach logs
INSERT INTO outreach_logs (type, outcome, notes, logged_at) VALUES
('cold_call', 'interested', 'Arctic Air — owner answered. Said site is old. Wants to see examples. Sending Loom.', NOW() - INTERVAL '3 days'),
('email', 'no_answer', 'Cool Coast — sent email pointing out 555 phone number. No reply yet.', NOW() - INTERVAL '2 days'),
('cold_call', 'appointment_set', 'Sunshine HVAC — Carlos answered. Booked call for Thursday 10am.', NOW() - INTERVAL '1 day'),
('email', 'sent', 'Premier Climate — sent Dominate proposal. $2,500. Waiting on Mike.', NOW() - INTERVAL '5 days'),
('cold_call', 'no_answer', 'Fort Lauderdale AC Repair — no answer. Left voicemail.', NOW() - INTERVAL '1 day');

-- Demos
INSERT INTO demos (name, url, category, description) VALUES
('AC Orlando HVAC', 'https://acorlandohvac.com', 'HVAC', 'Primary HVAC demo — Next.js, dark/light mode, click-to-call, quote form, service areas. Use for all HVAC prospect calls.'),
('Sharp Cuts Barbershop Demo', 'https://sharpcuts-demo.vercel.app', 'Barber', 'Barbershop template — Framer. Shows booking link, gallery, hours, IG feed. Use if pivoting niche.'),
('Precision Pressure Washing', 'https://precisionpw-demo.vercel.app', 'Pressure Washing', 'Coming soon. Build this next after landing client #2.');

-- Lead activity log
INSERT INTO lead_activity (lead_id, type, description)
SELECT id, 'call', 'First cold call. Cited 555 placeholder phone. Asked to text Loom audit.' FROM leads WHERE business_name = 'Cool Coast Heating & Cooling';

INSERT INTO lead_activity (lead_id, type, description)
SELECT id, 'email', 'Sent cold email: subject "Wrong phone number on Cool Coast website."' FROM leads WHERE business_name = 'Cool Coast Heating & Cooling';

INSERT INTO lead_activity (lead_id, type, description)
SELECT id, 'call', 'Called, owner answered. Interested in seeing examples. Sending Loom audit.' FROM leads WHERE business_name = 'Arctic Air Conditioning';

INSERT INTO lead_activity (lead_id, type, description)
SELECT id, 'meeting', 'Call booked: Thursday 10am. Carlos is the owner and decision maker.' FROM leads WHERE business_name = 'Sunshine HVAC Services';

INSERT INTO lead_activity (lead_id, type, description)
SELECT id, 'note', 'Sent Dominate proposal: $2,500 one-time + $149/mo retainer. Waiting on Mike R.' FROM leads WHERE business_name = 'Premier Climate Control';

-- Invoices
INSERT INTO invoices (type, amount, status, due_date, notes)
SELECT 'Deposit', 750, 'Paid', CURRENT_DATE - 3, 'Growth package deposit — Sunshine HVAC Services'
FROM clients WHERE business_name = 'Sunshine HVAC Services';

INSERT INTO invoices (type, amount, status, due_date, notes)
SELECT 'Final', 750, 'Pending', CURRENT_DATE + 10, 'Growth package final payment — due at launch'
FROM clients WHERE business_name = 'Sunshine HVAC Services';
