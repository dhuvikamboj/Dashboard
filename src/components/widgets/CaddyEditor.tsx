import { useEffect, useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { api } from '@/api/client'

interface Props {
  config: Record<string, unknown>
  onConfigChange: (c: Record<string, unknown>) => void
}

export function CaddyEditor(_: Props) {
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState('')
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<{ type: 'error' | 'success'; msg: string } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.api.caddy.get().then(({ data }) => {
      if (data) { setContent(data.content); setSaved(data.content) }
      setLoading(false)
    })
  }, [])

  const validate = async () => {
    setBusy(true)
    const { data } = await api.api.caddy.validate.post({ content })
    setBusy(false)
    if (!data) return
    if ((data as { valid: boolean }).valid) setStatus({ type: 'success', msg: 'Caddyfile is valid' })
    else setStatus({ type: 'error', msg: (data as { error?: string }).error ?? 'Invalid' })
  }

  const save = async () => {
    setBusy(true)
    const { data } = await api.api.caddy.put({ content })
    setBusy(false)
    if (!data) return
    const r = data as { ok: boolean; error?: string }
    if (r.ok) { setSaved(content); setStatus({ type: 'success', msg: 'Saved & reloaded' }) }
    else setStatus({ type: 'error', msg: r.error ?? 'Save failed' })
  }

  const dirty = content !== saved

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Caddyfile</CardTitle>
          {dirty && <span className="text-xs text-yellow-400">Unsaved changes</span>}
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-3">
        {loading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <Textarea
            className="h-full font-mono text-xs resize-none"
            value={content}
            onChange={e => { setContent(e.target.value); setStatus(null) }}
            spellCheck={false}
          />
        )}
      </CardContent>
      {status && (
        <div className="px-3">
          <Alert variant={status.type === 'error' ? 'destructive' : 'default'}>
            {status.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            <AlertDescription className="text-xs">{status.msg}</AlertDescription>
          </Alert>
        </div>
      )}
      <CardFooter className="pt-3 gap-2">
        <Button size="sm" variant="outline" onClick={validate} disabled={busy}>Validate</Button>
        <Button size="sm" onClick={save} disabled={busy || !dirty}>Save & Reload</Button>
      </CardFooter>
    </Card>
  )
}
