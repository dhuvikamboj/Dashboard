import Elysia from 'elysia'

async function run(cmd: string): Promise<string> {
  const proc = Bun.spawn(['sh', '-c', cmd], { stdout: 'pipe', stderr: 'pipe' })
  const text = await new Response(proc.stdout).text()
  await proc.exited
  return text.trim()
}

async function getCPU(): Promise<number> {
  try {
    const s1 = await Bun.file('/proc/stat').text()
    await new Promise(r => setTimeout(r, 200))
    const s2 = await Bun.file('/proc/stat').text()

    const parse = (s: string) => {
      const line = s.split('\n')[0]?.replace(/^cpu\s+/, '')
      return line?.split(' ').map(Number) ?? []
    }

    const v1 = parse(s1)
    const v2 = parse(s2)
    const idle1 = (v1[3] ?? 0) + (v1[4] ?? 0)
    const idle2 = (v2[3] ?? 0) + (v2[4] ?? 0)
    const total1 = v1.reduce((a, b) => a + b, 0)
    const total2 = v2.reduce((a, b) => a + b, 0)
    const used = (total2 - total1) - (idle2 - idle1)
    return Math.round((used / (total2 - total1)) * 100)
  } catch {
    return 0
  }
}

async function getMemory(): Promise<{ used: number; total: number }> {
  try {
    const text = await Bun.file('/proc/meminfo').text()
    const get = (key: string) => {
      const m = text.match(new RegExp(`^${key}:\\s+(\\d+)`, 'm'))
      return m ? Number(m[1]) * 1024 : 0
    }
    const total = get('MemTotal')
    const available = get('MemAvailable')
    const used = total - available
    return {
      used: Math.round(used / 1024 / 1024),
      total: Math.round(total / 1024 / 1024),
    }
  } catch {
    return { used: 0, total: 0 }
  }
}

async function getDisk(): Promise<{ used: string; total: string; percent: number }> {
  try {
    const out = await run("df -h / | tail -1")
    const parts = out.split(/\s+/)
    return {
      total: parts[1] ?? '?',
      used: parts[2] ?? '?',
      percent: parseInt(parts[4] ?? '0'),
    }
  } catch {
    return { used: '?', total: '?', percent: 0 }
  }
}

async function getIP(): Promise<string> {
  try {
    const out = await run("ip route get 1.1.1.1 2>/dev/null | grep -oP 'src \\K[\\d.]+'")
    return out || '127.0.0.1'
  } catch {
    return '127.0.0.1'
  }
}

export const systemRoutes = new Elysia({ prefix: '/api' })
  .get('/system', async () => {
    const [cpu, memory, disk, ip] = await Promise.all([getCPU(), getMemory(), getDisk(), getIP()])
    return {
      cpu,
      memory,
      disk,
      uptime: Math.floor(process.uptime()),
      hostname: (await run('hostname').catch(() => 'localhost')),
      ip,
    }
  })
