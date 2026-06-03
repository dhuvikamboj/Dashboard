import Elysia from 'elysia'
import { cors } from '@elysiajs/cors'
import { staticPlugin } from '@elysiajs/static'
import { servicesRoutes } from './routes/services'
import { logsRoutes } from './routes/logs'
import { systemRoutes } from './routes/system'
import { caddyRoutes } from './routes/caddy'

const PB_URL = (process.env['POCKETBASE_URL'] ?? 'http://galaxy-f14-5g.lan:8080').replace(/\/$/, '')
const isProd = process.env['NODE_ENV'] === 'production'

// Verify PocketBase token — calls PB auth-refresh, caches result 60s
const tokenCache = new Map<string, { valid: boolean; exp: number }>()

async function verifyPbToken(token: string): Promise<boolean> {
  const cached = tokenCache.get(token)
  if (cached && Date.now() < cached.exp) return cached.valid

  try {
    const res = await fetch(`${PB_URL}/api/collections/users/auth-refresh`, {
      method: 'POST',
      headers: { Authorization: token },
    })
    const valid = res.ok
    tokenCache.set(token, { valid, exp: Date.now() + 60_000 })
    // Evict cache periodically
    if (tokenCache.size > 100) tokenCache.clear()
    return valid
  } catch {
    return false
  }
}

const apiGuard = new Elysia({ name: 'api-auth' })
  .onBeforeHandle(async ({ request, set }) => {
    const auth = request.headers.get('authorization')
    if (!auth?.startsWith('Bearer ')) {
      set.status = 401
      return { error: 'Unauthorized' }
    }
    const valid = await verifyPbToken(auth)
    if (!valid) {
      set.status = 401
      return { error: 'Unauthorized' }
    }
  })

const app = new Elysia()
  .use(cors({ origin: true }))
  .use(apiGuard)
  .use(servicesRoutes)
  .use(logsRoutes)
  .use(systemRoutes)
  .use(caddyRoutes)

if (isProd) {
  app
 .use(
        staticPlugin({
            assets: './dist',    // Path to your build output
            prefix: '/',         // Expose directly at the root URL
            alwaysStatic: true   // Critical: Prevents conflict with the wildcard route
        })
    )
    
    // 2. Fallback route to support client-side SPA routing (React Router, Vue Router, etc.)
    .get('/*', () => Bun.file('./dist/index.html'))
    
}

app.listen(2019)
console.log(`Launchpad running on http://localhost:2019 [${isProd ? 'production' : 'development'}]`)

export type App = typeof app
