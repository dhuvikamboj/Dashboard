import Elysia, { t } from 'elysia'
import { getLogs } from '../lib/pm2'

export const logsRoutes = new Elysia({ prefix: '/api/logs' })
  .get('/:name', async ({ params, query }) => {
    const lines = Number(query.lines ?? 100)
    const content = await getLogs(params.name, lines)
    return { content }
  }, {
    query: t.Object({ lines: t.Optional(t.String()) }),
  })
  .get('/:name/stream', ({ params, set }) => {
    set.headers['Content-Type'] = 'text/event-stream'
    set.headers['Cache-Control'] = 'no-cache'
    set.headers['Connection'] = 'keep-alive'

    let lastLines = 0

    async function* generate() {
      while (true) {
        try {
          const content = await getLogs(params.name, 200)
          const lines = content.split('\n').filter(Boolean)
          if (lines.length > lastLines) {
            const newLines = lines.slice(lastLines)
            lastLines = lines.length
            for (const line of newLines) {
              yield `data: ${JSON.stringify(line)}\n\n`
            }
          } else if (lastLines === 0 && lines.length > 0) {
            lastLines = lines.length
            const tail = lines.slice(-20)
            for (const line of tail) {
              yield `data: ${JSON.stringify(line)}\n\n`
            }
          }
        } catch {
          yield `data: ${JSON.stringify('[error reading logs]')}\n\n`
        }
        await new Promise(r => setTimeout(r, 2000))
      }
    }

    return new Response(
      new ReadableStream({
        async start(controller) {
          for await (const chunk of generate()) {
            controller.enqueue(new TextEncoder().encode(chunk))
          }
        },
      }),
      { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } }
    )
  })
