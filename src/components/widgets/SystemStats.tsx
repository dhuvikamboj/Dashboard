import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertCircle, HardDrive, Cpu, MemoryStick, Activity } from 'lucide-react'
import { useSystem } from '@/hooks/useSystem'

type Tab = 'overview' | 'disks' | 'processes'

interface CircleRingProps {
  value: number
  label: string
  color: string
  sub?: string
}

function CircleRing({ value, label, color, sub }: CircleRingProps) {
  const r = 26
  const circ = 2 * Math.PI * r
  const dash = circ * (1 - Math.min(value, 100) / 100)
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative w-14 h-14">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" strokeWidth="5" className="stroke-muted" />
          <circle cx="32" cy="32" r={r} fill="none" strokeWidth="5"
            stroke={color} strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold">{value}%</span>
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
      {sub && <span className="text-[9px] text-muted-foreground/60">{sub}</span>}
    </div>
  )
}

function formatUptime(s: number) {
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

interface Props {
  config: Record<string, unknown>
  onConfigChange: (c: Record<string, unknown>) => void
}

export function SystemStats(_: Props) {
  const { stats, loading, error } = useSystem()
  const [tab, setTab] = useState<Tab>('overview')

  if (loading) return (
    <Card className="h-full">
      <CardHeader><Skeleton className="h-5 w-24" /></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-around"><Skeleton className="h-14 w-14 rounded-full" /><Skeleton className="h-14 w-14 rounded-full" /></div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </CardContent>
    </Card>
  )

  if (error || !stats) return (
    <Card className="h-full">
      <CardContent className="pt-6">
        <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription className="text-xs">{error ?? 'Failed'}</AlertDescription></Alert>
      </CardContent>
    </Card>
  )

  const memPercent = stats.memory.total > 0 ? Math.round((stats.memory.used / stats.memory.total) * 100) : 0

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-1 pt-3 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{stats.hostname}</CardTitle>
          <span className="text-[10px] text-muted-foreground">{stats.ip} · up {formatUptime(stats.uptime)}</span>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 mt-1.5">
          {([
            { id: 'overview', icon: Cpu, label: 'Overview' },
            { id: 'disks', icon: HardDrive, label: 'Disks' },
            { id: 'processes', icon: Activity, label: 'Processes' },
          ] as { id: Tab; icon: typeof Cpu; label: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-colors ${
                tab === t.id ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <t.icon className="h-2.5 w-2.5" />
              {t.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 px-3 pb-3">
        {tab === 'overview' && (
          <div className="flex flex-col gap-3 h-full">
            <div className="flex justify-around pt-1">
              <CircleRing value={stats.cpu} label="CPU" color="#7c6af7" />
              <CircleRing value={memPercent} label="RAM" color="#06b6d4"
                sub={`${stats.memory.used}/${stats.memory.total}MB`} />
            </div>

            {/* Per-core bars */}
            {stats.cores.length > 0 && (
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {stats.cores.map((pct, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="text-[9px] text-muted-foreground w-7 shrink-0">C{i}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#7c6af7',
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground w-6 text-right shrink-0">{pct}%</span>
                  </div>
                ))}
              </div>
            )}

            {stats.disks.slice(0, 1).map(d => (
              <div key={d.mount} className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{d.mount}</span>
                  <span>{d.used}/{d.total}</span>
                </div>
                <Progress value={d.percent} className="h-1.5" />
              </div>
            ))}
          </div>
        )}

        {tab === 'disks' && (
          <ScrollArea className="h-full">
            <div className="space-y-2 pt-1">
              {stats.disks.length === 0
                ? <p className="text-xs text-muted-foreground text-center py-4">No disks found</p>
                : stats.disks.map(d => (
                  <div key={d.mount} className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="font-mono text-muted-foreground truncate max-w-[60%]">{d.mount}</span>
                      <span className="text-muted-foreground">{d.used} / {d.total} · {d.percent}%</span>
                    </div>
                    <Progress value={d.percent} className="h-1" />
                    <p className="text-[9px] text-muted-foreground/50 font-mono">{d.device}</p>
                  </div>
                ))
              }
            </div>
          </ScrollArea>
        )}

        {tab === 'processes' && (
          <ScrollArea className="h-full">
            <div className="pt-1">
              <div className="grid grid-cols-[1fr_auto_auto] gap-x-2 text-[9px] text-muted-foreground/60 px-1 mb-1">
                <span>Name</span><span>CPU%</span><span>MEM%</span>
              </div>
              {stats.processes.length === 0
                ? <p className="text-xs text-muted-foreground text-center py-4">No processes</p>
                : stats.processes.map(p => (
                  <div key={p.pid}
                    className="grid grid-cols-[1fr_auto_auto] gap-x-2 items-center py-0.5 px-1 hover:bg-muted/30 rounded text-[10px]">
                    <span className="font-mono truncate">{p.name}</span>
                    <span className={`text-right font-mono ${p.cpu > 50 ? 'text-red-400' : p.cpu > 20 ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                      {p.cpu.toFixed(1)}
                    </span>
                    <span className="text-right font-mono text-muted-foreground">{p.mem.toFixed(1)}</span>
                  </div>
                ))
              }
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
