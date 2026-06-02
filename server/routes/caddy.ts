import Elysia, { t } from 'elysia'
import { readCaddy, writeCaddy, validateCaddy } from '../lib/caddy'

export const caddyRoutes = new Elysia({ prefix: '/api/caddy' })
  .get('/', async () => ({ content: await readCaddy() }))
  .put('/', async ({ body }) => {
    const validation = await validateCaddy(body.content)
    if (!validation.valid) return { ok: false, error: validation.error }
    await writeCaddy(body.content)
    return { ok: true }
  }, { body: t.Object({ content: t.String() }) })
  .post('/validate', async ({ body }) => validateCaddy(body.content), {
    body: t.Object({ content: t.String() }),
  })
