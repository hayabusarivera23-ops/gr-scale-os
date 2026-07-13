/**
 * GR Scale OS — Claude Activity Feed (Claude's logbook)
 *
 * PURPOSE: This file is the bridge between Claude (working in chat / scheduled
 * jobs) and Mission Control. Every time Claude does work for GR Scale —
 * outreach drafts, demo builds, content, dashboard syncs — Claude APPENDS an
 * entry to the TOP of the ACTIVITY array below and pushes to main. The
 * dashboard renders this newest-first as "What Claude Has Done".
 *
 * RULES:
 * - The dashboard treats this file as READ-ONLY display. No UI ever writes here.
 * - Claude: prepend new entries (newest first), never rewrite history.
 * - Dates are ISO (YYYY-MM-DD). Keep title short; detail is 1-2 sentences.
 */

export type ActivityCategory = 'outreach' | 'build' | 'content' | 'system'

export interface ActivityEntry {
  date: string          // ISO date of the work session
  category: ActivityCategory
  title: string         // short, e.g. "10 pitch drafts staged in Gmail"
  detail: string        // what happened + where the output lives
}

export const ACTIVITY: ActivityEntry[] = [
  {
    date: '2026-07-12',
    category: 'build',
    title: 'grscales.com upgraded with FX v3 — deployed to production',
    detail: 'Added count-up stats, 3D tilt + cursor-spotlight cards, drifting aurora backgrounds, animated glow dividers, button sheen, parallax hero, nav underline, and staggered scroll reveals across every homepage section. Pushed to main; Vercel deployed.',
  },
  {
    date: '2026-07-12',
    category: 'system',
    title: 'Mission Control launched — this feed is now Claude\'s logbook',
    detail: 'Claude will append an entry here on every work session (outreach runs, demo builds, content drops, dashboard syncs) and push to main so this feed always shows the latest work. Newest entries appear first.',
  },
]
