import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'

interface NotesConfig {
  title: string
  content: string
}

interface Props {
  config: NotesConfig
  onConfigChange: (c: NotesConfig) => void
}

export function Notes({ config, onConfigChange }: Props) {
  const [title, setTitle] = useState(config.title)
  const [content, setContent] = useState(config.content)

  useEffect(() => { setTitle(config.title); setContent(config.content) }, [config.title, config.content])

  const save = () => onConfigChange({ title, content })

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 pt-3 px-3">
        <Input
          className="border-0 p-0 text-sm font-medium bg-transparent focus-visible:ring-0 h-auto"
          value={title}
          placeholder="Note title…"
          onChange={e => setTitle(e.target.value)}
          onBlur={save}
        />
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 p-3 pt-0">
        <Textarea
          className="flex-1 resize-none text-xs font-mono border-0 focus-visible:ring-0 bg-transparent p-0 min-h-0"
          value={content}
          placeholder="Start writing…"
          onChange={e => setContent(e.target.value)}
          onBlur={save}
        />
        <p className="text-xs text-muted-foreground/50 text-right mt-1">{content.length} chars</p>
      </CardContent>
    </Card>
  )
}
