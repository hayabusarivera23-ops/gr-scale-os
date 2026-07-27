import { NextResponse, type NextRequest } from 'next/server'

const USER = process.env.OS_BASIC_AUTH_USER
const PASSWORD = process.env.OS_BASIC_AUTH_PASSWORD

export function middleware(request: NextRequest) {
  if (!USER || !PASSWORD) return NextResponse.next()

  const auth = request.headers.get('authorization')

  if (auth?.startsWith('Basic ')) {
    const encoded = auth.slice(6)
    const decoded = atob(encoded)
    const separator = decoded.indexOf(':')
    const username = decoded.slice(0, separator)
    const password = decoded.slice(separator + 1)

    if (username === USER && password === PASSWORD) {
      return NextResponse.next()
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="GR Scale OS"',
    },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
