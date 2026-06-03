import { useEffect, useRef, useState, useCallback } from 'react'
import { getPb } from '@/lib/pb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Clipboard, Copy, Download, Trash2, FileText,
  Image as ImageIcon, File, Upload, AlertCircle, Check
} from 'lucide-react'

interface ClipItem {
  id: string
  type: 'text' | 'file' | 'image'
  content: string
  filename: string
  collectionId: string
  file: string
  device: string
  created: string
}

interface ClipboardConfig {
  maxItems: number
}

interface Props {
  config: ClipboardConfig
  onConfigChange: (c: ClipboardConfig) => void
}

const COLLECTION = 'clipboard'

function fileUrl(item: ClipItem) {
  return getPb().files.getURL(item, item.file)
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

function ItemIcon({ type }: { type: string }) {
  if (type === 'image') return <ImageIcon className="h-3.5 w-3.5 shrink-0 text-blue-400" />
  if (type === 'file') return <File className="h-3.5 w-3.5 shrink-0 text-amber-400" />
  return <FileText className="h-3.5 w-3.5 shrink-0 text-green-400" />
}

export function ClipboardBucket({ config }: Props) {
  const [items, setItems] = useState<ClipItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    try {
      const res = await getPb().collection(COLLECTION).getList<ClipItem>(1, config.maxItems ?? 20, {
        sort: '-@created',
      })
      setItems(res.items)
      setLoading(false)
      setError(null)
    } catch (e) {
      setError(String(e))
      setLoading(false)
    }
  }, [config.maxItems])

  // Subscribe to real-time updates
  useEffect(() => {
    load()
    let unsub: (() => void) | null = null
    getPb().collection(COLLECTION).subscribe<ClipItem>('*', ({ action, record }) => {
      if (action === 'create') {
        setItems(prev => [record, ...prev].slice(0, config.maxItems ?? 20))
      } else if (action === 'delete') {
        setItems(prev => prev.filter(i => i.id !== record.id))
      } else if (action === 'update') {
        setItems(prev => prev.map(i => i.id === record.id ? record : i))
      }
    }).then(fn => { unsub = fn }).catch(() => {})

    return () => { unsub?.(); getPb().collection(COLLECTION).unsubscribe('*').catch(() => {}) }
  }, [load, config.maxItems])

  const addText = useCallback(async (text: string) => {
    if (!text.trim()) return
    try {
      await getPb().collection(COLLECTION).create({
        type: 'text',
        content: text,
        device: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
      })
    } catch (e) { setError(String(e)) }
  }, [])

  const addFile = useCallback(async (file: File) => {
    try {
      const isImage = file.type.startsWith('image/')
      const fd = new FormData()
      fd.append('type', isImage ? 'image' : 'file')
      fd.append('content', '')
      fd.append('filename', file.name)
      fd.append('file', file)
      fd.append('device', navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop')
      await getPb().collection(COLLECTION).create(fd)
    } catch (e) { setError(String(e)) }
  }, [])

  const remove = useCallback(async (id: string) => {
    try { await getPb().collection(COLLECTION).delete(id) }
    catch (e) { setError(String(e)) }
  }, [])

  const copyText = useCallback(async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }, [])

  // Paste handler
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = e.clipboardData?.files
      if (files && files.length > 0) {
        Array.from(files).forEach(addFile)
        return
      }
      const text = e.clipboardData?.getData('text')
      if (text) addText(text)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [addText, addFile])

  // Drag & drop
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) { Array.from(files).forEach(addFile); return }
    const text = e.dataTransfer.getData('text')
    if (text) addText(text)
  }

  return (
    <Card
      ref={dropRef}
      className={`h-full flex flex-col transition-colors ${dragging ? 'ring-2 ring-primary border-primary' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-1.5">
            <Clipboard className="h-3.5 w-3.5" />
            Clipboard Bucket
          </CardTitle>
          <div className="flex gap-1">
            <label title="Upload file">
              <input type="file" multiple className="sr-only" onChange={e => {
                Array.from(e.target.files ?? []).forEach(addFile)
                e.target.value = ''
              }} />
              <Button size="icon" variant="ghost" className="h-6 w-6 cursor-pointer" asChild>
                <span><Upload className="h-3 w-3" /></span>
              </Button>
            </label>
          </div>
        </div>
        {dragging && (
          <p className="text-xs text-primary text-center py-1">Drop to add</p>
        )}
        {!dragging && (
          <p className="text-xs text-muted-foreground/60">Paste (Ctrl+V) or drag files here</p>
        )}
      </CardHeader>

      <CardContent className="flex-1 min-h-0 p-0">
        {error && (
          <Alert variant="destructive" className="mx-3 mb-2">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}
        {loading ? (
          <div className="space-y-2 px-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
            Nothing yet. Paste or drop something.
          </div>
        ) : (
          <ScrollArea className="h-full px-2 pb-2">
            <div className="space-y-1.5">
              {items.map(item => (
                <div
                  key={item.id}
                  className="flex items-start gap-2 rounded-md border border-border/50 bg-muted/30 px-2 py-1.5 group hover:bg-muted/60 transition-colors"
                >
                  <ItemIcon type={item.type} />
                  <div className="flex-1 min-w-0">
                    {item.type === 'text' ? (
                      <p className="text-xs font-mono leading-snug line-clamp-2 break-all">
                        {item.content}
                      </p>
                    ) : (
                      <p className="text-xs truncate">{item.filename || item.file}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-muted-foreground/50">{relTime(item.created)}</span>
                      {item.device && (
                        <Badge variant="secondary" className="text-[9px] h-3.5 px-1 py-0">{item.device}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {item.type === 'text' ? (
                      <Button size="icon" variant="ghost" className="h-5 w-5"
                        onClick={() => copyText(item.content, item.id)}>
                        {copiedId === item.id
                          ? <Check className="h-2.5 w-2.5 text-green-400" />
                          : <Copy className="h-2.5 w-2.5" />}
                      </Button>
                    ) : (
                      <Button size="icon" variant="ghost" className="h-5 w-5" asChild>
                        <a href={fileUrl(item)} download={item.filename || item.file} target="_blank" rel="noopener noreferrer">
                          <Download className="h-2.5 w-2.5" />
                        </a>
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-5 w-5 hover:text-destructive"
                      onClick={() => remove(item.id)}>
                      <Trash2 className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
