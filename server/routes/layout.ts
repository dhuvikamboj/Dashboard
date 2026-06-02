import Elysia, { t } from 'elysia'

const LAYOUT_FILE = './layout.json'

export const layoutRoutes = new Elysia({ prefix: '/api' })
  .get('/layout', async () => {
    try {
      return JSON.parse(await Bun.file(LAYOUT_FILE).text())
    } catch {
      return []
    }
  })
  .put('/layout', async ({ body }) => {
    await Bun.write(LAYOUT_FILE, JSON.stringify(body, null, 2))
    return { ok: true }
  }, { body: t.Array(t.Any()) })
