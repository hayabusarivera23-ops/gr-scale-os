import { NextRequest, NextResponse } from 'next/server'

const REPO = 'hayabusarivera23-ops/gr-scale-os'
const FILE_PATH = 'ops/employees.json'
const GH_API = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`

interface Employee {
  id: string
  name: string
  emoji: string
  role: string
  schedule: string
  status: 'active' | 'paused'
  focus: string
  instructions: string
  lastRun: string
  lastReport: string
}

interface EmpBody {
  action?: string
  id?: string
  status?: 'active' | 'paused'
  focus?: string
  instructions?: string
  note?: string
}

async function readFileGh(token?: string): Promise<{ employees: Employee[]; sha: string | null }> {
  const res = await fetch(GH_API, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  })
  if (res.status === 404) return { employees: [], sha: null }
  if (!res.ok) throw new Error(`GitHub read failed: ${res.status}`)
  const data = (await res.json()) as { content: string; sha: string }
  const decoded = Buffer.from(data.content, 'base64').toString('utf8')
  const parsed = JSON.parse(decoded) as { employees?: Employee[] }
  return { employees: parsed.employees ?? [], sha: data.sha }
}

async function writeFileGh(employees: Employee[], sha: string | null, token: string): Promise<void> {
  const payload = {
    message: 'employees: directive/report update',
    content: Buffer.from(JSON.stringify({ employees }, null, 2)).toString('base64'),
    ...(sha ? { sha } : {}),
  }
  const res = await fetch(GH_API, {
    method: 'PUT',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`GitHub write failed: ${res.status}`)
}

export async function GET() {
  try {
    const { employees } = await readFileGh(process.env.GITHUB_TOKEN)
    return NextResponse.json({ ok: true, configured: Boolean(process.env.GITHUB_TOKEN), employees })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return NextResponse.json(
      { ok: false, error: 'Bridge not configured yet: add a GITHUB_TOKEN environment variable in Vercel.' },
      { status: 503 }
    )
  }

  let body: EmpBody
  try {
    body = (await req.json()) as EmpBody
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const { employees, sha } = await readFileGh(token)
    const emp = employees.find(e => e.id === body.id)
    if (!emp) return NextResponse.json({ ok: false, error: 'Employee not found' }, { status: 404 })

    if (body.action === 'set') {
      if (body.status && (body.status === 'active' || body.status === 'paused')) emp.status = body.status
      if (typeof body.focus === 'string') emp.focus = body.focus.slice(0, 300)
      if (typeof body.instructions === 'string') emp.instructions = body.instructions.slice(0, 600)
    } else if (body.action === 'report') {
      emp.lastRun = new Date().toISOString()
      if (typeof body.note === 'string') emp.lastReport = body.note.slice(0, 300)
    } else {
      return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 })
    }

    await writeFileGh(employees, sha, token)
    return NextResponse.json({ ok: true, employees })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
