import { NextRequest, NextResponse } from 'next/server'

const REPO = 'hayabusarivera23-ops/gr-scale-os'
const FILE_PATH = 'ops/commands.json'
const GH_API = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`

type CommandStatus = 'pending' | 'done' | 'failed'

interface Command {
  id: string
  type: string
  params?: Record<string, string>
  status: CommandStatus
  note?: string
  createdAt: string
  updatedAt?: string
}

interface QueueBody {
  action?: string
  type?: string
  params?: Record<string, string>
  id?: string
  status?: CommandStatus
  note?: string
}

const ALLOWED_TYPES = ['find-leads', 'audit', 'follow-ups', 'content', 'proposal', 'custom']

async function readQueue(token?: string): Promise<{ commands: Command[]; sha: string | null }> {
  const res = await fetch(GH_API, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  })
  if (res.status === 404) return { commands: [], sha: null }
  if (!res.ok) throw new Error(`GitHub read failed: ${res.status}`)
  const data = (await res.json()) as { content: string; sha: string }
  const decoded = Buffer.from(data.content, 'base64').toString('utf8')
  const parsed = JSON.parse(decoded) as { commands?: Command[] }
  return { commands: parsed.commands ?? [], sha: data.sha }
}

async function writeQueue(commands: Command[], sha: string | null, token: string): Promise<void> {
  const payload = {
    message: 'queue: update commands from dashboard/executor',
    content: Buffer.from(JSON.stringify({ commands }, null, 2)).toString('base64'),
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
    const { commands } = await readQueue(process.env.GITHUB_TOKEN)
    return NextResponse.json({ ok: true, configured: Boolean(process.env.GITHUB_TOKEN), commands })
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

  let body: QueueBody
  try {
    body = (await req.json()) as QueueBody
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const { commands, sha } = await readQueue(token)

    if (body.action === 'add') {
      if (!body.type || !ALLOWED_TYPES.includes(body.type)) {
        return NextResponse.json({ ok: false, error: 'Unknown command type' }, { status: 400 })
      }
      const pendingCount = commands.filter(c => c.status === 'pending').length
      if (pendingCount >= 20) {
        return NextResponse.json({ ok: false, error: 'Queue is full (20 pending max)' }, { status: 429 })
      }
      commands.push({
        id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        type: body.type,
        params: body.params ?? {},
        status: 'pending',
        createdAt: new Date().toISOString(),
      })
    } else if (body.action === 'update') {
      const target = commands.find(c => c.id === body.id)
      if (!target) {
        return NextResponse.json({ ok: false, error: 'Command not found' }, { status: 404 })
      }
      if (body.status) target.status = body.status
      if (body.note) target.note = body.note
      target.updatedAt = new Date().toISOString()
    } else {
      return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 })
    }

    await writeQueue(commands, sha, token)
    return NextResponse.json({ ok: true, commands })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
