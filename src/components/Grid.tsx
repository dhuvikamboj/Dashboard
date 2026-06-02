import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Settings, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useDashboard } from '@/store/dashboard'
import { widgetRegistry } from './widgets/registry'
import type { LayoutItem } from '@/store/dashboard'

// Map w (1-12) → col-span classes
const COL_SPAN: Record<number, string> = {
  1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-3', 4: 'col-span-4',
  5: 'col-span-5', 6: 'col-span-6', 7: 'col-span-7', 8: 'col-span-8',
  9: 'col-span-9', 10: 'col-span-10', 11: 'col-span-11', 12: 'col-span-12',
}

// Map h → min-height
const ROW_HEIGHT: Record<number, string> = {
  1: 'min-h-[80px]',  2: 'min-h-[160px]', 3: 'min-h-[240px]',
  4: 'min-h-[320px]', 5: 'min-h-[400px]', 6: 'min-h-[480px]',
}

function WidgetConfig({ item, onClose }: { item: LayoutItem; onClose: () => void }) {
  const { updateWidgetConfig } = useDashboard()
  const [local, setLocal] = useState(item.config)

  const set = (key: string, value: unknown) => setLocal(prev => ({ ...prev, [key]: value }))
  const save = () => { updateWidgetConfig(item.id, local); onClose() }

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{widgetRegistry[item.type]?.label ?? item.type} Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {Object.entries(local).map(([key, val]) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
              {typeof val === 'boolean' ? (
                <Switch checked={val} onCheckedChange={v => set(key, v)} />
              ) : (
                <Input value={String(val ?? '')} onChange={e => set(key, e.target.value)} className="h-8 text-sm" />
              )}
            </div>
          ))}
        </div>
        <Button onClick={save} size="sm">Save</Button>
      </DialogContent>
    </Dialog>
  )
}

function WidgetCell({ item }: { item: LayoutItem }) {
  const { editMode, removeWidget, updateWidgetConfig } = useDashboard()
  const [configOpen, setConfigOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const entry = widgetRegistry[item.type]
  if (!entry) return <div className="p-4 text-sm text-muted-foreground">Unknown: {item.type}</div>

  const Component = entry.component
  const colClass = COL_SPAN[item.w] ?? 'col-span-3'
  const heightClass = ROW_HEIGHT[item.h] ?? 'min-h-[240px]'

  return (
    <div className={`${colClass} ${heightClass} relative group`}>
      {editMode && (
        <div className="absolute top-1 right-1 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-6 w-6 bg-background/80 backdrop-blur"
            onClick={() => setConfigOpen(true)}>
            <Settings className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 bg-background/80 backdrop-blur hover:text-destructive"
            onClick={() => setDeleteOpen(true)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="h-full">
        <Component config={item.config} onConfigChange={c => updateWidgetConfig(item.id, c)} />
      </div>

      {configOpen && createPortal(
        <WidgetConfig item={item} onClose={() => setConfigOpen(false)} />,
        document.body
      )}

      {deleteOpen && createPortal(
        <Dialog open onOpenChange={v => !v && setDeleteOpen(false)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Remove widget?</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Remove {entry.label}?</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={() => removeWidget(item.id)}>Remove</Button>
            </div>
          </DialogContent>
        </Dialog>,
        document.body
      )}
    </div>
  )
}

export function Grid() {
  const { layout } = useDashboard()

  if (layout.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        No widgets yet. Click the grid icon to add some.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-12 gap-4 auto-rows-auto">
      {layout.map(item => (
        <WidgetCell key={item.id} item={item} />
      ))}
    </div>
  )
}
