import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Copy, Trash2 } from 'lucide-react'

interface LogsConfig {
  serviceName: string
  lines: number
}

interface Props {
  config: LogsConfig
  onConfigChange: (c: LogsConfig) => void
}

function stripAnsi(str: string) {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, '')
}

export function LogsViewer({ config }: Props) {
  const [lines, setLines] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    setLines([])
    setLoading(true)
    esRef.current?.close()

    const es = new EventSource(`/api/logs/${config.serviceName}/stream`)
    esRef.current = es

    es.onmessage = (e) => {
      const line = stripAnsi(JSON.parse(e.data as string) as string)
      setLines(prev => [...prev.slice(-500), line])
      setLoading(false)
    }

    es.onerror = () => {
      setLoading(false)
    }

    return () => es.close()
  }, [config.serviceName])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  const copy = () => navigator.clipboard.writeText(lines.join('\n'))
  const clear = () => setLines([])

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">{config.serviceName} logs</CardTitle>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={copy}>
            <Copy className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={clear}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0">
        {loading ? (
          <div className="p-4 space-y-1">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-3 w-full" />)}
          </div>
        ) : (
          <ScrollArea className="h-full px-3 pb-3">
            <pre className="font-mono text-xs leading-5 text-green-400 whitespace-pre-wrap break-all">
              {lines.join('\n') || 'No logs yet…'}
            </pre>
            <div ref={bottomRef} />
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
