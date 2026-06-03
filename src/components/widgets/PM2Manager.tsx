import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import {
  Play, Square, RotateCw, Trash2, Plus,
  ScrollText, ChevronDown, ChevronUp, Server
} from 'lucide-react'
import { api } from '@/api/client'

interface Service {
  name: string
  status: string
  cpu: number
  memory: number
  pid: number | null
  uptime: number
  restarts: number
}

interface Props {
  config: Record<string, unknown>
  onConfigChange: (c: Record<string, unknown>) => void
}

function statusVariant(s: string): 'default' | 'destructive' | 'secondary' {
  if (s === 'online') return 'default'
  if (s === 'stopped' || s === 'errored') return 'destructive'
  return 'secondary'
}

function statusColor(s: string) {
  if (s === 'online') return 'bg-green-500/20 text-green-400 border-green-500/30'
  if (s === 'stopped') return 'bg-red-500/20 text-red-400 border-red-500/30'
  if (s === 'errored') return 'bg-red-500/20 text-red-400 border-red-500/30'
  return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
}

function formatUptime(ms: number) {
  const s = Math.floor((Date.now() - ms) / 1000)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

function stripAnsi(s: string) {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, '')
}

function LogsPanel({ name }: { name: string }) {
  const [lines, setLines] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    setLines([])
    esRef.current?.close()
    const es = new EventSource(`/api/logs/${name}/stream`)
    esRef.current = es
    es.onmessage = (e) => {
      const line = stripAnsi(JSON.parse(e.data as string) as string)
      setLines(prev => [...prev.slice(-300), line])
    }
    return () => es.close()
  }, [name])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  return (
    <ScrollArea className="h-full">
      <pre className="font-mono text-[10px] leading-4 text-green-400 whitespace-pre-wrap break-all px-2 py-1">
        {lines.length === 0 ? 'Waiting for logs…' : lines.join('\n')}
      </pre>
      <div ref={bottomRef} />
    </ScrollArea>
  )
}

function AddServiceDialog({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState('')
  const [command, setCommand] = useState('')
  const [cwd, setCwd] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !command) { setError('Name and command required'); return }
    setBusy(true)
    const { error: err } = await api.api.services.post({ name, command, cwd: cwd || undefined })
    setBusy(false)
    if (err) { setError(String(err)); return }
    onAdded()
    onClose()
  }

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Service</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="my-app" className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Command</Label>
            <Input value={command} onChange={e => setCommand(e.target.value)} placeholder="bun run start" className="h-8 text-sm font-mono" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Working Directory (optional)</Label>
            <Input value={cwd} onChange={e => setCwd(e.target.value)} placeholder="/home/user/app" className="h-8 text-sm font-mono" />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? 'Adding…' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function PM2Manager(_: Props) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    const { data } = await api.api.services.get()
    if (data) { setServices(data as Service[]); setLoading(false) }
  }, [])

  useEffect(() => {
    fetch()
    const id = setInterval(fetch, 5000)
    return () => clearInterval(id)
  }, [fetch])

  const control = async (name: string, action: 'start' | 'stop' | 'restart' | 'delete') => {
    setBusy(`${name}:${action}`)
    if (action === 'start') await api.api.services[':name'].start.post(undefined, { params: { name } })
    else if (action === 'stop') await api.api.services[':name'].stop.post(undefined, { params: { name } })
    else if (action === 'restart') await api.api.services[':name'].restart.post(undefined, { params: { name } })
    else if (action === 'delete') await api.api.services[':name'].delete({ params: { name } })
    setBusy(null)
    fetch()
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
        <CardContent className="space-y-2">
          {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-1.5">
            <Server className="h-3.5 w-3.5" />
            PM2 Services
            <span className="text-muted-foreground font-normal">({services.length})</span>
          </CardTitle>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 p-0 gap-0">
        {/* Service list */}
        <ScrollArea className={selectedLog ? 'h-[45%]' : 'flex-1'}>
          {services.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No services. Add one with +</p>
          ) : (
            <div className="divide-y divide-border/50">
              {services.map(svc => {
                const isSelected = selectedLog === svc.name
                const isBusy = busy?.startsWith(svc.name)
                return (
                  <div key={svc.name} className="px-3 py-2 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2">
                      {/* Name + status */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-medium truncate">{svc.name}</span>
                          <Badge className={`text-[9px] h-4 px-1 border ${statusColor(svc.status)}`}>
                            {svc.status}
                          </Badge>
                        </div>
                        <div className="flex gap-2 mt-0.5 text-[10px] text-muted-foreground font-mono">
                          <span>{svc.cpu}% CPU</span>
                          <span>{svc.memory}MB</span>
                          {svc.uptime > 0 && <span>{formatUptime(svc.uptime)}</span>}
                          {svc.restarts > 0 && <span>{svc.restarts}↺</span>}
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex gap-0.5 shrink-0">
                        <Button size="icon" variant="ghost" className="h-6 w-6" disabled={!!isBusy}
                          title="Start" onClick={() => control(svc.name, 'start')}>
                          <Play className="h-2.5 w-2.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" disabled={!!isBusy}
                          title="Stop" onClick={() => control(svc.name, 'stop')}>
                          <Square className="h-2.5 w-2.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" disabled={!!isBusy}
                          title="Restart" onClick={() => control(svc.name, 'restart')}>
                          <RotateCw className="h-2.5 w-2.5" />
                        </Button>
                        <Button size="icon" variant="ghost"
                          className={`h-6 w-6 ${isSelected ? 'text-primary' : ''}`}
                          title="Logs" onClick={() => setSelectedLog(isSelected ? null : svc.name)}>
                          {isSelected ? <ChevronUp className="h-2.5 w-2.5" /> : <ScrollText className="h-2.5 w-2.5" />}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 hover:text-destructive"
                          disabled={!!isBusy} title="Delete" onClick={() => control(svc.name, 'delete')}>
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Logs panel */}
        {selectedLog && (
          <>
            <Separator />
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex items-center justify-between px-3 py-1 bg-muted/20">
                <span className="text-[10px] text-muted-foreground font-mono">{selectedLog} logs</span>
                <Button size="icon" variant="ghost" className="h-5 w-5"
                  onClick={() => setSelectedLog(null)}>
                  <ChevronDown className="h-2.5 w-2.5" />
                </Button>
              </div>
              <div className="flex-1 min-h-0 bg-black/20">
                <LogsPanel name={selectedLog} />
              </div>
            </div>
          </>
        )}
      </CardContent>

      {addOpen && <AddServiceDialog onClose={() => setAddOpen(false)} onAdded={fetch} />}
    </Card>
  )
}
