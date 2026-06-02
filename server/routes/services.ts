import Elysia, { t } from 'elysia'
import { getServices, startService, stopService, restartService, deleteService, addService } from '../lib/pm2'

export const servicesRoutes = new Elysia({ prefix: '/api/services' })
  .get('/', () => getServices())
  .post('/', ({ body }) => addService(body), {
    body: t.Object({
      name: t.String(),
      command: t.String(),
      cwd: t.Optional(t.String()),
      env: t.Optional(t.Record(t.String(), t.String())),
    }),
  })
  .post('/:name/start', ({ params }) => startService(params.name))
  .post('/:name/stop', ({ params }) => stopService(params.name))
  .post('/:name/restart', ({ params }) => restartService(params.name))
  .delete('/:name', ({ params }) => deleteService(params.name))
