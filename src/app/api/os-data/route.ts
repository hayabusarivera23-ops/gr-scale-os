import { NextResponse } from 'next/server'

const OWNER = process.env.GITHUB_OWNER || 'hayabusarivera23-ops'
const REPO = process.env.GITHUB_REPO || 'gr-scale-os'
const BRANCH = process.env.GITHUB_BRANCH || 'main'
const DATA_PATH = process.env.OS_DATA_PATH || 'ops/os-data.json'

type GhFile = {
  sha: string
  content: string
  encoding: string
}

function ghHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

async function readGhFile(token: string): Promise<{ data: unknown | null; sha: string | null }> {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${DATA_PATH}?ref=${BRANCH}`
  const response = await fetch(url, { headers: ghHeaders(token), cache: 'no-store' })

  if (response.status === 404) return { data: null, sha: null }
  if (!response.ok) throw new Error(`GitHub read failed: ${response.status}`)

  const file = await response.json() as GhFile
  const json = Buffer.from(file.content, 'base64').toString('utf8')
  return { data: JSON.parse(json), sha: file.sha }
}

async function writeGhFile(token: string, data: unknown, sha: string | null) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${DATA_PATH}`
  const body: Record<string, unknown> = {
    message: 'sync: update dashboard operating data',
    content: Buffer.from(JSON.stringify(data, null, 2), 'utf8').toString('base64'),
    branch: BRANCH,
  }
  if (sha) body.sha = sha

  const response = await fetch(url, {
    method: 'PUT',
    headers: { ...ghHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) throw new Error(`GitHub write failed: ${response.status}`)
}

export async function GET() {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return NextResponse.json({ ok: true, configured: false, data: null })
  }

  try {
    const { data } = await readGhFile(token)
    return NextResponse.json({ ok: true, configured: true, data })
  } catch (error) {
    return NextResponse.json(
      { ok: false, configured: true, error: error instanceof Error ? error.message : 'Unknown sync error' },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request) {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return NextResponse.json(
      { ok: false, configured: false, error: 'Add GITHUB_TOKEN in Vercel to enable remote sync.' },
      { status: 503 },
    )
  }

  try {
    const payload = await request.json()
    if (!payload?.data || typeof payload.data !== 'object') {
      return NextResponse.json({ ok: false, error: 'Missing dashboard data.' }, { status: 400 })
    }

    const { sha } = await readGhFile(token)
    await writeGhFile(token, payload.data, sha)
    return NextResponse.json({ ok: true, configured: true })
  } catch (error) {
    return NextResponse.json(
      { ok: false, configured: true, error: error instanceof Error ? error.message : 'Unknown sync error' },
      { status: 500 },
    )
  }
}
