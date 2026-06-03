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
    return {
      used: Math.round((total - available) / 1024 / 1024),
      total: Math.round(total / 1024 / 1024),
    }
  } catch {
    return { used: 0, total: 0 }
  }
}

interface DiskEntry {
  mount: string
  device: string
  used: string
  total: string
  percent: number
}

async function getDisks(): Promise<DiskEntry[]> {
  try {
    // Skip pseudo/overlay filesystems
    const out = await run(
      "df -h --output=source,target,size,used,pcent 2>/dev/null | tail -n +2 | grep -v -E '^(tmpfs|devtmpfs|udev|overlay|shm|cgroupfs|none)'"
    )
    return out.split('\n')
      .filter(Boolean)
      .map(line => {
        const p = line.trim().split(/\s+/)
        return {
          device: p[0] ?? '',
          mount: p[1] ?? '',
          total: p[2] ?? '?',
          used: p[3] ?? '?',
          percent: parseInt(p[4] ?? '0'),
        }
      })
      .filter(d => d.mount && d.device)
  } catch {
    return []
  }
}

interface ProcessEntry {
  pid: number
  name: string
  cpu: number
  mem: number
}

async function getProcesses(): Promise<ProcessEntry[]> {
  try {
    const out = await run(
      "ps aux --no-headers 2>/dev/null | sort -k3 -rn | head -15"
    )
    return out.split('\n')
      .filter(Boolean)
      .map(line => {
        const p = line.trim().split(/\s+/)
        const cmd = p.slice(10).join(' ')
        const name = cmd.split('/').pop()?.split(' ')[0] ?? cmd.slice(0, 20)
        return {
          pid: parseInt(p[1] ?? '0'),
          cpu: parseFloat(p[2] ?? '0'),
          mem: parseFloat(p[3] ?? '0'),
          name: name.slice(0, 30),
        }
      })
      .filter(p => p.pid > 0 && p.cpu > 0)
      .slice(0, 10)
  } catch {
    return []
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
    const [cpu, memory, disks, processes, ip, hostname] = await Promise.all([
      getCPU(),
      getMemory(),
      getDisks(),
      getProcesses(),
      getIP(),
      run('hostname').catch(() => 'localhost'),
    ])
    return { cpu, memory, disks, processes, uptime: Math.floor(process.uptime()), hostname, ip }
  })
