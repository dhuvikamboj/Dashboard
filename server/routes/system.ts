import Elysia from 'elysia'

async function run(cmd: string): Promise<string> {
  const proc = Bun.spawn(['sh', '-c', cmd], { stdout: 'pipe', stderr: 'pipe' })
  const text = await new Response(proc.stdout).text()
  await proc.exited
  return text.trim()
}

function parseCpuLines(stat: string): Record<string, number[]> {
  const result: Record<string, number[]> = {}
  for (const line of stat.split('\n')) {
    const m = line.match(/^(cpu\d*)\s+(.+)/)
    if (m) {
      result[m[1]!] = m[2]!.trim().split(/\s+/).map(Number).filter(n => !isNaN(n))
    }
  }
  return result
}

function calcPercent(v1: number[], v2: number[]): number {
  const idle1 = (v1[3] ?? 0) + (v1[4] ?? 0)
  const idle2 = (v2[3] ?? 0) + (v2[4] ?? 0)
  const total1 = v1.reduce((a, b) => a + b, 0)
  const total2 = v2.reduce((a, b) => a + b, 0)
  const diff = total2 - total1
  if (diff === 0) return 0
  return Math.max(0, Math.min(100, Math.round(((diff - (idle2 - idle1)) / diff) * 100)))
}

async function getCPU(): Promise<{ total: number; cores: number[] }> {
  try {
    const s1 = await Bun.file('/proc/stat').text()
    await new Promise(r => setTimeout(r, 500))
    const s2 = await Bun.file('/proc/stat').text()
    const m1 = parseCpuLines(s1)
    const m2 = parseCpuLines(s2)
    const total = calcPercent(m1['cpu'] ?? [], m2['cpu'] ?? [])
    const cores = Object.keys(m2)
      .filter(k => /^cpu\d+$/.test(k))
      .sort((a, b) => parseInt(a.slice(3)) - parseInt(b.slice(3)))
      .map(k => calcPercent(m1[k] ?? [], m2[k] ?? []))
    return { total, cores }
  } catch {
    return { total: 0, cores: [] }
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
    // Standard df -h — works on busybox/Termux and Linux
    // Output: Filesystem Size Used Avail Use% Mounted
    const out = await run("df -h 2>/dev/null | tail -n +2")
    return out.split('\n')
      .filter(Boolean)
      .map(line => {
        const p = line.trim().split(/\s+/)
        // Handle wrapped lines (filesystem name on its own line)
        if (p.length < 5) return null
        const device = p[0] ?? ''
        const total = p[1] ?? '?'
        const used = p[2] ?? '?'
        const pctStr = p.find(x => x.endsWith('%')) ?? '0%'
        const mount = p[p.length - 1] ?? ''
        const percent = parseInt(pctStr)
        return { device, mount, total, used, percent }
      })
      .filter((d): d is DiskEntry =>
        d !== null &&
        !!d.mount &&
        !!d.device &&
        !['tmpfs', 'devtmpfs', 'udev', 'overlay', 'shm', 'none', 'cgroupfs'].includes(d.device) &&
        !d.device.startsWith('cgroup')
      )
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
    // Try ps with cpu sort — works on most Linux including Android/Termux
    const out = await run(
      "ps -A -o pid,pcpu,pmem,comm --no-headers 2>/dev/null || ps -A 2>/dev/null | tail -n +2"
    )
    const results = out.split('\n')
      .filter(Boolean)
      .map(line => {
        const p = line.trim().split(/\s+/)
        // Format: pid cpu% mem% name  (with --no-headers)
        // or: pid tty time cmd  (fallback)
        if (p.length >= 4 && !isNaN(parseFloat(p[1] ?? ''))) {
          return {
            pid: parseInt(p[0] ?? '0'),
            cpu: parseFloat(p[1] ?? '0'),
            mem: parseFloat(p[2] ?? '0'),
            name: (p[3] ?? 'unknown').split('/').pop()?.slice(0, 30) ?? 'unknown',
          }
        }
        return null
      })
      .filter((p): p is ProcessEntry => p !== null && p.pid > 0)
      .sort((a, b) => b.cpu - a.cpu)
      .slice(0, 10)
    return results
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
    let uptime = Math.floor(process.uptime())
    try {
      const u = await Bun.file('/proc/uptime').text()
      uptime = Math.floor(parseFloat(u.split(' ')[0] ?? '0'))
    } catch { /* fallback to process uptime */ }
    return { cpu: cpu.total, cores: cpu.cores, memory, disks, processes, uptime, hostname, ip }
  })
