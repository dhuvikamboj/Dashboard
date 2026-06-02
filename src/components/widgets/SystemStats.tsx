import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { AlertCircle } from 'lucide-react'
import { useSystem } from '@/hooks/useSystem'

interface CircleRingProps {
  value: number
  label: string
  color: string
}

function CircleRing({ value, label, color }: CircleRingProps) {
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = circ * (1 - value / 100)

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" strokeWidth="6" className="stroke-muted" />
          <circle
            cx="36" cy="36" r={r} fill="none" strokeWidth="6"
            stroke={color}
            strokeDasharray={circ}
            strokeDashoffset={dash}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{value}%</span>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
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

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader><Skeleton className="h-5 w-24" /></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-around"><Skeleton className="h-16 w-16 rounded-full" /><Skeleton className="h-16 w-16 rounded-full" /></div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    )
  }

  if (error || !stats) {
    return (
      <Card className="h-full">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error ?? 'Failed to load'}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const memPercent = stats.memory.total > 0 ? Math.round((stats.memory.used / stats.memory.total) * 100) : 0

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{stats.hostname}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="flex justify-around">
          <CircleRing value={stats.cpu} label="CPU" color="#7c6af7" />
          <CircleRing value={memPercent} label="RAM" color="#06b6d4" />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Disk</span>
            <span>{stats.disk.used} / {stats.disk.total}</span>
          </div>
          <Progress value={stats.disk.percent} className="h-1.5" />
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs mt-auto">
          <div>
            <p className="text-muted-foreground">Uptime</p>
            <p className="font-mono">{formatUptime(stats.uptime)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">IP</p>
            <p className="font-mono">{stats.ip}</p>
          </div>
          <div>
            <p className="text-muted-foreground">RAM</p>
            <p className="font-mono">{stats.memory.used} / {stats.memory.total} MB</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
