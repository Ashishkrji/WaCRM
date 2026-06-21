import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Singleton instance — one client shared across the whole browser session.
// Creating multiple clients causes auth-lock contention ("Lock was released
// because another request stole it") and intermittent fetch failures.
let browserClient: SupabaseClient | undefined

export function createClient() {
  if (browserClient) return browserClient

  const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      return await fetch(input, init)
    } catch (error: any) {
      const isFetchError =
        error instanceof TypeError ||
        error.message?.includes('fetch') ||
        error.message?.includes('Failed to fetch') ||
        error.name === 'TypeError'

      if (isFetchError) {
        const url =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url

        console.warn('[Supabase Client] Offline fallback intercepting URL:', url)

        // Intercept auth-related requests to allow local bypass
        if (url.includes('/auth/v1/token') || url.includes('/auth/v1/session')) {
          const mockUser = {
            id: 'dev-admin-id-12345',
            email: 'developer@wacrm.tech',
            role: 'authenticated',
            aud: 'authenticated',
            app_metadata: { provider: 'email', providers: ['email'] },
            user_metadata: { full_name: 'Developer Admin' },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          const mockSession = {
            access_token: 'mock-access-token',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'mock-refresh-token',
            user: mockUser,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          }
          const data = url.includes('/auth/v1/session')
            ? { session: mockSession, user: mockUser }
            : { session: mockSession, user: mockUser }
          return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        if (url.includes('/auth/v1/user')) {
          const mockUser = {
            id: 'dev-admin-id-12345',
            email: 'developer@wacrm.tech',
            role: 'authenticated',
            aud: 'authenticated',
            app_metadata: { provider: 'email', providers: ['email'] },
            user_metadata: { full_name: 'Developer Admin' },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          return new Response(JSON.stringify(mockUser), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        if (url.includes('/auth/v1/logout')) {
          return new Response(JSON.stringify({}), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        // Intercept database table requests
        if (url.includes('/rest/v1/profiles')) {
          const mockProfile = {
            id: 'dev-admin-id-12345',
            user_id: 'dev-admin-id-12345',
            full_name: 'Developer Admin',
            email: 'developer@wacrm.tech',
            avatar_url: null,
            role: 'super_admin',
            permissions: [
              'contacts_access',
              'messaging_access',
              'analytics_access',
              'settings_access',
              'automation_access',
              'team_management',
              'broadcast_access',
              'api_access',
              'whatsapp_management',
            ],
            status: 'active',
            last_login_at: new Date().toISOString(),
            beta_features: ['task:System Admin'],
          }
          return new Response(JSON.stringify([mockProfile]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        if (url.includes('/rest/v1/business_workspaces')) {
          const mockWorkspace = {
            id: 'dev-workspace-id-12345',
            user_id: 'dev-admin-id-12345',
            name: 'Developer Workspace',
            created_at: new Date().toISOString(),
          }
          return new Response(JSON.stringify([mockWorkspace]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        if (url.includes('/rest/v1/pipelines')) {
          const mockPipeline = {
            id: 'dev-pipeline-id-12345',
            user_id: 'dev-admin-id-12345',
            name: 'B2B Sales Pipeline',
            created_at: new Date().toISOString(),
          }
          return new Response(JSON.stringify([mockPipeline]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        if (url.includes('/rest/v1/pipeline_stages')) {
          const mockStages = [
            { id: 'stage-1', pipeline_id: 'dev-pipeline-id-12345', name: 'New Lead', color: '#3b82f6', position: 0 },
            { id: 'stage-2', pipeline_id: 'dev-pipeline-id-12345', name: 'Qualified', color: '#eab308', position: 1 },
            { id: 'stage-3', pipeline_id: 'dev-pipeline-id-12345', name: 'Proposal Sent', color: '#f97316', position: 2 },
            { id: 'stage-4', pipeline_id: 'dev-pipeline-id-12345', name: 'Negotiation', color: '#8b5cf6', position: 3 },
            { id: 'stage-5', pipeline_id: 'dev-pipeline-id-12345', name: 'Won', color: '#22c55e', position: 4 },
          ]
          return new Response(JSON.stringify(mockStages), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        // Return empty array for any other database query to prevent crash
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      throw error
    }
  }

  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: customFetch,
      },
    }
  )

  return browserClient
}
