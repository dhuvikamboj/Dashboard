import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Play, Square, RotateCw, AlertCircle } from 'lucide-react'
import { useServices } from '@/hooks/useServices'

interface ServiceCardConfig {
  serviceName: string
}

interface Props {
  config: ServiceCardConfig
  onConfigChange: (c: ServiceCardConfig) => void
}

function statusVariant(status: string): 'default' | 'destructive' | 'secondary' | 'outline' {
  if (status === 'online') return 'default'
  if (status === 'stopped') return 'destructive'
  if (status === 'errored') return 'destructive'
  return 'secondary'
}

function statusColor(status: string) {
  if (status === 'online') return 'text-green-400'
  if (status === 'stopped') return 'text-red-400'
  if (status === 'errored') return 'text-red-400'
  return 'text-yellow-400'
}

function formatUptime(ms: number) {
  const s = Math.floor((Date.now() - ms) / 1000)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

export function ServiceCard({ config }: Props) {
  const { services, loading, error, control } = useServices()
  const service = services.find(s => s.name === config.serviceName)

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!service) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm">{config.serviceName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Service not found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{service.name}</CardTitle>
          <Badge variant={statusVariant(service.status)} className={statusColor(service.status)}>
            {service.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">CPU</p>
            <p className="font-mono font-medium">{service.cpu}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">RAM</p>
            <p className="font-mono font-medium">{service.memory} MB</p>
          </div>
          <div>
            <p className="text-muted-foreground">Uptime</p>
            <p className="font-mono font-medium">{service.uptime ? formatUptime(service.uptime) : '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Restarts</p>
            <p className="font-mono font-medium">{service.restarts}</p>
          </div>
        </div>
        <Separator />
        <div className="flex gap-2 mt-auto">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => control(service.name, 'start')}>
            <Play className="h-3 w-3 mr-1" /> Start
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => control(service.name, 'stop')}>
            <Square className="h-3 w-3 mr-1" /> Stop
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => control(service.name, 'restart')}>
            <RotateCw className="h-3 w-3 mr-1" /> Restart
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
