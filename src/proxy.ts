import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Auth pages - redirect to dashboard if already logged in
  if (user && (
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/signup' ||
    request.nextUrl.pathname === '/forgot-password'
  )) {
    const url = request.nextUrl.clone()
    const tab = url.searchParams.get('tab')
    if (tab === 'workspace') {
      url.pathname = '/workspace'
      url.searchParams.delete('tab')
    } else if (tab === 'templates') {
      url.pathname = '/templates'
      url.searchParams.delete('tab')
    } else if (tab === 'tags') {
      url.pathname = '/tags'
      url.searchParams.delete('tab')
    } else if (tab === 'pipelines') {
      url.pathname = '/pipeline-manager'
      url.searchParams.delete('tab')
    } else if (tab === 'integrations') {
      url.pathname = '/integrations'
      url.searchParams.delete('tab')
    } else if (tab === 'appearance') {
      url.pathname = '/appearance'
      url.searchParams.delete('tab')
    } else if (tab === 'team') {
      url.pathname = '/team'
      url.searchParams.delete('tab')
    } else if (tab && ['profile', 'whatsapp'].includes(tab)) {
      url.pathname = '/settings'
    } else {
      url.pathname = '/dashboard'
    }
    return NextResponse.redirect(url)
  }

  // Protected pages - redirect to login if not authenticated
  const protectedPaths = [
    '/dashboard',
    '/inbox',
    '/contacts',
    '/pipelines',
    '/pipeline-manager',
    '/broadcasts',
    '/automations',
    '/flows',
    '/templates',
    '/quick-replies',
    '/tags',
    '/segments',
    '/commerce',
    '/integrations',
    '/widgets',
    '/ai-router',
    '/analytics',
    '/team',
    '/workspace',
    '/appearance',
    '/support',
    '/settings',
    '/admin',
    '/ai-conversations',
    '/ai-knowledge',
    '/developers',
    '/docs'
  ]
  if (!user && protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // API routes that need auth (not webhooks)
  if (!user && request.nextUrl.pathname.startsWith('/api/whatsapp/') &&
      !request.nextUrl.pathname.includes('/webhook')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
