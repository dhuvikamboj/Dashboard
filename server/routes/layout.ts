import Elysia, { t } from 'elysia'
import { readLayout, writeLayout } from '../lib/pocketbase'

export const layoutRoutes = new Elysia({ prefix: '/api' })
  .get('/layout', async () => {
    try {
      return await readLayout()
    } catch {
      return []
    }
  })
  .put('/layout', async ({ body }) => {
    try {
      await writeLayout(body)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  }, { body: t.Array(t.Any()) })
