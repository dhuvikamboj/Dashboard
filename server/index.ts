import Elysia from 'elysia'
import { cors } from '@elysiajs/cors'
import { staticPlugin } from '@elysiajs/static'
import { servicesRoutes } from './routes/services'
import { logsRoutes } from './routes/logs'
import { systemRoutes } from './routes/system'
import { caddyRoutes } from './routes/caddy'
import { layoutRoutes } from './routes/layout'

const DASHBOARD_TOKEN = process.env['DASHBOARD_TOKEN']

const app = new Elysia()
  .use(cors({ origin: true }))
  .use(
    new Elysia({ name: 'auth' }).derive(({ request, set }) => {
      if (!DASHBOARD_TOKEN) return {}
      const url = new URL(request.url)
      if (!url.pathname.startsWith('/api')) return {}
      const auth = request.headers.get('authorization')
      if (auth !== `Bearer ${DASHBOARD_TOKEN}`) {
        set.status = 401
        throw new Error('Unauthorized')
      }
      return {}
    })
  )
  .use(servicesRoutes)
  .use(logsRoutes)
  .use(systemRoutes)
  .use(caddyRoutes)
  .use(layoutRoutes)

if (process.env['NODE_ENV'] === 'production') {
  app.use(staticPlugin({ assets: 'dist', prefix: '/' }))
}

app.listen(2019)
console.log('Launchpad running on http://localhost:2019')

export type App = typeof app
