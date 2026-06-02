export interface PM2Service {
  name: string
  status: 'online' | 'stopped' | 'errored' | 'launching' | string
  cpu: number
  memory: number
  pid: number | null
  uptime: number
  restarts: number
}

async function run(cmd: string): Promise<string> {
  const proc = Bun.spawn(['sh', '-c', cmd], { stdout: 'pipe', stderr: 'pipe' })
  const text = await new Response(proc.stdout).text()
  await proc.exited
  return text.trim()
}

export async function getServices(): Promise<PM2Service[]> {
  try {
    const raw = await run('pm2 jlist')
    const list = JSON.parse(raw) as Array<Record<string, unknown>>
    return list.map((p) => ({
      name: String(p['name'] ?? ''),
      status: String((p['pm2_env'] as Record<string, unknown>)?.['status'] ?? 'stopped'),
      cpu: Number((p['monit'] as Record<string, unknown>)?.['cpu'] ?? 0),
      memory: Math.round(Number((p['monit'] as Record<string, unknown>)?.['memory'] ?? 0) / 1024 / 1024),
      pid: Number((p['pid'] ?? null)) || null,
      uptime: Number((p['pm2_env'] as Record<string, unknown>)?.['pm_uptime'] ?? 0),
      restarts: Number((p['pm2_env'] as Record<string, unknown>)?.['restart_time'] ?? 0),
    }))
  } catch {
    return []
  }
}

export async function startService(name: string): Promise<void> {
  await run(`pm2 start ${name}`)
}

export async function stopService(name: string): Promise<void> {
  await run(`pm2 stop ${name}`)
}

export async function restartService(name: string): Promise<void> {
  await run(`pm2 restart ${name}`)
}

export async function deleteService(name: string): Promise<void> {
  await run(`pm2 delete ${name}`)
}

export async function addService(opts: { name: string; command: string; cwd?: string; env?: Record<string, string> }): Promise<void> {
  let cmd = `pm2 start "${opts.command}" --name "${opts.name}"`
  if (opts.cwd) cmd += ` --cwd "${opts.cwd}"`
  await run(cmd)
}

export async function getLogs(name: string, lines = 100): Promise<string> {
  return run(`pm2 logs ${name} --lines ${lines} --nostream --raw 2>&1`)
}
