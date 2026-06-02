import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { widgetRegistry } from './widgets/registry'
import { useDashboard } from '@/store/dashboard'

interface Props {
  open: boolean
  onClose: () => void
}

export function WidgetPicker({ open, onClose }: Props) {
  const { addWidget } = useDashboard()

  const add = (type: string) => {
    const entry = widgetRegistry[type]
    if (!entry) return
    addWidget(type, entry.defaultConfig, entry.defaultSize)
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>Add Widget</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-full mt-4 pr-2">
          <div className="grid grid-cols-1 gap-2 pb-8">
            {Object.entries(widgetRegistry).map(([type, entry]) => {
              const Icon = entry.icon
              return (
                <Card
                  key={type}
                  className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                  onClick={() => add(type)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{entry.label}</p>
                      <p className="text-xs text-muted-foreground">{entry.defaultSize.w}×{entry.defaultSize.h}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
